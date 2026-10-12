'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Activity,
  FolderPlus,
  Zap,
  SlidersHorizontal,
  FolderKanban,
  RotateCw,
} from 'lucide-react';

interface Album {
  id: string;
  name: string;
  monthKey: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    keys: number;
  };
}

interface ApiKeyItem {
  id: string;
  albumId: string;
  name: string;
  provider: string;
  rawKey: string;
  maskedKey: string;
  isActive: boolean;
  status: 'ACTIVE' | 'RATE_LIMITED' | 'INVALID' | 'UNTESTED';
  requestCount: number;
  successCount: number;
  errorCount: number;
  lastUsedAt: string | null;
  lastTestedAt: string | null;
  lastLatencyMs: number | null;
  lastError: string | null;
  album: {
    id: string;
    name: string;
    monthKey: string;
    isActive: boolean;
  };
}

interface Stats {
  totalKeys: number;
  activeKeys: number;
  totalRequests: number;
  totalSuccess: number;
  totalErrors: number;
  avgLatency: number;
  healthRatio: number;
}

export default function AdminApiKeysPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('all');
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalKeys: 0,
    activeKeys: 0,
    totalRequests: 0,
    totalSuccess: 0,
    totalErrors: 0,
    avgLatency: 0,
    healthRatio: 100,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [batchTesting, setBatchTesting] = useState<boolean>(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [revealedKeyIds, setRevealedKeyIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [showAddKeyModal, setShowAddKeyModal] = useState<boolean>(false);
  const [showAddAlbumModal, setShowAddAlbumModal] = useState<boolean>(false);

  // Add Key Form state
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');
  const [formAlbumId, setFormAlbumId] = useState<string>('');
  const [formProvider, setFormProvider] = useState<string>('gemini');
  const [formKeyName, setFormKeyName] = useState<string>('');
  const [formKeyValue, setFormKeyValue] = useState<string>('');
  const [formBulkKeys, setFormBulkKeys] = useState<string>('');
  const [formAutoTest, setFormAutoTest] = useState<boolean>(true);
  const [isSubmittingKey, setIsSubmittingKey] = useState<boolean>(false);
  const [preTestResult, setPreTestResult] = useState<any>(null);
  const [isPreTesting, setIsPreTesting] = useState<boolean>(false);

  // Add Album Form state
  const [newAlbumName, setNewAlbumName] = useState<string>('');
  const [newAlbumMonth, setNewAlbumMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [newAlbumDesc, setNewAlbumDesc] = useState<string>('');
  const [isSubmittingAlbum, setIsSubmittingAlbum] = useState<boolean>(false);

  // Nạp dữ liệu
  const loadData = async (albumId = selectedAlbumId) => {
    setLoading(true);
    try {
      const url =
        albumId === 'all'
          ? '/api/admin/keys'
          : `/api/admin/keys?albumId=${encodeURIComponent(albumId)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && !data.error) {
        setAlbums(data.albums || []);
        setKeys(data.keys || []);
        if (data.stats) setStats(data.stats);

        // Thiết lập default album cho form nếu chưa chọn
        if (data.albums && data.albums.length > 0 && !formAlbumId) {
          setFormAlbumId(data.albums[0].id);
        }
      }
    } catch (err) {
      console.error('Lỗi tải API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedAlbumId);
  }, [selectedAlbumId]);

  // Test một key lẻ
  const handleTestKey = async (keyId: string) => {
    setTestingKeyId(keyId);
    try {
      const res = await fetch('/api/admin/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      });
      const data = await res.json();
      if (data && data.success && data.key) {
        setKeys((prev) =>
          prev.map((k) =>
            k.id === keyId
              ? {
                  ...k,
                  status: data.key.status,
                  lastLatencyMs: data.key.lastLatencyMs,
                  lastTestedAt: data.key.lastTestedAt,
                  lastError: data.key.lastError,
                }
              : k
          )
        );
      }
    } catch (err) {
      console.error('Lỗi kiểm tra key:', err);
    } finally {
      setTestingKeyId(null);
    }
  };

  // Test toàn bộ keys trong album đang chọn
  const handleBatchTestAlbum = async () => {
    if (selectedAlbumId === 'all') {
      alert('Vui lòng chọn một Album cụ thể để kiểm tra toàn bộ.');
      return;
    }
    setBatchTesting(true);
    try {
      const res = await fetch('/api/admin/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: selectedAlbumId }),
      });
      const data = await res.json();
      if (data && data.success) {
        await loadData(selectedAlbumId);
      }
    } catch (err) {
      console.error('Lỗi kiểm tra album:', err);
    } finally {
      setBatchTesting(false);
    }
  };

  // Thử nghiệm nhanh một key trước khi lưu (Pre-test)
  const handlePreTest = async () => {
    if (!formKeyValue.trim()) return;
    setIsPreTesting(true);
    setPreTestResult(null);
    try {
      const res = await fetch('/api/admin/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawKey: formKeyValue.trim(),
          provider: formProvider,
        }),
      });
      const data = await res.json();
      if (data && data.result) {
        setPreTestResult(data.result);
      }
    } catch (err) {
      console.error('Lỗi pre-test:', err);
    } finally {
      setIsPreTesting(false);
    }
  };

  // Bật/tắt trạng thái Active của key
  const handleToggleKeyActive = async (keyId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setKeys((prev) =>
          prev.map((k) => (k.id === keyId ? { ...k, isActive: !current } : k))
        );
      }
    } catch (err) {
      console.error('Lỗi toggle key:', err);
    }
  };

  // Bật/tắt Album Active
  const handleToggleAlbumActive = async (albumId: string, current: boolean) => {
    try {
      const res = await fetch('/api/admin/keys/albums', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: albumId, isActive: !current }),
      });
      if (res.ok) {
        setAlbums((prev) =>
          prev.map((a) => (a.id === albumId ? { ...a, isActive: !current } : a))
        );
      }
    } catch (err) {
      console.error('Lỗi toggle album:', err);
    }
  };

  // Xóa key
  const handleDeleteKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khóa "${keyName}" không?`)) return;
    try {
      const res = await fetch(`/api/admin/keys/${keyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== keyId));
      }
    } catch (err) {
      console.error('Lỗi xóa key:', err);
    }
  };

  // Tạo Album mới
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    setIsSubmittingAlbum(true);
    try {
      const res = await fetch('/api/admin/keys/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAlbumName.trim(),
          monthKey: newAlbumMonth.trim(),
          description: newAlbumDesc.trim(),
        }),
      });
      const data = await res.json();
      if (data && data.success && data.album) {
        setAlbums((prev) => [data.album, ...prev]);
        setSelectedAlbumId(data.album.id);
        setShowAddAlbumModal(false);
        setNewAlbumName('');
        setNewAlbumDesc('');
      }
    } catch (err) {
      console.error('Lỗi tạo album:', err);
    } finally {
      setIsSubmittingAlbum(false);
    }
  };

  // Thêm API key (Single / Bulk)
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAlbumId) {
      alert('Vui lòng chọn một Album theo tháng!');
      return;
    }
    setIsSubmittingKey(true);
    try {
      const payload: any = {
        albumId: formAlbumId,
        provider: formProvider,
        autoTest: formAutoTest,
      };

      if (addMode === 'single') {
        if (!formKeyValue.trim()) {
          alert('Vui lòng nhập API Key!');
          setIsSubmittingKey(false);
          return;
        }
        payload.key = formKeyValue.trim();
        payload.name = formKeyName.trim();
      } else {
        if (!formBulkKeys.trim()) {
          alert('Vui lòng dán danh sách API key!');
          setIsSubmittingKey(false);
          return;
        }
        payload.keysText = formBulkKeys.trim();
        payload.name = formKeyName.trim();
      }

      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data && data.success) {
        setShowAddKeyModal(false);
        setFormKeyValue('');
        setFormBulkKeys('');
        setFormKeyName('');
        setPreTestResult(null);
        await loadData(selectedAlbumId);
      } else {
        alert(data.error || 'Có lỗi xảy ra khi thêm khóa');
      }
    } catch (err) {
      console.error('Lỗi lưu key:', err);
    } finally {
      setIsSubmittingKey(false);
    }
  };

  // Copy key vào clipboard
  const handleCopyKey = (keyId: string, rawKey: string) => {
    navigator.clipboard.writeText(rawKey);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const toggleRevealKey = (keyId: string) => {
    setRevealedKeyIds((prev) => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Load Balancer Status Card */}
      <div className="border border-border bg-surface p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ROUND-ROBIN ACTIVE
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-text-tertiary">
                TỰ ĐỘNG PHÂN BỐ TẢI API
              </span>
            </div>
            <h2 className="font-serif text-lg sm:text-2xl font-bold text-text-primary mt-1">
              Quản Trị Album & Bộ Khóa API (Load Balancer)
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Phân loại API key theo album tháng, tự động xoay vòng cho AI Studio, chuyển đổi tức thì khi gặp 429.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddAlbumModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-border bg-surface hover:bg-surface-elevated text-xs font-mono text-text-primary transition"
            >
              <FolderPlus className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>+ TẠO ALBUM</span>
            </button>

            <button
              onClick={() => {
                setShowAddKeyModal(true);
                setPreTestResult(null);
              }}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 border border-primary bg-primary text-background font-mono text-xs font-bold hover:bg-primary/90 transition shadow-sm"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>+ THÊM KEY</span>
            </button>

            <button
              onClick={() => loadData(selectedAlbumId)}
              disabled={loading}
              title="Làm mới dữ liệu"
              className="p-2 border border-border bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metric Counter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 pt-4 sm:pt-6">
          <div className="p-3 border border-border bg-surface-elevated/50">
            <span className="text-[11px] font-mono text-text-tertiary uppercase">Tổng Khóa Trong Pool</span>
            <div className="font-mono text-2xl font-bold text-text-primary mt-1">
              {stats.totalKeys}
            </div>
          </div>

          <div className="p-3 border border-border bg-surface-elevated/50">
            <span className="text-[11px] font-mono text-text-tertiary uppercase">Khóa Sẵn Sàng (Active)</span>
            <div className="font-mono text-2xl font-bold text-emerald-400 mt-1">
              {stats.activeKeys}
            </div>
          </div>

          <div className="p-3 border border-border bg-surface-elevated/50">
            <span className="text-[11px] font-mono text-text-tertiary uppercase">Lượt Gọi Đã Xoay</span>
            <div className="font-mono text-2xl font-bold text-text-primary mt-1">
              {stats.totalRequests.toLocaleString()}
            </div>
          </div>

          <div className="p-3 border border-border bg-surface-elevated/50">
            <span className="text-[11px] font-mono text-text-tertiary uppercase">Tỷ Lệ Sức Khỏe (Health)</span>
            <div className="font-mono text-2xl font-bold text-primary mt-1">
              {stats.healthRatio}%
            </div>
          </div>

          <div className="p-3 border border-border bg-surface-elevated/50">
            <span className="text-[11px] font-mono text-text-tertiary uppercase">Độ Trễ Phản Hồi TB</span>
            <div className="font-mono text-2xl font-bold text-text-primary mt-1">
              {stats.avgLatency > 0 ? `${stats.avgLatency}ms` : '--'}
            </div>
          </div>

          <div className="p-3 border border-border bg-surface-elevated/50">
            <span className="text-[11px] font-mono text-text-tertiary uppercase">Tổng Lỗi / 429</span>
            <div className="font-mono text-2xl font-bold text-rose-400 mt-1">
              {stats.totalErrors}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Monthly Albums Section (Mục theo tháng như Album Key) */}
      <div className="border border-border bg-surface p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
              DANH MỤC ALBUM THEO THÁNG
            </span>
            <span className="text-xs text-text-tertiary">
              (Chỉ các album được BẬT mới tham gia luân chuyển key)
            </span>
          </div>

          {selectedAlbumId !== 'all' && (
            <button
              onClick={handleBatchTestAlbum}
              disabled={batchTesting}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/40 bg-primary/10 hover:bg-primary/20 text-xs font-mono text-primary transition"
            >
              <Zap className={`w-3.5 h-3.5 ${batchTesting ? 'animate-spin' : ''}`} />
              <span>{batchTesting ? 'ĐANG KIỂM TRA TOÀN ALBUM...' : 'KIỂM TRA TOÀN BỘ ALBUM NÀY'}</span>
            </button>
          )}
        </div>

        {/* Album Selector Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedAlbumId('all')}
            className={`px-3 py-2 text-xs font-mono border transition flex items-center gap-2 ${
              selectedAlbumId === 'all'
                ? 'border-primary bg-primary/10 text-primary font-bold'
                : 'border-border bg-surface-elevated/40 text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>TẤT CẢ KHÓA</span>
            <span className="px-1.5 py-0.2 bg-surface text-[10px] border border-border">
              {keys.length}
            </span>
          </button>

          {albums.map((album) => {
            const isSelected = selectedAlbumId === album.id;
            return (
              <div
                key={album.id}
                className={`flex items-center border transition ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-surface-elevated/40 text-text-secondary hover:text-text-primary'
                }`}
              >
                <button
                  onClick={() => setSelectedAlbumId(album.id)}
                  className="px-3 py-2 text-xs font-mono flex items-center gap-2"
                >
                  <span>{album.name}</span>
                  <span className="px-1.5 py-0.2 bg-surface text-[10px] border border-border font-mono">
                    {album._count?.keys || 0}
                  </span>
                </button>

                {/* Toggle Active status for album */}
                <button
                  onClick={() => handleToggleAlbumActive(album.id, album.isActive)}
                  title={album.isActive ? 'Album đang kích hoạt cho Balancer. Bấm để tắt.' : 'Album đã tắt. Bấm để kích hoạt.'}
                  className={`px-2 py-2 text-[10px] font-mono border-l border-border transition ${
                    album.isActive
                      ? 'text-emerald-400 hover:bg-emerald-500/20'
                      : 'text-text-tertiary hover:bg-surface-elevated'
                  }`}
                >
                  {album.isActive ? 'BẬT' : 'TẮT'}
                </button>
              </div>
            );
          })}

          {albums.length === 0 && (
            <div className="text-xs font-mono text-text-tertiary py-2">
              Chưa có album nào. Bấm nút "+ Tạo Album Tháng" để phân loại khóa theo từng tháng.
            </div>
          )}
        </div>
      </div>

      {/* 3. API Keys Table & Pool Rotation List */}
      <div className="border border-border bg-surface">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
              DANH SÁCH KHÓA API TRONG POOL
            </span>
            <span className="text-xs font-mono text-text-tertiary">
              ({keys.length} khóa)
            </span>
          </div>
          <div className="text-xs font-mono text-text-tertiary">
            Thuật toán: Least-Recently-Used &amp; Round-Robin
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-text-tertiary flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>ĐANG NẠP DỮ LIỆU BỘ KHÓA...</span>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <KeyRound className="w-10 h-10 mx-auto text-text-tertiary stroke-1" />
            <div className="text-sm font-medium text-text-primary">
              Chưa có API key nào trong danh mục này
            </div>
            <p className="text-xs font-mono text-text-secondary max-w-md mx-auto">
              Hãy thêm khóa Gemini hoặc dán danh sách hàng loạt để hệ thống bắt đầu xoay vòng tự động cho AI Studio.
            </p>
            <button
              onClick={() => setShowAddKeyModal(true)}
              className="px-4 py-2 border border-primary bg-primary text-background font-mono text-xs font-bold hover:bg-primary/90 transition"
            >
              + THÊM KHÓA ĐẦU TIÊN
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs font-mono">
              <thead className="bg-surface-elevated/60 text-text-tertiary uppercase border-b border-border">
                <tr>
                  <th className="p-3">TÊN KHÓA &amp; ALBUM</th>
                  <th className="p-3">KHÓA API (MASKED)</th>
                  <th className="p-3 text-center">TRẠNG THÁI</th>
                  <th className="p-3 text-right">TẢI ĐÃ GỌI</th>
                  <th className="p-3 text-right">THÀNH CÔNG / LỖI</th>
                  <th className="p-3 text-center">ĐỘ TRỄ (TEST)</th>
                  <th className="p-3 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keys.map((item) => {
                  const isRevealed = revealedKeyIds[item.id];
                  const isTesting = testingKeyId === item.id;
                  const displayKey = isRevealed ? item.rawKey : item.maskedKey;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-surface-elevated/40 transition ${
                        !item.isActive ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Name & Album */}
                      <td className="p-3">
                        <div className="font-bold text-text-primary flex items-center gap-1.5">
                          <span>{item.name}</span>
                          <span className="text-[10px] px-1 py-0.2 uppercase border border-border bg-surface text-text-tertiary">
                            {item.provider}
                          </span>
                        </div>
                        <div className="text-[11px] text-text-secondary mt-0.5 flex items-center gap-1">
                          <span className="text-text-tertiary">Album:</span>
                          <span className="underline decoration-dotted">{item.album?.name}</span>
                        </div>
                      </td>

                      {/* Key Value */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 font-mono text-text-primary bg-surface-elevated px-2 py-1 border border-border inline-flex max-w-[260px]">
                          <span className="truncate">{displayKey}</span>
                          <button
                            onClick={() => toggleRevealKey(item.id)}
                            title={isRevealed ? 'Ẩn khóa' : 'Hiện đầy đủ'}
                            className="text-text-tertiary hover:text-text-primary ml-1"
                          >
                            {isRevealed ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyKey(item.id, item.rawKey)}
                            title="Sao chép khóa"
                            className="text-text-tertiary hover:text-text-primary"
                          >
                            {copiedKeyId === item.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        {item.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            HOẠT ĐỘNG
                          </span>
                        )}
                        {item.status === 'RATE_LIMITED' && (
                          <span
                            title={item.lastError || 'Bị giới hạn quota 429'}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] border border-amber-500/30 bg-amber-500/10 text-amber-400"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            RATE LIMIT
                          </span>
                        )}
                        {item.status === 'INVALID' && (
                          <span
                            title={item.lastError || 'Khóa không hợp lệ'}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] border border-rose-500/30 bg-rose-500/10 text-rose-400"
                          >
                            <XCircle className="w-3 h-3" />
                            LỖI KHÓA
                          </span>
                        )}
                        {item.status === 'UNTESTED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] border border-border bg-surface text-text-tertiary">
                            CHƯA TEST
                          </span>
                        )}
                      </td>

                      {/* Requests Count */}
                      <td className="p-3 text-right">
                        <span className="font-bold text-text-primary">
                          {item.requestCount.toLocaleString()}
                        </span>
                        <div className="text-[10px] text-text-tertiary">
                          {item.lastUsedAt
                            ? new Date(item.lastUsedAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Chưa dùng'}
                        </div>
                      </td>

                      {/* Success / Error ratio */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-emerald-400">{item.successCount}</span>
                          <span className="text-text-tertiary">/</span>
                          <span className={item.errorCount > 0 ? 'text-rose-400 font-bold' : 'text-text-tertiary'}>
                            {item.errorCount}
                          </span>
                        </div>
                      </td>

                      {/* Latency */}
                      <td className="p-3 text-center">
                        {item.lastLatencyMs !== null ? (
                          <span
                            className={`px-1.5 py-0.5 text-[11px] font-mono ${
                              item.lastLatencyMs < 400
                                ? 'text-emerald-400'
                                : item.lastLatencyMs < 1000
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {item.lastLatencyMs}ms
                          </span>
                        ) : (
                          <span className="text-text-tertiary">--</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Test Button */}
                          <button
                            onClick={() => handleTestKey(item.id)}
                            disabled={isTesting}
                            title="Kiểm tra trực tiếp key qua API Google"
                            className="flex items-center gap-1 px-2 py-1 border border-border bg-surface hover:bg-surface-elevated text-text-primary text-[11px] transition"
                          >
                            <Zap className={`w-3 h-3 text-primary ${isTesting ? 'animate-spin' : ''}`} />
                            <span>{isTesting ? '...' : 'Test'}</span>
                          </button>

                          {/* Toggle Active Button */}
                          <button
                            onClick={() => handleToggleKeyActive(item.id, item.isActive)}
                            title={item.isActive ? 'Tắt không cho xoay key này' : 'Bật lại key'}
                            className={`px-2 py-1 border text-[11px] transition ${
                              item.isActive
                                ? 'border-border bg-surface text-text-secondary hover:text-text-primary'
                                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            {item.isActive ? 'Tắt' : 'Bật'}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteKey(item.id, item.name)}
                            title="Xóa khóa khỏi pool"
                            className="p-1 text-text-tertiary hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: THÊM API KEY MỚI */}
      {showAddKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="border border-border bg-surface w-full max-w-xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <h3 className="font-serif text-lg font-bold text-text-primary">
                  Thêm API Key Vào Pool
                </h3>
              </div>
              <button
                onClick={() => setShowAddKeyModal(false)}
                className="text-text-tertiary hover:text-text-primary font-mono text-sm"
              >
                [ĐÓNG]
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setAddMode('single')}
                className={`px-3 py-1.5 border transition ${
                  addMode === 'single'
                    ? 'border-primary bg-primary text-background font-bold'
                    : 'border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                Nhập 1 Khóa Đơn Lẻ
              </button>
              <button
                type="button"
                onClick={() => setAddMode('bulk')}
                className={`px-3 py-1.5 border transition ${
                  addMode === 'bulk'
                    ? 'border-primary bg-primary text-background font-bold'
                    : 'border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                Dán Hàng Loạt (Nhiều Dòng)
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              {/* Target Album */}
              <div>
                <label className="block text-xs font-mono text-text-secondary mb-1">
                  CHỌN ALBUM THÁNG <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formAlbumId}
                  onChange={(e) => setFormAlbumId(e.target.value)}
                  required
                  className="w-full bg-surface-elevated border border-border px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                >
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.monthKey})
                    </option>
                  ))}
                </select>
                {albums.length === 0 && (
                  <p className="text-[11px] font-mono text-amber-400 mt-1">
                    Chưa có album. Hãy tạo một album tháng trước!
                  </p>
                )}
              </div>

              {/* Provider */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-1">
                    NHÀ CUNG CẤP AI
                  </label>
                  <select
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value)}
                    className="w-full bg-surface-elevated border border-border px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="gemini">Google Gemini (Mặc định)</option>
                    <option value="openai">OpenAI Compatible</option>
                    <option value="groq">Groq High Speed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-1">
                    NHÃN / TÊN GỢI NHỚ
                  </label>
                  <input
                    type="text"
                    value={formKeyName}
                    onChange={(e) => setFormKeyName(e.target.value)}
                    placeholder="VD: Gemini Key 01"
                    className="w-full bg-surface-elevated border border-border px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Input for Single Mode */}
              {addMode === 'single' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-mono text-text-secondary">
                      GIÁ TRỊ API KEY <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handlePreTest}
                      disabled={isPreTesting || !formKeyValue.trim()}
                      className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1"
                    >
                      <Zap className={`w-3 h-3 ${isPreTesting ? 'animate-spin' : ''}`} />
                      <span>{isPreTesting ? 'Đang test...' : 'Test Ngay'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formKeyValue}
                    onChange={(e) => {
                      setFormKeyValue(e.target.value);
                      setPreTestResult(null);
                    }}
                    required
                    placeholder="AIzaSy..."
                    className="w-full bg-surface-elevated border border-border px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                  />

                  {/* Pre-test banner */}
                  {preTestResult && (
                    <div
                      className={`mt-2 p-2.5 text-xs font-mono border flex items-center gap-2 ${
                        preTestResult.valid
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {preTestResult.valid ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold">
                          {preTestResult.valid ? 'Khóa hợp lệ và hoạt động tốt!' : 'Khóa không phản hồi:'}
                        </div>
                        <div className="text-[11px] opacity-90">
                          {preTestResult.message || preTestResult.error} ({preTestResult.latencyMs}ms)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Input for Bulk Mode */
                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-1">
                    DÁN NHIỀU API KEY (MỖI DÒNG MỘT KHÓA) <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={6}
                    value={formBulkKeys}
                    onChange={(e) => setFormBulkKeys(e.target.value)}
                    required
                    placeholder={`AIzaSyABC123...\nAIzaSyDEF456...\nAIzaSyGHI789...`}
                    className="w-full bg-surface-elevated border border-border p-3 text-xs font-mono text-text-primary focus:outline-none focus:border-primary resize-none"
                  />
                  <p className="text-[11px] font-mono text-text-tertiary mt-1">
                    Hệ thống sẽ tự động lọc bỏ khoảng trắng và thêm từng khóa vào album đã chọn.
                  </p>
                </div>
              )}

              {/* Auto test option */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formAutoTest"
                  checked={formAutoTest}
                  onChange={(e) => setFormAutoTest(e.target.checked)}
                  className="rounded border-border text-primary"
                />
                <label htmlFor="formAutoTest" className="text-xs font-mono text-text-secondary cursor-pointer">
                  Tự động gọi kiểm tra tính hợp lệ &amp; đo độ trễ ngay khi lưu
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddKeyModal(false)}
                  className="px-4 py-2 border border-border bg-surface text-xs font-mono text-text-secondary hover:text-text-primary transition"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingKey || albums.length === 0}
                  className="px-5 py-2 border border-primary bg-primary text-background font-mono text-xs font-bold hover:bg-primary/90 transition flex items-center gap-1.5"
                >
                  {isSubmittingKey ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>ĐANG LƯU...</span>
                    </>
                  ) : (
                    <span>LƯU VÀO POOL</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TẠO ALBUM THÁNG MỚI */}
      {showAddAlbumModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="border border-border bg-surface w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-primary" />
                <h3 className="font-serif text-lg font-bold text-text-primary">
                  Tạo Album Khóa Theo Tháng
                </h3>
              </div>
              <button
                onClick={() => setShowAddAlbumModal(false)}
                className="text-text-tertiary hover:text-text-primary font-mono text-sm"
              >
                [ĐÓNG]
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-text-secondary mb-1">
                  ĐỊNH DẠNG THÁNG (YYYY-MM) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="month"
                  value={newAlbumMonth}
                  onChange={(e) => {
                    setNewAlbumMonth(e.target.value);
                    if (e.target.value) {
                      const [y, m] = e.target.value.split('-');
                      setNewAlbumName(`Album Tháng ${m}/${y}`);
                    }
                  }}
                  required
                  className="w-full bg-surface-elevated border border-border px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-secondary mb-1">
                  TÊN ALBUM <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  required
                  placeholder="VD: Album Tháng 10/2026"
                  className="w-full bg-surface-elevated border border-border px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-secondary mb-1">
                  MÔ TẢ / GHI CHÚ
                </label>
                <textarea
                  rows={2}
                  value={newAlbumDesc}
                  onChange={(e) => setNewAlbumDesc(e.target.value)}
                  placeholder="VD: Nhóm 10 khóa Gemini Free Tier dự phòng cho AI Studio"
                  className="w-full bg-surface-elevated border border-border p-3 text-xs font-mono text-text-primary focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddAlbumModal(false)}
                  className="px-4 py-2 border border-border bg-surface text-xs font-mono text-text-secondary hover:text-text-primary transition"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAlbum}
                  className="px-5 py-2 border border-primary bg-primary text-background font-mono text-xs font-bold hover:bg-primary/90 transition"
                >
                  {isSubmittingAlbum ? 'ĐANG TẠO...' : 'TẠO ALBUM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
