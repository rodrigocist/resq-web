"use client";

export default function OrdersSkeletonLoader() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="w-full bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="h-5 w-32 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md animate-pulse"></div>
              <div className="h-3 w-24 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md animate-pulse mt-2"></div>
            </div>
            <div className="h-6 w-24 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full animate-pulse flex-shrink-0"></div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100"></div>

          {/* Details grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex gap-3 min-w-0">
                <div className="h-4 w-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md animate-pulse flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-3 w-16 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md animate-pulse"></div>
                  <div className="h-4 w-32 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md animate-pulse mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

