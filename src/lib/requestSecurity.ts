import { validateCsrfOrigin } from './csrf';

const DEFAULT_SECRET = process.env.AUTH_SECRET || 'zory-request-security-secret-key-32-chars-2025';

// Bộ nhớ đệm lưu các nonce đã sử dụng trong 10 phút gần nhất để chống tấn công phát lại (Replay Attack)
const usedNonces = new Map<string, number>();

/**
 * Dọn dẹp các nonce đã quá thời hạn 10 phút
 */
function cleanupOldNonces() {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [nonce, time] of usedNonces.entries()) {
    if (time < cutoff) {
      usedNonces.delete(nonce);
    }
  }
}

/**
 * Tạo chuỗi hex ngẫu nhiên an toàn bằng Web Crypto chuẩn (Hỗ trợ 100% Edge & Node.js)
 */
function getRandomHex(bytesCount = 16): string {
  const bytes = new Uint8Array(bytesCount);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Tạo chữ ký HMAC-SHA256 bằng Web Crypto API (Tương thích tuyệt đối Next.js Edge Runtime)
 */
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * So sánh chuỗi với thời gian hằng số (Constant-time comparison) chống tấn công Timing Attack
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Trích xuất cookie từ Request headers
 */
export function getCookieFromRequest(req: Request, name: string): string | null {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Sinh mã xác thực ngẫu nhiên kèm chữ ký HMAC (Request Security Token)
 * Cấu trúc: [randomHex].[timestamp].[hmacSignature]
 */
export async function generateRequestToken(secret: string = DEFAULT_SECRET): Promise<string> {
  const randomHex = getRandomHex(16);
  const timestamp = Date.now();
  const signature = await hmacSha256Hex(secret, `${randomHex}:${timestamp}`);

  return `${randomHex}.${timestamp}.${signature}`;
}

/**
 * Xác thực tính hợp lệ của Request Token
 * Mặc định hết hạn sau 4 giờ (14.400.000 ms)
 */
export async function validateRequestToken(
  token: string,
  secret: string = DEFAULT_SECRET,
  maxAgeMs = 4 * 60 * 60 * 1000
): Promise<{ valid: boolean; reason?: string }> {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Thiếu mã xác thực (Request Token).' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'Mã xác thực không đúng định dạng.' };
  }

  const [randomHex, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { valid: false, reason: 'Thời gian trong mã xác thực không hợp lệ.' };
  }

  const now = Date.now();
  if (now - timestamp > maxAgeMs) {
    return { valid: false, reason: 'Mã xác thực yêu cầu đã hết hạn.' };
  }

  // Cho phép dung sai chênh lệch đồng hồ tối đa 60 giây trong tương lai
  if (timestamp - now > 60000) {
    return { valid: false, reason: 'Thời gian mã xác thực vượt quá tương lai.' };
  }

  const expectedSig = await hmacSha256Hex(secret, `${randomHex}:${timestamp}`);

  if (!constantTimeEqual(signature, expectedSig)) {
    return { valid: false, reason: 'Chữ ký mã xác thực không hợp lệ (Bị can thiệp).' };
  }

  return { valid: true };
}

/**
 * Xác thực mã ngẫu nhiên của mỗi yêu cầu (Per-Request Nonce) và chống Replay
 */
export function validateRequestNonce(nonce: string): { valid: boolean; reason?: string } {
  if (!nonce || typeof nonce !== 'string') {
    return { valid: false, reason: 'Thiếu mã ngẫu nhiên của yêu cầu (X-Request-Nonce).' };
  }

  const cleanNonce = nonce.trim();
  if (cleanNonce.length < 8 || cleanNonce.length > 128) {
    return { valid: false, reason: 'Độ dài mã ngẫu nhiên (Nonce) không hợp lệ (cần 8-128 ký tự).' };
  }

  if (!/^[a-zA-Z0-9_\-]+$/.test(cleanNonce)) {
    return { valid: false, reason: 'Định dạng mã ngẫu nhiên (Nonce) không hợp lệ.' };
  }

  const now = Date.now();
  if (usedNonces.has(cleanNonce)) {
    return {
      valid: false,
      reason: 'Mã ngẫu nhiên (Nonce) đã được sử dụng. Nghi vấn tấn công phát lại (Replay Attack).',
    };
  }

  usedNonces.set(cleanNonce, now);
  if (usedNonces.size > 20000) {
    cleanupOldNonces();
  }

  return { valid: true };
}

/**
 * Kiểm tra toàn diện an ninh yêu cầu (Origin CSRF + Request Token + Per-Request Nonce)
 * Ngăn chặn tuyệt đối việc sử dụng API tự động từ bên ngoài cho mục đích khác
 */
export async function validateRequestSecurity(req: Request): Promise<{ valid: boolean; reason?: string }> {
  // 1. Kiểm tra Origin / Referer (CSRF)
  const originCheck = validateCsrfOrigin(req);
  if (!originCheck.valid) {
    return originCheck;
  }

  // 2. Kiểm tra Request Token
  const urlObj = new URL(req.url);
  const token =
    req.headers.get('x-request-token') ||
    req.headers.get('x-csrf-token') ||
    req.headers.get('x-zory-token') ||
    getCookieFromRequest(req, 'zory_req_token') ||
    urlObj.searchParams.get('token') ||
    urlObj.searchParams.get('x-request-token');

  if (!token) {
    return {
      valid: false,
      reason: 'Thiếu mã xác thực ngẫu nhiên (X-Request-Token). Truy cập API trực tiếp bị từ chối.',
    };
  }

  const tokenCheck = await validateRequestToken(token);
  if (!tokenCheck.valid) {
    return tokenCheck;
  }

  // 3. Kiểm tra Per-Request Nonce (Mã ngẫu nhiên riêng cho từng lượt gọi)
  const nonce =
    req.headers.get('x-request-nonce') ||
    req.headers.get('x-nonce') ||
    req.headers.get('x-zory-nonce') ||
    urlObj.searchParams.get('nonce') ||
    urlObj.searchParams.get('x-request-nonce');

  if (!nonce) {
    return {
      valid: false,
      reason: 'Thiếu mã ngẫu nhiên của lượt gọi (X-Request-Nonce).',
    };
  }

  const nonceCheck = validateRequestNonce(nonce);
  if (!nonceCheck.valid) {
    return nonceCheck;
  }

  return { valid: true };
}

/**
 * Tiện ích tạo bộ header an ninh hợp lệ (Dành cho kiểm thử nội bộ hoặc client)
 */
export async function createSecurityHeaders(secret: string = DEFAULT_SECRET): Promise<{
  'x-request-token': string;
  'x-request-nonce': string;
  'x-request-time': string;
}> {
  const token = await generateRequestToken(secret);
  const nonce = getRandomHex(16);
  return {
    'x-request-token': token,
    'x-request-nonce': nonce,
    'x-request-time': Date.now().toString(),
  };
}

export { validateCsrfOrigin };
