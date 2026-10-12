import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateInitialStory } from '@/lib/ai/storyGenerator';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const projects = await prisma.aiProject.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            characters: true,
            studioChapters: true,
          },
        },
      },
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách dự án AI:', error);
    return NextResponse.json({ error: 'Lỗi tải dự án' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      premise,
      genre,
      writingStyle,
      targetAudience,
      estimatedLength,
      worldBible,
    } = body;

    if (!title || !premise) {
      return NextResponse.json({ error: 'Tên tác phẩm và ý tưởng ban đầu không được để trống' }, { status: 400 });
    }

    // Tự động kiến tạo cốt truyện, danh sách chương và văn bản Chương 1 hoàn chỉnh
    const storyData = await generateInitialStory(
      title,
      premise,
      genre || 'Huyền huyễn',
      writingStyle || 'Văn học hiện đại, giàu cảm xúc, miêu tả chi tiết',
      estimatedLength || 'Truyện ngắn (dưới 10 chương)'
    );

    const project = await prisma.aiProject.create({
      data: {
        userId: user.id,
        title,
        premise,
        genre: genre || 'Huyền huyễn',
        writingStyle: writingStyle || 'Văn học hiện đại, giàu cảm xúc, miêu tả chi tiết',
        targetAudience: targetAudience || 'Mọi lứa tuổi',
        estimatedLength: estimatedLength || 'Truyện ngắn (dưới 10 chương)',
        worldBible: storyData.worldSetting || (typeof worldBible === 'string' ? worldBible : JSON.stringify(worldBible || {}, null, 2)),
        outlines: {
          create: {
            logline: premise,
            synopsis: storyData.synopsis,
            chapterListJson: JSON.stringify(storyData.plannedChapters),
          },
        },
        characters: {
          create: {
            name: storyData.protagonist.name,
            role: storyData.protagonist.role || 'Nhân vật chính',
            appearance: storyData.protagonist.appearance || null,
            personality: storyData.protagonist.personality || null,
            goals: storyData.protagonist.goals || null,
            abilities: storyData.protagonist.abilities || null,
          },
        },
        studioChapters: {
          create: storyData.plannedChapters.map((ch) => ({
            chapterNumber: ch.chapterNumber,
            title: ch.title,
            summary: ch.summary,
            content: ch.content || '',
            wordCount: ch.content ? ch.content.trim().split(/\s+/).length : 0,
            status: ch.content ? 'DRAFT' : 'PLANNED',
          })),
        },
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error('Lỗi tạo dự án AI:', error);
    return NextResponse.json({ error: 'Lỗi tạo dự án' }, { status: 500 });
  }
}
