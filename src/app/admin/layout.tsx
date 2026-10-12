import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import {
  ShieldAlert,
  BarChart3,
  BookOpen,
  Users,
  KeyRound,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/login?callbackUrl=/admin');
  }

  const navItems = [
    { label: '[01] TỔNG QUAN', href: '/admin', icon: BarChart3 },
    { label: '[02] TÁC PHẨM', href: '/admin/books', icon: BookOpen },
    { label: '[03] THÀNH VIÊN', href: '/admin/users', icon: Users },
    { label: '[04] ALBUM API KEYS', href: '/admin/keys', icon: KeyRound },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-border bg-surface-elevated text-primary">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="label-caps">ZORY PLATFORM CONSOLE</span>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary mt-0.5">
              Bảng Điều Khiển Quản Trị
            </h1>
            <p className="text-xs font-mono text-text-secondary">
              QUẢN TRỊ NỘI DUNG, THÀNH VIÊN, ĐỊNH MỨC AI VÀ AUDIT LOGS
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border border-border p-1 bg-surface text-xs font-mono">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
