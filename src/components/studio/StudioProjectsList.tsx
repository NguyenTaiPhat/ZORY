'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  BookMarked,
  Users,
  ArrowRight,
  Cpu,
  Trash2,
  Sparkles,
  AlertTriangle,
  RotateCw,
  Zap,
  Globe,
  ExternalLink,
  Check,
  BookOpen,
  Camera,
} from 'lucide-react';
import { formatDateVi, formatThousands } from '@/lib/utils';
import { CoverPickerModal } from './CoverPickerModal';

interface Project {
  id: string;
  title: string;
  genre: string;
  premise: string | null;
  coverUrl?: string | null;
  updatedAt: string | Date;
  publishedBookId?: string | null;
  publishedBookSlug?: string | null;
  _count: {
    characters: number;
    studioChapters: number;
  };
}

interface StudioProjectsListProps {
  initialProjects: Project[];
  userQuota: {
    remaining: number;
    quota: number;
    used: number;
    countdown?: string;
    isUnlimited?: boolean;
  };
}

export function StudioProjectsList({
  initialProjects,
  userQuota,
}: StudioProjectsListProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Xuất bản trạng thái
  const [projectToPublish, setProjectToPublish] = useState<Project | null>(null);
  const [projectToChangeCover, setProjectToChangeCover] = useState<Project | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishSuccessInfo, setPublishSuccessInfo] = useState<{
    bookId: string;
    slug: string;
    chapterCount: number;
  } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const isUnlimited = Boolean(userQuota.isUnlimited || userQuota.quota >= 999999999);
  const quotaPercent = isUnlimited
    ? 100
    : Math.min(
        100,
        Math.round((userQuota.used / (userQuota.quota || 50000)) * 100)
      );

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/studio/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
        setProjectToDelete(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Lỗi khi xóa dự án');
      }
    } catch (err) {
      console.error('Lỗi xóa dự án:', err);
      alert('Không thể kết nối đến máy chủ');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublishConfirm = async (proj: Project) => {
    setIsPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch(`/api/studio/projects/${proj.id}/publish`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi xuất bản tác phẩm');
      }
      const slug = data.slug || data.bookSlug;
      const chapterCount = data.chapterCount ?? data.chaptersPublished ?? (proj._count?.studioChapters || 0);
      setPublishSuccessInfo({
        bookId: data.bookId,
        slug,
        chapterCount,
      });
      // Cập nhật trạng thái dự án tại giao diện
      setProjects((prev) =>
        prev.map((p) =>
          p.id === proj.id
            ? { ...p, publishedBookId: data.bookId, publishedBookSlug: slug }
            : p
        )
      );
    } catch (err: any) {
      setPublishError(err.message || 'Không thể xuất bản tác phẩm');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Studio Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
        <div className="space-y-1.5 min-w-0">
          <span className="label-caps text-primary text-[10px]">ZORY LITERARY AI WORKBENCH</span>
          <h1 className="font-sans text-2xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
            Xưởng Sáng Tác AI
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary max-w-xl">
            Môi trường kiến tạo tác phẩm văn học hỗ trợ World Bible, thiết lập nhân vật và đồng tác giả AI.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Quota Indicator (Chuẩn chiều cao h-12 đồng bộ) */}
          <div className="h-12 px-3.5 sm:px-4 border border-border bg-surface flex items-center justify-between sm:justify-start gap-3 shadow-sm w-full sm:w-auto">
            <div className="w-8 h-8 rounded border border-border bg-surface-elevated flex items-center justify-center text-primary shrink-0">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 font-sans text-xs">
                <span className="text-text-secondary text-[10.5px] font-semibold tracking-wider">
                  ĐỊNH MỨC AI:
                </span>
                <span suppressHydrationWarning className="font-extrabold text-text-primary tabular-nums">
                  {isUnlimited ? 'VÔ HẠN (∞)' : `${formatThousands(userQuota.remaining)} TOKENS`}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-20 sm:w-24 bg-border h-1 overflow-hidden rounded-full">
                  <div
                    className={isUnlimited ? "bg-emerald-500 h-full w-full" : "bg-primary h-full transition-all"}
                    style={{ width: isUnlimited ? '100%' : `${quotaPercent}%` }}
                  />
                </div>
                {isUnlimited ? (
                  <span className="text-[10px] font-sans text-emerald-500 font-medium">
                    Không giới hạn
                  </span>
                ) : userQuota.countdown ? (
                  <span className="text-[10px] font-sans text-text-tertiary">
                    Reset sau {userQuota.countdown}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Primary Action Button (Cùng chiều cao h-12, căn chỉnh hoàn hảo) */}
          <Link
            href="/studio/new"
            className="h-12 px-5 sm:px-6 bg-text-primary hover:bg-primary text-background hover:text-white flex items-center justify-center gap-2 text-xs font-bold font-sans tracking-wider border border-border transition shadow-sm w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>KHỞI TẠO BẢN THẢO MỚI</span>
          </Link>
        </div>
      </div>

      {/* Projects Catalog Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="label-caps font-bold text-text-primary">
            HỒ SƠ BẢN THẢO ({projects.length})
          </h2>
          <span className="text-xs font-sans text-text-secondary font-medium">
            TRẠNG THÁI: <span className="text-emerald-500 font-semibold">TRỰC TUYẾN</span>
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 border border-border bg-surface space-y-4">
            <Sparkles className="w-10 h-10 mx-auto text-primary opacity-60" />
            <h3 className="font-sans text-lg font-bold text-text-primary">
              Chưa có dự án bản thảo nào
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Bắt đầu kiến tạo vũ trụ hư cấu hoặc viết tiếp câu chuyện cùng trợ lý AI văn học ZORY.
            </p>
            <Link
              href="/studio/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-text-primary text-background hover:bg-primary hover:text-white text-xs font-bold font-sans border border-border transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>TẠO BẢN THẢO ĐẦU TIÊN</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="p-6 border border-border bg-surface hover:border-primary/60 transition group flex flex-col justify-between space-y-5 shadow-sm relative"
              >
                <div className="space-y-3">
                  {/* Top Bar: Genre Badge, Published Status, Date & Delete Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="label-caps text-primary border border-primary/30 px-2 py-0.5 font-bold bg-primary/5">
                        {proj.genre}
                      </span>
                      {proj.publishedBookSlug && (
                        <Link
                          href={`/book/${proj.publishedBookSlug}`}
                          className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-emerald-400 border border-emerald-500/30 px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
                          title="Xem trang sách công khai"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>ĐÃ XUẤT BẢN</span>
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-sans text-text-secondary">
                        {formatDateVi(proj.updatedAt)}
                      </span>

                      {/* Nút Xóa Dự Án */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setProjectToDelete(proj);
                        }}
                        title="Xóa dự án bản thảo này"
                        className="p-1.5 text-text-tertiary hover:text-rose-500 hover:bg-rose-500/10 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Project Title and Cover Thumbnail */}
                  <div className="flex gap-3.5 items-start">
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setProjectToChangeCover(proj);
                      }}
                      className="w-12 h-16 border border-border bg-surface-elevated shrink-0 relative cursor-pointer group/cover overflow-hidden rounded-xs"
                      title="Bấm để đổi ảnh bìa"
                    >
                      {proj.coverUrl ? (
                        <img
                          src={proj.coverUrl}
                          alt={proj.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                          <Camera className="w-4 h-4 opacity-50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100 transition flex items-center justify-center text-white">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <Link
                        href={`/studio/${proj.id}`}
                        className="font-sans text-base font-bold text-text-primary group-hover:text-primary transition block line-clamp-1"
                      >
                        {proj.title}
                      </Link>
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed font-sans">
                        {proj.premise || 'Chưa thiết lập tiền đề tác phẩm.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="pt-4 border-t border-border flex items-center justify-between text-xs font-sans text-text-secondary">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <BookMarked className="w-3.5 h-3.5 text-primary" />
                      <span>{proj._count.studioChapters} CHƯƠNG</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-text-secondary" />
                      <span>{proj._count.characters} NHÂN VẬT</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Nút Xuất bản / Cập nhật */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setProjectToPublish(proj);
                        setPublishSuccessInfo(null);
                        setPublishError(null);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold border transition flex items-center gap-1 ${
                        proj.publishedBookSlug
                          ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                          : 'border-primary/40 text-primary hover:bg-primary/10'
                      }`}
                      title={proj.publishedBookSlug ? 'Cập nhật nội dung lên thư viện' : 'Xuất bản tác phẩm cho mọi người đọc'}
                    >
                      <Globe className="w-3 h-3" />
                      <span>{proj.publishedBookSlug ? 'CẬP NHẬT' : 'XUẤT BẢN'}</span>
                    </button>

                    <Link
                      href={`/studio/${proj.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-text-primary hover:text-primary transition px-1 py-1"
                    >
                      <span>MỞ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL XÁC NHẬN XÓA DỰ ÁN */}
      {projectToDelete && (
        <div className="fixed !m-0 inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 border border-rose-500/30 bg-rose-500/10 rounded">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-sans text-base font-bold text-text-primary">
                  Xác Nhận Xóa Bản Thảo
                </h3>
                <span className="text-[11px] font-sans text-text-secondary">
                  HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC
                </span>
              </div>
            </div>

            <p className="text-xs font-sans text-text-secondary leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn dự án bản thảo{' '}
              <strong className="text-text-primary font-bold">
                "{projectToDelete.title}"
              </strong>{' '}
              không? Toàn bộ {projectToDelete._count.studioChapters} chương truyện và{' '}
              {projectToDelete._count.characters} nhân vật liên quan sẽ bị xóa hoàn toàn.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 border border-border text-xs font-bold font-sans text-text-secondary hover:text-text-primary transition"
              >
                HỦY BỎ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold font-sans transition flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>ĐANG XÓA...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>XÓA VĨNH VIỄN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XUẤT BẢN DỰ ÁN RA THƯ VIỆN CÔNG KHAI */}
      {projectToPublish && (
        <div className="fixed !m-0 inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border p-6 max-w-lg w-full space-y-5 shadow-2xl">
            {!publishSuccessInfo ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 border border-primary/30 bg-primary/10 text-primary rounded">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-sans text-base font-bold text-text-primary">
                      {projectToPublish.publishedBookSlug
                        ? 'Cập Nhật Xuất Bản Lên Thư Viện'
                        : 'Xuất Bản Tác Phẩm Ra Công Khai'}
                    </h3>
                    <span className="text-[11px] font-sans text-text-secondary">
                      ĐỒNG BỘ TOÀN BỘ CHƯƠNG VÀ LOREBOOK LÊN NỀN TẢNG ZORY
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-surface-elevated border border-border text-xs font-sans space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Tác phẩm:</span>
                    <strong className="text-text-primary font-bold text-right truncate max-w-[280px]">
                      {projectToPublish.title}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Thể loại:</span>
                    <span className="text-primary font-semibold">{projectToPublish.genre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Quy mô hiện tại:</span>
                    <span className="text-text-primary font-medium">
                      {projectToPublish._count.studioChapters} chương • {projectToPublish._count.characters} nhân vật
                    </span>
                  </div>
                </div>

                <p className="text-xs font-sans text-text-secondary leading-relaxed">
                  Khi xuất bản, tác phẩm sẽ xuất hiện công khai trên <strong>Khám Phá (/explore)</strong>, <strong>Thể Loại (/genres)</strong>. Tất cả độc giả trên hệ thống đều có thể tìm kiếm, đọc từng chương và tra cứu lorebook nhân vật.
                </p>

                {publishError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-sans">
                    {publishError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    disabled={isPublishing}
                    onClick={() => setProjectToPublish(null)}
                    className="px-4 py-2 border border-border text-xs font-bold font-sans text-text-secondary hover:text-text-primary transition"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="button"
                    disabled={isPublishing}
                    onClick={() => handlePublishConfirm(projectToPublish)}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold font-sans transition flex items-center gap-1.5"
                  >
                    {isPublishing ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>ĐANG ĐỒNG BỘ...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        <span>XÁC NHẬN XUẤT BẢN</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-400">
                  <div className="p-2.5 border border-emerald-500/30 bg-emerald-500/10 rounded">
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-sans text-base font-bold text-text-primary">
                      Xuất Bản Thành Công!
                    </h3>
                    <span className="text-[11px] font-sans text-emerald-400">
                      TÁC PHẨM ĐÃ HIỆN DIỆN CÔNG KHAI TRÊN ZORY
                    </span>
                  </div>
                </div>

                <p className="text-xs font-sans text-text-secondary leading-relaxed">
                  Tác phẩm <strong className="text-text-primary">"{projectToPublish.title}"</strong> cùng{' '}
                  <strong className="text-text-primary">{publishSuccessInfo.chapterCount} chương</strong> và dữ liệu lorebook đã được đưa lên thư viện. Mọi người có thể đọc ngay bây giờ!
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link
                    href={`/book/${publishSuccessInfo.slug || projectToPublish.publishedBookSlug || ''}`}
                    target="_blank"
                    className="px-3 py-2.5 bg-surface-elevated hover:bg-border border border-border text-text-primary text-xs font-bold font-sans text-center transition flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span>XEM TRANG SÁCH</span>
                    <ExternalLink className="w-3 h-3 text-text-tertiary" />
                  </Link>
                  <Link
                    href={`/read/${publishSuccessInfo.slug || projectToPublish.publishedBookSlug || ''}/1`}
                    target="_blank"
                    className="px-3 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold font-sans text-center transition flex items-center justify-center gap-1.5"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>ĐỌC CHƯƠNG 1</span>
                  </Link>
                </div>

                <div className="flex justify-end pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setProjectToPublish(null);
                      setPublishSuccessInfo(null);
                    }}
                    className="px-4 py-2 border border-border text-xs font-bold font-sans text-text-secondary hover:text-text-primary transition"
                  >
                    ĐÓNG
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL ĐỔI ẢNH BÌA TỪ DANH SÁCH DỰ ÁN */}
      {projectToChangeCover && (
        <CoverPickerModal
          isOpen={!!projectToChangeCover}
          onClose={() => setProjectToChangeCover(null)}
          currentCoverUrl={projectToChangeCover.coverUrl || null}
          bookTitle={projectToChangeCover.title}
          genre={projectToChangeCover.genre}
          storySummary={projectToChangeCover.premise}
          projectId={projectToChangeCover.id}
          bookSlug={projectToChangeCover.publishedBookSlug || undefined}
          onSave={(newUrl) => {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === projectToChangeCover.id ? { ...p, coverUrl: newUrl } : p
              )
            );
          }}
        />
      )}
    </div>
  );
}
