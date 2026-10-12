import React from 'react';
import { Skeleton, BookCoverSkeleton, TextLinesSkeleton } from '@/components/ui/Skeleton';

export default function BookDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Book Metadata & Hero Skeleton */}
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
        {/* Bìa sách 2:3 */}
        <div className="w-52 sm:w-64 shrink-0 mx-auto md:mx-0">
          <BookCoverSkeleton />
        </div>

        {/* Thông tin tác phẩm */}
        <div className="flex-1 space-y-5 w-full">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-8 sm:h-10 w-4/5" />
            <Skeleton className="h-4 w-40" />
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 py-3 border-y border-border">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
          </div>

          {/* Tóm tắt */}
          <div className="space-y-2 pt-1">
            <Skeleton className="h-4 w-28" />
            <TextLinesSkeleton lines={4} />
          </div>

          {/* Action CTA Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Skeleton className="h-11 w-40" />
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-11" />
          </div>
        </div>
      </div>

      {/* Chapters Preview List Skeleton */}
      <div className="border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-3 border border-border bg-surface-elevated flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
