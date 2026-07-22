import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export default function Loading() {
  return (
    <div className="p-8 max-w-7xl mx-auto animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <div className="bg-black/10 px-4 py-2 rounded-md flex items-center h-[40px] w-[140px]">
          <Skeleton className="h-4 w-4 mr-2 rounded-full" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
      
      {/* Table Skeleton */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex items-center">
          <Skeleton className="h-10 w-[300px] rounded-md" />
        </div>
        
        <div className="rounded-md border border-gray-200">
          {/* Table Header */}
          <div className="border-b border-gray-200 bg-gray-50 p-4 grid grid-cols-7 gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16 justify-self-end" />
            <Skeleton className="h-4 w-20 justify-self-end" />
            <Skeleton className="h-4 w-16 justify-self-center" />
            <Skeleton className="h-4 w-4 justify-self-end" />
          </div>
          
          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 grid grid-cols-7 gap-4 items-center bg-white">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24 justify-self-end" />
                <Skeleton className="h-4 w-20 justify-self-end" />
                <Skeleton className="h-6 w-20 rounded-full justify-self-center" />
                <Skeleton className="h-8 w-8 rounded-md justify-self-end" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
