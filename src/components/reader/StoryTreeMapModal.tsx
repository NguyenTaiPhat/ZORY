'use client';

import React from 'react';
import Link from 'next/link';
import { GitBranch, X, ChevronRight, BookOpen } from 'lucide-react';

interface StoryTreeMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookSlug: string;
  currentChapterNumber: number;
  allChapters: { id: string; chapterNumber: number; title: string }[];
  choices: any[];
}

export function StoryTreeMapModal({
  isOpen,
  onClose,
  bookSlug,
  currentChapterNumber,
  allChapters,
  choices,
}: StoryTreeMapModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-surface border border-border p-5 sm:p-7 space-y-5 max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <h3 className="font-serif font-bold text-lg text-text-primary">
              Cây Cốt Truyện & Mạng Lưới Nhánh
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-secondary hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-text-secondary">
          Bản đồ tổng thể các dòng thời gian và ngã rẽ đã mở khóa trong tác phẩm. Bạn có thể quay lại ngã ba bất kỳ để trải nghiệm hướng đi khác.
        </p>

        {/* Tree Path Visualizer */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {allChapters.map((ch) => {
            const isCurrent = ch.chapterNumber === currentChapterNumber;
            return (
              <div
                key={ch.id}
                className={`p-3.5 border transition ${
                  isCurrent
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-surface-elevated/40 hover:border-text-secondary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-primary">
                      [CHƯƠNG {ch.chapterNumber.toString().padStart(2, '0')}]
                    </span>
                    <h4 className="font-serif font-bold text-xs sm:text-sm text-text-primary">
                      {ch.title}
                    </h4>
                  </div>
                  {isCurrent ? (
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 bg-primary text-white rounded-xs">
                      Đang đọc
                    </span>
                  ) : (
                    <Link
                      href={`/read/${bookSlug}/${ch.chapterNumber}`}
                      onClick={onClose}
                      className="text-xs font-mono font-semibold text-primary hover:underline flex items-center gap-0.5"
                    >
                      <span>Chuyển tới</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {isCurrent && choices.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-border/80 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-text-muted block">
                      Các ngã rẽ tỏa ra từ chương này:
                    </span>
                    <div className="grid grid-cols-1 gap-1.5 pl-3 border-l-2 border-primary/50">
                      {choices.map((c, idx) => (
                        <div key={idx} className="text-xs text-text-secondary font-sans flex items-start gap-1.5">
                          <span className="text-primary font-bold">↳</span>
                          <div>
                            <strong className="text-text-primary">{c.choiceText}</strong>
                            {c.summary && <p className="text-[11px] text-text-muted italic">{c.summary}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border text-xs font-mono text-text-secondary hover:text-text-primary"
          >
            ĐÓNG BẢN ĐỒ
          </button>
        </div>
      </div>
    </div>
  );
}
