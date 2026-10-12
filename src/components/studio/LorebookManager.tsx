'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Users,
  Shield,
  Zap,
  Box,
  Layers,
  Search,
  Check,
  RefreshCw,
  X,
  BookOpen,
  Heart,
} from 'lucide-react';
import { CharacterRelationshipGraph, LoreEntryData } from './CharacterRelationshipGraph';

interface LorebookManagerProps {
  projectId: string;
  projectTitle: string;
}

export function LorebookManager({ projectId, projectTitle }: LorebookManagerProps) {
  const [entries, setEntries] = useState<LoreEntryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [message, setMessage] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal xác nhận tùy biến thay thế confirm() mặc định của trình duyệt
  const [confirmScanOpen, setConfirmScanOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Modal thêm/sửa Lore
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LoreEntryData | null>(null);
  const [formCategory, setFormCategory] = useState('CHARACTER');
  const [formName, setFormName] = useState('');
  const [formAliases, setFormAliases] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formRealm, setFormRealm] = useState('');
  const [formFaction, setFormFaction] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formRelationships, setFormRelationships] = useState('');
  const [formGender, setFormGender] = useState('NAM');
  const [formOrientation, setFormOrientation] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const fetchLore = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/studio/projects/${projectId}/lore`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.loreEntries || []);
      }
    } catch (err) {
      console.error('Lỗi tải Lorebook:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLore();
  }, [projectId]);

  // AI Tự động quét và trích xuất Lore từ toàn bộ chương (kích hoạt từ modal xác nhận tùy biến)
  const handleConfirmExtractLore = async () => {
    setConfirmScanOpen(false);
    try {
      setExtracting(true);
      setMessage('Đang kích hoạt AI đọc toàn bộ bản thảo...');
      const res = await fetch(`/api/studio/projects/${projectId}/lore/extract`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setEntries(data.allLore || []);
        setMessage(data.message || 'Trích xuất hoàn tất!');
        setTimeout(() => setMessage(''), 5000);
      } else {
        alert(data.error || 'Lỗi khi trích xuất');
        setMessage('');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ');
      setMessage('');
    } finally {
      setExtracting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { id: loreId } = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/studio/projects/${projectId}/lore/${loreId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== loreId));
      } else {
        alert('Lỗi xóa thực thể');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEntry(null);
    setFormCategory('CHARACTER');
    setFormName('');
    setFormAliases('');
    setFormRole('');
    setFormRealm('');
    setFormFaction('');
    setFormSummary('');
    setFormRelationships('');
    setFormGender('NAM');
    setFormOrientation('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (entry: LoreEntryData) => {
    setEditingEntry(entry);
    setFormCategory(entry.category);
    setFormName(entry.name);
    setFormAliases(entry.aliases || '');
    setFormRole(entry.role || '');
    setFormRealm(entry.realm || '');
    setFormFaction(entry.faction || '');
    setFormSummary(entry.summary);
    let rel = '';
    let gen = 'NAM';
    let ori = '';
    if (entry.detailsJson) {
      try {
        const parsed = JSON.parse(entry.detailsJson);
        rel = parsed.relationships || '';
        if (parsed.gender) gen = parsed.gender;
        if (parsed.orientation) ori = parsed.orientation;
      } catch {}
    }
    setFormRelationships(rel);
    setFormGender(gen);
    setFormOrientation(ori);
    setModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSummary.trim()) {
      alert('Vui lòng nhập tên và mô tả tóm tắt');
      return;
    }

    try {
      setFormSaving(true);
      const detailsPayload: Record<string, any> = {};
      if (formRelationships.trim()) detailsPayload.relationships = formRelationships.trim();
      if (formCategory === 'CHARACTER') {
        if (formGender) detailsPayload.gender = formGender;
        if (formOrientation.trim()) detailsPayload.orientation = formOrientation.trim();
      }
      const finalDetailsJson = Object.keys(detailsPayload).length > 0 ? detailsPayload : null;

      if (editingEntry) {
        // PATCH
        const res = await fetch(`/api/studio/projects/${projectId}/lore/${editingEntry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            aliases: formAliases,
            role: formRole,
            realm: formRealm,
            faction: formFaction,
            summary: formSummary,
            detailsJson: finalDetailsJson,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setEntries((prev) =>
            prev.map((item) => (item.id === editingEntry.id ? { ...item, ...data.entry } : item))
          );
          setModalOpen(false);
        } else {
          alert('Lỗi cập nhật');
        }
      } else {
        // POST
        const res = await fetch(`/api/studio/projects/${projectId}/lore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: formCategory,
            name: formName,
            aliases: formAliases,
            role: formRole,
            realm: formRealm,
            faction: formFaction,
            summary: formSummary,
            detailsJson: finalDetailsJson,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setEntries((prev) => [data.entry, ...prev]);
          setModalOpen(false);
        } else {
          alert('Lỗi tạo mới');
        }
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setFormSaving(false);
    }
  };

  // Filter & Search
  const filteredEntries = entries.filter((entry) => {
    const matchCategory = activeCategory === 'ALL' || entry.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.summary && entry.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.faction && entry.faction.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const charCount = entries.filter((e) => e.category === 'CHARACTER').length;
  const factionCount = entries.filter((e) => e.category === 'FACTION').length;
  const realmCount = entries.filter((e) => e.category === 'REALM').length;
  const artifactCount = entries.filter((e) => e.category === 'ARTIFACT').length;

  return (
    <>
      <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner & Control Strip */}
      <div className="p-5 sm:p-6 border border-border bg-surface space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="label-caps text-primary">WORLDBUILDING & KNOWLEDGE GRAPH</span>
              {entries.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-surface-elevated border border-border text-text-secondary">
                  {entries.length} Thực thể
                </span>
              )}
            </div>
            <h2 className="font-sans text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Sổ Tay Thế Giới & Mạng Lưới Nhân Vật
            </h2>
            <p className="text-xs text-text-secondary">
              Lưu trữ danh bạ nhân vật, hệ thống môn phái và tu vi. Giữ AI co-writing luôn nhất quán không bao giờ bị mất trí nhớ.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setConfirmScanOpen(true)}
              disabled={extracting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-text-primary text-background hover:bg-primary hover:text-white text-xs font-sans font-bold tracking-wider uppercase transition shadow-sm disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-primary ${extracting ? 'animate-spin' : ''}`} />
              <span>{extracting ? 'ĐANG QUÉT BẢN THẢO...' : 'AI QUÉT & TRÍCH XUẤT LORE'}</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-elevated hover:bg-border border border-border text-xs font-sans font-semibold text-text-primary transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>THÊM THỦ CÔNG</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-primary/10 border border-primary/20 text-xs font-sans text-primary flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        {/* Counter Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border/80">
          <div className="p-2.5 bg-surface-elevated/70 border border-border flex items-center gap-2.5">
            <Users className="w-4 h-4 text-primary" />
            <div>
              <span className="block text-[10px] font-mono uppercase text-text-muted">Nhân vật</span>
              <strong className="text-xs font-bold text-text-primary">{charCount}</strong>
            </div>
          </div>
          <div className="p-2.5 bg-surface-elevated/70 border border-border flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-500" />
            <div>
              <span className="block text-[10px] font-mono uppercase text-text-muted">Thế lực / Tông môn</span>
              <strong className="text-xs font-bold text-text-primary">{factionCount}</strong>
            </div>
          </div>
          <div className="p-2.5 bg-surface-elevated/70 border border-border flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="block text-[10px] font-mono uppercase text-text-muted">Cảnh giới / Cấp bậc</span>
              <strong className="text-xs font-bold text-text-primary">{realmCount}</strong>
            </div>
          </div>
          <div className="p-2.5 bg-surface-elevated/70 border border-border flex items-center gap-2.5">
            <Box className="w-4 h-4 text-purple-500" />
            <div>
              <span className="block text-[10px] font-mono uppercase text-text-muted">Pháp bảo / Bí kíp</span>
              <strong className="text-xs font-bold text-text-primary">{artifactCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Category Filters, Search & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-sans font-semibold">
          {[
            { id: 'ALL', label: 'TẤT CẢ' },
            { id: 'CHARACTER', label: 'NHÂN VẬT' },
            { id: 'FACTION', label: 'THẾ LỰC' },
            { id: 'REALM', label: 'CẢNH GIỚI' },
            { id: 'ARTIFACT', label: 'BẢO VẬT' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 transition rounded-sm border ${
                activeCategory === cat.id
                  ? 'bg-text-primary text-background border-text-primary font-bold'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* View Mode & Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, thế lực..."
              className="pl-8 pr-3 py-1 text-xs border border-border bg-surface text-text-primary focus:outline-none focus:border-primary w-40 sm:w-52"
            />
          </div>

          <div className="flex items-center border border-border bg-surface p-0.5 rounded-sm">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-2.5 py-1 text-xs font-mono transition ${
                viewMode === 'graph'
                  ? 'bg-text-primary text-background font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sơ đồ mạng
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 text-xs font-mono transition ${
                viewMode === 'list'
                  ? 'bg-text-primary text-background font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Danh sách
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-text-secondary">
          Đang tải dữ liệu Lorebook...
        </div>
      ) : viewMode === 'graph' && activeCategory === 'ALL' ? (
        <CharacterRelationshipGraph entries={filteredEntries} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.length === 0 ? (
            <div className="col-span-full p-8 border border-dashed border-border text-center space-y-2 bg-surface/50">
              <p className="text-xs text-text-secondary">Không tìm thấy thực thể nào phù hợp.</p>
            </div>
          ) : (
            filteredEntries.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-border bg-surface hover:border-text-secondary transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-sans font-bold text-base text-text-primary">{item.name}</h4>
                      {item.aliases && (
                        <span className="text-[11px] text-text-muted italic block">
                          Biệt danh: {item.aliases}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-surface-elevated border border-border text-text-secondary">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {item.role && (
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 font-bold">
                        {item.role}
                      </span>
                    )}
                    {item.category === 'CHARACTER' && (() => {
                      let gen = '';
                      let ori = '';
                      if (item.detailsJson) {
                        try {
                          const p = JSON.parse(item.detailsJson);
                          gen = p.gender;
                          ori = p.orientation;
                        } catch {}
                      }
                      return (
                        <>
                          {gen && (
                            <span className="px-1.5 py-0.5 bg-surface-elevated text-text-secondary border border-border font-mono text-[10px]">
                              {gen === 'NAM' ? '♂ Nam' : gen === 'NU' || gen === 'NỮ' ? '♀ Nữ' : gen}
                            </span>
                          )}
                          {ori && (
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 font-bold text-[10px] flex items-center gap-1">
                              <Heart className="w-2.5 h-2.5 fill-primary/30" />
                              {ori}
                            </span>
                          )}
                        </>
                      );
                    })()}
                    {item.realm && (
                      <span className="px-1.5 py-0.5 bg-surface-elevated text-text-secondary border border-border font-mono">
                        {item.realm}
                      </span>
                    )}
                    {item.faction && (
                      <span className="px-1.5 py-0.5 bg-surface-elevated text-text-secondary border border-border">
                        {item.faction}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed font-sans line-clamp-3 pt-1">
                    {item.summary}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1 text-text-muted hover:text-text-primary"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                    className="p-1 text-text-muted hover:text-error"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>

    {/* Modal Thêm / Chỉnh Sửa Lore */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 !m-0">
          <div className="w-full max-w-lg bg-surface border border-border p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-sans font-bold text-lg text-text-primary">
                {editingEntry ? `Sửa Thực Thể: ${editingEntry.name}` : 'Thêm Thực Thể Lorebook Mới'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-secondary font-mono mb-1">LOẠI THỰC THỂ *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-2.5 border border-border bg-surface-elevated text-text-primary"
                >
                  <option value="CHARACTER">Nhân vật (Character)</option>
                  <option value="FACTION">Thế lực / Tông môn (Faction)</option>
                  <option value="REALM">Cảnh giới / Tu vi (Realm)</option>
                  <option value="ARTIFACT">Pháp bảo / Bí tịch (Artifact)</option>
                </select>
              </div>

              <div>
                <label className="block text-text-secondary font-mono mb-1">TÊN THỰC THỂ *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Diệp Phong, Thanh Vân Môn..."
                  className="w-full p-2.5 border border-border bg-surface-elevated text-text-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-mono mb-1">VAI TRÒ / DANH PHẬN</label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="Nhân vật chính / Tông chủ..."
                    className="w-full p-2 border border-border bg-surface-elevated text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-mono mb-1">TU VI / CẢNH GIỚI</label>
                  <input
                    type="text"
                    value={formRealm}
                    onChange={(e) => setFormRealm(e.target.value)}
                    placeholder="Trúc Cơ kỳ..."
                    className="w-full p-2 border border-border bg-surface-elevated text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-mono mb-1">THẾ LỰC / MÔN PHÁI</label>
                  <input
                    type="text"
                    value={formFaction}
                    onChange={(e) => setFormFaction(e.target.value)}
                    placeholder="Thanh Vân Môn..."
                    className="w-full p-2 border border-border bg-surface-elevated text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-mono mb-1">BIỆT DANH / TÊN KHÁC</label>
                  <input
                    type="text"
                    value={formAliases}
                    onChange={(e) => setFormAliases(e.target.value)}
                    placeholder="Phong Kiếm Tiên..."
                    className="w-full p-2 border border-border bg-surface-elevated text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-mono mb-1">MÔ TẢ TÓM TẮT *</label>
                <textarea
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Tiểu sử, lai lịch, đặc trưng ngoại hình..."
                  rows={3}
                  className="w-full p-2.5 border border-border bg-surface-elevated text-text-primary"
                  required
                />
              </div>

              {formCategory === 'CHARACTER' && (
                <div className="space-y-3 p-3 bg-surface-elevated/50 border border-border">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Heart className="w-3.5 h-3.5" />
                    <span>THIẾT LẬP GIỚI TÍNH & ĐỊNH HƯỚNG TÌNH CẢM (CHỐNG LỆCH THỂ LOẠI)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-text-secondary font-mono text-xs mb-1">
                        GIỚI TÍNH NHÂN VẬT *
                      </label>
                      <select
                        value={formGender}
                        onChange={(e) => setFormGender(e.target.value)}
                        className="w-full p-2 border border-border bg-surface text-text-primary text-xs"
                      >
                        <option value="NAM">Nam (♂)</option>
                        <option value="NỮ">Nữ (♀)</option>
                        <option value="PHI_NHỊ_GIỚI">Phi nhị giới (Non-binary)</option>
                        <option value="KHÁC">Khác (Linh thú, Hóa hình...)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-text-secondary font-mono text-xs mb-1">
                        VAI TRÒ CP / ĐỊNH HƯỚNG TÌNH CẢM
                      </label>
                      <input
                        type="text"
                        value={formOrientation}
                        onChange={(e) => setFormOrientation(e.target.value)}
                        placeholder="Công / Thụ / Hỗ công / Nam chính Đam mỹ..."
                        list="orientation-presets"
                        className="w-full p-2 border border-border bg-surface text-text-primary text-xs"
                      />
                      <datalist id="orientation-presets">
                        <option value="Công (Top)" />
                        <option value="Thụ (Bottom)" />
                        <option value="Hỗ công (Switch)" />
                        <option value="Nam chính Đam mỹ" />
                        <option value="Nữ chính Bách hợp" />
                        <option value="Dị tính (Ngôn tình)" />
                        <option value="Độc thân / Vô CP" />
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-text-secondary font-mono text-xs mb-1">
                      MỐI QUAN HỆ VỚI CÁC NHÂN VẬT KHÁC
                    </label>
                    <input
                      type="text"
                      value={formRelationships}
                      onChange={(e) => setFormRelationships(e.target.value)}
                      placeholder="Ví dụ: Người yêu của Sở Hành, Sư tôn của Diệp Phong..."
                      className="w-full p-2 border border-border bg-surface text-text-primary text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-border text-text-secondary hover:text-text-primary font-mono text-xs"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-5 py-2 bg-text-primary text-background hover:bg-primary hover:text-white font-mono text-xs font-bold transition disabled:opacity-50"
                >
                  {formSaving ? 'ĐANG LƯU...' : 'LƯU HỒ SƠ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN AI QUÉT & TRÍCH XUẤT LOREBOOK (THAY THẾ CONFIRM NATIVE) */}
      {confirmScanOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 !m-0 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-surface border border-border p-5 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="label-caps text-primary text-[10px]">ZORY AI LORE EXTRACTION ENGINE</span>
                  <h3 className="font-sans text-base sm:text-lg font-bold text-text-primary tracking-tight">
                    Tự Động Nhận Diện & Trích Xuất Lore
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setConfirmScanOpen(false)}
                className="p-1 text-text-secondary hover:text-text-primary transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content / Info Cards */}
            <div className="space-y-3.5 font-sans text-xs">
              <p className="text-text-secondary leading-relaxed">
                AI sẽ quét toàn bộ các chương và cốt truyện của dự án <strong>"{projectTitle}"</strong> để tự động nhận diện thực thể và thiết lập hồ sơ:
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 border border-border bg-surface-elevated flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary text-[11px]">Nhân vật</div>
                    <div className="text-[10px] text-text-tertiary">Tính cách, diện mạo, vai trò</div>
                  </div>
                </div>
                <div className="p-2.5 border border-border bg-surface-elevated flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary text-[11px]">Thế lực & Môn phái</div>
                    <div className="text-[10px] text-text-tertiary">Tổ chức, phe phái đối đầu</div>
                  </div>
                </div>
                <div className="p-2.5 border border-border bg-surface-elevated flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary text-[11px]">Cảnh giới</div>
                    <div className="text-[10px] text-text-tertiary">Hệ thống tu vi, cấp bậc</div>
                  </div>
                </div>
                <div className="p-2.5 border border-border bg-surface-elevated flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Box className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary text-[11px]">Pháp bảo & Vật phẩm</div>
                    <div className="text-[10px] text-text-tertiary">Vũ khí, kỳ trân dị bảo</div>
                  </div>
                </div>
              </div>

              <div className="p-3 border border-border bg-surface-elevated text-[11px] text-text-secondary leading-relaxed space-y-1">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  Lợi ích cốt lõi:
                </span>
                <p>
                  Toàn bộ hồ sơ trích xuất được nạp thẳng vào bộ nhớ Lorebook, giúp AI co-writing luôn nhất quán mạch truyện và không bao giờ bị quên tình tiết.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setConfirmScanOpen(false)}
                className="px-4 py-2 border border-border text-xs font-sans font-medium text-text-secondary hover:text-text-primary transition"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleConfirmExtractLore}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-sans font-bold tracking-wider uppercase transition shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>BẮT ĐẦU QUÉT AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA THỰC THỂ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 !m-0 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-surface border border-border p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <span className="label-caps text-rose-500 text-[10px]">XÓA KHỎI LOREBOOK</span>
                <h3 className="font-sans text-base font-bold text-text-primary">
                  Xác Nhận Xóa Thực Thể
                </h3>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed font-sans">
              Bạn có chắc chắn muốn xóa vĩnh viễn thực thể <strong>"{deleteTarget.name}"</strong> khỏi Lorebook không? Thao tác này sẽ gỡ bỏ thực thể khỏi sơ đồ mạng lưới.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-border text-xs font-sans font-medium text-text-secondary hover:text-text-primary transition"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-sans font-bold transition shadow-sm"
              >
                XÓA THỰC THỂ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
