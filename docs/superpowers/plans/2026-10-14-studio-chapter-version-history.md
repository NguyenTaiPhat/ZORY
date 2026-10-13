# Kế Hoạch Triển Khai: Lịch Sử & Khôi Phục Bản Thảo Chương Trong ZORY Studio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm tính năng lưu mốc lịch sử bản thảo (Snapshot), so sánh khác biệt (Diff) theo đoạn, khôi phục bản cũ, và tự động chụp mốc an toàn trước khi AI áp dụng thay đổi vào chương truyện trong ZORY Studio.

**Architecture:** Tạo model `StudioChapterVersion` trong Prisma. Viết API lấy danh sách phiên bản, tạo snapshot mới, và khôi phục phiên bản. Xây dựng component `ChapterVersionModal` với thuật toán paragraph diff, tích hợp nút lịch sử và trigger auto-snapshot vào `StudioWorkspace`.

**Tech Stack:** Next.js 15, React 19, Prisma ORM, Tailwind CSS, Lucide React, TypeScript.

## Global Constraints
- Đồng bộ mô hình schema trên cả `prisma/schema.prisma` (SQLite) và `prisma/schema.postgresql.prisma` (PostgreSQL).
- Đảm bảo an toàn dữ liệu: trước khi khôi phục bản cũ, luôn tự động chụp mốc lưu lại trạng thái hiện tại (`PRE_RESTORE`).
- Thuật toán diff xử lý theo từng đoạn văn bản (`\n\n`) để đạt tốc độ tối ưu và giao diện trực quan cho văn học.

---

### Task 1: Cập nhật Schema & Sinh Prisma Client

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/schema.postgresql.prisma`

**Interfaces:**
- Consumes: Model `StudioChapter`
- Produces: Model `StudioChapterVersion`, quan hệ `versions` trong `StudioChapter`

- [ ] **Step 1: Cập nhật `schema.prisma` và `schema.postgresql.prisma`**

Thêm model `StudioChapterVersion`:
```prisma
model StudioChapterVersion {
  id            String   @id @default(cuid())
  chapterId     String
  projectId     String
  chapterNumber Int
  title         String
  content       String   @default("")
  wordCount     Int      @default(0)
  versionName   String?
  changeNote    String?
  source        String   @default("MANUAL") // MANUAL, AI_AUTO, PRE_RESTORE
  createdAt     DateTime @default(now())

  chapter       StudioChapter @relation(fields: [chapterId], references: [id], onDelete: Cascade)

  @@index([chapterId])
  @@index([projectId, chapterNumber])
}
```

Thêm quan hệ vào `StudioChapter`:
```prisma
  versions      StudioChapterVersion[]
```

- [ ] **Step 2: Chạy `npx prisma db push`**

Run: `npx prisma db push`
Expected: Database đồng bộ thành công, client được cập nhật.

- [ ] **Step 3: Commit Task 1**

```bash
git add prisma/schema.prisma prisma/schema.postgresql.prisma
git commit -m "feat(db): add StudioChapterVersion model"
```

---

### Task 2: API Endpoints Cho Phiên Bản & Khôi Phục Bản Thảo

**Files:**
- Create: `src/app/api/studio/projects/[id]/chapters/[chapterNumber]/versions/route.ts`
- Create: `src/app/api/studio/projects/[id]/chapters/[chapterNumber]/restore/route.ts`

**Interfaces:**
- Consumes: `prisma.studioChapterVersion`, `prisma.studioChapter`, `getCurrentUser()`
- Produces:
  - `GET /api/studio/projects/[id]/chapters/[chapterNumber]/versions` (danh sách phiên bản)
  - `POST /api/studio/projects/[id]/chapters/[chapterNumber]/versions` (tạo snapshot mới)
  - `POST /api/studio/projects/[id]/chapters/[chapterNumber]/restore` (khôi phục bản cũ)

- [ ] **Step 1: Viết `versions/route.ts`**

Xử lý:
- `GET`: Kiểm tra quyền truy cập dự án của user. Lấy các bản ghi `StudioChapterVersion` theo `projectId` và `chapterNumber`, sắp xếp `createdAt: 'desc'`.
- `POST`: Kiểm tra quyền. Upsert `StudioChapter` nếu chưa tồn tại. Tạo bản ghi `StudioChapterVersion`.

- [ ] **Step 2: Viết `restore/route.ts`**

Xử lý:
- `POST`: Nhận `{ versionId: string, currentContent?: string, currentTitle?: string }`.
- Tìm phiên bản chỉ định.
- Tự động tạo snapshot dự phòng với `source: 'PRE_RESTORE'` cho nội dung hiện tại.
- Cập nhật `StudioChapter` với nội dung và tiêu đề từ phiên bản chỉ định.
- Trả về `{ success: true, restoredChapter: { title, content, wordCount } }`.

- [ ] **Step 3: Commit Task 2**

```bash
git add src/app/api/studio/projects/[id]/chapters/[chapterNumber]/versions/route.ts src/app/api/studio/projects/[id]/chapters/[chapterNumber]/restore/route.ts
git commit -m "feat(api): add chapter versioning and restore endpoints"
```

---

### Task 3: Component Modal Lịch Sử Bản Thảo & Thuật Toán So Sánh Diff

**Files:**
- Create: `src/components/studio/ChapterVersionModal.tsx`

**Interfaces:**
- Consumes: Lucide icons, `formatTimeAgoVi`, `formatDateVi`
- Produces: Modal giao diện lịch sử phiên bản, timeline, diff viewer, nút khôi phục và nút lưu mốc

- [ ] **Step 1: Viết `src/components/studio/ChapterVersionModal.tsx`**

Bao gồm:
- Hàm so sánh đoạn văn bản (Paragraph Diff algorithm): phân tách 2 đoạn văn bản thành các khối tương đương hoặc thêm/bớt.
- Cột bên trái: Danh sách các phiên bản đã lưu với badge nguồn (`Tự lưu`, `AI tự động`, `Khôi phục`), số từ, ngày lưu, tên phiên bản, ghi chú. Nút "+ Tạo mốc mới".
- Cột bên phải: Tabs switch giữa "So sánh Diff" và "Xem toàn văn bản". Hiển thị chi tiết nội dung so sánh với bản hiện tại trong editor.
- Nút "Khôi phục phiên bản này" nạp thẳng vào editor.

- [ ] **Step 2: Commit Task 3**

```bash
git add src/components/studio/ChapterVersionModal.tsx
git commit -m "feat(ui): add ChapterVersionModal component with visual diff viewer"
```

---

### Task 4: Tích Hợp Vào StudioWorkspace & Auto-Snapshot Khi Dùng AI

**Files:**
- Modify: `src/components/studio/StudioWorkspace.tsx`

**Interfaces:**
- Consumes: `ChapterVersionModal`
- Produces: Nút "Lịch sử" trên toolbar, tự động chụp mốc an toàn khi áp dụng AI

- [ ] **Step 1: Cập nhật `StudioWorkspace.tsx`**

Thao tác:
- Thêm state `versionModalOpen` và nút `Lịch sử bản thảo` trên toolbar soạn thảo chương.
- Trong hàm `handleApplyAiResult`: trước khi ghi đè hoặc nối thêm nội dung của AI, gọi ngầm API tạo snapshot với nhãn `Trước khi áp dụng AI (${aiOperation})`.
- Xử lý callback khi khôi phục phiên bản: cập nhật `chapterTitle` và `chapterContent` ngay lập tức trên giao diện.

- [ ] **Step 2: Commit Task 4**

```bash
git add src/components/studio/StudioWorkspace.tsx
git commit -m "feat(studio): integrate chapter version modal and auto AI snapshot"
```

---

### Task 5: Kiểm Thử Build & Xác Minh Hoạt Động

**Files:** Toàn bộ dự án

- [ ] **Step 1: Chạy build kiểm tra toàn diện**

Run: `npm run build`
Expected: Build thành công 100%, 0 lỗi typecheck.

- [ ] **Step 2: Commit release và hoàn tất**

```bash
git commit --allow-empty -m "chore(release): studio chapter versioning feature verified"
```
