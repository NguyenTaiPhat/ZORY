import crypto from 'crypto';
import prisma from '../db';

export interface TtsRequest {
  text: string;
  voice?: string;
  speed?: number;
  chapterId?: string;
  userId?: string;
}

export interface TtsResult {
  jobId: string;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'WEB_SPEECH_READY';
  audioUrl?: string;
  duration?: number;
  provider: string;
  voice: string;
  speed: number;
  message?: string;
}

export class TtsAdapter {
  private provider: string;
  private defaultVoice: string;

  constructor() {
    this.provider = process.env.TTS_PROVIDER || 'web-speech';
    this.defaultVoice = process.env.TTS_VOICE || 'vi-VN-HoaiMyNeural';
  }

  public getStatus() {
    return {
      provider: this.provider,
      defaultVoice: this.defaultVoice,
      supportsClientSynthesis: this.provider === 'web-speech',
    };
  }

  public hashContent(text: string, voice: string, speed: number): string {
    return crypto
      .createHash('sha256')
      .update(`${text.trim()}_${voice}_${speed}`)
      .digest('hex');
  }

  public async processTts(req: TtsRequest): Promise<TtsResult> {
    const { text, voice = this.defaultVoice, speed = 1.0, chapterId, userId } = req;
    const contentHash = this.hashContent(text, voice, speed);

    // 1. Kiểm tra Cache
    const cached = await prisma.ttsCache.findUnique({
      where: { contentHash },
    });

    if (cached) {
      return {
        jobId: `cached_${cached.id}`,
        status: 'COMPLETED',
        audioUrl: cached.audioUrl,
        duration: cached.duration,
        provider: cached.provider,
        voice: cached.voice,
        speed: cached.speed,
      };
    }

    // 2. Chế độ Web Speech API (Client Synthesis)
    // Cung cấp giải pháp đọc không phụ thuộc API key, hoạt động trực tiếp trong trình duyệt người dùng
    if (this.provider === 'web-speech') {
      return {
        jobId: `ws_${Date.now()}`,
        status: 'WEB_SPEECH_READY',
        provider: 'web-speech',
        voice,
        speed,
        message: 'Trình đọc Web Speech API đã sẵn sàng phát trực tiếp trong trình duyệt.',
      };
    }

    // 3. Xử lý các provider khác (nếu có cấu hình Azure / Google)
    // Giả lập lưu cache kết quả tạo
    const mockAudioUrl = `/api/tts/audio-stream?hash=${contentHash}`;
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = Math.round((wordCount / (180 * speed)) * 60);

    const newCache = await prisma.ttsCache.create({
      data: {
        contentHash,
        provider: this.provider,
        voice,
        speed,
        audioUrl: mockAudioUrl,
        duration: estimatedDuration,
      },
    });

    if (chapterId) {
      await prisma.ttsJob.create({
        data: {
          chapterId,
          userId,
          provider: this.provider,
          voice,
          speed,
          status: 'COMPLETED',
          audioUrl: mockAudioUrl,
          duration: estimatedDuration,
          charCount: text.length,
        },
      });
    }

    return {
      jobId: newCache.id,
      status: 'COMPLETED',
      audioUrl: mockAudioUrl,
      duration: estimatedDuration,
      provider: this.provider,
      voice,
      speed,
    };
  }
}

export const ttsAdapter = new TtsAdapter();
