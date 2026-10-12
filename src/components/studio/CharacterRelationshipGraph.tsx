'use client';

import React, { useState } from 'react';
import { Users, Shield, Zap, Sparkles, BookOpen, ChevronRight, X } from 'lucide-react';

export interface LoreEntryData {
  id: string;
  category: string;
  name: string;
  aliases?: string | null;
  role?: string | null;
  realm?: string | null;
  faction?: string | null;
  summary: string;
  detailsJson?: string | null;
}

interface CharacterRelationshipGraphProps {
  entries: LoreEntryData[];
  onSelectEntry?: (entry: LoreEntryData) => void;
}

export function CharacterRelationshipGraph({
  entries,
  onSelectEntry,
}: CharacterRelationshipGraphProps) {
  const [selectedChar, setSelectedChar] = useState<LoreEntryData | null>(null);

  // Lọc chỉ lấy nhân vật cho đồ thị mạng lưới
  const characters = entries.filter((e) => e.category === 'CHARACTER');
  const factions = entries.filter((e) => e.category === 'FACTION');

  if (characters.length === 0) {
    return (
      <div className="p-8 border border-dashed border-border text-center space-y-3 bg-surface/50">
        <Users className="w-8 h-8 text-text-muted mx-auto" />
        <p className="text-xs text-text-secondary">
          Chưa có nhân vật nào để tạo sơ đồ quan hệ. Hãy bấm nút{' '}
          <strong className="text-text-primary">"AI Quét & Trích Xuất Lore"</strong> ở trên để tự động phân tích từ các chương!
        </p>
      </div>
    );
  }

  // Parse relations from detailsJson or summary
  const getParsedRelations = (char: LoreEntryData): string[] => {
    if (!char.detailsJson) return [];
    try {
      const parsed = JSON.parse(char.detailsJson);
      if (parsed.relationships) {
        if (Array.isArray(parsed.relationships)) return parsed.relationships;
        if (typeof parsed.relationships === 'string') return [parsed.relationships];
      }
    } catch {}
    return [];
  };

  const getRoleBadgeColor = (role?: string | null) => {
    const r = (role || '').toLowerCase();
    if (r.includes('chính')) return 'bg-primary text-white border-primary';
    if (r.includes('phản') || r.includes('tà')) return 'bg-error/15 text-error border-error/30';
    if (r.includes('tiền bối') || r.includes('sư')) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    return 'bg-surface-elevated text-text-secondary border-border';
  };

  return (
    <div className="space-y-6">
      {/* Network Overview Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface-elevated/60 border border-border text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary" />
            Mạng lưới nhân vật ({characters.length})
          </span>
          <span className="text-text-muted hidden sm:inline">•</span>
          <span className="text-text-secondary text-[11px] hidden sm:inline">
            Bấm vào từng nhân vật để xem liên kết và chi tiết võ đạo
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" /> Nhân vật chính
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Tiền bối / Sư đồ
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-error" /> Đối địch / Phản diện
          </span>
        </div>
      </div>

      {/* Grid of Character Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((char) => {
          const relations = getParsedRelations(char);
          const isSelected = selectedChar?.id === char.id;

          return (
            <div
              key={char.id}
              onClick={() => {
                setSelectedChar(char);
                if (onSelectEntry) onSelectEntry(char);
              }}
              className={`p-4 border transition cursor-pointer relative bg-surface flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'border-primary shadow-md ring-1 ring-primary bg-primary/5'
                  : 'border-border hover:border-text-secondary hover:shadow-sm'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif font-bold text-base text-text-primary tracking-tight">
                      {char.name}
                    </h3>
                    {char.aliases && (
                      <span className="text-[11px] text-text-muted font-sans italic block">
                        Danh xưng: {char.aliases}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm border ${getRoleBadgeColor(
                      char.role
                    )}`}
                  >
                    {char.role || 'Nhân vật'}
                  </span>
                </div>

                {/* Realm & Faction tags */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  {char.realm && (
                    <span className="px-2 py-0.5 bg-surface-elevated border border-border text-primary font-mono font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-primary" />
                      {char.realm}
                    </span>
                  )}
                  {char.faction && (
                    <span className="px-2 py-0.5 bg-surface-elevated border border-border text-text-secondary font-sans flex items-center gap-1">
                      <Shield className="w-3 h-3 text-text-muted" />
                      {char.faction}
                    </span>
                  )}
                </div>

                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 pt-1 font-serif">
                  {char.summary}
                </p>
              </div>

              {/* Relationship excerpt */}
              {relations.length > 0 && (
                <div className="pt-2 border-t border-border/80 text-[11px] font-sans text-text-secondary space-y-1">
                  <span className="text-text-muted font-mono uppercase text-[9.5px] block">
                    Mối quan hệ:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {relations.map((rel, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-surface-elevated border border-border/60 text-[10.5px] text-text-primary"
                      >
                        {rel}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Character Deep Profile Drawer/Modal */}
      {selectedChar && (
        <div className="p-5 border border-primary/40 bg-surface-elevated/90 space-y-4 rounded-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <h4 className="font-serif font-bold text-lg text-text-primary">
                Chi Tiết Hồ Sơ: {selectedChar.name}
              </h4>
            </div>
            <button
              onClick={() => setSelectedChar(null)}
              className="p-1 text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
            <div className="space-y-1 p-3 bg-surface border border-border">
              <span className="text-text-muted font-mono uppercase text-[10px] block">Vai trò</span>
              <strong className="text-text-primary">{selectedChar.role || 'Chưa định nghĩa'}</strong>
            </div>
            <div className="space-y-1 p-3 bg-surface border border-border">
              <span className="text-text-muted font-mono uppercase text-[10px] block">Tu vi / Cảnh giới</span>
              <strong className="text-primary font-mono">{selectedChar.realm || 'Phàm nhân / Không rõ'}</strong>
            </div>
            <div className="space-y-1 p-3 bg-surface border border-border">
              <span className="text-text-muted font-mono uppercase text-[10px] block">Thế lực / Tông môn</span>
              <strong className="text-text-primary">{selectedChar.faction || 'Tự do'}</strong>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="text-text-muted font-mono uppercase text-[10px] block">Tiểu sử & Đặc điểm</span>
            <p className="p-3 bg-surface border border-border font-serif text-sm leading-relaxed text-text-secondary">
              {selectedChar.summary}
            </p>
          </div>

          {getParsedRelations(selectedChar).length > 0 && (
            <div className="space-y-2 text-xs">
              <span className="text-text-muted font-mono uppercase text-[10px] block">Mạng lưới liên hệ</span>
              <div className="p-3 bg-surface border border-border space-y-1.5">
                {getParsedRelations(selectedChar).map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-text-secondary font-sans text-xs">
                    <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
