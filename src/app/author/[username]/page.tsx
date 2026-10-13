import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { AuthorProfileClient } from '@/components/author/AuthorProfileClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  const author = await prisma.user.findFirst({
    where: {
      OR: [
        { username: decodedUsername },
        { username: decodedUsername.toLowerCase() },
      ],
    },
    select: {
      name: true,
      username: true,
      bio: true,
    },
  });

  if (!author) {
    return {
      title: 'Tác Giả Không Tồn Tại | ZORY',
    };
  }

  const displayName = author.name || author.username;
  return {
    title: `Tác Giả ${displayName} (@${author.username}) | ZORY`,
    description:
      author.bio?.slice(0, 160) ||
      `Hồ sơ tác giả ${displayName}, danh sách tác phẩm sáng tác và lịch ra chương định kỳ trên nền tảng ZORY.`,
  };
}

export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  const author = await prisma.user.findFirst({
    where: {
      OR: [
        { username: decodedUsername },
        { username: decodedUsername.toLowerCase() },
      ],
    },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      bannerUrl: true,
      bio: true,
      publishingSchedule: true,
      role: true,
      createdAt: true,
    },
  });

  if (!author) {
    notFound();
  }

  const currentUser = await getCurrentUser();

  const [followerCount, isFollowing, books] = await Promise.all([
    prisma.authorFollow.count({
      where: { authorId: author.id },
    }),
    currentUser
      ? prisma.authorFollow
          .findUnique({
            where: {
              followerId_authorId: {
                followerId: currentUser.id,
                authorId: author.id,
              },
            },
          })
          .then((r) => !!r)
      : Promise.resolve(false),
    prisma.book.findMany({
      where: {
        authorId: author.id,
        publishStatus: 'PUBLISHED',
      },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        _count: {
          select: {
            chapters: {
              where: { publishStatus: 'PUBLISHED' },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
  ]);

  const totalReads = books.reduce((sum, b) => sum + (b.readCount || 0), 0);
  const validRatings = books.filter((b) => b.ratingCount > 0);
  const averageRating =
    validRatings.length > 0
      ? Number(
          (
            validRatings.reduce((sum, b) => sum + b.ratingAvg, 0) /
            validRatings.length
          ).toFixed(1)
        )
      : 5.0;

  const formattedBooks = books.map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    summary: b.summary,
    coverUrl: b.coverUrl,
    status: b.status,
    viewCount: b.viewCount,
    readCount: b.readCount,
    ratingAvg: b.ratingAvg,
    ratingCount: b.ratingCount,
    updatedAt: b.updatedAt,
    chapterCount: b._count.chapters,
    genres: b.genres.map((g) => g.genre),
  }));

  return (
    <AuthorProfileClient
      initialAuthor={author}
      initialStats={{
        followerCount,
        booksCount: books.length,
        totalReads,
        averageRating,
      }}
      books={formattedBooks}
      initialIsFollowing={isFollowing}
      currentUser={currentUser}
    />
  );
}
