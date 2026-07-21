import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    // Deleting a payment receipt will cascade to payment records (due to onDelete: Cascade)
    // and if those payment records were updating invoice amountPaid, those amounts will not be automatically reverted.
    // Let's get the receipt and payment records first to revert the invoice amountPaid
    const receipt = await prisma.paymentReceipt.findUnique({
      where: { id: resolvedParams.id },
      include: {
        paymentRecords: true,
      }
    });
    
    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }
    
    // Update linked invoices to reduce their amountPaid and increase amountDue
    for (const record of receipt.paymentRecords) {
      if (record.invoiceId) {
        const invoice = await prisma.invoice.findUnique({
          where: { id: record.invoiceId }
        });
        
        if (invoice) {
          const newAmountPaid = Math.max(0, invoice.amountPaid - record.amountAllocated);
          const newAmountDue = invoice.grandTotal - newAmountPaid;
          
          let newStatus = invoice.status;
          if (newStatus !== 'DRAFT' && newStatus !== 'CANCELLED') {
            newStatus = newAmountPaid === 0 ? 'UNPAID' : (newAmountDue > 0 ? 'PART_PAID' : 'PAID');
          }
          
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              amountPaid: newAmountPaid,
              amountDue: newAmountDue,
              status: newStatus
            }
          });
        }
      }
    }
    
    // Delete receipt (will cascade to payment records)
    await prisma.paymentReceipt.delete({
      where: { id: resolvedParams.id }
    })
    
    return NextResponse.json({ message: 'Receipt deleted successfully' })
  } catch (error) {
    console.error('Error deleting receipt:', error)
    return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 })
  }
}
