# Kế Hoạch Triển Khai: Logo Thương Hiệu ZORY & Bộ Asset Xuất App (PWA)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng logo thương hiệu ZORY (Vector SVG & React component), tích hợp vào giao diện Navbar/Footer và tạo toàn bộ asset PWA (Favicon, Apple Touch Icon, Android Launcher 192/512, manifest.json) phục vụ cài đặt app.

**Architecture:** Sử dụng Vector SVG với hệ màu Midnight Literary (Obsidian, Gold hoàng gia, Cyber Violet) làm gốc; tạo script xuất tự động sang PNG đa kích thước (180x180, 192x192, 512x512); cấu hình Web App Manifest chuẩn W3C PWA trong Next.js 15 App Router.

**Tech Stack:** Next.js 15, React 19, TypeScript, SVG, HTML5 Canvas / Sharp / Node buffer, W3C Web App Manifest.

## Global Constraints
- Nền tảng: Next.js 15 App Router, React 19.
- Thư mục asset công khai: `public/`.
- Màu chủ đạo: `#F59E0B` (Amber gold), `#8B5CF6` (Violet nebula), `#0B0A0F` (Midnight obsidian).
- Mọi hình ảnh/icon cho App phải đúng tỷ lệ 1:1, hỗ trợ maskable icon.

---

### Task 1: Thiết Kế Vector SVG Logo Gốc & Favicon

**Files:**
- Create: `public/logo.svg`
- Create: `public/favicon.svg`

**Interfaces:**
- Produces: Vector SVG brandmark với viewBox `0 0 512 512` và gradient IDs chuẩn.

- [ ] **Step 1: Viết test xác minh file SVG tồn tại và hợp lệ**

Tạo `tests/unit/logo-svg.test.ts`:
```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('1.1. SVG Assets: public/logo.svg và public/favicon.svg phải tồn tại và chứa thẻ svg hợp lệ', () => {
  assert.ok(fs.existsSync('public/logo.svg'), 'public/logo.svg phải tồn tại');
  assert.ok(fs.existsSync('public/favicon.svg'), 'public/favicon.svg phải tồn tại');

  const content = fs.readFileSync('public/logo.svg', 'utf-8');
  assert.ok(content.includes('<svg'), 'Phải chứa thẻ <svg');
  assert.ok(content.includes('viewBox'), 'Phải có viewBox');
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại trước khi tạo file**

Run: `npx tsx --test tests/unit/logo-svg.test.ts`  
Expected: FAIL (file not found).

- [ ] **Step 3: Tạo file `public/logo.svg` và `public/favicon.svg`**

Tạo `public/logo.svg` (512x512) với hình ảnh chữ Z trang sách mở, vệt ngân hà và ngôi sao AI 4 cánh.  
Tạo `public/favicon.svg` với phiên bản tối ưu kích thước nhỏ gọn.

- [ ] **Step 4: Chạy lại test để xác nhận pass**

Run: `npx tsx --test tests/unit/logo-svg.test.ts`  
Expected: PASS.

---

### Task 2: Xây Dựng Component React `Logo` Đa Biến Thể

**Files:**
- Create: `src/components/brand/Logo.tsx`
- Test: `tests/unit/logo-component.test.ts`

**Interfaces:**
- Produces: `export function Logo(props: LogoProps): JSX.Element`
- `LogoProps`: `{ variant?: 'symbol' | 'horizontal' | 'vertical', size?: 'sm' | 'md' | 'lg' | 'xl', showTagline?: boolean, className?: string }`

- [ ] **Step 1: Viết test cho component Logo**

Tạo `tests/unit/logo-component.test.ts`:
```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('2.1. Component Logo: src/components/brand/Logo.tsx phải export function Logo', () => {
  const content = fs.readFileSync('src/components/brand/Logo.tsx', 'utf-8');
  assert.ok(content.includes('export function Logo'), 'Phải export function Logo');
  assert.ok(content.includes('variant'), 'Phải hỗ trợ variant');
});
```

- [ ] **Step 2: Tạo component `src/components/brand/Logo.tsx`**

Hỗ trợ các biến thể `symbol`, `horizontal`, `vertical`, và kích cỡ `sm` (24px), `md` (32px), `lg` (48px), `xl` (64px).

- [ ] **Step 3: Chạy test để xác nhận pass**

Run: `npx tsx --test tests/unit/logo-component.test.ts`  
Expected: PASS.

---

### Task 3: Tạo Bộ Icon PNG Chuẩn PWA & Mobile App

**Files:**
- Create: `public/icon-192.png` (192x192)
- Create: `public/icon-512.png` (512x512)
- Create: `public/apple-touch-icon.png` (180x180)
- Create: `public/favicon.ico`
- Script: `scripts/generate-icons.js`

**Interfaces:**
- Produces: Bộ ảnh nhị phân PNG chuẩn kích thước và Magic Bytes PNG `89 50 4E 47`.

- [ ] **Step 1: Viết test kiểm tra kích thước và định dạng binary các file icon**

Tạo `tests/unit/pwa-icons.test.ts`:
```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('3.1. PWA Icons: Các file icon 192, 512, apple-touch-icon phải tồn tại và là ảnh PNG hợp lệ', () => {
  const files = ['public/icon-192.png', 'public/icon-512.png', 'public/apple-touch-icon.png'];
  for (const f of files) {
    assert.ok(fs.existsSync(f), `${f} phải tồn tại`);
    const buf = fs.readFileSync(f);
    assert.ok(buf.length > 500, `${f} không được rỗng`);
    // Kiểm tra Magic Bytes PNG (89 50 4E 47)
    assert.strictEqual(buf[0], 0x89);
    assert.strictEqual(buf[1], 0x50);
    assert.strictEqual(buf[2], 0x4E);
    assert.strictEqual(buf[3], 0x47);
  }
});
```

- [ ] **Step 2: Viết script `scripts/generate-icons.js` tạo PNG từ SVG hoặc Canvas nhị phân**

Tạo script render logo ra các kích cỡ 192x192, 512x512, 180x180, và copy favicon.ico.  
Chạy lệnh: `node scripts/generate-icons.js`.

- [ ] **Step 3: Chạy test để xác nhận pass**

Run: `npx tsx --test tests/unit/pwa-icons.test.ts`  
Expected: PASS.

---

### Task 4: Cấu Hình Web App Manifest & Cập Nhật Layout Metadata

**Files:**
- Create: `public/manifest.json`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: Endpoint `/manifest.json` chuẩn PWA, thẻ `<link rel="manifest">` và icons trong HTML metadata.

- [ ] **Step 1: Viết test kiểm tra manifest.json**

Tạo `tests/unit/manifest.test.ts`:
```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('4.1. Manifest: public/manifest.json phải chứa đầy đủ cấu hình PWA', () => {
  assert.ok(fs.existsSync('public/manifest.json'), 'manifest.json phải tồn tại');
  const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf-8'));
  assert.strictEqual(manifest.short_name, 'ZORY');
  assert.strictEqual(manifest.display, 'standalone');
  assert.ok(manifest.icons && manifest.icons.length >= 2, 'Phải có danh sách icons');
});
```

- [ ] **Step 2: Tạo `public/manifest.json` và cập nhật `src/app/layout.tsx`**

Khai báo metadata:
```typescript
export const metadata: Metadata = {
  // ...
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ZORY',
  },
};
```

- [ ] **Step 3: Chạy test để xác nhận pass**

Run: `npx tsx --test tests/unit/manifest.test.ts`  
Expected: PASS.

---

### Task 5: Tích Hợp Logo Vào Navbar & Footer

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/layout/Footer.tsx`

**Interfaces:**
- Navbar: Thay thế text trơn bằng `<Logo variant="horizontal" size="md" />`.
- Footer: Thêm `<Logo variant="horizontal" size="lg" />` ở đầu phần thông tin thương hiệu.

- [ ] **Step 1: Viết test kiểm tra tích hợp Logo trong layout**

Tạo `tests/unit/layout-logo.test.ts`:
```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('5.1. Layout: Navbar và Footer phải sử dụng component Logo', () => {
  const navbarContent = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf-8');
  assert.ok(navbarContent.includes('<Logo') || navbarContent.includes('Logo'), 'Navbar phải import và dùng Logo');

  const footerContent = fs.readFileSync('src/components/layout/Footer.tsx', 'utf-8');
  assert.ok(footerContent.includes('<Logo') || footerContent.includes('Logo'), 'Footer phải import và dùng Logo');
});
```

- [ ] **Step 2: Cập nhật `src/components/layout/Navbar.tsx` và `src/components/layout/Footer.tsx`**

- [ ] **Step 3: Chạy test để xác nhận pass**

Run: `npx tsx --test tests/unit/layout-logo.test.ts`  
Expected: PASS.

- [ ] **Step 4: Chạy toàn bộ test suites của hệ thống**

Run: `npx tsx tests/security/run-security-suite.ts`  
Expected: 48/48 security tests passed, zero regressions.
