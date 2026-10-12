import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('5.1. Layout: Navbar dùng text brandmark và Footer dùng component Logo', () => {
  const navbarContent = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf-8');
  assert.ok(navbarContent.includes('ZORY') && navbarContent.includes('Literary AI'), 'Navbar phải hiển thị chữ ZORY | Literary AI');

  const footerContent = fs.readFileSync('src/components/layout/Footer.tsx', 'utf-8');
  assert.ok(footerContent.includes('<Logo') || footerContent.includes('Logo'), 'Footer phải import và dùng Logo');
});
