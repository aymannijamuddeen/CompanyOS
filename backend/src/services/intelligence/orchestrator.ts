import { prisma } from '../prisma.js'
import { getCompanyContext } from '../companyContext.js'
import { searchCompanyKnowledge } from '../knowledge/retrieval.js'
import { generateWithProvider } from './provider.js'
import { IntelligenceDecision, Intent } from './types.js'
import { synthesizeAgentResponse } from './agentSynthesizer.js'
import { initializeCompanyDefaults } from '../companyDefaults.js'

const ROUTES: Array<[Intent, string[]]> = [
  ['sales', ['sales', 'lead', 'pipeline', 'prospect', 'customer', 'deal', 'conversion', 'revenue']],
  ['marketing', ['marketing', 'campaign', 'brand', 'seo', 'content', 'advertising', 'ad', 'demand']],
  ['finance', ['finance', 'financial', 'budget', 'expense', 'profit', 'cash', 'invoice', 'cost', 'margin']],
  ['hr', ['hr', 'employee', 'employees', 'hiring', 'recruit', 'leave', 'people', 'workforce', 'salary']],
  ['operations', ['operations', 'process', 'resource', 'workflow', 'delivery', 'inventory', 'bottleneck', 'task']],
  ['tasks', ['task', 'todo', 'deadline', 'due', 'assigned', 'work']],
  ['knowledge', ['policy', 'document', 'docs', 'knowledge', 'manual', 'procedure', 'what does the document']],
  ['company', ['company', 'business', 'organization', 'department', 'team', 'overall', 'overview']],
]

function decideIntent(question: string): IntelligenceDecision {
  const text = question.toLowerCase()
  let best: { intent: Intent; score: number } = { intent: 'general', score: 0 }

  for (const [intent, keywords] of ROUTES) {
    const score = keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0)
    if (score > best.score) best = { intent, score }
  }

  if (best.intent === 'general') {
    return { intent: 'general', action: 'retrieve', confidence: 0.35, reason: 'No specialist domain matched; use company knowledge and context.' }
  }
  if (best.intent === 'knowledge') {
    return { intent: best.intent, action: 'retrieve', confidence: Math.min(0.95, 0.55 + best.score * 0.08), reason: 'The question asks about company knowledge or documentation.' }
  }
  if (best.intent === 'tasks' || best.intent === 'company') {
    return { intent: best.intent, action: 'answer', confidence: Math.min(0.95, 0.6 + best.score * 0.08), reason: 'Question can be answered from structured company context.' }
  }
  return {
    intent: best.intent,
    action: 'delegate',
    agentSlug: best.intent,
    confidence: Math.min(0.95, 0.55 + best.score * 0.08),
    reason: `Question matches the ${best.intent} business domain.`,
  }
}

function contextText(context: any) {
  return JSON.stringify({
    company: context.company,
    departments: context.departments,
    agents: context.agents,
    openTasks: context.tasks.filter((task: any) => task.status !== 'done'),
    recentTasks: context.tasks,
    documents: context.documents,
    customerCount: context.customers,
  }, null, 2)
}


async function createExecution(agentId: string, userId: string, question: string, decision: IntelligenceDecision) {
  return prisma.agentExecution.create({
    data: {
      agentId,
      userId,
      status: 'running',
      startedAt: new Date(),
      input: { question, decision },
    },
  })
}

export async function answerCompanyQuestion(input: { companyId: string; userId: string; question: string; conversationId?: string }) {
  let context = await getCompanyContext(input.companyId)
  if (!context.company) throw new Error('Company not found')

  const decision = decideIntent(input.question)
  const hits = await searchCompanyKnowledge(input.companyId, input.question)

  let ceo = await prisma.agent.findFirst({
    where: { companyId: input.companyId, slug: 'ceo', status: 'active' },
  })
  if (!ceo) {
    await initializeCompanyDefaults(prisma, input.companyId, input.userId)
    context = await getCompanyContext(input.companyId)
    ceo = await prisma.agent.findFirst({
      where: { companyId: input.companyId, slug: 'ceo', status: 'active' },
    })
  }
  if (!context.company) throw new Error('Company not found')
  if (!ceo) throw new Error('No active CEO agent is configured for this company')

  const specialist = decision.agentSlug
    ? await prisma.agent.findFirst({ where: { companyId: input.companyId, slug: decision.agentSlug, status: 'active' } })
    : null

  // The CEO is always the top-level execution owner. Specialist work is explicitly
  // represented as a child execution so the complete decision path is auditable.
  const ceoExecution = await createExecution(ceo.id, input.userId, input.question, decision)

  try {
    await prisma.toolCall.create({
      data: {
        executionId: ceoExecution.id,
        toolName: 'company_context',
        input: { companyId: input.companyId },
        output: { loaded: true, departments: context.departments.length, agents: context.agents.length },
      },
    })

    if (hits.length) {
      await prisma.toolCall.create({
        data: {
          executionId: ceoExecution.id,
          toolName: 'knowledge_search',
          input: { query: input.question },
          output: { hits: hits.map((hit) => ({ documentId: hit.documentId, title: hit.title, score: hit.score })) },
        },
      })
    }

    let workingAgent = ceo
    let specialistExecutionId: string | undefined

    if (decision.action === 'delegate' && specialist) {
      await prisma.toolCall.create({
        data: {
          executionId: ceoExecution.id,
          toolName: 'delegate_agent',
          input: { agentId: specialist.id, agentSlug: specialist.slug, reason: decision.reason },
          output: { delegated: true },
        },
      })

      const specialistExecution = await createExecution(specialist.id, input.userId, input.question, decision)
      specialistExecutionId = specialistExecution.id
      workingAgent = specialist

      await prisma.toolCall.create({
        data: {
          executionId: specialistExecution.id,
          toolName: 'inherited_company_context',
          input: { fromExecutionId: ceoExecution.id },
          output: { loaded: true },
        },
      })

      const specialistSystem = specialist.systemPrompt || `You are the ${specialist.name} specialist inside CompanyOS. Focus on your business domain, use only supplied company information, and never invent company facts.`
      const specialistPrompt = `Company: ${context.company.name}\nDomain: ${specialist.name}\nQuestion: ${input.question}\n\nCompany context:\n${contextText(context)}\n\nRetrieved knowledge:\n${hits.map((h) => `[${h.title}] ${h.content}`).join('\n\n') || 'None'}`
      const specialistAnswer = await generateWithProvider([
        { role: 'system', content: specialistSystem },
        { role: 'user', content: specialistPrompt },
      ])

      let resolvedSpecialistAnswer = specialistAnswer
      if (!resolvedSpecialistAnswer) {
        const synth = await synthesizeAgentResponse({
          agent: specialist,
          user: { id: input.userId },
          company: context.company,
          context,
          message: input.question,
          conversationHistory: [],
        })
        resolvedSpecialistAnswer = synth.answer
      }

      await prisma.agentExecution.update({
        where: { id: specialistExecution.id },
        data: { status: 'completed', output: { answer: resolvedSpecialistAnswer, delegatedBy: ceo.id }, completedAt: new Date() },
      })
    }

    const system = workingAgent === ceo
      ? 'You are CompanyOS, the CEO-level company intelligence layer. Answer using only supplied company context and retrieved evidence. If evidence is insufficient, say so clearly. Never invent company facts. When a specialist was involved, synthesize only the specialist result supplied to you.'
      : `You are the CEO of CompanyOS synthesizing the response from the ${workingAgent.name} specialist. Use only the supplied company context, evidence, and specialist result. Never invent company facts.`

    const specialistResult = specialistExecutionId
      ? await prisma.agentExecution.findUnique({ where: { id: specialistExecutionId }, select: { output: true } })
      : null

    const prompt = `Question: ${input.question}\n\nRouting decision: ${JSON.stringify(decision)}\n\nCompany context:\n${contextText(context)}\n\nRetrieved knowledge:\n${hits.map((h) => `[${h.title}] ${h.content}`).join('\n\n') || 'None'}\n\nSpecialist result:\n${JSON.stringify(specialistResult?.output ?? null)}`
    const providerAnswer = await generateWithProvider([
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ])
    let answer = providerAnswer ?? (specialistResult?.output as any)?.answer
    if (!answer) {
      const synth = await synthesizeAgentResponse({
        agent: specialist || ceo,
        user: { id: input.userId },
        company: context.company,
        context,
        message: input.question,
        conversationHistory: [],
      })
      answer = synth.answer
    }

    const finalOutput = {
      answer,
      decision,
      delegatedTo: specialist?.slug ?? null,
      evidence: hits.map((hit) => ({ documentId: hit.documentId, title: hit.title, score: hit.score })),
    }

    await prisma.agentExecution.update({
      where: { id: ceoExecution.id },
      data: { status: 'completed', output: finalOutput, completedAt: new Date() },
    })

    await prisma.activity.create({
      data: {
        companyId: input.companyId,
        actorId: input.userId,
        type: 'intelligence.answer',
        message: `Answered company question via ${decision.intent}${specialist ? ` → ${specialist.slug}` : ''}`,
        metadata: { executionId: ceoExecution.id, specialistExecutionId, decision },
      },
    })

    let conversationId = input.conversationId
    if (!conversationId) {
      const conversation = await prisma.conversation.create({
        data: { companyId: input.companyId, userId: input.userId, title: input.question.slice(0, 80) },
      })
      conversationId = conversation.id
    }

    await prisma.message.createMany({
      data: [
        { conversationId, userId: input.userId, role: 'user', content: input.question },
        { conversationId, role: 'assistant', content: answer, metadata: { executionId: ceoExecution.id, decision, specialistExecutionId } },
      ],
    })

    const sources = hits.map((hit) => ({ documentId: hit.documentId, title: hit.title }))
    const agentSummary = {
      id: workingAgent.id,
      name: workingAgent.name,
      slug: workingAgent.slug,
      type: workingAgent.type,
    }

    return {
      success: true,
      answer,
      executionId: ceoExecution.id,
      specialistExecutionId,
      agent: agentSummary,
      intent: decision.intent,
      sources,
      decision,
      evidence: hits.map((hit) => ({ documentId: hit.documentId, title: hit.title, score: hit.score })),
      conversationId,
      context: {
        company: context.company,
        openTasks: context.tasks.filter((task) => task.status !== 'done').length,
        customers: context.customers,
      },
    }
  } catch (error) {
    await prisma.agentExecution.update({
      where: { id: ceoExecution.id },
      data: { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error', completedAt: new Date() },
    })
    throw error
  }
}

export async function listExecutions(companyId: string, limit = 30) {
  return prisma.agentExecution.findMany({
    where: { agent: { companyId } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { agent: { select: { name: true, slug: true, type: true } } },
  })
}
