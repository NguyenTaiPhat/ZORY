'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Khi đường dẫn hoặc query thay đổi, hoàn tất progress
  useEffect(() => {
    if (isLoading) {
      setProgress(100);
      const timeout = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [pathname, searchParams]);

  // Lắng nghe thao tác click vào các đường link nội bộ
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Tìm thẻ <a> gần nhất
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // Bỏ qua link mở tab mới, link ngoài, anchor hash, hoặc download
      if (
        !href ||
        targetAttr === '_blank' ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        target.hasAttribute('download')
      ) {
        return;
      }

      // Kiểm tra có phải cùng domain không
      const isInternal =
        href.startsWith('/') ||
        href.startsWith(window.location.origin);

      if (isInternal) {
        try {
          const targetUrl = new URL(href, window.location.origin);
          const currentUrl = new URL(window.location.href);

          // Nếu chỉ cuộn trong cùng trang thì bỏ qua
          if (
            targetUrl.pathname === currentUrl.pathname &&
            targetUrl.search === currentUrl.search
          ) {
            return;
          }

          // Bắt đầu thanh tiến trình tức thì (cảm giác phản hồi ngay lập tức)
          startLoading();
        } catch {
          // Bỏ qua nếu URL không hợp lệ
        }
      }
    };

    const handlePopState = () => {
      startLoading();
    };

    const startLoading = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsLoading(true);
      setProgress(25);

      // Tăng dần tiến trình tạo cảm giác mượt mà
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            if (timerRef.current) clearInterval(timerRef.current);
            return prev;
          }
          return prev + Math.floor(Math.random() * 12 + 6);
        });
      }, 150);
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isLoading && progress === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[100] h-[2.5px] pointer-events-none bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-[#A784E2] to-[#BFA1F7] nav-progress-glow transition-all duration-200 ease-out origin-left"
        style={{
          transform: `scaleX(${progress / 100})`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
