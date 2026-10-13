import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
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
      return NextResponse.json({ error: 'Không tìm thấy tác giả' }, { status: 404 });
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

    return NextResponse.json({
      author,
      stats: {
        followerCount,
        booksCount: books.length,
        totalReads,
        averageRating,
      },
      isFollowing,
      books: books.map((b) => ({
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
      })),
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin tác giả:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

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
      },
    });

    if (!author) {
      return NextResponse.json({ error: 'Không tìm thấy tác giả' }, { status: 404 });
    }

    if (currentUser.id !== author.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Bạn không có quyền chỉnh sửa hồ sơ tác giả này' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { bio, publishingSchedule, bannerUrl, name } = body;

    const updated = await prisma.user.update({
      where: { id: author.id },
      data: {
        ...(typeof bio === 'string' ? { bio: bio.trim() } : {}),
        ...(typeof publishingSchedule === 'string'
          ? { publishingSchedule: publishingSchedule.trim() }
          : {}),
        ...(typeof bannerUrl === 'string' ? { bannerUrl: bannerUrl.trim() } : {}),
        ...(typeof name === 'string' && name.trim() ? { name: name.trim() } : {}),
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
      },
    });

    return NextResponse.json({
      success: true,
      author: updated,
    });
  } catch (error) {
    console.error('Lỗi cập nhật hồ sơ tác giả:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật' }, { status: 500 });
  }
}
