import { describe, it } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, BASE_URL, TestContext } from './setup-env';

describe('Group 6: Deep RBAC & Sensitive Data Isolation Audit', () => {
  let ctx: TestContext;

  it('Setup: Khởi tạo dữ liệu người dùng kiểm thử RBAC', async () => {
    ctx = await setupTestEnvironment();
  });

  // 6.1 /api/admin/users
  it('6.1. RBAC: /api/admin/users chặn Guest & Normal User, chỉ cho phép Admin', async () => {
    // 1. Guest
    const guestGet = await fetch(`${BASE_URL}/api/admin/users`);
    assert.strictEqual(guestGet.status, 403, `Guest GET /api/admin/users phải trả về 403, thực tế: ${guestGet.status}`);

    const guestPatch = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: ctx.authorA.id, addTokens: 100 }),
    });
    assert.strictEqual(guestPatch.status, 403, `Guest PATCH /api/admin/users phải trả về 403, thực tế: ${guestPatch.status}`);

    // 2. Normal User
    const userGet = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: ctx.normalUserCookie },
    });
    assert.strictEqual(userGet.status, 403, `User GET /api/admin/users phải trả về 403, thực tế: ${userGet.status}`);

    const userPatch = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ctx.normalUserCookie,
      },
      body: JSON.stringify({ userId: ctx.authorA.id, addTokens: 100 }),
    });
    assert.strictEqual(userPatch.status, 403, `User PATCH /api/admin/users phải trả về 403, thực tế: ${userPatch.status}`);

    // 3. Admin
    const adminGet = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: ctx.adminCookie },
    });
    assert.strictEqual(adminGet.status, 200, `Admin GET /api/admin/users phải trả về 200, thực tế: ${adminGet.status}`);
  });

  // 6.2 /api/admin/books
  it('6.2. RBAC: /api/admin/books chặn Guest & Normal User, chỉ cho phép Admin', async () => {
    // 1. Guest
    const guestGet = await fetch(`${BASE_URL}/api/admin/books`);
    assert.strictEqual(guestGet.status, 403, `Guest GET /api/admin/books phải trả về 403, thực tế: ${guestGet.status}`);

    const guestPatch = await fetch(`${BASE_URL}/api/admin/books`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: ctx.bookA.id, isFeatured: true }),
    });
    assert.strictEqual(guestPatch.status, 403, `Guest PATCH /api/admin/books phải trả về 403, thực tế: ${guestPatch.status}`);

    // 2. Normal User
    const userGet = await fetch(`${BASE_URL}/api/admin/books`, {
      headers: { Cookie: ctx.normalUserCookie },
    });
    assert.strictEqual(userGet.status, 403, `User GET /api/admin/books phải trả về 403, thực tế: ${userGet.status}`);

    const userPatch = await fetch(`${BASE_URL}/api/admin/books`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ctx.normalUserCookie,
      },
      body: JSON.stringify({ bookId: ctx.bookA.id, isFeatured: true }),
    });
    assert.strictEqual(userPatch.status, 403, `User PATCH /api/admin/books phải trả về 403, thực tế: ${userPatch.status}`);

    // 3. Admin
    const adminGet = await fetch(`${BASE_URL}/api/admin/books`, {
      headers: { Cookie: ctx.adminCookie },
    });
    assert.strictEqual(adminGet.status, 200, `Admin GET /api/admin/books phải trả về 200, thực tế: ${adminGet.status}`);
  });

  // 6.3 /api/admin/keys
  it('6.3. RBAC: /api/admin/keys (Quản lý AI Key) chặn Guest & Normal User', async () => {
    // 1. Guest
    const guestGet = await fetch(`${BASE_URL}/api/admin/keys`);
    assert.strictEqual(guestGet.status, 403, `Guest GET /api/admin/keys phải trả về 403, thực tế: ${guestGet.status}`);

    // 2. Normal User
    const userGet = await fetch(`${BASE_URL}/api/admin/keys`, {
      headers: { Cookie: ctx.normalUserCookie },
    });
    assert.strictEqual(userGet.status, 403, `User GET /api/admin/keys phải trả về 403, thực tế: ${userGet.status}`);

    // 3. Admin
    const adminGet = await fetch(`${BASE_URL}/api/admin/keys`, {
      headers: { Cookie: ctx.adminCookie },
    });
    assert.strictEqual(adminGet.status, 200, `Admin GET /api/admin/keys phải trả về 200, thực tế: ${adminGet.status}`);
  });

  // 6.4 /api/admin/stats
  it('6.4. RBAC: /api/admin/stats (Thống kê hệ thống) chặn Guest & Normal User', async () => {
    // 1. Guest
    const guestGet = await fetch(`${BASE_URL}/api/admin/stats`);
    assert.strictEqual(guestGet.status, 403, `Guest GET /api/admin/stats phải trả về 403, thực tế: ${guestGet.status}`);

    // 2. Normal User
    const userGet = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: ctx.normalUserCookie },
    });
    assert.strictEqual(userGet.status, 403, `User GET /api/admin/stats phải trả về 403, thực tế: ${userGet.status}`);

    // 3. Admin
    const adminGet = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: ctx.adminCookie },
    });
    assert.strictEqual(adminGet.status, 200, `Admin GET /api/admin/stats phải trả về 200, thực tế: ${adminGet.status}`);
  });

  // 6.5 Cô lập dữ liệu dự án riêng tư (/api/studio/projects)
  it('6.5. Data Isolation: Người dùng B không thể nhìn thấy danh sách dự án của Người dùng A', async () => {
    // 1. Guest
    const guestRes = await fetch(`${BASE_URL}/api/studio/projects`);
    assert.strictEqual(guestRes.status, 401, `Guest truy cập studio phải trả về 401, thực tế: ${guestRes.status}`);

    // 2. Author B truy vấn dự án
    const authorBRes = await fetch(`${BASE_URL}/api/studio/projects`, {
      headers: { Cookie: ctx.authorBCookie },
    });
    assert.strictEqual(authorBRes.status, 200);
    const data = await authorBRes.json();
    const projectIds = (data.projects || []).map((p: any) => p.id);
    assert.strictEqual(
      projectIds.includes(ctx.projectA.id),
      false,
      'Danh sách dự án của Author B không được chứa project của Author A'
    );
  });

  // 6.6 Chống IDOR truy cập & sửa đổi dự án của người khác (/api/studio/projects/[id])
  it('6.6. IDOR: Người dùng B không thể đọc, sửa hoặc xóa dự án của Người dùng A', async () => {
    // 1. Đọc trái phép
    const getRes = await fetch(`${BASE_URL}/api/studio/projects/${ctx.projectA.id}`, {
      headers: { Cookie: ctx.authorBCookie },
    });
    assert.ok(
      [403, 404].includes(getRes.status),
      `Truy cập trái phép dự án phải trả về 403/404, thực tế: ${getRes.status}`
    );

    // 2. Sửa đổi trái phép
    const patchRes = await fetch(`${BASE_URL}/api/studio/projects/${ctx.projectA.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ctx.authorBCookie,
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    assert.ok(
      [403, 404].includes(patchRes.status),
      `Sửa đổi trái phép dự án phải trả về 403/404, thực tế: ${patchRes.status}`
    );

    // 3. Xóa trái phép
    const deleteRes = await fetch(`${BASE_URL}/api/studio/projects/${ctx.projectA.id}`, {
      method: 'DELETE',
      headers: { Cookie: ctx.authorBCookie },
    });
    assert.ok(
      [403, 404].includes(deleteRes.status),
      `Xóa trái phép dự án phải trả về 403/404, thực tế: ${deleteRes.status}`
    );
  });

  // 6.7 Bảo vệ bí mật cốt truyện / Lore Entry (/api/studio/projects/[id]/lore)
  it('6.7. Lore Protection: Người dùng B không thể đọc hoặc thêm lore vào dự án của Người dùng A', async () => {
    const res = await fetch(`${BASE_URL}/api/studio/projects/${ctx.projectA.id}/lore`, {
      headers: { Cookie: ctx.authorBCookie },
    });
    assert.ok(
      [403, 404].includes(res.status),
      `Truy cập lore của tác giả khác phải bị từ chối 403/404, thực tế: ${res.status}`
    );
  });

  // 6.8 Bảo vệ chương nháp DRAFT (/api/chapters/[id])
  it('6.8. Draft Protection: Chỉ Tác giả sở hữu và Admin mới xem được chương DRAFT', async () => {
    // 1. Guest -> 403
    const guestRes = await fetch(`${BASE_URL}/api/chapters/${ctx.draftChapterA.id}`);
    assert.strictEqual(guestRes.status, 403, `Guest đọc chương draft phải trả về 403, thực tế: ${guestRes.status}`);

    // 2. Author B (người khác) -> 403
    const authorBRes = await fetch(`${BASE_URL}/api/chapters/${ctx.draftChapterA.id}`, {
      headers: { Cookie: ctx.authorBCookie },
    });
    assert.strictEqual(authorBRes.status, 403, `Người khác đọc chương draft phải trả về 403, thực tế: ${authorBRes.status}`);

    // 3. Author A (tác giả) -> 200
    const authorARes = await fetch(`${BASE_URL}/api/chapters/${ctx.draftChapterA.id}`, {
      headers: { Cookie: ctx.authorACookie },
    });
    assert.strictEqual(authorARes.status, 200, `Tác giả chính chủ phải đọc được chương draft 200, thực tế: ${authorARes.status}`);

    // 4. Admin -> 200
    const adminRes = await fetch(`${BASE_URL}/api/chapters/${ctx.draftChapterA.id}`, {
      headers: { Cookie: ctx.adminCookie },
    });
    assert.strictEqual(adminRes.status, 200, `Admin phải đọc được chương draft 200, thực tế: ${adminRes.status}`);
  });
});
