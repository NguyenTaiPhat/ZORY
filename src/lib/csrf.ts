/**
 * Kiểm tra nguồn gốc yêu cầu (Origin / Referer) để phòng chống tấn công CSRF
 */
export function validateCsrfOrigin(req: Request): { valid: boolean; reason?: string } {
  // Chỉ kiểm tra trên các phương thức thay đổi trạng thái
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }

  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = (req.headers.get('host') || '').split(':')[0].toLowerCase();
  const forwardedHost = (req.headers.get('x-forwarded-host') || '').split(':')[0].toLowerCase();

  const allowedHosts = new Set<string>([
    'localhost',
    '127.0.0.1',
  ]);

  if (host) allowedHosts.add(host);
  if (forwardedHost) allowedHosts.add(forwardedHost);

  if (process.env.APP_URL) {
    try {
      allowedHosts.add(new URL(process.env.APP_URL).hostname.toLowerCase());
    } catch (_) {}
  }

  if (process.env.VERCEL_URL) {
    try {
      const vUrl = process.env.VERCEL_URL.startsWith('http')
        ? process.env.VERCEL_URL
        : `https://${process.env.VERCEL_URL}`;
      allowedHosts.add(new URL(vUrl).hostname.toLowerCase());
    } catch (_) {}
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    try {
      const pUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL.startsWith('http')
        ? process.env.VERCEL_PROJECT_PRODUCTION_URL
        : `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
      allowedHosts.add(new URL(pUrl).hostname.toLowerCase());
    } catch (_) {}
  }

  const isAllowedHost = (hostname: string): boolean => {
    const h = hostname.toLowerCase();
    if (allowedHosts.has(h)) return true;
    if (h.endsWith('.vercel.app')) return true;
    if (h.endsWith('zory.vn') || h === 'zory.vn') return true;
    return false;
  };

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (!isAllowedHost(originUrl.hostname)) {
        return {
          valid: false,
          reason: `Nguồn gốc yêu cầu không được phép (Origin: ${originUrl.hostname})`,
        };
      }
    } catch {
      return { valid: false, reason: 'Header Origin không đúng định dạng URL' };
    }
  } else if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (!isAllowedHost(refererUrl.hostname)) {
        return {
          valid: false,
          reason: `Nguồn gốc yêu cầu không được phép (Referer: ${refererUrl.hostname})`,
        };
      }
    } catch {
      return { valid: false, reason: 'Header Referer không đúng định dạng URL' };
    }
  }

  return { valid: true };
}
