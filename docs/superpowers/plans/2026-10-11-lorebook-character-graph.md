# Lorebook & Sơ Đồ Nhân Vật (Worldbuilding Graph) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống Lorebook & Sơ đồ quan hệ nhân vật tự động trích xuất bằng AI cho ZORY, phục vụ giữ mạch truyện cho tác giả Studio và hiển thị thiết lập thế giới cho độc giả.

**Architecture:** Mở rộng cơ sở dữ liệu với `LoreEntry` liên kết `AiProject` và `Book`. Xây dựng module AI `loreExtractor.ts` trích xuất có cấu trúc (nhân vật, thế lực, cảnh giới, quan hệ) từ văn bản chương. Tích hợp giao diện quản lý đồ thị/danh bạ trong Studio và trang đọc sách công khai. Đưa Lore context vào AI co-writer prompt.

**Tech Stack:** Next.js 14 App Router, Prisma ORM (SQLite), Tailwind CSS, Lucide Icons, TypeScript.

## Global Constraints
- Preserve existing database compatibility; do not break current `Character` or `AiProject` fields.
- Clean typography: không dùng negative letter-spacing gây lỗi dấu tiếng Việt.
- Strict responsive design: hỗ trợ màn hình điện thoại (<640px) và desktop không tràn viền.

---

### Task 1: Mở rộng Prisma Schema với `LoreEntry` và Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `scratch/test-lore-db.js`

**Interfaces:**
- Produces: Model `LoreEntry` trong Prisma Client với quan hệ tới `AiProject` và `Book`.

- [ ] **Step 1: Cập nhật prisma/schema.prisma**
- [ ] **Step 2: Chạy prisma db push và prisma generate**
- [ ] **Step 3: Viết script kiểm tra CRUD LoreEntry**

---

### Task 2: Module AI Lore Extractor (`src/lib/ai/loreExtractor.ts`)

**Files:**
- Create: `src/lib/ai/loreExtractor.ts`
- Test: `scratch/test-lore-extractor.js`

**Interfaces:**
- Produces: `extractLoreFromText(chaptersText: string, context: { title: string; genre: string })` trả về `{ characters: Array, factions: Array, realms: Array, artifacts: Array }`.

- [ ] **Step 1: Viết test cho hàm trích xuất lore**
- [ ] **Step 2: Viết module loreExtractor.ts**
- [ ] **Step 3: Chạy test kiểm chứng trích xuất với dữ liệu mẫu**

---

### Task 3: API Quản lý & Trích xuất Lore Studio (`/api/studio/projects/[id]/lore`)

**Files:**
- Create: `src/app/api/studio/projects/[id]/lore/route.ts`
- Create: `src/app/api/studio/projects/[id]/lore/extract/route.ts`
- Create: `src/app/api/studio/projects/[id]/lore/[loreId]/route.ts`
- Create: `src/app/api/books/[slug]/lore/route.ts`

**Interfaces:**
- `GET /api/studio/projects/[id]/lore`: Danh sách toàn bộ lore entries theo category.
- `POST /api/studio/projects/[id]/lore/extract`: Quét các chương của project, gọi `loreExtractor`, upsert vào DB.
- `POST /api/studio/projects/[id]/lore`: Thêm/sửa thủ công lore entry.
- `DELETE /api/studio/projects/[id]/lore/[loreId]`: Xóa lore entry.

- [ ] **Step 1: Tạo các route handlers với auth check**
- [ ] **Step 2: Viết test script gọi API bằng node-fetch**
- [ ] **Step 3: Kiểm chứng kết quả API**

---

### Task 4: Giao diện Sơ đồ nhân vật & Lorebook trong StudioWorkspace

**Files:**
- Create: `src/components/studio/LorebookManager.tsx`
- Create: `src/components/studio/CharacterRelationshipGraph.tsx`
- Modify: `src/components/studio/StudioWorkspace.tsx`

**Interfaces:**
- Nâng cấp Tab "Nhân vật / Lorebook":
  - Nút bấm `⚡ AI Quét Tự Động Toàn Bộ Bản Thảo` trích xuất thông tin.
  - Bộ lọc danh mục: Tất cả, Nhân vật, Môn phái, Cảnh giới, Bảo vật.
  - Khung hiển thị Sơ đồ quan hệ (Character Relationship Network) bằng thẻ node trực quan kết nối mạng lưới nhân vật.
  - Cho phép thêm/sửa/xóa trực tiếp thẻ lore.

- [ ] **Step 1: Xây dựng LorebookManager component**
- [ ] **Step 2: Xây dựng CharacterRelationshipGraph component**
- [ ] **Step 3: Nhúng vào StudioWorkspace và test responsive mobile/desktop**

---

### Task 5: Tích hợp Lore Context vào Studio AI Prompt & Trang Chi Tiết Sách

**Files:**
- Modify: `src/app/api/studio/projects/[id]/generate/route.ts`
- Modify: `src/app/book/[slug]/page.tsx`

**Interfaces:**
- Khi người dùng bấm "AI Viết tiếp" hoặc "Sinh chương mới":
  - Tự động lấy danh sách `LoreEntry` đưa vào context prompt.
- Trang `[book/[slug]]`:
  - Thêm tab "Bối Cảnh & Nhân Vật" cho người đọc khám phá.

- [ ] **Step 1: Inject Lore Context vào AI Prompt generator**
- [ ] **Step 2: Thêm Lorebook Tab vào trang Book Detail**
- [ ] **Step 3: Chạy TypeScript check `npx tsc --noEmit`**
- [ ] **Step 4: Kiểm thử E2E qua browser / script**
