import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-sm bg-surface-elevated/90 border border-border/40',
        className
      )}
      {...props}
    />
  );
}

/**
 * Khung mô phỏng bìa sách chuẩn tỷ lệ 2:3 với hiệu ứng gáy sách cổ điển
 */
export function BookCoverSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('aspect-[2/3] w-full relative overflow-hidden rounded-sm book-spine-effect', className)}>
      <Skeleton className="w-full h-full" />
    </div>
  );
}

/**
 * Khung thẻ sách trong danh mục (Grid / Catalog Card Skeleton)
 */
export function BookCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-2.5 sm:p-3 border border-border bg-surface">
      <BookCoverSkeleton />
      <div className="space-y-1.5 pt-1">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-2.5 w-1/3" />
          <Skeleton className="h-2.5 w-1/4" />
        </div>
      </div>
    </div>
  );
}

/**
 * Mô phỏng khối dòng văn bản văn học
 */
export function TextLinesSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3.5', i === lines - 1 ? 'w-3/5' : 'w-full')}
        />
      ))}
    </div>
  );
}
