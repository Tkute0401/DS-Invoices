import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: { contacts: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, billingAddress, shippingAddress, gstin, pan, placeOfSupply, defaultDueDays } = body

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        billingAddress,
        shippingAddress,
        gstin,
        pan,
        placeOfSupply,
        defaultDueDays: defaultDueDays || 15
      },
      include: { contacts: true }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
