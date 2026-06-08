import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
  try {
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('No user found in the DB. Please sign in or register first.')
      return
    }
    console.log('Found user:', user.email, user.id)
    
    // Attempt to create a goal using prisma directly (similar to goalsStore.ts)
    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: 'Test Goal',
        description: 'Test Description',
        category: 'Travel',
        targetDate: new Date(),
        budget: 1000,
        priority: 'Medium',
        difficulty: 'Medium',
        location: 'Test Location',
        tags: 'test,adventure',
        visibility: 'Private',
        status: 'Not Started',
        progress: 0,
      }
    })
    console.log('Successfully created goal:', goal)

    // Clean up
    await prisma.goal.delete({ where: { id: goal.id } })
    console.log('Cleaned up test goal.')
  } catch (error) {
    console.error('Error during creation test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

test()
