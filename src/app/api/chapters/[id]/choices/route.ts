import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;

    const choices = await prisma.chapterChoice.findMany({
      where: { chapterId },
      orderBy: { order: 'asc' },
      include: {
        targetChapter: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ choices });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách ngã rẽ:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { id: chapterId } = await params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { book: { select: { authorId: true } } },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Không tìm thấy chương' }, { status: 404 });
    }

    if (chapter.book.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bạn không có quyền chỉnh sửa tác phẩm này' }, { status: 403 });
    }

    const body = await req.json();
    const { choiceText, summary, targetChapterId, order } = body;

    if (!choiceText || !choiceText.trim()) {
      return NextResponse.json({ error: 'Nội dung lựa chọn không được để trống' }, { status: 400 });
    }

    const newChoice = await prisma.chapterChoice.create({
      data: {
        chapterId,
        choiceText: choiceText.trim(),
        summary: summary?.trim() || null,
        targetChapterId: targetChapterId || null,
        order: typeof order === 'number' ? order : 0,
      },
      include: {
        targetChapter: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ choice: newChoice });
  } catch (error: any) {
    console.error('Lỗi tạo ngã rẽ:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
