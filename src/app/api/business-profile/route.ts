import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    let profile = await prisma.businessProfile.findFirst()
    if (!profile) {
      profile = await prisma.businessProfile.create({
        data: {
          name: 'Digital Supremacy',
          address: 'Above Ananda laundry, Pandit colony,\nNashik,\nMaharashtra, India - 422002',
          gstin: '27HBAPK9643BIZN',
          pan: 'HBAPK9643B',
          email: 'info@digitalsupremacy.in',
          phone: '+91 96897 72863',
          bankAccountName: 'Digital Supremacy',
          bankAccountNumber: '067100100000060',
          bankIfsc: 'NMCB0000068',
          bankType: 'Current',
          bankName: 'The Nashik Merchants Co-operative Bank',
          upiId: 'gauravkor80-3@okaxis'
        }
      })
    }
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching business profile:', error)
    return NextResponse.json({ error: 'Failed to fetch business profile' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updateData } = body
    
    let profile;
    if (id) {
      profile = await prisma.businessProfile.update({
        where: { id },
        data: updateData
      })
    } else {
      profile = await prisma.businessProfile.create({
        data: updateData
      })
    }
    
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating business profile:', error)
    return NextResponse.json({ error: 'Failed to update business profile' }, { status: 500 })
  }
}
