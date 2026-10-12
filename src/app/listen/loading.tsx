import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ListenLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Editorial Header Banner Skeleton */}
      <div className="border border-border bg-surface p-6 sm:p-10 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-4 w-20" />
            </div>

            <Skeleton className="h-9 sm:h-10 w-96 max-w-full" />
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-4/5 max-w-lg" />

            {/* Spec Strip Skeleton */}
            <div className="grid grid-cols-3 gap-3 py-3 border-y border-border/80 max-w-lg">
              <div>
                <Skeleton className="h-3 w-14 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div>
                <Skeleton className="h-3 w-14 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div>
                <Skeleton className="h-3 w-14 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="h-9 w-44" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>

          <div className="hidden lg:flex lg:col-span-4 justify-end">
            <div className="p-4 border border-border bg-surface-elevated/80 flex items-center gap-4 max-w-sm w-full">
              <Skeleton className="w-24 aspect-[2/3] shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2 pt-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danh mục sách nói Section Bar Skeleton */}
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-sm" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Horizontal Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-4 border border-border bg-surface flex gap-4 shadow-2xs"
            >
              <Skeleton className="w-20 sm:w-24 aspect-[2/3] shrink-0 book-spine-effect" />
              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 sm:h-5 w-5/6" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-7 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
