import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function StudioProjectLoading() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 min-w-0 max-w-full overflow-x-hidden">
      {/* Workbench Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-border min-w-0 max-w-full">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <Skeleton className="w-8 h-8 rounded-sm shrink-0" />
          <div className="space-y-1.5 min-w-0 flex-1">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-6 sm:h-7 w-64 max-w-full" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>

        {/* Tab Switcher & Action Buttons Skeleton */}
        <div className="flex items-center justify-start sm:justify-end gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto min-w-0 pb-1">
          <Skeleton className="h-8 w-64 rounded-sm shrink-0" />
          <Skeleton className="h-8 w-20 rounded-sm shrink-0" />
          <Skeleton className="h-8 w-32 rounded-sm shrink-0" />
          <Skeleton className="h-8 w-24 rounded-sm shrink-0" />
        </div>
      </div>

      {/* Main Workspace Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start min-w-0 max-w-full">
        {/* Left Column (3 cols): Sidebar chapters & synopsis */}
        <div className="hidden lg:block lg:col-span-3 space-y-4 min-w-0">
          {/* Project Premise Box */}
          <div className="border border-border bg-surface p-3.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-3.5 h-3.5 rounded-xs" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>

          {/* Chapters Table of Contents Box */}
          <div className="border border-border bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="w-6 h-6 rounded-xs" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-12 w-full rounded-xs" />
              <Skeleton className="h-12 w-full rounded-xs" />
              <Skeleton className="h-12 w-full rounded-xs" />
              <Skeleton className="h-12 w-full rounded-xs" />
            </div>
          </div>
        </div>

        {/* Right Column (9 cols): Editor & Action Toolbar */}
        <div className="lg:col-span-9 border border-border bg-surface p-3.5 sm:p-7 space-y-4 min-w-0 max-w-full overflow-x-hidden">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-border min-w-0">
            {/* AI Action Tools */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Skeleton className="h-7 w-24 rounded-xs" />
              <Skeleton className="h-7 w-24 rounded-xs" />
              <Skeleton className="h-7 w-20 rounded-xs" />
              <Skeleton className="h-7 w-16 rounded-xs" />
              <Skeleton className="h-7 w-28 rounded-xs" />
            </div>

            {/* Word Count & Save Button */}
            <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-28 rounded-xs" />
            </div>
          </div>

          {/* Chapter Guidance Outline */}
          <div className="p-3 border border-border/80 bg-surface-elevated/70 space-y-1.5">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          {/* Chapter Title Input Skeleton */}
          <div className="pb-2 border-b border-border">
            <Skeleton className="h-8 sm:h-9 w-2/3 max-w-md" />
          </div>

          {/* Textarea Prose Editor Skeleton */}
          <div className="box-border p-4 sm:p-6 border border-border bg-surface-elevated min-h-[380px] sm:min-h-[460px] space-y-3.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
