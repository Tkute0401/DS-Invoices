import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
        lineItems: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      clientId, invoiceNumber, date, dueDate, status, subtotal, 
      taxTotal, discountTotal, additionalCharges, grandTotal, amountPaid, amountDue, 
      notes, terms, shippingDetails, taxType, gstType, lineItems 
    } = body

    const invoice = await prisma.invoice.create({
      data: {
        clientId,
        invoiceNumber,
        date: new Date(date),
        dueDate: new Date(dueDate),
        status: status || 'DRAFT',
        subtotal: parseFloat(subtotal),
        taxTotal: parseFloat(taxTotal),
        discountTotal: parseFloat(discountTotal || 0),
        additionalCharges: parseFloat(additionalCharges || 0),
        grandTotal: parseFloat(grandTotal),
        amountPaid: parseFloat(amountPaid || 0),
        amountDue: parseFloat(amountDue),
        notes,
        terms,
        shippingDetails,
        taxType,
        gstType,
        lineItems: {
          create: lineItems.map((item: any) => ({
            itemId: item.itemId,
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
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
