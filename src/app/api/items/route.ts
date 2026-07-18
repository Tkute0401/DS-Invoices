import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, skuId, description, hsnSac, price, gstRate, type, category, unitCode, manageStock, currentStock } = body

    const item = await prisma.item.create({
      data: {
        name,
        skuId,
        description,
        hsnSac,
        price: parseFloat(price),
        gstRate: gstRate ? parseFloat(gstRate) : 0,
        type: type || 'PRODUCT',
        category,
        unitCode,
        manageStock: manageStock || false,
        currentStock: currentStock ? parseFloat(currentStock) : 0
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
