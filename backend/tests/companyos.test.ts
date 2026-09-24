import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { hashPassword, verifyPassword } from '../src/services/password.js'
import { initializeCompanyDefaults } from '../src/services/companyDefaults.js'
import { answerCompanyQuestion } from '../src/services/intelligence/orchestrator.js'

const prisma = new PrismaClient()

describe('CompanyOS Core Test Suite', () => {
  let testUserId: string
  let testCompanyId: string

  beforeAll(async () => {
    // Clean up previous test users if any
    const existing = await prisma.user.findUnique({ where: { email: 'test_autosuite@company.test' } })
    if (existing) {
      await prisma.user.delete({ where: { id: existing.id } })
    }
  })

  afterAll(async () => {
    if (testCompanyId) {
      await prisma.company.delete({ where: { id: testCompanyId } }).catch(() => {})
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  it('hashes and verifies passwords securely with bcryptjs', async () => {
    const raw = 'SecurePassword123!'
    const hash = await hashPassword(raw)
    expect(hash).not.toBe(raw)
    const valid = await verifyPassword(raw, hash)
    expect(valid).toBe(true)
    const invalid = await verifyPassword('WrongPassword', hash)
    expect(invalid).toBe(false)
  })

  it('creates user, company, membership and initializes all 6 default agents', async () => {
    const passwordHash = await hashPassword('Password123!')
    const user = await prisma.user.create({
      data: {
        username: `test_user_${Date.now()}`,
        email: 'test_autosuite@company.test',
        passwordHash,
        role: 'owner',
      },
    })
    testUserId = user.id

    const company = await prisma.company.create({
      data: {
        name: 'AutoSuite Corp',
        slug: `autosuite-${Date.now()}`,
      },
    })
    testCompanyId = company.id

    await prisma.membership.create({
      data: {
        userId: user.id,
        companyId: company.id,
        role: 'owner',
      },
    })

    // Initialize company defaults
    await initializeCompanyDefaults(prisma, company.id)

    // Verify departments
    const departments = await prisma.department.findMany({ where: { companyId: company.id } })
    expect(departments.length).toBe(6)
    const deptNames = departments.map((d) => d.name)
    expect(deptNames).toContain('Executive')
    expect(deptNames).toContain('Sales')
    expect(deptNames).toContain('Marketing')
    expect(deptNames).toContain('Finance')
    expect(deptNames).toContain('HR')
    expect(deptNames).toContain('Operations')

    // Verify agents
    const agents = await prisma.agent.findMany({ where: { companyId: company.id } })
    expect(agents.length).toBe(6)
    const slugs = agents.map((a) => a.slug)
    expect(slugs).toContain('ceo')
    expect(slugs).toContain('sales')
    expect(slugs).toContain('marketing')
    expect(slugs).toContain('finance')
    expect(slugs).toContain('hr')
    expect(slugs).toContain('operations')
  })

  it('executes CEO intelligence question and records AgentExecution', async () => {
    const response = await answerCompanyQuestion({
      companyId: testCompanyId,
      userId: testUserId,
      question: 'Give me an overview of the company.',
    })

    expect(response).toBeDefined()
    expect(response.answer).toBeDefined()
    expect(response.executionId).toBeDefined()

    const execution = await prisma.agentExecution.findUnique({
      where: { id: response.executionId },
    })
    expect(execution).toBeDefined()
    expect(execution?.status).toBe('completed')
  })
})
