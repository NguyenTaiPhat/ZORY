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
      select: { id: true },
    });

    if (!author) {
      return NextResponse.json({ error: 'Không tìm thấy tác giả' }, { status: 404 });
    }

    const currentUser = await getCurrentUser();

    const [followerCount, isFollowing] = await Promise.all([
      prisma.authorFollow.count({ where: { authorId: author.id } }),
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
    ]);

    return NextResponse.json({
      isFollowing,
      followerCount,
    });
  } catch (error) {
    console.error('Lỗi kiểm tra trạng thái follow:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để theo dõi tác giả' }, { status: 401 });
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
      select: { id: true, name: true, username: true },
    });

    if (!author) {
      return NextResponse.json({ error: 'Không tìm thấy tác giả' }, { status: 404 });
    }

    if (currentUser.id === author.id) {
      return NextResponse.json({ error: 'Bạn không thể tự theo dõi chính mình' }, { status: 400 });
    }

    await prisma.authorFollow.upsert({
      where: {
        followerId_authorId: {
          followerId: currentUser.id,
          authorId: author.id,
        },
      },
      create: {
        followerId: currentUser.id,
        authorId: author.id,
      },
      update: {},
    });

    const followerCount = await prisma.authorFollow.count({
      where: { authorId: author.id },
    });

    return NextResponse.json({
      success: true,
      isFollowing: true,
      followerCount,
    });
  } catch (error) {
    console.error('Lỗi theo dõi tác giả:', error);
    return NextResponse.json({ error: 'Không thể theo dõi tác giả' }, { status: 500 });
  }
}

export async function DELETE(
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
      select: { id: true },
    });

    if (!author) {
      return NextResponse.json({ error: 'Không tìm thấy tác giả' }, { status: 404 });
    }

    await prisma.authorFollow.deleteMany({
      where: {
        followerId: currentUser.id,
        authorId: author.id,
      },
    });

    const followerCount = await prisma.authorFollow.count({
      where: { authorId: author.id },
    });

    return NextResponse.json({
      success: true,
      isFollowing: false,
      followerCount,
    });
  } catch (error) {
    console.error('Lỗi hủy theo dõi tác giả:', error);
    return NextResponse.json({ error: 'Không thể hủy theo dõi' }, { status: 500 });
  }
}
