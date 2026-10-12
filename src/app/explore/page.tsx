import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/lib/db';
import { formatNumber } from '@/lib/utils';
import { Star, Filter, Search, BookOpen, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Khám Phá Truyện Hay',
  description: 'Kho tàng tiểu thuyết, truyện dịch, sáng tác AI phong phú và đặc sắc nhất.',
};

interface ExploreProps {
  searchParams: Promise<{
    genre?: string;
    status?: string;
    sort?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: ExploreProps) {
  const params = await searchParams;
  const currentGenre = params.genre || '';
  const currentStatus = params.status || 'all';
  const currentSort = params.sort || 'popular';
  const currentSearch = params.search || '';
  const currentPage = Math.max(1, parseInt(params.page || '1'));
  const pageSize = 12;

  const where: any = { publishStatus: 'PUBLISHED' };

  if (currentGenre) {
    where.genres = {
      some: {
        genre: { slug: currentGenre },
      },
    };
  }

  if (currentStatus !== 'all') {
    where.status = currentStatus;
  }

  if (currentSearch) {
    where.OR = [
      { title: { contains: currentSearch } },
      { summary: { contains: currentSearch } },
      { authorName: { contains: currentSearch } },
    ];
  }

  let orderBy: any = { readCount: 'desc' };
  if (currentSort === 'latest') orderBy = { updatedAt: 'desc' };
  if (currentSort === 'rating') orderBy = { ratingAvg: 'desc' };

  const [books, total, allGenres] = await Promise.all([
    prisma.book.findMany({
      where,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      orderBy,
      include: {
        genres: { include: { genre: true } },
        _count: { select: { chapters: true } },
      },
    }),
    prisma.book.count({ where }),
    prisma.genre.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Search */}
      <div className="space-y-4 border-b border-border pb-6">
        <div>
          <span className="label-caps text-text-muted">Lưu Trữ Tác Phẩm</span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Kho Tác Phẩm Văn Học & Sáng Tác
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-text-secondary">
          Khám phá danh mục toàn bộ tác phẩm trên nền tảng ZORY với các bộ lọc phân cấp.
        </p>

        {/* Minimal Search Bar */}
        <form method="GET" action="/explore" className="relative max-w-lg pt-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-text-muted" />
          <input
            type="text"
            name="search"
            defaultValue={currentSearch}
            placeholder="Tìm theo tựa truyện, tên tác giả hoặc nội dung tóm tắt..."
            className="w-full pl-10 pr-24 py-2 text-xs bg-surface border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary"
          />
          <button
            type="submit"
            className="absolute right-1 top-1.5 px-3 py-1 rounded-sm bg-text-primary text-background text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Bộ Lọc (Genres, Status, Sắp xếp) */}
      <div className="bg-surface rounded-md border border-border p-5 space-y-4 shadow-sm">
        {/* Thể loại */}
        <div className="space-y-2">
          <span className="label-caps text-text-muted">
            Thể loại:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/explore?genre=&status=${currentStatus}&sort=${currentSort}&search=${currentSearch}`}
              className={`px-2.5 py-1 rounded-sm text-xs font-semibold transition ${
                !currentGenre
                  ? 'bg-text-primary text-background'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-border'
              }`}
            >
              Tất cả
            </Link>
            {allGenres.map((g) => (
              <Link
                key={g.slug}
                href={`/explore?genre=${g.slug}&status=${currentStatus}&sort=${currentSort}&search=${currentSearch}`}
                className={`px-2.5 py-1 rounded-sm text-xs font-semibold transition ${
                  currentGenre === g.slug
                    ? 'bg-text-primary text-background'
                    : 'bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-border'
                }`}
              >
                {g.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Trạng thái & Sắp xếp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
          {/* Trạng thái */}
          <div className="flex items-center gap-2">
            <span className="label-caps text-text-muted">
              Tình trạng:
            </span>
            <div className="flex gap-1.5">
              {[
                { label: 'Tất cả', val: 'all' },
                { label: 'Đang ra', val: 'ONGOING' },
                { label: 'Trọn bộ', val: 'COMPLETED' },
              ].map((s) => (
                <Link
                  key={s.val}
                  href={`/explore?genre=${currentGenre}&status=${s.val}&sort=${currentSort}&search=${currentSearch}`}
                  className={`px-2 py-0.5 rounded-sm text-xs font-semibold transition ${
                    currentStatus === s.val
                      ? 'bg-surface-elevated border border-border text-text-primary font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-2 sm:justify-end">
            <span className="label-caps text-text-muted">
              Xếp theo:
            </span>
            <div className="flex gap-1.5">
              {[
                { label: 'Lượt đọc', val: 'popular' },
                { label: 'Mới nhất', val: 'latest' },
                { label: 'Đánh giá', val: 'rating' },
              ].map((so) => (
                <Link
                  key={so.val}
                  href={`/explore?genre=${currentGenre}&status=${currentStatus}&sort=${so.val}&search=${currentSearch}`}
                  className={`px-2 py-0.5 rounded-sm text-xs font-semibold transition ${
                    currentSort === so.val
                      ? 'bg-surface-elevated border border-border text-text-primary font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {so.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Kết quả & Danh sách sách */}
      {books.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-md border border-border space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-text-muted opacity-40" />
          <h3 className="font-display text-lg font-bold text-text-primary">
            Không tìm thấy bản thảo phù hợp
          </h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Hãy thử tìm kiếm với từ khóa khác hoặc thiết lập lại bộ lọc.
          </p>
          <Link
            href="/explore"
            className="inline-block mt-2 px-4 py-2 rounded-sm bg-text-primary text-background text-xs font-bold uppercase tracking-wider"
          >
            Đặt lại bộ lọc
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/book/${book.slug}`}
                className="group flex flex-col space-y-2 p-2 rounded-sm hover:bg-surface border border-transparent hover:border-border transition"
              >
                <div className="book-cover-frame aspect-[2/3] w-full bg-surface-elevated relative">
                  <img
                    src={book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-sm bg-black/80 text-[10px] font-bold text-white">
                    ★ {book.ratingAvg.toFixed(1)}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-xs text-text-primary line-clamp-1 group-hover:text-primary transition">
                    {book.title}
                  </h3>
                  <p className="text-[11px] text-text-muted truncate">
                    {book.authorName}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-text-muted pt-0.5 border-t border-border/50">
                    <span>{formatNumber(book.readCount)} đọc</span>
                    <span className="font-semibold text-text-primary">
                      {book._count.chapters} chương
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-6 border-t border-border">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/explore?genre=${currentGenre}&status=${currentStatus}&sort=${currentSort}&search=${currentSearch}&page=${p}`}
                  className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs font-bold transition ${
                    p === currentPage
                      ? 'bg-text-primary text-background'
                      : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-text-primary'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
