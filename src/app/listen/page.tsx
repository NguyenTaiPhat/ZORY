import Link from 'next/link';
import type { Metadata } from 'next';
import prisma from '@/lib/db';
import { Headphones, Play, Star, BookOpen, Volume2 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Sách Nói Audio AI',
  description: 'Thưởng thức kho sách nói và truyện audio với công nghệ lồng tiếng AI biểu cảm.',
};

export default async function ListenOverviewPage() {
  const booksWithAudio = await prisma.book.findMany({
    where: { publishStatus: 'PUBLISHED' },
    orderBy: { readCount: 'desc' },
    take: 12,
    include: {
      genres: { include: { genre: true } },
      chapters: {
        orderBy: { chapterNumber: 'asc' },
        take: 1,
        select: { id: true, chapterNumber: true, title: true },
      },
      _count: { select: { chapters: true } },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-purple-800 text-white p-8 md:p-12 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
            <Volume2 className="w-4 h-4" />
            <span>ZORY VOICE — CÔNG NGHỆ TEXT-TO-SPEECH</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Thưởng Thức Sách Nói & Truyện Audio Đỉnh Cao
          </h1>

          <p className="text-white/80 text-sm leading-relaxed">
            Chuyển văn bản thành giọng đọc truyền cảm với khả năng tùy chỉnh tốc độ,
            hẹn giờ ngủ, điều khiển rảnh tay và đồng bộ tiến độ đọc xuyên suốt.
          </p>
        </div>
      </div>

      {/* Danh sách truyện audio */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" />
            <span>Tác Phẩm Sẵn Sàng Nghe Audio</span>
          </h2>
          <span className="text-xs text-text-secondary">
            {booksWithAudio.length} tác phẩm
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {booksWithAudio.map((book) => (
            <div
              key={book.id}
              className="p-4 rounded-2xl bg-surface border border-border hover:border-primary transition group flex gap-4 card-hover"
            >
              <img
                src={book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300'}
                alt={book.title}
                className="w-24 h-32 object-cover rounded-xl border border-border flex-shrink-0"
              />

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{book.ratingAvg.toFixed(1)}</span>
                    <span className="text-text-secondary font-normal">
                      • {book._count.chapters} chương
                    </span>
                  </div>

                  <Link
                    href={`/listen/${book.slug}`}
                    className="font-bold text-sm text-text-primary group-hover:text-primary truncate block"
                  >
                    {book.title}
                  </Link>

                  <p className="text-xs text-text-secondary truncate">
                    {book.authorName}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href={`/listen/${book.slug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Nghe ngay</span>
                  </Link>

                  <Link
                    href={`/book/${book.slug}`}
                    className="p-1.5 rounded-lg border border-border bg-surface-elevated text-text-secondary hover:text-text-primary transition"
                    title="Đọc văn bản"
                  >
                    <BookOpen className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
