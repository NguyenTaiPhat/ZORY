import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ZoryReader } from '@/components/reader/ZoryReader';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookSlug: string; chapterNumber: string }>;
}): Promise<Metadata> {
  const { bookSlug, chapterNumber } = await params;
  const num = parseInt(chapterNumber);

  const book = await prisma.book.findUnique({
    where: { slug: bookSlug },
    select: { title: true },
  });

  const chapter = await prisma.chapter.findFirst({
    where: {
      book: { slug: bookSlug },
      chapterNumber: num,
    },
    select: { title: true },
  });

  if (!book || !chapter) {
    return { title: 'Đọc truyện' };
  }

  const chapterName = chapter.title.startsWith('Chương')
    ? chapter.title
    : `Chương ${num}: ${chapter.title}`;

  return {
    title: `${chapterName} — ${book.title}`,
    description: `Đọc online ${chapterName} truyện ${book.title} trên nền tảng ZORY.`,
  };
}

export default async function ReadChapterPage({
  params,
}: {
  params: Promise<{ bookSlug: string; chapterNumber: string }>;
}) {
  const { bookSlug, chapterNumber } = await params;
  const num = parseInt(chapterNumber);
  const user = await getCurrentUser();

  const book = await prisma.book.findUnique({
    where: { slug: bookSlug },
    select: {
      id: true,
      title: true,
      slug: true,
      authorName: true,
    },
  });

  if (!book) notFound();

  const chapter = await prisma.chapter.findUnique({
    where: {
      bookId_chapterNumber: {
        bookId: book.id,
        chapterNumber: num,
      },
    },
  });

  if (!chapter) notFound();

  // Tăng lượt xem hợp lệ
  await prisma.chapter.update({
    where: { id: chapter.id },
    data: { viewCount: { increment: 1 } },
  });
  await prisma.book.update({
    where: { id: book.id },
    data: { readCount: { increment: 1 } },
  });

  // Tìm chương trước & chương sau
  const [prevChapter, nextChapter, allChapters] = await Promise.all([
    prisma.chapter.findFirst({
      where: {
        bookId: book.id,
        chapterNumber: { lt: num },
        publishStatus: 'PUBLISHED',
      },
      orderBy: { chapterNumber: 'desc' },
      select: { id: true, chapterNumber: true, title: true },
    }),
    prisma.chapter.findFirst({
      where: {
        bookId: book.id,
        chapterNumber: { gt: num },
        publishStatus: 'PUBLISHED',
      },
      orderBy: { chapterNumber: 'asc' },
      select: { id: true, chapterNumber: true, title: true },
    }),
    prisma.chapter.findMany({
      where: {
        bookId: book.id,
        publishStatus: 'PUBLISHED',
      },
      orderBy: { chapterNumber: 'asc' },
      select: { id: true, chapterNumber: true, title: true },
    }),
  ]);

  // Lấy tiến độ đã lưu trước đó nếu có
  let initialProgress = 0;
  if (user) {
    const p = await prisma.readingProgress.findFirst({
      where: { userId: user.id, chapterId: chapter.id },
    });
    if (p) initialProgress = p.progressPercent;
  }

  return (
    <ZoryReader
      book={book}
      chapter={{
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        content: chapter.content,
        wordCount: chapter.wordCount,
      }}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
      allChapters={allChapters}
      initialProgress={initialProgress}
    />
  );
}
