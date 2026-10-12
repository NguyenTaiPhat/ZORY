import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await getCurrentUser();

    const book = await prisma.book.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            bio: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
        chapters: {
          where: { publishStatus: 'PUBLISHED' },
          orderBy: { chapterNumber: 'asc' },
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            wordCount: true,
            viewCount: true,
            createdAt: true,
          },
        },
        ratings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Không tìm thấy truyện' }, { status: 404 });
    }

    // Tăng lượt xem hợp lệ
    await prisma.book.update({
      where: { id: book.id },
      data: { viewCount: { increment: 1 } },
    });

    // Kiểm tra trạng thái trong tủ sách của user
    let inLibrary = false;
    let libraryCategory = null;
    let lastProgress = null;

    if (user) {
      const libItem = await prisma.libraryItem.findUnique({
        where: {
          userId_bookId: {
            userId: user.id,
            bookId: book.id,
          },
        },
      });
      if (libItem) {
        inLibrary = true;
        libraryCategory = libItem.category;
      }

      const prog = await prisma.readingProgress.findFirst({
        where: {
          userId: user.id,
          bookId: book.id,
        },
        include: {
          chapter: {
            select: { chapterNumber: true, title: true },
          },
        },
      });
      if (prog) {
        lastProgress = {
          chapterId: prog.chapterId,
          chapterNumber: prog.chapter.chapterNumber,
          chapterTitle: prog.chapter.title,
          progressPercent: prog.progressPercent,
        };
      }
    }

    // Truyện tương tự
    const genreIds = book.genres.map((g) => g.genreId);
    const similarBooks = await prisma.book.findMany({
      where: {
        id: { not: book.id },
        publishStatus: 'PUBLISHED',
        genres: {
          some: {
            genreId: { in: genreIds },
          },
        },
      },
      take: 4,
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        authorName: true,
        ratingAvg: true,
        status: true,
      },
    });

    return NextResponse.json({
      book: {
        id: book.id,
        title: book.title,
        slug: book.slug,
        summary: book.summary,
        coverUrl: book.coverUrl,
        status: book.status,
        author: book.author,
        viewCount: book.viewCount + 1,
        readCount: book.readCount,
        ratingAvg: book.ratingAvg,
        ratingCount: book.ratingCount,
        genres: book.genres.map((g) => ({ id: g.genre.id, name: g.genre.name, slug: g.genre.slug })),
        chapters: book.chapters,
        ratings: book.ratings,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      },
      userState: {
        inLibrary,
        libraryCategory,
        lastProgress,
      },
      similarBooks,
    });
  } catch (error: any) {
    console.error('Lỗi lấy chi tiết truyện:', error);
    return NextResponse.json({ error: 'Lỗi tải thông tin truyện' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { slug } = await params;
    const book = await prisma.book.findUnique({
      where: { slug },
    });

    if (!book) {
      return NextResponse.json({ error: 'Không tìm thấy truyện' }, { status: 404 });
    }

    if (book.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Bạn không có quyền chỉnh sửa tác phẩm này' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const updated = await prisma.book.update({
      where: { id: book.id },
      data: {
        coverUrl: body.coverUrl !== undefined ? body.coverUrl : undefined,
        summary: body.summary !== undefined ? body.summary : undefined,
        status: body.status !== undefined ? body.status : undefined,
      },
    });

    // Cập nhật ngược vào AiProject nếu có
    await prisma.aiProject.updateMany({
      where: { publishedBookId: book.id },
      data: {
        coverUrl: updated.coverUrl,
      },
    });

    return NextResponse.json({ success: true, book: updated });
  } catch (error: any) {
    console.error('Lỗi cập nhật sách:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật thông tin sách' }, { status: 500 });
  }
}

