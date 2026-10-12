# Story Branching & Decision Points Implementation Plan

**Goal:** Xây dựng hệ thống Cốt truyện phân nhánh (Choose Your Own Adventure) cho phép độc giả lựa chọn ngã rẽ cuối chương và tác giả tạo các tuyến truyện đa vũ trụ bằng AI.

**Architecture:**
1. Database:
   - Model `ChapterChoice` kết nối `chapterId` -> `targetChapterId` kèm `choiceText`, `summary`, `voteCount`.
2. AI Engine:
   - `src/lib/ai/branchGenerator.ts`: Gợi ý 2-3 ngã rẽ kịch tính và sinh chương tiếp nối theo nhánh được chọn.
3. API:
   - `GET /api/chapters/[id]/choices`: Danh sách lựa chọn cuối chương.
   - `POST /api/chapters/[id]/choices`: Thêm/sửa nhánh.
   - `POST /api/chapters/[id]/choices/suggest`: AI đề xuất ngã rẽ.
   - `POST /api/chapters/[id]/choices/[choiceId]/vote`: Vote ngã rẽ.
4. UI:
   - `BranchingChoicesSection.tsx`: Khung chọn ngã rẽ cuối chương trong [ZoryReader.tsx](file:///d:/PROJECT/ZORY/src/components/reader/ZoryReader.tsx).
   - `StoryTreeMapModal.tsx`: Sơ đồ cây cốt truyện hiển thị toàn bộ mạng lưới nhánh.
   - Tích hợp công cụ sinh ngã rẽ vào [StudioWorkspace.tsx](file:///d:/PROJECT/ZORY/src/components/studio/StudioWorkspace.tsx).

---

### Task 1: Schema Prisma & Migration
- Thêm model `ChapterChoice` vào `prisma/schema.prisma`.
- Chạy `npx prisma db push; npx prisma generate`.

### Task 2: Module AI Branch Generator
- Tạo `src/lib/ai/branchGenerator.ts`.
- Viết hàm sinh ngã rẽ `generateChapterBranches`.

### Task 3: API Quản lý ngã rẽ
- `GET /api/chapters/[id]/choices`
- `POST /api/chapters/[id]/choices`
- `POST /api/chapters/[id]/choices/suggest`
- `POST /api/chapters/[id]/choices/[choiceId]/vote`

### Task 4: Giao diện Reader & Studio
- Xây dựng `BranchingChoicesSection.tsx`.
- Xây dựng `StoryTreeMapModal.tsx`.
- Nhúng vào `ZoryReader.tsx` và `StudioWorkspace.tsx`.

### Task 5: Kiểm thử & Typecheck
- Script test E2E.
- `npx tsc --noEmit`.
