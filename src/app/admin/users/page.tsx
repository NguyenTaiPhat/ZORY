'use client';

import React, { useState, useEffect } from 'react';
import { formatDateVi } from '@/lib/utils';
import { Coins, Plus, RefreshCw, X, Check, Shield } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State Modal Nạp Token
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [tokenAmount, setTokenAmount] = useState<number>(50000);
  const [resetUsed, setResetUsed] = useState<boolean>(false);
  const [submittingToken, setSubmittingToken] = useState<boolean>(false);
  const [tokenSuccessMsg, setTokenSuccessMsg] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.users) setUsers(data.users);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role } : u))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBan = async (userId: string, currentBan: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isBanned: !currentBan }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isBanned: !currentBan } : u))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenTokenModal = (user: any) => {
    setSelectedUser(user);
    setTokenAmount(50000);
    setResetUsed(false);
    setTokenSuccessMsg(null);
  };

  const handleCloseTokenModal = () => {
    setSelectedUser(null);
    setSubmittingToken(false);
    setTokenSuccessMsg(null);
  };

  const handleAddTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmittingToken(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          addTokens: Number(tokenAmount) || 0,
          resetUsed,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id === selectedUser.id) {
              return {
                ...u,
                aiTokensQuota: data.user.aiTokensQuota,
                aiTokensUsed: data.user.aiTokensUsed,
              };
            }
            return u;
          })
        );
        setTokenSuccessMsg(`Đã cập nhật thành công cho @${selectedUser.username}!`);
        setTimeout(() => {
          handleCloseTokenModal();
        }, 1200);
      } else {
        alert(data.error || 'Có lỗi xảy ra khi nạp token');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setSubmittingToken(false);
    }
  };

  return (
    <div className="border border-border bg-surface p-4 sm:p-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="label-caps text-[10px] sm:text-xs">DANH BẠ THÀNH VIÊN TOÀN NỀN TẢNG</span>
          <h2 className="font-serif text-lg sm:text-xl font-bold text-text-primary mt-0.5">
            Quản Lý Thành Viên ({users.length})
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs font-mono text-text-secondary">ĐANG TẢI DỮ LIỆU...</div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[720px] text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-text-secondary uppercase">
                <th className="py-3 px-3">NGƯỜI DÙNG</th>
                <th className="py-3 px-3">EMAIL</th>
                <th className="py-3 px-3">VAI TRÒ</th>
                <th className="py-3 px-3">AI TOKENS</th>
                <th className="py-3 px-3">TRẠNG THÁI</th>
                <th className="py-3 px-3">NGÀY GIA NHẬP</th>
                <th className="py-3 px-3 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => {
                const isAdminUser = u.role === 'ADMIN';
                return (
                  <tr key={u.id} className="hover:bg-surface-elevated transition">
                    <td className="py-3 px-3">
                      <span className="font-bold text-text-primary block">
                        {u.name || u.username}
                      </span>
                      <span className="text-[11px] text-text-secondary opacity-70">@{u.username}</span>
                    </td>
                    <td className="py-3 px-3 text-text-secondary">{u.email}</td>
                    <td className="py-3 px-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="p-1 bg-surface-elevated border border-border text-[11px] font-mono text-text-primary focus:outline-none"
                      >
                        <option value="USER">USER</option>
                        <option value="AUTHOR">AUTHOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      {isAdminUser ? (
                        <span className="font-bold text-emerald-500 inline-flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          VÔ HẠN (∞)
                        </span>
                      ) : (
                        <span className="text-text-secondary">
                          {u.aiTokensUsed.toLocaleString()} / {u.aiTokensQuota.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {u.isBanned ? (
                        <span className="px-2 py-0.5 text-[10px] border border-red-500/40 text-red-600 bg-red-500/10">
                          ĐÃ KHÓA
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] border border-emerald-500/40 text-emerald-600 bg-emerald-500/10">
                          HOẠT ĐỘNG
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-text-secondary">{formatDateVi(u.createdAt)}</td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenTokenModal(u)}
                        className="px-2.5 py-1 text-[11px] font-mono border border-primary/40 text-primary bg-primary/10 hover:bg-primary hover:text-white transition inline-flex items-center gap-1"
                      >
                        <Coins className="w-3 h-3" />
                        + TOKEN
                      </button>
                      <button
                        onClick={() => handleToggleBan(u.id, u.isBanned)}
                        className={`px-2.5 py-1 text-[11px] font-mono border transition ${
                          u.isBanned
                            ? 'bg-text-primary text-background hover:bg-primary hover:text-white border-border'
                            : 'border-border hover:border-error hover:text-error text-text-secondary'
                        }`}
                      >
                        {u.isBanned ? 'MỞ KHÓA' : 'KHÓA'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL NẠP TOKEN */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface border border-border max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                <h3 className="font-serif text-lg font-bold text-text-primary">
                  Cấp Thêm Token AI
                </h3>
              </div>
              <button
                onClick={handleCloseTokenModal}
                className="p-1 text-text-secondary hover:text-text-primary transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {tokenSuccessMsg ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center gap-2 font-mono text-xs">
                <Check className="w-4 h-4 shrink-0" />
                <span>{tokenSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleAddTokens} className="space-y-4 font-mono text-xs">
                {/* Thông tin người dùng */}
                <div className="p-3 bg-surface-elevated border border-border space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Người dùng:</span>
                    <span className="font-bold text-text-primary">
                      {selectedUser.name || selectedUser.username} (@{selectedUser.username})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Định mức hiện tại:</span>
                    <span className="text-text-primary font-bold">
                      {selectedUser.role === 'ADMIN'
                        ? 'Vô hạn (∞)'
                        : `${selectedUser.aiTokensQuota.toLocaleString()} tokens`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Đã tiêu thụ:</span>
                    <span className="text-text-secondary">
                      {selectedUser.aiTokensUsed.toLocaleString()} tokens
                    </span>
                  </div>
                </div>

                {/* Chọn số token cộng thêm */}
                <div className="space-y-2">
                  <label className="block text-text-secondary font-bold">
                    SỐ TOKEN CỘNG THÊM VÀO HẠN MỨC (QUOTA):
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[10000, 50000, 100000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTokenAmount(amt)}
                        className={`py-1.5 text-center border text-[11px] transition ${
                          tokenAmount === amt
                            ? 'bg-primary text-white border-primary font-bold'
                            : 'border-border bg-surface-elevated hover:border-primary/50 text-text-primary'
                        }`}
                      >
                        +{amt >= 1000 ? `${amt / 1000}k` : amt}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Nhập số token..."
                    className="w-full p-2 bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-primary text-xs"
                  />
                  <div className="text-[11px] text-text-secondary flex justify-between">
                    <span>Hạn mức mới sau khi cộng:</span>
                    <span className="font-bold text-primary">
                      {selectedUser.role === 'ADMIN'
                        ? 'Vô hạn (∞)'
                        : `${(selectedUser.aiTokensQuota + Number(tokenAmount)).toLocaleString()} tokens`}
                    </span>
                  </div>
                </div>

                {/* Tùy chọn Reset lượt đã dùng */}
                <div className="pt-2 border-t border-border">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={resetUsed}
                      onChange={(e) => setResetUsed(e.target.checked)}
                      className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                    />
                    <span className="text-text-primary">
                      Đặt lại số token đã dùng về 0 (Khôi phục toàn bộ hạn mức)
                    </span>
                  </label>
                </div>

                {/* Nút hành động */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseTokenModal}
                    className="px-4 py-2 border border-border text-text-secondary hover:text-text-primary transition"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    disabled={submittingToken}
                    className="px-5 py-2 bg-primary text-white hover:bg-primary/90 font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingToken ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ĐANG LƯU...
                      </>
                    ) : (
                      'XÁC NHẬN NẠP'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
