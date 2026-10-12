'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, Users, KeyRound } from 'lucide-react';

const NAV_ITEMS = [
  { label: '[01] TỔNG QUAN', href: '/admin', icon: BarChart3, exact: true },
  { label: '[02] TÁC PHẨM', href: '/admin/books', icon: BookOpen },
  { label: '[03] THÀNH VIÊN', href: '/admin/users', icon: Users },
  { label: '[04] API KEYS', href: '/admin/keys', icon: KeyRound },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full sm:w-auto">
      {/* Mobile: 2x2 grid rộng rãi, Desktop: thanh tab ngang gọn gàng */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 border border-border bg-surface text-xs font-sans font-medium">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 sm:py-1.5 transition text-center whitespace-nowrap border ${
                isActive
                  ? 'bg-surface-elevated text-primary border-border font-bold shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60 border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
