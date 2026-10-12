import { prisma } from '@/lib/db';

export interface KeyTestResult {
  valid: boolean;
  status: 'ACTIVE' | 'RATE_LIMITED' | 'INVALID';
  latencyMs: number;
  message?: string;
  error?: string;
}

/**
 * Kiểm tra tính hợp lệ và tốc độ phản hồi của API key
 */
export async function testApiKey(
  apiKey: string,
  provider: string = 'gemini'
): Promise<KeyTestResult> {
  const startTime = Date.now();

  try {
    if (provider === 'gemini') {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      // Gọi endpoint list models để test key không tốn token quota
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        return {
          valid: true,
          status: 'ACTIVE',
          latencyMs,
          message: `Khóa Gemini hoạt động tốt (${latencyMs}ms)`,
        };
      }

      const errorText = await res.text();
      let errorJson: any = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // ignore
      }

      const errMsg = errorJson?.error?.message || errorText;

      if (res.status === 429) {
        return {
          valid: false,
          status: 'RATE_LIMITED',
          latencyMs,
          error: `Đạt giới hạn ngạch/RPM (429): ${errMsg.slice(0, 120)}`,
        };
      }

      return {
        valid: false,
        status: 'INVALID',
        latencyMs,
        error: `Lỗi xác thực (${res.status}): ${errMsg.slice(0, 120)}`,
      };
    }

    if (provider === 'openai' || provider === 'groq') {
      const baseUrl =
        provider === 'groq'
          ? 'https://api.groq.com/openai/v1/models'
          : 'https://api.openai.com/v1/models';

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        return {
          valid: true,
          status: 'ACTIVE',
          latencyMs,
          message: `Khóa ${provider.toUpperCase()} hoạt động tốt (${latencyMs}ms)`,
        };
      }

      if (res.status === 429) {
        return {
          valid: false,
          status: 'RATE_LIMITED',
          latencyMs,
          error: `Đạt giới hạn ngạch (429)`,
        };
      }

      return {
        valid: false,
        status: 'INVALID',
        latencyMs,
        error: `Khóa không hợp lệ (${res.status})`,
      };
    }

    // Default mock / unknown provider
    return {
      valid: true,
      status: 'ACTIVE',
      latencyMs: 15,
      message: 'Provider cục bộ/giả lập',
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      valid: false,
      status: 'INVALID',
      latencyMs,
      error: err.name === 'AbortError' ? 'Quá thời gian phản hồi (>12s)' : err.message,
    };
  }
}

/**
 * Xoay vòng (Round-Robin & Least-Recently-Used) lấy key tiếp theo trong các Album đang kích hoạt.
 * Cân bằng tải đồng đều, chống nghẽn cho một API key đơn lẻ.
 */
export async function getNextRotatedKey(
  provider: string = 'gemini',
  excludeKeyIds: string[] = []
): Promise<{ id: string; key: string; name: string } | null> {
  try {
    // 1. Phục hồi các key bị RATE_LIMITED quá 10 phút về ACTIVE
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    await prisma.apiKeyPool.updateMany({
      where: {
        status: 'RATE_LIMITED',
        updatedAt: { lt: tenMinutesAgo },
      },
      data: {
        status: 'ACTIVE',
      },
    });

    // 2. Tìm danh sách các key khả dụng thuộc các Album đang kích hoạt
    const candidateKeys = await prisma.apiKeyPool.findMany({
      where: {
        provider,
        isActive: true,
        status: { in: ['ACTIVE', 'UNTESTED'] },
        album: {
          isActive: true,
        },
        id: { notIn: excludeKeyIds },
      },
      orderBy: [
        { lastUsedAt: 'asc' }, // Ưu tiên key ít dùng gần nhất (Round-robin)
        { requestCount: 'asc' }, // Cân bằng số lượng request
      ],
      take: 1,
      select: {
        id: true,
        key: true,
        name: true,
      },
    });

    if (candidateKeys.length === 0) {
      return null;
    }

    const selected = candidateKeys[0];

    // Cập nhật lượt gọi và thời gian sử dụng
    await prisma.apiKeyPool.update({
      where: { id: selected.id },
      data: {
        requestCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    return selected;
  } catch (error) {
    console.error('[KeyRotation] Error selecting rotated key:', error);
    return null;
  }
}

/**
 * Ghi nhận kết quả cuộc gọi API sau khi thực thi
 */
export async function recordKeyUsageResult(
  keyId: string,
  success: boolean,
  errorMessage?: string,
  statusCode?: number
) {
  try {
    if (success) {
      await prisma.apiKeyPool.update({
        where: { id: keyId },
        data: {
          successCount: { increment: 1 },
          status: 'ACTIVE',
          lastError: null,
        },
      });
    } else {
      let newStatus: string | undefined = undefined;
      if (statusCode === 429) {
        newStatus = 'RATE_LIMITED';
      } else if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
        newStatus = 'INVALID';
      }

      await prisma.apiKeyPool.update({
        where: { id: keyId },
        data: {
          errorCount: { increment: 1 },
          ...(newStatus ? { status: newStatus } : {}),
          lastError: errorMessage ? errorMessage.slice(0, 200) : 'Lỗi không xác định',
        },
      });
    }
  } catch (err) {
    console.error('[KeyRotation] Error updating key stats:', err);
  }
}
