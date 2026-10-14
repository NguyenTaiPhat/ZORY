import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { aiAdapter } from '@/lib/ai/adapter';
import prisma from '@/lib/db';
import { cleanAiLiteratureOutput } from '@/lib/ai/cleaner';
import { getUserAiQuota, consumeUserAiTokens } from '@/lib/ai/quota';
import { buildGenreAndOrientationDirectives, formatCharacterLoreWithOrientation } from '@/lib/ai/genreGuard';

function parseAiDirections(rawContent: string) {
  try {
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any, idx: number) => ({
          id: item.id || String.fromCharCode(65 + idx),
          tag: item.tag || (idx === 0 ? 'CAO TRÀO' : idx === 1 ? 'BÍ ẨN' : 'TÂM LÝ'),
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
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để sử dụng AI Studio' }, { status: 401 });
    }

    // 1. Kiểm tra hạn mức token (Tự động reset sau mỗi 5h, ADMIN vô hạn)
    const quotaInfo = await getUserAiQuota(user.id);
    const isAdmin = user.role === 'ADMIN' || quotaInfo?.isUnlimited;
    if (!isAdmin && (!quotaInfo || quotaInfo.remaining <= 0)) {
      return NextResponse.json(
        {
          error: `Bạn đã sử dụng hết hạn mức AI (${quotaInfo?.quota.toLocaleString() || 50000} tokens). Hạn mức sẽ tự động được làm mới sau ${quotaInfo?.countdown || '5 giờ'}.`,
          remainingTokens: 0,
          resetAt: quotaInfo?.resetAt,
          resetCountdown: quotaInfo?.countdown,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      operation, // CONTINUE, SUGGEST_DIRECTIONS, REWRITE, SUMMARIZE, OUTLINE, CHARACTER, PROMPT
      prompt,
      systemPrompt,
      projectId,
      projectGenre,
      projectPremise,
      selectedText,
      instruction,
      directionSummary,
      length = 'epic', // 'short' (~500 từ) | 'standard' (~1200 từ) | 'detailed' (~2000 từ) | 'epic' (~2500 - 3500 từ)
    } = body;

    let dbGenre = projectGenre || '';
    let dbPremise = projectPremise || '';
    let loreContext = '';

    // Tự động truy vấn Thông tin Dự Án, Lorebook & Danh sách Nhân Vật
    if (projectId) {
      try {
        const [proj, loreEntries, standaloneChars] = await Promise.all([
          prisma.aiProject.findUnique({
            where: { id: projectId },
            select: { genre: true, premise: true },
          }),
          prisma.loreEntry.findMany({
            where: { projectId },
            take: 20,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.character.findMany({
            where: { projectId },
            take: 15,
            orderBy: { createdAt: 'asc' },
          }),
        ]);

        if (proj) {
          if (!dbGenre && proj.genre) dbGenre = proj.genre;
          if (!dbPremise && proj.premise) dbPremise = proj.premise;
        }

        let charList: string[] = [];
        if (loreEntries && loreEntries.length > 0) {
          charList = loreEntries
            .filter((e) => e.category === 'CHARACTER')
            .map((e) => formatCharacterLoreWithOrientation(e));
        }

        // Nếu LoreEntry chưa có nhân vật, lấy từ bảng Character
        if (charList.length === 0 && standaloneChars && standaloneChars.length > 0) {
          charList = standaloneChars.map((c) => {
            const relText = c.relationships ? ` - Mối quan hệ: ${c.relationships}` : '';
            return `- ${c.name} (${c.role}${c.abilities ? `, Cảnh giới/Năng lực: ${c.abilities}` : ''}): ${c.personality || c.appearance || 'Nhân vật chính'}${relText}`;
          });
        }

        const factions = loreEntries
          ? loreEntries
              .filter((e) => e.category === 'FACTION')
              .map((e) => `- ${e.name} (${e.role || 'Thế lực'}): ${e.summary}`)
              .join('\n')
          : '';
        const realms = loreEntries
          ? loreEntries
              .filter((e) => e.category === 'REALM')
              .map((e) => `- ${e.name}: ${e.summary}`)
              .join('\n')
          : '';

        if (charList.length > 0 || factions || realms) {
          loreContext = `\n[TRI THỨC THẾ GIỚI & HỒ SƠ NHÂN VẬT (LOREBOOK)]:
${charList.length > 0 ? `Nhân vật:\n${charList.join('\n')}\n` : ''}${factions ? `Thế lực / Môn phái:\n${factions}\n` : ''}${
            realms ? `Hệ thống cảnh giới:\n${realms}\n` : ''
          }
QUY TẮC BẮT BUỘC: Giữ đúng 100% tên nhân vật, giới tính, mối quan hệ và thiết lập đã định nghĩa ở trên, tuyệt đối không viết sai lệch lore hay tự tiện đổi giới tính nhân vật.`;
        }
      } catch (err) {
        console.warn('Lỗi lấy Lore & Project context:', err);
      }
    }

    const genreDirective = buildGenreAndOrientationDirectives(dbGenre, dbPremise);

    let targetTokens = 8192;
    let lengthInstruction =
      'QUY MÔ ĐẠI CHƯƠNG TRƯỜNG THIÊN (2500 ĐẾN 3500 TỪ): Viết một chương trọn vẹn với cảnh có mục tiêu, lực cản và hệ quả rõ ràng. Ưu tiên tương tác, xung đột, lựa chọn và thay đổi trong quan hệ nhân vật; dùng bối cảnh và nội tâm vừa đủ để nâng đỡ diễn biến. TUYỆT ĐỐI KHÔNG TÓM TẮT HAY NHẢY CÓC QUA BIẾN CỐ QUAN TRỌNG.';

    if (length === 'short') {
      targetTokens = 2000;
      lengthInstruction =
        'QUY MÔ ĐOẠN NGẮN (500 - 800 TỪ): Viết cô đọng một phân cảnh hành động hoặc khoảnh khắc đối thoại then chốt.';
    } else if (length === 'standard') {
      targetTokens = 3800;
      lengthInstruction =
        'QUY MÔ TIÊU CHUẨN (1000 - 1400 TỪ): Viết liền mạch một phân cảnh hoàn chỉnh với nhịp độ dồn dập.';
    } else if (length === 'detailed') {
      targetTokens = 5500;
      lengthInstruction =
        'QUY MÔ PHÂN CẢNH DÀI (1800 - 2400 TỪ): Phát triển một mạch cảnh liền lạc, đào sâu lựa chọn, mâu thuẫn và quan hệ giữa các nhân vật. Giữ nguyên một điểm nhìn xuyên suốt, trừ khi tác giả yêu cầu đổi POV.';
    } else if (length === 'epic' || length === 'long') {
      targetTokens = 8192;
      lengthInstruction =
        'QUY MÔ ĐẠI CHƯƠNG TRƯỜNG THIÊN (2500 ĐẾN 3500 TỪ): Viết một chương trọn vẹn với các cảnh nối tiếp có nguyên nhân và hệ quả. Dùng dung lượng để phát triển xung đột, tương tác, quyết định và hậu quả; không kéo dài cảnh bằng cách tả chậm từng cử động.';
    }

    let constructedPrompt = prompt || '';

    if (operation === 'SUGGEST_DIRECTIONS') {
      targetTokens = 600;
      constructedPrompt = `Nhiệm vụ: Bạn là chuyên gia biên kịch văn học đồng hành cùng tác giả (AI Co-Writer).
Hãy phân tích đoạn kết gần nhất của tác phẩm và đề xuất chính xác 3 hướng phát triển tình tiết tiếp theo (3 Narrative Directions).
${dbGenre ? `\nTHỂ LOẠI TÁC PHẨM: "${dbGenre}".\n` : ''}${genreDirective}

QUY TẮC BẮT BUỘC:
1. Thẻ A: CAO TRÀO / XUNG ĐỘT (Đối đầu trực tiếp, biến cố bất ngờ, nhịp dồn dập).
2. Thẻ B: BÍ ẨN / MANH MỐI (Phát hiện manh mối, xoay chuyển cục diện, toan tính mưu lược).
3. Thẻ C: TÂM LÝ / CHIỀU SÂU (Đấu trí, phát triển nội tâm, rèn luyện hoặc gắn kết nhân vật).

BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON MẢNG 3 PHẦN TỬ (không viết thêm lời dẫn nào ngoài JSON):
[
  {
    "id": "A",
    "tag": "CAO TRÀO",
    "title": "Tên hướng đi 1 ngắn gọn",
    "summary": "Tóm tắt 2-3 câu về biến cố và hành động cụ thể của nhân vật."
  },
  {
    "id": "B",
    "tag": "BÍ ẨN",
    "title": "Tên hướng đi 2 ngắn gọn",
    "summary": "Tóm tắt 2-3 câu..."
  },
  {
    "id": "C",
    "tag": "TÂM LÝ",
    "title": "Tên hướng đi 3 ngắn gọn",
    "summary": "Tóm tắt 2-3 câu..."
  }
]

ĐOẠN TRÍCH GẦN NHẤT CỦA BẢN THẢO:
"""
${selectedText || prompt || ''}
"""`;
    } else if (operation === 'CONTINUE') {
      const directionDirective = directionSummary
        ? `\n\n[HƯỚNG ĐI ĐÃ ĐƯỢC TÁC GIẢ PHÊ DUYỆT - BẮT BUỘC BÁM SÁT 100%]:\n"${directionSummary}"\nCHỈ DẪN NGHIÊM NGẶT: Bạn bắt buộc phải triển khai câu văn bám sát 100% dàn ý hướng đi này, tuyệt đối không được tự ý thay đổi mạch truyện hay bẻ lái ngoài ý đồ tác giả.\n`
        : '';

      constructedPrompt = `Nhiệm vụ: Viết tiếp diễn biến tiếp theo, giữ liên tục nguyên nhân - hệ quả, tính cách và quan hệ nhân vật của tác phẩm.\n${dbGenre ? `Thể loại tác phẩm: ${dbGenre}.\n` : ''}${genreDirective}\n${lengthInstruction}${directionDirective}\n\nĐOẠN TRƯỚC ĐÓ:\n${selectedText || prompt}\n\nYêu cầu bổ sung từ tác giả: ${instruction || 'Duy trì nhịp điệu và phong cách văn học.'}\nLưu ý: Bắt đầu viết tiếp nội dung ngay lập tức, tuyệt đối không viết lời dẫn hay câu chào.`;
    } else if (operation === 'REWRITE') {
      const sourceText = selectedText || prompt;
      const approxWords = sourceText ? sourceText.trim().split(/\s+/).length : 200;
      // Giữ trần token tương xứng với độ dài văn bản gốc (tránh bị sinh thừa sang ngàn từ)
      targetTokens = Math.min(4500, Math.max(600, Math.round(approxWords * 2.2)));

      constructedPrompt = `Bạn là Chuyên gia Biên tập Văn học Cấp cao (Master Literary Sub-Editor).
Nhiệm vụ: TRAU CHUỐT, GỌT DŨA CÂU TỪ CHO TỰ NHIÊN, MƯỢT MÀ, GIÀU CHẤT THƠ VÀ ĐIỆN ẢNH.
TUYỆT ĐỐI KHÔNG REMAKE, KHÔNG BỊA THÊM TÌNH TIẾT MỚI VÀ KHÔNG LÀM THAY ĐỔI CỐT TRUYỆN.
${dbGenre ? `\nThể loại tác phẩm: ${dbGenre}.\n` : ''}${genreDirective}

QUY TẮC BẮT BUỘC KHI TRAU CHUỐT:
1. GIỮ NGUYÊN 100% TÌNH TIẾT, HÀNH ĐỘNG VÀ Ý ĐỒ GỐC:
   - Toàn bộ diễn biến, hành động của nhân vật, lời thoại, bối cảnh thời gian - không gian phải được GIỮ NGUYÊN.
   - Không được tự ý sáng tác thêm nhân vật mới, tình huống mới hoặc thay đổi kết quả của sự việc.
2. TỐI ƯU CÂU TỪ TỰ NHIÊN & VĂN PHONG VĂN HỌC:
   - Sửa các câu văn bị lủng củng, lặp từ, sượng gạo, hoặc mang hơi hướng dịch máy.
   - Làm cho mạch văn trôi chảy, nhịp điệu uyển chuyển, diễn đạt tự nhiên như văn phong của một nhà văn bản xứ tài hoa.
   - Tăng cường tính gợi hình, gợi cảm nhưng giữ đúng giọng điệu nguyên tác.
3. BẢO TOÀN DUNG LƯỢNG TƯƠNG ĐƯƠNG VĂN BẢN GỐC:
   - Độ dài sau khi sửa phải TƯƠNG ĐƯƠNG với đoạn văn gốc (khoảng ${approxWords} từ). Tuyệt đối không kéo dài thành đại chương khác.
4. KHÔNG VIẾT LỜI DẪN HAY LỜI CHÀO:
   - Bắt đầu trực tiếp bằng đoạn văn đã được trau chuốt.

ĐOẠN VĂN GỐC CẦN TRAU CHUỐT:
"""
${sourceText}
"""
${instruction ? `Yêu cầu bổ sung của tác giả: ${instruction}` : ''}`;
    } else if (operation === 'SUMMARIZE') {
      constructedPrompt = `Hãy tóm tắt các ý chính, diễn biến và cao trào của chương truyện sau:\n${prompt}`;
      targetTokens = 1500;
    }

    const baseSystemPrompt = `Bạn là Đại Tác Giả Văn Học & Biên Kịch Trưởng Cấp Cao của ZORY Literary Engine.
Bạn sáng tác tiểu thuyết với trình độ bậc thầy: câu chữ giàu chất thơ và điện ảnh, tâm lý nhân vật sắc sảo, logic chặt chẽ, tình tiết lớp lang cuốn hút.${genreDirective}

BỘ NGUYÊN TẮC VĂN HỌC — ƯU TIÊN NHÂN VẬT VÀ TƯƠNG TÁC:
1. NHÂN VẬT DẪN DẮT CẢNH:
   - Mỗi cảnh cần có một nhân vật muốn đạt điều gì ngay lúc này và một trở lực cụ thể; khi có nhân vật khác trong cảnh, cho họ mục tiêu hoặc lập trường riêng.
   - Nhân vật chủ động lựa chọn, hành động và phản ứng với nhau. Lời nói hoặc hành động của người này phải làm người kia đổi cách đáp, thế chủ động, mức tin tưởng, thông tin được hé lộ hoặc quyết định tiếp theo.
   - Ưu tiên tương tác giữa các nhân vật khi cốt truyện và bối cảnh cho phép. Không ép thêm người vào cảnh độc thoại, cảnh hành động đơn độc hoặc khoảnh khắc nội tâm có chủ đích.
2. ĐỐI THOẠI CÓ TÁC ĐỘNG:
   - Giữ giọng nói, vốn hiểu biết và cách né tránh riêng của từng nhân vật; không để mọi người nói cùng một giọng.
   - Dùng đối thoại, im lặng, cử chỉ và lựa chọn để bộc lộ cảm xúc hoặc ý đồ. Mỗi lượt trao đổi nên làm quan hệ hay xung đột tiến triển; tránh đối thoại chỉ để giải thích điều người đọc đã biết.
3. GIỮ POV ỔN ĐỊNH:
   - Tiếp nối điểm nhìn đã có trong đoạn trước. Nếu chưa xác định, chọn một POV phù hợp và giữ xuyên suốt cảnh/chương.
   - Không chuyển vào suy nghĩ của nhân vật khác và không đổi POV giữa cảnh trừ khi tác giả yêu cầu rõ.
4. BỐI CẢNH PHỤC VỤ DIỄN BIẾN:
   - Chỉ chọn chi tiết không gian, giác quan và nội tâm giúp hiểu lựa chọn, cản trở hoặc trạng thái của nhân vật. Tránh lặp mô tả thời tiết, ánh sáng, nhịp thở hay cảm xúc.
   - Dùng nhịp kể linh hoạt. Không kéo chậm mọi chuyển động; tóm lược khoảng thời gian không có biến chuyển đáng kể.
5. CẤU TRÚC VÀ ĐỊNH DẠNG:
   - Để mâu thuẫn leo thang qua hành động và hệ quả, rồi kết cảnh bằng một thay đổi, lựa chọn khó hoặc câu hỏi mở có ý nghĩa.
   - BẮT ĐẦU TRỰC TIẾP bằng chính văn bản thảo, TUYỆT ĐỐI KHÔNG viết lời chào hay lời dẫn ("Dưới đây là...", "Đây là đoạn văn...").
   - KHÔNG dùng dấu ngăn cách (***, ---, ###) ở đầu văn bản.
   - KHÔNG viết lời chúc hay lời kết xã giao ở cuối.
${loreContext}`;

    const isRewrite = operation === 'REWRITE';
    const isSuggestDirections = operation === 'SUGGEST_DIRECTIONS';
    const aiRes = await aiAdapter.complete({
      prompt: constructedPrompt,
      systemPrompt: systemPrompt ? `${baseSystemPrompt}\n${systemPrompt}` : baseSystemPrompt,
      maxTokens: targetTokens,
      temperature: isRewrite ? 0.35 : isSuggestDirections ? 0.6 : 0.75,
    });

    // Tự động cắt gọt toàn bộ lời dẫn đầu, lời kết và ký hiệu thừa
    const finalContent = isSuggestDirections ? aiRes.content : cleanAiLiteratureOutput(aiRes.content);
    const directions = isSuggestDirections ? parseAiDirections(aiRes.content) : undefined;

    // 2. Khấu trừ token và cập nhật chu kỳ 5h
    const updatedQuota = await consumeUserAiTokens(user.id, aiRes.tokensUsed);

    // Lưu lịch sử dùng AI
    await prisma.aiUsage.create({
      data: {
        userId: user.id,
        projectId: projectId || null,
        operation: operation || 'GENERATE',
        model: aiRes.model,
        promptTokens: Math.round(aiRes.tokensUsed * 0.4),
        completionTokens: Math.round(aiRes.tokensUsed * 0.6),
        totalTokens: aiRes.tokensUsed,
      },
    });

    return NextResponse.json({
      success: true,
      content: finalContent,
      directions,
      model: aiRes.model,
      tokensUsed: aiRes.tokensUsed,
      remainingTokens: updatedQuota.remaining,
      quota: updatedQuota.quota,
      resetAt: updatedQuota.resetAt,
      resetCountdown: updatedQuota.countdown,
      isMock: aiRes.isMock,
    });
  } catch (error: any) {
    console.error('Lỗi sinh nội dung AI:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi xử lý yêu cầu sáng tác AI' },
      { status: 500 }
    );
  }
}
