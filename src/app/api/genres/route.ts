import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { books: true },
        },
      },
    });

    const formatted = genres.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      bookCount: g._count.books,
    }));

    return NextResponse.json({ genres: formatted });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách thể loại:', error);
    return NextResponse.json({ error: 'Lỗi tải thể loại' }, { status: 500 });
  }
}
