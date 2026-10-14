import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId');
    const guestId = searchParams.get('guestId');
    const user = await getCurrentUser();

    if (searchParams.get('recent') === '1') {
      if (!user) {
        return NextResponse.json(
          { progress: null },
          { headers: { 'Cache-Control': 'private, no-store' } }
        );
      }

      const progress = await prisma.readingProgress.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        include: {
          book: {
            select: { title: true, slug: true, coverUrl: true },
          },
          chapter: {
            select: { chapterNumber: true, title: true },
          },
        },
      });

      return NextResponse.json(
        { progress },
        { headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    if (!bookId) {
      return NextResponse.json({ error: 'Thiếu bookId' }, { status: 400 });
    }

    const where: any = { bookId };
    if (user) {
      where.userId = user.id;
    } else if (guestId) {
      where.guestId = guestId;
    } else {
      return NextResponse.json({ progress: null });
    }

    const progress = await prisma.readingProgress.findFirst({
      where,
      include: {
        chapter: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ progress });
  } catch (error: any) {
    console.error('Lỗi lấy tiến độ đọc:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { bookId, chapterId, progressPercent, scrollPosition, guestId } = body;
    const user = await getCurrentUser();

    if (!bookId || !chapterId) {
      return NextResponse.json({ error: 'Thiếu dữ liệu bắt buộc' }, { status: 400 });
    }

    let existingProgress = null;

    if (user) {
      existingProgress = await prisma.readingProgress.findFirst({
        where: { userId: user.id, bookId },
      });
    } else if (guestId) {
      existingProgress = await prisma.readingProgress.findFirst({
        where: { guestId, bookId },
      });
    }

    if (existingProgress) {
      const updated = await prisma.readingProgress.update({
        where: { id: existingProgress.id },
        data: {
          chapterId,
          progressPercent: Number(progressPercent) || 0,
          scrollPosition: Number(scrollPosition) || 0,
        },
      });
      return NextResponse.json({ success: true, progress: updated });
    }

    const created = await prisma.readingProgress.create({
      data: {
        userId: user ? user.id : null,
        guestId: !user ? guestId : null,
        bookId,
        chapterId,
        progressPercent: Number(progressPercent) || 0,
        scrollPosition: Number(scrollPosition) || 0,
      },
    });

    return NextResponse.json({ success: true, progress: created });
  } catch (error: any) {
    console.error('Lỗi lưu tiến độ đọc:', error);
    return NextResponse.json({ error: 'Lỗi lưu tiến độ' }, { status: 500 });
  }
}
