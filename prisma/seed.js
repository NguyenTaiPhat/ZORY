const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- KHỞI TẠO DỮ LIỆU SEED CHO ZORY ---');

  // 1. Thể loại
  const genresData = [
    { name: 'Tiên hiệp', slug: 'tien-hiep', description: 'Tu chân luyện đạo, phi thăng vạn giới, trường sinh bất lão.' },
    { name: 'Kiếm hiệp', slug: 'kiem-hiep', description: 'Ân oán giang hồ, kiếm khí dọc ngang, nghĩa hiệp nhân gian.' },
    { name: 'Huyền huyễn', slug: 'huyen-huyen', description: 'Thế giới huyền ảo, ma pháp vô biên, dị giới tranh phong.' },
    { name: 'Khoa huyễn', slug: 'khoa-huyen', description: 'Công nghệ tương lai, du hành vũ trụ, trí tuệ nhân tạo.' },
    { name: 'Ngôn tình', slug: 'ngon-tinh', description: 'Tình cảm sâu lắng, duyên phận thăng trầm, lãng mạn ngọt ngào.' },
    { name: 'Đô thị', slug: 'do-thi', description: 'Thương trường hào môn, cuộc sống hiện đại, dị năng thành thị.' },
    { name: 'Trọng sinh', slug: 'trong-sinh', description: 'Tái sinh kiếp khác, xoay chuyển vận mệnh, nghịch thiên cải mệnh.' },
    { name: 'Xuyên không', slug: 'xuyen-khong', description: 'Vượt qua không thời gian, bước vào thời đại mới hoặc thế giới khác.' },
    { name: 'Trinh thám', slug: 'trinh-tham', description: 'Phá án ly kỳ, lần theo dấu vết tội phạm, giải mã bí ẩn.' },
    { name: 'Kinh dị', slug: 'kinh-di', description: 'Bí ẩn rùng rợn, hiện tượng siêu nhiên, cảm giác hồi hộp đến nghẹt thở.' },
    { name: 'Tâm lý', slug: 'tam-ly', description: 'Khám phá chiều sâu nội tâm, cảm xúc phức tạp, đấu tranh nhân bản.' },
    { name: 'Phiêu lưu', slug: 'phieu-luu', description: 'Hành trình mạo hiểm, khám phá vùng đất lạ, vượt qua nghịch cảnh.' },
    { name: 'Hài hước', slug: 'hai-huoc', description: 'Tiếng cười nhẹ nhàng, tình huống dí dỏm, giải tỏa căng thẳng.' },
    { name: 'Học đường', slug: 'hoc-duong', description: 'Thanh xuân vườn trường, bạn bè tri kỷ, ước mơ tuổi trẻ.' },
    { name: 'Light Novel', slug: 'light-novel', description: 'Phong cách phóng khoáng, minh họa sống động, nhịp kể lôi cuốn.' },
    { name: 'Đam mỹ (Nam Nam)', slug: 'dam-my', description: 'Tình cảm nam x nam sâu sắc, đồng hành cùng sinh cùng tử, rung động chân thành.' },
    { name: 'Bách hợp (Nữ Nữ)', slug: 'bach-hop', description: 'Mối tình nữ x nữ dịu dàng sâu lắng, gắn kết tri âm tri kỷ.' },
    { name: 'Nam Nam', slug: 'nam-nam', description: 'Tác phẩm tình cảm nam x nam phóng khoáng, hiện đại và sâu sắc.' },
    { name: 'Nữ Nữ', slug: 'nu-nu', description: 'Tác phẩm tình cảm nữ x nữ lãng mạn, tinh tế và ngập tràn cảm xúc.' },
    { name: 'Không ràng buộc', slug: 'khong-rang-buoc', description: 'Thể loại tình cảm tự do, phóng khoáng, không giới hạn bởi khuôn mẫu hay định kiến.' }
  ];

  for (const g of genresData) {
    await prisma.genre.upsert({
      where: { slug: g.slug },
      update: { name: g.name, description: g.description },
      create: g,
    });
  }
  console.log(`✓ Đã tạo ${genresData.length} thể loại.`);

  // 2. Tài khoản Quản trị viên chính thức
  const adminPassword = await bcrypt.hash('zoryadmin123!@#', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'zoryadmin@gmail.com' },
    update: {
      passwordHash: adminPassword,
      role: 'ADMIN',
      name: 'ZORY Admin',
      username: 'zoryadmin',
      aiTokensQuota: 999999999,
      ttsCharsQuota: 999999999,
    },
    create: {
      email: 'zoryadmin@gmail.com',
      username: 'zoryadmin',
      name: 'ZORY Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      aiTokensQuota: 999999999,
      ttsCharsQuota: 999999999,
      preferences: {
        create: {
          theme: 'dark',
          readerTheme: 'dark',
          readerFontSize: 19,
        },
      },
    },
  });
  console.log('✓ Đã khởi tạo tài khoản Admin: zoryadmin@gmail.com');

  // 3. Tạo các tác phẩm mẫu chất lượng cao
  const booksData = [
    {
      title: 'Vạn Giới Tinh Đồ',
      slug: 'van-gioi-tinh-do',
      summary: 'Giữa bầu trời đêm nghìn năm không trăng, thiếu niên Diệp Phong phát hiện một tấm tinh đồ cổ xưa chôn sâu dưới tàn tích Thiên Thần Điện. Từ đây, con đường tu đạo phá vỡ cửu trùng thiên môn, khám phá nguồn gốc của vạn giới mở ra trước mắt. Mỗi vì sao là một linh hồn, mỗi vòm trời là một chiến trường.',
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
      status: 'ONGOING',
      publishStatus: 'PUBLISHED',
      authorId: admin.id,
      authorName: admin.name,
      viewCount: 0,
      readCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      isFeatured: true,
      genres: ['tien-hiep', 'huyen-huyen', 'phieu-luu'],
      chapters: [
        {
          chapterNumber: 1,
          title: 'Chương 1: Mảnh Tinh Đồ Dưới Tàn Tích Hoang Phế',
          content: `Gió đêm thổi qua dãy núi Thương Vân mang theo cái lạnh cắt da của mùa đông tuyết phủ.

Dưới đáy khe vực Vạn Nhược, ánh trăng mờ nhạt rọi qua những tán cây cổ thụ trăm năm, để lộ một tảng cự thạch phủ đầy rêu phong. Diệp Phong chống thanh trường kiếm đã sứt mẻ gỉ sét, quỳ một gối xuống lớp lá khô ẩm ướt, hơi thở gấp gáp tạo thành những làn khói trắng tan nhanh trong không khí giá buốt.

"Ba ngày ba đêm truy sát... lũ người phủ Liệt Dương thực sự muốn đuổi tận giết tuyệt sao?"

Diệp Phong khẽ lau vệt máu khô nơi khóe môi. Hắn là đệ tử ngoại môn của Huyền Thiên Kiếm Tông, vốn dĩ chỉ vì bảo vệ di vật của người cha quá cố mà bị đại công tử nhà họ Lâm chụp mũ tội danh phản bội tông môn.

Bàn tay phải của hắn bỗng nhiên chạm phải một vết nứt sâu trên vách đá. Một cảm giác nóng rực kỳ lạ truyền thẳng vào kinh mạch, tựa như có ngọn lửa vô hình đang thiêu đốt từng giọt máu trong huyết quản.

"Đây là..."

Ánh sáng màu chàm bùng phát từ khe nứt. Một phiến đá đen bóng, vuông vức cỡ bàn tay từ từ nổi lên giữa luồng hào quang huyền ảo. Trên bề mặt phiến đá, hàng vạn điểm sáng li ti lấp lánh như bầu trời đêm thu nhỏ, chuyển động theo những quỹ đạo cổ xưa không tài nào giải thích nổi.

Vạn Giới Tinh Đồ.

Bốn chữ cổ phong mang thần vận thâm sâu bất giác hiện rõ trong tâm trí Diệp Phong. Chưa kịp định thần, phiến đá đã biến thành một đạo bạch quang lao thẳng vào ấn đường của hắn.

Thế giới trước mắt hắn lập tức chao đảo. Vô số ký ức, tinh tú và quy luật luân hồi như thác lũ tràn vào linh hồn thiếu niên.`,
          wordCount: 320,
        },
        {
          chapterNumber: 2,
          title: 'Chương 2: Ngộ Đạo Cửu Biến',
          content: `Bên trong thức hải của Diệp Phong, không gian bao la vô tận như một vũ trụ sơ khai.

Hàng triệu vì sao lơ lửng, mỗi tinh tú tỏa ra một luồng kiếm khí thuần khiết đến tột độ. Một bóng người khổng lồ ngưng tụ từ ánh sao uy nghiêm nhìn xuống:

"Kẻ kế thừa Vạn Giới Tinh Đồ, ngươi có dám lấy phàm thân chống lại thiên đạo, lấy kiếm ý nghịch chuyển luân hồi?"

Giọng nói vang vọng như sấm sét xé toang tâm trí Diệp Phong. Hắn ngẩng đầu, ánh mắt không hề có lấy nửa phần sợ hãi. Gia tộc bị diệt, tông môn ruồng bỏ, cái chết đã cận kề trước mắt, hắn còn gì để do dự?

"Nếu thiên đạo bất công, ta tự mình lập ra tân đạo!"

"Tốt! Rất có khí phách!"

Bóng hình tinh tú khẽ vung tay. Một cuốn kim thư cổ đại mở ra giữa hư không, trên đó khắc sâu năm chữ: Cửu Biến Tinh Thần Quyết.

Dòng năng lượng tinh tú thuần khiết bắt đầu tẩy rửa toàn bộ gân cốt, kinh mạch của Diệp Phong. Những vết thương chí mạng do lũ truy binh Liệt Dương gây ra đang lấy tốc độ kinh người khép miệng. Đan điền từng bị phế bỏ nay được ánh sao bao bọc, bùng phát sinh cơ mãnh liệt hơn gấp mười lần trước kia.

Bên ngoài khe vực, tiếng bước chân vội vã cùng tiếng chó săn gầm rú đang ngày một áp sát.

"Tìm thấy rồi! Hắn ở dưới đáy hẻm núi Thương Vân!" Tiếng thét the thé của Lâm Hoằng, chấp sự Liệt Dương phủ vang lên.

Diệp Phong mở bừng mắt. Trong đồng tử đen lánh của thiếu niên lúc này phản chiếu hai đốm lửa tinh tú rực sáng.`,
          wordCount: 310,
        },
        {
          chapterNumber: 3,
          title: 'Chương 3: Nhát Kiếm Nghịch Thiên Mệnh',
          content: `Lâm Hoằng dẫn theo sáu tên hộ vệ áo đen nhảy xuống đáy vực, trên tay lăm lăm bảo đao rực lửa.

"Tiểu tử họ Diệp, ngoan ngoãn giao nộp ngọc bội của cha ngươi ra, ta có thể cho ngươi một cái chết toàn thây." Lâm Hoằng cười khẩy, ánh mắt lộ rõ vẻ tham lam tàn độc.

Diệp Phong chậm rãi đứng dậy. Hắn không nói một lời, chỉ rút thanh kiếm gỉ bên hông ra.

"Ha ha ha! Một tên phế nhân đan điền đã vỡ mà cũng đòi múa kiếm trước mặt bổn chấp sự?" Lâm Hoằng bật cười lớn, phất tay ra hiệu: "Chặt đứt tứ chi nó cho ta!"

Hai tên hộ vệ cấp ba Tụ Khí cảnh lập tức lao tới, lưỡi đao sắc bén chém ngang cổ Diệp Phong mang theo tiếng xé gió rợn người.

Nhưng ngay trong khoảnh khắc đó, thân ảnh Diệp Phong bỗng mờ đi như làn khói.

"Vụt!"

Một tia kiếm quang màu lam lạnh toát lướt qua màn đêm tĩnh mịch. Nhanh đến mức mắt thường không thể bắt kịp.

Hai tên hộ vệ sững người giữa không trung, sau đó ngã gục xuống nền đất ẩm ướt, đao trong tay gãy đôi thành từng mảnh vụn.

Nụ cười trên gương mặt Lâm Hoằng lập tức đông cứng lại. Hắn lùi lại nửa bước, mồ hôi lạnh toát ra như tắm: "Ngươi... ngươi căn bản không phải phế nhân! Ngươi đã đạt tới cảnh giới gì?!"

Diệp Phong tra kiếm vào vỏ, ánh mắt bình thản như nước hồ mùa thu: "Đây chỉ mới là điểm khởi đầu mà thôi."`,
          wordCount: 285,
        }
      ]
    },
    {
      title: 'Bóng Đêm Thầm Lặng',
      slug: 'bong-dem-tham-lang',
      summary: 'Một chuỗi án mạng kỳ bí tại thành phố cổ Hội An khiến thanh tra Minh Vũ rơi vào vòng xoáy của những âm mưu gia tộc nghìn năm. Kẻ thủ ác luôn để lại một bông hoa sen giấy đẫm máu cùng thông điệp cổ bằng chữ Nôm. Khi sự thật dần lộ diện, Vũ nhận ra kẻ giật dây lại là người gần gũi nhất với mình.',
      coverUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600',
      status: 'COMPLETED',
      publishStatus: 'PUBLISHED',
      authorId: admin.id,
      authorName: admin.name,
      viewCount: 0,
      readCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      isFeatured: true,
      genres: ['trinh-tham', 'kinh-di', 'tam-ly'],
      chapters: [
        {
          chapterNumber: 1,
          title: 'Chương 1: Bông Sen Giấy Trên Phố Cũ',
          content: `Cơn mưa rào đầu mùa hạ trút xuống những mái ngói rêu phong của phố cổ Hội An. Mùi ngói ẩm hòa lẫn với khói trầm hương bảng lảng trong màn đêm tịch mịch.

Minh Vũ kéo cao cổ áo măng-tô, bước qua con hẻm nhỏ dẫn vào ngôi nhà cổ ba gian của dòng họ Nguyễn Bá. Dây băng phong tỏa màu vàng của hiện trường cảnh sát rung lên bần bật trong gió lạnh.

"Đội trưởng Vũ, anh đến rồi." Thám tử trẻ Tuấn Anh vội chạy ra che ô cho anh, nét mặt tái nhợt. "Nạn nhân là ông Nguyễn Bá Cẩn, trưởng tộc. Chết lúc chín giờ tối, trên ghế trường kỷ phòng thờ."

Vũ bước vào trong. Gian phòng khách rộng lớn thoang thoảng mùi đàn hương kỳ dị. Trên chiếc sập gỗ lim đen bóng, thi thể người đàn ông lớn tuổi ngồi ngay ngắn, hai tay đặt trên đầu gối, ánh mắt mở trừng trừng nhìn lên bức hoành phi cổ.

Trên ngực áo lụa của nạn nhân, một bông sen giấy gấp thủ công bằng giấy dó cổ, cánh hoa đẫm sắc đỏ tươi của máu.

"Không có dấu hiệu vật lộn. Không có dấu vết đột nhập." Vũ ngồi thụp xuống quan sát tỉ mỉ, đeo găng tay cao su cẩn thận nhấc bông sen lên.

Bên trong nhụy hoa sen, một mảnh giấy nhỏ ghi dòng chữ Nôm sắc sảo bằng mực tàu: 'Nghiệp xưa chưa dứt, máu trả nghìn thu'.`,
          wordCount: 260,
        },
        {
          chapterNumber: 2,
          title: 'Chương 2: Lời Khai Trong Mưa',
          content: `Phòng thẩm vấn dã chiến tại đồn cảnh sát khu vực sáng rực ánh đèn huỳnh quang.

Người ngồi đối diện Minh Vũ là bà Loan, người làm công đã gắn bó với gia đình Nguyễn Bá hơn ba mươi năm. Đôi bàn tay gầy guộc của bà run rẩy bưng tách trà nóng.

"Tối nay, trước khi ông Cẩn mất, có ai ghé thăm ngôi nhà không?" Vũ nhẹ giọng hỏi, ánh mắt quan sát từng nhịp co giật nơi đuôi mắt người phụ nữ.

"Dạ... khoảng tám rưỡi, có một người đàn ông mặc áo mưa dài đi vào. Ông chủ dặn tôi ra ngoài mua thuốc lá, dặn rõ ràng không được quay lại trước chín giờ rưỡi."

"Bà có nhìn thấy mặt người đó không?"

Bà Loan lắc đầu quầy quậy, vẻ mặt lộ rõ sự kinh hãi: "Không... chiếc nón lá che khuất mặt. Nhưng tôi nghe thấy tiếng bước chân... rất kỳ lạ. Tiếng bước chân nhẹ như không chạm đất, và thoang thoảng mùi hoa lài đêm."

Mùi hoa lài. Vũ khẽ ghi chú vào cuốn sổ tay da đen. Chi tiết này trùng khớp với vụ án kỳ bí xảy ra ở ngoại thành Huế cách đây đúng ba năm. Một vụ án mà hồ sơ vẫn bị niêm phong tuyệt mật.`,
          wordCount: 230,
        }
      ]
    },
    {
      title: 'Thời Không Tái Thiết',
      slug: 'thoi-khong-tai-thiet',
      summary: 'Năm 2180, Trái Đất bước vào kỷ nguyên suy thoái tài nguyên. Nhóm kỹ sư lượng tử dự án ZORY khám phá ra chiều không gian thứ bảy, nơi quá khứ và tương lai giao thoa. Khi cố gắng quay về ngăn chặn đại thảm họa, họ nhận ra chính hành động của mình lại là nguyên nhân kích hoạt vòng lặp vô tận.',
      coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
      status: 'ONGOING',
      publishStatus: 'PUBLISHED',
      authorId: admin.id,
      authorName: admin.name,
      viewCount: 0,
      readCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      isFeatured: true,
      genres: ['khoa-huyen', 'xuyen-khong', 'phieu-luu'],
      chapters: [
        {
          chapterNumber: 1,
          title: 'Chương 1: Trạm Lượng Tử ZORY-09',
          content: `Khoang điều khiển của trạm quỹ đạo ZORY-09 chìm trong ánh sáng xanh dương dịu mắt của các màn hình holographic.

Tiến sĩ Trần Phong chạm ngón tay vào bảng điều khiển cảm ứng. Dữ liệu từ máy gia tốc hạt tachyon liên tục hiển thị các chỉ số biến dạng không-thời gian vượt ngưỡng 99.8%.

"Cảnh báo: Hạt nghịch đảo đã đạt điểm kỳ dị. Tọa độ thời gian đang dao động quanh năm 2026."

Giọng nói trí tuệ nhân tạo của trạm vang lên đều đều, lạnh lùng nhưng chính xác tuyệt đối.

Phong hít một hơi thật sâu. Dự án này là niềm hy vọng duy nhất của nhân loại trước khi tầng sinh quyển hoàn toàn sụp đổ. Nếu thành công, họ có thể gửi tín hiệu cảnh báo về cho thế hệ tiền nhân cách đây hơn một thế kỷ.

"Khởi động chu trình lượng tử. Mục tiêu: Trái Đất, thế kỷ 21."`,
          wordCount: 180,
        }
      ]
    },
    {
      title: 'Thành Phố Hoàng Hôn',
      slug: 'thanh-pho-hoang-hon',
      summary: 'Câu chuyện tình cảm nhẹ nhàng nhưng sâu lắng giữa một kiến trúc sư phục dựng di sản và một nữ dịch giả sách cổ giữa lòng Đà Lạt sương mù. Những lá thư tay thất lạc từ nửa thế kỷ trước gắn kết hai tâm hồn cô đơn tìm lại hy vọng sống.',
      coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600',
      status: 'ONGOING',
      publishStatus: 'PUBLISHED',
      authorId: admin.id,
      authorName: admin.name,
      viewCount: 0,
      readCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      isFeatured: false,
      genres: ['do-thi', 'ngon-tinh', 'tam-ly'],
      chapters: [
        {
          chapterNumber: 1,
          title: 'Chương 1: Căn Biệt Thự Gỗ Trên Đồi Thông',
          content: `Đà Lạt những ngày cuối thu luôn chìm trong làn sương mù mờ ảo như một bức tranh thủy mặc.

An Nhiên đẩy nhẹ cánh cổng sắt gỉ sét của căn biệt thự cổ số 17 đường Hoàng Hoa Thám. Tiếng lá thông khô vỡ vụn dưới đế giày bốt da phát ra âm thanh giòn giã.

Nơi đây từng là thư viện tư nhân của một học giả người Pháp đầu thế kỷ trước. Nhiên nhận hợp đồng phân loại và phục dựng lại hơn hai nghìn cuốn sách cổ còn sót lại trước khi căn biệt thự được bàn giao cho ban quản lý du lịch.

Bên trong hiên nhà, một người đàn ông trẻ tuổi mặc áo len xám đang chăm chú phác thảo kiến trúc mái vòm. Khi nghe tiếng bước chân, anh ngẩng đầu lên, ánh mắt trầm tĩnh sau gọng kính mảnh.

"Chào cô. Tôi là Lâm Quân, kiến trúc sư phụ trách khảo sát kết cấu."`,
          wordCount: 180,
        }
      ]
    }
  ];

  for (const b of booksData) {
    const { genres, chapters, ...bookData } = b;
    const createdBook = await prisma.book.upsert({
      where: { slug: bookData.slug },
      update: bookData,
      create: bookData,
    });

    // Gắn thể loại
    for (const gSlug of genres) {
      const g = await prisma.genre.findUnique({ where: { slug: gSlug } });
      if (g) {
        await prisma.bookGenre.upsert({
          where: {
            bookId_genreId: {
              bookId: createdBook.id,
              genreId: g.id,
            }
          },
          update: {},
          create: {
            bookId: createdBook.id,
            genreId: g.id,
          }
        });
      }
    }

    // Tạo các chương
    for (const ch of chapters) {
      await prisma.chapter.upsert({
        where: {
          bookId_chapterNumber: {
            bookId: createdBook.id,
            chapterNumber: ch.chapterNumber,
          }
        },
        update: {
          title: ch.title,
          content: ch.content,
          wordCount: ch.wordCount,
        },
        create: {
          bookId: createdBook.id,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          content: ch.content,
          wordCount: ch.wordCount,
        }
      });
    }

  }
  console.log(`✓ Đã tạo ${booksData.length} truyện mẫu và các chương.`);

  // 4. Dự án mẫu trong AI Studio cho Admin
  await prisma.aiProject.deleteMany({
    where: { userId: admin.id, title: 'Huyền Thiên Giới Bí Sử' }
  });

  const aiProject = await prisma.aiProject.create({
    data: {
      userId: admin.id,
      title: 'Huyền Thiên Giới Bí Sử',
      premise: 'Một thợ rèn bình thường tình cờ rèn ra thanh kiếm có linh hồn của Thần Thú cổ đại, bắt đầu hành trình tìm kiếm chín mảnh vỡ nguyên sơ để cứu lấy đại lục khỏi sự thôn tính của Ma Vực.',
      genre: 'Huyền huyễn',
      writingStyle: 'Văn phong cổ kính, hùng tráng, nhịp điệu nhanh, miêu tả cận chiến sống động',
      targetAudience: 'Độc giả yêu thích võ hiệp huyền huyễn cổ điển',
      estimatedLength: '50 chương',
      worldBible: JSON.stringify({
        settings: 'Đại lục Cửu Châu gồm 9 vùng đất linh khí phân tầng: Thượng Tam Giới, Trung Tam Giới và Hạ Tam Giới.',
        powerSystem: 'Luyện Khí -> Trúc Cơ -> Kim Đan -> Nguyên Anh -> Hóa Thần -> Độ Kiếp.',
        factions: 'Chính đạo gồm Tam Đại Tông Phái: Kiếm Tông, Thần Nông Cốc, Thiên Tinh Lâu. Ma Đạo có Cửu U Ma Môn.'
      }, null, 2),
      characters: {
        create: [
          {
            name: 'Hàn Lập Phong',
            role: 'Nhân vật chính',
            appearance: 'Dáng người rắn rỏi, ánh mắt kiên định, cánh tay sạm màu do rèn sắt lâu năm.',
            personality: 'Cẩn trọng, ít nói, trọng tình nghĩa, ghét sự giả tạo.',
            goals: 'Giải cứu muội muội và vén màn bí mật về sự biến mất của bộ tộc Thần Rèn.',
            abilities: 'Hỏa linh căn thuần khiết, năng lực thấu thị linh văn trong vũ khí.'
          },
          {
            name: 'Thanh Loan',
            role: 'Kiếm linh đồng hành',
            appearance: 'Thiếu nữ áo xanh phiêu dật, mái tóc ánh lam, cơ thể phát ra ánh sáng ngọc bích mờ ảo.',
            personality: 'Kiêu ngạo nhưng tốt bụng, am hiểu vạn vật thời thượng cổ.',
            goals: 'Khôi phục lại toàn bộ ký ức thời hồng hoang.'
          }
        ]
      },
      outlines: {
        create: {
          logline: 'Hành trình từ thợ rèn vô danh đến Thần Khí Sư cứu rỗi cửu châu thiên địa.',
          synopsis: 'Chàng thợ rèn Hàn Lập Phong vô tình dung hợp tinh hồn Thanh Loan vào thanh kiếm vỡ. Cuộc sống bình yên bị phá hủy khi Cửu U Ma Môn đồ sát làng quê.',
        }
      },
      studioChapters: {
        create: [
          {
            chapterNumber: 1,
            title: 'Lò Than Đỏ Rực Dưới Chân Đồi',
            content: 'Tiếng búa gõ đe vang lên nhịp nhàng giữa đêm khuya thanh vắng. Hàn Lập Phong gạt giọt mồ hôi trên trán, nhìn khối kim loại đỏ rực đang dần định hình trong lò luyện...',
            summary: 'Giới thiệu thân thế Hàn Lập Phong và lò rèn cổ truyền.',
            status: 'DRAFT',
            wordCount: 35
          }
        ]
      }
    }
  });
  console.log(`✓ Đã tạo dự án AI Studio mẫu: "${aiProject.title}".`);

  // 5. Cài đặt hệ thống mẫu
  const siteSettings = [
    { key: 'site_name', value: 'ZORY', description: 'Tên thương hiệu website' },
    { key: 'site_tagline', value: 'Stories Beyond Imagination', description: 'Khẩu hiệu nền tảng' },
    { key: 'ai_daily_limit', value: '20', description: 'Số lượt gọi AI tối đa mỗi ngày cho tài khoản thông thường' },
    { key: 'tts_default_speed', value: '1.0', description: 'Tốc độ đọc giọng nói mặc định' },
  ];

  for (const s of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }
  console.log('✓ Đã cập nhật cài đặt hệ thống.');

  console.log('--- KHỞI TẠO HOÀN TẤT THÀNH CÔNG! ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
