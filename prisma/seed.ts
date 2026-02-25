import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const password = 'pantry_pass_2026'
  const hash = await bcrypt.hash(password, 10)

  // Create a default Admin/Lead user
  const admin = await prisma.user.upsert({
    where: { email: 'sean@test.local' },
    update: {},
    create: {
      email: 'sean@test.local',
      fullName: 'Sean Ruth',
      passwordHash: hash,
    },
  })

  // Create accounts for the other 5 team members
  const teamEmails = [
    'anthonydelatorre@nu.edu',
    'anthonyrondina@nu.edu',
    'christophercarr@nu.edu',
    'falamoesteffany@nu.edu',
    'mahavir@nu.edu'
  ]

  for (const email of teamEmails) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        fullName: 'Team Member',
        passwordHash: hash,
      },
    })
  }

  console.log('Seed successful: Team accounts created with password: ' + password)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
