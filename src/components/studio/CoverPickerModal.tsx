'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  Link2,
  Check,
  X,
  RotateCw,
  ImageIcon,
  Camera,
} from 'lucide-react';

interface CoverPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoverUrl: string | null;
  bookTitle: string;
  genre: string;
  projectId?: string;
  bookSlug?: string;
  onSave: (newCoverUrl: string) => Promise<void> | void;
}

const PRESET_COVERS = [
  {
    name: 'Đô Thị Viễn Tưởng',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600',
  },
  {
    name: 'Trăng Nhân Tạo & Neon',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600',
  },
  {
    name: 'Vũ Trụ & Tương Lai',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
  },
  {
    name: 'Huyền Bí Đêm Trăng',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600',
  },
];

export function CoverPickerModal({
  isOpen,
  onClose,
  currentCoverUrl,
  bookTitle,
  genre,
  projectId,
  bookSlug,
  onSave,
}: CoverPickerModalProps) {
  const [selectedUrl, setSelectedUrl] = useState<string>(
    currentCoverUrl || PRESET_COVERS[0].url
  );
  const [activeTab, setActiveTab] = useState<'upload' | 'ai' | 'url' | 'presets'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(
    `${bookTitle}, ${genre}, futuristic cyberpunk metropolis at night with glowing artificial moons, cinematic book cover art`
  );
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Dung lượng ảnh tối đa là 10MB');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (projectId) formData.append('projectId', projectId);

      const res = await fetch('/api/upload/cover', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tải ảnh lên');

      setSelectedUrl(data.coverUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateAi = () => {
    setIsAiGenerating(true);
    setErrorMsg('');
    try {
      const seed = Math.floor(Math.random() * 1000000);
      const promptEncoded = encodeURIComponent(
        `${aiPrompt}, ultra-detailed illustration, masterpiece book cover, 8k`
      );
      const generatedUrl = `https://image.pollinations.ai/prompt/${promptEncoded}?width=600&height=900&nologo=true&seed=${seed}`;
      setSelectedUrl(generatedUrl);
    } catch (err: any) {
      setErrorMsg('Lỗi sinh ảnh AI');
    } finally {
      setTimeout(() => setIsAiGenerating(false), 800);
    }
  };

  const handleConfirmSave = async () => {
    if (!selectedUrl) {
      setErrorMsg('Vui lòng chọn hoặc tải lên một ảnh bìa');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      // 1. Cập nhật qua callback
      await onSave(selectedUrl);

      // 2. Nếu có bookSlug, cập nhật trực tiếp vào Book
      if (bookSlug) {
        await fetch(`/api/books/${bookSlug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coverUrl: selectedUrl }),
        });
      }

      // 3. Nếu có projectId, cập nhật vào AiProject
      if (projectId) {
        await fetch(`/api/studio/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coverUrl: selectedUrl }),
        });
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi lưu ảnh bìa');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed !m-0 inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-surface border border-border p-5 sm:p-6 max-w-2xl w-full space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 border border-primary/30 bg-primary/10 text-primary rounded">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-text-primary">
                Tùy Chỉnh Ảnh Bìa Tác Phẩm
              </h3>
              <p className="text-[11px] font-sans text-text-secondary truncate max-w-md">
                {bookTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-tertiary hover:text-text-primary rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Cột trái: Khung xem trước bìa sách chuẩn tỷ lệ 2:3 */}
          <div className="md:col-span-5 flex flex-col items-center">
            <span className="label-caps text-[10px] text-text-tertiary mb-2">
              XEM TRƯỚC BÌA SÁCH (2:3)
            </span>
            <div className="w-44 sm:w-48 aspect-[2/3] border border-border bg-surface-elevated relative overflow-hidden shadow-lg group">
              {selectedUrl ? (
                <img
                  src={selectedUrl}
                  alt="Ảnh bìa"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-text-tertiary p-4 text-center">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs font-sans">Chưa có ảnh bìa</span>
                </div>
              )}
              <div className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-black/80 text-white rounded-xs">
                ZORY
              </div>
            </div>
            <span className="text-[10px] text-text-tertiary mt-2 text-center font-sans">
              Hiển thị tự động trên trang đọc, khám phá & nghe đọc
            </span>
          </div>

          {/* Cột phải: Các phương thức thiết lập ảnh bìa */}
          <div className="md:col-span-7 space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-border text-xs font-sans font-semibold">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition ${
                  activeTab === 'upload'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>TẢI TỆP LÊN</span>
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition ${
                  activeTab === 'ai'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI SINH ẢNH</span>
              </button>
              <button
                onClick={() => setActiveTab('presets')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition ${
                  activeTab === 'presets'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>MẪU CÓ SẴN</span>
              </button>
              <button
                onClick={() => setActiveTab('url')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition ${
                  activeTab === 'url'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>LINK URL</span>
              </button>
            </div>

            {/* TAB 1: Tải lên từ máy */}
            {activeTab === 'upload' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/60 bg-surface-elevated/40 p-6 text-center cursor-pointer transition rounded-sm space-y-2 group"
                >
                  <Upload className="w-8 h-8 mx-auto text-text-tertiary group-hover:text-primary transition" />
                  <p className="text-xs font-sans text-text-primary font-semibold">
                    Bấm để chọn ảnh từ máy tính hoặc điện thoại
                  </p>
                  <p className="text-[11px] font-sans text-text-tertiary">
                    Hỗ trợ PNG, JPG, WEBP (tối đa 10MB)
                  </p>
                </div>
                {isUploading && (
                  <div className="flex items-center justify-center gap-2 text-xs text-primary font-sans">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tải ảnh lên máy chủ...</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: AI Sinh Ảnh Bìa */}
            {activeTab === 'ai' && (
              <div className="space-y-3">
                <p className="text-xs font-sans text-text-secondary leading-relaxed">
                  Trợ lý AI sẽ sáng tạo bức họa bìa sách nghệ thuật phù hợp với không khí câu chuyện:
                </p>
                <div className="space-y-1.5">
                  <label className="text-[10px] label-caps text-text-tertiary">
                    Ý TƯỞNG TRANH BÌA (PROMPT):
                  </label>
                  <textarea
                    rows={2}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full text-xs font-sans p-2.5 bg-surface-elevated border border-border text-text-primary focus:border-primary outline-none resize-none"
                    placeholder="Mô tả phong cảnh, tông màu, nhân vật..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAi}
                  disabled={isAiGenerating}
                  className="w-full py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold font-sans transition flex items-center justify-center gap-2"
                >
                  {isAiGenerating ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>ĐANG SINH BÌA NGHỆ THUẬT...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>SINH ẢNH BÌA AI MỚI</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 3: Mẫu có sẵn */}
            {activeTab === 'presets' && (
              <div className="grid grid-cols-2 gap-2">
                {PRESET_COVERS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setSelectedUrl(preset.url)}
                    className={`p-2 border text-left transition flex items-center gap-2.5 ${
                      selectedUrl === preset.url
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface hover:bg-surface-elevated text-text-secondary'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-8 h-12 object-cover rounded-xs shrink-0"
                    />
                    <span className="text-xs font-sans font-semibold truncate">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* TAB 4: Nhập link URL */}
            {activeTab === 'url' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] label-caps text-text-tertiary">
                    ĐƯỜNG DẪN ẢNH TRỰC TIẾP (URL):
                  </label>
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/anh-bia.jpg"
                    className="w-full text-xs font-sans p-2.5 bg-surface-elevated border border-border text-text-primary focus:border-primary outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (customUrlInput.trim()) {
                      setSelectedUrl(customUrlInput.trim());
                    }
                  }}
                  className="px-3 py-1.5 border border-border bg-surface hover:bg-surface-elevated text-xs font-sans font-bold text-text-primary transition"
                >
                  ÁP DỤNG LINK NÀY
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-sans">
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-4 py-2 border border-border text-xs font-bold font-sans text-text-secondary hover:text-text-primary transition"
          >
            HỦY
          </button>
          <button
            type="button"
            disabled={isSaving || isUploading}
            onClick={handleConfirmSave}
            className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold font-sans transition flex items-center gap-1.5 shadow-sm"
          >
            {isSaving ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>ĐANG CẬP NHẬT...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>LƯU ẢNH BÌA NÀY</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
