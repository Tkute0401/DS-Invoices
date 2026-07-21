import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    // Fetch the invoice and its line items
    const invoice = await prisma.invoice.findUnique({
      where: { id: resolvedParams.id },
      include: {
        lineItems: true,
      }
    });
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    // Generate new unique invoice number
    const timestamp = new Date().getTime().toString().slice(-6);
    const newInvoiceNumber = `${invoice.invoiceNumber}-CLONE-${timestamp}`;
    
    // Create new invoice based on the old one
    const newInvoice = await prisma.invoice.create({
      data: {
        clientId: invoice.clientId,
        invoiceNumber: newInvoiceNumber,
        date: new Date(),
        dueDate: invoice.dueDate, // or could add days based on terms
        status: 'DRAFT',
        subtotal: invoice.subtotal,
        taxTotal: invoice.taxTotal,
        discountTotal: invoice.discountTotal,
        additionalCharges: invoice.additionalCharges,
        grandTotal: invoice.grandTotal,
        amountPaid: 0,
        amountDue: invoice.grandTotal,
        notes: invoice.notes,
        terms: invoice.terms,
        shippingDetails: invoice.shippingDetails,
        taxType: invoice.taxType,
        gstType: invoice.gstType,
        lineItems: {
          create: invoice.lineItems.map(item => ({
            itemId: item.itemId,
            itemName: item.itemName,
            description: item.description,
            hsnSac: item.hsnSac,
            quantity: item.quantity,
            rate: item.rate,
            discount: item.discount,
            gstRate: item.gstRate,
            cgstAmount: item.cgstAmount,
            sgstAmount: item.sgstAmount,
            igstAmount: item.igstAmount,
            totalAmount: item.totalAmount
          }))
        }
      },
      include: {
        client: true,
        lineItems: true
      }
    });
    
    return NextResponse.json(newInvoice)
  } catch (error) {
    console.error('Error cloning invoice:', error)
    return NextResponse.json({ error: 'Failed to clone invoice' }, { status: 500 })
  }
}
