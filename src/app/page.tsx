export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { 
  FileText, 
  Receipt, 
  Users, 
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Package
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

export default async function DashboardPage() {
  const invoices = await prisma.invoice.findMany({
    where: { status: { not: 'DELETED' } },
    select: { 
      id: true,
      invoiceNumber: true,
      amountDue: true, 
      amountPaid: true, 
      grandTotal: true,
      status: true,
      createdAt: true,
      client: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const recentInvoices = invoices.slice(0, 5);

  const receipts = await prisma.paymentReceipt.findMany({
    select: {
      id: true,
      receiptNumber: true,
      amountReceived: true,
      createdAt: true,
      client: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const clientsCount = await prisma.client.count();
  const itemsCount = await prisma.item.count();

  let totalDue = 0;
  let totalCollected = 0;
  let totalInvoiced = 0;
  let overdueCount = 0;
  let paidCount = 0;
  let unpaidCount = 0;

  invoices.forEach(inv => {
    totalDue += inv.amountDue;
    totalCollected += inv.amountPaid;
    totalInvoiced += inv.grandTotal;
    
    if (inv.status === 'OVERDUE') overdueCount++;
    if (inv.status === 'PAID') paidCount++;
    if (inv.status === 'UNPAID' || inv.status === 'PART_PAID') unpaidCount++;
  });

  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="flex gap-3">
          <Link href="/receipts/new" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center text-sm font-medium shadow-sm">
            <Receipt className="w-4 h-4 mr-2" />
            Record Payment
          </Link>
          <Link href="/invoices/new" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm font-medium shadow-sm">
            <FileText className="w-4 h-4 mr-2" />
            Create Invoice
          </Link>
        </div>
      </div>
      
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Total Outstanding</h2>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">₹{totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-500 mt-2">{overdueCount} overdue invoices</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Total Collected</h2>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">₹{totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${collectionRate}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{collectionRate}% collection rate</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Total Invoiced</h2>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">₹{totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-500 mt-2">Across {invoices.length} total invoices</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Database Assets</h2>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex justify-between mt-2">
            <div>
              <p className="text-2xl font-semibold text-gray-900">{clientsCount}</p>
              <p className="text-xs text-gray-500">Clients</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{itemsCount}</p>
              <p className="text-xs text-gray-500">Items (SKUs)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Invoices</h2>
            <Link href="/invoices" className="text-sm text-blue-600 hover:text-blue-800">View All</Link>
          </div>
          <div className="p-0">
            {recentInvoices.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentInvoices.map(inv => (
                  <li key={inv.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <Link href={`/invoices/${inv.id}/preview`} className="text-sm font-medium text-blue-600 hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                        <p className="text-sm text-gray-500">{inv.client.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">₹{inv.grandTotal.toLocaleString()}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                          inv.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          inv.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                          inv.status === 'PART_PAID' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FileText className="mx-auto h-8 w-8 text-gray-300 mb-3" />
                <p>No invoices created yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Receipts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Receipts</h2>
            <Link href="/receipts" className="text-sm text-blue-600 hover:text-blue-800">View All</Link>
          </div>
          <div className="p-0">
            {receipts.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {receipts.map(rec => (
                  <li key={rec.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <Link href={`/receipts/${rec.id}/preview`} className="text-sm font-medium text-blue-600 hover:underline">
                          {rec.receiptNumber}
                        </Link>
                        <p className="text-sm text-gray-500">{rec.client.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">+₹{rec.amountReceived.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">{format(new Date(rec.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Receipt className="mx-auto h-8 w-8 text-gray-300 mb-3" />
                <p>No receipts recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
