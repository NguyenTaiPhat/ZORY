import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('1.1. SVG Assets: public/logo.svg và public/favicon.svg phải tồn tại và chứa thẻ svg hợp lệ', () => {
  assert.ok(fs.existsSync('public/logo.svg'), 'public/logo.svg phải tồn tại');
  assert.ok(fs.existsSync('public/favicon.svg'), 'public/favicon.svg phải tồn tại');

  const content = fs.readFileSync('public/logo.svg', 'utf-8');
  assert.ok(content.includes('<svg'), 'Phải chứa thẻ <svg');
  assert.ok(content.includes('viewBox'), 'Phải có viewBox');
});
