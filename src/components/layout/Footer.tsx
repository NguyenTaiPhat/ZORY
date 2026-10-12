'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '../brand/Logo';

export function Footer() {
  const pathname = usePathname();

  // Hide global footer on reader pages to maintain distraction-free reading canvas
  if (pathname?.startsWith('/read/')) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-border bg-surface text-text-secondary text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-3">
            <Logo variant="horizontal" size="md" />
            <p className="text-xs leading-relaxed text-text-muted max-w-sm">
              Stories Beyond Imagination. Nền tảng văn học đương đại kết hợp công nghệ AI Studio
              và giọng đọc âm thanh ZORY Voice.
            </p>
          </div>

          {/* Directory */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="label-caps text-text-primary">
              Mục Lục Nền Tảng
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/explore" className="text-text-secondary hover:text-text-primary transition">
                  Kho tác phẩm văn học
                </Link>
              </li>
              <li>
                <Link href="/genres" className="text-text-secondary hover:text-text-primary transition">
                  Phân loại thể loại
                </Link>
              </li>
              <li>
                <Link href="/studio" className="text-text-secondary hover:text-text-primary transition">
                  ZORY AI Studio sáng tác
                </Link>
              </li>
              <li>
                <Link href="/listen" className="text-text-secondary hover:text-text-primary transition">
                  ZORY Voice (Sách nói)
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Policy */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="label-caps text-text-primary">
              Chính Sách & Tiêu Chuẩn
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/ai-policy" className="text-text-secondary hover:text-text-primary transition">
                  Chính sách bản quyền tác phẩm do AI đồng tác
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-text-secondary hover:text-text-primary transition">
                  Điều khoản dịch vụ và sử dụng nền tảng
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-text-secondary hover:text-text-primary transition">
                  Chính sách bảo mật dữ liệu độc giả
                </Link>
              </li>
              <li>
                <Link href="/report" className="text-text-secondary hover:text-text-primary transition">
                  Báo cáo vi phạm nội dung / Bản quyền
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Hairline Sub-Footer */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-text-muted">
          <div>
            © {new Date().getFullYear()} ZORY Literary Platform. Bảo lưu mọi quyền phát hành.
          </div>
          <div className="flex items-center gap-6">
            <span>Phiên bản v2.4.0 (Monolith)</span>
            <span>Hệ thống máy chủ trực tuyến</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
