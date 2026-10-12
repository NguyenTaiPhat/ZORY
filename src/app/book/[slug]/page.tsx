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
