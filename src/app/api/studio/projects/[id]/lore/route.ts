import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { id } = await params;
    const project = await prisma.aiProject.findFirst({
      where: { id, userId: user.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Không tìm thấy dự án' }, { status: 404 });
    }

    const loreEntries = await prisma.loreEntry.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    });

    const characters = await prisma.character.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ loreEntries, characters });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách Lore:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { id } = await params;
    const project = await prisma.aiProject.findFirst({
      where: { id, userId: user.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Không tìm thấy dự án' }, { status: 404 });
    }

    const body = await req.json();
    const { category, name, aliases, role, realm, faction, summary, detailsJson } = body;

    if (!name || !summary) {
      return NextResponse.json({ error: 'Thiếu tên hoặc tóm tắt' }, { status: 400 });
    }

    const newEntry = await prisma.loreEntry.create({
      data: {
        projectId: id,
        category: category || 'CHARACTER',
        name: name.trim(),
        aliases: aliases?.trim() || null,
        role: role?.trim() || null,
        realm: realm?.trim() || null,
        faction: faction?.trim() || null,
        summary: summary.trim(),
        detailsJson: typeof detailsJson === 'object' ? JSON.stringify(detailsJson) : detailsJson || null,
      },
    });

    // Nếu category là CHARACTER, đồng bộ sang Character model nếu chưa có
    if ((category || 'CHARACTER') === 'CHARACTER') {
      const existingChar = await prisma.character.findFirst({
        where: { projectId: id, name: name.trim() },
      });
      if (!existingChar) {
        await prisma.character.create({
          data: {
            projectId: id,
            name: name.trim(),
            role: role?.trim() || 'Nhân vật chính',
            abilities: realm?.trim() || null,
            personality: summary.trim(),
          },
        });
      }
    }

    return NextResponse.json({ entry: newEntry });
  } catch (error: any) {
    console.error('Lỗi tạo LoreEntry:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tạo hồ sơ lore' }, { status: 500 });
  }
}
