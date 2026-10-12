'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GitBranch, Sparkles, ThumbsUp, ArrowRight, Map, Check } from 'lucide-react';
import { StoryTreeMapModal } from './StoryTreeMapModal';

interface BranchingChoicesSectionProps {
  chapterId: string;
  chapterNumber: number;
  bookSlug: string;
  allChapters: { id: string; chapterNumber: number; title: string }[];
}

export function BranchingChoicesSection({
  chapterId,
  chapterNumber,
  bookSlug,
  allChapters,
}: BranchingChoicesSectionProps) {
  const [choices, setChoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [votedChoiceId, setVotedChoiceId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  const fetchChoices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/chapters/${chapterId}/choices`);
      if (res.ok) {
        const data = await res.json();
        setChoices(data.choices || []);
      }
    } catch (err) {
      console.error('Lỗi tải ngã rẽ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChoices();
  }, [chapterId]);

  const handleSuggest = async () => {
    try {
      setGenerating(true);
      const res = await fetch(`/api/chapters/${chapterId}/choices/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSave: true }),
      });
      if (res.ok) {
        await fetchChoices();
      } else {
        alert('Lỗi khi sinh ngã rẽ AI');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ');
    } finally {
      setGenerating(false);
    }
  };

  const handleVote = async (choiceId: string) => {
    if (votedChoiceId === choiceId) return;
    try {
      setVotedChoiceId(choiceId);
      setChoices((prev) =>
        prev.map((c) => (c.id === choiceId ? { ...c, voteCount: (c.voteCount || 0) + 1 } : c))
      );
      await fetch(`/api/chapters/${chapterId}/choices/${choiceId}/vote`, {
        method: 'POST',
      });
    } catch {}
  };

  if (loading) return null;

  return (
    <div className="mt-12 p-5 sm:p-7 border border-border bg-surface-elevated/50 rounded-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="space-y-1">
          <span className="label-caps text-primary flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            ĐA VŨ TRỤ CỐT TRUYỆN (BRANCHING PATHS)
          </span>
          <h3 className="font-sans font-bold text-lg text-text-primary">
            Ngã Rẽ Vận Mệnh: Lựa Chọn Của Bạn Là Gì?
          </h3>
          <p className="text-xs text-text-secondary">
            Mỗi lựa chọn rẽ nhánh mở ra hướng đi khác nhau cho nhân vật chính.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMapOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-surface hover:bg-surface-elevated text-xs font-mono text-text-primary transition"
          >
            <Map className="w-3.5 h-3.5 text-primary" />
            <span>SƠ ĐỒ CÂY</span>
          </button>

          {choices.length === 0 && (
            <button
              onClick={handleSuggest}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-text-primary text-background hover:bg-primary hover:text-white text-xs font-mono font-bold transition disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-primary ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'ĐANG SINH NGÃ RẼ...' : 'AI TẠO 3 NGÃ RẼ'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Choices Grid */}
      {choices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {choices.map((c, idx) => {
            const hasTarget = !!c.targetChapter;
            const isVoted = votedChoiceId === c.id;

            return (
              <div
                key={c.id}
                className="p-4 border border-border bg-surface hover:border-primary/60 transition flex flex-col justify-between space-y-3 shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                    <span>NHÁNH {String.fromCharCode(65 + idx)}</span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{c.voteCount || 0} phiếu</span>
                    </span>
                  </div>

                  <h4 className="font-sans font-bold text-sm text-text-primary leading-snug">
                    {c.choiceText}
                  </h4>

                  {c.summary && (
                    <p className="text-xs text-text-secondary font-sans line-clamp-2 leading-relaxed">
                      {c.summary}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-border/70 flex items-center justify-between gap-2">
                  {hasTarget ? (
                    <Link
                      href={`/read/${bookSlug}/${c.targetChapter.chapterNumber}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-text-primary text-background hover:bg-primary hover:text-white text-xs font-mono font-bold transition rounded-xs"
                    >
                      <span>THEO NHÁNH NÀY</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleVote(c.id)}
                      className={`w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-mono border transition ${
                        isVoted
                          ? 'bg-primary/10 border-primary text-primary font-bold'
                          : 'bg-surface-elevated border-border text-text-primary hover:border-primary'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{isVoted ? 'ĐÃ BÌNH CHỌN' : 'BÌNH CHỌN HƯỚNG NÀY'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 border border-dashed border-border text-center space-y-2 bg-surface/40">
          <p className="text-xs text-text-secondary">
            Chương này chưa thiết lập ngã rẽ phân nhánh.
          </p>
          <p className="text-[11px] text-text-muted">
            Bấm nút <strong className="text-text-primary">"AI TẠO 3 NGÃ RẼ"</strong> ở trên để AI phân tích hồi kết và tự động tạo các ngã rẽ kịch tính!
          </p>
        </div>
      )}

      {/* Modal Cây cốt truyện */}
      <StoryTreeMapModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        bookSlug={bookSlug}
        currentChapterNumber={chapterNumber}
        allChapters={allChapters}
        choices={choices}
      />
    </div>
  );
}
