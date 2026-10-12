import { describe, it } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, BASE_URL, TestContext } from './setup-env';
import { encryptPayload, signRequestPayload } from '../../src/lib/requestCrypto';

describe('Group 5: Advanced Defenses (Magic Bytes, Lockout, CSRF, CSP)', () => {
  let ctx: TestContext;

  it('Setup: Khởi tạo dữ liệu người dùng kiểm thử', async () => {
    ctx = await setupTestEnvironment();
  });

  // 5.1 Magic Bytes Validation - Từ chối file giả mạo MIME/extension
  it('5.1. Magic Bytes: Chặn tệp giả mạo .jpg chứa mã độc hoặc văn bản thường (/api/upload/cover)', async () => {
    const fakeImageContent = '<?php echo "HACKED"; ?> <script>alert(1)</script>';
    const blob = new Blob([fakeImageContent], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', blob, 'fake-photo.jpg');

    const res = await fetch(`${BASE_URL}/api/upload/cover`, {
      method: 'POST',
      headers: { Cookie: ctx.authorACookie },
      body: formData,
    });

    assert.strictEqual(
      res.status,
      400,
      `Tệp giả mạo magic bytes phải bị từ chối 400 Bad Request, thực tế: ${res.status}`
    );
    const data = await res.json();
    assert.ok(
      data.error?.toLowerCase().includes('magic bytes') || data.error?.toLowerCase().includes('hình ảnh hợp lệ'),
      'Thông báo lỗi phải chỉ rõ chữ ký magic bytes không khớp'
    );
  });

  // 5.2 Magic Bytes Validation - Chấp nhận tệp có chữ ký nhị phân hợp lệ
  it('5.2. Magic Bytes: Chấp nhận tệp có chữ ký PNG chuẩn (89 50 4E 47)', async () => {
    // 8 bytes PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const validPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const blob = new Blob([validPngBytes], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', blob, 'valid-cover.png');

    const res = await fetch(`${BASE_URL}/api/upload/cover`, {
      method: 'POST',
      headers: { Cookie: ctx.authorACookie },
      body: formData,
    });

    assert.strictEqual(
      res.status,
      200,
      `Tệp có chữ ký magic bytes hợp lệ phải được chấp nhận 200, thực tế: ${res.status}`
    );
  });

  // 5.3 Account Lockout sau 5 lần nhập sai mật khẩu
  it('5.3. Account Lockout: Khóa tạm tài khoản (429) sau 5 lần đăng nhập thất bại', async () => {
    const targetUser = 'lockout_test_victim';

    // Tạo nhanh tài khoản kiểm thử lockout
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'lockout_test@zory.test',
        username: targetUser,
        password: 'CorrectPassword123!',
      }),
    });

    // Thử 5 lần mật khẩu sai
    for (let i = 1; i <= 5; i++) {
      await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetUser,
          password: `WrongPasswordAttempt${i}`,
        }),
      });
    }

    // Lần thứ 6 (kể cả dùng mật khẩu đúng hay sai) phải bị chặn 429 Account Locked
    const lockedRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: targetUser,
        password: 'CorrectPassword123!',
      }),
    });

    assert.strictEqual(
      lockedRes.status,
      429,
      `Sau 5 lần sai, tài khoản phải bị khóa tạm với mã 429, thực tế: ${lockedRes.status}`
    );
    const data = await lockedRes.json();
    assert.ok(
      data.error?.includes('khóa') || data.error?.includes('quá 5 lần'),
      'Phải thông báo tài khoản bị khóa do nhập sai'
    );
  });

  // 5.4 CSRF Origin Validation
  it('5.4. CSRF Protection: Chặn mutation request từ Origin độc hại bên ngoài', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://attacker-phishing-site.xyz',
      },
      body: JSON.stringify({
        identifier: 'sec_admin',
        password: 'SecurityTest123!',
      }),
    });

    assert.strictEqual(
      res.status,
      403,
      `Yêu cầu từ Origin lạ bên ngoài phải bị từ chối 403 Forbidden, thực tế: ${res.status}`
    );
  });

  // 5.5 Content-Security-Policy Header
  it('5.5. Content Security Policy: Phải có header Content-Security-Policy hợp lệ', async () => {
    const res = await fetch(`${BASE_URL}/api/genres`);
    const csp = res.headers.get('content-security-policy');

    assert.ok(csp, 'Phải có header content-security-policy trong phản hồi HTTP');
    assert.ok(
      csp.includes("default-src 'self'"),
      'CSP phải chứa chỉ thị an toàn default-src'
    );
  });

  // 5.6 Payload Encryption (AES-256-GCM)
  it('5.6. Payload Encryption: Server giải mã thành công request body mã hóa AES-256-GCM', async () => {
    const rawData = {
      userId: ctx.authorA.id,
      addTokens: 100,
    };
    const encryptedEnvelope = encryptPayload(rawData);

    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ctx.adminCookie,
      },
      body: JSON.stringify({
        encrypted: true,
        payload: encryptedEnvelope,
      }),
    });

    assert.strictEqual(
      res.status,
      200,
      `Yêu cầu mã hóa AES-256-GCM phải được giải mã và xử lý thành công 200, thực tế: ${res.status}`
    );
    const data = await res.json();
    assert.strictEqual(data.success, true, 'API phải phản hồi success: true');
  });

  // 5.7 Request Integrity & Anti-Replay Attack
  it('5.7. Anti-Replay & Integrity: Chặn request có chữ ký giả mạo hoặc timestamp quá hạn', async () => {
    const payload = JSON.stringify({ userId: ctx.authorA.id, addTokens: 50 });
    const expiredTimestamp = Date.now() - 10 * 60 * 1000; // 10 phút trước (> 5 phút max age)
    const forgedSig = signRequestPayload(payload, expiredTimestamp);

    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ctx.adminCookie,
        'X-Request-Timestamp': expiredTimestamp.toString(),
        'X-Request-Signature': forgedSig,
      },
      body: payload,
    });

    assert.notStrictEqual(
      res.status,
      200,
      'Yêu cầu quá hạn 10 phút (Replay Attack) không được phép trả về 200 OK'
    );
  });
});
