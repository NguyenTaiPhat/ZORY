'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  Users,
  Eye,
  Star,
  UserPlus,
  UserCheck,
  Edit3,
  Sparkles,
  ArrowRight,
  ScrollText,
  Clock,
  Shield,
  X,
  Check,
  Share2,
} from 'lucide-react';
import { formatNumber, formatDateVi } from '@/lib/utils';

interface AuthorProfileProps {
  initialAuthor: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    bio: string | null;
    publishingSchedule: string | null;
    role: string;
    createdAt: string | Date;
  };
  initialStats: {
    followerCount: number;
    booksCount: number;
    totalReads: number;
    averageRating: number;
  };
  books: any[];
  initialIsFollowing: boolean;
  currentUser: any;
}

export function AuthorProfileClient({
  initialAuthor,
  initialStats,
  books,
  initialIsFollowing,
  currentUser,
}: AuthorProfileProps) {
  const router = useRouter();
  const [author, setAuthor] = useState(initialAuthor);
  const [stats, setStats] = useState(initialStats);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followLoading, setFollowLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(author.name || '');
  const [editSchedule, setEditSchedule] = useState(author.publishingSchedule || '');
  const [editBio, setEditBio] = useState(author.bio || '');
  const [editBanner, setEditBanner] = useState(author.bannerUrl || '');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isSelf = currentUser?.id === author.id;

  const handleToggleFollow = async () => {
    if (!currentUser) {
      router.push(`/login?callbackUrl=/author/${author.username}`);
      return;
    }

    if (isSelf) return;

    setFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`/api/authors/${author.username}/follow`, {
        method,
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.isFollowing);
        setStats((prev) => ({
          ...prev,
          followerCount: data.followerCount,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/authors/${author.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          publishingSchedule: editSchedule,
          bio: editBio,
          bannerUrl: editBanner,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi lưu thông tin');
      }
      setAuthor((prev) => ({
        ...prev,
        ...data.author,
      }));
      setEditModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setSaveError(err.message || 'Không thể lưu thay đổi');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* 1. HERO BANNER & AUTHOR PASSPORT */}
      <div className="bg-surface rounded-md border border-border overflow-hidden shadow-sm">
        {/* Banner Art */}
        <div className="h-44 sm:h-56 md:h-64 w-full relative bg-surface-elevated overflow-hidden">
          {author.bannerUrl ? (
            <img
              src={author.bannerUrl}
              alt={author.name || author.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-surface-elevated via-primary/5 to-surface-elevated flex items-center justify-center">
              <div className="text-center space-y-1 select-none pointer-events-none opacity-20">
                <span className="font-display font-bold text-5xl sm:text-7xl tracking-widest text-text-primary uppercase">
                  ZORY
                </span>
                <p className="text-xs uppercase tracking-[0.3em] font-mono text-text-primary">
                  LITERARY ARCHIVE • AUTHOR PASSPORT
                </p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />
        </div>

        {/* Profile Card Header */}
        <div className="px-5 sm:px-8 pb-8 pt-0 relative -mt-14 sm:-mt-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-md border-4 border-surface bg-surface-elevated shadow-lg overflow-hidden shrink-0 flex items-center justify-center">
                {author.avatarUrl ? (
                  <img
                    src={author.avatarUrl}
                    alt={author.name || author.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary text-white flex items-center justify-center font-bold text-3xl font-display">
                    {author.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-1 sm:mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
                    {author.name || author.username}
                  </h1>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-sm bg-primary/10 border border-primary/20 text-primary uppercase tracking-wider">
                    {author.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : 'TÁC GIẢ ZORY'}
                  </span>
                </div>
                <p className="text-xs font-mono text-text-muted">
                  @{author.username} • Gia nhập ZORY từ {formatDateVi(author.createdAt)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-start md:self-end">
              {isSelf ? (
                <>
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(true)}
                    className="px-4 py-2 rounded-sm border border-border bg-surface-elevated hover:border-text-primary text-xs font-bold uppercase tracking-wider text-text-primary transition flex items-center gap-2 interactive-press"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-primary" />
                    <span>SỬA HỒ SƠ & LỊCH ĐĂNG</span>
                  </button>

                  <Link
                    href="/studio"
                    className="px-4 py-2 rounded-sm bg-primary text-white hover:bg-primary-hover text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 interactive-press shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>XƯỞNG STUDIO</span>
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 interactive-press shadow-sm ${
                    isFollowing
                      ? 'border border-primary text-primary bg-primary/10 hover:bg-primary/20'
                      : 'bg-primary text-white hover:bg-primary-hover'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>ĐANG THEO DÕI</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>THEO DÕI TÁC GIẢ</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-sm border border-border bg-surface hover:bg-surface-elevated text-text-muted hover:text-text-primary transition"
                title="Sao chép liên kết hồ sơ"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Stats Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-border text-xs">
            <div className="p-3 rounded-sm bg-surface-elevated/60 border border-border/60">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-primary" />
                Người theo dõi
              </span>
              <strong className="text-base sm:text-lg font-bold text-text-primary">
                {formatNumber(stats.followerCount)}
              </strong>
            </div>

            <div className="p-3 rounded-sm bg-surface-elevated/60 border border-border/60">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-primary" />
                Tác phẩm phát hành
              </span>
              <strong className="text-base sm:text-lg font-bold text-text-primary">
                {stats.booksCount}
              </strong>
            </div>

            <div className="p-3 rounded-sm bg-surface-elevated/60 border border-border/60">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-primary" />
                Tổng lượt đọc
              </span>
              <strong className="text-base sm:text-lg font-bold text-text-primary">
                {formatNumber(stats.totalReads)}
              </strong>
            </div>

            <div className="p-3 rounded-sm bg-surface-elevated/60 border border-border/60">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                Đánh giá bình quân
              </span>
              <strong className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-1">
                ★ {stats.averageRating.toFixed(1)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN BODY: COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Schedule & Bio */}
        <div className="lg:col-span-4 space-y-6">
          {/* Lịch ra chương */}
          <div className="bg-surface rounded-md border border-border p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider pb-2 border-b border-border">
              <Calendar className="w-4 h-4" />
              <span>LỊCH RA CHƯƠNG ĐỊNH KỲ</span>
            </div>

            {author.publishingSchedule ? (
              <div className="p-3 rounded-sm bg-primary/5 border border-primary/20 text-text-primary text-xs font-medium leading-relaxed flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-text-primary mb-0.5">Khung giờ cố định:</p>
                  <p className="text-text-secondary whitespace-pre-line">{author.publishingSchedule}</p>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-text-muted space-y-2">
                <p>Tác giả chưa công bố lịch đăng chương cố định.</p>
                {isSelf && (
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(true)}
                    className="text-primary hover:underline font-bold text-[11px]"
                  >
                    + Cập nhật lịch đăng ngay
                  </button>
                )}
              </div>
            )}

            <p className="text-[11px] text-text-muted">
              Độc giả theo dõi tác giả sẽ tự động nhận thông báo ngay khi chương mới được mở đọc.
            </p>
          </div>

          {/* Giới thiệu & Tự bạch */}
          <div className="bg-surface rounded-md border border-border p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-text-primary font-bold text-xs uppercase tracking-wider pb-2 border-b border-border">
              <ScrollText className="w-4 h-4 text-primary" />
              <span>LỜI TỰ BẠCH & GIỚI THIỆU</span>
            </div>

            {author.bio ? (
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line font-serif">
                {author.bio}
              </p>
            ) : (
              <div className="py-4 text-center text-xs text-text-muted space-y-2">
                <p>Tác giả chưa viết phần giới thiệu bản thân.</p>
                {isSelf && (
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(true)}
                    className="text-primary hover:underline font-bold text-[11px]"
                  >
                    + Thêm giới thiệu
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Public Works */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="label-caps">DANH MỤC SÁNG TÁC</span>
              <h2 className="font-sans text-lg font-bold text-text-primary">
                Tác Phẩm Đã Phát Hành ({books.length})
              </h2>
            </div>
          </div>

          {books.length === 0 ? (
            <div className="p-12 text-center rounded-md border border-border bg-surface space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-text-muted/40 stroke-[1.5]" />
              <h3 className="text-sm font-bold text-text-primary">Chưa có tác phẩm công khai</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Tác giả đang trong quá trình sáng tác bản thảo trong ZORY Studio.
              </p>
              {isSelf && (
                <Link
                  href="/studio"
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-sm hover:bg-primary-hover transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mở Xưởng Sáng Tác Studio</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {books.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-md border border-border bg-surface hover:border-text-primary transition flex gap-3.5 group"
                >
                  {/* Book Cover */}
                  <Link
                    href={`/book/${b.slug}`}
                    className="w-20 sm:w-24 aspect-[2/3] shrink-0 bg-surface-elevated rounded-sm overflow-hidden border border-border shadow-sm block relative group-hover:shadow-md transition"
                  >
                    <img
                      src={b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </Link>

                  {/* Book Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-surface-elevated border border-border text-text-primary">
                          {b.status === 'COMPLETED' ? 'Trọn bộ' : 'Đang ra'}
                        </span>
                        {b.genres?.slice(0, 2).map((g: any) => (
                          <span
                            key={g.slug || g.id}
                            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-primary/5 text-primary border border-primary/20"
                          >
                            {g.name}
                          </span>
                        ))}
                      </div>

                      <h3 className="font-display text-sm font-bold text-text-primary leading-snug line-clamp-1 group-hover:text-primary transition">
                        <Link href={`/book/${b.slug}`}>{b.title}</Link>
                      </h3>

                      <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                        {b.summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-text-muted mt-2">
                      <div className="flex items-center gap-2">
                        <span>{b.chapterCount || 0} chương</span>
                        <span>•</span>
                        <span>{formatNumber(b.readCount || 0)} lượt đọc</span>
                      </div>

                      <Link
                        href={`/book/${b.slug}`}
                        className="text-primary hover:underline font-bold flex items-center gap-1 text-[10.5px]"
                      >
                        <span>Đọc</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. EDIT PROFILE MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface rounded-md border border-border shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                  CHỈNH SỬA HỒ SƠ TÁC GIẢ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-sm text-text-muted hover:text-text-primary transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-sm">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-text-primary">Bút danh hiển thị</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ví dụ: Tiêu Dao Mặc Khách"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-sm text-text-primary focus:outline-none focus:border-text-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-primary">Lịch ra chương định kỳ</label>
                <textarea
                  value={editSchedule}
                  onChange={(e) => setEditSchedule(e.target.value)}
                  rows={2}
                  placeholder="Ví dụ: Đăng chương mới vào 20:00 Thứ 3, Thứ 7 hàng tuần"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-sm text-text-primary focus:outline-none focus:border-text-primary"
                />
                <p className="text-[10px] text-text-muted">
                  Được hiển thị nổi bật trên trang tác giả giúp độc giả nắm lịch đọc.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-primary">Lời tự bạch & Giới thiệu (Bio)</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  placeholder="Chia sẻ về phong cách sáng tác, thể loại yêu thích hoặc thông điệp gửi tới độc giả..."
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-sm text-text-primary focus:outline-none focus:border-text-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-primary">URL Ảnh Bìa Banner</label>
                <input
                  type="url"
                  value={editBanner}
                  onChange={(e) => setEditBanner(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-sm text-text-primary focus:outline-none focus:border-text-primary"
                />
                <p className="text-[10px] text-text-muted">
                  Ảnh banner nền hiển thị đầu trang hồ sơ tác giả.
                </p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-border bg-surface hover:bg-surface-elevated rounded-sm text-text-secondary font-bold"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-sm font-bold uppercase tracking-wider transition"
                >
                  {saveLoading ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
