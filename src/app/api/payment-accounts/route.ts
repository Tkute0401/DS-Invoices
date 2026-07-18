import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const accounts = await prisma.paymentAccount.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Error fetching payment accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch payment accounts' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { accountName, accountType, bankName, accountNumber, ifscCode, upiId } = body
    
    const account = await prisma.paymentAccount.create({
      data: {
        accountName,
        accountType,
        bankName,
        accountNumber,
        ifscCode,
        upiId,
      }
    })
    
    return NextResponse.json(account)
  } catch (error) {
    console.error('Error creating payment account:', error)
    return NextResponse.json({ error: 'Failed to create payment account' }, { status: 500 })
  }
}
