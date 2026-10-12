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
      return NextResponse.json({ error: 'Vui lòng đăng nhập để đánh giá' }, { status: 401 });
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
    const score = Math.max(1, Math.min(5, parseInt(body.score) || 5));
    const review = body.review ? String(body.review).trim() : null;

    await prisma.rating.upsert({
      where: {
        bookId_userId: {
          bookId: book.id,
          userId: user.id,
        },
      },
      update: {
        score,
        review,
      },
      create: {
        bookId: book.id,
        userId: user.id,
        score,
        review,
      },
    });

    // Tính lại điểm trung bình
    const allRatings = await prisma.rating.findMany({
      where: { bookId: book.id },
      select: { score: true },
    });

    const ratingCount = allRatings.length;
    const ratingAvg =
      ratingCount > 0
        ? Number(
            (allRatings.reduce((acc, curr) => acc + curr.score, 0) / ratingCount).toFixed(1)
          )
        : 5.0;

    await prisma.book.update({
      where: { id: book.id },
      data: { ratingAvg, ratingCount },
    });

    return NextResponse.json({
      success: true,
      ratingAvg,
      ratingCount,
      message: 'Đã gửi đánh giá thành công',
    });
  } catch (error: any) {
    console.error('Lỗi đánh giá truyện:', error);
    return NextResponse.json({ error: 'Lỗi gửi đánh giá' }, { status: 500 });
  }
}
