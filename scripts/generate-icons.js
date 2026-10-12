const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const svgPath = path.join(__dirname, '..', 'public', 'logo.svg');
  const favSvgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
  const publicDir = path.join(__dirname, '..', 'public');

  if (!fs.existsSync(svgPath)) {
    throw new Error('public/logo.svg không tồn tại');
  }

  const svgBuffer = fs.readFileSync(svgPath);

  // 1. Android / PWA 192x192
  console.log('Đang tạo icon-192.png (192x192)...');
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-192.png'));

  // 2. Splash / Store 512x512
  console.log('Đang tạo icon-512.png (512x512)...');
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-512.png'));

  // 3. Apple Touch Icon 180x180
  console.log('Đang tạo apple-touch-icon.png (180x180)...');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 4. Favicon.ico (32x32)
  console.log('Đang tạo favicon.ico...');
  const favBuffer = fs.readFileSync(favSvgPath);
  await sharp(favBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Đã tạo thành công toàn bộ icons!');
}

generateIcons().catch((err) => {
  console.error('Lỗi tạo icon:', err);
  process.exit(1);
});
