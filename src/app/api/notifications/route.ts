import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: currentUser.id },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      prisma.notification.count({
        where: { userId: currentUser.id, isRead: false },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách thông báo:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, markAll } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: {
          userId: currentUser.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    } else if (id) {
      await prisma.notification.updateMany({
        where: {
          id,
          userId: currentUser.id,
        },
        data: {
          isRead: true,
        },
      });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: currentUser.id, isRead: false },
    });

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái thông báo:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật thông báo' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const clearRead = searchParams.get('clearRead') === 'true';

    if (clearRead) {
      await prisma.notification.deleteMany({
        where: {
          userId: currentUser.id,
          isRead: true,
        },
      });
    } else if (id) {
      await prisma.notification.deleteMany({
        where: {
          id,
          userId: currentUser.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi xóa thông báo:', error);
    return NextResponse.json({ error: 'Lỗi xóa thông báo' }, { status: 500 });
  }
}
