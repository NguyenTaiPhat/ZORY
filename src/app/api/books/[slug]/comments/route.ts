import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để bình luận' }, { status: 401 });
    }

    const { slug } = await params;
    const book = await prisma.book.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!book) {
      return NextResponse.json({ error: 'Không tìm thấy truyện' }, { status: 404 });
    }

    const body = await req.json();
    const { content, chapterId, isSpoiler = false } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Nội dung bình luận không được để trống' }, { status: 400 });
    }

    if (content.trim().length > 2000) {
      return NextResponse.json({ error: 'Nội dung bình luận tối đa 2.000 ký tự' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        bookId: book.id,
        chapterId: chapterId || null,
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

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    console.error('Lỗi gửi bình luận:', error);
    return NextResponse.json({ error: 'Lỗi gửi bình luận' }, { status: 500 });
  }
}
