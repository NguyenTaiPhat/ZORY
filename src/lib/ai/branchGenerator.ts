import { aiAdapter } from './adapter';

export interface SuggestedBranch {
  choiceText: string;
  summary: string;
  tag?: string; // Mạo hiểm, Trầm ổn, Bất ngờ, Kịch tính
}

/**
 * AI phân tích đoạn kết của chương hiện tại và đề xuất 2-3 ngã rẽ cốt truyện
 */
export async function suggestStoryBranches(
  chapterTitle: string,
  chapterContent: string,
  bookContext: { title: string; genre: string }
): Promise<SuggestedBranch[]> {
  const endingSnippet = chapterContent.slice(-1500);

  const prompt = `Bạn là bậc thầy biên kịch tiểu thuyết tương tác (Choose Your Own Adventure).
Dưới đây là phần kết của chương truyện:
Tác phẩm: "${bookContext.title}"
Thể loại: "${bookContext.genre}"
Tên chương: "${chapterTitle}"
Đoạn kết chương:
"""
${endingSnippet}
"""

NHIỆM VỤ: Hãy đề xuất CHÍNH XÁC 3 ngã rẽ cốt truyện tiếp theo (Branching Paths).
Mỗi ngã rẽ phải tạo ra xung đột, sự tò mò và bước ngoặt khác nhau để độc giả hoặc tác giả lựa chọn.

YÊU CẦU ĐẦU RA (JSON THUẦN TÚY, KHÔNG LỜI DẪN):
{
  "branches": [
    {
      "choiceText": "Hành động lựa chọn ngắn gọn, hấp dẫn (dưới 15 từ)",
      "summary": "Tóm tắt ngắn gọn biến cố xảy ra theo nhánh này (1-2 câu)",
      "tag": "Mạo hiểm"
    },
    {
      "choiceText": "...",
      "summary": "...",
      "tag": "Trầm ổn"
    },
    {
      "choiceText": "...",
      "summary": "...",
      "tag": "Bất ngờ"
    }
  ]
}`;

  try {
    const res = await aiAdapter.complete({
      prompt,
      temperature: 0.8,
      maxTokens: 1200,
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
    if (Array.isArray(parsed.branches) && parsed.branches.length > 0) {
      return parsed.branches;
    }
  } catch (err) {
    console.warn('[BranchGenerator] AI parse error, using fallback:', err);
  }

  // Fallback branches nếu AI gặp sự cố
  return [
    {
      choiceText: 'Quyết định tiến sâu vào vùng cấm địa để tìm kiếm cơ duyên',
      summary: 'Dấn thân vào hiểm cảnh nghìn năm, chạm trán cấm chế cổ xưa và báu vật thất truyền.',
      tag: 'Mạo hiểm',
    },
    {
      choiceText: 'Tạm thời rút lui về sơn môn để củng cố tu vi và tìm viện trợ',
      summary: 'Bảo toàn thực lực, báo tin cho sư môn và chuẩn bị kế sách chu toàn.',
      tag: 'Trầm ổn',
    },
    {
      choiceText: 'Âm thầm bám theo tung tích kẻ địch để điều tra chân tướng bí mật',
      summary: 'Phát hiện âm mưu kinh thiên động địa đang âm thầm thao túng cục diện.',
      tag: 'Kịch tính',
    },
  ];
}
