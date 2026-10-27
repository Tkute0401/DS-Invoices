export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { 
  FileText, 
  Receipt, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  ArrowRight
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { format, subMonths, startOfMonth } from 'date-fns';
import DashboardMonthSelector, { MonthOption } from '@/components/DashboardMonthSelector';

interface DashboardPageProps {
  searchParams?: Promise<{
    month?: string;
  }>;
}

const parseCount = (countObj: unknown): number => {
  if (typeof countObj === 'number') return countObj;
  if (countObj && typeof countObj === 'object' && '_all' in countObj && typeof (countObj as { _all: number })._all === 'number') {
    return (countObj as { _all: number })._all;
  }
  return 0;
};

export default async function DashboardPage(props: DashboardPageProps) {
  const resolvedParams = props.searchParams ? await props.searchParams : {};
  const rawMonth = resolvedParams.month;
  const isValidMonth = Boolean(rawMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth));
  const selectedMonthKey = isValidMonth && rawMonth ? rawMonth : 'all';
  const isAllTime = selectedMonthKey === 'all';

  const now = new Date();
  const currentMonthKey = format(now, 'yyyy-MM');

  // Parse selected month dates if filtered
  let selectedStartDate: Date | null = null;
  let selectedEndDate: Date | null = null;
  let selectedMonthLabel = 'All Time (Total)';

  if (!isAllTime) {
    const [yearStr, monthStr] = selectedMonthKey.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    selectedStartDate = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
    selectedEndDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
    selectedMonthLabel = format(selectedStartDate, 'MMMM yyyy');
  }

  // Filter clauses
  const invoiceWhere = isAllTime
    ? { status: { not: 'DELETED' } }
    : {
        status: { not: 'DELETED' },
        date: {
          gte: selectedStartDate ?? undefined,
          lte: selectedEndDate ?? undefined,
        },
      };

  const receiptWhere = isAllTime
    ? {}
    : {
        date: {
          gte: selectedStartDate ?? undefined,
          lte: selectedEndDate ?? undefined,
        },
      };

  // Six months trend boundary
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));

  // Run all parallel queries
  const [
    recentInvoices,
    invoiceTotals,
    statusCounts,
    receipts,
    receiptsTotals,
    clientsCount,
    itemsCount,
    earliestInvoice,
    earliestReceipt,
    trendInvoices,
    trendReceipts,
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: invoiceWhere,
      select: { 
        id: true, 
        invoiceNumber: true, 
        amountDue: true, 
        amountPaid: true, 
        grandTotal: true, 
        status: true, 
        date: true,
        createdAt: true,
        client: { select: { name: true } }
      },
      orderBy: { date: 'desc' },
      take: 5
    }),
    prisma.invoice.aggregate({
      where: invoiceWhere,
      _sum: { amountDue: true, amountPaid: true, grandTotal: true },
      _count: true
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      where: invoiceWhere,
      _count: true
    }),
    prisma.paymentReceipt.findMany({
      where: receiptWhere,
      select: {
        id: true, 
        receiptNumber: true, 
        amountReceived: true, 
        date: true,
        createdAt: true,
        client: { select: { name: true } }
      },
      orderBy: { date: 'desc' },
      take: 5
    }),
    prisma.paymentReceipt.aggregate({
      where: receiptWhere,
      _sum: { amountReceived: true },
      _count: true
    }),
    prisma.client.count(),
    prisma.item.count(),
    prisma.invoice.findFirst({
      where: { status: { not: 'DELETED' } },
      orderBy: { date: 'asc' },
      select: { date: true }
    }),
    prisma.paymentReceipt.findFirst({
      orderBy: { date: 'asc' },
      select: { date: true }
    }),
    // 6-month trend queries
    prisma.invoice.findMany({
      where: {
        status: { not: 'DELETED' },
        date: { gte: sixMonthsAgo }
      },
      select: {
        date: true,
        grandTotal: true,
        amountPaid: true,
      }
    }),
    prisma.paymentReceipt.findMany({
      where: {
        date: { gte: sixMonthsAgo }
      },
      select: {
        date: true,
        amountReceived: true
      }
    })
  ]);

  // Financial aggregates
  const totalDue = invoiceTotals._sum.amountDue || 0;
  const totalCollected = invoiceTotals._sum.amountPaid || 0;
  const totalInvoiced = invoiceTotals._sum.grandTotal || 0;
  const totalReceiptsAmount = receiptsTotals._sum.amountReceived || 0;

  const totalInvoiceCount = parseCount(invoiceTotals._count);
  const totalReceiptsCount = parseCount(receiptsTotals._count);

  let overdueCount = 0;
  let paidCount = 0;
  let unpaidCount = 0;

  statusCounts.forEach((statusGroup) => {
    const count = parseCount(statusGroup._count);
    if (statusGroup.status === 'OVERDUE') overdueCount = count;
    if (statusGroup.status === 'PAID') paidCount = count;
    if (statusGroup.status === 'UNPAID' || statusGroup.status === 'PART_PAID') {
      unpaidCount += count;
    }
  });

  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  // Build Month Options List for selector
  let oldestDate = subMonths(now, 11);
  if (earliestInvoice?.date && earliestInvoice.date < oldestDate) {
    oldestDate = earliestInvoice.date;
  }
  if (earliestReceipt?.date && earliestReceipt.date < oldestDate) {
    oldestDate = earliestReceipt.date;
  }

  const monthOptions: MonthOption[] = [];
  let monthCursor = startOfMonth(now);
  const endCursor = startOfMonth(oldestDate);

  while (monthCursor >= endCursor) {
    const key = format(monthCursor, 'yyyy-MM');
    monthOptions.push({
      key,
      label: format(monthCursor, 'MMMM yyyy'),
      isCurrent: key === currentMonthKey
    });
    monthCursor = subMonths(monthCursor, 1);
  }

  // Build 6-Month Trend Breakdown
  const recentSixMonths: Array<{
    key: string;
    label: string;
    shortLabel: string;
    invoiced: number;
    collected: number;
    count: number;
    rate: number;
    isSelected: boolean;
  }> = [];

  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    const mKey = format(d, 'yyyy-MM');
    const mStart = startOfMonth(d);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    const mInvoices = trendInvoices.filter(inv => {
      const invDate = new Date(inv.date);
      return invDate >= mStart && invDate <= mEnd;
    });

    const mReceipts = trendReceipts.filter(rec => {
      const recDate = new Date(rec.date);
      return recDate >= mStart && recDate <= mEnd;
    });

    const invTotal = mInvoices.reduce((acc, curr) => acc + curr.grandTotal, 0);
    // Combined collected: cash receipts recorded or paid amounts on invoices
    const collTotal = mReceipts.length > 0 
      ? mReceipts.reduce((acc, curr) => acc + curr.amountReceived, 0)
      : mInvoices.reduce((acc, curr) => acc + curr.amountPaid, 0);

    const rate = invTotal > 0 ? Math.round((collTotal / invTotal) * 100) : 0;

    recentSixMonths.push({
      key: mKey,
      label: format(d, 'MMMM yyyy'),
      shortLabel: format(d, 'MMM yyyy'),
      invoiced: invTotal,
      collected: collTotal,
      count: mInvoices.length,
      rate,
      isSelected: selectedMonthKey === mKey,
    });
  }

  // Max invoiced amount for visual bar scaling
  const maxTrendInvoiced = Math.max(...recentSixMonths.map(m => m.invoiced), 1);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-xs text-gray-500 mt-1">
            Track sales, collections, and outstanding dues across all periods.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link 
            href="/receipts/new" 
            className="flex-1 sm:flex-none justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center text-sm font-medium shadow-xs"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Record Payment
          </Link>
          <Link 
            href="/invoices/new" 
            className="flex-1 sm:flex-none justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm font-medium shadow-xs"
          >
            <FileText className="w-4 h-4 mr-2" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Month Filter Selector */}
      <DashboardMonthSelector
        selectedMonth={selectedMonthKey}
        months={monthOptions}
        currentMonthKey={currentMonthKey}
      />
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total / Month Outstanding */}
        <div className="bg-white p-6 rounded-lg shadow-xs border border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">
              {isAllTime ? 'Total Outstanding' : `${selectedMonthLabel} Outstanding`}
            </h2>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ₹{totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {isAllTime 
              ? `${overdueCount} overdue invoices` 
              : `${overdueCount} overdue • ${unpaidCount} unpaid in period`}
          </p>
        </div>

        {/* Total / Month Collected */}
        <div className="bg-white p-6 rounded-lg shadow-xs border border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">
              {isAllTime ? 'Total Collected' : `${selectedMonthLabel} Collected`}
            </h2>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ₹{totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(collectionRate, 100)}%` }}></div>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
            <span>{collectionRate}% collection rate</span>
            {!isAllTime && totalReceiptsAmount > 0 && (
              <span>₹{totalReceiptsAmount.toLocaleString()} received</span>
            )}
          </div>
        </div>

        {/* Total / Month Invoiced */}
        <div className="bg-white p-6 rounded-lg shadow-xs border border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">
              {isAllTime ? 'Total Invoiced' : `${selectedMonthLabel} Invoiced`}
            </h2>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ₹{totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Across {totalInvoiceCount} {isAllTime ? 'total invoices' : 'invoices in period'}
          </p>
        </div>

        {/* Database Assets / Month Activity */}
        <div className="bg-white p-6 rounded-lg shadow-xs border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">
              {isAllTime ? 'Database Assets' : 'Period Activity'}
            </h2>
            {isAllTime ? <Users className="w-5 h-5 text-indigo-500" /> : <CalendarDays className="w-5 h-5 text-indigo-500" />}
          </div>
          {isAllTime ? (
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
          ) : (
            <div className="flex justify-between mt-2">
              <div>
                <p className="text-2xl font-semibold text-gray-900">{totalInvoiceCount}</p>
                <p className="text-xs text-gray-500">Invoices</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{totalReceiptsCount}</p>
                <p className="text-xs text-gray-500">Receipts</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{paidCount}</p>
                <p className="text-xs text-gray-500">Paid Invoices</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6-Month History Overview Section */}
      <div className="bg-white rounded-lg shadow-xs border border-gray-200 mb-8 p-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 pb-3 border-b border-gray-100 gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Recent Months History</h2>
            <p className="text-xs text-gray-500">Invoiced vs. collected summary over the last 6 months</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Invoiced
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Collected
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {recentSixMonths.map((m) => {
            const invoicedPercent = maxTrendInvoiced > 0 ? (m.invoiced / maxTrendInvoiced) * 100 : 0;
            const collectedPercent = m.invoiced > 0 ? (m.collected / m.invoiced) * 100 : 0;

            return (
              <Link
                key={m.key}
                href={`/?month=${m.key}`}
                className={`p-3 rounded-lg border transition-all text-left flex flex-col justify-between hover:shadow-sm ${
                  m.isSelected
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-800">{m.shortLabel}</span>
                    {m.key === currentMonthKey && (
                      <span className="px-1 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-700 rounded">
                        NOW
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {m.count} {m.count === 1 ? 'invoice' : 'invoices'}
                  </div>
                </div>

                <div>
                  {/* Visual relative bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${Math.max(invoicedPercent, 4)}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-semibold text-gray-900 truncate">
                    ₹{m.invoiced.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-green-700 font-medium">
                    {m.rate}% collected
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Invoices & Receipts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow-xs border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {isAllTime ? 'Recent Invoices' : `Invoices in ${selectedMonthLabel}`}
              </h2>
              {!isAllTime && (
                <p className="text-xs text-gray-500">Showing up to 5 latest invoices for this month</p>
              )}
            </div>
            <Link 
              href="/invoices" 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
            >
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="p-0">
            {recentInvoices.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentInvoices.map((inv) => (
                  <li key={inv.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <Link href={`/invoices/${inv.id}/preview`} className="text-sm font-medium text-blue-600 hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                        <p className="text-sm text-gray-500">{inv.client.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(inv.date || inv.createdAt), 'MMM d, yyyy')}
                        </p>
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
                <p className="text-sm font-medium text-gray-600">
                  {isAllTime ? 'No invoices created yet.' : `No invoices found in ${selectedMonthLabel}.`}
                </p>
                <Link 
                  href="/invoices/new" 
                  className="mt-3 inline-flex items-center text-xs text-blue-600 hover:underline font-medium"
                >
                  + Create an invoice
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Receipts */}
        <div className="bg-white rounded-lg shadow-xs border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {isAllTime ? 'Recent Receipts' : `Receipts in ${selectedMonthLabel}`}
              </h2>
              {!isAllTime && (
                <p className="text-xs text-gray-500">Showing up to 5 latest receipts for this month</p>
              )}
            </div>
            <Link 
              href="/receipts" 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
            >
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="p-0">
            {receipts.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {receipts.map((rec) => (
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
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(rec.date || rec.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Receipt className="mx-auto h-8 w-8 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-600">
                  {isAllTime ? 'No receipts recorded yet.' : `No receipts found in ${selectedMonthLabel}.`}
                </p>
                <Link 
                  href="/receipts/new" 
                  className="mt-3 inline-flex items-center text-xs text-blue-600 hover:underline font-medium"
                >
                  + Record a payment
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
