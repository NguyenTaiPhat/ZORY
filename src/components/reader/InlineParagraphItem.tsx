'use client';

import React, { useState } from 'react';
import { MessageSquare, Flame } from 'lucide-react';

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

  return (
    <div
      className="group relative transition-colors duration-150 rounded-sm"
      onMouseEnter={() => setShowPicker(true)}
      onMouseLeave={() => setShowPicker(false)}
    >
      {/* Nội dung đoạn văn */}
      <p className="text-left sm:text-justify leading-relaxed indent-4 sm:indent-8 break-words select-text">
        {text}
      </p>

      {/* Action Strip: Floating Badge & Quick Actions */}
      <div className="flex items-center gap-2 mt-1 sm:mt-0 sm:absolute sm:-right-2 sm:top-0 sm:translate-x-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pl-4 sm:pl-2">
        {/* Reaction Picker Bar (Hover trên desktop hoặc khi mở) */}
        <div
          className={`flex items-center gap-1 p-1 bg-surface border border-border rounded-full shadow-md text-xs backdrop-blur-sm transition-all duration-150 ${
            showPicker ? 'scale-100 opacity-100' : 'sm:scale-95 sm:opacity-0 sm:pointer-events-none'
          }`}
        >
          {Object.entries(REACTION_ICONS).map(([key, item]) => {
            const isSelected = userReaction === key;
            return (
              <button
                key={key}
                onClick={(e) => {
                  e.stopPropagation();
                  onReact(key);
                }}
                title={item.label}
                className={`w-6 h-6 flex items-center justify-center text-sm rounded-full transition transform hover:scale-125 ${
                  isSelected ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-surface-elevated'
                }`}
              >
                {item.emoji}
              </button>
            );
          })}
        </div>

        {/* Floating Stat Badge (Luôn hiển thị nếu có tương tác, hoặc khi hover) */}
        {(totalReactions > 0 || commentsCount > 0) && (
          <div className="flex items-center gap-1.5 py-0.5 px-2 bg-surface border border-border rounded-full shadow-xs text-[11px] font-mono text-text-secondary">
            {totalReactions > 0 && (
              <span className="flex items-center gap-0.5">
                <span>{topEmoji}</span>
                <span className="font-bold text-text-primary">{totalReactions}</span>
              </span>
            )}
            {totalReactions > 0 && commentsCount > 0 && <span className="opacity-40">•</span>}
            {commentsCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenComments();
                }}
                className="flex items-center gap-0.5 hover:text-primary transition"
                title="Xem bình luận đoạn văn"
              >
                <MessageSquare className="w-3 h-3 text-primary" />
                <span className="font-bold text-text-primary">{commentsCount}</span>
              </button>
            )}
          </div>
        )}

        {/* Nút mở comment drawer nếu đoạn chưa có comment */}
        {commentsCount === 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments();
            }}
            className="p-1 rounded-full bg-surface border border-border hover:border-primary text-text-muted hover:text-primary transition shadow-xs"
            title="Bình luận đoạn văn này"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
