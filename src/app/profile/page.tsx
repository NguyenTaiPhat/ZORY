import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { User, Cpu, Volume2, BookOpen, Sparkles, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hồ Sơ Cá Nhân',
  description: 'Quản lý tài khoản, định mức token AI và tủ sách cá nhân trên ZORY.',
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?callbackUrl=/profile');
  }

  const [booksCount, projectsCount] = await Promise.all([
    prisma.book.count({ where: { authorId: user.id } }),
    prisma.aiProject.count({ where: { userId: user.id } }),
  ]);

  const isAdmin = user.role === 'ADMIN';
  const aiPercent = isAdmin
    ? 100
    : Math.min(100, Math.round((user.aiTokensUsed / user.aiTokensQuota) * 100));
  const ttsPercent = Math.min(100, Math.round((user.ttsCharsUsed / user.ttsCharsQuota) * 100));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Editorial Page Header */}
      <div className="pb-4 border-b border-border flex items-center justify-between">
        <div>
          <span className="label-caps">HỒ SƠ TÁC GIẢ & THÀNH VIÊN</span>
          <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mt-1">
            Thông Tin Tài Khoản
          </h1>
        </div>
        <span className="text-xs font-mono text-text-secondary">UID: {user.id.slice(0, 8)}</span>
      </div>

      {/* Author Passport Card */}
      <div className="p-8 border border-border bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 border border-border bg-surface-elevated text-text-primary flex items-center justify-center font-sans font-bold text-2xl">
            {user.username.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-text-primary">
                {user.name || user.username}
              </h2>
              <span className="label-caps border border-primary/30 px-2 py-0.5 text-primary">
                {user.role}
              </span>
            </div>
            <p className="text-xs font-mono text-text-secondary">
              @{user.username} • {user.email}
            </p>
          </div>
        </div>

        {user.role === 'ADMIN' && (
          <Link
            href="/admin"
            className="px-4 py-2 border border-border bg-surface-elevated text-text-primary hover:border-primary text-xs font-mono transition flex items-center gap-2"
          >
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>KHU VỰC QUẢN TRỊ</span>
          </Link>
        )}
      </div>

      {/* Resource Quota Ledger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* AI Studio Tokens */}
        <div className="p-6 border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">HẠN MỨC AI TOKENS</h3>
            </div>
            <span className="text-xs font-mono text-primary font-bold">
              {isAdmin ? 'VÔ HẠN (∞)' : `${aiPercent}%`}
            </span>
          </div>

          <div className="w-full bg-border h-1 overflow-hidden">
            <div
              className={isAdmin ? "bg-emerald-500 h-full w-full" : "bg-primary h-full transition-all duration-300"}
              style={{ width: `${aiPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono text-text-secondary">
            <span>ĐÃ DÙNG: {user.aiTokensUsed.toLocaleString()}</span>
            <span>TỔNG ĐỊNH MỨC: {isAdmin ? 'VÔ HẠN (∞)' : user.aiTokensQuota.toLocaleString()}</span>
          </div>
        </div>

        {/* TTS Chars */}
        <div className="p-6 border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-text-primary" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">HẠN MỨC ZORY VOICE</h3>
            </div>
            <span className="text-xs font-mono text-text-primary font-bold">{ttsPercent}%</span>
          </div>

          <div className="w-full bg-border h-1 overflow-hidden">
            <div className="bg-text-primary h-full transition-all duration-300" style={{ width: `${ttsPercent}%` }} />
          </div>

          <div className="flex justify-between text-[11px] font-mono text-text-secondary">
            <span>ĐÃ DÙNG: {user.ttsCharsUsed.toLocaleString()} KÝ TỰ</span>
            <span>TỔNG ĐỊNH MỨC: {user.ttsCharsQuota.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Directory Portals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link
          href="/studio"
          className="p-6 border border-border bg-surface hover:border-primary transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 border border-border bg-surface-elevated text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-text-primary group-hover:text-primary transition">
                ZORY AI Studio
              </h4>
              <p className="text-xs font-mono text-text-secondary">{projectsCount} dự án đang sáng tác</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition" />
        </Link>

        <Link
          href="/library"
          className="p-6 border border-border bg-surface hover:border-primary transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 border border-border bg-surface-elevated text-text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-text-primary group-hover:text-primary transition">
                Tủ Sách Cá Nhân
              </h4>
              <p className="text-xs font-mono text-text-secondary">Theo dõi tiến độ & danh sách đọc</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition" />
        </Link>
      </div>
    </div>
  );
}
