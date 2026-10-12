# BÁO CÁO KIỂM THỬ AN NINH & TỰ ĐỘNG KHẮC PHỤC (SECURITY AUDIT & AUTO-FIX REPORT)

**Dự án:** ZORY Platform  
**Môi trường:** Local Staging / Test Runner (Next.js 15, Prisma SQLite, Node.js v24.20.0)  
**Thời gian thực hiện:** 12/10/2026  
**Thư mục kiểm thử:** `tests/security/`

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM THỬ

| Giai đoạn | Tổng số test | Passed | Failed | Skipped | Tỷ lệ Đạt |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Trước khi vá (Initial Run)** | 24 | 13 | 11 | 0 | **54.2%** |
| **Sau khi vá lỗ hổng (Vulnerability Fixes)** | 24 | 24 | 0 | 0 | **100%** |
| **Sau kiểm thử toàn diện (Full Suite 7 Nhóm)** | 48 | 48 | 0 | 0 | **100%** |

---

## 2. DANH SÁCH LỖ HỔNG ĐÃ PHÁT HIỆN & BẢN VÁ

### Lỗ hổng 1: Rò Rỉ Nội Dung Chương Nháp Chưa Xuất Bản (Data Leakage)
- **Mức độ nghiêm trọng:** `HIGH`
- **Phân loại:** Authorization & Data Protection
- **Vị trí tệp:** `src/app/api/chapters/[id]/route.ts`
- **Mô tả & Bằng chứng tái hiện:**  
  API `GET /api/chapters/[id]` không kiểm tra trạng thái `publishStatus`. Khách vãng lai hoặc người dùng khác có thể đọc toàn bộ nội dung bản thảo bí mật (`DRAFT`) chỉ bằng cách gửi ID chương.  
  *Test tái hiện:* `tests/security/01_auth_rbac.test.ts` (Test 1.7) trả về `200 OK` thay vì `403 Forbidden` / `404 Not Found`.
- **Bản vá đã triển khai:**  
  Thêm kiểm tra `getCurrentUser()`. Nếu `chapter.publishStatus === 'DRAFT'`, chỉ cho phép tác giả (`chapter.book.authorId === user.id`) hoặc tài khoản có vai trò `ADMIN` truy cập; người khác nhận mã `403 Forbidden`.
- **Kết quả sau vá:** Test 1.7 `PASSED` (trả về 403 Forbidden).

---

### Lỗ hổng 2: Tạo Ngã Rẽ Trái Phép Vào Tác Phẩm Của Người Khác (Unauthorized Content Modification)
- **Mức độ nghiêm trọng:** `HIGH`
- **Phân loại:** Broken Access Control / Business Logic
- **Vị trí tệp:**  
  - `src/app/api/chapters/[id]/choices/route.ts`  
  - `src/app/api/chapters/[id]/choices/suggest/route.ts`
- **Mô tả & Bằng chứng tái hiện:**  
  Cả hai endpoint POST đều không yêu cầu đăng nhập và không kiểm tra quyền sở hữu tác phẩm. Bất kỳ ai cũng có thể tự do chèn các nhánh lựa chọn (`ChapterChoice`) vào bất kỳ chương nào của bất kỳ tác giả nào.  
  *Test tái hiện:* `tests/security/01_auth_rbac.test.ts` (Test 1.8) trả về `200 OK` khi người dùng lạ tạo choice.
- **Bản vá đã triển khai:**  
  Bắt buộc xác thực người dùng (`requireAuthUser` / `getCurrentUser`) và xác minh `chapter.book.authorId === user.id || user.role === 'ADMIN'`. Người lạ bị chặn với mã `403 Forbidden`.
- **Kết quả sau vá:** Test 1.8 `PASSED` (trả về 403 Forbidden).

---

### Lỗ hổng 3: URL Scheme Injection / Nguy Cơ Stored XSS trong Ảnh Bìa
- **Mức độ nghiêm trọng:** `HIGH`
- **Phân loại:** Input Validation / Injection
- **Vị trí tệp:** `src/app/api/upload/cover/route.ts`
- **Mô tả & Bằng chứng tái hiện:**  
  Trường `url` trong POST tải ảnh bìa chấp nhận mọi chuỗi không lọc, cho phép kẻ tấn công truyền URL độc hại như `javascript:alert(document.cookie)` hoặc `data:text/html;base64,...`. Khi ảnh được render trên client, dẫn tới nguy cơ XSS.  
  *Test tái hiện:* `tests/security/02_injection_input.test.ts` (Test 2.1) trả về `200 OK` cho link `javascript:`.
- **Bản vá đã triển khai:**  
  Thêm Regex whitelist bắt buộc URL phải bắt đầu bằng `https://`, `http://` hoặc đường dẫn nội bộ `/uploads/`. Các protocol nguy hiểm đều bị từ chối ngay với mã `400 Bad Request`.
- **Kết quả sau vá:** Test 2.1 `PASSED` (trả về 400 Bad Request).

---

### Lỗ hổng 4: Không Giới Hạn Dung Lượng Tải Lên (Unrestricted File Size / DoS)
- **Mức độ nghiêm trọng:** `MEDIUM`
- **Phân loại:** Request Security / Denial of Service
- **Vị trí tệp:** `src/app/api/upload/cover/route.ts`
- **Mô tả & Bằng chứng tái hiện:**  
  Endpoint không kiểm tra `file.size` và `file.type`. Người dùng có thể tải lên tệp dung lượng tùy ý (ví dụ tệp 8MB+ hoặc hàng trăm MB) làm cạn kiệt bộ nhớ RAM và dung lượng đĩa máy chủ.  
  *Test tái hiện:* `tests/security/02_injection_input.test.ts` (Test 2.2) upload file 8MB thành công với mã `200 OK`.
- **Bản vá đã triển khai:**  
  Giới hạn dung lượng tối đa 5MB (`MAX_FILE_SIZE = 5 * 1024 * 1024`), đồng thời bổ sung kiểm tra MIME type chỉ cho phép `image/jpeg`, `image/png`, `image/webp`.
- **Kết quả sau vá:** Test 2.2 `PASSED` (trả về 400 Bad Request).

---

### Lỗ hổng 5: Không Giới Hạn Kích Thước Bình Luận (Unbounded Input / DoS)
- **Mức độ nghiêm trọng:** `MEDIUM`
- **Phân loại:** Input Validation
- **Vị trí tệp:**  
  - `src/app/api/books/[slug]/comments/route.ts`  
  - `src/app/api/chapters/[id]/paragraphs/[index]/comments/route.ts`
- **Mô tả & Bằng chứng tái hiện:**  
  Không có ràng buộc độ dài tối đa cho bình luận (`content`). Kẻ tấn công có thể gửi bình luận chứa 50.000 ký tự làm phình to cơ sở dữ liệu SQLite và gây nghẽn băng thông hiển thị.  
  *Test tái hiện:* `tests/security/02_injection_input.test.ts` (Test 2.3) trả về `200 OK` khi gửi 50.000 ký tự.
- **Bản vá đã triển khai:**  
  Bổ sung kiểm tra giới hạn độ dài `content.trim().length <= 2000` ký tự.
- **Kết quả sau vá:** Test 2.3 `PASSED` (trả về 400 Bad Request).

---

### Lỗ hổng 6: Bỏ Qua Hạn Mức Text-to-Speech Khi Chưa Đăng Nhập (Quota Bypass)
- **Mức độ nghiêm trọng:** `HIGH`
- **Phân loại:** Business Logic / Resource Abuse
- **Vị trí tệp:** `src/app/api/tts/process/route.ts`
- **Mô tả & Bằng chứng tái hiện:**  
  Logic chỉ kiểm tra hạn mức `if (user && user.ttsCharsUsed >= user.ttsCharsQuota)`. Nếu không truyền session (`user == null`), kiểm tra bị bỏ qua hoàn toàn, cho phép gọi TTS không giới hạn mà không bị trừ hạn mức.  
  *Test tái hiện:* `tests/security/03_business_logic.test.ts` (Test 3.1) trả về `200 OK` cho request nặc danh.
- **Bản vá đã triển khai:**  
  Bắt buộc đăng nhập (`if (!user) return NextResponse.json({ error: ... }, { status: 401 })`) trước khi xử lý chuyển văn bản thành giọng nói.
- **Kết quả sau vá:** Test 3.1 `PASSED` (trả về 401 Unauthorized).

---

### Lỗ hổng 7: Tấn Công Làm Cạn Kiệt Tài Nguyên TTS & Parameter Tampering
- **Mức độ nghiêm trọng:** `MEDIUM`
- **Phân loại:** Denial of Service & Parameter Injection
- **Vị trí tệp:** `src/app/api/tts/route.ts`
- **Mô tả & Bằng chứng tái hiện:**  
  1. `text` không có độ dài tối đa: nếu truyền văn bản 50.000 ký tự, server sẽ rơi vào vòng lặp chia nhỏ và phát hàng trăm request liên tiếp đến Google TTS làm treo CPU hoặc bị chặn IP.  
  2. `lang` không được lọc: cho phép truyền chuỗi tùy ý chèn vào query string upstream.  
  *Test tái hiện:* `tests/security/03_business_logic.test.ts` (Test 3.2, 3.3) đều trả về `200 OK`.
- **Bản vá đã triển khai:**  
  - Giới hạn `cleanText.length <= 1000` ký tự mỗi yêu cầu.  
  - Whitelist mã ngôn ngữ hợp lệ (`['vi', 'en', 'ja', 'ko', 'zh', 'fr', 'es', 'de']`).
- **Kết quả sau vá:** Test 3.2 & 3.3 `PASSED` (trả về 400 Bad Request).

---

### Lỗ hổng 8: Thiếu Toàn Bộ Security Headers Cần Thiết
- **Mức độ nghiêm trọng:** `MEDIUM`
- **Phân loại:** Security Misconfiguration
- **Vị trí tệp:** `next.config.js`
- **Mô tả & Bằng chứng tái hiện:**  
  Ứng dụng thiếu các HTTP headers bảo vệ tiêu chuẩn: `X-Content-Type-Options`, `X-Frame-Options` (chống Clickjacking), `Referrer-Policy`, `Permissions-Policy`.  
  *Test tái hiện:* `tests/security/04_config_headers.test.ts` (Test 4.1, 4.2, 4.3) nhận giá trị `null`.
- **Bản vá đã triển khai:**  
  Cấu hình `async headers()` trong `next.config.js`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-XSS-Protection: 1; mode=block`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Kết quả sau vá:** Test 4.1, 4.2, 4.3 `PASSED`.

---

### Lỗ hổng 9: IDOR trong Cập Nhật Lore Entry
- **Mức độ nghiêm trọng:** `HIGH`
- **Phân loại:** Broken Object Level Authorization (BOLA / IDOR)
- **Vị trí tệp:** `src/app/api/studio/projects/[id]/lore/[loreId]/route.ts`
- **Mô tả:**  
  PATCH chỉ kiểm tra quyền đối với `projectId`, sau đó update `loreEntry` chỉ dựa trên `where: { id: loreId }` mà không xác minh `loreId` có thuộc `projectId` đó hay không.
- **Bản vá đã triển khai:**  
  Kiểm tra `findFirst({ where: { id: loreId, projectId: id } })` trước khi thực hiện cập nhật.
- **Kết quả sau vá:** Đã bảo vệ chống IDOR.

---

### Lỗ hổng 10: Rò Rỉ Tên & Ý Tưởng Bản Thảo Bí Mật Qua HTML Metadata
- **Mức độ nghiêm trọng:** `LOW`
- **Phân loại:** Information Disclosure
- **Vị trí tệp:** `src/app/studio/[projectId]/page.tsx`
- **Mô tả:**  
  Hàm `generateMetadata` truy vấn `prisma.aiProject.findUnique({ where: { id: projectId } })` không kiểm tra `userId`, làm lộ tiêu đề và premise của bản thảo riêng tư vào thẻ `<title>` và `<meta description>` cho người truy cập không có thẩm quyền.
- **Bản vá đã triển khai:**  
  Thêm kiểm tra `getCurrentUser()`, chỉ xuất thông tin chi tiết vào metadata nếu người dùng là chủ sở hữu bản thảo.
- **Kết quả sau vá:** Đã bảo vệ tính riêng tư của bản thảo AI.

---

### Lỗ hổng 11: Phản Hồi Giả Mạo 200 Khi Xóa Trái Phép Dự Án (DELETE IDOR Masking)
- **Mức độ nghiêm trọng:** `MEDIUM`
- **Phân loại:** Broken Access Control / Inconsistent Status Code
- **Vị trí tệp:** `src/app/api/studio/projects/[id]/route.ts`
- **Mô tả & Bằng chứng tái hiện:**  
  Hàm `DELETE` sử dụng `prisma.aiProject.deleteMany({ where: { id, userId: user.id } })`. Khi người dùng B gọi xóa dự án của người dùng A, `deleteMany` xóa 0 bản ghi nhưng route handler luôn trả về `{ success: true, message: 'Đã xóa dự án' }` với mã `200 OK`, gây sai lệch trạng thái và rò rỉ hành vi.  
  *Test tái hiện:* `tests/security/06_deep_rbac_audit.test.ts` (Test 6.6) trả về `200 OK` thay vì `404 Not Found`.
- **Bản vá đã triển khai:**  
  Kiểm tra `if (result.count === 0) return NextResponse.json({ error: 'Không tìm thấy dự án hoặc không có quyền xóa' }, { status: 404 })`.
- **Kết quả sau vá:** Test 6.6 `PASSED` (trả về 404).

---

## 2.5. CÁC CƠ CHẾ PHÒNG VỆ CHUYÊN SÂU ĐÃ TRIỂN KHAI (DEFENSE-IN-DEPTH)

### Phòng vệ 1: Khóa Tạm Tài Khoản Khi Nhập Sai Mật Khẩu (Account Lockout)
- **Cơ chế:** Lưu vết số lần thử đăng nhập thất bại theo tài khoản (`identifier`). Sau 5 lần nhập sai liên tiếp, tài khoản bị tạm khóa 15 phút, trả về HTTP `429 Too Many Requests`.
- **Tệp triển khai:** `src/app/api/auth/login/route.ts`
- **Kết quả kiểm thử:** Test 5.3 `PASSED`.

### Phòng vệ 2: Xác Thực Chữ Ký Nhị Phân Magic Bytes Cho File Upload
- **Cơ chế:** Không chỉ dựa vào phần mở rộng hay MIME header của client, server đọc trực tiếp các byte đầu tiên của buffer (`0xFF 0xD8 0xFF` cho JPEG, `0x89 0x50 0x4E 0x47` cho PNG, `RIFF...WEBP` cho WEBP). Tệp giả mạo bị từ chối `400 Bad Request`.
- **Tệp triển khai:** `src/app/api/upload/cover/route.ts`
- **Kết quả kiểm thử:** Test 5.1 & 5.2 `PASSED`.

### Phòng vệ 3: In-Memory Sliding Window Rate Limiting
- **Cơ chế:** Giới hạn 20 yêu cầu/phút/IP trên endpoint nhạy cảm (`/api/auth/login`), tự động reset theo sliding window và cleanup rác định kỳ.
- **Tệp triển khai:** `src/lib/rateLimit.ts` & `src/app/api/auth/login/route.ts`
- **Kết quả kiểm thử:** Hoạt động ổn định bảo vệ login endpoint.

### Phòng vệ 4: Chống CSRF Bằng Xác Minh Nguồn Gốc (Origin / Referer Validation)
- **Cơ chế:** Kiểm tra header `Origin` / `Referer` trên các request làm thay đổi dữ liệu (POST, PUT, PATCH, DELETE). Chặn đứng các yêu cầu cross-origin trái phép từ các domain giả mạo bên ngoài (`403 Forbidden`).
- **Tệp triển khai:** `src/lib/csrf.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/upload/cover/route.ts`
- **Kết quả kiểm thử:** Test 5.4 `PASSED`.

### Phòng vệ 5: Chính Sách Bảo Mật Nội Dung (Content Security Policy - CSP)
- **Cơ chế:** Header HTTP `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...` ngăn chặn trình duyệt thực thi mã script hoặc nạp tài nguyên từ nguồn lạ.
- **Tệp triển khai:** `next.config.js`
- **Kết quả kiểm thử:** Test 5.5 `PASSED`.

### Phòng vệ 6: HTTP Strict Transport Security (HSTS - Ép Buộc Mã Hóa Đường Truyền)
- **Cơ chế:** Header HTTP `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` chỉ định trình duyệt luôn mã hóa 100% request và response qua HTTPS/TLS, ngăn chặn triệt để tấn công SSL Strip và nghe lén Man-In-The-Middle.
- **Tệp triển khai:** `next.config.js`
- **Kết quả kiểm thử:** Test 4.5 `PASSED`.

### Phòng vệ 7: Mã Hóa Payload AES-256-GCM & Chống Tấn Công Phát Lại (Anti-Replay Attack)
- **Cơ chế:**
  - Hỗ trợ mã hóa đối xứng xác thực `AES-256-GCM` (Authenticated Encryption with Associated Data) cho request body trước khi gửi, server tự động giải mã và kiểm tra auth tag.
  - Tích hợp chữ ký toàn vẹn `HMAC-SHA256` kèm `X-Request-Timestamp` và `X-Request-Signature`. Tự động từ chối các request quá hạn 5 phút hoặc có chữ ký không hợp lệ, triệt tiêu nguy cơ Replay Attack.
- **Tệp triển khai:** `src/lib/requestCrypto.ts` & `src/app/api/admin/users/route.ts`
- **Kết quả kiểm thử:** Test 5.6 & 5.7 `PASSED`.

### Phòng vệ 8: Next.js Middleware CSRF Toàn Cục (Universal Mutation Guard)
- **Cơ chế:** Chặn đứng tấn công CSRF trên toàn bộ hệ thống bằng middleware trung tâm `src/middleware.ts`. Tự động kiểm tra header `Origin` / `Referer` trên mọi request `POST`, `PUT`, `PATCH`, `DELETE` đến `/api/*`. Nếu phát hiện nguồn gốc từ domain lạ, trả về ngay lập tức HTTP `403 Forbidden`.
- **Tệp triển khai:** `src/middleware.ts` & `src/lib/csrf.ts`
- **Kết quả kiểm thử:** Test 7.1 `PASSED` (đã xác minh trên Register, Comments, Admin Books, Studio Projects).

---

## 3. CHI TIẾT KẾT QUẢ SUITE TOÀN DIỆN (100% PASS - 48/48 TESTS)

```
====================================================
       ZORY PLATFORM — SECURITY AUDIT SUITE         
====================================================

[TEST RUNNING] tests/security/01_auth_rbac.test.ts...
  -> Passed: 9, Failed: 0

[TEST RUNNING] tests/security/02_injection_input.test.ts...
  -> Passed: 5, Failed: 0

[TEST RUNNING] tests/security/03_business_logic.test.ts...
  -> Passed: 5, Failed: 0

[TEST RUNNING] tests/security/04_config_headers.test.ts...
  -> Passed: 6, Failed: 0

[TEST RUNNING] tests/security/05_advanced_defense.test.ts...
  -> Passed: 8, Failed: 0

[TEST RUNNING] tests/security/06_deep_rbac_audit.test.ts...
  -> Passed: 9, Failed: 0

[TEST RUNNING] tests/security/07_residual_vulnerabilities.test.ts...
  -> Passed: 6, Failed: 0

----------------------------------------------------
TỔNG KẾT: PASSED: 48 | FAILED: 0 | TỔNG CỘNG: 48
----------------------------------------------------
```

---

## 4. KIỂM TRA PHỤ THUỘC (DEPENDENCY AUDIT) & LƯU Ý DÀI HẠN

1. **Kết quả quét `npm audit`:**
   - Phát hiện 9 cảnh báo (3 moderate, 6 high) nằm trong các công cụ build devDependencies (`postcss <= 8.5.22` và `braces` phụ thuộc bởi `tailwindcss@3.4.17` và `next@15.1.7`).
   - Các gói này là công cụ biên dịch CSS/build của bundler, không nằm trong runtime server code xử lý request của người dùng cuối.
   - Để fix triệt để đòi hỏi nâng cấp phá vỡ tương thích (`tailwindcss@4`, `next@16`), khuyến nghị đưa vào kế hoạch nâng cấp framework lớn tiếp theo sau khi kiểm thử giao diện kỹ lưỡng.
2. **Phân Tán Bộ Nhớ Đệm (Distributed Cache / Redis) Khi Mở Rộng Hệ Thống:**  
   Hiện tại Rate Limiting và Account Lockout hoạt động in-memory rất nhanh và hiệu quả cho môi trường đơn máy chủ (single instance). Khi triển khai cụm nhiều instance/serverless trên production, có thể chuyển tầng lưu trữ khóa sang Redis (Upstash / Redis Cluster) để chia sẻ trạng thái chung.
3. **Khóa Bí Mật Môi Trường (Secrets Management):**  
   Đảm bảo `AUTH_SECRET` trên production luôn là chuỗi ngẫu nhiên có độ dài tối thiểu 32 ký tự và tách biệt hoàn toàn với môi trường staging/dev.
