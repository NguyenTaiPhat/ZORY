import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;
    const user = await getCurrentUser();

    // 1. Lấy tất cả reactions của chương
    const reactions = await prisma.paragraphReaction.findMany({
      where: { chapterId },
      select: {
        paragraphIndex: true,
        reaction: true,
        userId: true,
        guestId: true,
      },
    });

    // 2. Lấy số lượng comment của từng đoạn văn
    const comments = await prisma.comment.findMany({
      where: {
        chapterId,
        paragraphIndex: { not: null },
      },
      select: {
        paragraphIndex: true,
      },
    });

    // Tổng hợp reactions: { [paragraphIndex]: { FIRE: count, HEART: count... } }
    const reactionsMap: Record<number, Record<string, number>> = {};
    const userReactionsMap: Record<number, string> = {};

    for (const r of reactions) {
      if (!reactionsMap[r.paragraphIndex]) {
        reactionsMap[r.paragraphIndex] = {};
      }
      reactionsMap[r.paragraphIndex][r.reaction] =
        (reactionsMap[r.paragraphIndex][r.reaction] || 0) + 1;

      if (user && r.userId === user.id) {
        userReactionsMap[r.paragraphIndex] = r.reaction;
      }
    }

    // Tổng hợp comments: { [paragraphIndex]: count }
    const commentsCountMap: Record<number, number> = {};
    for (const c of comments) {
      if (c.paragraphIndex !== null) {
        commentsCountMap[c.paragraphIndex] =
          (commentsCountMap[c.paragraphIndex] || 0) + 1;
      }
    }

    return NextResponse.json({
      reactions: reactionsMap,
      userReactions: userReactionsMap,
      commentsCount: commentsCountMap,
    });
  } catch (error: any) {
    console.error('Lỗi lấy inline interactions:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
