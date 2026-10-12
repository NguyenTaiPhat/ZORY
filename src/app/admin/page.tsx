import prisma from '@/lib/db';
import { aiAdapter } from '@/lib/ai/adapter';
import { ttsAdapter } from '@/lib/tts/adapter';
import {
  Users,
  BookOpen,
  FileText,
  Eye,
  Sparkles,
  Cpu,
  Activity,
  Headphones,
} from 'lucide-react';
import { formatDateVi } from '@/lib/utils';

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    totalBooks,
    totalChapters,
    totalAiProjects,
    totalAiUsages,
    totalTtsJobs,
    usersUsage,
    readsSum,
    recentLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.book.count(),
    prisma.chapter.count(),
    prisma.aiProject.count(),
    prisma.aiUsage.count(),
    prisma.ttsJob.count(),
    prisma.user.aggregate({
      _sum: { aiTokensUsed: true, ttsCharsUsed: true },
    }),
    prisma.book.aggregate({
      _sum: { readCount: true, viewCount: true },
    }),
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { username: true, name: true } },
      },
    }),
  ]);

  const aiStatus = aiAdapter.getStatus();
  const ttsStatus = ttsAdapter.getStatus();

  const statCards = [
    { label: 'THÀNH VIÊN', val: totalUsers, icon: Users },
    { label: 'ẤN PHẨM SÁCH', val: totalBooks, icon: BookOpen },
    { label: 'TỔNG CHƯƠNG', val: totalChapters, icon: FileText },
    { label: 'LƯỢT ĐỌC TOÀN HỆ', val: (readsSum._sum.readCount || 0).toLocaleString(), icon: Eye },
    { label: 'DỰ ÁN AI STUDIO', val: totalAiProjects, icon: Sparkles },
    { label: 'LƯỢT GỌI AI', val: totalAiUsages, icon: Cpu },
  ];

  return (
    <div className="space-y-8">
      {/* 6 Metric tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-4 border border-border bg-surface space-y-2"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-mono text-text-secondary opacity-60">#{i + 1}</span>
              </div>
              <div>
                <p className="text-xl font-mono font-bold text-text-primary">
                  {stat.val}
                </p>
                <p className="label-caps truncate mt-1">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Provider Status Terminal Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Provider Status */}
        <div className="p-6 border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="label-caps flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span>AI PROVIDER ADAPTER</span>
            </h3>
            <span
              className={`px-2 py-0.5 text-[10px] font-mono border ${
                aiStatus.isMock
                  ? 'border-amber-500/40 text-amber-600 bg-amber-500/10'
                  : 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
              }`}
            >
              {aiStatus.isMock ? 'MOCK LOCAL ENGINE' : 'ONLINE API READY'}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono text-text-secondary">
            <div className="flex justify-between py-1 border-b border-border">
              <span>NHÀ CUNG CẤP:</span>
              <strong className="text-text-primary uppercase">{aiStatus.provider}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span>MÔ HÌNH VẬN HÀNH:</span>
              <strong className="text-text-primary">{aiStatus.model}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span>ĐÃ TIÊU THỤ:</span>
              <strong className="text-text-primary">
                {(usersUsage._sum.aiTokensUsed || 0).toLocaleString()} TOKENS
              </strong>
            </div>
          </div>
        </div>

        {/* TTS Provider Status */}
        <div className="p-6 border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="label-caps flex items-center gap-2">
              <Headphones className="w-3.5 h-3.5 text-primary" />
              <span>TTS PROVIDER ADAPTER</span>
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-mono border border-emerald-500/40 text-emerald-600 bg-emerald-500/10">
              WEB SPEECH SYNTHESIS
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono text-text-secondary">
            <div className="flex justify-between py-1 border-b border-border">
              <span>ĐỘNG CƠ:</span>
              <strong className="text-text-primary uppercase">{ttsStatus.provider}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span>GIỌNG MẶC ĐỊNH:</span>
              <strong className="text-text-primary">{ttsStatus.defaultVoice}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span>ĐÃ TIÊU THỤ:</span>
              <strong className="text-text-primary">
                {(usersUsage._sum.ttsCharsUsed || 0).toLocaleString()} KÝ TỰ
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Feed */}
      <div className="p-6 border border-border bg-surface space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="label-caps flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span>NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT LOGS)</span>
          </h3>
          <span className="text-xs font-mono text-text-secondary">LƯU TRỮ TỰ ĐỘNG</span>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-xs font-mono text-text-secondary italic py-4">Chưa có thao tác nào được ghi nhận.</p>
        ) : (
          <div className="space-y-2 text-xs font-mono">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 border border-border bg-surface-elevated flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-text-primary">
                    [{log.admin.username}]
                  </span>
                  <span className="text-text-secondary"> {log.action}</span>
                </div>
                <span className="text-[11px] text-text-secondary opacity-70">
                  {formatDateVi(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
