import crypto from 'crypto';

const DEFAULT_SECRET = process.env.AUTH_SECRET || 'zory-super-secret-jwt-key-minimum-32-chars-long-2025';

function getDerivedKey(secret: string = DEFAULT_SECRET): Buffer {
  return crypto.createHash('sha256').update(secret).digest();
}

export interface EncryptedEnvelope {
  ciphertext: string;
  iv: string;
  tag: string;
}

/**
 * Mã hóa payload bằng thuật toán AES-256-GCM (Authenticated Encryption)
 */
export function encryptPayload(data: any, secret: string = DEFAULT_SECRET): EncryptedEnvelope {
  const key = getDerivedKey(secret);
  const iv = crypto.randomBytes(12); // 96-bit IV chuẩn cho AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const tag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext,
    iv: iv.toString('hex'),
    tag,
  };
}

/**
 * Giải mã payload AES-256-GCM và xác thực tính toàn vẹn (Auth Tag)
 */
export function decryptPayload<T = any>(envelope: EncryptedEnvelope, secret: string = DEFAULT_SECRET): T {
  const key = getDerivedKey(secret);
  const iv = Buffer.from(envelope.iv, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

  decipher.setAuthTag(Buffer.from(envelope.tag, 'hex'));

  let decrypted = decipher.update(envelope.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted as unknown as T;
  }
}

/**
 * Tạo chữ ký HMAC-SHA256 cho payload kèm timestamp (Chống giả mạo)
 */
export function signRequestPayload(payloadString: string, timestamp: number, secret: string = DEFAULT_SECRET): string {
  const key = getDerivedKey(secret);
  return crypto.createHmac('sha256', key).update(`${timestamp}:${payloadString}`).digest('hex');
}

/**
 * Xác thực chữ ký và chống tấn công phát lại (Anti-Replay Attack)
 * Mặc định từ chối các request có độ trễ > 5 phút (300.000 ms)
 */
export function verifyRequestIntegrity(
  payloadString: string,
  timestamp: number,
  signature: string,
  secret: string = DEFAULT_SECRET,
  maxAgeMs = 300000
): { valid: boolean; error?: string } {
  const now = Date.now();
  if (Math.abs(now - timestamp) > maxAgeMs) {
    return { valid: false, error: 'Yêu cầu hết hạn hoặc nghi vấn tấn công phát lại (Replay Attack)' };
  }

  const expectedSig = signRequestPayload(payloadString, timestamp, secret);
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSig, 'hex');

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, error: 'Chữ ký yêu cầu không hợp lệ (Dữ liệu đã bị can thiệp)' };
  }

  return { valid: true };
}

/**
 * Helper bóc tách request: Hỗ trợ tự động giải mã AES-256-GCM nếu payload được mã hóa,
 * và kiểm tra chống Replay nếu có header X-Request-Signature & X-Request-Timestamp.
 */
export async function parseSecureRequest<T = any>(
  req: Request,
  secret: string = DEFAULT_SECRET
): Promise<{ data: T; isEncrypted: boolean; isSigned: boolean }> {
  const rawText = await req.text();
  const signature = req.headers.get('x-request-signature');
  const timestampStr = req.headers.get('x-request-timestamp');

  let isSigned = false;
  if (signature && timestampStr) {
    const timestamp = parseInt(timestampStr, 10);
    const verify = verifyRequestIntegrity(rawText, timestamp, signature, secret);
    if (!verify.valid) {
      throw new Error(verify.error);
    }
    isSigned = true;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = rawText;
  }

  // Nếu là gói tin mã hóa { encrypted: true, payload: { ciphertext, iv, tag } }
  if (parsed && parsed.encrypted === true && parsed.payload) {
    const decryptedData = decryptPayload<T>(parsed.payload, secret);
    return { data: decryptedData, isEncrypted: true, isSigned };
  }

  return { data: parsed as T, isEncrypted: false, isSigned };
}
