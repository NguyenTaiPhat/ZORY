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
  const host = req.headers.get('host');

  // Nếu có header Origin (chuẩn của trình duyệt hiện đại cho POST/PUT/PATCH/DELETE)
  if (origin) {
    try {
      const originUrl = new URL(origin);
      // Danh sách host hợp lệ
      const allowedHosts = [
        host?.split(':')[0],
        'localhost',
        '127.0.0.1',
      ].filter(Boolean);

      if (process.env.APP_URL) {
        try {
          const appUrl = new URL(process.env.APP_URL);
          allowedHosts.push(appUrl.hostname);
        } catch (_) {}
      }

      if (!allowedHosts.includes(originUrl.hostname)) {
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
      const allowedHosts = [
        host?.split(':')[0],
        'localhost',
        '127.0.0.1',
      ].filter(Boolean);

      if (process.env.APP_URL) {
        try {
          const appUrl = new URL(process.env.APP_URL);
          allowedHosts.push(appUrl.hostname);
        } catch (_) {}
      }

      if (!allowedHosts.includes(refererUrl.hostname)) {
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
