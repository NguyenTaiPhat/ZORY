import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { slugifyVi } from '@/lib/utils';

const GENRE_COVER_MAP: Record<string, string> = {
  'Đô thị': 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600',
  'Tiên hiệp': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
  'Kiếm hiệp': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600',
  'Huyền huyễn': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600',
  'Khoa huyễn': 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600',
  'Ngôn tình': 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600',
  'Trinh thám': 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600',
  'Kinh dị': 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=600',
  'Trọng sinh': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
  'Xuyên không': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
  'Đam mỹ': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
  'Đam mỹ (Nam Nam)': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
  'Nam Nam': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
  'Bách hợp': 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600',
  'Bách hợp (Nữ Nữ)': 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600',
  'Nữ Nữ': 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600',
  'Không ràng buộc': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { id: projectId } = await params;

    const project = await prisma.aiProject.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
      include: {
        studioChapters: {
          orderBy: { chapterNumber: 'asc' },
        },
        characters: true,
        loreEntries: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Không tìm thấy dự án bản thảo hoặc bạn không có quyền' },
        { status: 404 }
      );
    }

    if (!project.studioChapters || project.studioChapters.length === 0) {
      return NextResponse.json(
        { error: 'Bản thảo cần có ít nhất 1 chương để xuất bản' },
        { status: 400 }
      );
    }

    // 1. Tìm hoặc tự động tạo thể loại trong CSDL (không ràng buộc cứng)
    const genreName = project.genre?.trim() || 'Huyền huyễn';
    const genreSlug = slugifyVi(genreName);

    let matchedGenre = await prisma.genre.findFirst({
      where: {
        OR: [
          { name: genreName },
          { slug: genreSlug },
          { name: { contains: genreName } },
        ],
      },
    });

    if (!matchedGenre && genreName) {
      let uniqueSlug = genreSlug || 'the-loai';
      let counter = 1;
      while (await prisma.genre.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${genreSlug}-${counter++}`;
      }
      matchedGenre = await prisma.genre.create({
        data: {
          name: genreName,
          slug: uniqueSlug,
          description: `Tác phẩm thuộc thể loại ${genreName} trên ZORY Platform.`,
        },
      });
    }

    const fallbackGenre = matchedGenre || (await prisma.genre.findFirst());

    const body = await req.json().catch(() => ({}));

    // 2. Kiểm tra nếu đã xuất bản trước đó -> cập nhật lại nội dung công khai
    let targetBook: any = null;

    if (project.publishedBookId) {
      targetBook = await prisma.book.findUnique({
        where: { id: project.publishedBookId },
      });
    }

    const defaultCover =
      GENRE_COVER_MAP[project.genre] ||
      GENRE_COVER_MAP[genreName] ||
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600';

    const finalCover =
      body.coverUrl ||
      project.coverUrl ||
      (targetBook && targetBook.coverUrl) ||
      defaultCover;

    if (targetBook) {
      // Cập nhật tác phẩm công khai hiện có
      await prisma.book.update({
        where: { id: targetBook.id },
        data: {
          title: project.title,
          summary: project.premise,
          coverUrl: finalCover,
          publishStatus: 'PUBLISHED',
          updatedAt: new Date(),
        },
      });

      if (fallbackGenre) {
        await prisma.bookGenre.deleteMany({
          where: { bookId: targetBook.id },
        });
        await prisma.bookGenre.create({
          data: {
            bookId: targetBook.id,
            genreId: fallbackGenre.id,
          },
        });
      }

      await prisma.aiProject.update({
        where: { id: project.id },
        data: {
          coverUrl: finalCover,
          publishedBookId: targetBook.id,
          publishedBookSlug: targetBook.slug,
        },
      });

      // Đồng bộ các chương
      await prisma.chapter.deleteMany({
        where: {
          bookId: targetBook.id,
          chapterNumber: { gt: project.studioChapters.length },
        },
      });

      let publishedCount = 0;
      for (const sc of project.studioChapters) {
        const words = sc.content ? sc.content.trim().split(/\s+/).length : 0;
        const isDraft = sc.status === 'DRAFT' || sc.status === 'HIDDEN';
        const pubStatus = isDraft ? 'DRAFT' : 'PUBLISHED';
        if (pubStatus === 'PUBLISHED') publishedCount++;

        await prisma.chapter.upsert({
          where: {
            bookId_chapterNumber: {
              bookId: targetBook.id,
              chapterNumber: sc.chapterNumber,
            },
          },
          update: {
            title: sc.title,
            content: sc.content || 'Nội dung đang được cập nhật...',
            wordCount: words,
            publishStatus: pubStatus,
          },
          create: {
            bookId: targetBook.id,
            chapterNumber: sc.chapterNumber,
            title: sc.title,
            content: sc.content || 'Nội dung đang được cập nhật...',
            wordCount: words,
            publishStatus: pubStatus,
          },
        });
      }
    } else {
      // Tạo mới Book công khai
      const baseSlug = slugifyVi(project.title);
      let slug = baseSlug;
      let counter = 1;
      while (await prisma.book.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      let publishedCount = 0;
      const chaptersToCreate = project.studioChapters.map((sc, index) => {
        const isDraft = sc.status === 'DRAFT' || sc.status === 'HIDDEN';
        let pubStatus = isDraft ? 'DRAFT' : 'PUBLISHED';
        if (index === 0 && isDraft && sc.content) {
          pubStatus = 'PUBLISHED';
        }
        if (pubStatus === 'PUBLISHED') publishedCount++;

        return {
          chapterNumber: sc.chapterNumber,
          title: sc.title,
          content: sc.content || 'Nội dung đang được cập nhật...',
          wordCount: sc.content ? sc.content.trim().split(/\s+/).length : 0,
          publishStatus: pubStatus,
        };
      });

      if (publishedCount === 0 && chaptersToCreate.length > 0) {
        chaptersToCreate[0].publishStatus = 'PUBLISHED';
        publishedCount = 1;
        await prisma.studioChapter.updateMany({
          where: { projectId: project.id, chapterNumber: 1 },
          data: { status: 'PUBLISHED' },
        });
      }

      targetBook = await prisma.book.create({
        data: {
          title: project.title,
          slug,
          summary: project.premise,
          coverUrl: finalCover,
          status: 'ONGOING',
          publishStatus: 'PUBLISHED',
          authorId: user.id,
          authorName: user.name || user.username,
          genres: fallbackGenre
            ? {
                create: [{ genreId: fallbackGenre.id }],
              }
            : undefined,
          chapters: {
            create: chaptersToCreate,
          },
        },
      });

      // Liên kết ngược vào AiProject
      await prisma.aiProject.update({
        where: { id: project.id },
        data: {
          coverUrl: finalCover,
          publishedBookId: targetBook.id,
          publishedBookSlug: targetBook.slug,
        },
      });
    }

    // 3. Đồng bộ LoreEntry của dự án vào Book công khai để độc giả được tra cứu
    if (targetBook && targetBook.id) {
      await prisma.loreEntry.updateMany({
        where: { projectId: project.id },
        data: { bookId: targetBook.id },
      });
    }

    const totalChapters = project.studioChapters.length;
    const finalPublishedCount = targetBook ? await prisma.chapter.count({
      where: { bookId: targetBook.id, publishStatus: 'PUBLISHED' },
    }) : totalChapters;

    return NextResponse.json({
      success: true,
      message: 'Cập nhật tác phẩm lên Thư viện ZORY thành công!',
      bookId: targetBook.id,
      bookSlug: targetBook.slug,
      slug: targetBook.slug,
      bookTitle: targetBook.title,
      chaptersPublished: finalPublishedCount,
      chapterCount: finalPublishedCount,
      totalChapters,
      draftCount: totalChapters - finalPublishedCount,
    });
  } catch (error: any) {
    console.error('Lỗi xuất bản tác phẩm:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi xuất bản tác phẩm' },
      { status: 500 }
    );
  }
}
