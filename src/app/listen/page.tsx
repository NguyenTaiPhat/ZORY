import Link from 'next/link';
import type { Metadata } from 'next';
import prisma from '@/lib/db';
import { Headphones, Play, Star, BookOpen, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sách Nói Audio AI — ZORY Voice',
  description: 'Thưởng thức kho sách nói và truyện audio với công nghệ lồng tiếng ZORY Voice AI biểu cảm.',
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
        select: { id: true, chapterNumber: true, title: true, wordCount: true },
      },
      _count: { select: { chapters: true } },
    },
  });

  const featuredAudio = booksWithAudio[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Editorial Header Banner */}
      <div className="border border-border bg-surface p-6 sm:p-10 relative overflow-hidden shadow-xs">
        {/* Ambient literary glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10.5px] font-mono uppercase tracking-wider border border-primary/30 text-primary bg-primary/10">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                ZORY VOICE LAB • TEXT-TO-SPEECH
              </span>
              <span className="text-[11px] font-sans text-text-secondary">
                THẾ HỆ MỚI
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
              Thưởng Thức Sách Nói & Truyện Audio Đỉnh Cao
            </h1>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl">
              Chuyển văn bản tác phẩm thành giọng đọc truyền cảm với khả năng tự động nhận diện song ngữ Việt — Anh, tùy chỉnh tốc độ, hẹn giờ ngủ và đồng bộ tiến độ đọc xuyên suốt.
            </p>

            {/* Archival Spec Strip */}
            <div className="grid grid-cols-3 gap-3 py-3 border-y border-border/80 text-xs max-w-lg">
              <div>
                <span className="label-caps text-text-muted text-[10px] block mb-0.5">Giọng Đọc</span>
                <strong className="text-xs font-bold text-text-primary">Việt — Anh Chuẩn</strong>
              </div>
              <div>
                <span className="label-caps text-text-muted text-[10px] block mb-0.5">Tiến Độ</span>
                <strong className="text-xs font-bold text-text-primary">Đồng Bộ Thời Gian</strong>
              </div>
              <div>
                <span className="label-caps text-text-muted text-[10px] block mb-0.5">Công Nghệ</span>
                <strong className="text-xs font-bold text-text-primary">Neural TTS</strong>
              </div>
            </div>

            {featuredAudio && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href={`/listen/${featuredAudio.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-text-primary text-background hover:bg-primary hover:text-white text-xs font-bold uppercase tracking-wider transition shadow-sm rounded-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Nghe Tác Phẩm Tiêu Điểm</span>
                </Link>
                <Link
                  href={`/book/${featuredAudio.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border bg-surface-elevated hover:bg-border text-text-primary text-xs font-semibold transition rounded-sm"
                >
                  <BookOpen className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Xem Bản In</span>
                </Link>
              </div>
            )}
          </div>

          {/* Right Featured Audio Book Preview */}
          {featuredAudio && (
            <div className="hidden lg:flex lg:col-span-4 justify-end">
              <Link
                href={`/listen/${featuredAudio.slug}`}
                className="p-4 border border-border bg-surface-elevated/80 flex items-center gap-4 max-w-sm w-full group hover:border-primary transition shadow-xs"
              >
                <div className="w-24 aspect-[2/3] book-cover-frame book-spine-effect shrink-0">
                  <img
                    src={featuredAudio.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300'}
                    alt={featuredAudio.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1.5 min-w-0 flex-1">
                  <span className="label-caps text-primary text-[10px] block">TIÊU ĐIỂM TUẦN NÀY</span>
                  <h3 className="font-sans font-bold text-sm text-text-primary line-clamp-2 group-hover:text-primary transition leading-snug">
                    {featuredAudio.title}
                  </h3>
                  <p className="text-[11px] text-text-muted truncate">
                    {featuredAudio.authorName}
                  </p>
                  <div className="text-[10px] text-text-secondary flex items-center gap-2 pt-1 border-t border-border/60">
                    <span className="text-amber-500 font-bold">★ {featuredAudio.ratingAvg.toFixed(1)}</span>
                    <span>•</span>
                    <span>{featuredAudio._count.chapters} chương</span>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Danh sách truyện audio */}
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-primary" />
            <h2 className="text-base sm:text-lg font-bold text-text-primary font-sans">
              Danh Mục Sách Nói Sẵn Sàng Nghe Audio
            </h2>
          </div>
          <span className="label-caps text-text-secondary">
            {booksWithAudio.length} ẤN BẢN AUDIO
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {booksWithAudio.map((book) => (
            <div
              key={book.id}
              className="p-4 border border-border bg-surface hover:border-primary transition group flex gap-4 shadow-2xs hover:shadow-xs"
            >
              {/* Book Sleeve Cover with Spine Effect */}
              <Link
                href={`/listen/${book.slug}`}
                className="w-20 sm:w-24 aspect-[2/3] book-cover-frame book-spine-effect shrink-0 relative overflow-hidden bg-surface-elevated"
              >
                <img
                  src={book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300'}
                  alt={book.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              </Link>

              {/* Card Body */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-500" />
                      <span>{book.ratingAvg.toFixed(1)}</span>
                    </span>
                    <span className="label-caps text-text-muted text-[10px]">
                      {book._count.chapters} CHƯƠNG AUDIO
                    </span>
                  </div>

                  <Link
                    href={`/listen/${book.slug}`}
                    className="font-sans font-bold text-sm sm:text-base text-text-primary group-hover:text-primary transition line-clamp-2 leading-snug"
                  >
                    {book.title}
                  </Link>

                  <p className="text-xs text-text-secondary truncate">
                    {book.authorName}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <Link
                    href={`/listen/${book.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-text-primary text-background hover:bg-primary hover:text-white text-xs font-bold uppercase tracking-wider transition rounded-sm shadow-2xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Nghe ngay</span>
                  </Link>

                  <Link
                    href={`/book/${book.slug}`}
                    className="p-1.5 border border-border bg-surface-elevated hover:bg-border text-text-secondary hover:text-text-primary transition rounded-sm"
                    title="Đọc văn bản in"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
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
