import { PrismaClient } from '@prisma/client'
import { initializeCompanyDefaults } from '../src/services/companyDefaults.js'
import { hashPassword } from '../src/services/password.js'

const prisma = new PrismaClient()

async function main() {
  const hash = await hashPassword('password123')
  await prisma.user.updateMany({
    data: { passwordHash: hash }
  })
  console.log('Updated user passwords to password123')

  const companies = await prisma.company.findMany()
  for (const company of companies) {
    const owner = await prisma.membership.findFirst({ where: { companyId: company.id } })
    console.log(`Seeding defaults for company: ${company.name} (${company.id})`)
    await initializeCompanyDefaults(prisma, company.id, owner?.userId)
  }
  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
