import { PrismaClient, Category } from '@prisma/client'
import { faker } from '@faker-js/faker';
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


  console.log('Seeding Categories') 
  const allUsers = await prisma.user.findMany();
  const catNames = ['Produce', 'Dairy', 'Pantry Staples', 'Frozen', 'Meat', 'Bakery'];

console.log('--- Seeding Categories for all users ---');
  for (const user of allUsers) {
    for (const name of catNames) {
      await prisma.category.upsert({
        where: { userId_name: { userId: user.id, name } },
        update: {},
        create: { userId: user.id, name }
      });
    }
  }

const allCategories = await prisma.category.findMany(); 

await prisma.pantryItem.deleteMany({});

const foodMap: Record<string, string[]> = {
  'Produce': ['Honey Crisp Apples', 'Baby Spinach', 'Avocados', 'Bananas', 'Kale', 'Blueberries', 'Celery', 'Bell Peppers', 'Oranges'],
  'Dairy': ['Whole Milk', 'Greek Yogurt', 'Cheddar Cheese', 'Butter', 'Oat Milk', 'Sour Cream', 'Cheese'],
  'Pantry Staples': ['Basmati Rice', 'Olive Oil', 'Black Beans', 'Quinoa', 'Flour', 'Sugar', 'Salt', 'Pepper', 'Spaghetti'],
  'Frozen': ['Frozen Peas', 'Ice Cream', 'Frozen Pizza', 'Mixed Berries', 'Veggie Burgers', 'Chicken Nuggets'],
  'Meat': ['Chicken Breast', 'Ground Beef', 'Bacon', 'Salmon Fillet', 'Turkey Breast', 'Steak', 'Sausage'],
  'Bakery': ['Sourdough Bread', 'Bagels', 'Chocolate Croissant', 'Tortillas', 'Whole Wheat Bread', 'White Bread', 'Hamburger Buns']
};


console.log('--- Generating 1,000 Smart Items ---');

  const items = Array.from({ length: 1000 }).map(() => {
    // Pick a random category-user pair from the DB
    const randomCategory = faker.helpers.arrayElement(allCategories);
    
    // Get the food list using the category's name
    const foodList = foodMap[randomCategory.name] || ['Generic Food Item'];
    
    return {
      itemName: faker.helpers.arrayElement(foodList),
      quantity: faker.number.int({ min: 1, max: 15 }),
      unitLabel: faker.helpers.arrayElement(['pcs', 'bag', 'oz', 'lb', 'box']),
      // CRITICAL: The item's userId MUST match the category's userId
      userId: randomCategory.userId, 
      categoryId: randomCategory.id,
      expirationDate: faker.date.between({ 
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
          to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }),
    };
  });

  await prisma.pantryItem.createMany({
    data: items,
    skipDuplicates: true,
  });

  console.log(`✅ Success! 1,000 items distributed across ${allUsers.length} users.`);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
