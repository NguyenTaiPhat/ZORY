# Thiết Kế Quản Lý Token Admin & Admin Vô Hạn Token

## 1. Mục tiêu
- Cho phép quản trị viên (Admin) cấp thêm token AI (`aiTokensQuota`) và tùy chọn đặt lại số token đã dùng (`aiTokensUsed = 0`) cho người dùng trên giao diện Admin Users.
- Cấp quyền vô hạn token AI cho tài khoản có vai trò `ADMIN` trên toàn hệ thống (không bị giới hạn lượt dùng hoặc 429 quota exhaustion).

## 2. Thiết kế Kiến trúc & Logic

### 2.1. Admin Vô Hạn Token
- **Hệ thống Quota (`src/lib/ai/quota.ts`)**:
  - `getUserAiQuota(userId)`: Lấy thông tin user kèm `role`. Nếu `user.role === 'ADMIN'`, trả về `quota: 999999999`, `remaining: 999999999`, `isUnlimited: true`.
  - `consumeUserAiTokens(userId, tokensUsed)`: Vẫn ghi nhận số token đã tiêu thụ vào `aiTokensUsed` (để thống kê), nhưng nếu là `ADMIN` luôn trả về `quota: 999999999`, `remaining: 999999999`, `isUnlimited: true`.
- **API AI Generator (`src/app/api/ai/generate/route.ts`)**:
  - Bỏ qua kiểm tra quota nếu `user.role === 'ADMIN'` hoặc `quotaInfo.isUnlimited === true`.
- **Hiển thị giao diện**:
  - `src/components/studio/StudioProjectsList.tsx`: Hiển thị "VÔ HẠN (∞)" thay vì số lượng token cụ thể.
  - `src/app/profile/page.tsx`: Hiển thị "VÔ HẠN (∞)" cho định mức token của Admin, thanh tiến trình 100%.
  - `src/app/admin/users/page.tsx`: Cột AI TOKENS của tài khoản ADMIN hiển thị "Vô hạn (∞)".

### 2.2. Thao Tác Cấp Thêm Token Cho Người Dùng Trong Admin Page
- **Backend API (`src/app/api/admin/users/route.ts`)**:
  - Hỗ trợ thêm các trường trong payload PATCH:
    - `addTokens?: number`: Số token cộng dồn vào `aiTokensQuota` hiện tại (`aiTokensQuota: { increment: addTokens }`).
    - `resetUsed?: boolean`: Nếu `true`, cập nhật `aiTokensUsed = 0` và gia hạn mốc `aiQuotaResetAt`.
    - `aiTokensQuota?: number`: Thiết lập trực tiếp định mức quota mới.
  - Ghi AuditLog chi tiết hành động nạp token.
- **Frontend Admin Users (`src/app/admin/users/page.tsx`)**:
  - Thêm nút "+ TOKEN" trong bảng người dùng.
  - Modal hoặc popup điều khiển:
    - Hiển thị thông tin người dùng được chọn: Tên, Email, Quota hiện tại, Đã dùng.
    - Lựa chọn thêm nhanh: `+10,000`, `+50,000`, `+100,000`, `+500,000` hoặc nhập số tùy chọn.
    - Checkbox: "Đặt lại lượt đã dùng về 0 (Khôi phục toàn bộ hạn mức ngay)".
    - Nút "Cập Nhật": Gửi yêu cầu PATCH lên `/api/admin/users`, cập nhật state tức thì và thông báo thành công.

## 3. Kế hoạch kiểm thử & xác minh
- Kiểm tra PATCH `/api/admin/users` tăng `aiTokensQuota` và reset `aiTokensUsed`.
- Kiểm tra tài khoản ADMIN gọi `getUserAiQuota` trả về hạn mức vô hạn.
- Kiểm tra giao diện hiển thị chính xác cho cả USER thông thường và ADMIN.
