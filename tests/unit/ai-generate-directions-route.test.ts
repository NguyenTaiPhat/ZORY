import { test } from 'node:test';
import assert from 'node:assert';

export function parseAiDirections(rawContent: string) {
  try {
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any, idx: number) => ({
          id: item.id || String.fromCharCode(65 + idx),
          tag: item.tag || 'DIỄN BIẾN',
          title: item.title || `Hướng đi ${idx + 1}`,
          summary: item.summary || item.description || '',
        }));
      }
    }
  } catch {}
  return [
    {
      id: 'A',
      tag: 'CAO TRÀO',
      title: 'Bộc lộ chân tướng & Quyết chiến',
      summary: 'Nhân vật phát hiện cạm bẫy và chủ động tung đòn phản kích dồn dập.',
    },
    {
      id: 'B',
      tag: 'BÍ ẨN',
      title: 'Phát hiện manh mối & Rút lui',
      summary: 'Nhân vật tìm thấy manh mối bí mật, quyết định giấu mình rút lui điều tra.',
    },
    {
      id: 'C',
      tag: 'TÂM LÝ',
      title: 'Đấu trí & Thỏa hiệp ngầm',
      summary: 'Nhân vật đàm phán thăm dò động cơ của đối phương, gài bẫy tâm lý.',
    },
  ];
}

test('2.1. parseAiDirections bóc tách JSON thành công từ chuỗi markdown bọc code block', () => {
  const mockMarkdown = '```json\n[\n  {"id": "A", "tag": "CAO TRÀO", "title": "Đột kích", "summary": "Tấn công bất ngờ"}\n]\n```';
  const res = parseAiDirections(mockMarkdown);
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].id, 'A');
  assert.strictEqual(res[0].title, 'Đột kích');
});

test('2.2. parseAiDirections trả về fallback dự phòng nếu JSON bị hỏng', () => {
  const broken = 'Không thể xuất json được...';
  const res = parseAiDirections(broken);
  assert.strictEqual(res.length, 3);
  assert.strictEqual(res[0].id, 'A');
});
