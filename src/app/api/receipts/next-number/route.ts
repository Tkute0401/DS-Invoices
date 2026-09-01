import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const latestReceipt = await prisma.paymentReceipt.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!latestReceipt) {
      return NextResponse.json({ nextReceiptNumber: 'A00130' });
    }

    const currentNumberStr = latestReceipt.receiptNumber;
    const numericMatch = currentNumberStr.match(/(\d+)$/);

    if (numericMatch) {
      const numericPart = numericMatch[1];
      const prefix = currentNumberStr.substring(0, currentNumberStr.length - numericPart.length);
      
      const incrementedNumber = parseInt(numericPart, 10) + 1;
      const paddedNumber = incrementedNumber.toString().padStart(numericPart.length, '0');
      
      return NextResponse.json({ nextReceiptNumber: `${prefix}${paddedNumber}` });
    } else {
      return NextResponse.json({ nextReceiptNumber: `${currentNumberStr}-1` });
    }

  } catch (error) {
    console.error('Error generating next receipt number:', error);
    return NextResponse.json({ error: 'Failed to generate next receipt number' }, { status: 500 });
  }
}
