# Kế Hoạch Triển Khai: Quy Trình AI Đồng Tác Giả — Định Hướng Tình Tiết (AI Co-Writer Direction Flow)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng quy trình tương tác 2 bước trong modal "AI VIẾT TIẾP" của ZORY Studio: AI đề xuất 3 hướng đi tình tiết để tác giả duyệt/chỉnh trước khi sinh chính văn, tránh quá tải prompt và tránh AI bẻ lái cốt truyện.

**Architecture:** Mở rộng backend `/api/ai/generate` với thao tác `SUGGEST_DIRECTIONS` xuất JSON 3 hướng đi cốt truyện và nâng cấp `CONTINUE` nhận `directionSummary`. Cập nhật `StudioWorkspace.tsx` với Stepper 2 bước, 3 thẻ hướng đi tương tác, ô nhập ý tưởng riêng và nút bỏ qua viết tự do.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide React, Node.js built-in test runner (`node:test`, `node:assert`).

## Global Constraints

- Không làm gián đoạn hay phá vỡ các thao tác AI hiện có (`REWRITE`, `SUMMARIZE`, `OUTLINE`, `CHARACTER`).
- `SUGGEST_DIRECTIONS` tiêu thụ token ít (< 300 tokens), phản hồi nhanh, có fallback khi JSON lỗi.
- Đảm bảo responsive hoàn hảo cả trên điện thoại di động và máy tính bàn.
- Typography đồng bộ chuẩn thiết kế `font-sans font-bold` cho tiêu đề và nhãn, `font-serif` cho nội dung văn học.

---

### Task 1: Bộ Mock và Tiện Ích Phân Tích Hướng Đi (`src/lib/ai/adapter.ts`)

**Files:**
- Modify: `src/lib/ai/adapter.ts`
- Test: `tests/unit/ai-direction-mock.test.ts`

**Interfaces:**
- Consumes: `AiAdapter.generateSmartMock(prompt: string, systemPrompt?: string): AiResponse`
- Produces: JSON payload chứa 3 hướng đi tình tiết khi prompt chứa từ khóa `gợi ý hướng đi` hoặc `hướng cốt truyện` hoặc `suggest_directions`.

- [ ] **Step 1: Viết test kiểm tra sinh mock 3 hướng đi**

Tạo file `tests/unit/ai-direction-mock.test.ts`:
```typescript
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
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `node --test tests/unit/ai-direction-mock.test.ts`
Expected: FAIL vì `generateSmartMock` chưa xử lý prompt hướng đi và trả về văn bản thường, không parse được JSON.

- [ ] **Step 3: Triển khai logic mock 3 hướng đi trong `src/lib/ai/adapter.ts`**

Chỉnh sửa hàm `generateSmartMock` trong [src/lib/ai/adapter.ts](file:///d:/PROJECT/ZORY/src/lib/ai/adapter.ts):
```typescript
    // Gợi ý hướng đi tình tiết (Suggest Directions)
    if (
      promptLower.includes('hướng đi') ||
      promptLower.includes('ngã rẽ') ||
      promptLower.includes('suggest_directions') ||
      (systemPrompt && systemPrompt.includes('SUGGEST_DIRECTIONS'))
    ) {
      const directions = [
        {
          id: 'A',
          tag: 'CAO TRÀO',
          title: 'Bộc lộ chân tướng & Quyết chiến',
          summary: 'Nhân vật phát hiện cạm bẫy của đối phương và chủ động tung đòn phản kích dồn dập, đẩy xung đột lên đỉnh điểm căng thẳng.',
        },
        {
          id: 'B',
          tag: 'BÍ ẨN',
          title: 'Phát hiện manh mối & Rút lui',
          summary: 'Nhân vật tình cờ tìm thấy một cổ vật hoặc ký hiệu bí mật giữa đống đổ nát, quyết định ẩn thân thoái lui để điều tra.',
        },
        {
          id: 'C',
          tag: 'TÂM LÝ',
          title: 'Đấu trí & Thỏa hiệp ngầm',
          summary: 'Thay vì giao tranh trực diện, nhân vật mở lời đàm phán thăm dò động cơ của đối phương, gài bẫy tâm lý sâu sắc.',
        },
      ];
      return {
        content: JSON.stringify(directions, null, 2),
        model: 'zory-literary-engine-local',
        tokensUsed: 160,
        isMock: true,
      };
    }
```

- [ ] **Step 4: Chạy test để xác nhận test vượt qua**

Run: `node --test tests/unit/ai-direction-mock.test.ts`
Expected: PASS

- [ ] **Step 5: Commit code Task 1**

```bash
git add src/lib/ai/adapter.ts tests/unit/ai-direction-mock.test.ts
git commit -m "feat(ai): support SUGGEST_DIRECTIONS mock in ai adapter"
```

---

### Task 2: Backend API Route Hỗ Trợ `SUGGEST_DIRECTIONS` & `directionSummary` (`src/app/api/ai/generate/route.ts`)

**Files:**
- Modify: `src/app/api/ai/generate/route.ts`
- Test: `tests/unit/ai-generate-directions-route.test.ts`

**Interfaces:**
- Consumes: `POST /api/ai/generate` với `{ operation: 'SUGGEST_DIRECTIONS', prompt, systemPrompt, projectId }`
- Consumes: `POST /api/ai/generate` với `{ operation: 'CONTINUE', prompt, directionSummary, instruction, ... }`
- Produces: `{ success: true, directions: Array<{ id, tag, title, summary }>, content, ... }` khi `operation === 'SUGGEST_DIRECTIONS'`.

- [ ] **Step 1: Viết test cho hàm phân tích JSON hướng đi**

Tạo file `tests/unit/ai-generate-directions-route.test.ts`:
```typescript
import { test } from 'node:test';
import assert from 'node:assert';

function parseAiDirections(rawContent: string) {
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
```

- [ ] **Step 2: Chạy test để xác nhận logic parser**

Run: `node --test tests/unit/ai-generate-directions-route.test.ts`
Expected: PASS

- [ ] **Step 3: Cập nhật route `src/app/api/ai/generate/route.ts`**

Trong `src/app/api/ai/generate/route.ts`:
1. Nhận thêm `directionSummary` từ `body`.
2. Thêm xử lý `operation === 'SUGGEST_DIRECTIONS'`:
   - Prompt yêu cầu xuất định dạng JSON 3 hướng đi.
   - Giảm `targetTokens = 600`.
   - Gọi `aiAdapter.complete`.
   - Parse chuỗi trả về thành `directions`.
   - Trả về JSON `{ success: true, directions, ... }`.
3. Trong `operation === 'CONTINUE'`:
   - Ghép `directionSummary` vào prompt với chỉ dẫn nghiêm ngặt:
     `[HƯỚNG ĐI ĐÃ ĐƯỢC TÁC GIẢ PHÊ DUYỆT - BẮT BUỘC BÁM SÁT 100%]: "${directionSummary}". Tuyệt đối không được thay đổi mạch truyện hay bẻ lái ngoài ý đồ tác giả.`

- [ ] **Step 4: Chạy lại test suite để xác minh không có hồi quy**

Run: `node --test tests/unit/ai-direction-mock.test.ts tests/unit/ai-generate-directions-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit code Task 2**

```bash
git add src/app/api/ai/generate/route.ts tests/unit/ai-generate-directions-route.test.ts
git commit -m "feat(api): add SUGGEST_DIRECTIONS operation and directionSummary support"
```

---

### Task 3: Giao Diện Stepper 2 Bước & 3 Thẻ Hướng Đi Trong `StudioWorkspace.tsx`

**Files:**
- Modify: `src/components/studio/StudioWorkspace.tsx`

**Interfaces:**
- State:
  - `aiStep`: `1 | 2`
  - `directionLoading`: boolean
  - `directionOptions`: `Array<{ id: string; tag: string; title: string; summary: string }>`
  - `selectedDirectionId`: string | null
  - `customDirection`: string
  - `activeDirectionSummary`: string
- Actions:
  - `fetchDirections()`: gọi `/api/ai/generate` với `operation: 'SUGGEST_DIRECTIONS'`.
  - `handleSelectDirection(id: string)`: chọn thẻ gợi ý.
  - `handleProceedToProse()`: chuyển sang bước 2 mang theo hướng đi đã chọn.
  - `handleSkipDirections()`: chuyển sang bước 2 mà không kèm hướng đi (viết tự do).
  - `handleBackToDirections()`: quay lại bước 1 để đổi hướng.

- [ ] **Step 1: Khai báo State & Hàm điều hướng tình tiết trong `StudioWorkspace.tsx`**

Thêm các state:
```typescript
  // AI Co-Writer Direction States
  const [aiStep, setAiStep] = useState<1 | 2>(1);
  const [directionLoading, setDirectionLoading] = useState(false);
  const [directionOptions, setDirectionOptions] = useState<
    Array<{ id: string; tag: string; title: string; summary: string }>
  >([]);
  const [selectedDirectionId, setSelectedDirectionId] = useState<string | null>(null);
  const [customDirection, setCustomDirection] = useState('');
  const [activeDirectionSummary, setActiveDirectionSummary] = useState('');
```

Cập nhật `handleOpenAiModal`:
- Khi `operation === 'CONTINUE'`:
  - Đặt `aiStep(1)`, `setSelectedDirectionId(null)`, `setCustomDirection('')`, `setActiveDirectionSummary('')`.
  - Kích hoạt gọi API `SUGGEST_DIRECTIONS`.
- Khi `operation !== 'CONTINUE'` (`REWRITE`, `SUMMARIZE`):
  - Nhảy thẳng sang `aiStep(2)`.

- [ ] **Step 2: Triển khai hàm gọi gợi ý hướng đi `fetchDirections`**

```typescript
  const fetchDirections = async () => {
    setDirectionLoading(true);
    setDirectionOptions([]);
    setSelectedDirectionId(null);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'SUGGEST_DIRECTIONS',
          prompt: chapterContent ? chapterContent.slice(-800) : (currentChapter.summary || project.premise || ''),
          projectId: project.id,
          systemPrompt: `Ngữ cảnh thế giới: ${worldBibleText}. Phong cách: ${project.writingStyle}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.directions && Array.isArray(data.directions)) {
        setDirectionOptions(data.directions);
        if (data.directions.length > 0) {
          setSelectedDirectionId(data.directions[0].id);
        }
      }
    } catch (err) {
      console.warn('Lỗi tải gợi ý hướng đi:', err);
    } finally {
      setDirectionLoading(false);
    }
  };
```

- [ ] **Step 3: Cập nhật hàm `handleTriggerAi` để gửi `directionSummary`**

Trong `handleTriggerAi`:
```typescript
        body: JSON.stringify({
          operation: aiOperation,
          prompt: chapterContent || (currentChapter.summary ? `Cốt truyện chương: ${currentChapter.summary}` : ''),
          selectedText: aiOperation === 'REWRITE' ? textToRewrite : (selectedText || (chapterContent ? chapterContent.slice(-800) : '')),
          instruction: aiInstruction,
          directionSummary: activeDirectionSummary,
          length: aiLength,
          projectId: project.id,
          systemPrompt: `Ngữ cảnh thế giới: ${worldBibleText}. Phong cách: ${project.writingStyle}`,
        }),
```

- [ ] **Step 4: Cập nhật JSX Modal Trợ Lý AI với Stepper 2 bước**

1. **Thanh Stepper ở đầu modal:**
   - Bước 1: `01. ĐỊNH HƯỚNG TÌNH TIẾT` (sáng khi `aiStep === 1`, có dấu check khi `aiStep === 2`).
   - Bước 2: `02. SINH CHÍNH VĂN HOÀN CHỈNH` (sáng khi `aiStep === 2`).
2. **Giao diện `aiStep === 1`:**
   - Trạng thái loading: 3 skeleton thẻ nhấp nháy + thông báo phân tích.
   - Danh sách 3 thẻ hướng đi với huy hiệu tag (`CAO TRÀO`, `BÍ ẨN`, `TÂM LÝ`), viền sáng `border-primary` và radio indicator khi được chọn.
   - Nút "Tải lại gợi ý" (`RotateCw`).
   - Khung nhập ý tưởng tùy chọn (`customDirection`).
   - Footer hành động:
     - Nút "BỎ QUA (VIẾT TỰ DO)" -> nhảy sang `aiStep(2)` không có hướng đi.
     - Nút "TIẾP TỤC VỚI HƯỚNG NÀY ➔" -> chốt `activeDirectionSummary` và nhảy sang `aiStep(2)`.
3. **Giao diện `aiStep === 2`:**
   - Nếu có `activeDirectionSummary`: Hiển thị khung ghim hướng đi đã duyệt trên đầu cùng nút `← ĐỔI HƯỚNG` để quay lại `aiStep(1)`.
   - Bộ chọn dung lượng từ (`Đại chương`, `Cảnh dài`, `Tiêu chuẩn`, `Ngắn gọn`).
   - Nút `TẠO BẢN ĐỀ XUẤT`.
   - Khung xem trước bản thảo & nút `CHÈN VÀO BẢN THẢO`.

- [ ] **Step 5: Kiểm tra biên dịch Next.js**

Run: `npm run build`
Expected: Biên dịch thành công 100%, không có lỗi type hay lint.

- [ ] **Step 6: Commit code Task 3**

```bash
git add src/components/studio/StudioWorkspace.tsx
git commit -m "feat(studio): add interactive AI Co-Writer Direction Flow with 2-step stepper"
```

---

### Task 4: Kiểm Thử Toàn Diện & Đóng Gói (Final Verification & Delivery)

**Files:**
- Toàn bộ codebase liên quan

- [ ] **Step 1: Chạy toàn bộ các unit test của dự án**

Run: `node --test tests/unit/*.test.ts`
Expected: Tất cả các file test vượt qua 100%.

- [ ] **Step 2: Chạy kiểm thử Build Production**

Run: `npm run build`
Expected: Build thành công không có lỗi.

- [ ] **Step 3: Push toàn bộ commit lên remote Git**

```bash
git push origin main
```
