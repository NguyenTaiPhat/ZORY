import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('5.1. Layout: Navbar và Footer phải sử dụng component Logo', () => {
  const navbarContent = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf-8');
  assert.ok(navbarContent.includes('<Logo') || navbarContent.includes('Logo'), 'Navbar phải import và dùng Logo');

  const footerContent = fs.readFileSync('src/components/layout/Footer.tsx', 'utf-8');
  assert.ok(footerContent.includes('<Logo') || footerContent.includes('Logo'), 'Footer phải import và dùng Logo');
});
