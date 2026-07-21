import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await req.json()
    const { name, skuId, description, hsnSac, price, gstRate, type, category, unitCode, manageStock, currentStock } = body

    const item = await prisma.item.update({
      where: { id: resolvedParams.id },
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
    console.error('Error updating item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.item.delete({
      where: { id: resolvedParams.id }
    })
    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
