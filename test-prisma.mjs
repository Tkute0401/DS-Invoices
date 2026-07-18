import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const connectionString = 'postgresql://neondb_owner:npg_e24pSkYPLarK@ep-young-thunder-attw3irx-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    const invoices = await prisma.invoice.findMany();
    console.log("Success! Found invoices:", invoices.length);
  } catch (e) {
    console.error("Prisma error:", e);
  }
}

main();
