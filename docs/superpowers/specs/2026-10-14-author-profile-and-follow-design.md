# Tài liệu Thiết kế: Trang Tác Giả, Theo Dõi & Thông Báo Chương Mới

- **Ngày tạo:** 2026-10-14
- **Trạng thái:** Đã phê duyệt (Approved)
- **Phân hệ:** Tác giả & Tương tác độc giả (Author & Follow System)

---

## 1. Mục tiêu & Bối cảnh

### 1.1. Mục tiêu
- Xây dựng trang hồ sơ tác giả công khai tại `/author/[username]` giới thiệu bản thân, lịch đăng định kỳ và danh sách tác phẩm công khai.
- Cung cấp tính năng "Theo dõi" (Follow) tác giả cho độc giả đã đăng nhập.
- Tận dụng bảng `Notification` hiện có để tự động gửi thông báo đến tất cả người theo dõi khi tác giả xuất bản chương truyện mới từ Xưởng sáng tác ZORY Studio.
- Hiển thị chuông thông báo trực tiếp trên thanh điều hướng toàn cục (`Navbar`) giúp người dùng nhận biết tức thì.

### 1.2. Bối cảnh hệ thống hiện tại
- Dự án ZORY đã có model `Notification`, `LibraryItem`, và phân vai tài khoản `role: USER | AUTHOR | ADMIN`.
- Chưa có bảng quan hệ theo dõi tác giả (`AuthorFollow`).
- Chưa có trường lưu lịch đăng truyện (`publishingSchedule`) và ảnh bìa trang tác giả (`bannerUrl`).
- Thanh `Navbar` chưa có nút chuông thông báo và chưa có endpoint API xử lý danh sách thông báo người dùng.
- Tên tác giả trên trang chi tiết truyện (`/book/[slug]`) đang là văn bản tĩnh, chưa dẫn về trang tác giả.

---

## 2. Thiết kế Cơ sở dữ liệu (Database Schema)

Cập nhật `prisma/schema.prisma` và `prisma/schema.postgresql.prisma`:

### 2.1. Model mới: `AuthorFollow`
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

### 2.2. Mở rộng Model `User`
```prisma
model User {
  // Các trường hiện có...
  bio                 String?
  publishingSchedule  String?  // Lịch đăng truyện (VD: "20:00 Thứ 3, 5, 7")
  bannerUrl           String?  // Ảnh banner hồ sơ tác giả

  // Quan hệ mới:
  followers           AuthorFollow[] @relation("AuthorFollowers")
  following           AuthorFollow[] @relation("UserFollowing")
}
```

### 2.3. Tận dụng Model `Notification` sẵn có
Model `Notification` giữ nguyên cấu trúc:
- `id`: CUID
- `userId`: CUID người nhận
- `title`: Chuỗi tiêu đề
- `message`: Nội dung tóm tắt
- `link`: Đường dẫn hành động (URL)
- `isRead`: Boolean trạng thái đã đọc
- `createdAt`: Thời gian tạo

---

## 3. Thiết kế API Endpoints

### 3.1. `GET /api/authors/[username]`
- **Mục đích:** Lấy thông tin công khai của tác giả.
- **Phản hồi:**
  - `author`: `{ id, username, name, avatarUrl, bannerUrl, bio, publishingSchedule, role, createdAt }`
  - `stats`: `{ followerCount, booksCount, totalReads, averageRating }`
  - `books`: Danh sách các cuốn sách `publishStatus: 'PUBLISHED'` của tác giả, bao gồm thể loại, số chương, rating và lượt xem.

### 3.2. `PATCH /api/authors/[username]`
- **Mục đích:** Cập nhật thông tin tác giả (chỉ chính tác giả hoặc ADMIN).
- **Body:** `{ bio?: string, publishingSchedule?: string, bannerUrl?: string }`
- **Quyền:** Session user `id === author.id` hoặc `role === 'ADMIN'`.

### 3.3. `GET /api/authors/[username]/follow`
- **Mục đích:** Kiểm tra trạng thái theo dõi của user hiện tại.
- **Phản hồi:** `{ isFollowing: boolean, followerCount: number }`

### 3.4. `POST /api/authors/[username]/follow`
- **Mục đích:** Theo dõi tác giả.
- **Điều kiện:** Yêu cầu đăng nhập, không được tự follow chính mình (`user.id !== author.id`).
- **Thực thi:** Tạo bản ghi `AuthorFollow`.

### 3.5. `DELETE /api/authors/[username]/follow`
- **Mục đích:** Hủy theo dõi tác giả.
- **Thực thi:** Xóa bản ghi `AuthorFollow` tương ứng.

### 3.6. `GET /api/notifications`
- **Mục đích:** Lấy danh sách 20 thông báo gần nhất của người dùng hiện tại.
- **Phản hồi:** `{ notifications: Notification[], unreadCount: number }`

### 3.7. `PATCH /api/notifications`
- **Mục đích:** Đánh dấu thông báo đã đọc.
- **Body:** `{ id?: string, markAll?: boolean }`
- **Phản hồi:** `{ success: true }`

### 3.8. Kích hoạt thông báo tự động tại `publish/route.ts`
- Khi xuất bản chương mới hoặc cập nhật chương từ DRAFT sang PUBLISHED:
  - Truy vấn tất cả `followerId` trong `AuthorFollow` với `authorId === user.id`.
  - Nếu có followers: Gọi `prisma.notification.createMany` tạo thông báo:
    - `title`: `Tác giả ${authorName} ra chương mới`
    - `message`: `"${bookTitle}" vừa cập nhật chương ${chapterNumber}: ${chapterTitle}`
    - `link`: `/read/${bookSlug}/${chapterNumber}`

---

## 4. Thiết kế Giao diện Người dùng (UI/UX)

### 4.1. Trang tác giả `/author/[username]`
- **File:** `src/app/author/[username]/page.tsx` & `src/components/author/AuthorProfileClient.tsx`.
- **Thành phần:**
  - Header: Banner nghệ thuật, Avatar, Tên bút danh & Username, Huy hiệu `TÁC GIẢ`.
  - Bộ thẻ chỉ số (Stats Ribbon): Số người theo dõi, Số tác phẩm, Tổng lượt đọc, Điểm đánh giá trung bình.
  - Khối Lịch đăng truyện: Khung nổi bật hiển thị thời gian đăng chương định kỳ của tác giả.
  - Lời tự bạch (Bio): Giới thiệu hành trình sáng tác.
  - Nút Tương tác: "Theo dõi" / "Đang theo dõi" (kèm tooltip nếu chưa đăng nhập). Nút "Chỉnh sửa hồ sơ" nếu là chính tác giả.
  - Danh sách Tác phẩm: Grid hiển thị các bộ truyện đã phát hành với bìa, thể loại, trạng thái ra chương, điểm đánh giá.
  - Modal chỉnh sửa: Cho phép tác giả cập nhật lịch đăng và bio tức thì.

### 4.2. Chuông thông báo trên thanh điều hướng `Navbar`
- **File:** `src/components/layout/NotificationBell.tsx`.
- **Tích hợp:** Đặt cạnh avatar người dùng trong `src/components/layout/Navbar.tsx`.
- **Thành phần:**
  - Icon `Bell` kèm badge đếm số lượng thông báo chưa đọc.
  - Dropdown hiển thị danh sách thông báo với icon, tiêu đề, thời gian tương đối.
  - Click vào thông báo: Tự động đánh dấu đã đọc và điều hướng đến chương truyện tương ứng.
  - Nút thao tác "Đánh dấu tất cả đã đọc".

### 4.3. Liên kết tác giả trên trang chi tiết truyện
- **File:** `src/components/books/BookDetailClient.tsx`.
- Thay tên tác giả dạng text thành `<Link href={`/author/${book.author?.username}`}>` với hiệu ứng gạch chân hover chuẩn typography ZORY.

---

## 5. Rủi ro & Giải pháp

| Rủi ro | Giải pháp |
|---|---|
| Người dùng tự theo dõi chính mình | Kiểm tra `followerId === authorId` tại API và ẩn nút theo dõi trên UI nếu đang xem trang của chính mình. |
| Hiệu năng khi tác giả có hàng nghìn người theo dõi | Sử dụng `prisma.notification.createMany` theo batch không block request chính hoặc thực thi chạy song song. |
| Cơ sở dữ liệu SQLite trong môi trường phát triển | Đồng bộ mô hình trên cả `schema.prisma` và `schema.postgresql.prisma`, sử dụng cú pháp Prisma chuẩn hóa tương thích cả hai DB. |
