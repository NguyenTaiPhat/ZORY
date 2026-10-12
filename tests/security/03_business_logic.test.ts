import { describe, it } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, BASE_URL, TestContext } from './setup-env';

describe('Group 3: Business Logic & Quota Enforcement', () => {
  let ctx: TestContext;

  it('Setup: Khởi tạo dữ liệu người dùng kiểm thử', async () => {
    ctx = await setupTestEnvironment();
  });

  // 3.1 TTS Process Quota Bypass khi chưa đăng nhập
  it('3.1. Business Logic: Chặn xử lý TTS vô hạn khi chưa đăng nhập (/api/tts/process)', async () => {
    // Không truyền cookie session
    const res = await fetch(`${BASE_URL}/api/tts/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Đoạn văn kiểm tra âm thanh bypass',
      }),
    });

    // Bắt buộc phải yêu cầu đăng nhập để kiểm soát hạn mức (401 Unauthorized)
    assert.strictEqual(
      res.status,
      401,
      `API tạo giọng đọc bắt buộc phải yêu cầu đăng nhập (401), thực tế: ${res.status}`
    );
  });

  // 3.2 TTS Resource Exhaustion DoS trên GET /api/tts
  it('3.2. DoS Prevention: Chặn yêu cầu TTS với văn bản quá dài (>1,000 ký tự) (/api/tts)', async () => {
    const hugeText = 'Từ ngữ kiểm tra tải trọng '.repeat(100); // > 2,500 ký tự

    const res = await fetch(`${BASE_URL}/api/tts?text=${encodeURIComponent(hugeText)}`, {
      method: 'GET',
    });

    assert.strictEqual(
      res.status,
      400,
      `Văn bản vượt quá hạn mức tối đa của TTS phải bị từ chối 400 Bad Request, thực tế: ${res.status}`
    );
  });

  // 3.3 Language Parameter Whitelist trên GET /api/tts
  it('3.3. Parameter Tampering: Từ chối mã ngôn ngữ không hợp lệ (/api/tts?lang=...)', async () => {
    const maliciousLang = "vi&evil=payload<script>";

    const res = await fetch(`${BASE_URL}/api/tts?text=Xin+chao&lang=${encodeURIComponent(maliciousLang)}`, {
      method: 'GET',
    });

    assert.strictEqual(
      res.status,
      400,
      `Mã ngôn ngữ không hợp lệ phải bị từ chối 400, thực tế: ${res.status}`
    );
  });

  // 3.4 User thường không được tự cấp thêm token qua PATCH /api/admin/users
  it('3.4. Privilege Escalation: User thường không thể tự nạp token qua /api/admin/users', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ctx.normalUserCookie,
      },
      body: JSON.stringify({
        userId: ctx.normalUser.id,
        addTokens: 1000000,
      }),
    });

    assert.strictEqual(
      res.status,
      403,
      `Thao tác tự nạp token của user thường phải bị chặn 403 Forbidden, thực tế: ${res.status}`
    );
  });
});
