'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wand2 } from 'lucide-react';

export default function NewStudioProjectPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Khởi Tạo Bản Thảo Mới | ZORY';
    }
  }, []);

  const PRESET_GENRES = [
    'Đam mỹ (Nam Nam)',
    'Bách hợp (Nữ Nữ)',
    'Nam Nam',
    'Nữ Nữ',
    'Không ràng buộc',
    'Ngôn tình',
    'Đô thị',
    'Huyền huyễn',
    'Tiên hiệp',
    'Kiếm hiệp',
    'Khoa huyễn',
    'Trinh thám',
    'Kinh dị',
    'Trọng sinh',
    'Xuyên không',
    'Phiêu lưu',
    'Học đường',
    'Light Novel',
  ];

  const QUICK_GENRE_TAGS = [
    'Nam Nam',
    'Nữ Nữ',
    'Không ràng buộc',
    'Đam mỹ (Nam Nam)',
    'Bách hợp (Nữ Nữ)',
    'Ngôn tình',
    'Đô thị',
    'Khoa huyễn',
  ];

  const [title, setTitle] = useState('');
  const [premise, setPremise] = useState('');
  const [genre, setGenre] = useState('Đam mỹ (Nam Nam)');
  const [isCustomGenre, setIsCustomGenre] = useState(false);
  const [customGenre, setCustomGenre] = useState('');
  const [writingStyle, setWritingStyle] = useState('Văn học hiện đại, giàu cảm xúc, miêu tả chi tiết');
  const [targetAudience, setTargetAudience] = useState('Độc giả trẻ và trưởng thành');
  const [estimatedLength, setEstimatedLength] = useState('Tiểu thuyết vừa (30 - 50 chương)');

  const getEffectiveGenre = () => {
    if (isCustomGenre) {
      return customGenre.trim() || 'Không ràng buộc';
    }
    return genre;
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAiSuggest = async () => {
    if (!premise.trim()) {
      setError('Vui lòng nhập một vài ý tưởng ban đầu để AI gợi ý tiêu đề');
      return;
    }
    setError('');
    setIsGenerating(true);
    const effectiveGenre = getEffectiveGenre();
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'PROMPT',
          prompt: `Chỉ trả về DUY NHẤT một tựa đề tác phẩm hay nhất, độ dài dưới 8 từ, không thêm bất kỳ lời dẫn giải nào khác. Ý tưởng: "${premise.trim()}", Thể loại: "${effectiveGenre}".`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        // Tách dòng và làm sạch các ký tự đánh số, ngoặc kép, lời dẫn
        const lines = data.content
          .split('\n')
          .map((l: string) => l.replace(/^[0-9\.\-\*\#\:\s"']+|["']+$/g, '').trim())
          .filter((l: string) => l.length > 0 && !l.toLowerCase().startsWith('dưới đây') && !l.toLowerCase().startsWith('tùy thuộc') && !l.toLowerCase().startsWith('gợi ý'));

        const suggestedTitle = lines[0] || data.content.trim().replace(/^["']|["']$/g, '').slice(0, 50);
        if (suggestedTitle) {
          setTitle(suggestedTitle.slice(0, 50));
        }
      } else if (!res.ok) {
        setError(data.error || 'AI đang bận, vui lòng thử lại');
      }
    } catch (err) {
      setError('Không thể kết nối tới dịch vụ AI');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !premise.trim()) {
      setError('Vui lòng nhập tên tác phẩm và ý tưởng ban đầu');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const effectiveGenre = getEffectiveGenre();

    try {
      const res = await fetch('/api/studio/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          premise,
          genre: effectiveGenre,
          writingStyle,
          targetAudience,
          estimatedLength,
          worldBible: JSON.stringify({
            worldSetting: `Bối cảnh thế giới cho tác phẩm ${title}`,
            factions: 'Các thế lực chính trong cốt truyện',
            powerRules: 'Quy tắc năng lực hoặc cơ chế hoạt động',
          }),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi tạo dự án');
      }

      router.push(`/studio/${data.project.id}`);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 space-y-6">
      <div>
        <Link
          href="/studio"
          className="inline-flex items-center gap-2 text-xs font-mono text-text-secondary hover:text-text-primary mb-3.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>QUAY LẠI TỔNG QUAN STUDIO</span>
        </Link>

        <div>
          <span className="label-caps text-primary text-[10px]">HỒ SƠ BẢN THẢO MỚI</span>
          <h1 className="font-sans text-xl sm:text-3xl font-extrabold tracking-tight text-text-primary mt-1">
            Khởi Tạo Dự Án Sáng Tác
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Thiết lập cấu trúc ban đầu, tiền đề thế giới và thông số định hướng cho đồng tác giả AI.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border border-border bg-surface p-4 sm:p-10 space-y-5 sm:space-y-6"
      >
        {error && (
          <div className="p-3 border border-error/40 bg-error/10 text-error text-xs font-mono">
            {error}
          </div>
        )}

        {/* Ý tưởng ban đầu */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="label-caps">
              TIỀN ĐỀ / Ý TƯỞNG CỐT TRUYỆN *
            </label>
            <button
              type="button"
              onClick={handleAiSuggest}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline disabled:opacity-40"
            >
              <Wand2 className="w-3 h-3" />
              <span>{isGenerating ? 'ĐANG PHÂN TÍCH...' : 'AI GỢI Ý TIÊU ĐỀ'}</span>
            </button>
          </div>
          <textarea
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            rows={4}
            placeholder="Mô tả xung đột trọng tâm, nhân vật trung tâm hoặc bí ẩn cốt lõi của tác phẩm..."
            className="w-full p-4 font-sans text-sm border border-border bg-surface-elevated text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
            required
          />
        </div>

        {/* Tên tác phẩm */}
        <div className="space-y-1.5">
          <label className="label-caps">
            TIÊU ĐỀ TÁC PHẨM *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Thiên Đạo Luân Hồi Ký..."
            className="w-full p-3 font-sans text-base border border-border bg-surface-elevated text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
            required
          />
        </div>

        {/* Hai cột: Thể loại & Độ dài */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="label-caps">
                THỂ LOẠI
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomGenre(!isCustomGenre);
                  if (!isCustomGenre && !customGenre) {
                    setCustomGenre(genre);
                  }
                }}
                className="text-[11px] font-mono text-primary hover:underline"
              >
                {isCustomGenre ? '← Chọn danh sách có sẵn' : '+ Tự nhập (Không ràng buộc)'}
              </button>
            </div>

            {isCustomGenre ? (
              <input
                type="text"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="Nhập thể loại tự do (VD: Nam Nam, Nữ Nữ, Không ràng buộc...)"
                className="w-full p-3 text-xs font-mono border border-primary bg-surface-elevated text-text-primary focus:outline-none"
                autoFocus
              />
            ) : (
              <select
                value={genre}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomGenre(true);
                    if (!customGenre) setCustomGenre('Không ràng buộc');
                  } else {
                    setGenre(e.target.value);
                  }
                }}
                className="w-full p-3 text-xs font-mono border border-border bg-surface-elevated text-text-primary focus:outline-none focus:border-primary"
              >
                {PRESET_GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="__custom__">
                  ✦ Tự do / Thể loại khác (Không ràng buộc)...
                </option>
              </select>
            )}

            {/* Quick chips chọn nhanh */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_GENRE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setIsCustomGenre(false);
                    setGenre(tag);
                  }}
                  className={`px-2 py-0.5 text-[11px] font-mono border transition ${
                    !isCustomGenre && genre === tag
                      ? 'bg-primary text-white border-primary font-bold'
                      : 'border-border bg-surface-elevated hover:border-primary/60 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="label-caps">
              QUY MÔ DỰ KIẾN
            </label>
            <select
              value={estimatedLength}
              onChange={(e) => setEstimatedLength(e.target.value)}
              className="w-full p-3 text-xs font-mono border border-border bg-surface-elevated text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="Truyện ngắn (dưới 10 chương)">Truyện ngắn (dưới 10 chương)</option>
              <option value="Tiểu thuyết vừa (30 - 50 chương)">Tiểu thuyết vừa (30 - 50 chương)</option>
              <option value="Đại trường thiên (trên 100 chương)">Đại trường thiên (trên 100 chương)</option>
            </select>
          </div>
        </div>

        {/* Phong cách hành văn */}
        <div className="space-y-1.5">
          <label className="label-caps">
            PHONG CÁCH VĂN HỌC ĐỊNH HƯỚNG
          </label>
          <input
            type="text"
            value={writingStyle}
            onChange={(e) => setWritingStyle(e.target.value)}
            placeholder="Ví dụ: Giàu chất thơ, triết lý, nhịp độ dồn dập..."
            className="w-full p-3 text-xs font-mono border border-border bg-surface-elevated text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-border">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-text-primary text-background hover:bg-primary hover:text-white text-xs font-mono border border-border transition disabled:opacity-40"
          >
            {isSubmitting ? 'AI ĐANG KIẾN TẠO CỐT TRUYỆN & CHƯƠNG 1 (XIN CHỜ GIÂY LÁT)...' : 'HOÀN TẤT THIẾT LẬP VÀ VÀO XƯỞNG SÁNG TÁC'}
          </button>
        </div>
      </form>
    </div>
  );
}
