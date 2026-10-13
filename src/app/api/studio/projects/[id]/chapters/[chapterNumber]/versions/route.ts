import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; chapterNumber: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { id: projectId, chapterNumber } = await params;
    const chapterNum = parseInt(chapterNumber, 10);
    if (isNaN(chapterNum)) {
      return NextResponse.json({ error: 'Số chương không hợp lệ' }, { status: 400 });
    }

    const project = await prisma.aiProject.findFirst({
      where: {
        id: projectId,
        ...(user.role !== 'ADMIN' ? { userId: user.id } : {}),
      },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Không tìm thấy dự án hoặc bạn không có quyền' },
        { status: 404 }
      );
    }

    const versions = await prisma.studioChapterVersion.findMany({
      where: {
        projectId,
        chapterNumber: chapterNum,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Lỗi lấy danh sách phiên bản chương:', error);
    return NextResponse.json({ error: 'Lỗi tải lịch sử phiên bản' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; chapterNumber: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { id: projectId, chapterNumber } = await params;
    const chapterNum = parseInt(chapterNumber, 10);
    if (isNaN(chapterNum)) {
      return NextResponse.json({ error: 'Số chương không hợp lệ' }, { status: 400 });
    }

    const project = await prisma.aiProject.findFirst({
      where: {
        id: projectId,
        ...(user.role !== 'ADMIN' ? { userId: user.id } : {}),
      },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Không tìm thấy dự án hoặc không có quyền' },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { title, content, versionName, changeNote, source } = body;

    const safeContent = content || '';
    const safeTitle = title?.trim() || `Chương ${chapterNum}`;
    const wordCount = safeContent.trim()
      ? safeContent.trim().split(/\s+/).filter(Boolean).length
      : 0;

    // Tìm hoặc khởi tạo StudioChapter nếu chưa có
    let studioChapter = await prisma.studioChapter.findUnique({
      where: {
        projectId_chapterNumber: {
          projectId,
          chapterNumber: chapterNum,
        },
      },
    });

    if (!studioChapter) {
      studioChapter = await prisma.studioChapter.create({
        data: {
          projectId,
          chapterNumber: chapterNum,
          title: safeTitle,
          content: safeContent,
          wordCount,
          status: 'DRAFT',
        },
      });
    }

    const version = await prisma.studioChapterVersion.create({
      data: {
        chapterId: studioChapter.id,
        projectId,
        chapterNumber: chapterNum,
        title: safeTitle,
        content: safeContent,
        wordCount,
        versionName: versionName?.trim() || null,
        changeNote: changeNote?.trim() || null,
        source: source || 'MANUAL',
      },
    });

    return NextResponse.json({
      success: true,
      version,
    });
  } catch (error) {
    console.error('Lỗi tạo phiên bản bản thảo:', error);
    return NextResponse.json({ error: 'Lỗi tạo bản lưu' }, { status: 500 });
  }
}
