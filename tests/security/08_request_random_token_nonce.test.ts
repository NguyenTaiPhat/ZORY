import { describe, it } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, BASE_URL, TestContext } from './setup-env';
import { generateRequestToken, createSecurityHeaders } from '../../src/lib/requestSecurity';

describe('Group 8: Random Request Token & Nonce Protection (Anti-Abuse & Anti-Replay)', () => {
  let ctx: TestContext;

  it('Setup: Khởi tạo dữ liệu người dùng kiểm thử', async () => {
    ctx = await setupTestEnvironment();
  });

  // 8.1 Chặn gọi mutation nếu thiếu x-request-token
  it('8.1. Anti-Abuse: Chặn gọi trực tiếp mutation API nếu thiếu mã xác thực ngẫu nhiên (x-request-token)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-skip-auto-token': 'true', // Bỏ qua tự động gắn của test runner
      },
      body: JSON.stringify({
        identifier: 'sec_admin',
        password: 'SecurityTest123!',
      }),
    });

    assert.strictEqual(
      res.status,
      403,
      `Yêu cầu thiếu token ngẫu nhiên phải bị chặn với mã 403 Forbidden, thực tế: ${res.status}`
    );
    const data = await res.json();
    assert.ok(
      data.error?.toLowerCase().includes('mã xác thực') || data.error?.toLowerCase().includes('token'),
      'Thông báo lỗi phải nêu rõ thiếu mã xác thực ngẫu nhiên'
    );
  });

  // 8.2 Chặn nếu x-request-token bị giả mạo chữ ký HMAC
  it('8.2. Anti-Abuse: Chặn token ngẫu nhiên bị giả mạo hoặc can thiệp chữ ký HMAC', async () => {
    const fakeToken = '1234567890abcdef.1740000000000.deadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-skip-auto-token': 'true',
        'x-request-token': fakeToken,
        'x-request-nonce': 'random_valid_nonce_123',
      },
      body: JSON.stringify({
        identifier: 'sec_admin',
        password: 'SecurityTest123!',
      }),
    });

    assert.strictEqual(
      res.status,
      403,
      `Token giả mạo phải bị từ chối 403 Forbidden, thực tế: ${res.status}`
    );
  });

  // 8.3 Chặn nếu thiếu mã ngẫu nhiên của lượt gọi (x-request-nonce)
  it('8.3. Anti-Abuse: Chặn yêu cầu nếu thiếu mã ngẫu nhiên của lượt gọi (x-request-nonce)', async () => {
    const validToken = await generateRequestToken();
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-skip-auto-token': 'true',
        'x-request-token': validToken,
      },
      body: JSON.stringify({
        identifier: 'sec_admin',
        password: 'SecurityTest123!',
      }),
    });

    assert.strictEqual(
      res.status,
      403,
      `Yêu cầu thiếu nonce ngẫu nhiên phải bị từ chối 403 Forbidden, thực tế: ${res.status}`
    );
  });

  // 8.4 Chống tấn công phát lại (Replay Attack): Tái sử dụng cùng một nonce bị chặn
  it('8.4. Anti-Replay: Chặn tái sử dụng mã ngẫu nhiên (Replay Attack cùng một Nonce)', async () => {
    const fixedNonce = 'nonce_replay_attack_test_fixed_123';
    const validToken = await generateRequestToken();

    // Lượt 1: Dùng nonce lần đầu -> Phải thành công (hoặc qua được tầng kiểm tra nonce)
    const firstRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-skip-auto-token': 'true',
        'x-request-token': validToken,
        'x-request-nonce': fixedNonce,
      },
      body: JSON.stringify({
        identifier: 'sec_admin',
        password: 'SecurityTest123!',
      }),
    });

    assert.strictEqual(firstRes.status, 200, `Lần 1 với nonce mới phải hợp lệ (200), thực tế: ${firstRes.status}`);

    // Lượt 2: Tái sử dụng nonce cũ -> Phải bị chặn 403 ngay tại middleware
    const secondRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-skip-auto-token': 'true',
        'x-request-token': validToken,
        'x-request-nonce': fixedNonce,
      },
      body: JSON.stringify({
        identifier: 'sec_admin',
        password: 'SecurityTest123!',
      }),
    });

    assert.strictEqual(
      secondRes.status,
      403,
      `Lần 2 dùng lại cùng một nonce phải bị từ chối 403 Forbidden (Replay Attack), thực tế: ${secondRes.status}`
    );
    const data = await secondRes.json();
    assert.ok(
      data.error?.toLowerCase().includes('phát lại') || data.error?.toLowerCase().includes('replay') || data.error?.toLowerCase().includes('đã được sử dụng'),
      'Phải thông báo lỗi phát lại nonce'
    );
  });

  // 8.5 Chặn gọi trực tiếp API tài nguyên cao (TTS) nếu không có mã ngẫu nhiên
  it('8.5. Resource Abuse: Chặn gọi trực tiếp API Text-To-Speech (/api/tts) khi thiếu mã xác thực', async () => {
    const res = await fetch(`${BASE_URL}/api/tts?text=test_audio&lang=vi`, {
      method: 'GET',
      headers: {
        'x-skip-auto-token': 'true',
      },
    });

    assert.strictEqual(
      res.status,
      403,
      `Gọi trực tiếp /api/tts không có mã xác thực phải bị chặn 403 Forbidden, thực tế: ${res.status}`
    );
  });

  // 8.6 Cho phép khi có đầy đủ mã xác thực ngẫu nhiên và nonce mới
  it('8.6. Normal Flow: Cho phép yêu cầu hợp lệ khi đính kèm đầy đủ mã xác thực và nonce mới', async () => {
    const secHeaders = await createSecurityHeaders();
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-skip-auto-token': 'true',
        ...secHeaders,
      },
      body: JSON.stringify({
        identifier: 'sec_admin',
        password: 'SecurityTest123!',
      }),
    });

    assert.strictEqual(
      res.status,
      200,
      `Yêu cầu có đầy đủ token và nonce hợp lệ phải được xử lý thành công 200, thực tế: ${res.status}`
    );
  });

  // 8.7 Endpoint /api/security/token cấp phát mã hợp lệ
  it('8.7. Handshake: Endpoint /api/security/token cấp phát mã xác thực hợp lệ', async () => {
    const res = await fetch(`${BASE_URL}/api/security/token`, {
      method: 'GET',
      headers: {
        'x-skip-auto-token': 'true',
      },
    });

    assert.strictEqual(res.status, 200, `Endpoint cấp phát token phải trả về 200, thực tế: ${res.status}`);
    const data = await res.json();
    assert.ok(data.token, 'Phải có trường token');
    assert.ok(data.expiresAt > Date.now(), 'Token phải có thời gian hết hạn trong tương lai');
  });
});
