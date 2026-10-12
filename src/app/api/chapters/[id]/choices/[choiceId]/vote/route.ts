import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; choiceId: string }> }
) {
  try {
    const { id: chapterId, choiceId } = await params;

    const choice = await prisma.chapterChoice.findFirst({
      where: { id: choiceId, chapterId },
    });

    if (!choice) {
      return NextResponse.json({ error: 'Không tìm thấy ngã rẽ' }, { status: 404 });
    }

    const updated = await prisma.chapterChoice.update({
      where: { id: choiceId },
      data: { voteCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      choiceId,
      voteCount: updated.voteCount,
    });
  } catch (error: any) {
    console.error('Lỗi bình chọn ngã rẽ:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
