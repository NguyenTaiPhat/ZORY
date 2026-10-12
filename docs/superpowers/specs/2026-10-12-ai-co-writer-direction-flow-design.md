# Thiết Kế Kỹ Thuật: Quy Trình AI Đồng Tác Giả — Định Hướng Tình Tiết Trước Khi Sinh Văn (AI Co-Writer Direction Flow)

- **Ngày ban hành:** 2026-10-12
- **Tác giả:** Đội ngũ Kỹ thuật ZORY & Tác giả Hệ thống
- **Trạng thái:** Đã phê duyệt (Approved)
- **Tài liệu tham chiếu:** [StudioWorkspace.tsx](file:///d:/PROJECT/ZORY/src/components/studio/StudioWorkspace.tsx), [/api/ai/generate](file:///d:/PROJECT/ZORY/src/app/api/ai/generate/route.ts)

---

## 1. Bối Cảnh & Vấn Đề Cần Giải Quyết

### 1.1. Hiện trạng & Phản hồi thực tế từ người dùng
Khi tác giả sử dụng tính năng **"AI VIẾT TIẾP"** trong AI Studio:
1. **Lỗi khi "nhồi prompt":** Người dùng có nhiều ý tưởng cho phân đoạn tiếp theo nhưng chỉ có 1 ô nhập văn bản một dòng ngắn. Khi nhồi nhiều tình tiết, cao trào và yêu cầu vào cùng lúc, mô hình AI dễ bị quá tải ngữ cảnh (prompt overload), dẫn tới bỏ sót chi tiết hoặc phản hồi lỗi.
2. **Lỗi AI "tự viết lệch hướng":** Nếu tác giả không nhập prompt mà để AI tự viết tiếp, AI có thể viết rất mượt nhưng lại tự ý rẽ sang hướng hoàn toàn khác với dự tính cốt truyện của tác giả (ví dụ: tác giả muốn nhân vật ẩn nhẫn thì AI lại cho nhân vật bộc phát đánh nhau).
3. **Mất token vô ích:** Tác giả phải sinh lại nhiều lần (mất token hạn mức) chỉ để tìm được đúng hướng diễn biến mong muốn.

### 1.2. Mục tiêu thiết kế
- Xây dựng quy trình 2 bước tương tác (Interactive Co-Writer Stepper):
  - **Bước 1 (Định hướng tình tiết):** AI đọc đoạn văn trước đó và chủ động đề xuất 3 hướng đi tình tiết cụ thể. Tác giả chọn 1 hướng hoặc tự điều chỉnh dàn ý ngắn.
  - **Bước 2 (Sinh chính văn):** AI nhận dàn ý đã được tác giả phê duyệt để mở rộng thành văn xuôi hoàn chỉnh chuẩn xác 100% ý đồ tác giả.
- Cho phép nút "Bỏ qua & Viết tự do" nếu tác giả muốn sinh văn trực tiếp mà không qua bước gợi ý.

---

## 2. Kiến Trúc Luồng Người Dùng (User Flow)

```
[Tác giả bấm "AI VIẾT TIẾP"]
            │
            ▼
┌───────────────────────────────────────────────┐
│ Bước 1: PHÁC THẢO HƯỚNG ĐI (SUGGEST)          │
│ • AI phân tích 800 ký tự cuối + World Bible  │
│ • Hiển thị 3 thẻ hướng đi (A, B, C)          │
│ • Hoặc nhập hướng đi riêng                   │
└───────────────────────────────────────────────┘
     │                                    │
     │ (Chọn hướng & bấm Tiếp tục)        │ (Bấm Bỏ qua)
     ▼                                    ▼
┌───────────────────────────────────────────────┐
│ Bước 2: SINH CHÍNH VĂN (GENERATE PROSE)       │
│ • Ghim hướng đi đã duyệt lên đầu             │
│ • Chọn dung lượng từ (500t / 1200t / 2000t...)│
│ • Bấm "TẠO BẢN ĐỀ XUẤT"                       │
└───────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────┐
│ Xem trước bản thảo & Nút CHÈN VÀO BẢN THẢO   │
└───────────────────────────────────────────────┘
```

---

## 3. Thiết Kế Giao Diện & Trạng Thái (UI / UX Specification)

### 3.1. Modal Stepper Indicator
Đầu popup trợ lý AI hiển thị thanh trạng thái rõ ràng:
- **Tab 1:** `01. ĐỊNH HƯỚNG TÌNH TIẾT` (Active / Completed)
- **Tab 2:** `02. SINH CHÍNH VĂN HOÀN CHỈNH`

### 3.2. Bước 1: Giao diện Chọn Hướng Đi
- **Trạng thái đang phân tích (`directionLoading = true`):**
  - Hiển thị thông báo *"AI đang phân tích mạch truyện để gợi ý 3 hướng diễn biến phù hợp..."*
  - 3 khung xương Skeleton thẻ hướng đi nhấp nháy tinh tế.
- **3 Thẻ hướng đi tương tác (`directionOptions`):**
  - **Thẻ 1 — Cao trào / Bùng nổ xung đột:** Nhịp điệu dồn dập, đối đầu trực tiếp hoặc biến cố bất ngờ.
  - **Thẻ 2 — Manh mối / Bí ẩn:** Nhân vật phát hiện bí mật, xoay chuyển cục diện hoặc đàm phán mưu lược.
  - **Thẻ 3 — Tâm lý / Chiều sâu:** Phát triển nội tâm, rèn luyện kỹ năng, hoặc đối thoại gắn kết nhân vật.
  - Mỗi thẻ gồm:
    - Tiêu đề ngắn gọn (ví dụ: `Hướng A: Bộc lộ chân tướng`).
    - Tóm tắt tình tiết 2–3 câu rõ ràng.
    - Huy hiệu phân loại (`label-caps`).
  - Khi tác giả nhấp vào một thẻ: viền đổi màu `border-primary bg-primary/10`, hiển thị dấu tích xác nhận.
- **Ô tự định hướng:** Trường nhập văn bản linh hoạt: *"Hoặc nhập ý tưởng riêng của bạn..."*
- **Hành động:**
  - Nút `BỎ QUA (VIẾT TỰ DO)`: Nhảy thẳng sang Bước 2 mà không kèm dàn ý.
  - Nút `TIẾP TỤC VỚI HƯỚNG NÀY ➔`: Chuyển sang Bước 2, mang theo nội dung hướng đi đã chọn.

### 3.3. Bước 2: Giao diện Sinh Chính Văn Hoàn Chỉnh
- **Khối hướng đi đã duyệt:** Hiển thị nổi bật ở trên cùng với nút "Sửa nhanh" hoặc nút `← ĐỔI HƯỚNG` để quay lại Bước 1.
- **Bộ chọn dung lượng sinh văn (`aiLength`):**
  - Ngắn gọn (`~500 - 700 từ`)
  - Tiêu chuẩn (`~1000 - 1400 từ`)
  - Cảnh dài (`~1800 - 2200 từ`)
  - Đại chương VIP (`~2500 - 3500 từ`)
- **Nút hành động:** `TẠO BẢN ĐỀ XUẤT`.
- **Xem trước & Áp dụng:** Khung đọc thử `.reader-content` đi kèm thống kê token trừ thực tế và nút `CHÈN VÀO BẢN THẢO`.

---

## 4. Đặc Tả Kỹ Thuật API Backend (`/api/ai/generate`)

### 4.1. Thao tác mới: `SUGGEST_DIRECTIONS`
- **Method:** `POST /api/ai/generate`
- **Body:**
  ```json
  {
    "operation": "SUGGEST_DIRECTIONS",
    "projectId": "cmv55ig...",
    "prompt": "Đoạn văn gần nhất của chương hoặc tóm tắt chương...",
    "systemPrompt": "Ngữ cảnh World Bible & Phong cách tác phẩm..."
  }
  ```
- **Prompt kỹ thuật của hệ thống:**
  Yêu cầu mô hình AI đóng vai trò nhà biên kịch đồng hành. Dựa vào 800 ký tự gần nhất của câu chuyện, phân tích tình thế hiện tại và xuất ra đúng định dạng JSON 3 hướng phát triển:
  ```json
  [
    {
      "id": "A",
      "tag": "CAO TRÀO",
      "title": "Tên hướng đi 1",
      "summary": "Mô tả 2-3 câu về biến cố và hành động của nhân vật..."
    },
    {
      "id": "B",
      "tag": "BÍ ẨN",
      "title": "Tên hướng đi 2",
      "summary": "Mô tả 2-3 câu..."
    },
    {
      "id": "C",
      "tag": "TÂM LÝ",
      "title": "Tên hướng đi 3",
      "summary": "Mô tả 2-3 câu..."
    }
  ]
  ```
- **Token tiêu thụ:** Cực thấp (~150 - 200 tokens), thời gian phản hồi nhanh (< 1.5s).

### 4.2. Nâng cấp thao tác `CONTINUE`
- **Body mở rộng:** Bổ sung trường `directionSummary` (dàn ý hướng đi đã được tác giả chọn).
- **Prompt kỹ thuật:**
  Ghép `directionSummary` vào chỉ dẫn bắt buộc:
  *"Nhiệm vụ: Bạn là trợ lý viết truyện đồng hành cùng tác giả. Tác giả đã DUYỆT VÀ CHỐT DÀN Ý TÌNH TIẾT sau đây cho đoạn văn kế tiếp: [directionSummary]. Bạn bắt buộc phải triển khai câu văn bám sát 100% dàn ý này, không được tự ý thay đổi mạch truyện hay bẻ lái ngoài ý đồ tác giả."*

---

## 5. Xử Lý Ngoại Lệ & Dự Phòng (Edge Cases & Fallbacks)

1. **Khi chương còn trống hoàn toàn (Chương mới):**
   - AI dựa vào `project.premise` (ý tưởng truyện) hoặc `currentChapter.summary` (nếu có) để gợi ý mở đầu chương.
2. **Khi tác giả không muốn chọn gợi ý:**
   - Nút "Bỏ qua & Viết tự do" luôn sẵn sàng để tác giả làm việc theo cách truyền thống.
3. **Khi API gặp sự cố hoặc JSON trả về bị hỏng:**
   - Hệ thống có bộ parser dự phòng (fallback regex) tách 3 đoạn hoặc chuyển thẳng sang chế độ nhập ý tưởng tự do mà không làm treo giao diện.
4. **Hệ thống Mock Engine (khi chạy offline / test):**
   - Tạo bộ mock 3 hướng đi động theo thể loại truyện (Tiên hiệp / Đô thị / Huyền ảo / Khoa huyễn) đảm bảo kiểm thử mượt mà.

---

## 6. Kế Hoạch Kiểm Thử (Verification Plan)
1. **Kiểm thử Giao diện (UI):**
   - Mở modal "AI VIẾT TIẾP", kiểm tra bước 1 hiển thị đúng 3 thẻ.
   - Thử click chọn thẻ, kiểm tra viền active.
   - Thử chuyển sang bước 2, kiểm tra dàn ý được giữ nguyên.
   - Thử bấm "← Quay lại đổi hướng".
   - Thử bấm "Bỏ qua (Viết tự do)".
2. **Kiểm thử Luồng Sinh Văn (AI Output):**
   - Sinh chính văn theo hướng đã chọn, xác nhận câu chữ bám sát tình tiết đã duyệt.
   - Kiểm tra khấu trừ token chuẩn xác.
   - Kiểm tra chức năng chèn vào bản thảo hoạt động tốt.
