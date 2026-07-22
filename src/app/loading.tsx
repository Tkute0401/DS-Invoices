import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full h-[calc(100vh-100px)] flex items-center justify-center bg-gray-50/50">
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Loading Data...</h2>
        <p className="text-sm">Please wait while we fetch your information.</p>
      </div>
    </div>
  );
}
