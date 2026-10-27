'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, BarChart3, RotateCcw, Loader2 } from 'lucide-react';

export type MonthOption = {
  key: string;
  label: string;
  isCurrent?: boolean;
};

interface DashboardMonthSelectorProps {
  selectedMonth: string; // 'all' or 'YYYY-MM'
  months: MonthOption[];
  currentMonthKey: string;
}

export default function DashboardMonthSelector({
  selectedMonth,
  months,
  currentMonthKey,
}: DashboardMonthSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isAllTime = selectedMonth === 'all';
  const isThisMonth = selectedMonth === currentMonthKey;

  const handleSelect = (monthKey: string) => {
    startTransition(() => {
      if (monthKey === 'all') {
        router.push('/');
      } else {
        router.push(`/?month=${encodeURIComponent(monthKey)}`);
      }
    });
  };

  // Find index in months array (months are ordered newest to oldest)
  const currentIndex = months.findIndex((m) => m.key === selectedMonth);
  // Newer month is index - 1
  const hasNewer = currentIndex > 0;
  // Older month is index + 1
  const hasOlder = currentIndex !== -1 && currentIndex < months.length - 1;

  const handlePrev = () => {
    if (hasOlder) {
      handleSelect(months[currentIndex + 1].key);
    }
  };

  const handleNext = () => {
    if (hasNewer) {
      handleSelect(months[currentIndex - 1].key);
    }
  };

  const currentOption = months.find((m) => m.key === selectedMonth);

  return (
    <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-xs mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Quick period tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleSelect('all')}
            disabled={isPending}
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isAllTime
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-1.5" />
            All Time (Total)
          </button>

          <button
            type="button"
            onClick={() => handleSelect(currentMonthKey)}
            disabled={isPending}
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isThisMonth
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            This Month
          </button>

          {/* Stepper buttons (visible when a specific month is selected) */}
          {!isAllTime && (
            <div className="flex items-center gap-1 ml-1 border-l border-gray-200 pl-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!hasOlder || isPending}
                title="Older Month"
                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!hasNewer || isPending}
                title="Newer Month"
                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Dropdown Month Selector */}
        <div className="flex items-center gap-2">
          {isPending && (
            <div className="flex items-center text-xs text-blue-600 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              Updating...
            </div>
          )}

          <div className="relative inline-flex items-center w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none" />
            <select
              aria-label="Select month"
              value={selectedMonth}
              onChange={(e) => handleSelect(e.target.value)}
              disabled={isPending}
              className="w-full sm:w-auto appearance-none pl-9 pr-9 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-800 shadow-2xs hover:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">📊 All Time (Total)</option>
              <optgroup label="Month History">
                {months.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label} {m.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </optgroup>
            </select>
            <span className="pointer-events-none absolute right-3 text-gray-400 text-xs">▼</span>
          </div>

          {!isAllTime && (
            <button
              type="button"
              onClick={() => handleSelect('all')}
              disabled={isPending}
              title="Reset to All Time"
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Info Strip */}
      <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
          {isAllTime ? (
            <span>Showing all-time cumulative metrics across the entire system.</span>
          ) : (
            <span>
              Showing stats for{' '}
              <strong className="text-gray-800 font-semibold">{currentOption?.label || selectedMonth}</strong>.
            </span>
          )}
        </div>
        {!isAllTime && (
          <button
            type="button"
            onClick={() => handleSelect('all')}
            className="text-blue-600 hover:underline font-medium"
          >
            Switch to All Time
          </button>
        )}
      </div>
    </div>
  );
}
