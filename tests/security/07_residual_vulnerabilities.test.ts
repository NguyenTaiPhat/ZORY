import { describe, it } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, BASE_URL, TestContext } from './setup-env';

describe('Group 7: Residual Vulnerabilities Audit (CSRF, CSP, Session, Upload, Rate Limit)', () => {
  let ctx: TestContext;

  it('Setup: Khởi tạo dữ liệu người dùng kiểm thử', async () => {
    ctx = await setupTestEnvironment();
  });

  // 7.1 Toàn diện CSRF trên mọi Mutation Endpoint
  it('7.1. CSRF: Chặn request từ Origin lạ trên nhiều API thay đổi dữ liệu (POST, PATCH, DELETE)', async () => {
    const evilOrigin = 'https://malicious-phishing-attacker.org';

    // 1. POST /api/auth/register
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: evilOrigin,
      },
      body: JSON.stringify({ email: 'csrf@test.com', username: 'csrf_user', password: 'Password123!' }),
    });
    assert.strictEqual(regRes.status, 403, `CSRF POST /api/auth/register phải trả về 403, thực tế: ${regRes.status}`);

    // 2. POST /api/books/[slug]/comments
    const commentRes = await fetch(`${BASE_URL}/api/books/${ctx.bookA.slug}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ctx.normalUserCookie,
        Origin: evilOrigin,
      },
      body: JSON.stringify({ content: 'Evil comment from CSRF' }),
    });
    assert.strictEqual(commentRes.status, 403, `CSRF POST /api/books/.../comments phải trả về 403, thực tế: ${commentRes.status}`);

    // 3. PATCH /api/admin/books
    const patchBookRes = await fetch(`${BASE_URL}/api/admin/books`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ctx.adminCookie,
        Origin: evilOrigin,
      },
      body: JSON.stringify({ bookId: ctx.bookA.id, isFeatured: true }),
    });
    assert.strictEqual(patchBookRes.status, 403, `CSRF PATCH /api/admin/books phải trả về 403, thực tế: ${patchBookRes.status}`);

    // 4. POST /api/studio/projects
    const projectRes = await fetch(`${BASE_URL}/api/studio/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ctx.authorACookie,
        Origin: evilOrigin,
      },
      body: JSON.stringify({ title: 'Evil Project from CSRF' }),
    });
    assert.strictEqual(projectRes.status, 403, `CSRF POST /api/studio/projects phải trả về 403, thực tế: ${projectRes.status}`);
  });

  // 7.2 Kiểm thử Session Security (JWT Tampering & Forgery)
  it('7.2. Session Security: Chặn token JWT giả mạo, sửa đổi signature hoặc rác', async () => {
    // 1. Token rác hoàn toàn
    const garbageRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: 'zory_token=invalid_garbage_token_value' },
    });
    assert.strictEqual(garbageRes.status, 401, `Token rác phải trả về 401, thực tế: ${garbageRes.status}`);

    // 2. Token JWT bị giả mạo payload (đổi role thành ADMIN nhưng giữ nguyên signature cũ)
    const [header, payload, sig] = ctx.authorACookie.replace('zory_token=', '').split('.');
    if (header && payload && sig) {
      const tamperedPayload = Buffer.from(
        JSON.stringify({ userId: ctx.authorA.id, role: 'ADMIN' })
      ).toString('base64url');
      const forgedCookie = `zory_token=${header}.${tamperedPayload}.${sig}`;

      const tamperedRes = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Cookie: forgedCookie },
      });
      assert.strictEqual(tamperedRes.status, 401, `Token bị sửa đổi signature phải bị từ chối 401, thực tế: ${tamperedRes.status}`);
    }
  });

  // 7.3 Kiểm thử Upload Security (File type, Size, Path Traversal)
  it('7.3. Upload Security: Chặn tệp quá kích thước 5MB và tệp giả chữ ký nhị phân', async () => {
    // 1. Tệp vượt quá 5MB
    const bigBlob = new Blob([new Uint8Array(6 * 1024 * 1024)], { type: 'image/png' });
    const bigForm = new FormData();
    bigForm.append('file', bigBlob, 'big-photo.png');

    const bigRes = await fetch(`${BASE_URL}/api/upload/cover`, {
      method: 'POST',
      headers: { Cookie: ctx.authorACookie },
      body: bigForm,
    });
    assert.strictEqual(bigRes.status, 400, `Tệp > 5MB phải bị từ chối 400, thực tế: ${bigRes.status}`);

    // 2. Tệp text giả mạo extension .png
    const fakeBlob = new Blob(['Plain text not a real PNG image'], { type: 'image/png' });
    const fakeForm = new FormData();
    fakeForm.append('file', fakeBlob, 'fake.png');

    const fakeRes = await fetch(`${BASE_URL}/api/upload/cover`, {
      method: 'POST',
      headers: { Cookie: ctx.authorACookie },
      body: fakeForm,
    });
    assert.strictEqual(fakeRes.status, 400, `Tệp chữ ký không khớp PNG phải bị từ chối 400, thực tế: ${fakeRes.status}`);
  });

  // 7.4 Kiểm thử Rate Limiting
  it('7.4. Rate Limiting: Chặn brute-force với HTTP 429 sau ngưỡng yêu cầu liên tục', async () => {
    let got429 = false;
    for (let i = 0; i < 25; i++) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'rate_limit_probe_user',
          password: 'PasswordProbe123!',
        }),
      });
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }
    assert.strictEqual(got429, true, 'Gửi dồn dập vượt ngưỡng phải kích hoạt 429 Too Many Requests');
  });

  // 7.5 Kiểm thử CSP Header toàn diện
  it('7.5. CSP Verification: Đảm bảo có đầy đủ chỉ thị an toàn trong Content-Security-Policy', async () => {
    const res = await fetch(`${BASE_URL}/api/genres`);
    const csp = res.headers.get('content-security-policy') || '';

    assert.ok(csp.includes("default-src 'self'"), "CSP phải có default-src 'self'");
    assert.ok(csp.includes("frame-ancestors 'self'"), "CSP phải có frame-ancestors 'self'");
    assert.ok(csp.includes('img-src'), 'CSP phải định nghĩa img-src');
  });
});
