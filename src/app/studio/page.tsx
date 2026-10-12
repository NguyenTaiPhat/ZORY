import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getUserAiQuota } from '@/lib/ai/quota';
import { StudioProjectsList } from '@/components/studio/StudioProjectsList';

export const metadata: Metadata = {
  title: 'Xưởng Sáng Tác AI',
  description: 'Không gian sáng tác văn học và biên soạn bản thảo cùng ZORY AI Workbench.',
};

export default async function StudioOverviewPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?callbackUrl=/studio');
  }

  const [projects, quota] = await Promise.all([
    prisma.aiProject.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            characters: true,
            studioChapters: true,
          },
        },
      },
    }),
    getUserAiQuota(user.id),
  ]);

  const userQuota = {
    remaining: quota ? quota.remaining : Math.max(0, user.aiTokensQuota - user.aiTokensUsed),
    quota: quota ? quota.quota : user.aiTokensQuota,
    used: quota ? quota.used : user.aiTokensUsed,
    countdown: quota ? quota.countdown : '5 giờ',
    isUnlimited: quota?.isUnlimited || user.role === 'ADMIN',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <StudioProjectsList
        initialProjects={projects}
        userQuota={userQuota}
      />
    </div>
  );
}
