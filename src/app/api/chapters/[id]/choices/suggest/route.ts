import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { suggestStoryBranches } from '@/lib/ai/branchGenerator';

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
    const body = await req.json().catch(() => ({}));
    const { autoSave } = body;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        book: {
          select: {
            title: true,
            authorId: true,
            genres: {
              include: { genre: true },
            },
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Không tìm thấy chương' }, { status: 404 });
    }

    if (chapter.book.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bạn không có quyền chỉnh sửa tác phẩm này' }, { status: 403 });
    }

    const genre = chapter.book.genres.map((g) => g.genre.name).join(', ') || 'Tiên Hiệp';

    const suggestions = await suggestStoryBranches(chapter.title, chapter.content, {
      title: chapter.book.title,
      genre,
    });

    let savedChoices = [];
    if (autoSave) {
      for (let i = 0; i < suggestions.length; i++) {
        const item = suggestions[i];
        const created = await prisma.chapterChoice.create({
          data: {
            chapterId,
            choiceText: item.choiceText,
            summary: item.summary,
            order: i,
          },
        });
        savedChoices.push(created);
      }
    }

    return NextResponse.json({
      suggestions,
      savedChoices: savedChoices.length > 0 ? savedChoices : undefined,
    });
  } catch (error: any) {
    console.error('Lỗi sinh ngã rẽ AI:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi gợi ý ngã rẽ' }, { status: 500 });
  }
}
