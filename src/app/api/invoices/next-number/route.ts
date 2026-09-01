import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch the latest invoice based on createdAt (descending)
    const latestInvoice = await prisma.invoice.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!latestInvoice) {
      return NextResponse.json({ nextInvoiceNumber: 'B000001' });
    }

    // Attempt to extract the numeric part of the latest invoice number
    // Assuming format like "B000001", "INV-001", etc.
    const currentNumberStr = latestInvoice.invoiceNumber;
    const numericMatch = currentNumberStr.match(/(\d+)$/);

    if (numericMatch) {
      const numericPart = numericMatch[1];
      const prefix = currentNumberStr.substring(0, currentNumberStr.length - numericPart.length);
      
      const incrementedNumber = parseInt(numericPart, 10) + 1;
      // Pad with leading zeros to match the original length
      const paddedNumber = incrementedNumber.toString().padStart(numericPart.length, '0');
      
      return NextResponse.json({ nextInvoiceNumber: `${prefix}${paddedNumber}` });
    } else {
      // If no numeric part at the end, just append a '-1' or fallback
      return NextResponse.json({ nextInvoiceNumber: `${currentNumberStr}-1` });
    }

  } catch (error) {
    console.error('Error generating next invoice number:', error);
    return NextResponse.json({ error: 'Failed to generate next invoice number' }, { status: 500 });
  }
}
