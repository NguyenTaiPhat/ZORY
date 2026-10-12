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
