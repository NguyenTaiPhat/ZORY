import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { slugifyVi } from '@/lib/utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const genre = searchParams.get('genre');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'popular'; // popular, latest, rating
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const skip = (page - 1) * limit;

    const where: any = {
      publishStatus: 'PUBLISHED',
    };

    if (genre) {
      where.genres = {
        some: {
          genre: {
            slug: genre,
          },
        },
      };
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } },
        { authorName: { contains: search } },
      ];
    }

    let orderBy: any = { readCount: 'desc' };
    if (sort === 'latest') orderBy = { updatedAt: 'desc' };
    if (sort === 'rating') orderBy = { ratingAvg: 'desc' };
    if (sort === 'chapters') orderBy = { chapters: { _count: 'desc' } };

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          genres: {
            include: {
              genre: true,
            },
          },
          _count: {
            select: {
              chapters: true,
              ratings: true,
            },
          },
        },
      }),
      prisma.book.count({ where }),
    ]);

    const formattedBooks = books.map((b) => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      summary: b.summary,
      coverUrl: b.coverUrl,
      status: b.status,
      authorName: b.authorName || 'Vô danh',
      viewCount: b.viewCount,
      readCount: b.readCount,
      ratingAvg: b.ratingAvg,
      ratingCount: b.ratingCount,
      chapterCount: b._count.chapters,
      genres: b.genres.map((g) => ({ name: g.genre.name, slug: g.genre.slug })),
      updatedAt: b.updatedAt,
    }));

    return NextResponse.json({
      books: formattedBooks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách truyện:', error);
    return NextResponse.json({ error: 'Không thể tải danh sách truyện' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để tạo truyện' }, { status: 401 });
    }

    const body = await req.json();
    const { title, summary, coverUrl, genreIds, status = 'ONGOING' } = body;

    if (!title || !summary) {
      return NextResponse.json({ error: 'Tiêu đề và mô tả không được để trống' }, { status: 400 });
    }

    const baseSlug = slugifyVi(title);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.book.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newBook = await prisma.book.create({
      data: {
        title,
        slug,
        summary,
        coverUrl: coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
        status,
        authorId: user.id,
        authorName: user.name || user.username,
        publishStatus: 'PUBLISHED',
        genres: genreIds && Array.isArray(genreIds) ? {
          create: genreIds.map((gId: string) => ({
            genreId: gId,
          })),
        } : undefined,
      },
    });

    return NextResponse.json({ success: true, book: newBook });
  } catch (error: any) {
    console.error('Lỗi tạo truyện mới:', error);
    return NextResponse.json({ error: 'Không thể tạo truyện' }, { status: 500 });
  }
}
