'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, X, Send, EyeOff, Check, User } from 'lucide-react';
import { formatDateVi } from '@/lib/utils';

interface InlineCommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  paragraphIndex: number;
  paragraphText: string;
  onCommentAdded?: () => void;
}

export function InlineCommentDrawer({
  isOpen,
  onClose,
  chapterId,
  paragraphIndex,
  paragraphText,
  onCommentAdded,
}: InlineCommentDrawerProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchComments() {
      try {
        setLoading(true);
        const res = await fetch(`/api/chapters/${chapterId}/paragraphs/${paragraphIndex}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch (err) {
        console.error('Lỗi tải bình luận đoạn:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, [isOpen, chapterId, paragraphIndex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/chapters/${chapterId}/paragraphs/${paragraphIndex}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          isSpoiler,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewContent('');
        setIsSpoiler(false);
        if (onCommentAdded) onCommentAdded();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Lỗi gửi bình luận');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex justify-end animate-in fade-in duration-150">
      <div className="w-full sm:w-[420px] max-w-full h-full bg-surface border-l border-border flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="font-serif font-bold text-base text-text-primary">
              Bình Luận Đoạn #{paragraphIndex + 1}
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-surface border border-border text-text-secondary">
              {comments.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-secondary hover:text-text-primary transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quoted paragraph excerpt */}
        <div className="p-4 bg-surface-elevated/60 border-b border-border text-xs">
          <span className="block font-mono text-[9.5px] uppercase tracking-wider text-text-muted mb-1">
            Đoạn văn trích dẫn:
          </span>
          <p className="font-serif italic text-text-secondary line-clamp-3 leading-relaxed border-l-2 border-primary/60 pl-2.5">
            &ldquo;{paragraphText.trim()}&rdquo;
          </p>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-text-muted">
              Đang tải bình luận...
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-text-secondary">
              <MessageSquare className="w-7 h-7 mx-auto opacity-30" />
              <p className="text-xs font-serif">
                Chưa có bình luận nào cho đoạn này.
              </p>
              <p className="text-[11px] text-text-muted">
                Hãy là người đầu tiên chia sẻ góc nhìn hoặc cảm xúc của bạn!
              </p>
            </div>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="p-3 border border-border bg-surface-elevated/30 rounded-sm space-y-2"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                      {c.user?.name?.[0]?.toUpperCase() || c.user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-semibold text-text-primary">
                      {c.user?.name || c.user?.username || 'Độc giả'}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono">
                    {formatDateVi(c.createdAt)}
                  </span>
                </div>

                <div className="text-xs text-text-secondary leading-relaxed font-sans">
                  {c.isSpoiler ? (
                    <details className="cursor-pointer group">
                      <summary className="text-[11px] font-mono text-amber-600 dark:text-amber-400 select-none flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        <span>Bình luận tiết lộ tình tiết (Bấm để xem)</span>
                      </summary>
                      <p className="mt-1.5 pt-1.5 border-t border-border/60 text-text-primary">
                        {c.content}
                      </p>
                    </details>
                  ) : (
                    <p className="whitespace-pre-line text-text-primary">{c.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input Footer */}
        <div className="p-4 border-t border-border bg-surface">
          {currentUser ? (
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Viết cảm nghĩ về đoạn văn này..."
                rows={2}
                className="w-full p-2.5 border border-border bg-surface-elevated text-xs text-text-primary focus:outline-none focus:border-primary resize-none"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[11px] text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSpoiler}
                    onChange={(e) => setIsSpoiler(e.target.checked)}
                    className="accent-primary w-3.5 h-3.5"
                  />
                  <span>Chứa tình tiết tiết lộ (Spoiler)</span>
                </label>

                <button
                  type="submit"
                  disabled={submitting || !newContent.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-text-primary text-background hover:bg-primary hover:text-white text-xs font-mono font-bold transition disabled:opacity-40"
                >
                  <Send className="w-3 h-3" />
                  <span>{submitting ? 'GỬI...' : 'BÌNH LUẬN'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-2 text-xs space-y-1">
              <p className="text-text-secondary">Đăng nhập để gửi bình luận cho đoạn văn này</p>
              <Link
                href="/login"
                className="inline-block text-xs font-bold text-primary hover:underline"
              >
                Đăng nhập ngay →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
