import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function NewStudioProjectLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <Skeleton className="h-4 w-36" />

      <div className="border border-border bg-surface p-6 sm:p-10 space-y-6 shadow-xs">
        <div className="space-y-1.5 pb-4 border-b border-border">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 sm:h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

        {/* AI Prompt Box Skeleton */}
        <div className="p-4 border border-primary/20 bg-primary/5 space-y-2.5">
          <Skeleton className="h-3.5 w-44" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Premise Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-24 w-full" />
        </div>

        {/* Title Input Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Selects Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Submit Button Skeleton */}
        <div className="pt-2">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
