import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function GenresLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 sm:space-y-8 min-w-0">
      <div className="space-y-2 max-w-full">
        <Skeleton className="h-8 w-48 sm:w-56 max-w-full" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full min-w-0">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-3 w-full min-w-0"
          >
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-5 w-28 sm:w-32 max-w-[65%]" />
              <Skeleton className="h-4 w-14 sm:w-16 shrink-0" />
            </div>
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
