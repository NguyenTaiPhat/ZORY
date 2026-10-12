import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('3.1. PWA Icons: Các file icon 192, 512, apple-touch-icon phải tồn tại và là ảnh PNG hợp lệ', () => {
  const files = ['public/icon-192.png', 'public/icon-512.png', 'public/apple-touch-icon.png'];
  for (const f of files) {
    assert.ok(fs.existsSync(f), `${f} phải tồn tại`);
    const buf = fs.readFileSync(f);
    assert.ok(buf.length > 500, `${f} không được rỗng`);
    // Kiểm tra Magic Bytes PNG (89 50 4E 47)
    assert.strictEqual(buf[0], 0x89, `${f} byte 0 phải là 0x89`);
    assert.strictEqual(buf[1], 0x50, `${f} byte 1 phải là 0x50`);
    assert.strictEqual(buf[2], 0x4E, `${f} byte 2 phải là 0x4E`);
    assert.strictEqual(buf[3], 0x47, `${f} byte 3 phải là 0x47`);
  }
});
