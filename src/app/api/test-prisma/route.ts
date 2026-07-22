import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const invoiceTotals = await prisma.invoice.aggregate({
    where: { status: { not: 'DELETED' } },
    _sum: { amountDue: true, amountPaid: true, grandTotal: true },
    _count: true
  });
  const statusCounts = await prisma.invoice.groupBy({
    by: ['status'],
    where: { status: { not: 'DELETED' } },
    _count: true
  });
  return NextResponse.json({ invoiceTotals, statusCounts });
}
