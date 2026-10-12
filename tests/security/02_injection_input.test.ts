import { describe, it } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, BASE_URL, TestContext } from './setup-env';

describe('Group 2: Injection, Input Validation & Request Security', () => {
  let ctx: TestContext;

  it('Setup: Khởi tạo dữ liệu người dùng kiểm thử', async () => {
    ctx = await setupTestEnvironment();
  });

  // 2.1 URL Scheme Injection (XSS / Malicious URIs)
  it('2.1. URL Scheme Injection: Chặn link javascript: hoặc data: trong ảnh bìa (/api/upload/cover)', async () => {
    const maliciousUrls = [
      'javascript:alert(document.cookie)',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      'vbscript:msgbox(1)',
    ];

    for (const badUrl of maliciousUrls) {
      const formData = new FormData();
      formData.append('url', badUrl);

      const res = await fetch(`${BASE_URL}/api/upload/cover`, {
        method: 'POST',
        headers: { Cookie: ctx.authorACookie },
        body: formData,
      });

      assert.strictEqual(
        res.status,
        400,
        `URL không an toàn (${badUrl}) phải bị từ chối 400 Bad Request, thực tế: ${res.status}`
      );
    }
  });

  // 2.2 File Upload Size Limit (DoS / Resource Exhaustion)
  it('2.2. File Upload Size Limit: Chặn tệp ảnh bìa vượt quá giới hạn 5MB (/api/upload/cover)', async () => {
    // Tạo buffer giả lập file 8MB
    const largeBuffer = new Uint8Array(8 * 1024 * 1024);
    const blob = new Blob([largeBuffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', blob, 'oversized-cover.jpg');

    const res = await fetch(`${BASE_URL}/api/upload/cover`, {
      method: 'POST',
      headers: { Cookie: ctx.authorACookie },
      body: formData,
    });

    assert.ok(
      res.status === 400 || res.status === 413,
      `Tệp quá lớn (>5MB) phải bị từ chối với mã 400 hoặc 413, thực tế: ${res.status}`
    );
  });

  // 2.3 Unbounded Text Input (DoS / DB Bloat) trên Comments
  it('2.3. Input Validation: Chặn hoặc cắt bớt bình luận quá dài (>2,000 ký tự) (/api/books/[slug]/comments)', async () => {
    const hugeContent = 'A'.repeat(50000); // 50,000 ký tự

    const res = await fetch(`${BASE_URL}/api/books/${ctx.bookA.slug}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ctx.normalUserCookie,
      },
      body: JSON.stringify({
        content: hugeContent,
      }),
    });

    assert.ok(
      res.status === 400,
      `Bình luận quá dài phải bị từ chối 400 Bad Request, thực tế: ${res.status}`
    );
  });

  // 2.4 SQL Injection Resilience trong tìm kiếm
  it('2.4. Injection Resilience: Kiểm tra chuỗi SQL Injection trong API tìm kiếm (/api/books?search=...)', async () => {
    const sqliPayload = "' UNION SELECT 1, 'admin', 'password', 'hash' -- ";

    const res = await fetch(`${BASE_URL}/api/books?search=${encodeURIComponent(sqliPayload)}`, {
      method: 'GET',
    });

    assert.strictEqual(
      res.status,
      200,
      `Hệ thống ORM phải xử lý an toàn tham số tìm kiếm không gây sập 500, thực tế: ${res.status}`
    );
    const data = await res.json();
    assert.ok(Array.isArray(data.books), 'Phải trả về mảng kết quả rỗng hoặc hợp lệ');
  });
});
