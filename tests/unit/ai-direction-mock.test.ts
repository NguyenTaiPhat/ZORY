import { test } from 'node:test';
import assert from 'node:assert';
import { aiAdapter } from '../../src/lib/ai/adapter.ts';

test('1.1. aiAdapter generateSmartMock trả về 3 hướng đi hợp lệ cho SUGGEST_DIRECTIONS', async () => {
  const result = await aiAdapter.complete({
    prompt: 'Nhiệm vụ: Gợi ý 3 hướng đi tình tiết tiếp theo cho câu chuyện...',
    systemPrompt: 'SUGGEST_DIRECTIONS: Xuất định dạng JSON',
    maxTokens: 600,
  });

  assert.ok(result.content, 'Content không được rỗng');
  const parsed = JSON.parse(result.content);
  assert.ok(Array.isArray(parsed), 'Kết quả phải là một mảng');
  assert.strictEqual(parsed.length, 3, 'Phải có đúng 3 hướng đi');
  for (const item of parsed) {
    assert.ok(item.id, 'Phải có trường id');
    assert.ok(item.tag, 'Phải có trường tag');
    assert.ok(item.title, 'Phải có trường title');
    assert.ok(item.summary, 'Phải có trường summary');
  }
});
