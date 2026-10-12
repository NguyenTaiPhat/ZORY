'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, Zap, Sparkles, ChevronRight, X } from 'lucide-react';
import { CharacterRelationshipGraph, LoreEntryData } from '@/components/studio/CharacterRelationshipGraph';

interface BookLoreSectionProps {
  bookSlug: string;
}

export function BookLoreSection({ bookSlug }: BookLoreSectionProps) {
  const [entries, setEntries] = useState<LoreEntryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CHARACTER' | 'FACTION' | 'REALM'>('ALL');
  const [viewMode, setViewMode] = useState<'graph' | 'cards'>('graph');

  useEffect(() => {
    async function loadLore() {
      try {
        setLoading(true);
        const res = await fetch(`/api/books/${bookSlug}/lore`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data.loreEntries || []);
        }
      } catch (err) {
        console.error('Lỗi tải Lorebook tác phẩm:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLore();
  }, [bookSlug]);

  if (loading) {
    return (
      <section className="bg-surface rounded-md border border-border p-6 text-center text-xs text-text-secondary">
        Đang tải tư liệu thế giới & nhân vật...
      </section>
    );
  }

  if (entries.length === 0) {
    return null; // Không hiển thị nếu tác phẩm chưa có lore
  }

  const characters = entries.filter((e) => e.category === 'CHARACTER');
  const factions = entries.filter((e) => e.category === 'FACTION');
  const realms = entries.filter((e) => e.category === 'REALM');

  const filtered = entries.filter((e) => {
    if (activeTab === 'ALL') return true;
    return e.category === activeTab;
  });

  return (
    <section className="bg-surface rounded-md border border-border p-6 md:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <span className="label-caps text-primary">TÀI LIỆU THIẾT LẬP THẾ GIỚI</span>
          <h2 className="font-display text-xl font-bold text-text-primary">
            Sơ Đồ Nhân Vật & Lorebook Tác Phẩm
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Khám phá nguồn gốc xuất thân, quan hệ ân oán và hệ thống võ đạo trong vũ trụ tác phẩm.
          </p>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border bg-surface-elevated p-0.5 rounded-sm text-xs font-mono">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1 transition ${
                viewMode === 'graph'
                  ? 'bg-text-primary text-background font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sơ đồ nhân vật
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 transition ${
                viewMode === 'cards'
                  ? 'bg-text-primary text-background font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Hồ sơ chi tiết ({entries.length})
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'graph' ? (
        <CharacterRelationshipGraph entries={entries} />
      ) : (
        <div className="space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {[
              { id: 'ALL', label: `TẤT CẢ (${entries.length})` },
              { id: 'CHARACTER', label: `NHÂN VẬT (${characters.length})` },
              { id: 'FACTION', label: `THẾ LỰC (${factions.length})` },
              { id: 'REALM', label: `CẢNH GIỚI (${realms.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded-sm border transition ${
                  activeTab === tab.id
                    ? 'bg-text-primary text-background border-text-primary'
                    : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-border bg-surface-elevated/40 hover:border-text-secondary transition space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-serif font-bold text-base text-text-primary">{item.name}</h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-surface border border-border text-text-secondary">
                    {item.role || item.category}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  {item.realm && (
                    <span className="px-1.5 py-0.5 bg-surface border border-border text-primary font-mono font-semibold">
                      {item.realm}
                    </span>
                  )}
                  {item.faction && (
                    <span className="px-1.5 py-0.5 bg-surface border border-border text-text-secondary">
                      {item.faction}
                    </span>
                  )}
                </div>

                <p className="text-xs text-text-secondary leading-relaxed font-serif line-clamp-3">
                  {item.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
