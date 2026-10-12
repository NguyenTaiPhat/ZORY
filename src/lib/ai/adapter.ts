import { getNextRotatedKey, recordKeyUsageResult } from './keyRotation';

export interface AiRequestOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AiResponse {
  content: string;
  model: string;
  tokensUsed: number;
  isMock: boolean;
  keyUsed?: string;
}

export class AiAdapter {
  private provider: string;
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.provider = process.env.AI_PROVIDER || 'gemini';
    this.apiKey = process.env.AI_API_KEY || '';
    this.baseUrl = process.env.AI_BASE_URL || '';
    this.model = process.env.AI_MODEL || 'gemini-3.5-flash-lite';
  }

  public getStatus() {
    return {
      provider: this.provider,
      configured: !!this.apiKey,
      model: this.model,
      isMock: this.provider === 'mock' && !this.apiKey,
    };
  }

  public async complete(options: AiRequestOptions): Promise<AiResponse> {
    const { prompt, systemPrompt, temperature = 0.7, maxTokens = 1500 } = options;

    // 1. Thử xoay API key từ Pool trong Database trước (Cân bằng tải Round-Robin)
    const targetProvider = this.provider === 'mock' ? 'gemini' : this.provider;
    const triedKeyIds: string[] = [];

    // Tối đa 3 lần thử với các key khác nhau nếu gặp 429 / lỗi mạng
    for (let attempt = 0; attempt < 3; attempt++) {
      const rotatedKey = await getNextRotatedKey(targetProvider, triedKeyIds);
      if (!rotatedKey) break;

      triedKeyIds.push(rotatedKey.id);

      try {
        if (targetProvider === 'gemini') {
          const res = await this.callGeminiApiWithKey(
            rotatedKey.key,
            prompt,
            systemPrompt,
            temperature,
            maxTokens
          );
          await recordKeyUsageResult(rotatedKey.id, true);
          return {
            ...res,
            keyUsed: rotatedKey.name,
          };
        } else if (targetProvider === 'openai' || targetProvider === 'groq') {
          const res = await this.callOpenAiCompatibleWithKey(
            rotatedKey.key,
            prompt,
            systemPrompt,
            temperature,
            maxTokens
          );
          await recordKeyUsageResult(rotatedKey.id, true);
          return {
            ...res,
            keyUsed: rotatedKey.name,
          };
        }
      } catch (err: any) {
        const statusCode = err?.status || (err?.message?.includes('429') ? 429 : 500);
        await recordKeyUsageResult(rotatedKey.id, false, err.message, statusCode);
        console.warn(`[AiAdapter] Key ${rotatedKey.name} lỗi (${statusCode}), đang thử key tiếp theo...`);
      }
    }

    // 2. Nếu pool database không có key hoặc đều lỗi, fallback về biến môi trường .env
    if (this.apiKey) {
      if (this.provider === 'openai' || this.provider === 'groq') {
        return this.callOpenAiCompatibleWithKey(
          this.apiKey,
          prompt,
          systemPrompt,
          temperature,
          maxTokens
        );
      }
      if (this.provider === 'gemini') {
        return this.callGeminiApiWithKey(
          this.apiKey,
          prompt,
          systemPrompt,
          temperature,
          maxTokens
        );
      }
    }

    // 3. Fallback: AI Engine nội bộ (Mock văn học chân thực cho ZORY)
    return this.generateSmartMock(prompt, systemPrompt);
  }

  private async callOpenAiCompatibleWithKey(
    apiKey: string,
    prompt: string,
    systemPrompt?: string,
    temperature = 0.7,
    maxTokens = 1500
  ): Promise<AiResponse> {
    const url = this.baseUrl || 'https://api.openai.com/v1/chat/completions';
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        const err: any = new Error(`AI API Error (${res.status}): ${errorText}`);
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      return {
        content: data.choices?.[0]?.message?.content || '',
        model: this.model,
        tokensUsed: data.usage?.total_tokens || 100,
        isMock: false,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async callGeminiApiWithKey(
    apiKey: string,
    prompt: string,
    systemPrompt?: string,
    temperature = 0.7,
    maxTokens = 1500
  ): Promise<AiResponse> {
    return this.callGeminiWithModel(this.model, apiKey, prompt, systemPrompt, temperature, maxTokens);
  }

  private async callGeminiWithModel(
    modelName: string,
    apiKey: string,
    prompt: string,
    systemPrompt?: string,
    temperature = 0.7,
    maxTokens = 1500
  ): Promise<AiResponse> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const fullText = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    const controller = new AbortController();
    // Timeout 60s để AI đủ thời gian sinh đại chương 2500 - 3500 từ với chiều sâu văn học
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullText }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();

        // Nếu model gặp 503 (quá tải), 404 hoặc 429 thì tự động fallback ngay sang gemini-3.5-flash-lite siêu tốc
        if ((res.status === 503 || res.status === 404) && modelName !== 'gemini-3.5-flash-lite') {
          console.warn(`[AiAdapter] Model ${modelName} bị ${res.status}, chuyển sang gemini-3.5-flash-lite...`);
          return this.callGeminiWithModel('gemini-3.5-flash-lite', apiKey, prompt, systemPrompt, temperature, maxTokens);
        }

        const err: any = new Error(`Gemini API Error (${res.status}): ${errorText}`);
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        content,
        model: modelName,
        tokensUsed: data.usageMetadata?.totalTokenCount || 150,
        isMock: false,
      };
    } catch (err: any) {
      // Khi quá thời gian (AbortError), thử ngay model flash-lite nhẹ hơn
      if (err.name === 'AbortError' && modelName !== 'gemini-3.5-flash-lite') {
        console.warn(`[AiAdapter] Model ${modelName} timeout (>10s), chuyển sang gemini-3.5-flash-lite...`);
        return this.callGeminiWithModel('gemini-3.5-flash-lite', apiKey, prompt, systemPrompt, temperature, maxTokens);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  private generateSmartMock(prompt: string, systemPrompt?: string): AiResponse {
    const promptLower = prompt.toLowerCase();

    // 0. Gợi ý hướng đi tình tiết (Suggest Directions)
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

    // 1. Viết tiếp câu chuyện (Continue)
    if (promptLower.includes('viết tiếp') || promptLower.includes('tiếp tục')) {
      return {
        content: `Không gian bỗng nhiên lắng xuống, chỉ còn nghe tiếng gió rít qua khe cửa gỗ. Ánh nến chao đảo hắt lên bức vách loang lổ những vệt bóng mờ ảo. 

Nhân vật khẽ siết chặt bàn tay, cảm nhận từng đợt sóng linh lực đang dồn dập cuộn trào nơi đan điền. Từng lời dạy của sư tôn năm xưa bất giác vọng lại như tiếng chuông ngân giữa sớm mai mờ sương: "Tâm không loạn, kiếm mới không lay. Khi đối diện nghịch cảnh nghìn cân treo sợi tóc, kẻ giữ được sơ tâm mới là kẻ tiếu ngạo đến cuối cùng."

Một bước chân nhẹ nhàng đạp lên nền lá khô ngoài sân gãy vụn. Đối phương đã tới.`,
        model: 'zory-literary-engine-local',
        tokensUsed: 180,
        isMock: true,
      };
    }

    // 2. Viết lại / Trau chuốt (Rewrite)
    if (promptLower.includes('viết lại') || promptLower.includes('trau chuốt') || promptLower.includes('sửa câu')) {
      return {
        content: `Màn đêm buông xuống phủ bóng mờ u tịch lên khắp rặng núi xa xôi. Trong khoảnh khắc tĩnh lặng ấy, từng thanh âm của gió và lá dường như đang thì thầm kể lại những bí mật cổ xưa bị lãng quên giữa dòng thời gian vô tận. Ánh mắt người lữ khách ánh lên nét kiên định, chuẩn bị nghênh đón phong ba bão táp sắp ập tới.`,
        model: 'zory-literary-engine-local',
        tokensUsed: 120,
        isMock: true,
      };
    }

    // 3. Tóm tắt chương (Summarize)
    if (promptLower.includes('tóm tắt') || promptLower.includes('summary')) {
      return {
        content: `Chương truyện khắc họa bước ngoặt quan trọng khi nhân vật chính chạm trán thử thách sinh tử tại phế tích cổ đại. Thông qua việc ngộ đạo và nắm bắt linh vật tổ truyền, nhân vật thành công đẩy lùi truy binh, đồng thời phát hiện ra âm mưu ngầm đang đe dọa toàn bộ gia tộc.`,
        model: 'zory-literary-engine-local',
        tokensUsed: 90,
        isMock: true,
      };
    }

    // 4. Sinh dàn ý / Nhân vật (Outline / Character)
    if (promptLower.includes('nhân vật') || promptLower.includes('dàn ý') || promptLower.includes('bối cảnh')) {
      return {
        content: `Tên nhân vật: Cố Nhược Vũ\nVai trò: Nữ tướng quân kiêm truyền nhân kiếm thuật Thần Kiếm Các\nTính cách: Quyết đoán, ngoài lạnh trong nóng, mang gánh nặng phục thù cho sư môn\nNgoại hình: Thân hình thanh mảnh trong bộ chiến giáp ánh bạc, đôi mắt sâu như hồ thu, trường kiếm bên hông tỏa hàn khí\nMục tiêu: Tìm ra kẻ phản bội trong triều đình và bảo vệ người dân vùng biên ải.`,
        model: 'zory-literary-engine-local',
        tokensUsed: 150,
        isMock: true,
      };
    }

    // Mặc định
    return {
      content: `Dưới ánh trăng mờ nhạt, một huyền thoại mới bắt đầu được chắp bút. Từng trang sử thi mở ra với những xung đột gay cấn, kết nối số phận các nhân vật giữa vòng xoáy định mệnh và khát vọng tự do cháy bỏng.`,
      model: 'zory-literary-engine-local',
      tokensUsed: 100,
      isMock: true,
    };
  }
}

export const aiAdapter = new AiAdapter();
