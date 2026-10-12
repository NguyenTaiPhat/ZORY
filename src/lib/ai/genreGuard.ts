/**
 * Genre and Romantic Orientation Guard for ZORY Literary Engine.
 * Đảm bảo các thể loại đặc thù (Đam mỹ / Nam Nam, Bách hợp / Nữ Nữ, Ngôn tình)
 * được bảo toàn tuyệt đối, ngăn chặn AI thiên lệch sang ngôn tình hoặc đổi giới tính.
 */

export interface CharacterLoreInput {
  name: string;
  role?: string | null;
  realm?: string | null;
  faction?: string | null;
  summary: string;
  detailsJson?: string | null;
}

/**
 * Xây dựng chỉ dẫn ràng buộc thể loại & xu hướng tình cảm
 */
export function buildGenreAndOrientationDirectives(genre?: string, premise?: string): string {
  if (!genre) return '';
  const g = genre.toLowerCase();

  // 1. Đam mỹ (Nam Nam / BL / Danmei)
  if (
    g.includes('đam mỹ') ||
    g.includes('nam nam') ||
    g.includes('bl') ||
    g.includes('danmei') ||
    g.includes('boys love') ||
    g.includes('đam my')
  ) {
    return `
[NGUYÊN TẮC BẮT BUỘC: BẢO TOÀN THỂ LOẠI ĐAM MỸ (NAM x NAM)]:
1. ĐÂY LÀ TÁC PHẨM ĐAM MỸ (NAM x NAM). TUYỆT ĐỐI CẤM VIẾT SANG NGÔN TÌNH (NAM x NỮ).
2. BẢO TOÀN 100% GIỚI TÍNH NHÂN VẬT:
   - Các nhân vật nam chính và nam phụ phải giữ nguyên giới tính NAM.
   - TUYỆT ĐỐI KHÔNG ĐỔI GIỚI TÍNH NHÂN VẬT NAM THÀNH NỮ.
   - TUYỆT ĐỐI CẤM sử dụng các từ ngữ chỉ phái nữ như "nàng", "cô nương", "thiếu nữ", "tiểu thư", "nữ tử", "giai nhân", "bóng hồng" để miêu tả hay xưng hô với nhân vật nam. Bắt buộc dùng đại từ nam tính: "hắn", "y", "chàng", "ngươi", "thiếu niên", "thanh niên".
3. TUYỆT ĐỐI CẤM TỰ Ý THÊM NHÂN VẬT NỮ ĐỂ GHÉP ĐÔI TÌNH CẢM:
   - Cấm bịa thêm nhân vật nữ phụ làm người yêu, hôn thê hay người thương của các nhân vật nam chính.
   - Cấm tạo tình huống hiểu lầm tình cảm nam - nữ làm lu mờ tuyến tình cảm nam - nam.
4. BẢO TOÀN TUYẾN TÌNH CẢM NAM - NAM:
   - Mọi sự rung động, giằng xé nội tâm, ánh mắt thâm tình, bảo bọc, hy sinh, ghen tuông hay rung động lãng mạn đều là giữa CÁC NHÂN VẬT NAM VỚI NHAU.
   - TUYỆT ĐỐI KHÔNG hạ cấp mối quan hệ tình cảm nam - nam thành "tình huynh đệ kết nghĩa trong sáng" hay "tình bằng hữu" nếu phân cảnh đó mang tính lãng mạn.
5. TÔN TRỌNG THIẾT LẬP CÔNG / THỤ / HỖ CÔNG NẾU CÓ:
   - Giữ đúng khí chất, vị thế và tương tác đã được tác giả định nghĩa trong hồ sơ nhân vật.`;
  }

  // 2. Bách hợp (Nữ Nữ / GL / Yuri)
  if (
    g.includes('bách hợp') ||
    g.includes('nữ nữ') ||
    g.includes('gl') ||
    g.includes('yuri') ||
    g.includes('girls love') ||
    g.includes('bach hop')
  ) {
    return `
[NGUYÊN TẮC BẮT BUỘC: BẢO TOÀN THỂ LOẠI BÁCH HỢP (NỮ x NỮ)]:
1. ĐÂY LÀ TÁC PHẨM BÁCH HỢP (NỮ x NỮ). TUYỆT ĐỐI CẤM VIẾT SANG NGÔN TÌNH.
2. Tuyến tình cảm lãng mạn là giữa các nhân vật NỮ x NỮ.
3. Tuyệt đối KHÔNG gán ghép tình cảm với nhân vật nam giới, không biến tướng thành tình chị em bạn dì đơn thuần nếu phân cảnh mang sắc thái tình cảm.`;
  }

  // 3. Ngôn tình (Nam x Nữ)
  if (g.includes('ngôn tình') || g.includes('nam nữ') || g.includes('bg')) {
    return `
[NGUYÊN TẮC THỂ LOẠI: NGÔN TÌNH (NAM x NỮ)]:
Tập trung vào tuyến tình cảm lãng mạn tinh tế, sâu sắc giữa nhân vật nam chính và nhân vật nữ chính theo đúng thiết lập nguyên tác.`;
  }

  // 4. Không ràng buộc / Vô CP (Không tình cảm yêu đương)
  if (
    g.includes('không ràng buộc') ||
    g.includes('vô cp') ||
    g.includes('không tình cảm') ||
    g.includes('no romance')
  ) {
    return `
[NGUYÊN TẮC THỂ LOẠI: PHI TÌNH CẢM (VÔ CP / NO ROMANCE)]:
Tập trung toàn lực vào cốt truyện, thăng cấp tu vi, phiêu lưu, đấu trí mưu lược và biến cố thế giới. Tuyệt đối KHÔNG gượng ép thêm các tình tiết yêu đương lãng mạn.`;
  }

  return `\n[THỂ LOẠI CHÍNH CỦA TÁC PHẨM]: ${genre}.\nBắt buộc giữ đúng phong vị và quy ước đặc trưng của thể loại này.`;
}

/**
 * Định dạng từng dòng hồ sơ nhân vật, bóc tách gender, orientation và relationships
 */
export function formatCharacterLoreWithOrientation(char: CharacterLoreInput): string {
  let genderTag = '';
  let orientationTag = '';
  let relationshipsText = '';

  if (char.detailsJson) {
    try {
      const details = typeof char.detailsJson === 'string' ? JSON.parse(char.detailsJson) : char.detailsJson;
      if (details.gender) {
        genderTag = `[GIỚI TÍNH: ${String(details.gender).toUpperCase()}] `;
      }
      if (details.orientation) {
        orientationTag = ` [Thiết lập tình cảm: ${details.orientation}]`;
      }
      if (details.relationships) {
        relationshipsText = ` - Mối quan hệ: ${details.relationships}`;
      }
    } catch {}
  }

  const roleText = char.role ? `, ${char.role}` : '';
  const realmText = char.realm ? `, Cảnh giới: ${char.realm}` : '';
  const factionText = char.faction ? `, Thế lực: ${char.faction}` : '';

  return `- ${genderTag}${char.name} (${roleText.slice(2)}${orientationTag}${realmText}${factionText}): ${char.summary}${relationshipsText}`;
}
