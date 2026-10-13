import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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
      select: { id: true, publishedBookId: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Không tìm thấy dự án hoặc bạn không có quyền' },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { versionId, currentContent, currentTitle } = body;

    if (!versionId) {
      return NextResponse.json({ error: 'Thiếu mã phiên bản cần khôi phục' }, { status: 400 });
    }

    const targetVersion = await prisma.studioChapterVersion.findFirst({
      where: {
        id: versionId,
        projectId,
        chapterNumber: chapterNum,
      },
    });

    if (!targetVersion) {
      return NextResponse.json({ error: 'Không tìm thấy phiên bản chỉ định' }, { status: 404 });
    }

    // 1. Tự động sao lưu trạng thái hiện tại trước khi khôi phục
    const currentStudioChapter = await prisma.studioChapter.findUnique({
      where: {
        projectId_chapterNumber: {
          projectId,
          chapterNumber: chapterNum,
        },
      },
    });

    const backupContent =
      typeof currentContent === 'string'
        ? currentContent
        : currentStudioChapter?.content || '';
    const backupTitle =
      typeof currentTitle === 'string' && currentTitle.trim()
        ? currentTitle.trim()
        : currentStudioChapter?.title || `Chương ${chapterNum}`;
    const backupWordCount = backupContent.trim()
      ? backupContent.trim().split(/\s+/).filter(Boolean).length
      : 0;

    if (currentStudioChapter) {
      await prisma.studioChapterVersion.create({
        data: {
          chapterId: currentStudioChapter.id,
          projectId,
          chapterNumber: chapterNum,
          title: backupTitle,
          content: backupContent,
          wordCount: backupWordCount,
          versionName: 'Sao lưu trước khi khôi phục',
          changeNote: `Tự động lưu dự phòng trước khi khôi phục về mốc "${targetVersion.versionName || targetVersion.title}"`,
          source: 'PRE_RESTORE',
        },
      });
    }

    // 2. Cập nhật StudioChapter bằng dữ liệu phiên bản mục tiêu
    const targetWords = targetVersion.content.trim()
      ? targetVersion.content.trim().split(/\s+/).filter(Boolean).length
      : 0;

    const updatedChapter = await prisma.studioChapter.upsert({
      where: {
        projectId_chapterNumber: {
          projectId,
          chapterNumber: chapterNum,
        },
      },
      update: {
        title: targetVersion.title,
        content: targetVersion.content,
        wordCount: targetWords,
      },
      create: {
        projectId,
        chapterNumber: chapterNum,
        title: targetVersion.title,
        content: targetVersion.content,
        wordCount: targetWords,
        status: 'DRAFT',
      },
    });

    // 3. Ghi log sự kiện khôi phục vào dòng lịch sử phiên bản
    await prisma.studioChapterVersion.create({
      data: {
        chapterId: updatedChapter.id,
        projectId,
        chapterNumber: chapterNum,
        title: targetVersion.title,
        content: targetVersion.content,
        wordCount: targetWords,
        versionName: `Khôi phục từ "${targetVersion.versionName || targetVersion.title}"`,
        changeNote: `Khôi phục về phiên bản tạo lúc ${new Date(targetVersion.createdAt).toLocaleString('vi-VN')}`,
        source: 'RESTORE',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Khôi phục bản thảo thành công',
      restoredChapter: {
        chapterNumber: chapterNum,
        title: updatedChapter.title,
        content: updatedChapter.content,
        wordCount: targetWords,
      },
    });
  } catch (error) {
    console.error('Lỗi khôi phục bản thảo:', error);
    return NextResponse.json({ error: 'Lỗi khôi phục bản thảo' }, { status: 500 });
  }
}
