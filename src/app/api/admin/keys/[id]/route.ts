import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdminUser } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const body = await req.json();
    const { isActive, name, albumId, resetStats } = body;

    const updateData: any = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (name) updateData.name = name.trim();
    if (albumId) updateData.albumId = albumId;
    if (resetStats) {
      updateData.requestCount = 0;
      updateData.successCount = 0;
      updateData.errorCount = 0;
      updateData.status = 'ACTIVE';
      updateData.lastError = null;
    }

    const updated = await prisma.apiKeyPool.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, key: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi cập nhật key: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser();
    const { id } = await params;

    await prisma.apiKeyPool.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa API key' });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi xóa key: ' + error.message }, { status: 500 });
  }
}
