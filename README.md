# ZORY — Stories Beyond Imagination
> Nền tảng đọc truyện trực tuyến, sáng tác văn học với AI Studio và nghe đọc truyện thông minh (Text-to-Speech).

---

## 1. Giới thiệu dự án

**ZORY** là một hệ sinh thái văn học trực tuyến toàn diện được thiết kế theo phong cách hiện đại **Midnight Literary**, tích hợp các công nghệ:
- **Đọc truyện chuyên sâu (ZORY Reader):** Tùy chỉnh màu nền (Light, Sepia, Dark), cỡ chữ, kiểu phông (Serif Literata / Sans), khổ trang, tự động lưu tiến độ đọc theo thời gian thực.
- **Sáng tác với AI Studio (ZORY AI):** Quản lý World Bible, hồ sơ nhân vật, dàn ý câu chuyện (Story Outline), trợ lý AI viết tiếp, trau chuốt câu từ và tóm tắt chương.
- **Sách nói & Audio (ZORY Voice):** Tích hợp Web Speech API và TTS Provider adapters, cho phép nghe truyện rảnh tay, tùy chỉnh tốc độ, hẹn giờ ngủ và chuyển chương linh hoạt.
- **Quản trị hệ thống (Admin Dashboard):** Quản lý tác phẩm, duyệt xuất bản, quản lý người dùng, phân quyền, kiểm soát hạn mức AI/TTS và theo dõi nhật ký thao tác (Audit Logs).

---

## 2. Công nghệ sử dụng

- **Frontend & Backend:** Next.js 15 (App Router), TypeScript Strict Mode, React 19.
- **Styling & UI:** Tailwind CSS, Lucide React Icons, bảng màu Midnight Literary tùy biến cao cấp.
- **Cơ sở dữ liệu & ORM:** Prisma ORM, mặc định SQLite (`dev.db`) cho môi trường phát triển cục bộ không phụ thuộc dịch vụ ngoài; hỗ trợ sẵn sàng chuyển đổi PostgreSQL (`prisma/schema.postgresql.prisma`).
- **Xác thực:** JWT phiên bản bảo mật cao qua thư viện `jose`, mã hóa mật khẩu `bcryptjs`, cookie `httpOnly`.
- **Validation:** Zod schemas.

---

## 3. Khởi động nhanh trên Windows

Dự án cung cấp sẵn tệp kịch bản `start.bat`:
1. Nhấp đúp chuột vào `start.bat` trong thư mục gốc dự án.
2. Script sẽ tự động kiểm tra phiên bản Node.js, khởi tạo `.env`, cài đặt thư viện và seed dữ liệu mẫu nếu chưa có.
3. Truy cập trình duyệt tại: **http://localhost:3000**

---

## 4. Cài đặt thủ công

### Bước 1: Yêu cầu môi trường
- **Node.js:** Phiên bản `>= 18.18.0` (khuyên dùng Node.js 20 hoặc 22 LTS).
- **npm:** Phiên bản `>= 9.0.0`.

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình biến môi trường
Sao chép `.env.example` thành `.env`:
```bash
cp .env.example .env
```
Nội dung tệp `.env` mẫu:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="zory-super-secret-jwt-key-minimum-32-chars-long-2025"
APP_URL="http://localhost:3000"

# AI Provider Adapter (mock | gemini | openai | groq)
AI_PROVIDER="mock"
AI_API_KEY=""
AI_BASE_URL=""
AI_MODEL="gemini-1.5-flash"

# TTS Provider Adapter (web-speech | edge | google | azure | mock)
TTS_PROVIDER="web-speech"
TTS_API_KEY=""
TTS_REGION=""
TTS_VOICE="vi-VN-HoaiMyNeural"
```

### Bước 4: Đồng bộ cơ sở dữ liệu & Seed dữ liệu mẫu
```bash
# Đồng bộ cấu trúc bảng vào database
npm run db:push

# Nạp dữ liệu mẫu chất lượng cao (15 thể loại, 4 truyện, tài khoản demo)
npm run db:seed
```

### Bước 5: Khởi động Development Server
```bash
npm run dev
```
Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

## 5. Tài khoản demo có sẵn

Sau khi chạy seed, hệ thống đã chuẩn bị sẵn 3 tài khoản demo:

| Vai trò | Email đăng nhập | Mật khẩu | Chức năng nổi bật |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin@zory.vn` | `admin123` | Toàn quyền kiểm duyệt tác phẩm, quản lý thành viên, kiểm tra quota tại `/admin` |
| **Tác giả (AUTHOR)** | `author@zory.vn` | `author123` | Truy cập đầy đủ ZORY AI Studio, tạo dự án và chỉnh sửa World Bible tại `/studio` |
| **Độc giả (USER)** | `reader@zory.vn` | `reader123` | Đọc truyện, nghe audio, lưu tủ sách `/library`, gửi đánh giá và bình luận |

---

## 6. Hướng dẫn cấu hình dịch vụ ngoài

### 6.1. AI Provider Adapter (Gemini / OpenAI / Groq)
Hệ thống tích hợp sẵn kiến trúc đa nhà cung cấp trong `src/lib/ai/adapter.ts`:
- **Chế độ mặc định (`mock`):** Khi chưa có API key, hệ thống tự động kích hoạt bộ sinh nội dung văn học tiếng Việt chân thực để trải nghiệm ngay mà không gặp lỗi.
- **Google Gemini:**
  ```env
  AI_PROVIDER="gemini"
  AI_API_KEY="AIzaSy..."
  AI_MODEL="gemini-3.8-flash"
  ```
- **OpenAI:**
  ```env
  AI_PROVIDER="openai"
  AI_API_KEY="sk-..."
  AI_MODEL="gpt-4o-mini"
  ```
- **Groq:**
  ```env
  AI_PROVIDER="groq"
  AI_API_KEY="gsk_..."
  AI_BASE_URL="https://api.groq.com/openai/v1/chat/completions"
  AI_MODEL="llama-3.3-70b-versatile"
  ```

### 6.2. TTS Provider Adapter (ZORY Voice)
- **Web Speech API (`web-speech` - Mặc định):** Sử dụng trực tiếp giọng đọc tổng hợp tiếng Việt có sẵn trong trình duyệt (Chrome, Edge, Safari, Firefox), 100% miễn phí và hoạt động ngay tức thì.

---

## 7. Kiểm thử và Kiểm tra chất lượng mã nguồn

```bash
# Kiểm tra định dạng và cấu trúc
npm run lint

# Tạo bản dựng production kiểm tra lỗi Typescript
npm run build
```

---

## 8. Giấy phép
Bản quyền thuộc về ZORY Platform © 2026. Mọi quyền được bảo lưu.
