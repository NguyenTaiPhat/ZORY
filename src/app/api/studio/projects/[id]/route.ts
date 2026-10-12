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
      where: {
        id,
        userId: user.id,
      },
      include: {
        characters: {
          orderBy: { createdAt: 'asc' },
        },
        outlines: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        studioChapters: {
          orderBy: { chapterNumber: 'asc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Không tìm thấy dự án hoặc không có quyền truy cập' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('Lỗi lấy chi tiết dự án AI:', error);
    return NextResponse.json({ error: 'Lỗi tải dự án' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const project = await prisma.aiProject.findFirst({
      where: { id, userId: user.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Không tìm thấy dự án' }, { status: 404 });
    }

    const updated = await prisma.aiProject.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        premise: body.premise !== undefined ? body.premise : undefined,
        genre: body.genre !== undefined ? body.genre : undefined,
        writingStyle: body.writingStyle !== undefined ? body.writingStyle : undefined,
        targetAudience: body.targetAudience !== undefined ? body.targetAudience : undefined,
        estimatedLength: body.estimatedLength !== undefined ? body.estimatedLength : undefined,
        worldBible: body.worldBible !== undefined ? body.worldBible : undefined,
        coverUrl: body.coverUrl !== undefined ? body.coverUrl : undefined,
      },
    });

    if (body.coverUrl && project.publishedBookId) {
      await prisma.book.update({
        where: { id: project.publishedBookId },
        data: { coverUrl: body.coverUrl },
      });
    }

    // Cập nhật và lưu các chương bản thảo (nếu gửi updatedChapters)
    if (body.updatedChapters && Array.isArray(body.updatedChapters)) {
      if (body.updatedChapters.length > 0) {
        await prisma.studioChapter.deleteMany({
          where: {
            projectId: id,
            chapterNumber: { gt: body.updatedChapters.length },
          },
        });
      }

      for (const ch of body.updatedChapters) {
        const words = ch.content ? ch.content.trim().split(/\s+/).length : 0;
        const status = ch.status || 'DRAFT';

        await prisma.studioChapter.upsert({
          where: {
            projectId_chapterNumber: {
              projectId: id,
              chapterNumber: ch.chapterNumber,
            },
          },
          update: {
            title: ch.title,
            content: ch.content || '',
            summary: ch.summary || null,
            wordCount: words,
            status,
          },
          create: {
            projectId: id,
            chapterNumber: ch.chapterNumber,
            title: ch.title,
            content: ch.content || '',
            summary: ch.summary || null,
            wordCount: words,
            status,
          },
        });
      }

      // Nếu tác phẩm ĐÃ XUẤT BẢN -> tự động đồng bộ sang tác phẩm công khai
      if (project.publishedBookId) {
        await prisma.chapter.deleteMany({
          where: {
            bookId: project.publishedBookId,
            chapterNumber: { gt: body.updatedChapters.length },
          },
        });

        for (const ch of body.updatedChapters) {
          const words = ch.content ? ch.content.trim().split(/\s+/).length : 0;
          const isDraft = ch.status === 'DRAFT' || ch.status === 'HIDDEN';
          const pubStatus = isDraft ? 'DRAFT' : 'PUBLISHED';

          await prisma.chapter.upsert({
            where: {
              bookId_chapterNumber: {
                bookId: project.publishedBookId,
                chapterNumber: ch.chapterNumber,
              },
            },
            update: {
              title: ch.title,
              content: ch.content || 'Nội dung đang được cập nhật...',
              wordCount: words,
              publishStatus: pubStatus,
            },
            create: {
              bookId: project.publishedBookId,
              chapterNumber: ch.chapterNumber,
              title: ch.title,
              content: ch.content || 'Nội dung đang được cập nhật...',
              wordCount: words,
              publishStatus: pubStatus,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    console.error('Lỗi cập nhật dự án:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật dự án' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { id } = await params;

    const result = await prisma.aiProject.deleteMany({
      where: { id, userId: user.id },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy dự án hoặc không có quyền xóa' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Đã xóa dự án' });
  } catch (error: any) {
    console.error('Lỗi xóa dự án:', error);
    return NextResponse.json({ error: 'Lỗi xóa dự án' }, { status: 500 });
  }
}
