import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { AudioPlayer } from '@/components/voice/AudioPlayer';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookSlug: string }>;
}): Promise<Metadata> {
  const { bookSlug } = await params;
  const book = await prisma.book.findUnique({
    where: { slug: bookSlug },
    select: { title: true },
  });

  if (!book) return { title: 'Không Tìm Thấy Sách Nói' };

  return {
    title: `Nghe Audio: ${book.title}`,
    description: `Thưởng thức audio ${book.title} bằng công nghệ giọng đọc thông minh ZORY Voice.`,
  };
}

export default async function BookListenPage({
  params,
}: {
  params: Promise<{ bookSlug: string }>;
}) {
  const { bookSlug } = await params;

  const book = await prisma.book.findUnique({
    where: { slug: bookSlug },
    include: {
      chapters: {
        where: { publishStatus: 'PUBLISHED' },
        orderBy: { chapterNumber: 'asc' },
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          content: true,
          wordCount: true,
        },
      },
    },
  });

  if (!book || book.chapters.length === 0) {
    notFound();
  }

  return (
    <AudioPlayer
      book={{
        id: book.id,
        title: book.title,
        slug: book.slug,
        coverUrl: book.coverUrl,
        authorName: book.authorName,
      }}
      chapters={book.chapters}
    />
  );
}
