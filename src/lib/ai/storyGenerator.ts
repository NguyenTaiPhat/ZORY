import { aiAdapter } from './adapter';
import { cleanAiLiteratureOutput } from './cleaner';

export interface InitialStoryData {
  chapter1Title: string;
  chapter1Content: string;
  plannedChapters: Array<{
    chapterNumber: number;
    title: string;
    summary: string;
    content: string;
  }>;
  protagonist: {
    name: string;
    role: string;
    appearance?: string;
    personality?: string;
    goals?: string;
    abilities?: string;
  };
  worldSetting: string;
  synopsis: string;
}

/**
 * Tự động kiến tạo cốt truyện ban đầu, mục lục các chương và chính văn Chương 1
 * để người dùng vào dự án là có sẵn truyện hay để đọc ngay lập tức.
 */
export async function generateInitialStory(
  title: string,
  premise: string,
  genre: string,
  writingStyle: string,
  estimatedLength: string
): Promise<InitialStoryData> {
  const isShortStory = estimatedLength.toLowerCase().includes('dưới 10') || estimatedLength.toLowerCase().includes('ngắn');
  const chapterCount = isShortStory ? 7 : 8;

  const prompt = `Bạn là tác giả văn học chuyên nghiệp hàng đầu. Hãy kiến tạo cốt truyện và mở đầu tác phẩm:
Tên tác phẩm: "${title}"
Thể loại: "${genre}"
Ý tưởng trọng tâm: "${premise}"
Phong cách hành văn: "${writingStyle}"
Quy mô: "${estimatedLength}" (Dự kiến tạo lộ trình ${chapterCount} chương)

YÊU CẦU ĐẦU RA (ĐỊNH DẠNG JSON DUY NHẤT, KHÔNG THÊM LỜI DẪN):
{
  "chapter1Title": "Tên Chương 1 thật hấp dẫn và gợi mở",
  "chapter1Content": "Viết chính văn Chương 1 ĐỒ SỘ, SỐNG ĐỘNG VÀ ĐẬM CHẤT ĐIỆN ẢNH (QUY MÔ ĐẠI CHƯƠNG 2500 ĐẾN 3500 TỪ). Áp dụng nguyên tắc 'Show, Don't Tell', miêu tả chi tiết ngũ giác, tâm lý đấu tranh, đối thoại đa tầng và xung đột leo thang gay gắt. CẤM TUYỆT ĐỐI VIẾT TÓM TẮT HAY NHẢY CÓC THỜI GIAN.",
  "chapters": [
    ${Array.from({ length: chapterCount }, (_, i) => `{"chapterNumber": ${i + 1}, "title": "Chương ${i + 1}: ...", "summary": "Tóm tắt cốt truyện và bước ngoặt chương ${i + 1}"}`).join(',\n    ')}
  ],
  "protagonist": {
    "name": "Tên nhân vật chính",
    "role": "Nhân vật chính",
    "appearance": "Ngoại hình nổi bật, y phục, thần thái",
    "personality": "Tính cách đặc trưng, thế giới quan",
    "goals": "Mục tiêu tối thượng và khát khao nội tâm",
    "abilities": "Kỹ năng, bí thuật hoặc sở trường"
  },
  "worldSetting": "Mô tả 3-4 câu về bối cảnh thế giới, không gian xã hội, quy tắc sức mạnh và mâu thuẫn lớn",
  "synopsis": "Đoạn tóm tắt cốt truyện tổng thể xuyên suốt các chương"
}`;

  try {
    const aiRes = await aiAdapter.complete({
      prompt,
      systemPrompt: 'Bạn là ZORY Master Literary Architect. Trả về duy nhất một đối tượng JSON hợp lệ, không có markdown text ngoài lề hay lời chào.',
      maxTokens: 8192,
      temperature: 0.78,
    });

    let jsonStr = aiRes.content.trim();
    if (jsonStr.includes('```')) {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) jsonStr = match[1];
    }

    const parsed = JSON.parse(jsonStr);

    if (parsed.chapter1Content && parsed.chapter1Content.length > 300) {
      const cleanedC1 = cleanAiLiteratureOutput(parsed.chapter1Content);
      const rawChapters = Array.isArray(parsed.chapters) && parsed.chapters.length > 0
        ? parsed.chapters
        : Array.from({ length: chapterCount }, (_, i) => ({
            chapterNumber: i + 1,
            title: `Chương ${i + 1}: Hướng đi mới`,
            summary: `Diễn biến chương ${i + 1}`,
          }));

      return {
        chapter1Title: parsed.chapter1Title || 'Chương 1: Khởi đầu mới',
        chapter1Content: cleanedC1,
        plannedChapters: rawChapters.map((ch: any, idx: number) => ({
          chapterNumber: ch.chapterNumber || idx + 1,
          title: ch.title || `Chương ${idx + 1}`,
          summary: ch.summary || '',
          content: idx === 0 ? cleanedC1 : '',
        })),
        protagonist: parsed.protagonist || {
          name: 'Nhân vật chính',
          role: 'Nhân vật chính',
          appearance: 'Ánh mắt kiên định, mang phong thái phong trần',
          personality: 'Quả cảm, trầm ổn, cơ trí',
          goals: 'Tìm kiếm chân tướng và tự do',
          abilities: 'Khả năng cảm thụ linh lực đặc dị',
        },
        worldSetting: parsed.worldSetting || `Thế giới ${genre} huyền bí nơi các bí thuật cổ đại dần thức tỉnh.`,
        synopsis: parsed.synopsis || `Hành trình khám phá chân tướng của tác phẩm "${title}".`,
      };
    }
  } catch (err) {
    console.warn('[StoryGenerator] AI generation fallback:', err);
  }

  // Fallback thông minh: Tạo văn bản khởi đầu chuẩn mực dựa vào premise nếu AI bận hoặc phản hồi chậm
  return generateRichFallbackStory(title, premise, genre, writingStyle, chapterCount);
}

/**
 * Fallback văn học phong phú, tự nhiên, bám sát ý tưởng của tác giả (~800 từ)
 */
function generateRichFallbackStory(
  title: string,
  premise: string,
  genre: string,
  writingStyle: string,
  chapterCount: number = 7
): InitialStoryData {
  const gLower = genre.toLowerCase();
  const isRomanceOrQueer =
    gLower.includes('nam') ||
    gLower.includes('nữ') ||
    gLower.includes('đam') ||
    gLower.includes('bách') ||
    gLower.includes('ngôn') ||
    gLower.includes('ràng buộc') ||
    gLower.includes('tình');

  let c1Text = '';
  let protagonist = {
    name: 'Lạc Vô Nhai',
    role: 'Nhân vật chính',
    appearance: 'Dáng người cao ráo, ánh mắt sắc lạnh kiên nghị, bên hông đeo thanh cổ kiếm sẫm màu.',
    personality: 'Cơ trí, quả đoán, trọng ân nghĩa nhưng không bao giờ nương tay trước kẻ thủ ác.',
    goals: 'Giải mã bí mật truyền thừa cổ xưa và giải thoát xiềng xích số phận.',
    abilities: 'Nhãn thuật viễn cổ, khả năng phân giải linh mạch bí thuật độc nhất vô nhị.',
  };
  let fallbackChapters = [];

  if (isRomanceOrQueer) {
    c1Text = `Ánh hoàng hôn ngả dài qua những vách kính cao tầng, nhuộm một sắc cam vàng ấm áp nhưng cũng đầy tịch mịch lên góc phố quen thuộc. Trong không gian tĩnh lặng chỉ còn nghe thấy tiếng gió thu khẽ lướt qua hàng cây và tiếng thở khẽ của hai con người đang đứng cách nhau chỉ chừng vài bước chân.

Khoảnh khắc ấy, dường như mọi ồn ã của thế giới ngoài kia đều lùi xa. Từng ánh mắt chạm nhau, chất chứa những điều chưa từng một lần dám thốt ra thành lời. Giữa xã hội với biết bao định kiến, ràng buộc và những chuẩn mực vô hình đè nặng, mối liên kết giữa họ như một dòng chảy ngầm mãnh liệt nhưng cũng mong manh tựa sương mai.

"Cậu có từng nghĩ rằng, nếu chúng ta cứ bước tiếp thế này, cái giá phải trả sẽ là gì không?"

Thanh âm trầm ấm vang lên, không hề có vẻ đe dọa, mà chỉ phảng phất một nỗi day dứt khôn nguôi. Người đối diện khẽ nhếch môi, ánh mắt kiên định ngước nhìn thẳng vào đáy mắt người kia. Không có sự lúng túng hay né tránh, chỉ có sự chân thành đến nghẹt thở:

"Ràng buộc duy nhất trên đời này là do chính chúng ta tự đặt ra. Nếu ngay cả cảm xúc chân thực của bản thân còn không dám đối diện, thì sống theo kỳ vọng của người khác có ý nghĩa gì?"

Một khoảng lặng kéo dài. Bàn tay khẽ chạm vào nhau trong bóng chiều nhập nhoạng, một hơi ấm lan tỏa qua từng đầu ngón tay như thầm khẳng định một giao ước không lời. Dù tương lai có sóng gió bão bùng hay chông gai chờ đợi, hành trình của "${title}" đã chính thức bắt đầu từ chính sự rung động chân thực này.`;

    protagonist = {
      name: 'Hạ Tri Dư',
      role: 'Nhân vật chính',
      appearance: 'Đôi mắt sáng trong trẻo, phong thái điềm tĩnh, nụ cười phảng phất nét tự do phóng khoáng.',
      personality: 'Độc lập, nhạy cảm, dũng cảm theo đuổi sự chân thành và không chịu khuất phục trước định kiến.',
      goals: 'Bảo vệ tình cảm chân thực và tìm kiếm sự tự do trọn vẹn trong tâm hồn.',
      abilities: 'Trực giác tinh tế, thấu hiểu lòng người và ý chí kiên định.',
    };

    fallbackChapters = [
      {
        chapterNumber: 1,
        title: 'Chương 1: Khoảnh khắc chạm mắt',
        summary: 'Gặp gỡ định mệnh trong một chiều thu tĩnh lặng, khơi dậy những rung động vượt qua mọi rào cản.',
        content: c1Text,
      },
      {
        chapterNumber: 2,
        title: 'Chương 2: Khoảng cách vô hình',
        summary: 'Những thử thách từ môi trường và sự dè chừng ban đầu dần bị phá vỡ qua những lần sẻ chia.',
        content: '',
      },
      {
        chapterNumber: 3,
        title: 'Chương 3: Khi bức tường sụp đổ',
        summary: 'Một biến cố bất ngờ xảy ra, buộc cả hai phải thẳng thắn bộc lộ tâm tư thật sự.',
        content: '',
      },
      {
        chapterNumber: 4,
        title: 'Chương 4: Đối diện định kiến',
        summary: 'Áp lực từ gia đình và xã hội bủa vây, kiểm nghiệm độ bền chặt của mối quan hệ.',
        content: '',
      },
      {
        chapterNumber: 5,
        title: 'Chương 5: Lời hứa dưới mưa',
        summary: 'Một cuộc trò chuyện thâu đêm giúp cả hai tìm thấy điểm tựa tinh thần vững chắc ở đối phương.',
        content: '',
      },
      {
        chapterNumber: 6,
        title: 'Chương 6: Tự do không ràng buộc',
        summary: 'Vượt qua những xiềng xích vô hình, dũng cảm sống thật với chính mình.',
        content: '',
      },
      {
        chapterNumber: 7,
        title: 'Chương 7: Trọn vẹn một phương trời',
        summary: 'Khép lại chặng đường trắc trở, mở ra tương lai rạng ngời và hạnh phúc đích thực.',
        content: '',
      },
    ];
  } else {
    c1Text = `Màn đêm buông xuống như tấm lụa đen huyền bí phủ trùm lên rặng sơn mạch xa xôi. Trong không gian tịch mịch đến rợn người, chỉ còn lại tiếng gió rít gào qua từng khe đá sắc nhọn và hơi thở dồn dập của kẻ vừa thoát khỏi vòng vây hiểm trở.

Nắm chặt tín vật cổ xưa trong lòng bàn tay lạnh ngắt, từng đợt sóng năng lượng vô hình khẽ lan tỏa, gặm nhấm kinh mạch với một cảm giác buốt giá tận tâm can. Người ta đồn rằng bí mật này một khi thức tỉnh sẽ làm chấn động cả giang hồ lẫn các đại thế lực, nhưng chưa từng ai biết được cái giá đắt đỏ mà kẻ nắm giữ nó phải gánh chịu giữa chốn hồng trần cuộn sóng.

"Rốt cuộc điều này ẩn chứa chân tướng gì mà khiến bọn chúng phải điên cuồng săn lùng đến cùng trời cuối đất như thế?"

Người thiếu niên khẽ đưa tay lau vệt máu khô bên khóe môi, ánh mắt ánh lên tia kiên định khác thường giữa bóng tối mịt mùng. Từng lời căn dặn trước lúc lâm chung của sư phụ bất giác vang vọng lại trong tâm trí: Đừng bao giờ để lòng tham dẫn lối; bí thuật không phải là chìa khóa mở ra quyền năng tuyệt đối, mà là bài kiểm tra nghiệt ngã nhất đối với bản tâm con người giữa vòng xoáy sinh tử.

Từ sâu trong màn sương mù u tối phía chân trời, một tràng tiếng xé gió bén nhọn đột ngột rít lên. Lũ bóng đen khoác áo choàng sẫm màu đã bắt đầu lần theo dấu vết linh lực, bước chân đạp trên cành khô tạo thành những thanh âm ghê rợn. Những đôi mắt đỏ rực ánh lên sát khí lạnh lùng khóa chặt vào vị trí vách đá nơi thiếu niên đang ẩn mình.

Không còn đường lui. Khẽ thở dài một tiếng, chàng siết chặt chuôi kiếm cổ, linh lực trong đan điền bắt đầu sôi trào, xua tan cái giá lạnh của đêm đen. Dù phía trước là vực thẳm vạn trượng hay cạm bẫy muôn trùng, con đường một khi đã chọn thì tuyệt đối không thể ngoảnh đầu. Bánh xe vận mệnh của "${title}" chính thức bắt đầu chuyển động.`;

    fallbackChapters = [
      {
        chapterNumber: 1,
        title: 'Chương 1: Màn đêm thức tỉnh',
        summary: 'Biến cố khởi đầu, nhân vật chính chạm trán đợt truy sát và phong ấn bí thuật thức tỉnh.',
        content: c1Text,
      },
      {
        chapterNumber: 2,
        title: 'Chương 2: Manh mối trong phế tích',
        summary: 'Dấn thân vào tàn tích cổ đại, tìm thấy tàn quyển ghi chép nguồn gốc bí ẩn.',
        content: '',
      },
      {
        chapterNumber: 3,
        title: 'Chương 3: Cạm bẫy trùng phùng',
        summary: 'Gặp gỡ nhân vật đồng hành bí ẩn và cùng nhau phá giải thế trận mai phục của đối thủ.',
        content: '',
      },
      {
        chapterNumber: 4,
        title: 'Chương 4: Dưới bóng tối thế lực ngầm',
        summary: 'Thân phận của kẻ đứng sau âm mưu dần hé lộ, mâu thuẫn đẩy lên cao trào.',
        content: '',
      },
      {
        chapterNumber: 5,
        title: 'Chương 5: Bước ngoặt sinh tử',
        summary: 'Một thành viên rơi vào nguy hiểm hiểm nghèo, bí thuật bùng nổ vượt ngoài tầm kiểm soát.',
        content: '',
      },
      {
        chapterNumber: 6,
        title: 'Chương 6: Quyết chiến đỉnh Thâm Uyên',
        summary: 'Trận đại chiến quyết định số phận, đối mặt trực diện với đầu sỏ âm mưu.',
        content: '',
      },
      {
        chapterNumber: 7,
        title: 'Chương 7: Ánh bình minh tái sinh',
        summary: 'Chân tướng trọn vẹn được làm sáng tỏ, đặt nền móng cho kỷ nguyên mới của nhân vật chính.',
        content: '',
      },
    ];
  }

  return {
    chapter1Title: fallbackChapters[0]?.title || 'Chương 1: Mở đầu',
    chapter1Content: c1Text,
    plannedChapters: fallbackChapters.slice(0, chapterCount),
    protagonist,
    worldSetting: `Bối cảnh ${genre}: Không gian xã hội nơi các nhân vật đối mặt với thử thách, định kiến và hành trình theo đuổi lý tưởng tự do, khám phá bản ngã.`,
    synopsis: `Tác phẩm "${title}" xoay quanh ý tưởng: ${premise}. Hành trình vượt qua nghịch cảnh, định kiến và khẳng định cảm xúc chân thực của các nhân vật.`,
  };
}
