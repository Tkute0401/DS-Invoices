export const dynamic = 'force-dynamic';

import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus } from 'lucide-react';
import { ReceiptsClient } from './client';

export default async function ReceiptsPage() {
  const receipts = await prisma.paymentReceipt.findMany({
    include: { client: true, paymentRecords: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Receipts</h1>
        <Link 
          href="/receipts/new" 
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Link>
      </div>
      <ReceiptsClient data={receipts} />
    </div>
  );
}
