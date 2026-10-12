# Kế Hoạch Triển Khai Quản Lý Token Admin & Admin Vô Hạn Token

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm chức năng nạp token và reset token cho người dùng trên trang Admin, đồng thời cấu hình cho Admin sở hữu vô hạn token AI trên toàn hệ thống.

**Architecture:** Mở rộng module `quota.ts` và route API `generate` để nhận diện vai trò ADMIN và cấp hạn mức vô hạn; nâng cấp API `PATCH /api/admin/users` để hỗ trợ cộng dồn `aiTokensQuota` và làm mới `aiTokensUsed`; xây dựng giao diện modal cấp token trên trang `src/app/admin/users/page.tsx` và đồng bộ hiển thị biểu tượng vô hạn (∞) trên các trang giao diện.

**Tech Stack:** Next.js App Router, TypeScript, Prisma (SQLite), Tailwind CSS.

---

### Task 1: Cập nhật Quota Logic Cho Admin Vô Hạn Token

**Files:**
- Modify: `src/lib/ai/quota.ts`
- Modify: `src/app/api/ai/generate/route.ts`

**Interfaces:**
- Produces: `UserAiQuotaInfo.isUnlimited?: boolean`
- Updates: `getUserAiQuota(userId: string)`, `consumeUserAiTokens(userId: string, tokensUsed: number)`

- [ ] **Step 1: Cập nhật UserAiQuotaInfo và getUserAiQuota trong src/lib/ai/quota.ts**
  - Thêm trường `isUnlimited?: boolean` vào `UserAiQuotaInfo`.
  - Trong `getUserAiQuota`, select thêm `role: true` từ bảng `User`.
  - Nếu `user.role === 'ADMIN'`, gán `isUnlimited = true`, `quota = 999999999`, `remaining = 999999999`.

- [ ] **Step 2: Cập nhật consumeUserAiTokens trong src/lib/ai/quota.ts**
  - Select thêm `role: true` khi update `user`.
  - Nếu `updated.role === 'ADMIN'`, trả về `isUnlimited: true`, `quota: 999999999`, `remaining: 999999999`.

- [ ] **Step 3: Cập nhật src/app/api/ai/generate/route.ts**
  - Bỏ qua bước kiểm tra 429 quota exhaustion nếu `user.role === 'ADMIN'` hoặc `quotaInfo?.isUnlimited`.

---

### Task 2: Nâng Cấp API PATCH /api/admin/users Để Nạp và Reset Token

**Files:**
- Modify: `src/app/api/admin/users/route.ts`

**Interfaces:**
- Consumes: `{ userId: string, addTokens?: number, resetUsed?: boolean, aiTokensQuota?: number, role?: string, isBanned?: boolean }`
- Produces: `{ success: true, user: User }`

- [ ] **Step 1: Xử lý logic addTokens và resetUsed trong route.ts**
  - Đọc `addTokens` và `resetUsed` từ request body.
  - Xây dựng object `data`:
    - Nếu `addTokens` được truyền: `aiTokensQuota: { increment: Number(addTokens) }`.
    - Nếu `aiTokensQuota` được truyền trực tiếp (và không có addTokens): `aiTokensQuota: Number(aiTokensQuota)`.
    - Nếu `resetUsed === true`: `aiTokensUsed: 0`, `aiQuotaResetAt: new Date(Date.now() + 5 * 60 * 60 * 1000)`.
  - Ghi `AuditLog` với chi tiết hành động.

---

### Task 3: Hiển Thị Vô Hạn Token Trên UI (Studio & Profile)

**Files:**
- Modify: `src/components/studio/StudioProjectsList.tsx`
- Modify: `src/app/profile/page.tsx`

**Interfaces:**
- Hiển thị badge hoặc text "VÔ HẠN (∞)" khi `userQuota.isUnlimited` hoặc `user.role === 'ADMIN'`.

- [ ] **Step 1: Cập nhật src/components/studio/StudioProjectsList.tsx**
  - Nhận diện `userQuota.isUnlimited` hoặc quota cực lớn.
  - Hiển thị "VÔ HẠN (∞) TOKENS" và thanh tiến trình hiển thị phong cách Unlimited.

- [ ] **Step 2: Cập nhật src/app/profile/page.tsx**
  - Nếu `user.role === 'ADMIN'`, phần HẠN MỨC AI TOKENS hiển thị "VÔ HẠN (∞)" thay vì tính phần trăm hạn mức.

---

### Task 4: Xây Dựng Modal Nạp Token Trên Trang Admin Users

**Files:**
- Modify: `src/app/admin/users/page.tsx`

**Interfaces:**
- Thêm nút `+ Nạp Token` cạnh mỗi user.
- Mở modal cho phép:
  - Xem hạn mức hiện tại (`aiTokensQuota`), số đã dùng (`aiTokensUsed`).
  - Chọn nhanh số token cần cộng thêm: `+10,000`, `+50,000`, `+100,000`, `+500,000` hoặc nhập tự do.
  - Checkbox tùy chọn `Đặt lại số token đã dùng về 0 (Khôi phục toàn bộ hạn mức)`.
  - Nút lưu kích hoạt PATCH `/api/admin/users` và cập nhật state bảng.
- Hiển thị hàng người dùng có role `ADMIN` với nhãn `Vô hạn (∞)`.

- [ ] **Step 1: Tạo UI Modal nạp token và nút thao tác**
- [ ] **Step 2: Viết hàm handleAddTokens gọi API PATCH và đồng bộ state local**

---

### Task 5: Kiểm Tra Và Xác Minh Tổng Thể

- [ ] **Step 1: Kiểm tra build TypeScript (`npx tsc --noEmit`)**
- [ ] **Step 2: Kiểm tra chức năng nạp token và logic vô hạn token của Admin**
