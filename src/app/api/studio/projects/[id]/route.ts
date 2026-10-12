import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { slugifyVi } from '@/lib/utils';

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

    // Tự động liên kết sách nếu đã xuất bản trước đó nhưng chưa gán id/slug
    if (!project.publishedBookId || !project.publishedBookSlug) {
      const expectedSlug = slugifyVi(project.title);
      const existingBook = await prisma.book.findFirst({
        where: {
          OR: [
            { authorId: user.id, title: project.title },
            { slug: expectedSlug },
            { slug: { startsWith: `${expectedSlug}-` } },
          ],
        },
        select: { id: true, slug: true },
      });
      if (existingBook) {
        await prisma.aiProject.update({
          where: { id: project.id },
          data: {
            publishedBookId: existingBook.id,
            publishedBookSlug: existingBook.slug,
          },
        });
        project.publishedBookId = existingBook.id;
        project.publishedBookSlug = existingBook.slug;
      }
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

    // Tự động tìm targetBookId nếu project chưa có publishedBookId
    let bookIdToSync = project.publishedBookId;
    let bookSlugToSync = project.publishedBookSlug;
    if (!bookIdToSync) {
      const expectedSlug = slugifyVi(project.title);
      const existingBook = await prisma.book.findFirst({
        where: {
          authorId: user.id,
          OR: [
            { title: project.title },
            { slug: expectedSlug },
            { slug: { startsWith: `${expectedSlug}-` } },
          ],
        },
        select: { id: true, slug: true },
      });
      if (existingBook) {
        bookIdToSync = existingBook.id;
        bookSlugToSync = existingBook.slug;
      }
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
        publishedBookId: bookIdToSync || undefined,
        publishedBookSlug: bookSlugToSync || undefined,
      },
    });

    if (body.coverUrl && bookIdToSync) {
      await prisma.book.update({
        where: { id: bookIdToSync },
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
        const hasContent = ch.content && ch.content.trim().length > 30;

        let status = 'DRAFT';
        if (ch.status === 'PUBLISHED') {
          status = 'PUBLISHED';
        } else if (ch.status === 'HIDDEN') {
          status = 'HIDDEN';
        } else {
          status = hasContent ? 'PUBLISHED' : 'DRAFT';
        }

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
      if (bookIdToSync) {
        await prisma.chapter.deleteMany({
          where: {
            bookId: bookIdToSync,
            chapterNumber: { gt: body.updatedChapters.length },
          },
        });

        for (const ch of body.updatedChapters) {
          const words = ch.content ? ch.content.trim().split(/\s+/).length : 0;
          const hasContent = ch.content && ch.content.trim().length > 30;

          let pubStatus = 'DRAFT';
          if (ch.status === 'PUBLISHED') {
            pubStatus = 'PUBLISHED';
          } else if (ch.status === 'HIDDEN') {
            pubStatus = 'DRAFT';
          } else {
            // Mặc định: có nội dung thực tế -> PUBLISHED; chưa có nội dung (dự thảo/0 từ) -> DRAFT
            pubStatus = hasContent ? 'PUBLISHED' : 'DRAFT';
          }

          await prisma.chapter.upsert({
            where: {
              bookId_chapterNumber: {
                bookId: bookIdToSync,
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
              bookId: bookIdToSync,
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
