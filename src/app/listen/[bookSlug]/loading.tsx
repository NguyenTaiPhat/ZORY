import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BookListenLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Top Navigation Bar Skeleton */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-sm" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Main Console Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border border-border bg-surface">
        {/* Left Column (Book Jacket) */}
        <div className="lg:col-span-5 p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-border flex flex-col items-center justify-center bg-surface-elevated/40 space-y-4">
          <Skeleton className="w-52 sm:w-60 aspect-[2/3] shadow-md book-spine-effect" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-12 w-64 max-w-full" />
        </div>

        {/* Right Column (Controls & Timeline) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>

            <Skeleton className="h-7 sm:h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />

            {/* Spoken Line Preview Skeleton */}
            <div className="p-4 border border-border bg-surface-elevated/70 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            {/* Timeline Scrubber Skeleton */}
            <div className="space-y-2 pt-2">
              <Skeleton className="w-full h-1.5" />
              <div className="flex justify-between">
                <Skeleton className="h-2.5 w-10" />
                <Skeleton className="h-2.5 w-10" />
              </div>
            </div>
          </div>

          {/* Player Action Buttons Skeleton */}
          <div className="pt-4 border-t border-border flex items-center justify-center gap-4">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-9 h-9 rounded-full" />
          </div>
        </div>
      </div>

      {/* Manuscript Transcript Skeleton */}
      <div className="border border-border bg-surface p-8 sm:p-12 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="space-y-3 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}
