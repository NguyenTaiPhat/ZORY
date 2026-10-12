import Link from 'next/link';
import type { Metadata } from 'next';
import { BookX, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Không Tìm Thấy Trang (404)',
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md bg-surface p-8 rounded-3xl border border-border shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-secondary text-primary mx-auto flex items-center justify-center">
          <BookX className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-text-primary">404</h1>
        <h2 className="text-lg font-bold text-text-primary">
          Trang Không Tồn Tại
        </h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          Tác phẩm hoặc trang bạn đang tìm kiếm có thể đã được gỡ bỏ, đổi đường dẫn
          hoặc tạm thời không khả dụng.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Trở về trang chủ ZORY</span>
        </Link>
      </div>
    </div>
  );
}
