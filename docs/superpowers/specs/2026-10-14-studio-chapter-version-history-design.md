# Tài liệu Thiết kế: Lịch Sử & Khôi Phục Bản Thảo Chương Trong ZORY Studio

- **Ngày tạo:** 2026-10-14
- **Trạng thái:** Đã phê duyệt (Approved)
- **Phân hệ:** Xưởng Sáng Tác AI Studio (Studio Draft Versioning & Diff Restore)

---

## 1. Mục tiêu & Bối cảnh

### 1.1. Mục tiêu
- Cho phép tác giả trong ZORY Studio lưu lại các phiên bản bản thảo của từng chương theo thời gian.
- Cho phép tác giả đặt tên mốc phiên bản và ghi chú nội dung thay đổi.
- Cung cấp trình so sánh khác biệt (Diff Viewer) trực quan giữa bản thảo cũ và bản thảo hiện tại trước khi quyết định khôi phục.
- Hỗ trợ khôi phục (Restore) bản thảo cũ nạp lại vào trình soạn thảo một cách an toàn.
- Tự động chụp mốc an toàn (Auto Snapshot) trước mỗi lần người dùng áp dụng kết quả sinh văn hoặc biên tập từ AI.

### 1.2. Bối cảnh hệ thống hiện tại
- ZORY Studio hiện quản lý bản thảo qua model `StudioChapter` với các trường `chapterNumber`, `title`, `content`, `wordCount`, `status`.
- Chưa có cơ chế lưu lịch sử phiên bản (`StudioChapterVersion`).
- Khi AI hỗ trợ viết tiếp (`CONTINUE`) hoặc viết lại (`REWRITE`), văn bản được ghi đè trực tiếp vào `chapterContent` mà không có bản lưu dự phòng nào trước đó.

---

## 2. Thiết kế Cơ sở dữ liệu (Database Schema)

Cập nhật `prisma/schema.prisma` và `prisma/schema.postgresql.prisma`:

### 2.1. Model mới: `StudioChapterVersion`
```prisma
model StudioChapterVersion {
  id            String   @id @default(cuid())
  chapterId     String
  projectId     String
  chapterNumber Int
  title         String
  content       String   @default("")
  wordCount     Int      @default(0)
  versionName   String?  // VD: "Bản nháp gốc", "Trước khi AI viết tiếp"
  changeNote    String?  // VD: "Chỉnh sửa đối thoại chương"
  source        String   @default("MANUAL") // MANUAL, AI_AUTO, PRE_RESTORE
  createdAt     DateTime @default(now())

  chapter       StudioChapter @relation(fields: [chapterId], references: [id], onDelete: Cascade)

  @@index([chapterId])
  @@index([projectId, chapterNumber])
}
```

### 2.2. Cập nhật Model `StudioChapter`
Thêm quan hệ:
```prisma
model StudioChapter {
  // Các trường hiện có...
  versions      StudioChapterVersion[]
}
```

---

## 3. Thiết kế API Endpoints

### 3.1. `GET /api/studio/projects/[id]/chapters/[chapterNumber]/versions`
- **Mục đích:** Lấy toàn bộ danh sách phiên bản của chương theo thứ tự mới nhất đến cũ nhất.
- **Quyền:** Chủ sở hữu dự án hoặc ADMIN.
- **Phản hồi:**
  - `versions`: Mảng các đối tượng `{ id, title, content, wordCount, versionName, changeNote, source, createdAt }`.
  - `chapterId`: ID của chương trong CSDL.

### 3.2. `POST /api/studio/projects/[id]/chapters/[chapterNumber]/versions`
- **Mục đích:** Tạo mốc chụp phiên bản mới.
- **Body:** `{ title: string, content: string, versionName?: string, changeNote?: string, source?: string }`.
- **Thực thi:**
  - Xác thực quyền sở hữu `AiProject`.
  - Tìm hoặc khởi tạo `StudioChapter` tương ứng trong CSDL.
  - Tính toán `wordCount`.
  - Tạo bản ghi `StudioChapterVersion`.
- **Phản hồi:** `{ success: true, version: StudioChapterVersion }`.

### 3.3. `POST /api/studio/projects/[id]/chapters/[chapterNumber]/restore`
- **Mục đích:** Khôi phục chương về một phiên bản lịch sử.
- **Body:** `{ versionId: string, currentContent?: string, currentTitle?: string }`.
- **Thực thi an toàn:**
  - Lấy thông tin phiên bản mục tiêu từ `StudioChapterVersion`.
  - Tự động tạo một snapshot dự phòng lưu lại trạng thái trước khi khôi phục (`source: 'PRE_RESTORE'`, `versionName: 'Sao lưu trước khi khôi phục'`).
  - Ghi đè `StudioChapter` bằng `title` và `content` của phiên bản mục tiêu.
  - Cập nhật số từ `wordCount`.
- **Phản hồi:** `{ success: true, restoredChapter: { title, content, wordCount } }`.

---

## 4. Thiết kế Giao diện Người dùng (UI/UX)

### 4.1. Nút kích hoạt trên thanh công cụ Studio
- Đặt cạnh nút "Lưu bản nháp" trên thanh Header soạn thảo của `StudioWorkspace.tsx`.
- Giao diện: Nút icon `History` kèm nhãn "Lịch sử bản thảo".

### 4.2. Modal Lịch sử & So sánh khác biệt `ChapterVersionModal.tsx`
- **Cấu trúc 2 cột:**
  - **Cột trái (Timeline):**
    - Nút "+ Lưu mốc hiện tại": Mở form nhanh nhập tên mốc và ghi chú thay đổi.
    - Danh sách các mốc thời gian: Hiển thị tên mốc, thời gian tạo tương đối, badge nguồn (`Tự lưu`, `AI tự động`, `Khôi phục`), số từ và ghi chú.
  - **Cột phải (Diff & Preview):**
    - Thanh điều khiển: Switch chế độ "So sánh khác biệt (Diff)" ⟷ "Xem toàn văn".
    - Trình hiển thị Diff theo đoạn văn bản:
      - Đoạn văn mới thêm: Highlight nền xanh lá viền trái, icon `+`.
      - Đoạn văn bị xóa/thay thế: Highlight nền đỏ nhạt có gạch ngang, icon `-`.
      - Đoạn văn giữ nguyên: Màu chữ bình thường.
    - Thanh hành động đáy: Nút "Khôi phục phiên bản này" (nạp lại vào `StudioWorkspace`).

### 4.3. Tự động chụp mốc trước khi AI can thiệp
- Trong hàm `handleApplyAiResult` tại `StudioWorkspace.tsx`:
  - Trước khi gán văn bản mới do AI sinh ra vào `chapterContent`, tự động gọi API `POST .../versions` ngầm với nhãn:
    `Trước khi AI ${aiOperation === 'CONTINUE' ? 'viết tiếp' : 'viết lại'}`.
  - Đảm bảo tác giả luôn có đường lui nếu văn phong của AI không như kỳ vọng.

---

## 5. Rủi ro & Giải pháp

| Rủi ro | Giải pháp |
|---|---|
| Khôi phục làm mất dữ liệu đang viết dở | Luôn tự động chụp snapshot lưu lại trạng thái hiện tại (`PRE_RESTORE`) trước khi tiến hành ghi đè khôi phục. |
| Chương mới chưa từng được lưu vào DB | Endpoint API tự động upsert bản ghi `StudioChapter` cha trước khi gắn khóa ngoại `chapterId` cho phiên bản con. |
| Hiệu năng diff khi văn bản chương dài | So sánh theo đoạn văn bản (`\n\n`) thay vì từng ký tự để đảm bảo tốc độ phản hồi tính bằng mili-giây trên trình duyệt. |
