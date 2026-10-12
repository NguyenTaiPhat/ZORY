import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdminUser } from '@/lib/auth';
import { testApiKey } from '@/lib/ai/keyRotation';

export async function POST(req: Request) {
  try {
    await requireAdminUser();
    const body = await req.json();
    const { keyId, rawKey, provider = 'gemini', albumId } = body;

    // 1. Kiểm tra nhanh một raw key chưa lưu vào DB (dùng khi nhập form)
    if (rawKey) {
      const result = await testApiKey(rawKey, provider);
      return NextResponse.json({ success: true, result });
    }

    // 2. Kiểm tra hàng loạt tất cả các key trong một Album
    if (albumId) {
      const keysInAlbum = await prisma.apiKeyPool.findMany({
        where: { albumId },
      });

      const results = [];
      for (const k of keysInAlbum) {
        const testRes = await testApiKey(k.key, k.provider);
        const updated = await prisma.apiKeyPool.update({
          where: { id: k.id },
          data: {
            status: testRes.status,
            lastLatencyMs: testRes.latencyMs,
            lastTestedAt: new Date(),
            lastError: testRes.valid ? null : testRes.error,
          },
        });
        results.push({
          id: updated.id,
          name: updated.name,
          ...testRes,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Đã kiểm tra xong ${results.length} key trong album`,
        results,
      });
    }

    // 3. Kiểm tra một key cụ thể đã có trong DB
    if (!keyId) {
      return NextResponse.json({ error: 'Thiếu keyId hoặc rawKey để kiểm tra' }, { status: 400 });
    }

    const keyRecord = await prisma.apiKeyPool.findUnique({
      where: { id: keyId },
    });

    if (!keyRecord) {
      return NextResponse.json({ error: 'Không tìm thấy API key này' }, { status: 404 });
    }

    const testRes = await testApiKey(keyRecord.key, keyRecord.provider);

    const updated = await prisma.apiKeyPool.update({
      where: { id: keyId },
      data: {
        status: testRes.status,
        lastLatencyMs: testRes.latencyMs,
        lastTestedAt: new Date(),
        lastError: testRes.valid ? null : testRes.error,
      },
    });

    return NextResponse.json({
      success: true,
      result: testRes,
      key: {
        id: updated.id,
        status: updated.status,
        lastLatencyMs: updated.lastLatencyMs,
        lastTestedAt: updated.lastTestedAt,
        lastError: updated.lastError,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi kiểm tra API key: ' + error.message }, { status: 500 });
  }
}
