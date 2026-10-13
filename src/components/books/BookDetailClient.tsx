'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Star,
  Headphones,
  Calendar,
  Eye,
  MessageSquare,
  Share2,
  Check,
  ArrowRight,
  Camera,
} from 'lucide-react';
import { formatNumber, formatDateVi } from '@/lib/utils';
import { BookLoreSection } from './BookLoreSection';
import { CoverPickerModal } from '@/components/studio/CoverPickerModal';

interface BookDetailProps {
  book: any;
  userState: {
    inLibrary: boolean;
    libraryCategory: string | null;
    lastProgress: any;
  };
  similarBooks: any[];
  currentUser: any;
}

export function BookDetailClient({
  book,
  userState,
  similarBooks,
  currentUser,
}: BookDetailProps) {
  const router = useRouter();
  const [coverUrl, setCoverUrl] = useState<string | null>(book.coverUrl);
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [inLibrary, setInLibrary] = useState(userState.inLibrary);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined' && book?.title) {
      document.title = `${book.title} | ZORY`;
    }
  }, [book?.title]);

  // Ratings Form
  const [userRating, setUserRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingMessage, setRatingMessage] = useState('');

  // Comment Form
  const [commentText, setCommentText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const handleToggleLibrary = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setLibraryLoading(true);
    try {
      if (inLibrary) {
        await fetch(`/api/library/${book.id}`, { method: 'DELETE' });
        setInLibrary(false);
      } else {
        await fetch('/api/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId: book.id, category: 'READING' }),
        });
        setInLibrary(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setRatingSubmitting(true);
    setRatingMessage('');
    try {
      const res = await fetch(`/api/books/${book.slug}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: userRating, review: reviewText }),
      });
      const data = await res.json();
      if (res.ok) {
        setRatingMessage('Cảm ơn bạn đã gửi đánh giá tác phẩm!');
        setReviewText('');
        router.refresh();
      } else {
        setRatingMessage(data.error || 'Lỗi gửi đánh giá');
      }
    } catch (err) {
      setRatingMessage('Lỗi kết nối máy chủ');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!commentText.trim()) return;

    setCommentSubmitting(true);
    try {
      const res = await fetch(`/api/books/${book.slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText, isSpoiler }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setCommentText('');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const firstChapter = book.chapters[0];
  const lastProgress = userState.lastProgress;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
      {/* HEADER CHI TIẾT TRUYỆN — ARCHITECTURAL ARCHIVAL SPREAD */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start bg-surface rounded-md border border-border p-4 sm:p-6 md:p-10 shadow-sm">
        {/* Cover */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center">
          <div className="w-52 sm:w-64 book-cover-frame book-spine-effect aspect-[2/3] bg-surface-elevated relative">
            <img
              src={coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'}
              alt={book.title}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-black/80 text-white">
              ZORY ARCHIVE
            </span>
            {(currentUser?.id === book.author?.id || currentUser?.id === book.authorId) && (
              <button
                type="button"
                onClick={() => setCoverModalOpen(true)}
                className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/80 hover:bg-primary text-white text-[10px] font-bold font-sans rounded transition flex items-center gap-1 shadow-md border border-white/20"
                title="Tải lên hoặc đổi ảnh bìa truyện"
              >
                <Camera className="w-3 h-3" />
                <span>ĐỔI ẢNH BÌA</span>
              </button>
            )}
          </div>

          <div className="w-full max-w-[256px] mt-4 flex gap-2">
            <button
              onClick={handleToggleLibrary}
              disabled={libraryLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-sm text-xs font-bold uppercase tracking-wider transition border ${
                inLibrary
                  ? 'bg-surface-elevated text-primary border-primary'
                  : 'bg-surface hover:bg-surface-elevated text-text-primary border-border'
              }`}
            >
              {inLibrary ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-primary" />
                  <span>Đã trong tủ</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Lưu tủ sách</span>
                </>
              )}
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-sm border border-border bg-surface hover:bg-surface-elevated text-text-muted hover:text-text-primary transition"
              title="Sao chép liên kết"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Thông tin truyện */}
        <div className="md:col-span-8 lg:col-span-9 space-y-5 sm:space-y-6">
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="label-caps px-2 py-0.5 rounded-sm bg-surface-elevated border border-border text-text-primary text-[10px]">
                {book.status === 'COMPLETED' ? 'Trọn bộ' : 'Đang ra'}
              </span>

              {book.genres.map((g: any) => (
                <Link
                  key={g.slug}
                  href={`/genres/${g.slug}`}
                  className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-surface border border-border text-text-muted hover:text-text-primary hover:border-text-primary transition"
                >
                  {g.name}
                </Link>
              ))}
            </div>

            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight leading-snug break-words">
              {book.title}
            </h1>

            <p className="text-xs uppercase tracking-wider font-semibold text-text-muted">
              Tác giả:{' '}
              {book.author?.username ? (
                <Link
                  href={`/author/${book.author.username}`}
                  className="text-text-primary font-bold hover:text-primary transition underline underline-offset-4 decoration-border hover:decoration-primary"
                >
                  {book.author?.name || book.author?.username}
                </Link>
              ) : (
                <span className="text-text-primary font-bold">
                  {book.author?.name || book.authorName || 'Tiêu Dao Mặc Khách'}
                </span>
              )}
            </p>
          </div>

          {/* Archival Data Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-border text-xs">
            <div>
              <span className="block label-caps text-text-muted text-[10px] mb-0.5">Điểm đánh giá</span>
              <strong className="text-xs sm:text-sm font-bold text-text-primary flex items-center gap-1">
                ★ {book.ratingAvg.toFixed(1)} <span className="text-text-muted font-normal text-[11px]">({book.ratingCount})</span>
              </strong>
            </div>
            <div>
              <span className="block label-caps text-text-muted text-[10px] mb-0.5">Lượt đọc</span>
              <strong className="text-xs sm:text-sm font-bold text-text-primary">
                {formatNumber(book.readCount)}
              </strong>
            </div>
            <div>
              <span className="block label-caps text-text-muted text-[10px] mb-0.5">Quy mô</span>
              <strong className="text-xs sm:text-sm font-bold text-text-primary">
                {book.chapters.length} chương
              </strong>
            </div>
            <div>
              <span className="block label-caps text-text-muted text-[10px] mb-0.5">Cập nhật</span>
              <strong className="text-xs sm:text-sm font-bold text-text-primary truncate block">
                {formatDateVi(book.updatedAt)}
              </strong>
            </div>
          </div>

          {/* Tóm tắt */}
          <div className="space-y-1.5">
            <span className="label-caps text-text-muted text-[10px]">
              Tóm lược nội dung
            </span>
            <p className="text-xs sm:text-sm leading-relaxed text-text-secondary whitespace-pre-line font-sans">
              {book.summary}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 pt-2">
            {lastProgress ? (
              <Link
                href={`/read/${book.slug}/${lastProgress.chapterNumber}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-md bg-text-primary hover:bg-black dark:hover:bg-white/90 text-background text-xs font-bold uppercase tracking-wider transition shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Tiếp tục (Chương {lastProgress.chapterNumber})</span>
              </Link>
            ) : firstChapter ? (
              <Link
                href={`/read/${book.slug}/${firstChapter.chapterNumber}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-md bg-text-primary hover:bg-black dark:hover:bg-white/90 text-background text-xs font-bold uppercase tracking-wider transition shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Bắt đầu đọc</span>
              </Link>
            ) : null}

            <Link
              href={`/listen/${book.slug}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-5 sm:py-3 rounded-md bg-surface-elevated hover:bg-border border border-border text-text-primary text-xs font-bold uppercase tracking-wider transition"
            >
              <Headphones className="w-4 h-4 text-primary" />
              <span>Nghe giọng đọc AI</span>
            </Link>
          </div>
        </div>
      </div>

      {/* DANH SÁCH CHƯƠNG — ARCHIVAL CHAPTER INDEX */}
      <section className="bg-surface rounded-md border border-border p-6 md:p-8 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <span className="label-caps text-text-muted">Mục lục</span>
            <h2 className="font-display text-xl font-bold text-text-primary">
              Danh Sách Chương Đã Xuất Bản ({book.chapters.length})
            </h2>
          </div>
        </div>

        {book.chapters.length === 0 ? (
          <p className="text-xs text-text-muted italic py-6 text-center">
            Chưa có chương nào được xuất bản.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {book.chapters.map((ch: any) => (
              <Link
                key={ch.id}
                href={`/read/${book.slug}/${ch.chapterNumber}`}
                className="p-3 rounded-sm border border-border hover:border-text-primary hover:bg-surface-elevated transition group flex flex-col justify-between"
              >
                <p className="text-xs font-bold text-text-primary group-hover:text-primary truncate">
                  Chương {ch.chapterNumber}: {ch.title.replace(/^Chương \d+:\s*/, '')}
                </p>
                <div className="flex items-center justify-between text-[10px] text-text-muted mt-2 pt-1 border-t border-border/50">
                  <span>{ch.wordCount} chữ</span>
                  <span>{formatDateVi(ch.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* THIẾT LẬP THẾ GIỚI & NHÂN VẬT (LOREBOOK & CHARACTER GRAPH) */}
      <BookLoreSection bookSlug={book.slug} />

      {/* ĐÁNH GIÁ & BÌNH LUẬN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Đánh giá */}
        <section className="lg:col-span-5 bg-surface rounded-md border border-border p-6 space-y-4 shadow-sm">
          <div>
            <span className="label-caps text-text-muted">Độc giả thẩm định</span>
            <h2 className="font-display text-lg font-bold text-text-primary flex items-center gap-1.5">
              <span>Đánh Giá Tác Phẩm</span>
            </h2>
          </div>

          <form onSubmit={handleRatingSubmit} className="space-y-4">
            <div>
              <label className="block label-caps text-text-muted mb-1.5">
                Mức điểm (1 - 5 sao)
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setUserRating(s)}
                    className={`p-2 rounded-sm border transition ${
                      userRating >= s
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-500'
                        : 'border-border text-text-muted'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${userRating >= s ? 'fill-amber-500' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block label-caps text-text-muted mb-1">
                Nhận xét biên tập
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Cảm nghĩ về nhịp kể, chiều sâu thế giới quan..."
                rows={3}
                className="w-full p-3 text-xs rounded-sm border border-border bg-surface-elevated text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary"
              />
            </div>

            {ratingMessage && (
              <p className="text-xs text-primary font-bold">{ratingMessage}</p>
            )}

            <button
              type="submit"
              disabled={ratingSubmitting}
              className="w-full py-2.5 rounded-sm bg-text-primary hover:bg-black dark:hover:bg-white/90 text-background text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
            >
              {ratingSubmitting ? 'Đang lưu...' : 'Gửi thẩm định'}
            </button>
          </form>
        </section>

        {/* Danh sách Đánh giá gần đây */}
        <section className="lg:col-span-7 bg-surface rounded-md border border-border p-6 space-y-4 shadow-sm">
          <div>
            <span className="label-caps text-text-muted">Nhật ký độc giả</span>
            <h2 className="font-display text-lg font-bold text-text-primary">
              Cảm Nhận Từ Độc Giả ({book.ratings.length})
            </h2>
          </div>

          <div className="space-y-3">
            {book.ratings.length === 0 ? (
              <p className="text-xs text-text-muted italic py-6 text-center">
                Chưa có đánh giá nào được ghi nhận.
              </p>
            ) : (
              book.ratings.map((r: any) => (
                <div key={r.id} className="p-3.5 rounded-sm bg-surface-elevated border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-text-primary">
                      {r.user.name || r.user.username}
                    </span>
                    <div className="text-amber-500 text-xs font-bold">
                      ★ {r.score} / 5
                    </div>
                  </div>
                  {r.review && (
                    <p className="text-xs text-text-secondary leading-relaxed font-sans">
                      &ldquo;{r.review}&rdquo;
                    </p>
                  )}
                  <span className="text-[10px] text-text-muted block">
                    {formatDateVi(r.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* TRUYỆN TƯƠNG TỰ */}
      {similarBooks.length > 0 && (
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <span className="label-caps text-text-muted">Đề xuất</span>
            <h2 className="font-display text-xl font-bold text-text-primary">
              Cùng Dòng Văn Học
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similarBooks.map((sim: any) => (
              <Link
                key={sim.id}
                href={`/book/${sim.slug}`}
                className="group p-2.5 rounded-sm border border-transparent hover:border-border hover:bg-surface transition space-y-2"
              >
                <div className="book-cover-frame aspect-[2/3] w-full bg-surface-elevated">
                  <img
                    src={sim.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
                    alt={sim.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-bold text-xs text-text-primary truncate group-hover:text-primary">
                  {sim.title}
                </h3>
                <p className="text-[10px] text-text-muted truncate">
                  {sim.authorName}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* MODAL TÙY CHỈNH ẢNH BÌA DÀNH CHO TÁC GIẢ */}
      <CoverPickerModal
        isOpen={coverModalOpen}
        onClose={() => setCoverModalOpen(false)}
        currentCoverUrl={coverUrl}
        bookTitle={book.title}
        genre={book.genres?.[0]?.genre?.name || 'Văn học'}
        storySummary={book.summary}
        bookSlug={book.slug}
        onSave={(newUrl) => {
          setCoverUrl(newUrl);
          router.refresh();
        }}
      />
    </div>
  );
}
