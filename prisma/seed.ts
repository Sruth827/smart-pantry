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


  const categoriesToCreate = ['Produce', 'Dairy', 'Pantry Staples', 'Frozen'];

  for (const catName of categoriesToCreate) {
    const category = await prisma.category.upsert({
      where: {
        userId_name: { userId: admin.id, name: catName },
      },
      update: {},
      create: {
        name: catName,
        userId: admin.id,
      },
    })

    // 3. Seed specific items for the 'Produce' category as an example
    if (catName === 'Produce') {
      const produceItems = [
        { itemName: 'Honey Crisp Apples', quantity: 5, unitLabel: 'pcs' },
        { itemName: 'Baby Spinach', quantity: 1, unitLabel: 'bag' },
        { itemName: 'Avocados', quantity: 3, unitLabel: 'pcs' },
      ]

      for (const item of produceItems) {
        // Since PantryItem doesn't have a unique constraint, 
        // we check manually to prevent duplicates on re-run
        const existingItem = await prisma.pantryItem.findFirst({
          where: { itemName: item.itemName, userId: admin.id }
        });

        if (!existingItem) {
          await prisma.pantryItem.create({
            data: {
              ...item,
              userId: admin.id,
              categoryId: category.id,
            },
          })
        }
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
