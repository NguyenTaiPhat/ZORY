import { describe, it } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, BASE_URL } from './setup-env';

describe('Group 4: Configuration & Security Headers', () => {
  it('Setup: Khởi tạo dữ liệu người dùng kiểm thử', async () => {
    await setupTestEnvironment();
  });

  // 4.1 X-Content-Type-Options
  it('4.1. Security Header: Phải có X-Content-Type-Options: nosniff', async () => {
    const res = await fetch(`${BASE_URL}/api/genres`);
    const header = res.headers.get('x-content-type-options');
    assert.strictEqual(
      header?.toLowerCase(),
      'nosniff',
      `Header x-content-type-options phải là nosniff, thực tế: ${header}`
    );
  });

  // 4.2 X-Frame-Options (Clickjacking)
  it('4.2. Security Header: Phải có X-Frame-Options chống Clickjacking', async () => {
    const res = await fetch(`${BASE_URL}/api/genres`);
    const header = res.headers.get('x-frame-options');
    assert.ok(
      header && (header.toUpperCase() === 'DENY' || header.toUpperCase() === 'SAMEORIGIN'),
      `Header x-frame-options phải là DENY hoặc SAMEORIGIN, thực tế: ${header}`
    );
  });

  // 4.3 Referrer-Policy
  it('4.3. Security Header: Phải có Referrer-Policy hợp lệ', async () => {
    const res = await fetch(`${BASE_URL}/api/genres`);
    const header = res.headers.get('referrer-policy');
    assert.ok(
      header && header.length > 0,
      `Phải có header referrer-policy, thực tế: ${header}`
    );
  });

  // 4.4 Cookie Flags
  it('4.4. Cookie Security: Cookie zory_token phải có cờ HttpOnly và SameSite', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'sec_admin',
        password: 'SecurityTest123!',
      }),
    });

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Phải có header Set-Cookie sau khi đăng nhập');
    assert.ok(
      setCookie.toLowerCase().includes('httponly'),
      'Cookie zory_token phải có cờ HttpOnly'
    );
    assert.ok(
      setCookie.toLowerCase().includes('samesite=lax') || setCookie.toLowerCase().includes('samesite=strict'),
      'Cookie zory_token phải có cờ SameSite'
    );
  });

  // 4.5 Strict-Transport-Security (HSTS)
  it('4.5. Security Header: Phải có Strict-Transport-Security (HSTS) ép buộc mã hóa HTTPS', async () => {
    const res = await fetch(`${BASE_URL}/api/genres`);
    const hsts = res.headers.get('strict-transport-security');
    assert.ok(hsts, 'Phải có header strict-transport-security');
    assert.ok(
      hsts.includes('max-age='),
      `HSTS header phải chứa max-age, thực tế: ${hsts}`
    );
  });
});
