# Inline Paragraph Reactions & Comments Implementation Plan

**Goal:** Triển khai tính năng Bình luận & Thả cảm xúc nội dòng cho từng đoạn văn trong trình đọc [ZoryReader.tsx](file:///d:/PROJECT/ZORY/src/components/reader/ZoryReader.tsx).

**Architecture:**
1. Database:
   - Mở rộng model `Comment` thêm trường `paragraphIndex Int?`.
   - Tạo model `ParagraphReaction` (`chapterId`, `paragraphIndex`, `reaction`, `userId`, `guestId`).
2. API:
   - `GET /api/chapters/[id]/inline-interactions`: Lấy thống kê cảm xúc và số lượng bình luận cho tất cả đoạn văn trong chương.
   - `POST /api/chapters/[id]/reactions`: Thả cảm xúc (🔥, ❤️, 😂, 😮, 😭).
   - `GET /api/chapters/[id]/paragraphs/[index]/comments`: Lấy danh sách bình luận của đoạn văn.
   - `POST /api/chapters/[id]/paragraphs/[index]/comments`: Đăng bình luận cho đoạn văn.
3. UI:
   - `ParagraphToolbar.tsx`: Nút tương tác cạnh đoạn văn, hiển thị badge thống kê.
   - `InlineCommentDrawer.tsx`: Drawer trượt hiển thị trích đoạn và danh sách bình luận kèm form gửi.
   - Cập nhật `ZoryReader.tsx`: Tích hợp tương tác nội dòng vào từng `<p>`.

---

### Task 1: Mở rộng Schema Prisma & Push Database
- Thêm `paragraphIndex` vào `Comment`.
- Thêm model `ParagraphReaction`.
- Chạy `npx prisma db push; npx prisma generate`.

### Task 2: Xây dựng các API Routes cho tương tác nội dòng
- `GET /api/chapters/[id]/inline-interactions`
- `POST /api/chapters/[id]/reactions`
- `GET/POST /api/chapters/[id]/paragraphs/[index]/comments`

### Task 3: Xây dựng Component Tương Tác Nội Dòng
- `ParagraphReactionPicker.tsx`
- `ParagraphCommentDrawer.tsx`
- Tích hợp vào `ZoryReader.tsx`

### Task 4: Kiểm thử E2E & Typecheck
- Chạy script kiểm thử API.
- Chạy `npx tsc --noEmit`.
