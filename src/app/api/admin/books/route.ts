import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdminUser } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdminUser();

    const books = await prisma.book.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, name: true, email: true },
        },
        _count: {
          select: { chapters: true, ratings: true },
        },
      },
    });

    return NextResponse.json({ books });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await req.json();
    const { bookId, publishStatus, isFeatured } = body;

    if (!bookId) {
      return NextResponse.json({ error: 'Thiếu bookId' }, { status: 400 });
    }

    const updated = await prisma.book.update({
      where: { id: bookId },
      data: {
        publishStatus: publishStatus !== undefined ? publishStatus : undefined,
        isFeatured: isFeatured !== undefined ? isFeatured : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_BOOK_STATUS',
        targetType: 'BOOK',
        targetId: bookId,
        details: JSON.stringify({ publishStatus, isFeatured }),
      },
    });

    return NextResponse.json({ success: true, book: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi cập nhật sách' }, { status: 500 });
  }
}
