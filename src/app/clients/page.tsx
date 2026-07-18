export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { Plus } from 'lucide-react';
import { ClientsClient } from './client';

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <ClientsClient data={clients} />
    </div>
  );
}
