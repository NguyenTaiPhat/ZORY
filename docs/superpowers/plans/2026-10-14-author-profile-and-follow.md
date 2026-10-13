# Kế Hoạch Triển Khai: Trang Tác Giả, Theo Dõi & Thông Báo Chương Mới

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng trang hồ sơ tác giả `/author/[username]`, cơ chế theo dõi tác giả, hệ thống thông báo chương mới cho độc giả khi tác giả xuất bản từ Studio, và chuông thông báo trên Navbar.

**Architecture:** Mở rộng Prisma schema với model `AuthorFollow` và các trường bổ sung cho `User` (`publishingSchedule`, `bannerUrl`). Tạo các API quản lý thông tin tác giả, theo dõi (`/api/authors/...`) và thông báo (`/api/notifications`). Tự động phát sinh `Notification` khi chương truyện được chuyển trạng thái sang `PUBLISHED` trong Studio. Tích hợp UI hiển thị trang tác giả và component chuông thông báo trên `Navbar`.

**Tech Stack:** Next.js 15 (App Router), React 19, Prisma ORM (SQLite / PostgreSQL), Tailwind CSS, Lucide React, TypeScript.

## Global Constraints
- Sử dụng mô hình Prisma tương thích đồng thời SQLite (`prisma/schema.prisma`) và PostgreSQL (`prisma/schema.postgresql.prisma`).
- Giữ vững quy tắc typography, theme (light/dark/sepia), và design tokens hiện có của ZORY.
- Đảm bảo kiểm tra quyền: chỉ tác giả hoặc ADMIN mới được cập nhật lịch đăng và bio của chính mình; độc giả không được tự follow bản thân.

---

### Task 1: Cập nhật Database Schema & Prisma Client

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/schema.postgresql.prisma`

**Interfaces:**
- Consumes: Model `User` hiện hữu
- Produces: Model `AuthorFollow`, các quan hệ `followers`, `following`, các trường `publishingSchedule`, `bannerUrl`

- [ ] **Step 1: Cập nhật schema trong `prisma/schema.prisma` và `prisma/schema.postgresql.prisma`**

Thêm vào model `User`:
```prisma
  publishingSchedule String?
  bannerUrl          String?
  followers          AuthorFollow[]   @relation("AuthorFollowers")
  following          AuthorFollow[]   @relation("UserFollowing")
```

Thêm model `AuthorFollow`:
```prisma
model AuthorFollow {
  id          String   @id @default(cuid())
  followerId  String
  authorId    String
  createdAt   DateTime @default(now())

  follower    User     @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)
  author      User     @relation("AuthorFollowers", fields: [authorId], references: [id], onDelete: Cascade)

  @@unique([followerId, authorId])
  @@index([followerId])
  @@index([authorId])
}
```

- [ ] **Step 2: Chạy `npx prisma generate` và đồng bộ schema**

Run: `npx prisma generate`
Expected: Sinh mã Prisma Client thành công chứa `authorFollow`.

- [ ] **Step 3: Commit Task 1**

```bash
git add prisma/schema.prisma prisma/schema.postgresql.prisma
git commit -m "feat(db): add AuthorFollow model and author profile fields"
```

---

### Task 2: API Endpoints cho Hồ Sơ Tác Giả & Theo Dõi

**Files:**
- Create: `src/app/api/authors/[username]/route.ts`
- Create: `src/app/api/authors/[username]/follow/route.ts`

**Interfaces:**
- Consumes: `prisma.user`, `prisma.authorFollow`, `getCurrentUser()` từ `@/lib/auth`
- Produces: `GET /api/authors/[username]`, `PATCH /api/authors/[username]`, `GET /api/authors/[username]/follow`, `POST /api/authors/[username]/follow`, `DELETE /api/authors/[username]/follow`

- [ ] **Step 1: Viết `src/app/api/authors/[username]/route.ts`**

Hỗ trợ:
- `GET`: Lấy thông tin tác giả, thống kê follower, số sách, tổng lượt đọc, rating trung bình, và danh sách các cuốn sách `PUBLISHED`.
- `PATCH`: Tác giả hoặc Admin cập nhật `bio`, `publishingSchedule`, `bannerUrl`.

- [ ] **Step 2: Viết `src/app/api/authors/[username]/follow/route.ts`**

Hỗ trợ:
- `GET`: Kiểm tra trạng thái `{ isFollowing: boolean, followerCount: number }`.
- `POST`: Người dùng theo dõi tác giả (kiểm tra `user.id !== author.id`).
- `DELETE`: Người dùng hủy theo dõi tác giả.

- [ ] **Step 3: Commit Task 2**

```bash
git add src/app/api/authors/[username]/route.ts src/app/api/authors/[username]/follow/route.ts
git commit -m "feat(api): add author profile and follow endpoints"
```

---

### Task 3: API Quản Lý Thông Báo Độc Giả

**Files:**
- Create: `src/app/api/notifications/route.ts`

**Interfaces:**
- Consumes: `prisma.notification`, `getCurrentUser()`
- Produces: `GET /api/notifications` (trả về danh sách thông báo và `unreadCount`), `PATCH /api/notifications` (đánh dấu 1 hoặc tất cả là đã đọc)

- [ ] **Step 1: Viết `src/app/api/notifications/route.ts`**

Xử lý:
- `GET`: Kiểm tra session. Tìm 25 thông báo gần nhất của `user.id`, sắp xếp `createdAt: 'desc'`. Đếm số lượng thông báo có `isRead: false`.
- `PATCH`: Nhận `{ id?: string, markAll?: boolean }`. Nếu `markAll: true`, update tất cả thông báo của user thành `isRead: true`. Nếu có `id`, update bản ghi đó thành `isRead: true`.

- [ ] **Step 2: Commit Task 3**

```bash
git add src/app/api/notifications/route.ts
git commit -m "feat(api): add notifications listing and read status endpoints"
```

---

### Task 4: Kích Hoạt Thông Báo Khi Xuất Bản Chương Mới

**Files:**
- Modify: `src/app/api/studio/projects/[id]/publish/route.ts`

**Interfaces:**
- Consumes: `prisma.authorFollow`, `prisma.notification`
- Produces: Tự động ghi bản ghi thông báo cho toàn bộ followers khi có chương mới được công khai

- [ ] **Step 1: Cập nhật `src/app/api/studio/projects/[id]/publish/route.ts`**

Sau khi tạo/cập nhật các chương truyện sang trạng thái `PUBLISHED`:
- Tìm danh sách `followers` của tác giả `user.id`.
- Nếu có followers và có ít nhất 1 chương mới được xuất bản trong lần gọi này:
  Tạo thông báo `prisma.notification.createMany` với nội dung thông báo rõ ràng kèm link đọc chương truyện `/read/${targetBook.slug}/${sc.chapterNumber}`.

- [ ] **Step 2: Commit Task 4**

```bash
git add src/app/api/studio/projects/[id]/publish/route.ts
git commit -m "feat(studio): notify followers when new chapter is published"
```

---

### Task 5: Component Chuông Thông Báo & Tích Hợp Navbar

**Files:**
- Create: `src/components/layout/NotificationBell.tsx`
- Modify: `src/components/layout/Navbar.tsx`

**Interfaces:**
- Consumes: `/api/notifications`, Lucide icons (`Bell`, `CheckCheck`, `BookOpen`)
- Produces: Popover thông báo tương tác với badge đếm số lượng chưa đọc, click chuyển link và đánh dấu đã đọc

- [ ] **Step 1: Viết `src/components/layout/NotificationBell.tsx`**

Bao gồm:
- Icon `Bell` với badge tròn hiển thị số lượng chưa đọc.
- Dropdown danh sách thông báo: tiêu đề, tóm tắt thời gian tương đối (`formatDateVi` hoặc phút/giờ trước), trạng thái đã đọc/chưa đọc.
- Nút "Đánh dấu tất cả đã đọc".
- Nhấp vào thông báo sẽ đóng popover, đánh dấu đã đọc và điều hướng đến link.

- [ ] **Step 2: Nhúng `NotificationBell` vào `src/components/layout/Navbar.tsx`**

Đặt trước avatar tài khoản người dùng khi người dùng đã đăng nhập.

- [ ] **Step 3: Commit Task 5**

```bash
git add src/components/layout/NotificationBell.tsx src/components/layout/Navbar.tsx
git commit -m "feat(ui): add notification bell dropdown to global navbar"
```

---

### Task 6: Giao Diện Trang Tác Giả Công Khai

**Files:**
- Create: `src/app/author/[username]/page.tsx`
- Create: `src/components/author/AuthorProfileClient.tsx`

**Interfaces:**
- Consumes: Thông tin tác giả từ Prisma, `/api/authors/[username]/follow`, `/api/authors/[username]`
- Produces: Trang `/author/[username]` hoàn chỉnh với SEO metadata

- [ ] **Step 1: Tạo `src/components/author/AuthorProfileClient.tsx`**

Chứa:
- Hero banner và thẻ tác giả (Avatar, Bút danh, Username, Nhãn Tác giả).
- Thống kê (Người theo dõi, Số tác phẩm, Lượt đọc).
- Nút tương tác: Nút "Theo dõi" / "Đang theo dõi" (kèm loading state), hoặc nút "Chỉnh sửa hồ sơ & Lịch đăng" nếu là chính tác giả.
- Khung Lịch đăng truyện nổi bật ("LỊCH RA CHƯƠNG").
- Khung Lời tự bạch / Bio.
- Lưới danh sách tác phẩm công khai với ảnh bìa, thể loại, tóm tắt, số chương, lượt đọc và rating.
- Modal chỉnh sửa lịch đăng & bio cho tác giả.

- [ ] **Step 2: Tạo Server Component `src/app/author/[username]/page.tsx`**

Fetch dữ liệu tác giả, sinh SEO `generateMetadata` và render `AuthorProfileClient`.

- [ ] **Step 3: Commit Task 6**

```bash
git add src/app/author/[username]/page.tsx src/components/author/AuthorProfileClient.tsx
git commit -m "feat(author): add author public profile page and client components"
```

---

### Task 7: Tích Hợp Liên Kết Tác Giả Trên Trang Chi Tiết Truyện

**Files:**
- Modify: `src/components/books/BookDetailClient.tsx`

**Interfaces:**
- Consumes: `book.author.username`
- Produces: Link trực tiếp đến `/author/[username]` từ chi tiết truyện

- [ ] **Step 1: Cập nhật `src/components/books/BookDetailClient.tsx`**

Chuyển đổi đoạn hiển thị tên tác giả:
```tsx
<p className="text-xs uppercase tracking-wider font-semibold text-text-muted">
  Tác giả:{' '}
  <Link
    href={`/author/${book.author?.username || ''}`}
    className="text-text-primary font-bold hover:text-primary transition underline underline-offset-4"
  >
    {book.author?.name || book.author?.username || 'Tiêu Dao Mặc Khách'}
  </Link>
</p>
```

- [ ] **Step 2: Commit Task 7**

```bash
git add src/components/books/BookDetailClient.tsx
git commit -m "feat(book): link author name to author profile page"
```

---

### Task 8: Kiểm Thử Build & Xác Minh Hoạt Động

**Files:** Toàn bộ dự án

- [ ] **Step 1: Chạy typecheck và build**

Run: `npm run build`
Expected: Không có lỗi TypeScript, không có lỗi Next.js build.

- [ ] **Step 2: Xác minh luồng dữ liệu**

Kiểm tra:
- Truy cập trang tác giả demo (ví dụ `/author/author` hoặc tác giả của truyện có sẵn).
- Thao tác nút Theo dõi / Hủy theo dõi.
- Kiểm tra hiển thị chuông thông báo trên Navbar.
- Chỉnh sửa lịch đăng truyện và bio.

- [ ] **Step 3: Commit hoàn tất**

```bash
git commit --allow-empty -m "chore(release): author profile and notification feature verified"
```
