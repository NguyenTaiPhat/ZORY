import React from 'react';
import { Skeleton, TextLinesSkeleton } from '@/components/ui/Skeleton';

export default function ReaderChapterLoading() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      {/* Top Reader Navigation Bar Skeleton */}
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-surface/90 backdrop-blur-md px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </header>

      {/* Reader Text Area Skeleton */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-16 space-y-8">
        <div className="text-center space-y-3 pb-6 border-b border-border/50">
          <Skeleton className="h-7 sm:h-9 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>

        <div className="space-y-6 pt-4">
          <TextLinesSkeleton lines={4} />
          <TextLinesSkeleton lines={5} />
          <TextLinesSkeleton lines={3} />
          <TextLinesSkeleton lines={4} />
        </div>
      </main>
    </div>
  );
}
