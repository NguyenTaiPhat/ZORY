import { test } from 'node:test';
import assert from 'node:assert';
import { buildGenreAndOrientationDirectives, formatCharacterLoreWithOrientation } from '../../src/lib/ai/genreGuard';

test('1.1. buildGenreAndOrientationDirectives kích hoạt chỉ dẫn nghiêm ngặt cho Đam mỹ / Nam Nam', () => {
  const result = buildGenreAndOrientationDirectives('Đam mỹ (Nam Nam)', 'Hai kiếm khách đồng hành giang hồ');
  assert.ok(result.includes('ĐAM MỸ'), 'Phải chứa từ khóa ĐAM MỸ');
  assert.ok(result.includes('TUYỆT ĐỐI CẤM VIẾT SANG NGÔN TÌNH'), 'Phải cấm viết sang ngôn tình');
  assert.ok(result.includes('TUYỆT ĐỐI KHÔNG ĐỔI GIỚI TÍNH NHÂN VẬT NAM THÀNH NỮ'), 'Phải cấm đổi giới tính');
  assert.ok(result.includes('nàng'), 'Phải có quy tắc cấm xưng hô nàng đối với nam');
  assert.ok(result.includes('TUYỆT ĐỐI CẤM TỰ Ý THÊM NHÂN VẬT NỮ ĐỂ GHÉP ĐÔI'), 'Phải cấm thêm nữ phụ');
});

test('1.2. buildGenreAndOrientationDirectives nhận diện các biến thể "Nam Nam", "BL", "Danmei"', () => {
  const variations = ['Nam Nam', 'BL', 'Truyện Đam Mỹ Cổ Trang', 'Danmei'];
  for (const v of variations) {
    const res = buildGenreAndOrientationDirectives(v);
    assert.ok(res.includes('ĐAM MỸ') || res.includes('NAM x NAM'), `Biến thể ${v} phải kích hoạt quy tắc Nam x Nam`);
  }
});

test('1.3. buildGenreAndOrientationDirectives kích hoạt chỉ dẫn cho Bách hợp (Nữ Nữ)', () => {
  const result = buildGenreAndOrientationDirectives('Bách hợp (Nữ Nữ)');
  assert.ok(result.includes('BÁCH HỢP'), 'Phải chứa từ khóa BÁCH HỢP');
  assert.ok(result.includes('NỮ x NỮ'), 'Phải chứa từ khóa NỮ x NỮ');
});

test('1.4. formatCharacterLoreWithOrientation trích xuất đúng giới tính và vai vế tình cảm', () => {
  const char = {
    name: 'Cố Hàn Sương',
    role: 'Nhân vật chính',
    realm: 'Kim Đan',
    faction: 'Thiên Kiếm Tông',
    summary: 'Kiếm tu lạnh lùng',
    detailsJson: JSON.stringify({
      gender: 'NAM',
      orientation: 'Công (Top)',
      relationships: 'Đạo lữ của Tiêu Lạc Vũ',
    }),
  };

  const formatted = formatCharacterLoreWithOrientation(char);
  assert.ok(formatted.includes('[GIỚI TÍNH: NAM]'), 'Phải chứa tag giới tính NAM');
  assert.ok(formatted.includes('Công (Top)'), 'Phải chứa vai trò Công (Top)');
  assert.ok(formatted.includes('Đạo lữ của Tiêu Lạc Vũ'), 'Phải chứa mối quan hệ đạo lữ');
});
