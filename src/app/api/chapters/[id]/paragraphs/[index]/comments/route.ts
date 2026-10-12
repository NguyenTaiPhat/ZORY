import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  try {
    const { id: chapterId, index } = await params;
    const paragraphIndex = parseInt(index, 10);

    if (isNaN(paragraphIndex)) {
      return NextResponse.json({ error: 'Index đoạn văn không hợp lệ' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        chapterId,
        paragraphIndex,
      },
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
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('Lỗi lấy bình luận đoạn văn:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để bình luận' }, { status: 401 });
    }

    const { id: chapterId, index } = await params;
    const paragraphIndex = parseInt(index, 10);

    if (isNaN(paragraphIndex)) {
      return NextResponse.json({ error: 'Index đoạn văn không hợp lệ' }, { status: 400 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, bookId: true },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Không tìm thấy chương' }, { status: 404 });
    }

    const body = await req.json();
    const { content, isSpoiler } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Nội dung bình luận không được để trống' }, { status: 400 });
    }

    if (content.trim().length > 2000) {
      return NextResponse.json({ error: 'Nội dung bình luận tối đa 2.000 ký tự' }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        bookId: chapter.bookId,
        chapterId: chapter.id,
        paragraphIndex,
        userId: user.id,
        content: content.trim(),
        isSpoiler: !!isSpoiler,
      },
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
    });

    return NextResponse.json({ comment: newComment });
  } catch (error: any) {
    console.error('Lỗi tạo bình luận đoạn văn:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
