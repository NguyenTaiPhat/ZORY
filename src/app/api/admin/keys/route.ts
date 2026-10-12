import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdminUser } from '@/lib/auth';
import { testApiKey } from '@/lib/ai/keyRotation';

export async function GET(req: Request) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(req.url);
    const albumId = searchParams.get('albumId');

    // 1. Lấy danh sách albums
    const albums = await prisma.apiKeyAlbum.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { keys: true },
        },
      },
    });

    // 2. Lấy danh sách keys (lọc theo albumId nếu có)
    const whereClause: any = {};
    if (albumId && albumId !== 'all') {
      whereClause.albumId = albumId;
    }

    const keys = await prisma.apiKeyPool.findMany({
      where: whereClause,
      orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        album: {
          select: { id: true, name: true, monthKey: true, isActive: true },
        },
      },
    });

    // Mask keys để hiển thị an toàn: e.g. "AIzaSy...4X9B"
    const safeKeys = keys.map((k) => {
      const len = k.key.length;
      const masked =
        len > 10
          ? `${k.key.slice(0, 6)}...${k.key.slice(-4)}`
          : '••••••••••••';
      return {
        ...k,
        maskedKey: masked,
        // Giữ lại key đầy đủ để admin có thể copy/xem nếu cần
        rawKey: k.key,
      };
    });

    // 3. Thống kê tổng quan cho Balancer
    const totalKeys = keys.length;
    const activeKeys = keys.filter((k) => k.isActive && k.status !== 'INVALID').length;
    const totalRequests = keys.reduce((acc, k) => acc + k.requestCount, 0);
    const totalSuccess = keys.reduce((acc, k) => acc + k.successCount, 0);
    const totalErrors = keys.reduce((acc, k) => acc + k.errorCount, 0);
    const latencies = keys.filter((k) => k.lastLatencyMs && k.lastLatencyMs > 0).map((k) => k.lastLatencyMs as number);
    const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

    return NextResponse.json({
      albums,
      keys: safeKeys,
      stats: {
        totalKeys,
        activeKeys,
        totalRequests,
        totalSuccess,
        totalErrors,
        avgLatency,
        healthRatio: totalRequests > 0 ? Math.round((totalSuccess / totalRequests) * 100) : 100,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi tải danh sách API key: ' + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminUser();
    const body = await req.json();
    const { albumId, provider = 'gemini', key, keysText, name, autoTest = true } = body;

    if (!albumId) {
      return NextResponse.json({ error: 'Vui lòng chọn Album theo tháng' }, { status: 400 });
    }

    const albumExists = await prisma.apiKeyAlbum.findUnique({
      where: { id: albumId },
    });
    if (!albumExists) {
      return NextResponse.json({ error: 'Album không tồn tại' }, { status: 404 });
    }

    // Trường hợp 1: Nhập hàng loạt nhiều keys (mỗi dòng một key)
    if (keysText && typeof keysText === 'string') {
      const lines = keysText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 5);

      if (lines.length === 0) {
        return NextResponse.json({ error: 'Không tìm thấy API key hợp lệ trong nội dung dán' }, { status: 400 });
      }

      const createdList = [];
      for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const keyName = `${name ? name + ' ' : ''}Key #${i + 1}`;
        
        let testRes: any = null;
        if (autoTest) {
          testRes = await testApiKey(raw, provider);
        }

        const record = await prisma.apiKeyPool.create({
          data: {
            albumId,
            name: keyName,
            provider,
            key: raw,
            status: testRes ? testRes.status : 'UNTESTED',
            lastLatencyMs: testRes ? testRes.latencyMs : null,
            lastTestedAt: testRes ? new Date() : null,
            lastError: testRes && !testRes.valid ? testRes.error : null,
          },
        });
        createdList.push(record);
      }

      return NextResponse.json({
        success: true,
        message: `Đã thêm thành công ${createdList.length} API key vào ${albumExists.name}`,
        count: createdList.length,
      });
    }

    // Trường hợp 2: Nhập một key đơn lẻ
    if (!key || typeof key !== 'string' || key.trim().length < 5) {
      return NextResponse.json({ error: 'API key không hợp lệ hoặc quá ngắn' }, { status: 400 });
    }

    const cleanKey = key.trim();
    const keyLabel = name?.trim() || `Gemini Key - ${new Date().toLocaleTimeString('vi-VN')}`;

    let testRes: any = null;
    if (autoTest) {
      testRes = await testApiKey(cleanKey, provider);
    }

    const created = await prisma.apiKeyPool.create({
      data: {
        albumId,
        name: keyLabel,
        provider,
        key: cleanKey,
        status: testRes ? testRes.status : 'UNTESTED',
        lastLatencyMs: testRes ? testRes.latencyMs : null,
        lastTestedAt: testRes ? new Date() : null,
        lastError: testRes && !testRes.valid ? testRes.error : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã thêm khóa ${created.name} vào ${albumExists.name}`,
      key: created,
      testResult: testRes,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Lỗi thêm API key: ' + error.message }, { status: 500 });
  }
}
