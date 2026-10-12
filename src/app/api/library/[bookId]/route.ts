import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { bookId } = await params;

    await prisma.libraryItem.deleteMany({
      where: {
        userId: user.id,
        bookId,
      },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa khỏi tủ sách' });
  } catch (error: any) {
    console.error('Lỗi xóa khỏi tủ sách:', error);
    return NextResponse.json({ error: 'Lỗi xóa khỏi tủ sách' }, { status: 500 });
  }
}
