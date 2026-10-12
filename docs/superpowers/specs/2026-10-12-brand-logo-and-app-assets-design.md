# Tài Liệu Thiết Kế: Logo Thương Hiệu ZORY & Bộ Asset Xuất Sang App (PWA)

- **Dự án:** ZORY Platform
- **Ngày lập:** 12/10/2026
- **Trạng thái:** Đã phê duyệt (Approved)

---

## 1. Mục Tiêu & Yêu Cầu

### 1.1 Mục tiêu
Tạo bộ nhận diện thương hiệu hình ảnh (Logo & Icon) chuyên nghiệp, cao cấp cho nền tảng văn học AI ZORY, đồng thời chuẩn bị đầy đủ bộ asset để người dùng có thể "Cài đặt ứng dụng" (PWA Add to Home Screen) hoặc đóng gói ứng dụng di động (Capacitor/Cordova/Electron/TWA) từ nền tảng web.

### 1.2 Yêu cầu chi tiết
1. **Logo Vector SVG Web & App Icon (Thick Rounded AI Glyph):**
   - Biểu tượng chữ **Z dày bản (bold/thick glyph)**, các góc gấp và hai đầu mút được **bo tròn mềm mại (rounded joins & rounded caps)**, kết nối liền mạch mang phong cách ứng dụng AI hiện đại.
   - Nền: **Trắng tinh khôi (#FFFFFF)** chuẩn iOS Squircle với bóng đổ mềm mại, viền bo tròn góc chuẩn App Store.
   - Dải màu: Gradient quang phổ AI rực rỡ (Sunset Amber `#F59E0B` -> Neon Coral `#F43F5E` -> Vivid Purple `#A855F7` -> Deep Indigo `#6366F1` -> Electric Cyan `#06B6D4`) kết hợp dải phản quang 3D căng bóng.
   - **Ngôi sao AI bo tròn (Rounded AI Sparkle):** 4 cánh cong uốn lượn với các đầu cánh bo tròn mềm mại (phong cách Gemini / Galaxy AI) ở góc trên bên phải, điểm xuyết ánh sao xanh ở góc dưới đối xứng.
   - **Chữ thương hiệu ZORY:** Kiểu chữ dày dặn (`font-black`, `tracking-[0.14em]`) chắc khỏe và đẳng cấp.
   - Component React `src/components/brand/Logo.tsx` hỗ trợ kích thước tùy biến, các biến thể hiển thị (`symbol`, `horizontal`, `vertical`).
   - Tích hợp vào `src/components/layout/Navbar.tsx` và `src/components/layout/Footer.tsx`.
2. **Bộ Asset Xuất Sang App (PWA & Mobile App):**
   - `public/favicon.svg`: Vector icon nền sáng cho trình duyệt hiện đại.
   - `public/favicon.ico`: Favicon 32x32 tương thích.
   - `public/apple-touch-icon.png`: 180x180 px chuẩn bo góc iOS Home Screen nền trắng sạch sẽ.
   - `public/icon-192.png`: 192x192 px chuẩn Android Home Screen & PWA launcher.
   - `public/icon-512.png`: 512x512 px chuẩn Splash Screen & đóng gói Store.
   - `public/manifest.json`: Web App Manifest đầy đủ cấu hình `standalone`.
   - Cập nhật metadata trong `src/app/layout.tsx`.

---

## 2. Kiến Trúc & Thiết Kế Thành Phần

### 2.1 Cấu trúc SVG Biểu Tượng (Thick Rounded AI Z)
Biểu tượng gồm:
- **Nền Squircle Trắng:** Bo góc `rx="116"`, đổ bóng ambient `rgba(15, 23, 42, 0.08)`.
- **Chữ Z dày bo góc:** Nét vẽ 66px với `stroke-linecap="round"` và `stroke-linejoin="round"`, đổ bóng 3D tím neon `rgba(168, 85, 247, 0.22)`.
- **Ngôi sao AI bo tròn:** 4 cánh parabol bo tròn mềm mại chuẩn AI branding quốc tế.
- **Tầng 3 (Ngôi sao Quasar AI):** Một ngôi sao 4 cánh mạ vàng phát sáng ở góc trên bên phải, biểu thị trí tuệ nhân tạo soi sáng ngòi bút sáng tác.

### 2.2 Component `src/components/brand/Logo.tsx`
- Props:
  - `variant?: 'symbol' | 'horizontal' | 'vertical'` (mặc định: `'horizontal'`)
  - `size?: 'sm' | 'md' | 'lg' | 'xl'` (mặc định: `'md'`)
  - `showTagline?: boolean` (hiển thị dòng chữ 'Literary AI')
  - `className?: string`

### 2.3 Web App Manifest (`public/manifest.json`)
```json
{
  "name": "ZORY — Stories Beyond Imagination",
  "short_name": "ZORY",
  "description": "Nền tảng đọc truyện trực tuyến và sáng tác văn học cùng AI",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0B0A0F",
  "theme_color": "#0B0A0F",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ]
}
```

---

## 3. Kế Hoạch Triển Khai

1. **Bước 1:** Tạo file SVG Logo chuẩn tại `public/logo.svg` và `public/favicon.svg`.
2. **Bước 2:** Tạo component React `src/components/brand/Logo.tsx` sử dụng vector SVG sạch, hỗ trợ dark/light mode và các biến thể.
3. **Bước 3:** Tạo bộ file icon kích thước chuẩn app (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.ico`) trong `public/`.
4. **Bước 4:** Tạo `public/manifest.json` chuẩn PWA.
5. **Bước 5:** Cập nhật `src/app/layout.tsx` (thêm metadata `manifest`, `icons`, `appleWebApp`).
6. **Bước 6:** Tích hợp `Logo` vào `src/components/layout/Navbar.tsx` và `src/components/layout/Footer.tsx`.
7. **Bước 7:** Kiểm thử hiển thị trên trình duyệt và kiểm tra file manifest hợp lệ.
