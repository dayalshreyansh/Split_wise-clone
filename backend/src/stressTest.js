import dotenv from 'dotenv';
dotenv.config();

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const runStressTest = async () => {
  console.log("🔍 Searching for a valid User and Group in the database...");

  // --- AUTO-FETCH VALID IDs ---
  const validGroup = await prisma.group.findFirst();
  const validUser = await prisma.user.findFirst();

  if (!validGroup || !validUser) {
    console.error("❌ Error: Your database is empty! Create at least one user and one group in Postman first.");
    process.exit(1);
  }

  const groupId = validGroup.id;
  const paidById = validUser.id;

  console.log(`✅ Using Group ID: ${groupId}`);
  console.log(`✅ Using User ID: ${paidById}`);
  console.log("🚀 Generating 10,000 database records in memory...");

  const mockExpenses = [];
  
  for (let i = 1; i <= 10000; i++) {
    mockExpenses.push({
      groupId,
      description: `Auto-Generated Expense #${i}`,
      totalAmount: Math.floor(Math.random() * 500) + 10,
      splitType: 'EQUAL',
      paidById,
    });
  }

  try {
    console.log("💾 Injecting into PostgreSQL...");
    const result = await prisma.expense.createMany({
      data: mockExpenses
    });
    console.log(`✅ Success! Injected ${result.count} expenses into the database.`);
  } catch (error) {
    console.error("❌ Stress Test Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
};

runStressTest();