'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  X,
  RotateCcw,
  Sparkles,
  Bookmark,
  Check,
  Plus,
  ArrowRight,
  Clock,
  Layers,
  FileText,
  AlertCircle,
  Eye,
  GitCommit,
  Save,
} from 'lucide-react';
import { formatDateVi, formatTimeAgoVi } from '@/lib/utils';

export interface ChapterVersionItem {
  id: string;
  chapterId: string;
  projectId: string;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  versionName: string | null;
  changeNote: string | null;
  source: string;
  createdAt: string;
}

interface ChapterVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  chapterNumber: number;
  currentTitle: string;
  currentContent: string;
  onRestore: (restored: { title: string; content: string; wordCount: number }) => void;
}

type DiffBlock =
  | { type: 'unchanged'; text: string }
  | { type: 'added'; text: string }
  | { type: 'removed'; text: string };

function computeParagraphDiff(oldText: string, newText: string): DiffBlock[] {
  const oldParas = oldText
    ? oldText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    : [];
  const newParas = newText
    ? newText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    : [];

  if (oldParas.length === 0 && newParas.length === 0) {
    return [];
  }
  if (oldParas.length === 0) {
    return newParas.map((p) => ({ type: 'added', text: p }));
  }
  if (newParas.length === 0) {
    return oldParas.map((p) => ({ type: 'removed', text: p }));
  }

  const result: DiffBlock[] = [];
  const newSet = new Set(newParas);
  const oldSet = new Set(oldParas);

  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldParas.length || newIdx < newParas.length) {
    const oldP = oldParas[oldIdx];
    const newP = newParas[newIdx];

    if (oldIdx < oldParas.length && newIdx < newParas.length && oldP === newP) {
      result.push({ type: 'unchanged', text: oldP });
      oldIdx++;
      newIdx++;
    } else if (oldIdx < oldParas.length && !newSet.has(oldP)) {
      result.push({ type: 'removed', text: oldP });
      oldIdx++;
    } else if (newIdx < newParas.length && !oldSet.has(newP)) {
      result.push({ type: 'added', text: newP });
      newIdx++;
    } else if (newIdx < newParas.length) {
      result.push({ type: 'added', text: newP });
      newIdx++;
    } else if (oldIdx < oldParas.length) {
      result.push({ type: 'removed', text: oldP });
      oldIdx++;
    }
  }

  return result;
}

export function ChapterVersionModal({
  isOpen,
  onClose,
  projectId,
  chapterNumber,
  currentTitle,
  currentContent,
  onRestore,
}: ChapterVersionModalProps) {
  const [versions, setVersions] = useState<ChapterVersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'diff' | 'preview'>('diff');

  // New snapshot form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newChangeNote, setNewChangeNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/studio/projects/${projectId}/chapters/${chapterNumber}/versions`
      );
      if (!res.ok) return;
      const data = await res.json();
      const list = data.versions || [];
      setVersions(list);
      if (list.length > 0 && !selectedVersionId) {
        setSelectedVersionId(list[0].id);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách phiên bản:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, projectId, chapterNumber]);

  const selectedVersion = useMemo(() => {
    return versions.find((v) => v.id === selectedVersionId) || versions[0] || null;
  }, [versions, selectedVersionId]);

  // Diff giữa bản được chọn (bản cũ) và nội dung hiện tại trong editor
  const diffBlocks = useMemo(() => {
    if (!selectedVersion) return [];
    return computeParagraphDiff(selectedVersion.content || '', currentContent || '');
  }, [selectedVersion, currentContent]);

  const diffSummary = useMemo(() => {
    let added = 0;
    let removed = 0;
    diffBlocks.forEach((b) => {
      if (b.type === 'added') added++;
      if (b.type === 'removed') removed++;
    });
    return { added, removed };
  }, [diffBlocks]);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(
        `/api/studio/projects/${projectId}/chapters/${chapterNumber}/versions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentTitle,
            content: currentContent,
            versionName: newVersionName.trim() || undefined,
            changeNote: newChangeNote.trim() || undefined,
            source: 'MANUAL',
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setVersions((prev) => [data.version, ...prev]);
        setSelectedVersionId(data.version.id);
        setNewVersionName('');
        setNewChangeNote('');
        setShowCreateForm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedVersion) return;
    const confirmRestore = window.confirm(
      `Khôi phục về mốc "${selectedVersion.versionName || selectedVersion.title}"?\n\nBản nháp hiện tại sẽ tự động được lưu dự phòng trước khi khôi phục.`
    );
    if (!confirmRestore) return;

    setRestoring(true);
    try {
      const res = await fetch(
        `/api/studio/projects/${projectId}/chapters/${chapterNumber}/restore`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            versionId: selectedVersion.id,
            currentTitle,
            currentContent,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khôi phục bản thảo');
      }
      onRestore(data.restoredChapter);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi khôi phục');
    } finally {
      setRestoring(false);
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'AI_AUTO':
        return (
          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            AI Tự Động
          </span>
        );
      case 'RESTORE':
        return (
          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider flex items-center gap-1">
            <RotateCcw className="w-2.5 h-2.5" />
            Khôi Phục
          </span>
        );
      case 'PRE_RESTORE':
        return (
          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider flex items-center gap-1">
            <Bookmark className="w-2.5 h-2.5" />
            Sao Lưu
          </span>
        );
      default:
        return (
          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-sm bg-surface-elevated text-text-secondary border border-border uppercase tracking-wider flex items-center gap-1">
            <GitCommit className="w-2.5 h-2.5" />
            Tự Lưu
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface rounded-md border border-border shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm font-bold text-text-primary uppercase tracking-wider">
                  LỊCH SỬ BẢN THẢO — CHƯƠNG {chapterNumber}
                </h2>
                <span className="text-[11px] font-mono text-text-muted">
                  ({versions.length} phiên bản)
                </span>
              </div>
              <p className="text-[11px] text-text-secondary">
                So sánh khác biệt, xem lại các mốc thời gian và khôi phục nội dung cũ an toàn.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-sm text-text-muted hover:text-text-primary hover:bg-surface-elevated transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY (2 COLUMNS) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* LEFT: TIMELINE LIST (4 COLS) */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col h-full bg-surface-elevated/40">
            {/* Create Snapshot Quick Bar */}
            <div className="p-3 border-b border-border bg-surface shrink-0">
              {!showCreateForm ? (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full py-2 px-3 rounded-sm border border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition flex items-center justify-center gap-1.5 interactive-press"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>LƯU MỐC BẢN THẢO HIỆN TẠI</span>
                </button>
              ) : (
                <form onSubmit={handleCreateSnapshot} className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary text-[11px]">TẠO MỐC PHIÊN BẢN</span>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="text-text-muted hover:text-text-primary text-[10px]"
                    >
                      Đóng
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newVersionName}
                    onChange={(e) => setNewVersionName(e.target.value)}
                    placeholder="Tên mốc (VD: Nháp đoạn 1, Xong đại kết cục...)"
                    className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-text-primary text-xs"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={newChangeNote}
                    onChange={(e) => setNewChangeNote(e.target.value)}
                    placeholder="Ghi chú thay đổi (tùy chọn)..."
                    className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-text-primary text-xs"
                  />
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-2.5 py-1 rounded-sm border border-border text-text-secondary text-[11px]"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-3 py-1 rounded-sm bg-primary text-white font-bold text-[11px] hover:bg-primary-hover"
                    >
                      {creating ? 'Đang lưu...' : 'Lưu mốc'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Versions Scrollable List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/60 p-2 space-y-1">
              {loading ? (
                <div className="py-12 text-center text-xs text-text-muted space-y-1">
                  <Clock className="w-5 h-5 mx-auto animate-spin text-text-muted" />
                  <p>Đang tải lịch sử phiên bản...</p>
                </div>
              ) : versions.length === 0 ? (
                <div className="py-12 px-4 text-center text-xs text-text-muted space-y-2">
                  <Layers className="w-8 h-8 mx-auto text-text-muted/40 stroke-[1.5]" />
                  <p className="font-semibold text-text-primary">Chưa có mốc lưu nào</p>
                  <p className="text-[11px]">
                    Bấm nút "Lưu mốc bản thảo" ở trên hoặc sử dụng AI để hệ thống tự động ghi lại lịch sử.
                  </p>
                </div>
              ) : (
                versions.map((ver, idx) => {
                  const isSelected = ver.id === (selectedVersion?.id || '');
                  return (
                    <div
                      key={ver.id}
                      onClick={() => setSelectedVersionId(ver.id)}
                      className={`p-3 rounded-sm cursor-pointer transition text-left space-y-1.5 ${
                        isSelected
                          ? 'bg-surface border border-primary/40 shadow-sm'
                          : 'hover:bg-surface/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-xs text-text-primary truncate">
                          {ver.versionName || `Bản chụp #${versions.length - idx}`}
                        </span>
                        {getSourceBadge(ver.source)}
                      </div>

                      {ver.changeNote && (
                        <p className="text-[11px] text-text-secondary line-clamp-1 italic">
                          "{ver.changeNote}"
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-text-muted pt-0.5">
                        <span className="font-mono">
                          {ver.wordCount.toLocaleString()} từ • {formatTimeAgoVi(ver.createdAt)}
                        </span>
                        <span>{formatDateVi(ver.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: DIFF & PREVIEW (8 COLS) */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-surface">
            {selectedVersion ? (
              <>
                {/* View Toolbar */}
                <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3 shrink-0 bg-surface">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary truncate max-w-[200px] sm:max-w-xs">
                      {selectedVersion.versionName || selectedVersion.title}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">
                      (Tạo lúc {new Date(selectedVersion.createdAt).toLocaleTimeString('vi-VN')} {formatDateVi(selectedVersion.createdAt)})
                    </span>
                  </div>

                  {/* Mode Tabs */}
                  <div className="flex items-center gap-1 p-0.5 rounded-sm bg-surface-elevated border border-border text-xs">
                    <button
                      type="button"
                      onClick={() => setViewMode('diff')}
                      className={`px-2.5 py-1 rounded-sm font-semibold transition ${
                        viewMode === 'diff'
                          ? 'bg-surface text-text-primary shadow-xs font-bold'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      So sánh khác biệt (Diff)
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('preview')}
                      className={`px-2.5 py-1 rounded-sm font-semibold transition ${
                        viewMode === 'preview'
                          ? 'bg-surface text-text-primary shadow-xs font-bold'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Xem toàn văn
                    </button>
                  </div>
                </div>

                {/* Diff Stats Banner */}
                {viewMode === 'diff' && (
                  <div className="px-5 py-2 border-b border-border/80 bg-surface-elevated/30 flex items-center justify-between text-[11px] text-text-secondary">
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        +{diffSummary.added} đoạn mới thêm
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        -{diffSummary.removed} đoạn bị lược bỏ
                      </span>
                    </div>
                    <span className="text-text-muted text-[10.5px]">
                      Đối chiếu: Bản cũ ⟷ Bản hiện tại trong trình soạn thảo
                    </span>
                  </div>
                )}

                {/* Content Display Area */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 font-serif text-sm leading-relaxed space-y-4">
                  {viewMode === 'diff' ? (
                    diffBlocks.length === 0 ? (
                      <div className="py-16 text-center text-text-muted space-y-2">
                        <Check className="w-8 h-8 mx-auto text-success stroke-[2]" />
                        <p className="font-sans font-bold text-xs text-text-primary">
                          Không có khác biệt nào
                        </p>
                        <p className="font-sans text-[11px]">
                          Nội dung của phiên bản này trùng khớp hoàn toàn với bản thảo đang soạn thảo.
                        </p>
                      </div>
                    ) : (
                      diffBlocks.map((block, idx) => {
                        if (block.type === 'added') {
                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-sm bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-900 dark:text-emerald-200 relative group"
                            >
                              <span className="font-mono text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block mb-1">
                                [MỚI THÊM VÀO]
                              </span>
                              <p className="whitespace-pre-line">{block.text}</p>
                            </div>
                          );
                        }
                        if (block.type === 'removed') {
                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-sm bg-rose-500/10 border-l-4 border-rose-500 text-rose-900 dark:text-rose-300 line-through opacity-80"
                            >
                              <span className="font-mono text-[9px] font-bold uppercase text-rose-600 dark:text-rose-400 block mb-1 no-underline">
                                [ĐÃ LƯỢC BỎ KHỎI BẢN HIỆN TẠI]
                              </span>
                              <p className="whitespace-pre-line">{block.text}</p>
                            </div>
                          );
                        }
                        return (
                          <div
                            key={idx}
                            className="p-2 border-l-4 border-transparent text-text-primary whitespace-pre-line"
                          >
                            {block.text}
                          </div>
                        );
                      })
                    )
                  ) : (
                    <div className="whitespace-pre-line text-text-primary">
                      {selectedVersion.content || (
                        <span className="italic text-text-muted font-sans text-xs">
                          Chương này chưa có nội dung văn bản ở phiên bản đã chọn.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0 bg-surface">
                  <div className="text-xs text-text-muted font-mono">
                    Độ dài bản này: {selectedVersion.wordCount.toLocaleString()} từ
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3.5 py-1.5 border border-border bg-surface hover:bg-surface-elevated rounded-sm text-xs font-semibold text-text-secondary transition"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      onClick={handleRestore}
                      disabled={restoring}
                      className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 interactive-press shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{restoring ? 'ĐANG KHÔI PHỤC...' : 'KHÔI PHỤC PHIÊN BẢN NÀY'}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-text-muted">
                <p className="text-xs">Chọn một phiên bản bên trái để xem nội dung so sánh.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
