import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    const receipt = await prisma.paymentReceipt.findUnique({
      where: { id: resolvedParams.id },
      include: {
        paymentRecords: true,
      }
    });
    
    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }
    
    // Generate new unique receipt number
    const timestamp = new Date().getTime().toString().slice(-6);
    const newReceiptNumber = `${receipt.receiptNumber}-CLONE-${timestamp}`;
    
    // Clone receipt and its payment records
    // NOTE: When cloning a receipt that links to an invoice, do we link the cloned receipt to the same invoice?
    // If we do, it would increase the amountPaid on the invoice. 
    // It's probably better to just clone the receipt with NO linked invoice, or let the client decide. 
    // For simplicity, we duplicate it but don't link it to invoices immediately, or we do but don't update invoice.
    // Actually, in a clone, maybe we shouldn't link to the invoice to avoid double-crediting.
    const newReceipt = await prisma.paymentReceipt.create({
      data: {
        clientId: receipt.clientId,
        receiptNumber: newReceiptNumber,
        date: new Date(),
        amountReceived: receipt.amountReceived,
        transactionCharges: receipt.transactionCharges,
        tdsAmount: receipt.tdsAmount,
        notes: receipt.notes,
        paymentRecords: {
          create: receipt.paymentRecords.map(record => ({
            // We intentionally don't copy invoiceId to prevent double-crediting an invoice
            paymentAccountId: record.paymentAccountId,
            amountAllocated: record.amountAllocated,
            paymentMethod: record.paymentMethod,
            referenceNumber: record.referenceNumber,
          }))
        }
      },
      include: {
        client: true,
        paymentRecords: true
      }
    });
    
    return NextResponse.json(newReceipt)
  } catch (error) {
    console.error('Error cloning receipt:', error)
    return NextResponse.json({ error: 'Failed to clone receipt' }, { status: 500 })
  }
}
