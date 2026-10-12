'use client';

import React, { useState } from 'react';
import { MessageSquare, SmilePlus } from 'lucide-react';

export const REACTION_ICONS: Record<string, { emoji: string; label: string }> = {
  FIRE: { emoji: '🔥', label: 'Cực cuốn' },
  HEART: { emoji: '❤️', label: 'Cảm động' },
  LAUGH: { emoji: '😂', label: 'Hài hước' },
  SHOCK: { emoji: '😮', label: 'Bất ngờ' },
  SAD: { emoji: '😭', label: 'Xót xa' },
};

interface InlineParagraphItemProps {
  index: number;
  text: string;
  reactions?: Record<string, number>;
  userReaction?: string | null;
  commentsCount?: number;
  onReact: (reaction: string) => void;
  onOpenComments: () => void;
}

export function InlineParagraphItem({
  index,
  text,
  reactions = {},
  userReaction = null,
  commentsCount = 0,
  onReact,
  onOpenComments,
}: InlineParagraphItemProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Tính tổng số reactions
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  // Lấy ra reaction nhiều nhất để làm icon đại diện
  const topReactionKey = Object.entries(reactions).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topEmoji = topReactionKey ? REACTION_ICONS[topReactionKey]?.emoji : '🔥';

  const hasInteractions = totalReactions > 0 || commentsCount > 0;

  return (
    <div
      className="group relative transition-colors duration-150 rounded-sm"
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
    >
      {/* Nội dung đoạn văn */}
      <p className="text-left sm:text-justify leading-relaxed indent-4 sm:indent-8 break-words select-text">
        {text}
      </p>

      {/* Thanh tương tác nội bộ đoạn: Luôn nằm trong flow trang, tuyệt đối không tràn lề */}
      <div className="flex items-center gap-2 mt-1.5 flex-wrap min-w-0">
        {/* Reaction & Comment Badges (Hiện diện trực quan khi có tương tác) */}
        {hasInteractions && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {totalReactions > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPicker((prev) => !prev);
                }}
                className={`inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-xs font-mono border transition shadow-2xs ${
                  userReaction
                    ? 'border-primary/50 bg-primary/10 text-primary font-bold'
                    : 'border-border bg-surface-elevated/80 text-text-secondary hover:bg-surface-elevated'
                }`}
                title="Bấm để thả hoặc đổi cảm xúc"
              >
                <span>{topEmoji}</span>
                <span>{totalReactions}</span>
                {userReaction && (
                  <span className="text-[11px] font-sans font-medium text-primary">
                    (Bạn: {REACTION_ICONS[userReaction]?.emoji})
                  </span>
                )}
              </button>
            )}

            {commentsCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenComments();
                }}
                className="inline-flex items-center gap-1 py-0.5 px-2.5 rounded-full text-xs font-mono border border-border bg-surface-elevated/80 text-text-secondary hover:text-primary hover:border-primary/40 transition shadow-2xs"
                title="Xem bình luận của đoạn văn"
              >
                <MessageSquare className="w-3 h-3 text-primary shrink-0" />
                <span className="font-semibold text-text-primary">{commentsCount}</span>
                <span className="text-[10px] text-text-muted font-sans">bình luận</span>
              </button>
            )}
          </div>
        )}

        {/* Nút kích hoạt Picker & Comment nếu đoạn văn chưa có tương tác */}
        {!hasInteractions && !showPicker && (
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPicker(true);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-sans border border-border/80 bg-surface text-text-muted hover:text-primary hover:border-primary/40 transition"
              title="Thả cảm xúc cho đoạn này"
            >
              <SmilePlus className="w-3 h-3 text-primary" />
              <span>Cảm xúc</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments();
              }}
              className="p-1 rounded-full text-text-muted hover:text-primary transition"
              title="Bình luận đoạn văn"
            >
              <MessageSquare className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Nút phản hồi nhanh trên thiết bị cảm ứng (Mobile touch fallback) */}
        {!hasInteractions && !showPicker && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPicker(true);
            }}
            className="sm:hidden inline-flex items-center gap-1 text-[10.5px] text-text-muted/60 hover:text-primary py-0.5"
          >
            <span>+ Tương tác</span>
          </button>
        )}

        {/* Floating / Inline Emoji Picker Bar */}
        {showPicker && (
          <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-full shadow-md text-xs backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100">
            {Object.entries(REACTION_ICONS).map(([key, item]) => {
              const isSelected = userReaction === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReact(key);
                    setShowPicker(false);
                  }}
                  title={item.label}
                  className={`w-7 h-7 flex items-center justify-center text-sm rounded-full transition transform hover:scale-125 ${
                    isSelected ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-surface-elevated'
                  }`}
                >
                  {item.emoji}
                </button>
              );
            })}

            <div className="w-px h-4 bg-border mx-0.5" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments();
                setShowPicker(false);
              }}
              className="p-1.5 rounded-full text-text-secondary hover:text-primary hover:bg-surface-elevated transition"
              title="Viết bình luận cho đoạn này"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPicker(false);
              }}
              className="text-[10px] text-text-muted hover:text-text-primary px-1 font-mono"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
