'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ReportPage() {
  const [targetType, setTargetType] = useState('BOOK');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Trở về trang chủ</span>
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-text-primary flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <span>Báo Cáo Vi Phạm Nội Dung</span>
        </h1>
        <p className="text-xs text-text-secondary">
          ZORY cam kết bảo vệ quyền tác giả và môi trường văn học lành mạnh
        </p>
      </div>

      {submitted ? (
        <div className="p-8 rounded-2xl bg-surface border border-border text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-success mx-auto" />
          <h3 className="font-bold text-base text-text-primary">
            Cảm ơn bạn đã gửi báo cáo
          </h3>
          <p className="text-xs text-text-secondary">
            Ban kiểm duyệt ZORY sẽ xác minh và xử lý trong vòng 24 giờ làm việc.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-surface border border-border space-y-4 text-xs">
          <div>
            <label className="block font-bold text-text-secondary uppercase mb-1">
              Loại nội dung vi phạm
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border bg-surface-elevated text-text-primary"
            >
              <option value="BOOK">Tác phẩm truyện</option>
              <option value="CHAPTER">Chương truyện cụ thể</option>
              <option value="COMMENT">Bình luận độc giả</option>
              <option value="USER">Tài khoản người dùng</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-text-secondary uppercase mb-1">
              Tên hoặc liên kết nội dung vi phạm
            </label>
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Ví dụ: Link truyện hoặc tên truyện..."
              className="w-full p-2.5 rounded-xl border border-border bg-surface-elevated text-text-primary"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-text-secondary uppercase mb-1">
              Mô tả chi tiết lý do vi phạm
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Vi phạm bản quyền, nội dung phản cảm, thông tin xuyên tạc..."
              className="w-full p-2.5 rounded-xl border border-border bg-surface-elevated text-text-primary"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition"
          >
            Gửi báo cáo vi phạm
          </button>
        </form>
      )}
    </div>
  );
}
