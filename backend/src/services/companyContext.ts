import { prisma } from './prisma.js'

export async function getCompanyContext(companyId: string) {
  const [company, departments, agents, tasks, documents, customers] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true, slug: true, description: true, timezone: true } }),
    prisma.department.findMany({ where: { companyId }, select: { id: true, name: true, description: true } }),
    prisma.agent.findMany({ where: { companyId }, select: { id: true, name: true, slug: true, type: true, status: true, description: true } }),
    prisma.task.findMany({ where: { companyId }, orderBy: { updatedAt: 'desc' }, take: 50, select: { id: true, title: true, status: true, priority: true, dueAt: true, updatedAt: true } }),
    prisma.document.findMany({ where: { companyId, status: 'active' }, orderBy: { updatedAt: 'desc' }, take: 50, select: { id: true, title: true, sourceType: true, updatedAt: true } }),
    prisma.customer.count({ where: { companyId } }),
  ])
  return { company, departments, agents, tasks, documents, customers }
}
