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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id: resolvedParams.id },
      include: {
        client: true,
        lineItems: true,
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { 
      clientId, invoiceNumber, date, dueDate, status, subtotal, 
      taxTotal, discountTotal, additionalCharges, grandTotal, 
      notes, terms, shippingDetails, taxType, gstType, countryOfSupply, placeOfSupply, lineItems 
    } = body;

    // Verify invoice exists
    const existing = await prisma.invoice.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Calculate new amount due based on the new grand total and what was already paid
    const amountDue = parseFloat(grandTotal) - existing.amountPaid;
    
    // Determine new status based on amount due
    let newStatus = status;
    if (existing.amountPaid > 0) {
      newStatus = amountDue <= 0 ? 'PAID' : 'PART PAID';
    } else {
      newStatus = amountDue <= 0 ? 'PAID' : 'UNPAID';
    }

    // Update using a transaction
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // 1. Delete all existing line items
      await tx.invoiceLineItem.deleteMany({
        where: { invoiceId: resolvedParams.id }
      });

      // 2. Update invoice and recreate line items
      return await tx.invoice.update({
        where: { id: resolvedParams.id },
        data: {
          clientId,
          invoiceNumber,
          date: new Date(date),
          dueDate: new Date(dueDate),
          status: newStatus,
          subtotal: parseFloat(subtotal),
          taxTotal: parseFloat(taxTotal),
          discountTotal: parseFloat(discountTotal || 0),
          additionalCharges: parseFloat(additionalCharges || 0),
          grandTotal: parseFloat(grandTotal),
          amountDue: amountDue,
          notes,
          terms,
          shippingDetails,
          taxType,
          gstType,
          countryOfSupply,
          placeOfSupply,
          lineItems: {
            create: lineItems.map((item: any) => ({
              itemId: item.itemId || null,
              itemName: item.itemName,
              description: item.description,
              hsnSac: item.hsnSac,
              quantity: parseFloat(item.quantity),
              rate: parseFloat(item.rate),
              discount: parseFloat(item.discount || 0),
              gstRate: parseFloat(item.gstRate || 0),
              cgstAmount: parseFloat(item.cgstAmount || 0),
              sgstAmount: parseFloat(item.sgstAmount || 0),
              igstAmount: parseFloat(item.igstAmount || 0),
              totalAmount: parseFloat(item.totalAmount)
            }))
          }
        },
        include: {
          client: true,
          lineItems: true
        }
      });
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
