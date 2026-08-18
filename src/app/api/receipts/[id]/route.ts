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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const receipt = await prisma.paymentReceipt.findUnique({
      where: { id: resolvedParams.id },
      include: {
        paymentRecords: true,
        client: true
      }
    });
    
    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }
    
    return NextResponse.json(receipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { 
      clientId, receiptNumber, date, amountReceived, transactionCharges, 
      tdsAmount, notes, paymentRecords 
    } = body;
    
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Find existing receipt and revert its payment records from invoices
      const oldReceipt = await tx.paymentReceipt.findUnique({
        where: { id: resolvedParams.id },
        include: { paymentRecords: true }
      });
      
      if (!oldReceipt) throw new Error('Receipt not found');
      
      for (const record of oldReceipt.paymentRecords) {
        if (record.invoiceId) {
          const invoice = await tx.invoice.findUnique({ where: { id: record.invoiceId } });
          if (invoice) {
            const newAmountPaid = Math.max(0, invoice.amountPaid - record.amountAllocated);
            const newAmountDue = invoice.grandTotal - newAmountPaid;
            let newStatus = invoice.status;
            if (newStatus !== 'DRAFT' && newStatus !== 'CANCELLED') {
              newStatus = newAmountPaid === 0 ? 'UNPAID' : (newAmountDue > 0 ? 'PART_PAID' : 'PAID');
            }
            await tx.invoice.update({
              where: { id: invoice.id },
              data: { amountPaid: newAmountPaid, amountDue: newAmountDue, status: newStatus }
            });
          }
        }
      }
      
      // 2. Delete old payment records
      await tx.paymentRecord.deleteMany({
        where: { receiptId: resolvedParams.id }
      });
      
      // 3. Update the receipt and add new payment records
      const updatedReceipt = await tx.paymentReceipt.update({
        where: { id: resolvedParams.id },
        data: {
          clientId,
          receiptNumber,
          date: new Date(date),
          amountReceived: parseFloat(amountReceived),
          transactionCharges: parseFloat(transactionCharges || 0),
          tdsAmount: parseFloat(tdsAmount || 0),
          notes,
          paymentRecords: {
            create: paymentRecords.map((record: any) => ({
              invoiceId: record.invoiceId,
              amountAllocated: parseFloat(record.amountAllocated),
              paymentMethod: record.paymentMethod,
              referenceNumber: record.referenceNumber,
              paymentAccountId: record.paymentAccountId || null
            }))
          }
        },
        include: { paymentRecords: true }
      });
      
      // 4. Apply new payment records to invoices
      for (const record of updatedReceipt.paymentRecords) {
        if (record.invoiceId) {
          const invoice = await tx.invoice.findUnique({ where: { id: record.invoiceId } });
          if (invoice) {
            const newAmountPaid = invoice.amountPaid + record.amountAllocated;
            const newAmountDue = invoice.grandTotal - newAmountPaid;
            let newStatus = invoice.status;
            if (newAmountDue <= 0) {
              newStatus = 'PAID';
            } else if (newAmountPaid > 0) {
              newStatus = 'PART_PAID';
            }
            await tx.invoice.update({
              where: { id: invoice.id },
              data: { amountPaid: newAmountPaid, amountDue: newAmountDue, status: newStatus }
            });
          }
        }
      }
      
      return updatedReceipt;
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating receipt:', error);
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 });
  }
}
