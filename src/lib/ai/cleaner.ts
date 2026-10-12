/**
 * Bộ lọc tự động làm sạch nội dung sáng tác AI:
 * Cắt bỏ hoàn toàn lời dẫn đầu (preamble), lời kết (closing fluff) và ký hiệu phân cách (***, ---).
 * Đảm bảo chỉ giữ lại 100% chính văn tác phẩm văn học thuần túy.
 */
export function cleanAiLiteratureOutput(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText.trim();

  // 1. Loại bỏ markdown code blocks nếu AI bọc toàn bộ trong ```markdown ... ``` hoặc ``` ... ```
  if (text.startsWith('```') && text.endsWith('```')) {
    text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  // 2. Tách thành các đoạn văn để phân tích phần mở đầu
  const paragraphs = text.split(/\n\s*\n/);

  // Danh sách các mẫu nhận diện lời dẫn mở đầu điển hình của LLM
  const openingFluffPatterns = [
    /^(dưới đây|sau đây|đây là|chắc chắn rồi|tất nhiên rồi|vâng|chào bạn|tôi xin phép)/i,
    /(đã được trau chuốt|được viết tiếp|viết lại theo|gợi ý tiêu đề|bản tóm tắt|đoạn văn tiếp theo)/i,
    /(theo yêu cầu của bạn|phong cách văn học|giàu cảm xúc|tính tạo hình|chiều sâu cảm xúc)/i,
  ];

  // Kiểm tra nếu đoạn đầu tiên chứa lời dẫn nhập (thường kết thúc bằng dấu : hoặc ngắn)
  while (paragraphs.length > 1) {
    const firstPara = paragraphs[0].trim();

    // Trường hợp đoạn đầu chỉ là dòng phân cách như ***, ---, ___
    if (/^[\*\-\_\#\=\~]{2,}$/.test(firstPara)) {
      paragraphs.shift();
      continue;
    }

    // Trường hợp đoạn đầu là câu dẫn kết thúc bằng dấu hai chấm (:) hoặc chứa từ khóa dẫn nhập
    const isEndingWithColon = firstPara.endsWith(':');
    const matchesOpeningPattern = openingFluffPatterns.some((pattern) => pattern.test(firstPara));

    if ((isEndingWithColon && matchesOpeningPattern) || (matchesOpeningPattern && firstPara.length < 250)) {
      paragraphs.shift();
      // Tiếp tục vòng lặp để dọn luôn dấu *** ngay sau lời dẫn (nếu có)
      continue;
    }

    break;
  }

  text = paragraphs.join('\n\n').trim();

  // 3. Xử lý trường hợp lời dẫn không tách thành paragraph mà chỉ là dòng đầu kết thúc bằng dấu :
  const lines = text.split('\n');
  while (lines.length > 1) {
    const firstLine = lines[0].trim();
    if (
      firstLine.endsWith(':') &&
      openingFluffPatterns.some((pattern) => pattern.test(firstLine))
    ) {
      lines.shift();
      continue;
    }
    if (/^[\*\-\_\#\=\~]{2,}$/.test(firstLine)) {
      lines.shift();
      continue;
    }
    break;
  }
  text = lines.join('\n').trim();

  // 4. Loại bỏ các dòng phân cách thừa ở đầu hoặc cuối văn bản
  text = text.replace(/^([\*\-\_\#\=\~]{2,}\s*\n+)+/, '');
  text = text.replace(/(\n+[\*\-\_\#\=\~]{2,}\s*)+$/, '');

  // 5. Loại bỏ lời kết xã giao ở cuối văn bản (closing chatter)
  const closingFluffRegex = /(\n\s*\n|\n)(hy vọng|chúc bạn|nếu bạn cần|mong rằng|trên đây là|bạn có muốn|hãy cho tôi biết)[\s\S]*$/i;
  text = text.replace(closingFluffRegex, '').trim();

  return text;
}
