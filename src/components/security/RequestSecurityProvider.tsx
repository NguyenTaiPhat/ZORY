'use client';

import { useEffect } from 'react';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

let cachedToken: string | null = null;
let tokenPromise: Promise<string | null> | null = null;

async function fetchSecurityToken(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh && cachedToken) {
    return cachedToken;
  }
  if (!forceRefresh && tokenPromise) {
    return tokenPromise;
  }

  tokenPromise = (async () => {
    try {
      // Đọc từ cookie trước nếu có
      const cookieToken = getCookie('zory_req_token');
      if (!forceRefresh && cookieToken) {
        cachedToken = cookieToken;
        return cookieToken;
      }

      const res = await window.fetch('/api/security/token', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          cachedToken = data.token;
          return data.token;
        }
      }
    } catch {
      // Bỏ qua lỗi mạng nền
    } finally {
      tokenPromise = null;
    }
    return cachedToken;
  })();

  return tokenPromise;
}

function generateRandomNonce(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '') + Math.random().toString(36).substring(2, 8);
  }
  return (
    Math.random().toString(36).substring(2) +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
}

export function RequestSecurityProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Tự động lấy và duy trì token bảo mật ngẫu nhiên
    fetchSecurityToken();

    // 2. Can thiệp window.fetch để tự động gắn mã ngẫu nhiên (Nonce) và Token vào mọi request /api/*
    const originalFetch = window.fetch;

    // Tránh can thiệp lặp lại nhiều lần nếu đã gán
    if ((window as any).__zoryFetchPatched) {
      return;
    }
    (window as any).__zoryFetchPatched = true;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      let url = '';
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else if (input && typeof input === 'object' && 'url' in input) {
        url = (input as Request).url;
      }

      // Chỉ can thiệp các request gọi đến /api/ nội bộ (trừ endpoint xin token)
      const isInternalApi =
        url.startsWith('/api/') ||
        url.includes('/api/') ||
        (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/_next'));

      const isTokenEndpoint = url.includes('/api/security/token');

      if (isInternalApi && !isTokenEndpoint) {
        const headers = new Headers(
          init?.headers || (input instanceof Request ? input.headers : undefined)
        );

        // Sinh mã ngẫu nhiên duy nhất cho lượt gọi này
        const randomNonce = generateRandomNonce();
        headers.set('x-request-nonce', randomNonce);
        headers.set('x-request-time', Date.now().toString());

        // Lấy hoặc chờ token bảo mật
        let token = cachedToken || getCookie('zory_req_token');
        if (!token) {
          token = await fetchSecurityToken();
        }

        if (token) {
          headers.set('x-request-token', token);
        }

        const newInit: RequestInit = {
          ...init,
          headers,
        };

        let response: Response;
        if (input instanceof Request) {
          response = await originalFetch(new Request(input, newInit));
        } else {
          response = await originalFetch(input, newInit);
        }

        // Tự động gia hạn và thử lại 1 lần nếu token cũ hết hạn (403)
        if (response.status === 403) {
          try {
            const cloned = response.clone();
            const data = await cloned.json();
            if (
              data?.error?.includes('Request Token') ||
              data?.error?.includes('Mã xác thực') ||
              data?.error?.includes('hết hạn')
            ) {
              const freshToken = await fetchSecurityToken(true);
              if (freshToken) {
                headers.set('x-request-token', freshToken);
                headers.set('x-request-nonce', generateRandomNonce());
                headers.set('x-request-time', Date.now().toString());

                const retryInit: RequestInit = { ...init, headers };
                if (input instanceof Request) {
                  return originalFetch(new Request(input, retryInit));
                }
                return originalFetch(input, retryInit);
              }
            }
          } catch {
            // Phản hồi không phải JSON, trả về nguyên bản
          }
        }

        return response;
      }

      return originalFetch(input, init);
    };

    return () => {
      // Dọn dẹp nếu unmount
    };
  }, []);

  return null;
}
