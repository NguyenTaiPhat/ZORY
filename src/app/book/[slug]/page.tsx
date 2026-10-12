import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { BookDetailClient } from '@/components/books/BookDetailClient';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await prisma.book.findUnique({
    where: { slug },
    select: { title: true, summary: true },
  });

  if (!book) {
    return { title: 'Không Tìm Thấy Truyện' };
  }

  return {
    title: book.title,
    description: book.summary.slice(0, 160),
  };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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
    notFound();
  }

  // Tự động kiểm tra và phục hồi các chương có nội dung từ Studio nếu chưa đồng bộ
  const studioChapters = await prisma.studioChapter.findMany({
    where: {
      project: {
        OR: [
          { publishedBookId: book.id },
          { publishedBookSlug: book.slug },
          { title: book.title },
        ],
      },
    },
    select: {
      chapterNumber: true,
      title: true,
      content: true,
      wordCount: true,
      status: true,
    },
  });

  if (studioChapters.length > 0) {
    let hasUpdates = false;
    for (const sc of studioChapters) {
      if (sc.content && sc.content.trim().length > 30 && sc.status !== 'HIDDEN') {
        const words = sc.wordCount || sc.content.trim().split(/\s+/).length;
        const existing = book.chapters.find((c) => c.chapterNumber === sc.chapterNumber);
        if (!existing || existing.wordCount === 0) {
          hasUpdates = true;
          await prisma.chapter.upsert({
            where: {
              bookId_chapterNumber: {
                bookId: book.id,
                chapterNumber: sc.chapterNumber,
              },
            },
            update: {
              title: sc.title,
              content: sc.content,
              wordCount: words,
              publishStatus: 'PUBLISHED',
            },
            create: {
              bookId: book.id,
              chapterNumber: sc.chapterNumber,
              title: sc.title,
              content: sc.content,
              wordCount: words,
              publishStatus: 'PUBLISHED',
            },
          });
        }
      }
    }

    if (hasUpdates) {
      book.chapters = await prisma.chapter.findMany({
        where: { bookId: book.id, publishStatus: 'PUBLISHED' },
        orderBy: { chapterNumber: 'asc' },
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          wordCount: true,
          viewCount: true,
          createdAt: true,
        },
      });
    }
  }

  // Tăng view count
  await prisma.book.update({
    where: { id: book.id },
    data: { viewCount: { increment: 1 } },
  });

  // User state
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
      where: { userId: user.id, bookId: book.id },
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

  // Similar books
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

  const formattedBook = {
    ...book,
    genres: book.genres.map((g) => ({
      id: g.genre.id,
      name: g.genre.name,
      slug: g.genre.slug,
    })),
  };

  return (
    <BookDetailClient
      book={formattedBook}
      userState={{ inLibrary, libraryCategory, lastProgress }}
      similarBooks={similarBooks}
      currentUser={user}
    />
  );
}
