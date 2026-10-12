import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const book = await prisma.book.findUnique({
      where: { slug },
      include: {
        chapters: {
          take: 1,
          select: { id: true },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Không tìm thấy tác phẩm' }, { status: 404 });
    }

    // Tìm lore trực tiếp từ bookId
    let loreEntries = await prisma.loreEntry.findMany({
      where: { bookId: book.id },
      orderBy: { createdAt: 'desc' },
    });

    // Nếu sách chưa có lore trực tiếp, kiểm tra xem có AiProject cùng tên của tác giả không
    if (loreEntries.length === 0) {
      const relatedProject = await prisma.aiProject.findFirst({
        where: {
          title: book.title,
          userId: book.authorId,
        },
        include: {
          loreEntries: true,
        },
      });

      if (relatedProject && relatedProject.loreEntries.length > 0) {
        loreEntries = relatedProject.loreEntries;
      }
    }

    return NextResponse.json({
      bookTitle: book.title,
      loreEntries,
    });
  } catch (error: any) {
    console.error('Lỗi lấy Lorebook của tác phẩm:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
