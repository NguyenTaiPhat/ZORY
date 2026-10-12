import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('2.1. Component Logo: src/components/brand/Logo.tsx phải export function Logo và hỗ trợ props', () => {
  assert.ok(fs.existsSync('src/components/brand/Logo.tsx'), 'src/components/brand/Logo.tsx phải tồn tại');
  const content = fs.readFileSync('src/components/brand/Logo.tsx', 'utf-8');
  assert.ok(content.includes('export function Logo'), 'Phải export function Logo');
  assert.ok(content.includes('variant'), 'Phải hỗ trợ variant');
  assert.ok(content.includes('size'), 'Phải hỗ trợ size');
});
