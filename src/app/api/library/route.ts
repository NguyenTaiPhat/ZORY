import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const where: any = { userId: user.id };
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const items = await prisma.libraryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        book: {
          include: {
            genres: {
              include: { genre: true },
            },
            chapters: {
              select: { id: true, chapterNumber: true },
              orderBy: { chapterNumber: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const bookIds = items.map((i) => i.bookId);
    const progresses = await prisma.readingProgress.findMany({
      where: {
        userId: user.id,
        bookId: { in: bookIds },
      },
      include: {
        chapter: {
          select: { id: true, chapterNumber: true, title: true },
        },
      },
    });

    const progressMap = new Map();
    progresses.forEach((p) => {
      progressMap.set(p.bookId, p);
    });

    const formatted = items.map((item) => {
      const prog = progressMap.get(item.bookId);
      return {
        id: item.id,
        category: item.category,
        createdAt: item.createdAt,
        book: {
          id: item.book.id,
          title: item.book.title,
          slug: item.book.slug,
          coverUrl: item.book.coverUrl,
          authorName: item.book.authorName,
          status: item.book.status,
          ratingAvg: item.book.ratingAvg,
          latestChapterNumber: item.book.chapters[0]?.chapterNumber || 0,
          genres: item.book.genres.map((g) => g.genre.name),
        },
        progress: prog
          ? {
              chapterNumber: prog.chapter.chapterNumber,
              chapterTitle: prog.chapter.title,
              progressPercent: prog.progressPercent,
              updatedAt: prog.updatedAt,
            }
          : null,
      };
    });

    return NextResponse.json({ items: formatted });
  } catch (error: any) {
    console.error('Lỗi lấy tủ sách:', error);
    return NextResponse.json({ error: 'Lỗi tải tủ sách' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const { bookId, category = 'READING' } = body;

    if (!bookId) {
      return NextResponse.json({ error: 'Thiếu bookId' }, { status: 400 });
    }

    const item = await prisma.libraryItem.upsert({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId,
        },
      },
      update: {
        category,
      },
      create: {
        userId: user.id,
        bookId,
        category,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Lỗi cập nhật tủ sách:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật tủ sách' }, { status: 500 });
  }
}
