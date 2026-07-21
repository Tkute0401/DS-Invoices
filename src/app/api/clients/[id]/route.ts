import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await req.json()
    const { name, email, phone, billingAddress, shippingAddress, gstin, pan, placeOfSupply, defaultDueDays } = body

    const client = await prisma.client.update({
      where: { id: resolvedParams.id },
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
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}
