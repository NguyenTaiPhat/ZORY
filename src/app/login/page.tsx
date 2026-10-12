'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Đăng Nhập | ZORY';
    }
  }, []);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Đăng nhập không thành công');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-surface p-8 sm:p-10 border border-border">
      {/* Header */}
      <div className="space-y-1 text-center">
        <span className="label-caps">ZORY • THÀNH VIÊN</span>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary mt-1">
          Đăng Nhập Tài Khoản
        </h1>
        <p className="text-xs text-text-secondary">
          Truy cập kho văn học số và không gian sáng tác đồng hành cùng AI
        </p>
      </div>


      {error && (
        <div className="p-3 border border-error/40 bg-error/10 text-error text-xs font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="label-caps">
            EMAIL HOẶC TÊN NGƯỜI DÙNG
          </label>
          <div className="relative">
            <User className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-text-secondary" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="email@example.com"
              className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-primary"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="label-caps">
            MẬT KHẨU
          </label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-text-secondary" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-primary"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-text-primary text-background hover:bg-primary hover:text-white text-xs font-mono border border-border transition disabled:opacity-40"
        >
          {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP VÀO HỆ THỐNG'}
        </button>
      </form>

      <div className="text-center text-xs font-mono text-text-secondary pt-4 border-t border-border">
        <span>Chưa có hồ sơ độc giả? </span>
        <Link
          href="/register"
          className="text-primary hover:underline font-bold"
        >
          Đăng ký mới →
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs font-mono text-text-secondary">ĐANG TẢI BIỂU MẪU...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
