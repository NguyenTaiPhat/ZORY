'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface RecentProgressData {
  progressPercent: number;
  book: {
    title: string;
    slug: string;
    coverUrl: string | null;
  };
  chapter: {
    chapterNumber: number;
    title: string;
  };
}

export function RecentProgress() {
  const [progress, setProgress] = useState<RecentProgressData | null>(null);

  useEffect(() => {
    fetch('/api/reader/progress?recent=1')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setProgress(data?.progress || null))
      .catch(() => {});
  }, []);

  if (!progress) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="p-4 rounded-md border border-border bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <img
            src={progress.book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120'}
            alt={progress.book.title}
            className="w-10 h-14 object-cover rounded-sm border border-border flex-shrink-0"
          />
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="label-caps text-primary">Đang đọc dở</span>
              <span className="text-[11px] text-text-muted">
                • Tiến độ: {Math.round(progress.progressPercent)}%
              </span>
            </div>
            <h2 className="text-sm font-bold text-text-primary truncate">{progress.book.title}</h2>
            <p className="text-xs text-text-secondary truncate">
              Chương {progress.chapter.chapterNumber}: {progress.chapter.title}
            </p>
          </div>
        </div>

        <Link
          href={`/read/${progress.book.slug}/${progress.chapter.chapterNumber}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-surface-elevated hover:bg-border border border-border text-xs font-bold text-text-primary uppercase tracking-wider transition flex-shrink-0"
        >
          <span>Tiếp tục đọc</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
