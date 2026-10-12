import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ttsAdapter } from '@/lib/tts/adapter';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để sử dụng tính năng tạo giọng đọc' }, { status: 401 });
    }

    const body = await req.json();
    const { text, voice, speed, chapterId } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Nội dung văn bản không được để trống' }, { status: 400 });
    }

    if (user.role !== 'ADMIN' && user.ttsCharsUsed >= user.ttsCharsQuota) {
      return NextResponse.json(
        { error: 'Bạn đã đạt giới hạn hạn mức Text-to-Speech trong tháng.' },
        { status: 429 }
      );
    }

    const ttsResult = await ttsAdapter.processTts({
      text,
      voice,
      speed: Number(speed) || 1.0,
      chapterId,
      userId: user?.id,
    });

    if (user && ttsResult.status !== 'FAILED') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ttsCharsUsed: { increment: Math.min(text.length, 1000) },
        },
      });
    }

    return NextResponse.json({
      success: true,
      result: ttsResult,
      adapterStatus: ttsAdapter.getStatus(),
    });
  } catch (error: any) {
    console.error('Lỗi xử lý TTS:', error);
    return NextResponse.json({ error: 'Lỗi tạo giọng đọc' }, { status: 500 });
  }
}
