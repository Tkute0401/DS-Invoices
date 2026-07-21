import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    // Check for linked payment records
    const invoice = await prisma.invoice.findUnique({
      where: { id: resolvedParams.id },
      include: {
        paymentRecords: true,
      }
    });
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    if (invoice.paymentRecords.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete invoice with linked payment receipts. Please delete or unlink the payment receipts first.' },
        { status: 400 }
      );
    }
    
    await prisma.invoice.delete({
      where: { id: resolvedParams.id }
    })
    
    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
