import React from 'react';
import { Skeleton, BookCardSkeleton } from '@/components/ui/Skeleton';

export default function RootLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-12">
      {/* Hero Banner Skeleton */}
      <div className="border border-border bg-surface p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-4 w-full">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 sm:h-12 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex items-center gap-3 pt-3">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="w-48 sm:w-56 shrink-0 aspect-[2/3] border border-border bg-surface-elevated/70">
          <Skeleton className="w-full h-full" />
        </div>
      </div>

      {/* Featured Books Grid Skeleton */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
