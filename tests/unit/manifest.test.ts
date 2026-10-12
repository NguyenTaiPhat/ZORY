import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('4.1. Manifest: public/manifest.json phải chứa đầy đủ cấu hình PWA', () => {
  assert.ok(fs.existsSync('public/manifest.json'), 'manifest.json phải tồn tại');
  const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf-8'));
  assert.strictEqual(manifest.short_name, 'ZORY');
  assert.strictEqual(manifest.display, 'standalone');
  assert.ok(manifest.icons && manifest.icons.length >= 2, 'Phải có danh sách icons');

  const icon192 = manifest.icons.find((i: any) => i.sizes === '192x192');
  const icon512 = manifest.icons.find((i: any) => i.sizes === '512x512');
  assert.ok(icon192, 'Phải có icon 192x192');
  assert.ok(icon512, 'Phải có icon 512x512');
});
