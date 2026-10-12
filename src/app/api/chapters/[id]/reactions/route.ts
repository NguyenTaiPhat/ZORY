import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const VALID_REACTIONS = ['FIRE', 'HEART', 'LAUGH', 'SHOCK', 'SAD'];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;
    const user = await getCurrentUser();
    const body = await req.json();

    const { paragraphIndex, reaction, guestId } = body;

    if (
      typeof paragraphIndex !== 'number' ||
      !reaction ||
      !VALID_REACTIONS.includes(reaction)
    ) {
      return NextResponse.json({ error: 'Dữ liệu cảm xúc không hợp lệ' }, { status: 400 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Không tìm thấy chương' }, { status: 404 });
    }

    // Xác định định danh người dùng
    const userId = user ? user.id : null;
    const clientGuestId = !userId ? guestId || 'anonymous' : null;

    // Kiểm tra reaction đã tồn tại
    const existing = await prisma.paragraphReaction.findFirst({
      where: {
        chapterId,
        paragraphIndex,
        ...(userId ? { userId } : { guestId: clientGuestId }),
      },
    });

    let currentReaction: string | null = reaction;

    if (existing) {
      if (existing.reaction === reaction) {
        // Bấm lại cùng reaction -> Hủy bỏ (Toggle off)
        await prisma.paragraphReaction.delete({ where: { id: existing.id } });
        currentReaction = null;
      } else {
        // Đổi sang reaction khác
        await prisma.paragraphReaction.update({
          where: { id: existing.id },
          data: { reaction },
        });
      }
    } else {
      // Tạo reaction mới
      await prisma.paragraphReaction.create({
        data: {
          chapterId,
          paragraphIndex,
          userId,
          guestId: clientGuestId,
          reaction,
        },
      });
    }

    // Đếm lại tổng hợp các reactions cho đoạn văn này
    const allReactions = await prisma.paragraphReaction.findMany({
      where: { chapterId, paragraphIndex },
      select: { reaction: true },
    });

    const summary: Record<string, number> = {};
    for (const r of allReactions) {
      summary[r.reaction] = (summary[r.reaction] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      paragraphIndex,
      currentReaction,
      reactions: summary,
    });
  } catch (error: any) {
    console.error('Lỗi lưu reaction nội dòng:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
