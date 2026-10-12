import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
            authorName: true,
            authorId: true,
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Không tìm thấy chương truyện' }, { status: 404 });
    }

    // Bảo mật: Nếu chương là DRAFT thì chỉ tác giả hoặc ADMIN được đọc
    if (chapter.publishStatus === 'DRAFT') {
      const isAuthor = user && user.id === chapter.book.authorId;
      const isAdmin = user && user.role === 'ADMIN';
      if (!isAuthor && !isAdmin) {
        return NextResponse.json(
          { error: 'Chương truyện này chưa được công bố' },
          { status: 403 }
        );
      }
    }

    // Tăng lượt đọc chương và lượt đọc truyện
    await Promise.all([
      prisma.chapter.update({
        where: { id: chapter.id },
        data: { viewCount: { increment: 1 } },
      }),
      prisma.book.update({
        where: { id: chapter.bookId },
        data: { readCount: { increment: 1 } },
      }),
    ]);

    // Tìm chương trước và chương tiếp theo
    const [prevChapter, nextChapter, allChapters] = await Promise.all([
      prisma.chapter.findFirst({
        where: {
          bookId: chapter.bookId,
          chapterNumber: { lt: chapter.chapterNumber },
          publishStatus: 'PUBLISHED',
        },
        orderBy: { chapterNumber: 'desc' },
        select: { id: true, chapterNumber: true, title: true },
      }),
      prisma.chapter.findFirst({
        where: {
          bookId: chapter.bookId,
          chapterNumber: { gt: chapter.chapterNumber },
          publishStatus: 'PUBLISHED',
        },
        orderBy: { chapterNumber: 'asc' },
        select: { id: true, chapterNumber: true, title: true },
      }),
      prisma.chapter.findMany({
        where: {
          bookId: chapter.bookId,
          publishStatus: 'PUBLISHED',
        },
        orderBy: { chapterNumber: 'asc' },
        select: { id: true, chapterNumber: true, title: true, wordCount: true },
      }),
    ]);

    return NextResponse.json({
      chapter: {
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        content: chapter.content,
        wordCount: chapter.wordCount,
        viewCount: chapter.viewCount + 1,
        createdAt: chapter.createdAt,
      },
      book: chapter.book,
      prevChapter,
      nextChapter,
      allChapters,
    });
  } catch (error: any) {
    console.error('Lỗi tải chương truyện:', error);
    return NextResponse.json({ error: 'Lỗi tải chương truyện' }, { status: 500 });
  }
}
