export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { Plus } from 'lucide-react';
import { ItemsClient } from './client';

export default async function ItemsPage() {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Items / Inventory</h1>
        <button className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </button>
      </div>
      <ItemsClient data={items} />
    </div>
  );
}
