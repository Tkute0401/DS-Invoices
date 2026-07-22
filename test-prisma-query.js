const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_1f3PihCaxIqJ@ep-young-thunder-attw3irx-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
});

async function main() {
  try {
    const invoiceTotals = await prisma.invoice.aggregate({
      where: { status: { not: 'DELETED' } },
      _sum: { amountDue: true, amountPaid: true, grandTotal: true },
      _count: true
    });
    console.log("Aggregate:", JSON.stringify(invoiceTotals, null, 2));

    const statusCounts = await prisma.invoice.groupBy({
      by: ['status'],
      where: { status: { not: 'DELETED' } },
      _count: true
    });
    console.log("GroupBy:", JSON.stringify(statusCounts, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
