import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; loreId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { id, loreId } = await params;
    const project = await prisma.aiProject.findFirst({
      where: { id, userId: user.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Không tìm thấy dự án' }, { status: 404 });
    }

    await prisma.loreEntry.deleteMany({
      where: { id: loreId, projectId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi xóa LoreEntry:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi xóa lore' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; loreId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { id, loreId } = await params;
    const project = await prisma.aiProject.findFirst({
      where: { id, userId: user.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Không tìm thấy dự án' }, { status: 404 });
    }

    // Chống IDOR: Xác minh LoreEntry thực sự thuộc về dự án này
    const existingLore = await prisma.loreEntry.findFirst({
      where: { id: loreId, projectId: id },
    });

    if (!existingLore) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ lore trong dự án này' }, { status: 404 });
    }

    const body = await req.json();
    const updated = await prisma.loreEntry.update({
      where: { id: loreId },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        aliases: body.aliases !== undefined ? body.aliases?.trim() : undefined,
        role: body.role !== undefined ? body.role?.trim() : undefined,
        realm: body.realm !== undefined ? body.realm?.trim() : undefined,
        faction: body.faction !== undefined ? body.faction?.trim() : undefined,
        summary: body.summary !== undefined ? body.summary.trim() : undefined,
        detailsJson: body.detailsJson !== undefined ? (typeof body.detailsJson === 'object' ? JSON.stringify(body.detailsJson) : body.detailsJson) : undefined,
      },
    });

    return NextResponse.json({ entry: updated });
  } catch (error: any) {
    console.error('Lỗi cập nhật LoreEntry:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật' }, { status: 500 });
  }
}
