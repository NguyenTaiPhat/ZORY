import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-text-primary">
        Điều Khoản Sử Dụng Nền Tảng ZORY
      </h1>
      <p className="text-xs text-text-secondary">Có hiệu lực từ tháng 10 năm 2026</p>

      <div className="prose prose-sm dark:prose-invert space-y-4 text-xs leading-relaxed text-text-secondary">
        <h2 className="text-base font-bold text-text-primary">1. Chấp thuận điều khoản</h2>
        <p>
          Bằng việc truy cập, đăng ký tài khoản hoặc sử dụng bất kỳ dịch vụ nào của ZORY,
          bạn đồng ý tuân thủ toàn bộ các điều khoản và quy định được nêu tại đây.
        </p>

        <h2 className="text-base font-bold text-text-primary">2. Tài khoản và quyền bảo mật</h2>
        <p>
          Người dùng chịu trách nhiệm bảo mật thông tin đăng nhập và các hoạt động phát sinh từ
          tài khoản của mình. Ban quản trị ZORY có quyền khóa hoặc chấm dứt tài khoản có dấu hiệu
          vi phạm an toàn hệ thống.
        </p>

        <h2 className="text-base font-bold text-text-primary">3. Bản quyền tác phẩm</h2>
        <p>
          Mọi tác phẩm do tác giả đăng tải thuộc quyền sở hữu trí tuệ của tác giả tương ứng.
          Nghiêm cấm sao chép, phân phối hoặc khai thác thương mại khi chưa có sự đồng ý bằng văn bản.
        </p>
      </div>
    </div>
  );
}
