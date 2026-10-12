import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ShieldAlert } from 'lucide-react';
import { AdminNav } from '@/components/admin/AdminNav';

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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 border border-border bg-surface-elevated text-primary shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="label-caps text-[10px] sm:text-xs text-text-secondary">ZORY PLATFORM CONSOLE</span>
            <h1 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-text-primary mt-0.5">
              Bảng Điều Khiển Quản Trị
            </h1>
            <p className="text-[10px] sm:text-xs font-sans text-text-secondary">
              QUẢN TRỊ NỘI DUNG, THÀNH VIÊN, ĐỊNH MỨC AI VÀ AUDIT LOGS
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Mobile 2x2 grid, Desktop flex row) */}
        <AdminNav />
      </div>

      <div>{children}</div>
    </div>
  );
}
