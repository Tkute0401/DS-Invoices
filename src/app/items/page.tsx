export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { Plus } from 'lucide-react';
import { ItemsClient } from './client';

export default async function ItemsPage() {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <ItemsClient data={items} />
    </div>
  );
}
