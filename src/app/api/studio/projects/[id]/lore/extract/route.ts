import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { extractLoreFromText } from '@/lib/ai/loreExtractor';

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
      include: {
        studioChapters: {
          orderBy: { chapterNumber: 'asc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Không tìm thấy dự án' }, { status: 404 });
    }

    // Ghép nội dung các chương hoặc tóm tắt để AI phân tích
    const combinedContent = project.studioChapters
      .map(
        (ch) =>
          `[Chương ${ch.chapterNumber}: ${ch.title}]\n${ch.summary ? `Tóm tắt: ${ch.summary}\n` : ''}${ch.content || ''}`
      )
      .join('\n\n---\n\n');

    if (!combinedContent.trim()) {
      return NextResponse.json(
        { error: 'Chưa có nội dung chương hoặc tóm tắt nào để quét.' },
        { status: 400 }
      );
    }

    // Gọi AI trích xuất lore
    const extracted = await extractLoreFromText(combinedContent, {
      title: project.title,
      genre: project.genre,
      premise: project.premise,
    });

    const createdEntries = [];

    // 1. Lưu Characters
    for (const char of extracted.characters) {
      if (!char.name) continue;
      const existing = await prisma.loreEntry.findFirst({
        where: { projectId: id, name: char.name, category: 'CHARACTER' },
      });
      if (!existing) {
        const item = await prisma.loreEntry.create({
          data: {
            projectId: id,
            category: 'CHARACTER',
            name: char.name,
            aliases: char.aliases || null,
            role: char.role || 'Nhân vật phụ',
            faction: char.faction || null,
            realm: char.realm || null,
            summary: char.summary || '',
            detailsJson: char.relationships ? JSON.stringify({ relationships: char.relationships }) : null,
          },
        });
        createdEntries.push(item);

        // Đồng bộ sang bảng Character nếu chưa có
        const charModel = await prisma.character.findFirst({
          where: { projectId: id, name: char.name },
        });
        if (!charModel) {
          await prisma.character.create({
            data: {
              projectId: id,
              name: char.name,
              role: char.role || 'Nhân vật phụ',
              abilities: char.realm || null,
              personality: char.summary || null,
              relationships: char.relationships || null,
            },
          });
        }
      }
    }

    // 2. Lưu Factions
    for (const fac of extracted.factions) {
      if (!fac.name) continue;
      const existing = await prisma.loreEntry.findFirst({
        where: { projectId: id, name: fac.name, category: 'FACTION' },
      });
      if (!existing) {
        const item = await prisma.loreEntry.create({
          data: {
            projectId: id,
            category: 'FACTION',
            name: fac.name,
            role: fac.type || 'Thế lực',
            summary: fac.summary || '',
          },
        });
        createdEntries.push(item);
      }
    }

    // 3. Lưu Realms
    for (const r of extracted.realms) {
      if (!r.name) continue;
      const existing = await prisma.loreEntry.findFirst({
        where: { projectId: id, name: r.name, category: 'REALM' },
      });
      if (!existing) {
        const item = await prisma.loreEntry.create({
          data: {
            projectId: id,
            category: 'REALM',
            name: r.name,
            role: r.level ? `Cấp ${r.level}` : 'Cảnh giới',
            summary: r.summary || '',
          },
        });
        createdEntries.push(item);
      }
    }

    // 4. Lưu Artifacts
    for (const art of extracted.artifacts) {
      if (!art.name) continue;
      const existing = await prisma.loreEntry.findFirst({
        where: { projectId: id, name: art.name, category: 'ARTIFACT' },
      });
      if (!existing) {
        const item = await prisma.loreEntry.create({
          data: {
            projectId: id,
            category: 'ARTIFACT',
            name: art.name,
            role: art.type || 'Pháp bảo',
            summary: art.summary || '',
          },
        });
        createdEntries.push(item);
      }
    }

    // Lấy toàn bộ lore sau khi quét
    const allLore = await prisma.loreEntry.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      message: `Đã quét và trích xuất thành công ${createdEntries.length} thực thể mới`,
      newCount: createdEntries.length,
      allLore,
      extractedPreview: extracted,
    });
  } catch (error: any) {
    console.error('Lỗi trích xuất lore AI:', error);
    return NextResponse.json({ error: 'Lỗi trong quá trình AI phân tích lore' }, { status: 500 });
  }
}
