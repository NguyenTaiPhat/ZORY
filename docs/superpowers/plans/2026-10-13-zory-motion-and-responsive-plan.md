# ZORY responsive + motion plan

## Mục tiêu

- Mobile không tràn ngang ở 375px, 768px và 1024px.
- Mọi route có một lớp chuyển trang và reveal nhẹ; không làm chậm thao tác đọc hoặc thao tác Studio.
- Hiệu ứng có vai trò rõ: phản hồi click, định hướng khi chuyển route, làm nổi nội dung mới và xác nhận trạng thái.
- Tôn trọng `prefers-reduced-motion` và không thay đổi logic dữ liệu/API.

## Đã triển khai trong đợt này

- Thêm `PageMotion` dùng chung cho toàn bộ route thông qua `PageTransition`.
- Page enter: fade + translate ngắn khi đổi route.
- Section reveal: IntersectionObserver, stagger tối đa 360ms, tự tắt khi phần tử đã xuất hiện.
- Card/cover hover: lift nhẹ, border transition và zoom cover 1.035x.
- Button/link press feedback.
- Mobile hardening: `min-width: 0`, giới hạn media, navbar co đúng, filter tự wrap, form không ép chiều rộng.
- Chuẩn hóa Genres card từ `rounded-2xl` về `rounded-xl` để gần hệ card chung hơn.
- Reduced motion: tắt transform, reveal delay và modal animation.

## Lộ trình hiệu ứng theo khu vực

### Public discovery

- `/`: hero reveal theo hai cột; cover parallax rất nhẹ khi hover; book card stagger theo lưới; CTA có press state.
- `/explore`: filter panel slide/fade khi đổi query; card grid stagger; pagination active transition.
- `/genres`, `/genres/[slug]`: card reveal; arrow nudge khi hover; empty state fade-in.
- `/book/[slug]`: cover reveal; metadata strip stagger; chapter list highlight khi hover; rating/comment feedback.
- `/listen`, `/listen/[bookSlug]`: player progress transition; album/card hover; loading state bằng shimmer.

### Account and utility

- `/login`, `/register`: form enter, field focus ring, validation error shake rất ngắn, submit loading state.
- `/profile`, `/library`: quota/progress bars animate từ 0 tới giá trị thật; card list reveal.
- `/privacy`, `/terms`, `/ai-policy`, `/report`: heading/section reveal theo thứ tự đọc, không animation liên tục.
- `/not-found`: illustration/empty state fade + CTA lift.

### Reading experience

- `/read/[bookSlug]/[chapterNumber]`: ưu tiên ổn định; chỉ dùng toolbar fade, progress width transition, drawer slide-in và reaction pop.
- Story tree, inline comments, branching choices: overlay fade + panel slide; focus trap và Escape cần được kiểm tra riêng.
- Không dùng parallax, zoom cover hoặc stagger trong thân văn bản để tránh gây mỏi mắt.

### Studio and admin

- `/studio`, `/studio/new`, `/studio/[projectId]`: workspace shell reveal; tab underline transition; save/generate success feedback; modal scale/fade; list card hover.
- Lorebook, character graph, cover picker: node/card selection transition; modal/drawer animation; loading shimmer khi AI đang xử lý.
- `/admin/*`: table row hover, modal enter, status badge transition, progress bar; giữ mật độ dữ liệu cao và tránh stagger dài.

## Quy tắc animation

- Page/section: 420–600ms, cubic-bezier `0.22, 1, 0.36, 1`.
- Hover: 180–240ms.
- Modal/drawer: 180–260ms.
- Không animate layout gây nhảy chiều cao; ưu tiên `opacity`, `transform`, `border-color`, `background-color`.
- Không dùng animation vô hạn ngoài trạng thái đang xử lý hoặc audio đang phát.
- Mỗi màn tối đa một điểm nhấn chuyển động chính.

## Kiểm thử trước khi deploy

- Chrome mobile: 375, 390, 768, 1024px; kiểm tra `scrollWidth === clientWidth`.
- Desktop: 1280, 1440, 1920px.
- Light/dark mode.
- `prefers-reduced-motion: reduce`.
- Keyboard: Tab, Enter, Escape, focus visible trên menu, modal, drawer, form.
- Route matrix: `/`, `/explore`, `/genres`, `/book/*`, `/listen`, `/login`, `/register`, `/library`, `/studio`, `/read/*`, `/admin/*`.
- Kiểm tra loading, empty, error và data-filled state.

## Việc còn lại sau baseline

1. Thêm `motion-modal-in` vào các modal/drawer hiện đang dùng class animation rải rác.
2. Chuẩn hóa focus ring và minimum hit area 40px cho icon button trên mobile.
3. Thêm progress-bar animation cho profile, audio và quota.
4. Chụp regression screenshots cho public routes ở desktop/mobile.
5. Chạy build/lint và rà lại bundle để bảo đảm không thêm thư viện animation nặng.
