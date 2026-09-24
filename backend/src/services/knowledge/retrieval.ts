import { prisma } from '../prisma.js'

export type KnowledgeHit = {
  documentId: string
  title: string
  content: string
  score: number
  sourceType: string
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
}

const SYNONYMS: Record<string, string[]> = {
  demand: ['marketing', 'commercial', 'growth', 'acquisition', 'pipeline', 'strategy', 'roadmap'],
  generation: ['marketing', 'growth', 'acquisition', 'leads'],
  priorities: ['priority', 'focus', 'initiatives', 'roadmap', 'strategy', 'tasks', 'q3'],
  priority: ['priorities', 'focus', 'initiatives', 'roadmap', 'strategy'],
  marketing: ['demand', 'brand', 'campaign', 'strategy', 'commercial', 'growth'],
  sales: ['pipeline', 'revenue', 'commercial', 'deals', 'customers'],
  revenue: ['sales', 'commercial', 'financial', 'margin', 'pricing'],
  hiring: ['talent', 'headcount', 'recruiting', 'people', 'hr', 'policies'],
  people: ['hr', 'hiring', 'talent', 'employees', 'workforce'],
  finance: ['financial', 'budget', 'margin', 'expense', 'burn', 'cost', 'policies'],
  security: ['encryption', 'compliance', 'privacy', 'policy', 'standards'],
  operations: ['workflow', 'throughput', 'process', 'bottleneck', 'tasks'],
}

export async function searchCompanyKnowledge(companyId: string, query: string, limit = 6): Promise<KnowledgeHit[]> {
  const documents = await prisma.document.findMany({
    where: { companyId, status: 'active' },
    select: { id: true, title: true, content: true, sourceType: true },
    take: 200,
  })

  const baseTerms = normalize(query).filter((term) => term.length > 2)
  if (!baseTerms.length) return []

  const expandedTerms = new Set(baseTerms)
  for (const term of baseTerms) {
    if (SYNONYMS[term]) {
      for (const syn of SYNONYMS[term]) {
        expandedTerms.add(syn)
      }
    }
  }

  return documents
    .map((document) => {
      const haystack = `${document.title} ${document.content}`.toLowerCase()
      let score = 0
      for (const term of expandedTerms) {
        if (haystack.includes(term)) {
          score += baseTerms.includes(term) ? 2 : 1
        }
      }
      return { documentId: document.id, title: document.title, content: document.content, score, sourceType: document.sourceType }
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
