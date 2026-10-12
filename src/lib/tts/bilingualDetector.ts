/**
 * ZORY Bilingual Speech & Language Detector (Vietnamese <-> English)
 * Tự động phát hiện ngôn ngữ Việt - Anh để điều hướng giọng đọc TTS phù hợp
 */

export interface SpeechSegment {
  id: string;
  text: string;
  lang: 'vi-VN' | 'en-US';
  wordCount: number;
}

// Bảng ký tự đặc trưng của tiếng Việt có dấu
export const VI_CHARS_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

// Bảng từ vựng tiếng Anh đặc trưng không trùng với tiếng Việt không dấu
export const UNAMBIGUOUS_EN_WORDS = new Set([
  'the', 'and', 'that', 'have', 'with', 'from', 'they', 'would', 'there', 'their', 'what', 'about',
  'which', 'when', 'make', 'like', 'time', 'just', 'know', 'take', 'people', 'into', 'year', 'your',
  'good', 'some', 'could', 'them', 'other', 'than', 'then', 'look', 'only', 'come', 'think', 'also',
  'back', 'after', 'work', 'first', 'well', 'even', 'want', 'because',
  // Thuật ngữ tiểu thuyết / Game / Hệ thống AI / Huyền huyễn / Công nghệ:
  'system', 'level', 'player', 'quest', 'skill', 'status', 'game', 'over', 'start', 'warning',
  'dragon', 'sword', 'magic', 'dungeon', 'master', 'lord', 'shadow', 'night', 'chapter', 'online',
  'welcome', 'congratulations', 'boss', 'rank', 'clear', 'kill', 'item', 'inventory', 'error',
  'success', 'mission', 'failed', 'complete', 'hero', 'villain', 'monster', 'demon', 'divine',
  'immortal', 'power', 'upgrade', 'loading', 'offline', 'bonus', 'reward', 'button', 'world',
  'story', 'volume', 'voice', 'sound', 'audio', 'reader', 'studio', 'prompt', 'generate', 'mode',
  'defense', 'attack', 'damage', 'critical', 'strength', 'agility', 'intelligence', 'stamina'
]);

/**
 * Nhận diện một câu hoặc cụm từ là Tiếng Việt hay Tiếng Anh
 * MẶC ĐỊNH LUÔN LÀ TIẾNG VIỆT ('vi-VN') trừ khi có bằng chứng tiếng Anh rõ ràng!
 */
export function detectLanguage(text: string): 'vi-VN' | 'en-US' {
  const trimmed = text.trim();
  if (!trimmed) return 'vi-VN';

  // 1. Nếu có bất kỳ ký tự có dấu tiếng Việt nào -> Chắc chắn 100% tiếng Việt
  if (VI_CHARS_REGEX.test(trimmed)) {
    return 'vi-VN';
  }

  // 2. Tách các từ
  const words = trimmed.toLowerCase().match(/[a-z]+/g) || [];
  if (words.length === 0) {
    return 'vi-VN';
  }

  // 3. Đếm số lượng từ tiếng Anh đặc trưng (không trùng từ tiếng Việt)
  let enMatches = 0;
  for (const w of words) {
    if (UNAMBIGUOUS_EN_WORDS.has(w)) {
      enMatches++;
    }
  }

  // Chỉ đánh giá là tiếng Anh nếu:
  // - Chứa ít nhất 1 từ tiếng Anh đặc trưng và chiếm tỷ lệ cao
  // - HOẶC là cụm từ tiếng Anh nguyên văn ngắn không chứa bất kỳ từ tiếng Việt nào
  if (enMatches >= 1) {
    const enRatio = enMatches / words.length;
    if (enRatio >= 0.4 || words.length <= 3) {
      return 'en-US';
    }
  }

  // Mặc định luôn là tiếng Việt để tránh đọc sai ngữ điệu
  return 'vi-VN';
}

/**
 * Tách một văn bản thành các phân đoạn song ngữ (Bilingual Segments)
 */
export function segmentBilingualText(rawText: string): SpeechSegment[] {
  if (!rawText || !rawText.trim()) return [];

  const rawParagraphs = rawText.split(/\n+/);
  const segments: SpeechSegment[] = [];
  let segmentIdCounter = 0;

  for (const paragraph of rawParagraphs) {
    const trimmedPara = paragraph.trim();
    if (!trimmedPara) continue;

    // Tách câu theo dấu ngắt câu tự nhiên (. ! ? … hoặc dấu hai chấm :)
    const sentences = trimmedPara.split(/(?<=[.!?…])\s+/);

    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s) continue;

      // 1. Nếu cả câu thuần tiếng Anh
      if (!VI_CHARS_REGEX.test(s) && detectLanguage(s) === 'en-US') {
        segments.push({
          id: `seg_${++segmentIdCounter}`,
          text: s,
          lang: 'en-US',
          wordCount: s.split(/\s+/).length,
        });
        continue;
      }

      // 2. Nếu câu tiếng Việt có chứa cụm trích dẫn tiếng Anh trong ngoặc: "Welcome", 'Level 99', “Dragon Breath”
      const quoteMatchRegex = /([\"\'\“\”][^\"\'\“\”]+[\"\'\“\”])/g;
      if (quoteMatchRegex.test(s)) {
        const parts = s.split(/([\"\'\“\”][^\"\'\“\”]+[\"\'\“\”])/);
        for (const part of parts) {
          const p = part.trim();
          if (!p) continue;

          const cleanQuote = p.replace(/^[\"\'\“\”]|[\"\'\“\”]$/g, '').trim();
          if (cleanQuote && !VI_CHARS_REGEX.test(cleanQuote) && detectLanguage(cleanQuote) === 'en-US') {
            segments.push({
              id: `seg_${++segmentIdCounter}`,
              text: cleanQuote,
              lang: 'en-US',
              wordCount: cleanQuote.split(/\s+/).length,
            });
          } else {
            segments.push({
              id: `seg_${++segmentIdCounter}`,
              text: p,
              lang: 'vi-VN',
              wordCount: p.split(/\s+/).length,
            });
          }
        }
        continue;
      }

      // 3. Mặc định là câu tiếng Việt
      segments.push({
        id: `seg_${++segmentIdCounter}`,
        text: s,
        lang: 'vi-VN',
        wordCount: s.split(/\s+/).length,
      });
    }
  }

  return segments;
}

/**
 * Tìm kiếm giọng đọc Web Speech API tương ứng
 * QUY TẮC SỐ 1: TUYỆT ĐỐI KHÔNG DÙNG GIỌNG TIẾNG ANH CHO TIẾNG VIỆT
 */
export function findBestVoiceForLang(
  lang: 'vi-VN' | 'en-US',
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  if (lang === 'vi-VN') {
    // 1. Tìm voice tiếng Việt chính thức theo lang code
    const viExact = voices.find(
      (v) =>
        v.lang === 'vi-VN' ||
        v.lang === 'vi_VN' ||
        v.lang.toLowerCase().startsWith('vi')
    );
    if (viExact) return viExact;

    // 2. Tìm voice tiếng Việt theo tên chuẩn
    const viByName = voices.find((v) => {
      const name = v.name.toLowerCase();
      return (
        name.includes('vietnam') ||
        name.includes('tiếng việt') ||
        name.includes('hoaimy') ||
        name.includes('namminh') ||
        name.includes('mai') ||
        name.includes('linh')
      );
    });
    if (viByName) return viByName;

    // QUAN TRỌNG: Nếu không có giọng tiếng Việt trong hệ thống,
    // TUYỆT ĐỐI KHÔNG FALLBACK sang giọng tiếng Anh (voices[0])!
    // Trả về null để trình duyệt tự nhận diện qua utterance.lang = 'vi-VN'
    return null;
  }

  if (lang === 'en-US') {
    // 1. Tìm giọng tiếng Anh tự nhiên
    const naturalEnVoice = voices.find(
      (v) =>
        (v.lang.includes('en-US') || v.lang.includes('en_US')) &&
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Jenny') || v.name.includes('Guy'))
    );
    if (naturalEnVoice) return naturalEnVoice;

    const anyEnVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('en')
    );
    if (anyEnVoice) return anyEnVoice;

    return null;
  }

  return null;
}
