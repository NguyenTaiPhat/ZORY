'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminBooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = () => {
    setLoading(true);
    fetch('/api/admin/books')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.books) setBooks(data.books);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleUpdateStatus = async (bookId: string, publishStatus: string) => {
    try {
      const res = await fetch('/api/admin/books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, publishStatus }),
      });
      if (res.ok) {
        setBooks((prev) =>
          prev.map((b) => (b.id === bookId ? { ...b, publishStatus } : b))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFeatured = async (bookId: string, current: boolean) => {
    try {
      const res = await fetch('/api/admin/books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, isFeatured: !current }),
      });
      if (res.ok) {
        setBooks((prev) =>
          prev.map((b) => (b.id === bookId ? { ...b, isFeatured: !current } : b))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="border border-border bg-surface p-4 sm:p-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="label-caps text-[10px] sm:text-xs">MỤC LỤC TÁC PHẨM TOÀN HỆ THỐNG</span>
          <h2 className="font-serif text-lg sm:text-xl font-bold text-text-primary mt-0.5">
            Quản Lý Tác Phẩm ({books.length})
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs font-mono text-text-secondary">ĐANG TẢI DỮ LIỆU...</div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[680px] text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-text-secondary uppercase">
                <th className="py-3 px-3">ẤN PHẨM</th>
                <th className="py-3 px-3">TÁC GIẢ</th>
                <th className="py-3 px-3">CHƯƠNG</th>
                <th className="py-3 px-3">LƯỢT ĐỌC</th>
                <th className="py-3 px-3">XUẤT BẢN</th>
                <th className="py-3 px-3">GHIM TIÊU ĐIỂM</th>
                <th className="py-3 px-3 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {books.map((b) => (
                <tr key={b.id} className="hover:bg-surface-elevated transition">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 book-cover-frame book-spine-effect flex-shrink-0">
                        <div className="aspect-[2/3] w-full overflow-hidden bg-surface">
                          <img
                            src={b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}
                            alt={b.title}
                            className="w-full h-full object-cover grayscale"
                          />
                        </div>
                      </div>
                      <div>
                        <Link
                          href={`/book/${b.slug}`}
                          className="font-serif font-bold text-sm text-text-primary hover:text-primary transition"
                        >
                          {b.title}
                        </Link>
                        <p className="text-[11px] text-text-secondary">ĐÁNH GIÁ: ★ {b.ratingAvg.toFixed(1)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-text-secondary">{b.author?.name || b.author?.username}</td>
                  <td className="py-3 px-3 font-bold text-text-primary">{b._count?.chapters || 0}</td>
                  <td className="py-3 px-3 text-text-secondary">{b.readCount.toLocaleString()}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] border ${
                        b.publishStatus === 'PUBLISHED'
                          ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                          : b.publishStatus === 'DRAFT'
                          ? 'border-amber-500/40 text-amber-600 bg-amber-500/10'
                          : 'border-red-500/40 text-red-600 bg-red-500/10'
                      }`}
                    >
                      {b.publishStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => handleToggleFeatured(b.id, b.isFeatured)}
                      className={`px-2 py-0.5 text-[10px] border transition ${
                        b.isFeatured
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {b.isFeatured ? 'ĐANG TIÊU ĐIỂM' : 'ĐẶT TIÊU ĐIỂM'}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1.5">
                    {b.publishStatus !== 'PUBLISHED' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'PUBLISHED')}
                        className="px-2.5 py-1 bg-text-primary text-background hover:bg-primary hover:text-white text-[11px] border border-border transition"
                      >
                        DUYỆT
                      </button>
                    )}
                    {b.publishStatus !== 'REMOVED' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'REMOVED')}
                        className="px-2.5 py-1 border border-border hover:border-error hover:text-error text-text-secondary text-[11px] transition"
                      >
                        GỠ BỎ
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
