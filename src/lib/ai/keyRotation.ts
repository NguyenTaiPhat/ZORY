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
    // Select and reserve atomically. Serializable transactions prevent parallel
    // requests from all reading the same least-used key before any can update it.
    // Retry serialization conflicts, which are expected under concurrent traffic.
    for (let retry = 0; retry < 4; retry++) {
      try {
        return await prisma.$transaction(async (tx) => {
          const selected = await tx.apiKeyPool.findFirst({
            where: {
              provider,
              isActive: true,
              status: { in: ['ACTIVE', 'UNTESTED'] },
              album: { isActive: true },
              id: { notIn: excludeKeyIds },
            },
            // Keep total usage balanced first, then rotate among equally used keys.
            orderBy: [
              { requestCount: 'asc' },
              { lastUsedAt: 'asc' },
              { createdAt: 'asc' },
            ],
            select: { id: true, key: true, name: true },
          });

          if (!selected) return null;

          await tx.apiKeyPool.update({
            where: { id: selected.id },
            data: {
              requestCount: { increment: 1 },
              lastUsedAt: new Date(),
            },
          });

          return selected;
        }, { isolationLevel: 'Serializable' });
      } catch (error: any) {
        if (error?.code !== 'P2034' || retry === 3) throw error;
      }
    }

    return null;
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
