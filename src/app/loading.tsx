import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Receipt, Users, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <Skeleton className="h-[38px] w-[150px] rounded-md" />
          <Skeleton className="h-[38px] w-[150px] rounded-md" />
        </div>
      </div>
      
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="h-9 w-[150px] mt-2" />
            <Skeleton className="h-3 w-[100px] mt-4" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Invoices</h2>
            <Skeleton className="h-4 w-[60px]" />
          </div>
          <div className="p-0">
            <ul className="divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="p-5">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Skeleton className="h-4 w-[80px]" />
                      <Skeleton className="h-4 w-[60px] rounded" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recent Receipts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Receipts</h2>
            <Skeleton className="h-4 w-[60px]" />
          </div>
          <div className="p-0">
            <ul className="divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="p-5">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Skeleton className="h-4 w-[80px]" />
                      <Skeleton className="h-3 w-[80px]" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
