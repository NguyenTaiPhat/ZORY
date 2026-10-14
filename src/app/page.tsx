import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  BookOpen,
  Headphones,
  ArrowRight,
  Bookmark,
  Sparkles,
  Star,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { formatNumber, formatDateVi } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

const getCachedHomepageData = unstable_cache(
  async () => {
    const [featuredBook, popularBooks, latestBooks, completedBooks, genres] = await Promise.all([
      prisma.book.findFirst({
        where: { isFeatured: true, publishStatus: 'PUBLISHED' },
        include: {
          genres: { include: { genre: true } },
          chapters: {
            orderBy: { chapterNumber: 'asc' },
            take: 3,
            select: { id: true, chapterNumber: true, title: true, wordCount: true },
          },
        },
      }),
      prisma.book.findMany({
        where: { publishStatus: 'PUBLISHED' },
        take: 6,
        orderBy: { readCount: 'desc' },
        include: {
          genres: { include: { genre: true } },
          _count: { select: { chapters: true } },
        },
      }),
      prisma.book.findMany({
        where: { publishStatus: 'PUBLISHED' },
        take: 4,
        orderBy: { updatedAt: 'desc' },
        include: {
          genres: { include: { genre: true } },
          chapters: {
            orderBy: { chapterNumber: 'desc' },
            take: 1,
            select: { chapterNumber: true, title: true, updatedAt: true },
          },
        },
      }),
      prisma.book.findMany({
        where: { status: 'COMPLETED', publishStatus: 'PUBLISHED' },
        take: 4,
        include: {
          genres: { include: { genre: true } },
        },
      }),
      prisma.genre.findMany({
        take: 12,
        include: {
          _count: { select: { books: true } },
        },
      }),
    ]);

    return { featuredBook, popularBooks, latestBooks, completedBooks, genres };
  },
  ['homepage-data-v1'],
  { revalidate: 60 }
);

export default async function HomePage() {
  const [user, homepageData] = await Promise.all([getCurrentUser(), getCachedHomepageData()]);
  const { featuredBook, popularBooks, latestBooks, completedBooks, genres } = homepageData;

  // 6. Lịch sử đọc dở
  let recentProgress = null;
  if (user) {
    recentProgress = await prisma.readingProgress.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        book: {
          select: {
            title: true,
            slug: true,
            coverUrl: true,
            authorName: true,
          },
        },
        chapter: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
          },
        },
      },
    });
  }

  const hasPublishedBooks = Boolean(
    featuredBook || popularBooks.length || latestBooks.length || completedBooks.length
  );

  return (
    <div className="w-full space-y-16 pb-20">
      {!hasPublishedBooks ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16">
          <EmptyState
            icon={<BookOpen className="h-7 w-7" />}
            title="Thư viện đang chờ chương đầu tiên"
            description="ZORY hiện chưa có tác phẩm nào được phát hành. Hãy khám phá các thể loại hoặc trở thành người mở đầu thư viện bằng một bản thảo mới."
            actionHref="/genres"
            actionLabel="Khám phá thể loại"
            secondaryHref="/studio/new"
            secondaryLabel="Tạo bản thảo"
          />
        </section>
      ) : (
        <>
      {/* 1. HERO SECTION — EDITORIAL MONOLITH SPREAD */}
      {featuredBook && (
        <section className="border-b border-border bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
            {/* Editorial Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3 mb-6 sm:mb-8 gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="label-caps text-text-muted font-bold text-[10px] sm:text-xs">
                  Bản Thảo Tiêu Biểu Tuần 41
                </span>
                <span className="hidden sm:inline text-border-strong">•</span>
                <span className="text-[11px] sm:text-xs font-semibold text-text-secondary">
                  Ấn bản số 01 / Tuyển chọn bởi ZORY Editorial
                </span>
              </div>
              <span className="self-start sm:self-auto label-caps text-primary text-[10px] sm:text-xs">
                Đang phát hành
              </span>
            </div>

            {/* Main Editorial Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              {/* Left Column (7 cols): Story typography & Editorial Excerpt */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {featuredBook.genres.map((g) => (
                      <Link
                        key={g.genre.slug}
                        href={`/genres/${g.genre.slug}`}
                        className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-surface-elevated border border-border text-text-secondary hover:text-text-primary hover:border-text-primary transition"
                      >
                        {g.genre.name}
                      </Link>
                    ))}
                  </div>

                  <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight leading-snug break-words">
                    {featuredBook.title}
                  </h1>

                  <p className="text-xs font-semibold tracking-wider uppercase text-text-muted">
                    Sáng tác bởi <span className="text-text-primary font-bold">{featuredBook.authorName || 'Tiêu Dao Mặc Khách'}</span>
                  </p>
                </div>

                {/* Literary Pull-Quote Excerpt */}
                <div className="border-l-2 border-primary pl-3.5 sm:pl-4 py-1 text-xs sm:text-sm text-text-secondary leading-relaxed font-serif italic bg-surface-elevated/40 rounded-r-md">
                  &ldquo;Gió đêm thổi qua dãy núi Thương Vân mang theo cái lạnh cắt da... Bàn tay hắn chạm vào khe nứt sâu, luồng ánh sáng chàm từ cổ thạch bùng phát, đánh dấu khởi đầu của kẻ nghịch thiên cải mệnh.&rdquo;
                </div>

                {/* Overview Text */}
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed line-clamp-3">
                  {featuredBook.summary}
                </p>

                {/* Archival Metadata Strip */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 py-3 border-y border-border text-xs text-center sm:text-left">
                  <div>
                    <span className="block label-caps text-text-muted text-[10px] sm:text-[11px] mb-0.5">Số chương</span>
                    <strong className="text-xs sm:text-sm font-bold text-text-primary">
                      {featuredBook.chapters.length} chương
                    </strong>
                  </div>
                  <div>
                    <span className="block label-caps text-text-muted text-[10px] sm:text-[11px] mb-0.5">Lượt đọc</span>
                    <strong className="text-xs sm:text-sm font-bold text-text-primary">
                      {formatNumber(featuredBook.readCount)}
                    </strong>
                  </div>
                  <div>
                    <span className="block label-caps text-text-muted text-[10px] sm:text-[11px] mb-0.5">Đánh giá</span>
                    <strong className="text-xs sm:text-sm font-bold text-text-primary flex items-center justify-center sm:justify-start gap-1">
                      ★ {featuredBook.ratingAvg.toFixed(1)} <span className="text-text-muted font-normal text-[11px]">({featuredBook.ratingCount})</span>
                    </strong>
                  </div>
                </div>

                {/* Direct Action CTAs */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 pt-2">
                  <Link
                    href={`/read/${featuredBook.slug}/${featuredBook.chapters[0]?.chapterNumber || 1}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-md bg-text-primary hover:bg-black dark:hover:bg-white/90 text-background text-xs font-bold uppercase tracking-wider transition shadow-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Đọc Chương 1</span>
                  </Link>

                  <Link
                    href={`/listen/${featuredBook.slug}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-5 sm:py-3 rounded-md bg-surface-elevated hover:bg-border border border-border text-text-primary text-xs font-bold uppercase tracking-wider transition"
                  >
                    <Headphones className="w-4 h-4 text-primary" />
                    <span>Nghe ZORY Voice</span>
                  </Link>

                  <Link
                    href={`/book/${featuredBook.slug}`}
                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition"
                  >
                    Xem toàn văn hồ sơ →
                  </Link>
                </div>
              </div>

              {/* Right Column (5 cols): Authentic Book Presentation & Quick Chapter Jump */}
              <div className="lg:col-span-5 flex flex-col items-center lg:items-end space-y-6">
                {/* Physical Book Sleeve Frame */}
                <div className="relative group w-64 sm:w-72">
                  <div className="book-cover-frame book-spine-effect aspect-[2/3] w-full bg-surface-elevated relative">
                    <img
                      src={featuredBook.coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600'}
                      alt={featuredBook.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-sm bg-black/80 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-white border border-white/20">
                      ZORY Edition
                    </div>
                  </div>
                </div>

                {/* Quick Chapter Access Card */}
                <div className="w-full max-w-sm rounded-md border border-border bg-surface-elevated p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-border pb-1.5">
                    <span className="label-caps text-text-muted">
                      Mục Lục Truy Cập Nhanh
                    </span>
                    <span className="text-[11px] text-text-muted">3 chương đầu</span>
                  </div>

                  <div className="space-y-1">
                    {featuredBook.chapters.map((ch) => (
                      <Link
                        key={ch.id}
                        href={`/read/${featuredBook.slug}/${ch.chapterNumber}`}
                        className="flex items-center justify-between p-2 rounded-sm hover:bg-surface text-xs font-medium text-text-primary transition group"
                      >
                        <span className="truncate pr-2">
                          Chương {ch.chapterNumber}: {ch.title.replace(/^Chương \d+:\s*/, '')}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. RECENT PROGRESS — MINIMAL ARCHIVE TICKET */}
      {recentProgress && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-4 rounded-md border border-border bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={recentProgress.book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120'}
                alt={recentProgress.book.title}
                className="w-10 h-14 object-cover rounded-sm border border-border flex-shrink-0"
              />
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="label-caps text-primary">Đang đọc dở</span>
                  <span className="text-[11px] text-text-muted">
                    • Tiến độ: {Math.round(recentProgress.progressPercent)}%
                  </span>
                </div>
                <h2 className="text-sm font-bold text-text-primary truncate">
                  {recentProgress.book.title}
                </h2>
                <p className="text-xs text-text-secondary truncate">
                  Chương {recentProgress.chapter.chapterNumber}: {recentProgress.chapter.title}
                </p>
              </div>
            </div>

            <Link
              href={`/read/${recentProgress.book.slug}/${recentProgress.chapter.chapterNumber}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-surface-elevated hover:bg-border border border-border text-xs font-bold text-text-primary uppercase tracking-wider transition flex-shrink-0"
            >
              <span>Tiếp tục đọc</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* 3. TUYỂN TẬP BIÊN TẬP (CURATOR'S COLLECTION) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between border-b border-border pb-3">
          <div>
            <span className="label-caps text-text-muted">Index 02</span>
            <h2 className="font-display text-2xl font-bold text-text-primary">
              Tác Phẩm Được Quan Tâm Nhất
            </h2>
          </div>
          <Link
            href="/explore?sort=popular"
            className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1 transition"
          >
            <span>Toàn bộ danh mục</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* High-density Editorial Book Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {popularBooks.map((book, idx) => (
            <Link
              key={book.id}
              href={`/book/${book.slug}`}
              className="group flex flex-col space-y-2.5 p-2 rounded-md hover:bg-surface border border-transparent hover:border-border transition"
            >
              {/* Cover Frame */}
              <div className="book-cover-frame aspect-[2/3] w-full bg-surface-elevated relative">
                <img
                  src={book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-black/80 text-white">
                  0{idx + 1}
                </span>
                <span className="absolute bottom-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-surface/90 text-text-primary">
                  ★ {book.ratingAvg.toFixed(1)}
                </span>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-text-primary line-clamp-1 group-hover:text-primary transition">
                  {book.title}
                </h3>
                <p className="text-[11px] text-text-muted truncate">
                  {book.authorName}
                </p>
                <div className="flex items-center justify-between text-[10px] text-text-secondary pt-0.5 border-t border-border/50">
                  <span>{formatNumber(book.readCount)} đọc</span>
                  <span className="font-semibold text-text-primary">{book._count.chapters} chương</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. WORKBENCH BLUEPRINT: ZORY AI STUDIO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-md border border-border-strong bg-surface p-8 sm:p-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div className="space-y-1">
              <span className="label-caps text-primary">Architectural Workspace</span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-text-primary">
                ZORY AI Studio: Hệ Thống Sáng Tác Văn Học Chuyên Sâu
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary max-w-xl">
                Không chỉ là một ô chat AI đơn thuần. Đây là môi trường quản lý World Bible, hồ sơ nhân vật đa chiều và ngữ cảnh dài hạn cho tiểu thuyết.
              </p>
            </div>

            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider transition self-start md:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Khởi tạo dự án</span>
            </Link>
          </div>

          {/* 3 Pillars of AI Studio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-4 rounded-md border border-border bg-surface-elevated/60 space-y-2">
              <div className="label-caps text-text-muted">Trụ cột 01</div>
              <h3 className="text-sm font-bold text-text-primary">World Bible Nhất Quán</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Định nghĩa quy tắc năng lực, các đại môn phái và lịch sử địa lý được nạp làm ngữ cảnh bất biến cho mọi yêu cầu sinh văn bản.
              </p>
            </div>

            <div className="p-4 rounded-md border border-border bg-surface-elevated/60 space-y-2">
              <div className="label-caps text-text-muted">Trụ cột 02</div>
              <h3 className="text-sm font-bold text-text-primary">Hồ Sơ Nhân Vật Sống Động</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Quản lý tính cách, mục tiêu cá nhân và quan hệ đồng minh/thù địch giúp các đoạn đối thoại luôn đúng tính cách từng nhân vật.
              </p>
            </div>

            <div className="p-4 rounded-md border border-border bg-surface-elevated/60 space-y-2">
              <div className="label-caps text-text-muted">Trụ cột 03</div>
              <h3 className="text-sm font-bold text-text-primary">Trợ Lý Biên Tập Cận Kề</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Viết tiếp tình tiết nghẹt thở, trau chuốt câu chữ và kiểm tra logic diễn biến với bản xem trước trước khi chèn vào bản thảo chính.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HAI CỘT BIÊN TẬP: CẬP NHẬT CHƯƠNG MỚI & TRUYỆN ĐÃ HOÀN THÀNH */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Mới cập nhật (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-end justify-between border-b border-border pb-2.5">
              <div>
                <span className="label-caps text-text-muted">Index 03</span>
                <h3 className="font-display text-xl font-bold text-text-primary">
                  Nhật Ký Cập Nhật Mới
                </h3>
              </div>
              <Link href="/explore?sort=latest" className="text-xs text-text-secondary hover:text-text-primary">
                Xem toàn bộ →
              </Link>
            </div>

            <div className="divide-y divide-border">
              {latestBooks.map((b) => {
                const latestChapter = b.chapters[0];
                return (
                  <div key={b.id} className="py-3 flex items-center justify-between gap-4 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}
                        alt={b.title}
                        className="w-9 h-12 object-cover rounded-sm border border-border flex-shrink-0"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <Link
                          href={`/book/${b.slug}`}
                          className="font-bold text-xs text-text-primary group-hover:text-primary transition truncate block"
                        >
                          {b.title}
                        </Link>
                        {latestChapter && (
                          <Link
                            href={`/read/${b.slug}/${latestChapter.chapterNumber}`}
                            className="text-[11px] text-text-secondary hover:text-text-primary truncate block"
                          >
                            Chương {latestChapter.chapterNumber}: {latestChapter.title}
                          </Link>
                        )}
                        <span className="text-[10px] text-text-muted">{b.authorName}</span>
                      </div>
                    </div>

                    <Link
                      href={`/read/${b.slug}/${latestChapter?.chapterNumber || 1}`}
                      className="px-2.5 py-1 rounded-sm border border-border bg-surface hover:bg-surface-elevated text-[11px] font-semibold text-text-primary flex-shrink-0 transition"
                    >
                      Đọc
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Truyện Hoàn Thành (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-end justify-between border-b border-border pb-2.5">
              <div>
                <span className="label-caps text-text-muted">Index 04</span>
                <h3 className="font-display text-xl font-bold text-text-primary">
                  Tác Phẩm Đã Trọn Vẹn
                </h3>
              </div>
              <Link href="/explore?status=COMPLETED" className="text-xs text-text-secondary hover:text-text-primary">
                Xem thêm →
              </Link>
            </div>

            <div className="space-y-3">
              {completedBooks.map((b) => (
                <Link
                  key={b.id}
                  href={`/book/${b.slug}`}
                  className="p-3 rounded-md border border-border bg-surface hover:border-text-primary transition flex items-center gap-3 group"
                >
                  <img
                    src={b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}
                    alt={b.title}
                    className="w-10 h-14 object-cover rounded-sm border border-border flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h4 className="font-bold text-xs text-text-primary group-hover:text-primary truncate">
                      {b.title}
                    </h4>
                    <p className="text-[11px] text-text-muted truncate">
                      {b.authorName} • {b.genres.map((g) => g.genre.name).join(', ')}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                      <span className="font-bold text-success">Hoàn thành</span>
                      <span>• ★ {b.ratingAvg.toFixed(1)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. THỂ LOẠI LƯU TRỮ (CATEGORY DIRECTORY) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="border-b border-border pb-2">
          <span className="label-caps text-text-muted">Index 05</span>
          <h2 className="font-display text-xl font-bold text-text-primary">
            Phân Loại Thư Viện Thể Loại
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <Link
              key={g.slug}
              href={`/genres/${g.slug}`}
              className="px-3 py-1.5 rounded-sm border border-border bg-surface hover:border-text-primary text-xs font-semibold text-text-primary transition flex items-center gap-1.5"
            >
              <span>{g.name}</span>
              <span className="text-[10px] text-text-muted font-normal">({g._count.books})</span>
            </Link>
          ))}
        </div>
      </section>
        </>
      )}
    </div>
  );
}
