import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdminUser } from '@/lib/auth';
import { aiAdapter } from '@/lib/ai/adapter';
import { ttsAdapter } from '@/lib/tts/adapter';

export async function GET() {
  try {
    await requireAdminUser();

    const [
      totalUsers,
      totalBooks,
      totalChapters,
      publishedBooks,
      totalAiProjects,
      totalAiUsages,
      totalTtsJobs,
      usersWithUsage,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.book.count(),
      prisma.chapter.count(),
      prisma.book.count({ where: { publishStatus: 'PUBLISHED' } }),
      prisma.aiProject.count(),
      prisma.aiUsage.count(),
      prisma.ttsJob.count(),
      prisma.user.aggregate({
        _sum: {
          aiTokensUsed: true,
          ttsCharsUsed: true,
        },
      }),
    ]);

    const totalReads = await prisma.book.aggregate({
      _sum: {
        readCount: true,
        viewCount: true,
      },
    });

    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { username: true, name: true },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalBooks,
        totalChapters,
        publishedBooks,
        totalReads: totalReads._sum.readCount || 0,
        totalViews: totalReads._sum.viewCount || 0,
        totalAiProjects,
        totalAiUsages,
        totalAiTokensUsed: usersWithUsage._sum.aiTokensUsed || 0,
        totalTtsJobs,
        totalTtsCharsUsed: usersWithUsage._sum.ttsCharsUsed || 0,
      },
      providers: {
        ai: aiAdapter.getStatus(),
        tts: ttsAdapter.getStatus(),
      },
      recentAuditLogs,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Từ chối quyền truy cập quản trị' }, { status: 403 });
    }
    console.error('Lỗi lấy thống kê admin:', error);
    return NextResponse.json({ error: 'Lỗi tải số liệu' }, { status: 500 });
  }
}
