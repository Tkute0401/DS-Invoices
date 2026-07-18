export const dynamic = 'force-dynamic';

import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus } from 'lucide-react';
import { InvoicesClient } from './client';

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    include: { client: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link 
          href="/invoices/new" 
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Link>
      </div>
      <InvoicesClient data={invoices} />
    </div>
  );
}
