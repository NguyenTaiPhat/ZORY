import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-text-primary">
        Chính Sách Quyền Riêng Tư ZORY
      </h1>
      <p className="text-xs text-text-secondary">Có hiệu lực từ tháng 10 năm 2026</p>

      <div className="space-y-4 text-xs leading-relaxed text-text-secondary">
        <h2 className="text-base font-bold text-text-primary">1. Thu thập dữ liệu</h2>
        <p>
          ZORY chỉ thu thập các thông tin tối thiểu cần thiết để vận hành dịch vụ đọc truyện,
          lưu tiến độ đọc và cung cấp tài nguyên AI Studio (như email, tên hiển thị, tiến độ đọc).
        </p>

        <h2 className="text-base font-bold text-text-primary">2. Bảo vệ thông tin</h2>
        <p>
          Mọi mật khẩu đều được băm bảo mật bằng thuật toán Bcrypt. Chúng tôi không chia sẻ
          thông tin cá nhân của bạn với bất kỳ bên thứ ba nào vì mục đích quảng cáo thương mại.
        </p>

        <h2 className="text-base font-bold text-text-primary">3. Bản quyền tác phẩm riêng tư</h2>
        <p>
          Các bản nháp trong AI Studio được bảo mật riêng tư tuyệt đối cho tác giả cho đến khi
          bạn chủ động xuất bản.
        </p>
      </div>
    </div>
  );
}
