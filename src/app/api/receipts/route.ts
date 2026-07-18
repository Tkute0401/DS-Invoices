import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const receipts = await prisma.paymentReceipt.findMany({
      include: {
        client: true,
        paymentRecords: {
          include: { invoice: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(receipts)
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      clientId, receiptNumber, date, amountReceived, transactionCharges, 
      tdsAmount, notes, paymentRecords 
    } = body

    // We use a transaction because we need to create the receipt and update the invoice
    const result = await prisma.$transaction(async (tx: any) => {
      const receipt = await tx.paymentReceipt.create({
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
        include: {
          paymentRecords: true
        }
      })

      // For each payment record, update the related invoice
      for (const record of receipt.paymentRecords) {
        if (record.invoiceId) {
          const invoice = await tx.invoice.findUnique({
            where: { id: record.invoiceId }
          })
          
          if (invoice) {
            const newAmountPaid = invoice.amountPaid + record.amountAllocated
            const newAmountDue = invoice.grandTotal - newAmountPaid
            
            let newStatus = invoice.status
            if (newAmountDue <= 0) {
              newStatus = 'PAID'
            } else if (newAmountPaid > 0) {
              newStatus = 'PART_PAID'
            }

            await tx.invoice.update({
              where: { id: invoice.id },
              data: {
                amountPaid: newAmountPaid,
                amountDue: newAmountDue,
                status: newStatus
              }
            })
          }
        }
      }

      return receipt
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating receipt:', error)
    return NextResponse.json({ error: 'Failed to create receipt' }, { status: 500 })
  }
}
