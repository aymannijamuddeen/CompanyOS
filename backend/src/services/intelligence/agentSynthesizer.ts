import { searchCompanyKnowledge } from '../knowledge/retrieval.js'
import { generateWithProvider } from './provider.js'

export async function synthesizeAgentResponse(params: {
  agent: any
  user: any
  company: any
  context: any
  message: string
  conversationHistory: Array<{ role: string; content: string }>
}): Promise<{ answer: string; citations: string[]; routeUsed: string }> {
  const { agent, company, context, message, conversationHistory } = params
  const hits = await searchCompanyKnowledge(company.id, message, 3)
  const citations = hits.map((h) => h.title)

  // 1. Try LLM provider if configured
  if (process.env.LLM_API_KEY && process.env.LLM_MODEL) {
    try {
      const systemPrompt = agent.systemPrompt || `You are the ${agent.name} for ${company.name}. Respond with expert guidance tailored to your specific role and company data.`
      const contextSummary = `Company: ${company.name}\nDepartments: ${context.departments.map((d: any) => d.name).join(', ')}\nOpen Tasks: ${context.tasks.filter((t: any) => t.status !== 'done').map((t: any) => `${t.title} (${t.priority})`).join('; ') || 'None'}\nCustomers: ${context.customers}\nRelevant Knowledge:\n${hits.map((h) => `[${h.title}]: ${h.content}`).join('\n\n')}`

      const messages = [
        { role: 'system' as const, content: `${systemPrompt}\n\nContext:\n${contextSummary}` },
        ...conversationHistory.slice(-4).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: message },
      ]

      const llmAnswer = await generateWithProvider(messages)
      if (llmAnswer) {
        return { answer: llmAnswer, citations, routeUsed: 'llm_provider' }
      }
    } catch (e) {
      console.warn('LLM provider error, using domain synthesizer:', e)
    }
  }

  // 2. Local Domain Intelligence Synthesizer
  const q = message.toLowerCase().trim()
  const openTasks = context.tasks.filter((t: any) => t.status !== 'done')
  const agentTasks = openTasks.filter((t: any) => t.agentId === agent.id)
  const relevantEvidence = hits.map((h) => `• **${h.title}**: ${h.content}`).join('\n')

  let responseBody = ''

  switch (agent.slug) {
    case 'ceo':
      if (q.includes('department') || q.includes('division') || q.includes('structure') || q.includes('team')) {
        responseBody = `**${company.name}** currently operates with **${context.departments.length} core departments**:\n\n` +
          context.departments.map((d: any, idx: number) =>
            `${idx + 1}. **${d.name}**: ${d.description || 'Core organizational business unit.'}`
          ).join('\n') +
          `\n\nEach department is paired with a specialized autonomous AI agent in CompanyOS to handle domain-specific workflows, document retrieval, and task execution.`
      } else if (q.includes('agent') || q.includes('ai') || q.includes('bot') || q.includes('specialist')) {
        responseBody = `**${company.name}** has **${context.agents.length} active autonomous agents** deployed across departments:\n\n` +
          context.agents.map((a: any, idx: number) =>
            `${idx + 1}. **${a.name}** (${a.slug.toUpperCase()} · ${a.type}): ${a.description || 'Autonomous specialist.'}`
          ).join('\n') +
          `\n\nYou can chat directly with any specialist agent via the **Agents** tab or by asking questions here for automated delegation.`
      } else if (q.includes('task') || q.includes('todo') || q.includes('action item') || q.includes('initiative')) {
        responseBody = `**${company.name}** currently has **${openTasks.length} active tasks** in progress:\n\n` +
          (openTasks.length
            ? openTasks.map((t: any, idx: number) =>
                `${idx + 1}. **${t.title}**\n   - **Status**: ${t.status.toUpperCase()} | **Priority**: ${t.priority.toUpperCase()}${t.agent ? ` | **Agent**: ${t.agent.name}` : ''}\n   - *${t.description || 'No description provided.'}*`
              ).join('\n\n')
            : 'There are currently no active tasks recorded. You can create one in the Tasks section.')
      } else if (q.includes('document') || q.includes('policy') || q.includes('handbook') || q.includes('knowledge') || q.includes('docs')) {
        responseBody = `**${company.name}** has **${context.documents?.length || 0} indexed knowledge documents** available for semantic retrieval:\n\n` +
          (context.documents?.length
            ? context.documents.map((doc: any, idx: number) =>
                `${idx + 1}. **${doc.title}** (${doc.sourceType})`
              ).join('\n') + (relevantEvidence ? `\n\n**Relevant excerpt**:\n${relevantEvidence}` : '')
            : 'No knowledge documents have been uploaded yet. You can upload documentation in the Knowledge section.')
      } else if (q.includes('priority') || q.includes('priorities') || q.includes('focus') || q.includes('initiative') || q.includes('goal')) {
        responseBody = `**Executive Priorities & Strategic Direction for ${company.name}**:\n\n` +
          `1. **Autonomous Operating Velocity**: Empowering each of our ${context.departments.length} departments to execute with high agency through dedicated AI agents.\n` +
          `2. **Commercial Tier Expansion**: Scaling our ${context.customers} enterprise accounts with usage-based execution credit subscriptions.\n` +
          `3. **Operational Margin Discipline**: Maintaining target gross margins at 80%+ while resolving active delivery bottlenecks.\n\n` +
          `**Active Initiatives Requiring Executive Attention**:\n` +
          (openTasks.length ? openTasks.slice(0, 4).map((t: any) => `• *${t.title}* (Priority: ${t.priority.toUpperCase()}, Status: ${t.status.toUpperCase()})`).join('\n') : '• No urgent tasks open.') +
          (relevantEvidence ? `\n\n**Company Context Reference**:\n${relevantEvidence}` : '')
      } else if (q.includes('status') || q.includes('overview') || q.includes('attention') || q.includes('health') || q.includes('today')) {
        responseBody = `Here is the current executive status for **${company.name}**:\n\n` +
          `• **Organization**: Operating across **${context.departments.length} departments** with **${context.agents.length} active autonomous agents**.\n` +
          `• **Open Tasks**: We currently have **${openTasks.length} active initiatives** requiring attention, including:\n` +
          openTasks.slice(0, 3).map((t: any) => `  - *${t.title}* (Priority: ${t.priority.toUpperCase()}, Status: ${t.status})`).join('\n') +
          `\n• **Customer Base**: Serving **${context.customers} enterprise accounts**.\n\n` +
          `**Executive Recommendation**: Focus immediate energy on unblocking high-priority tasks in Sales and Finance while our Operations Agent audits internal delivery bottlenecks.`
      } else if (q.includes('mission') || q.includes('strategy') || q.includes('goal') || q.includes('roadmap')) {
        responseBody = `As CEO of **${company.name}**, our strategic compass is defined as follows:\n\n` +
          (relevantEvidence ? `${relevantEvidence}\n\n` : '') +
          `Our primary strategic imperative is building autonomous velocity—empowering every department to operate with high agency, customer obsession, and transparent metrics.`
      } else {
        responseBody = `As the CEO Agent for **${company.name}**, I coordinate our cross-functional leadership across Executive, Sales, Marketing, Finance, HR, and Operations.\n\n` +
          `Regarding your question: "${message}"\n\n` +
          `• **Executive Overview**: We have **${context.departments.length} active departments**, **${context.agents.length} agents**, **${openTasks.length} open tasks**, and **${context.customers} enterprise customer accounts**.\n` +
          (relevantEvidence ? `\n• **Pertinent Company Context**:\n${relevantEvidence}\n` : '') +
          `\nI can coordinate our specialized agents to execute on this. Would you like me to assign an initiative to Sales, Marketing, Operations, Finance, or HR?`
      }
      break

    case 'sales':
      if (q.includes('pipeline') || q.includes('deal') || q.includes('customer') || q.includes('client') || q.includes('revenue') || q.includes('priority') || q.includes('priorities') || q.includes('sales') || q.includes('target')) {
        responseBody = `**Sales Pipeline & Commercial Briefing for ${company.name}**:\n\n` +
          `• **Active Enterprise Accounts**: We currently manage **${context.customers} accounts**, including *Acme Technologies*, *Starlight Dynamics*, and *Apex Global Enterprises*.\n` +
          `• **Current Commercial Priorities**:\n` +
          `  1. Accelerate proposal closure and expand enterprise account contracts.\n` +
          `  2. Drive net retention through multi-tier plans with usage-based AI agent execution credits.\n` +
          `  3. Partner with Marketing to convert inbound leads into qualified sales pipeline.\n` +
          `\n• **Priority Sales Actions**:\n` +
          (agentTasks.length ? agentTasks.map((t: any) => `  - *${t.title}* (${t.status.toUpperCase()}, Priority: ${t.priority.toUpperCase()})`).join('\n') : '  - Review enterprise contracts and follow up on pending proposals.\n') +
          (relevantEvidence ? `\n• **Commercial Documentation**:\n${relevantEvidence}\n` : '')
      } else {
        responseBody = `I am your **Sales Specialist Agent** at **${company.name}**.\n\n` +
          `Regarding: "${message}"\n\n` +
          `• **Commercial Scope**: Managing **${context.customers} enterprise accounts** and expanding ARR.\n` +
          `• **Active Sales Initiatives**:\n` +
          (agentTasks.length ? agentTasks.map((t: any) => `  - *${t.title}* (${t.status}, Priority: ${t.priority})`).join('\n') : '  - Evaluating pipeline conversion velocity and contract proposals.\n') +
          (relevantEvidence ? `\n• **Commercial Documentation**:\n${relevantEvidence}\n` : '') +
          `\nHow would you like to direct our commercial pipeline strategy?`
      }
      break

    case 'marketing':
      if (q.includes('demand') || q.includes('generation') || q.includes('priority') || q.includes('priorities') || q.includes('campaign') || q.includes('brand') || q.includes('seo') || q.includes('content') || q.includes('lead') || q.includes('growth') || q.includes('acquisition') || q.includes('audience') || q.includes('marketing')) {
        responseBody = `**Marketing Strategy & Demand Generation Briefing for ${company.name}**:\n\n` +
          `• **Primary Demand Generation Priorities**:\n` +
          `  1. **Enterprise Positioning**: Position ${company.name} as the leading autonomous operating system for high-velocity organizations.\n` +
          `  2. **Inbound Funnel Velocity**: Drive targeted content and case studies highlighting multi-agent coordination to capture high-intent enterprise buyers.\n` +
          `  3. **Sales & Demand Alignment**: Coordinate qualified outbound accounts with the Sales Agent to accelerate enterprise pilot adoption.\n` +
          `  4. **Product Marketing**: Support the Q3 commercial model rollout featuring usage-based agent execution tiers.\n` +
          `\n• **Active Marketing Initiatives**:\n` +
          (agentTasks.length ? agentTasks.map((t: any) => `  - *${t.title}* (${t.status.toUpperCase()}, Priority: ${t.priority.toUpperCase()})`).join('\n') : '  - Audit Q3 demand generation campaigns and ICP acquisition channels.\n') +
          (relevantEvidence ? `\n• **Strategic Directives from Company Documentation**:\n${relevantEvidence}\n` : '')
      } else {
        responseBody = `I am your **Marketing Specialist Agent** at **${company.name}**.\n\n` +
          `Regarding your question: "${message}"\n\n` +
          `• **Marketing Focus**: Driving demand generation, brand positioning, and inbound customer acquisition across our target segments.\n` +
          `• **Commercial Alignment**: We align demand generation campaigns with our sales pipeline covering **${context.customers} enterprise accounts**.\n` +
          (agentTasks.length ? `• **Assigned Marketing Tasks**:\n${agentTasks.map((t: any) => `  - ${t.title} (${t.status})`).join('\n')}\n` : '') +
          (relevantEvidence ? `\n• **Related Documentation**:\n${relevantEvidence}\n` : '') +
          `\nHow would you like to optimize our demand generation or marketing campaigns?`
      }
      break

    case 'finance':
      if (q.includes('budget') || q.includes('margin') || q.includes('expense') || q.includes('burn') || q.includes('cost') || q.includes('runway') || q.includes('financial') || q.includes('priority') || q.includes('priorities') || q.includes('spend')) {
        responseBody = `**Financial Health & Fiscal Briefing for ${company.name}**:\n\n` +
          `• **Target Gross Margin**: Maintained at **80%+** according to company operating policy.\n` +
          `• **Current Financial Priorities**:\n` +
          `  1. Monthly burn rate and cloud/SaaS infrastructure spend reconciliation.\n` +
          `  2. Rigorous ROI evaluation for departmental headcount and tooling approvals.\n` +
          `  3. Working capital and invoice collection management across our **${context.customers} accounts**.\n` +
          `\n• **Active Financial Tasks**:\n` +
          (agentTasks.length ? agentTasks.map((t: any) => `  - *${t.title}* (${t.status.toUpperCase()}, Priority: ${t.priority.toUpperCase()})`).join('\n') : '  - Conduct monthly burn rate and SaaS spend reconciliation.\n') +
          (relevantEvidence ? `\n• **Policy Reference**:\n${relevantEvidence}\n` : '')
      } else {
        responseBody = `I am your **Finance Specialist Agent** at **${company.name}**.\n\n` +
          `Regarding: "${message}"\n\n` +
          `• **Mandate**: Safeguarding capital efficiency, unit economics, and 80%+ gross margin targets.\n` +
          `• **Active Tasks**:\n` +
          (agentTasks.length ? agentTasks.map((t: any) => `  - ${t.title} (${t.status})`).join('\n') : '  - Monitoring cash burn rate and financial performance.\n') +
          (relevantEvidence ? `\n• **Financial Policy Reference**:\n${relevantEvidence}\n` : '')
      }
      break

    case 'hr':
      if (q.includes('hiring') || q.includes('employee') || q.includes('headcount') || q.includes('recruit') || q.includes('people') || q.includes('team') || q.includes('talent') || q.includes('priority') || q.includes('priorities')) {
        responseBody = `**People Operations & Talent Acquisition Update for ${company.name}**:\n\n` +
          `• **Current People Priorities**:\n` +
          `  1. Finalize role requirements for incoming engineering and specialist hires.\n` +
          `  2. Ensure all requisition approvals meet cross-functional alignment and ROI justification.\n` +
          `  3. Standardize autonomous agent integration into employee team workflows.\n` +
          `\n• **Active HR Initiatives**:\n` +
          (agentTasks.length ? agentTasks.map((t: any) => `  - *${t.title}* (${t.status.toUpperCase()}, Priority: ${t.priority.toUpperCase()})`).join('\n') : '  - Finalize talent recruitment and role requirements.\n') +
          (relevantEvidence ? `\n• **People Policy Notes**:\n${relevantEvidence}\n` : '')
      } else {
        responseBody = `I am your **HR & People Operations Agent** at **${company.name}**.\n\n` +
          `Regarding: "${message}"\n\n` +
          `• **People Strategy**: Scaling organizational headcount while maintaining high velocity and talent density.\n` +
          (agentTasks.length ? `• **Active Initiatives**:\n${agentTasks.map((t: any) => `  - ${t.title} (${t.status})`).join('\n')}\n` : '') +
          (relevantEvidence ? `\n• **People Policy Notes**:\n${relevantEvidence}\n` : '')
      }
      break

    case 'operations':
      if (q.includes('bottleneck') || q.includes('process') || q.includes('workflow') || q.includes('efficiency') || q.includes('task') || q.includes('delivery') || q.includes('priority') || q.includes('priorities')) {
        responseBody = `**Operations & Workflow Throughput Briefing for ${company.name}**:\n\n` +
          `• **Current Operational Priorities**:\n` +
          `  1. Bottleneck Audit: Streamline handoffs between customer support and product engineering to reduce resolution cycle times.\n` +
          `  2. Execution Momentum: Coordinate throughput on all **${openTasks.length} open company tasks**.\n` +
          `  3. Autonomous Reliability: Ensure all agent integrations and database migrations run smoothly.\n` +
          `\n• **Active Operational Tasks**:\n` +
          (agentTasks.length ? agentTasks.map((t: any) => `  - *${t.title}* (${t.status.toUpperCase()}, Priority: ${t.priority.toUpperCase()})`).join('\n') : '  - Audit operational handoffs across teams.\n') +
          (relevantEvidence ? `\n• **Operational Standards**:\n${relevantEvidence}\n` : '')
      } else {
        responseBody = `I am your **Operations Specialist Agent** at **${company.name}**.\n\n` +
          `Regarding: "${message}"\n\n` +
          `• **Operations Overview**: Tracking **${openTasks.length} open tasks** across **${context.departments.length} departments**.\n` +
          (agentTasks.length ? `• **Active Tasks**:\n${agentTasks.map((t: any) => `  - ${t.title} (${t.status})`).join('\n')}\n` : '') +
          (relevantEvidence ? `\n• **Operational Standards**:\n${relevantEvidence}\n` : '')
      }
      break

    default:
      responseBody = `I am **${agent.name}** (${agent.type}) at **${company.name}**.\n\n` +
        `Regarding your message: "${message}"\n\n` +
        `• **Domain Context**: Operating within ${agent.department?.name || 'CompanyOS'}.\n` +
        (relevantEvidence ? `• **Relevant Company Records**:\n${relevantEvidence}\n\n` : '') +
        `How would you like me to assist you with items in this domain?`
      break
  }

  return { answer: responseBody, citations, routeUsed: 'domain_synthesizer' }
}
