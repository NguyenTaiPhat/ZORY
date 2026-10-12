import { aiAdapter } from './adapter';

export interface ExtractedCharacter {
  name: string;
  aliases?: string;
  gender?: string;
  orientation?: string;
  role: string;
  faction?: string;
  realm?: string;
  summary: string;
  relationships?: string;
}

export interface ExtractedFaction {
  name: string;
  type?: string;
  summary: string;
}

export interface ExtractedRealm {
  name: string;
  level?: number;
  summary: string;
}

export interface ExtractedArtifact {
  name: string;
  type?: string;
  summary: string;
}

export interface LoreExtractionResult {
  characters: ExtractedCharacter[];
  factions: ExtractedFaction[];
  realms: ExtractedRealm[];
  artifacts: ExtractedArtifact[];
}

/**
 * Trích xuất các thực thể Worldbuilding (Nhân vật, Môn phái, Cảnh giới, Pháp bảo)
 * từ các chương đã viết trong tác phẩm.
 */
export async function extractLoreFromText(
  text: string,
  context: { title: string; genre: string; premise?: string }
): Promise<LoreExtractionResult> {
  // Rút gọn text nếu quá dài để tối ưu token
  const sampleText = text.slice(0, 10000);

  const prompt = `Bạn là chuyên gia phân tích văn học và thiết lập thế giới (Worldbuilding Architect).
Dưới đây là trích đoạn các chương của tác phẩm:
Tác phẩm: "${context.title}"
Thể loại: "${context.genre}"
Nội dung:
"""
${sampleText}
"""

NHIỆM VỤ: Hãy quét và trích xuất TOÀN BỘ thực thể quan trọng theo định dạng JSON chuẩn:
1. characters: Danh sách nhân vật xuất hiện hoặc được nhắc tới (name, aliases, gender ["NAM", "NỮ", "KHÁC"], orientation [Định hướng tình cảm / vai trò CP như "Công", "Thụ", "Hỗ công", "Nam chính Đam mỹ", "Nữ chính Bách hợp", "Dị tính", "Độc thân"], role ["Nhân vật chính", "Phản diện", "Đồng minh", "Tiền bối", "Nhân vật phụ"], faction [Môn phái/Thế lực], realm [Cảnh giới/Tu vi], summary [Mô tả ngắn], relationships [Mối quan hệ ngắn gọn với nhân vật khác]).
2. factions: Các thế lực, bang phái, gia tộc, đế quốc, cấm địa (name, type ["Tông môn", "Gia tộc", "Thế lực", "Địa danh"], summary [Mô tả vai trò/đặc điểm]).
3. realms: Hệ thống cảnh giới / cấp bậc tu luyện / ma pháp xuất hiện trong truyện (name, level [số thứ tự 1, 2, 3... từ thấp đến cao], summary).
4. artifacts: Các bảo vật, bí kíp, pháp khí, linh dược quan trọng (name, type ["Pháp bảo", "Bí kíp", "Thần khí", "Đan dược"], summary).

YÊU CẦU ĐẶC BIỆT:
- ĐẶC BIỆT CHÚ Ý THỂ LOẠI: Nếu là Đam mỹ (BL / Nam Nam), xác định rõ ràng giới tính cả hai nhân vật chính là NAM, vai trò Công/Thụ. Tuyệt đối không nhầm sang Nữ.
- Chỉ trả về duy nhất chuỗi JSON hợp lệ. Không viết thêm bất kỳ lời dẫn nào.
- Định dạng JSON mẫu:
{
  "characters": [
    { "name": "...", "aliases": "...", "gender": "NAM", "orientation": "Công", "role": "Nhân vật chính", "faction": "...", "realm": "...", "summary": "...", "relationships": "..." }
  ],
  "factions": [
    { "name": "...", "type": "Tông môn", "summary": "..." }
  ],
  "realms": [
    { "name": "...", "level": 1, "summary": "..." }
  ],
  "artifacts": [
    { "name": "...", "type": "Pháp bảo", "summary": "..." }
  ]
}`;

  try {
    const res = await aiAdapter.complete({
      prompt,
      temperature: 0.3, // Cần tính chuẩn xác cao
      maxTokens: 2500,
    });

    let raw = res.content.trim();
    if (raw.startsWith('```json')) {
      raw = raw.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (raw.startsWith('```')) {
      raw = raw.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.slice(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(raw);
    return {
      characters: Array.isArray(parsed.characters) ? parsed.characters : [],
      factions: Array.isArray(parsed.factions) ? parsed.factions : [],
      realms: Array.isArray(parsed.realms) ? parsed.realms : [],
      artifacts: Array.isArray(parsed.artifacts) ? parsed.artifacts : [],
    };
  } catch (err) {
    console.warn('[LoreExtractor] AI parse failed or mock fallback:', err);
    // Intelligent fallback parsing
    return extractLoreFallback(text, context);
  }
}

/**
 * Fallback heuristical extractor khi AI offline hoặc parse JSON lỗi
 */
function extractLoreFallback(
  text: string,
  context: { title: string; genre: string }
): LoreExtractionResult {
  const characters: ExtractedCharacter[] = [];
  const factions: ExtractedFaction[] = [];
  const realms: ExtractedRealm[] = [];
  const artifacts: ExtractedArtifact[] = [];

  // 1. Nhận diện các danh từ riêng phổ biến trong truyện Tiên hiệp / Huyền huyễn / Kiếm hiệp
  const namePatterns = [
    /(?:tiểu tử|thiếu niên|thanh niên|đạo hữu|sư huynh|sư muội|chưởng môn|lão giả)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){1,2})/g,
    /([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){1,2})\s+(?:lạnh lùng|nhẹ giọng|cười khẽ|hừ lạnh|vung tay|rút kiếm|ngồi xếp bằng)/g,
  ];

  const foundNames = new Set<string>();
  for (const pat of namePatterns) {
    let match;
    while ((match = pat.exec(text)) !== null) {
      const name = match[1].trim();
      if (name.length > 3 && !foundNames.has(name) && !name.includes('Chương')) {
        foundNames.add(name);
      }
    }
  }

  const nameList = Array.from(foundNames).slice(0, 5);
  if (nameList.length > 0) {
    nameList.forEach((name, i) => {
      characters.push({
        name,
        role: i === 0 ? 'Nhân vật chính' : i === 1 ? 'Đồng minh' : 'Nhân vật phụ',
        faction: 'Tu chân giới',
        realm: 'Trúc Cơ kỳ',
        summary: `Nhân vật quan trọng xuất hiện trong ${context.title}.`,
        relationships: i === 0 ? 'Trung tâm của câu chuyện' : `Có liên hệ với ${nameList[0]}`,
      });
    });
  } else {
    // Default protagonist if nothing detected
    characters.push({
      name: 'Nhân Vật Chính',
      role: 'Nhân vật chính',
      faction: 'Khởi nguyên',
      realm: 'Sơ nhập giang hồ',
      summary: `Nhân vật chính diện của tác phẩm ${context.title}.`,
      relationships: 'Tự do hành tẩu',
    });
  }

  // Cảnh giới mặc định phù hợp thể loại
  if (context.genre.includes('Tiên') || context.genre.includes('Huyền')) {
    realms.push(
      { name: 'Luyện Khí kỳ', level: 1, summary: 'Tích tụ linh khí vào đan điền, tôi luyện gân cốt.' },
      { name: 'Trúc Cơ kỳ', level: 2, summary: 'Linh khí hóa dịch, đúc thành tiên cơ trường thọ.' },
      { name: 'Kim Đan kỳ', level: 3, summary: 'Đan điền ngưng tụ kim đan, thần thông đại biến.' },
      { name: 'Nguyên Anh kỳ', level: 4, summary: 'Phá đan sinh anh, thân thể tan nát anh linh bất diệt.' }
    );
    factions.push(
      { name: 'Thanh Vân Tông', type: 'Tông môn', summary: 'Đại phái chính đạo nghìn năm sừng sững tại Trung Châu.' },
      { name: 'U Minh Giáo', type: 'Thế lực', summary: 'Tà phái bí ẩn hành tung xuất quỷ nhập thần.' }
    );
  } else {
    realms.push(
      { name: 'Tập sự', level: 1, summary: 'Giai đoạn bắt đầu làm quen kỹ năng.' },
      { name: 'Tinh anh', level: 2, summary: 'Nắm vững bản lĩnh, độc lập tác chiến.' },
      { name: 'Đại sư', level: 3, summary: 'Đạt tới cảnh giới tuyệt đỉnh trong giới.' }
    );
  }

  return { characters, factions, realms, artifacts };
}
