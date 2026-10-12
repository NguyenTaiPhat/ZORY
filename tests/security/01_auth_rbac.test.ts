import { describe, it } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, cleanupTestEnvironment, BASE_URL, TestContext } from './setup-env';

describe('Group 1: Authentication & Authorization (RBAC / IDOR)', () => {
  let ctx: TestContext;

  it('Setup: Khởi tạo dữ liệu người dùng kiểm thử', async () => {
    ctx = await setupTestEnvironment();
    assert.ok(ctx.adminUser, 'Admin user phải được tạo');
    assert.ok(ctx.authorA, 'Author A phải được tạo');
    assert.ok(ctx.authorB, 'Author B phải được tạo');
    assert.ok(ctx.normalUser, 'Normal user phải được tạo');
  });

  // 1.1 Admin Authentication & RBAC
  it('1.1. Chặn khách vãng lai truy cập API Admin (/api/admin/users)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'GET',
    });
    // Phải trả về 401 hoặc 403
    assert.ok(
      res.status === 401 || res.status === 403,
      `Khách vãng lai phải bị từ chối, thực tế: ${res.status}`
    );
  });

  it('1.2. Chặn người dùng thường (USER) truy cập API Admin (/api/admin/users)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'GET',
      headers: { Cookie: ctx.normalUserCookie },
    });
    assert.strictEqual(
      res.status,
      403,
      `User thường truy cập Admin phải trả về 403 Forbidden, thực tế: ${res.status}`
    );
  });

  it('1.3. Cho phép Admin truy cập hợp lệ (/api/admin/users)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'GET',
      headers: { Cookie: ctx.adminCookie },
    });
    assert.strictEqual(res.status, 200, `Admin phải truy cập thành công 200, thực tế: ${res.status}`);
    const data = await res.json();
    assert.ok(Array.isArray(data.users), 'Phải trả về danh sách users');
  });

  // 1.4 IDOR trên Dự án AI Studio
  it('1.4. IDOR: Author B KHÔNG được xem dự án AI của Author A (/api/studio/projects/[id])', async () => {
    const res = await fetch(`${BASE_URL}/api/studio/projects/${ctx.projectA.id}`, {
      method: 'GET',
      headers: { Cookie: ctx.authorBCookie },
    });
    assert.ok(
      res.status === 404 || res.status === 403,
      `Author B không được xem dự án của Author A, thực tế: ${res.status}`
    );
  });

  it('1.5. IDOR: Author B KHÔNG được xóa dự án AI của Author A (/api/studio/projects/[id])', async () => {
    const res = await fetch(`${BASE_URL}/api/studio/projects/${ctx.projectA.id}`, {
      method: 'DELETE',
      headers: { Cookie: ctx.authorBCookie },
    });
    // API trả về success nhưng kiểm tra projectA vẫn còn trong DB
    const checkRes = await fetch(`${BASE_URL}/api/studio/projects/${ctx.projectA.id}`, {
      method: 'GET',
      headers: { Cookie: ctx.authorACookie },
    });
    assert.strictEqual(checkRes.status, 200, 'Dự án của Author A không được bị xóa bởi Author B');
  });

  // 1.6 IDOR trên Lore Entry (Lỗ hổng phát hiện trong mã nguồn)
  it('1.6. IDOR: Author B KHÔNG được sửa LoreEntry của Author A (/api/studio/projects/[id]/lore/[loreId])', async () => {
    // Author B gửi request sửa LoreEntry của Author A
    const res = await fetch(
      `${BASE_URL}/api/studio/projects/${ctx.projectA.id}/lore/${ctx.loreEntryA.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: ctx.authorBCookie,
        },
        body: JSON.stringify({
          name: 'HACKED BY AUTHOR B',
          summary: 'Bị thay đổi trái phép do IDOR',
        }),
      }
    );

    // Phải bị từ chối 403 hoặc 404
    assert.ok(
      res.status === 403 || res.status === 404,
      `Author B sửa lore của Author A phải bị từ chối (403/404), thực tế: ${res.status}`
    );
  });

  // 1.7 Lỗ hổng đọc trộm Chương Nháp (DRAFT Chapter Data Leak)
  it('1.7. Data Leak: Khách hoặc User thường KHÔNG được đọc chương DRAFT (/api/chapters/[id])', async () => {
    const res = await fetch(`${BASE_URL}/api/chapters/${ctx.draftChapterA.id}`, {
      method: 'GET',
      headers: { Cookie: ctx.normalUserCookie },
    });
    // Chương nháp (DRAFT) chưa xuất bản: không được phép trả về 200 kèm nội dung
    assert.ok(
      res.status === 403 || res.status === 404,
      `Chương DRAFT chưa xuất bản không được lộ cho người khác (403/404), thực tế: ${res.status}`
    );
  });

  // 1.8 Lỗ hổng tạo ngã rẽ trái phép vào tác phẩm người khác
  it('1.8. Authorization: Người lạ KHÔNG được thêm Chapter Choice vào chương (/api/chapters/[id]/choices)', async () => {
    const res = await fetch(`${BASE_URL}/api/chapters/${ctx.publishedChapterA.id}/choices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ctx.normalUserCookie,
      },
      body: JSON.stringify({
        choiceText: 'Ngã rẽ spam trái phép',
      }),
    });
    assert.ok(
      res.status === 401 || res.status === 403,
      `Không phải tác giả thì không được thêm choice vào chương (401/403), thực tế: ${res.status}`
    );
  });
});
