interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Bộ lưu trữ in-memory cho rate limiting
const store = new Map<string, RateLimitEntry>();

// Dọn dẹp các mục hết hạn định kỳ mỗi 5 phút
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Kiểm tra hạn mức request (Sliding Window in-memory)
 * @param key Khóa nhận diện (IP, userId, email...)
 * @param maxRequests Số lượt yêu cầu tối đa cho phép trong cửa sổ
 * @param windowMs Thời lượng cửa sổ (milliseconds)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInMs: windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, entry.resetAt - now),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetInMs: Math.max(0, entry.resetAt - now),
  };
}

/**
 * Lấy IP của client từ Request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}
