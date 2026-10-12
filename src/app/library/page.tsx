'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, BookOpen, Trash2, ArrowRight } from 'lucide-react';

export default function LibraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ALL' | 'READING' | 'FAVORITE' | 'FINISHED'>('ALL');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Tủ Sách Cá Nhân | ZORY';
    }
  }, []);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLibrary = () => {
    setLoading(true);
    fetch(`/api/library?category=${activeTab}`)
      .then((res) => {
        if (res.status === 401) {
          router.push('/login?callbackUrl=/library');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.items) {
          setItems(data.items);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLibrary();
  }, [activeTab]);

  const handleRemove = async (bookId: string) => {
    try {
      await fetch(`/api/library/${bookId}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.book.id !== bookId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="label-caps">LƯU TRỮ CÁ NHÂN</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mt-1">
            Tủ Sách Của Tôi
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Quản lý các ấn bản đang theo dõi, bản thảo yêu thích và dấu trang đọc dở.
          </p>
        </div>
        <span className="text-xs font-mono text-text-secondary">{items.length} ẤN BẢN TRONG DANH MỤC</span>
      </div>

      {/* Tabs Filter */}
      <div className="flex gap-2 border-b border-border pb-3">
        {[
          { key: 'ALL', label: 'TẤT CẢ' },
          { key: 'READING', label: 'ĐANG ĐỌC' },
          { key: 'FAVORITE', label: 'YÊU THÍCH' },
          { key: 'FINISHED', label: 'ĐÃ HOÀN THÀNH' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 text-xs font-mono border transition ${
              activeTab === tab.key
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-text-secondary hover:text-text-primary border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Catalog items */}
      {loading ? (
        <div className="py-24 text-center text-xs font-mono text-text-secondary">
          ĐANG TẢI MỤC LỤC TỦ SÁCH...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border border-border bg-surface space-y-4">
          <BookOpen className="w-10 h-10 mx-auto text-text-secondary opacity-40" />
          <h3 className="font-serif text-lg font-bold text-text-primary">
            Tủ sách hiện đang để trống
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Khám phá các ấn phẩm văn học đặc sắc trên ZORY và lưu trữ vào hồ sơ cá nhân.
          </p>
          <Link
            href="/explore"
            className="inline-block mt-2 px-4 py-2 bg-text-primary text-background hover:bg-primary hover:text-white text-xs font-mono border border-border transition"
          >
            KHÁM PHÁ THƯ VIỆN →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const b = item.book;
            const prog = item.progress;

            return (
              <div
                key={item.id}
                className="p-5 border border-border bg-surface hover:border-primary transition group flex gap-4"
              >
                {/* Book Sleeve Cover */}
                <div className="w-20 book-cover-frame book-spine-effect flex-shrink-0">
                  <div className="aspect-[2/3] w-full overflow-hidden bg-surface">
                    <img
                      src={b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300'}
                      alt={b.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-300"
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="space-y-1">
                    <Link
                      href={`/book/${b.slug}`}
                      className="font-serif font-bold text-base text-text-primary group-hover:text-primary transition line-clamp-2"
                    >
                      {b.title}
                    </Link>
                    <p className="text-xs text-text-secondary truncate">
                      {b.authorName || 'Vô danh'}
                    </p>

                    {prog ? (
                      <div className="pt-2 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono text-text-secondary">
                          <span>CHƯƠNG {prog.chapterNumber}</span>
                          <span className="text-primary font-bold">
                            {Math.round(prog.progressPercent)}%
                          </span>
                        </div>
                        <div className="w-full bg-border h-1 overflow-hidden">
                          <div
                            className="bg-primary h-full"
                            style={{ width: `${prog.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-text-secondary italic block pt-2">
                        [CHƯA MỞ ĐỌC]
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                    <Link
                      href={
                        prog
                          ? `/read/${b.slug}/${prog.chapterNumber}`
                          : `/read/${b.slug}/1`
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-text-primary hover:text-primary transition"
                    >
                      <span>{prog ? 'ĐỌC TIẾP' : 'BẮT ĐẦU'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleRemove(b.id)}
                      className="p-1 text-text-secondary hover:text-error transition"
                      title="Gỡ khỏi tủ sách"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
