'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Đăng Ký Tài Khoản | ZORY';
    }
  }, []);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, name, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Đăng ký không thành công');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md min-w-0 space-y-6 bg-surface p-6 sm:p-10 border border-border overflow-hidden">
        <div className="text-center space-y-1">
          <span className="label-caps">GIA NHẬP ZORY</span>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-text-primary mt-1 break-words">
            Đăng Ký Hồ Sơ Độc Giả
          </h1>
          <p className="text-xs text-text-secondary">
            Khám phá tinh hoa văn học và kích hoạt quyền năng sáng tác AI Studio
          </p>
        </div>

        {error && (
          <div className="p-3 border border-error/40 bg-error/10 text-error text-xs font-sans">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div className="space-y-1">
            <label className="label-caps">
              HỌ VÀ TÊN
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full p-2.5 bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-primary text-xs font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="label-caps">
              TÊN ĐĂNG NHẬP *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="nguyenvana"
              className="w-full p-2.5 bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-primary text-xs font-sans"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="label-caps">
              ĐỊA CHỈ EMAIL *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nguyenvana@gmail.com"
              className="w-full p-2.5 bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-primary text-xs font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="label-caps">
                MẬT KHẨU *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-primary text-xs font-sans"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="label-caps">
                XÁC NHẬN MẬT KHẨU *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-primary text-xs font-sans"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-text-primary text-background hover:bg-primary hover:text-white text-xs font-sans font-bold border border-border transition disabled:opacity-40 mt-2"
          >
            {loading ? 'ĐANG TẠO HỒ SƠ...' : 'HOÀN TẤT ĐĂNG KÝ HỒ SƠ'}
          </button>
        </form>

        <div className="text-center text-xs font-sans text-text-secondary pt-3 border-t border-border">
          <span>Đã có tài khoản ZORY? </span>
          <Link
            href="/login"
            className="text-primary hover:underline font-bold"
          >
            Đăng nhập ngay →
          </Link>
        </div>
      </div>
    </div>
  );
}
