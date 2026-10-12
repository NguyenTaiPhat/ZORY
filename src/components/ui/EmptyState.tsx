import Link from 'next/link';
import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: EmptyStateProps) {
  return (
    <div className="motion-reveal motion-reveal-visible flex min-h-[260px] flex-col items-center justify-center border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="font-display text-xl font-bold text-text-primary">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">{description}</p>
      {(actionHref && actionLabel) || (secondaryHref && secondaryLabel) ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {actionHref && actionLabel && (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center border border-border bg-text-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-background transition hover:bg-primary hover:text-white"
            >
              {actionLabel}
            </Link>
          )}
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center border border-border bg-surface-elevated px-4 py-2.5 text-xs font-semibold text-text-primary transition hover:border-primary hover:text-primary"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
