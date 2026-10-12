import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 6 Metric tiles Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-3.5 sm:p-4 border border-border bg-surface flex flex-col justify-between min-h-[92px] sm:min-h-[104px]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="w-6 h-3" />
            </div>
            <div className="space-y-1.5 mt-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Provider Status Terminal Panels Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="p-4 sm:p-6 border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="space-y-3 pt-1">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-36" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="space-y-3 pt-1">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-28" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-36" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Feed Skeleton */}
      <div className="p-4 sm:p-6 border border-border bg-surface space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3.5 w-16" />
        </div>
        <div className="space-y-2 pt-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 border border-border bg-surface-elevated flex items-center justify-between">
              <Skeleton className="h-3.5 w-64" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
