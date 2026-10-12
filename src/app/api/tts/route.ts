import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const lang = searchParams.get('lang') || 'vi';

    // 1. Kiểm tra mã ngôn ngữ (chống parameter injection)
    const allowedLangs = ['vi', 'en', 'ja', 'ko', 'zh', 'fr', 'es', 'de'];
    if (!allowedLangs.includes(lang.toLowerCase().trim())) {
      return NextResponse.json({ error: 'Mã ngôn ngữ không được hỗ trợ hoặc không hợp lệ' }, { status: 400 });
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Thiếu nội dung văn bản' }, { status: 400 });
    }

    const cleanText = text.trim();

    // 2. Chống DoS / cạn kiệt tài nguyên: giới hạn tối đa 1.000 ký tự
    if (cleanText.length > 1000) {
      return NextResponse.json(
        { error: 'Độ dài văn bản vượt quá giới hạn (tối đa 1.000 ký tự)' },
        { status: 400 }
      );
    }

    // Google Translate TTS giới hạn ~200 ký tự cho mỗi request.
    // Nếu ngắn hơn 200 ký tự, fetch trực tiếp:
    if (cleanText.length <= 200) {
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        cleanText
      )}&tl=${lang}&client=tw-ob`;

      const response = await fetch(googleTtsUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'Lỗi nạp audio từ TTS' }, { status: 502 });
      }

      const buffer = await response.arrayBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    // Nếu dài hơn 200 ký tự: chia nhỏ theo dấu câu và ghép nối MP3 buffers
    const chunks: string[] = [];
    let currentChunk = '';
    const sentences = cleanText.split(/([.,!?;:\n]+)/);

    for (const part of sentences) {
      if ((currentChunk + part).length <= 190) {
        currentChunk += part;
      } else {
        if (currentChunk.trim()) chunks.push(currentChunk.trim());
        currentChunk = part;
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());

    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        chunk
      )}&tl=${lang}&client=tw-ob`;

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      });

      if (res.ok) {
        const ab = await res.arrayBuffer();
        audioBuffers.push(Buffer.from(ab));
      }
    }

    const mergedBuffer = Buffer.concat(audioBuffers);

    return new NextResponse(mergedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error: any) {
    console.error('Lỗi API TTS:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống TTS' }, { status: 500 });
  }
}
