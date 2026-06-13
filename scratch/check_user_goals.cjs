const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const goals = await prisma.goal.findMany();
    console.log('All Goals in DB:');
    goals.forEach(g => {
      console.log(`- Title: "${g.title}" | Cost/Budget: ${g.budget} | EstCost: ${g.estimatedCost} | Saved: ${g.amountSaved} | UserID: ${g.userId}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
