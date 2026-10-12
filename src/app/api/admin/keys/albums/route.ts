import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdminUser } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdminUser();
    const albums = await prisma.apiKeyAlbum.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { keys: true },
        },
      },
    });

    return NextResponse.json({ albums });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi nạp album: ' + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminUser();
    const body = await req.json();
    const { name, monthKey, description } = body;

    const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-10"
    const finalMonthKey = monthKey?.trim() || currentYearMonth;
    const finalName = name?.trim() || `Album Tháng ${finalMonthKey.split('-')[1]}/${finalMonthKey.split('-')[0]}`;

    const album = await prisma.apiKeyAlbum.create({
      data: {
        name: finalName,
        monthKey: finalMonthKey,
        description: description?.trim() || `Danh mục API key phục vụ định ngạch tháng ${finalMonthKey}`,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, album });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi tạo album: ' + error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdminUser();
    const body = await req.json();
    const { id, isActive, name, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu id album' }, { status: 400 });
    }

    const updated = await prisma.apiKeyAlbum.update({
      where: { id },
      data: {
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() } : {}),
      },
    });

    return NextResponse.json({ success: true, album: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi cập nhật album: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu id album' }, { status: 400 });
    }

    await prisma.apiKeyAlbum.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa album và toàn bộ key liên quan' });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi xóa album: ' + error.message }, { status: 500 });
  }
}
