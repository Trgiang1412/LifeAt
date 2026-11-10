import {
  MULTI_SOURCE_ENGLISH_BANK,
  ENGLISH_DATABASE_SOURCES,
  pickNonRepeatingMultiSourceQuestion,
  markQuestionAsAsked,
  shuffleArray,
  type EnglishDatabaseSourceId,
  type MultiSourceEnglishItem,
} from './englishQuestionDatabase';

export {
  MULTI_SOURCE_ENGLISH_BANK,
  ENGLISH_DATABASE_SOURCES,
  pickNonRepeatingMultiSourceQuestion,
  markQuestionAsAsked,
  type EnglishDatabaseSourceId,
  type MultiSourceEnglishItem,
};

export interface FurnitureCatalogItem {
  maVatPham: string;
  tenVatPham: string;
  danhMuc: 'phong_khach' | 'phong_ngu' | 'goc_hoc_tap' | 'trang_tri';
  giaXu: number;
  icon: string;
  moTa: string;
  defaultX: number;
  defaultZ: number;
  isStarter?: boolean;
}

export type ModernHouseStyleId =
  | 'traditional'
  | 'minimalist'
  | 'eco_garden'
  | 'cyber_loft'
  | 'luxury_mansion';

export interface ModernHouseModelItem {
  id: string;
  styleId: ModernHouseStyleId;
  name: string;
  englishName: string;
  priceCoins: number;
  icon: string;
  description: string;
  tier: number;
  defaultWallColor: string;
  defaultRoofColor: string;
  highlights: string[];
}

export const MODERN_HOUSE_MODELS: ModernHouseModelItem[] = [
  {
    id: 'HOUSE_CAP4_STARTER',
    styleId: 'traditional',
    name: 'Nhà Cấp 4 Mái Ngói Đỏ (Mặc định)',
    englishName: 'Traditional Heritage Red-Tile House',
    priceCoins: 0,
    icon: '🏡',
    description: 'Kiến trúc nhà cấp 4 ấm cúng với sân gạch đỏ Hạ Long, hiên gỗ mộc mạc và mái ngói truyền thống',
    tier: 1,
    defaultWallColor: '#f5ebd6',
    defaultRoofColor: '#b93829',
    highlights: ['Sân gạch đỏ 11m × 11m', 'Mái ngói nung cổ điển', 'Cửa gỗ mộc mạc', 'Miễn phí tân thủ'],
  },
  {
    id: 'HOUSE_MODERN_MINIMALIST',
    styleId: 'minimalist',
    name: 'Biệt Thự Phố Tối Giản Scandinavian',
    englishName: 'Scandinavian Minimalist Townhouse',
    priceCoins: 450,
    icon: '🏘️',
    description: 'Thiết kế hình khối vuông vức Bắc Âu 2 tầng, vách kính Low-E tràn viền, ban công đón gió và đèn hắt LED',
    tier: 2,
    defaultWallColor: '#ffffff',
    defaultRoofColor: '#334155',
    highlights: ['Khối hộp 2 tầng hiện đại', 'Cửa kính Low-E tràn viền', 'Ban công kính chịu lực', 'Đèn LED hắt tường'],
  },
  {
    id: 'HOUSE_ECO_GARDEN',
    styleId: 'eco_garden',
    name: 'Biệt Thự Vườn Sinh Thái Eco Modernist',
    englishName: 'Eco Modernist Botanical Villa',
    priceCoins: 850,
    icon: '🌿',
    description: 'Biệt thự xanh hòa mình với thiên nhiên, ốp gỗ Conwood nhiệt đới, hồ cá Koi trước sân và giàn hoa Pergola',
    tier: 3,
    defaultWallColor: '#f1f5f9',
    defaultRoofColor: '#0f766e',
    highlights: ['Ốp gỗ Conwood sang trọng', 'Hồ cá Koi thư giãn trước sân', 'Giàn hoa Pergola râm mát', 'Mái vát phong cách Nhật'],
  },
  {
    id: 'HOUSE_CYBER_LOFT',
    styleId: 'cyber_loft',
    name: 'Penthouse Kính Tương Lai Cyber Loft 2077',
    englishName: 'Cyberpunk Neon Glass Loft 2077',
    priceCoins: 1600,
    icon: '🏢',
    description: 'Căn hộ thông minh vách kính phản quang Titan, dải đèn LED Neon phát sáng rực rỡ và sân thượng ngắm toàn cảnh thành phố',
    tier: 4,
    defaultWallColor: '#0f172a',
    defaultRoofColor: '#6366f1',
    highlights: ['Vách kính phản quang Titan', 'Dải LED Neon phát sáng ban đêm', 'Sân thượng Panorama City View', 'Kiến trúc viễn tưởng High-Tech'],
  },
  {
    id: 'HOUSE_LUXURY_MANSION',
    styleId: 'luxury_mansion',
    name: 'Dinh Thự Triệu Đô Luxury Beverly Hills',
    englishName: 'Beverly Hills Ultra-Luxury Mansion',
    priceCoins: 3200,
    icon: '🏰',
    description: 'Siêu dinh thự đồi Beverly Hills đẳng cấp giới thượng lưu: Tường ốp đá Marble trắng Carrera, bể bơi vô cực ngập tràn làn nước xanh và gara kính siêu xe',
    tier: 5,
    defaultWallColor: '#f8fafc',
    defaultRoofColor: '#1e293b',
    highlights: ['Đá Marble trắng Carrera quý tộc', 'Bể bơi vô cực ngoài sân cực chill', 'Gara kính trưng bày siêu xe', 'Mái bằng bê tông đúc xếp tầng'],
  },
];

export const FURNITURE_CATALOG: FurnitureCatalogItem[] = [
  {
    maVatPham: 'GIUONG_GO_DON',
    tenVatPham: 'Giường Gỗ Đơn Ấm Cúng',
    danhMuc: 'phong_ngu',
    giaXu: 0,
    icon: '🛏️',
    moTa: 'Giường gỗ sồi tự nhiên kèm chăn gối êm ái (Mặc định)',
    defaultX: 8,
    defaultZ: 7,
    isStarter: true,
  },
  {
    maVatPham: 'BAN_HOC_DEN_LED',
    tenVatPham: 'Bàn Học Tiếng Anh & Laptop',
    danhMuc: 'goc_hoc_tap',
    giaXu: 0,
    icon: '💻',
    moTa: 'Bàn gỗ kèm đèn học và Laptop học tiếng Anh (Mặc định)',
    defaultX: 8,
    defaultZ: 2,
    isStarter: true,
  },
  {
    maVatPham: 'KE_SACH_OXFORD',
    tenVatPham: 'Kệ Sách Gỗ Sồi Oxford',
    danhMuc: 'goc_hoc_tap',
    giaXu: 0,
    icon: '📚',
    moTa: 'Tủ sách 4 tầng chứa từ điển và sách văn học Anh (Mặc định)',
    defaultX: 9,
    defaultZ: 2,
    isStarter: true,
  },
  {
    maVatPham: 'SOFA_GO_PHONG_KHACH',
    tenVatPham: 'Bộ Trường Kỷ & Bàn Trà',
    danhMuc: 'phong_khach',
    giaXu: 0,
    icon: '🍵',
    moTa: 'Bộ trường kỷ gỗ truyền thống kèm bàn trà ấm chén (Mặc định)',
    defaultX: 2,
    defaultZ: 5,
    isStarter: true,
  },
  {
    maVatPham: 'KE_TIVI_CO_DIEN',
    tenVatPham: 'Kệ Tivi Gỗ & Loa Lo-Fi',
    danhMuc: 'phong_khach',
    giaXu: 0,
    icon: '📺',
    moTa: 'Kệ gỗ đặt Tivi màn hình phẳng và cặp loa nghe nhạc (Mặc định)',
    defaultX: 3,
    defaultZ: 8,
    isStarter: true,
  },
  {
    maVatPham: 'THAM_DET_THO_CAM',
    tenVatPham: 'Thảm Trải Sàn Phòng Khách',
    danhMuc: 'trang_tri',
    giaXu: 0,
    icon: '🧶',
    moTa: 'Thảm dệt màu kem vàng ấm áp giữa phòng khách (Mặc định)',
    defaultX: 3,
    defaultZ: 5,
    isStarter: true,
  },
  {
    maVatPham: 'SOFA_DA_HIEN_DAI',
    tenVatPham: 'Sofa Da Bắc Âu Cao Cấp',
    danhMuc: 'phong_khach',
    giaXu: 120,
    icon: '🛋️',
    moTa: 'Sofa nệm da xanh Navy êm ái sang trọng cho phòng khách',
    defaultX: 2,
    defaultZ: 3,
  },
  {
    maVatPham: 'GIUONG_HOANG_GIA',
    tenVatPham: 'Giường Đôi Hoàng Gia King Size',
    danhMuc: 'phong_ngu',
    giaXu: 180,
    icon: '👑',
    moTa: 'Giường ngủ cỡ lớn bọc nhung đỏ-vàng phong cách quý tộc Anh',
    defaultX: 7,
    defaultZ: 7,
  },
  {
    maVatPham: 'DAN_PIANO_CO_DIEN',
    tenVatPham: 'Đàn Grand Piano Cổ Điển',
    danhMuc: 'phong_khach',
    giaXu: 250,
    icon: '🎹',
    moTa: 'Đàn dương cầm đen bóng kèm ghế đệm biểu diễn trong nhà',
    defaultX: 5,
    defaultZ: 8,
  },
  {
    maVatPham: 'BE_CA_CANH_LED',
    tenVatPham: 'Bể Cá Thủy Sinh Đèn LED',
    danhMuc: 'trang_tri',
    giaXu: 150,
    icon: '🐠',
    moTa: 'Bể cá cảnh mặt kính trong suốt phát sáng xanh ngọc',
    defaultX: 5,
    defaultZ: 2,
  },
  {
    maVatPham: 'TU_LANH_2_CANH',
    tenVatPham: 'Tủ Lạnh Side-by-Side Inox',
    danhMuc: 'phong_khach',
    giaXu: 140,
    icon: '🧊',
    moTa: 'Tủ lạnh 2 cánh hiện đại trữ đồ ăn thức uống mát lạnh',
    defaultX: 1,
    defaultZ: 8,
  },
  {
    maVatPham: 'CAY_MONSTERA',
    tenVatPham: 'Chậu Cây Cảnh Monstera',
    danhMuc: 'trang_tri',
    giaXu: 60,
    icon: '🪴',
    moTa: 'Chậu sứ trắng trồng cây lá xẻ xanh mát thanh lọc không khí',
    defaultX: 1,
    defaultZ: 2,
  },
  {
    maVatPham: 'THAM_LONG_CUU_TRON',
    tenVatPham: 'Thảm Lông Cừu Tròn Hồng Pastel',
    danhMuc: 'trang_tri',
    giaXu: 80,
    icon: '🌸',
    moTa: 'Thảm tròn lông cừu mềm mại trang trí góc phòng ngủ',
    defaultX: 6,
    defaultZ: 5,
  },
  {
    maVatPham: 'DEN_CAY_PHONG_KHACH',
    tenVatPham: 'Đèn Cây Đọc Sách Ánh Vàng',
    danhMuc: 'trang_tri',
    giaXu: 90,
    icon: '💡',
    moTa: 'Đèn đứng chụp vải tỏa ánh sáng vàng ấm áp góc phòng',
    defaultX: 4,
    defaultZ: 2,
  },
  {
    maVatPham: 'SOFA_GAMING_RGB',
    tenVatPham: 'Bộ Bàn Ghế Gaming RGB Streamer',
    danhMuc: 'goc_hoc_tap',
    giaXu: 210,
    icon: '🎮',
    moTa: 'Bàn máy tính đôi màn hình cong kèm dải đèn LED RGB cực chất',
    defaultX: 7,
    defaultZ: 4,
  },
  {
    maVatPham: 'TU_QUAN_AO_KINH',
    tenVatPham: 'Tủ Kính Trưng Bày Thời Trang Luxury',
    danhMuc: 'phong_ngu',
    giaXu: 175,
    icon: '👗',
    moTa: 'Tủ quần áo cửa kính đèn LED trưng bày bộ sưu tập thời trang',
    defaultX: 9,
    defaultZ: 5,
  },
  {
    maVatPham: 'MAY_PHA_CAFE_MINI',
    tenVatPham: 'Quầy Bar & Máy Pha Espresso Tại Gia',
    danhMuc: 'phong_khach',
    giaXu: 155,
    icon: '☕',
    moTa: 'Quầy bar gỗ óc chó tích hợp máy pha cà phê Ý chuyên nghiệp',
    defaultX: 1,
    defaultZ: 2,
  },
  {
    maVatPham: 'THAM_HOANG_GIA_DO',
    tenVatPham: 'Thảm Nhung Đỏ Hoàng Gia Anh Quốc',
    danhMuc: 'trang_tri',
    giaXu: 110,
    icon: '👑',
    moTa: 'Thảm dệt nhung đỏ viền vàng kim tôn lên vẻ sang trọng cho căn phòng',
    defaultX: 5,
    defaultZ: 5,
  },
  {
    maVatPham: 'TIVI_OLED_85_INCH',
    tenVatPham: 'Smart TV OLED 85 Inch & Loa Soundbar',
    danhMuc: 'phong_khach',
    giaXu: 230,
    icon: '🖥️',
    moTa: 'Tivi màn hình phẳng 8K viền siêu mỏng kèm dàn loa vòm rạp hát',
    defaultX: 3,
    defaultZ: 8,
  },
  {
    maVatPham: 'SOFA_CHUL_ITALY',
    tenVatPham: 'Sofa Chữ L Da Bò Ý Cao Cấp',
    danhMuc: 'phong_khach',
    giaXu: 280,
    icon: '🛋️',
    moTa: 'Sofa bọc da thật nhập khẩu Ý phom rộng êm ái cho biệt thự hiện đại',
    defaultX: 2,
    defaultZ: 4,
  },
  {
    maVatPham: 'BAN_AN_MARBLE',
    tenVatPham: 'Bàn Đảo Bếp Đá Marble Trắng Carrera',
    danhMuc: 'phong_khach',
    giaXu: 240,
    icon: '🍽️',
    moTa: 'Bàn ăn đá cẩm thạch nguyên khối kèm 4 ghế bọc nỉ Bắc Âu',
    defaultX: 1,
    defaultZ: 6,
  },
  {
    maVatPham: 'GHE_MASSAGE_AI',
    tenVatPham: 'Ghế Massage Phi Hành Gia AI',
    danhMuc: 'phong_ngu',
    giaXu: 320,
    icon: '💆',
    moTa: 'Ghế massage không trọng lực tích hợp AI quét huyệt đạo tự động',
    defaultX: 8,
    defaultZ: 4,
  },
  {
    maVatPham: 'DEN_CHUM_BAC_AU',
    tenVatPham: 'Đèn Chùm Pha Lê Nghệ Thuật Bắc Âu',
    danhMuc: 'trang_tri',
    giaXu: 160,
    icon: '✨',
    moTa: 'Đèn chùm thả trần pha lê lấp lánh nâng tầm đẳng cấp không gian sống',
    defaultX: 5,
    defaultZ: 5,
  },
];

// ============================================================================
// NGÂN HÀNG CÂU HỎI TIẾNG ANH KHI CÂU CÁ (TRẮC NGHIỆM 4 ĐÁP ÁN, TỰ LUẬN, KIẾN THỨC)
// Nguồn biên soạn & mở rộng: Destination B1 - Grammar & Vocabulary (Malcolm Mann & Steve Taylore-Knowles)
// https://drive.google.com/file/d/1ZBQoOCqgnJvuCbv2WHcbUDiVBp4iuVTB/view?usp=sharing
// ============================================================================
export const ENGLISH_SOURCE_BOOK = {
  title: 'Destination B1: Grammar & Vocabulary (Macmillan)',
  authors: 'Malcolm Mann & Steve Taylore-Knowles',
  url: 'https://drive.google.com/file/d/1ZBQoOCqgnJvuCbv2WHcbUDiVBp4iuVTB/view?usp=sharing',
};

export interface EnglishChallengeQuestion {
  id: string;
  questionType: 'multiple_choice' | 'essay_fill' | 'knowledge';
  difficulty: 'easy' | 'medium' | 'hard';
  cefr: string;
  unitSource?: string;
  prompt: string;
  hintVi: string;
  options?: string[]; // 4 đáp án cho câu hỏi trắc nghiệm hoặc kiến thức
  correctAnswer: string;
  acceptedAnswers?: string[]; // Các phương án chấp nhận cho câu tự luận điền từ
  explanationVi: string;
}

export const FISHING_ENGLISH_QUESTIONS: EnglishChallengeQuestion[] = [
  // ==========================================================================
  // 1. TRẮC NGHIỆM 4 ĐÁP ÁN (MULTIPLE CHOICE - DESTINATION B1 GRAMMAR & VOCAB)
  // ==========================================================================
  {
    id: 'fish_mc_1',
    questionType: 'multiple_choice',
    difficulty: 'easy',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 1: Present simple & continuous',
    prompt: 'Captain Jack _____ fishing at this lake every Sunday morning.',
    hintVi: 'Chọn động từ chia ở thì Hiện tại đơn phù hợp với chủ ngữ số ít.',
    options: ['go', 'goes', 'going', 'went'],
    correctAnswer: 'goes',
    explanationVi:
      '[Destination B1 - Unit 1] Dấu hiệu "every Sunday morning" chỉ thói quen lặp lại ở Hiện tại đơn (Present simple). Chủ ngữ "Captain Jack" là ngôi thứ 3 số ít nên "go" thêm "-es" thành "goes".',
  },
  {
    id: 'fish_mc_2',
    questionType: 'multiple_choice',
    difficulty: 'easy',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 1: Stative verbs',
    prompt: 'Look at that giant golden carp! I _____ it weighs at least five kilograms.',
    hintVi: 'Động từ chỉ trạng thái nhận thức (stative verb) không chia ở thì tiếp diễn.',
    options: ['believe', 'am believing', 'believes', 'was believing'],
    correctAnswer: 'believe',
    explanationVi:
      '[Destination B1 - Unit 1] "Believe" là động từ chỉ trạng thái nhận thức (Stative verb), không dùng ở dạng tiếp diễn (V-ing) ngay cả khi đang nói ở thời điểm hiện tại.',
  },
  {
    id: 'fish_mc_3',
    questionType: 'multiple_choice',
    difficulty: 'easy',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 2: Past simple & Past continuous',
    prompt: 'While I _____ by the pier yesterday, a colorful koi fish jumped out of the water.',
    hintVi: 'Hành động đang diễn ra trong quá khứ thì có hành động khác cắt ngang.',
    options: ['was sitting', 'sat', 'have sat', 'am sitting'],
    correctAnswer: 'was sitting',
    explanationVi:
      '[Destination B1 - Unit 2] Cấu trúc "While + S + was/were + V-ing, S + V2/ed": Hành động đang ngồi câu cá ("was sitting") kéo dài làm nền cho hành động cá nhảy lên ("jumped") cắt ngang.',
  },
  {
    id: 'fish_mc_4',
    questionType: 'multiple_choice',
    difficulty: 'medium',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 2: Used to',
    prompt: 'My grandfather _____ work on a big fishing boat when he was young, but now he is retired.',
    hintVi: 'Cấu trúc diễn tả một thói quen trong quá khứ nay không còn nữa.',
    options: ['used to', 'was used to', 'uses to', 'use to'],
    correctAnswer: 'used to',
    explanationVi:
      '[Destination B1 - Unit 2] "Used to + V_nguyên_thể" dùng để diễn tả một thói quen hoặc trạng thái trong quá khứ mà hiện tại đã chấm dứt.',
  },
  {
    id: 'fish_mc_5',
    questionType: 'multiple_choice',
    difficulty: 'medium',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 4: Present perfect simple',
    prompt: 'How many fish _____ you caught since you arrived at the lake this morning?',
    hintVi: 'Mệnh đề trước "since + mốc quá khứ" chia ở thì Hiện tại hoàn thành.',
    options: ['have', 'did', 'were', 'had'],
    correctAnswer: 'have',
    explanationVi:
      '[Destination B1 - Unit 4] Cấu trúc "Present Perfect (have/has + V3/ed) + since + Past Simple": Diễn tả kết quả tích lũy từ sáng đến hiện tại.',
  },
  {
    id: 'fish_mc_6',
    questionType: 'multiple_choice',
    difficulty: 'medium',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 28: Conditionals 1 (First conditional)',
    prompt: 'If I _____ a legendary shark today, I will take a photo with all my friends!',
    hintVi: 'Câu điều kiện loại 1 diễn tả điều có thể xảy ra ở hiện tại hoặc tương lai.',
    options: ['catch', 'caught', 'will catch', 'catching'],
    correctAnswer: 'catch',
    explanationVi:
      '[Destination B1 - Unit 28] Trong câu điều kiện loại 1 (If + S + V_hiện_tại_đơn, S + will + V_nguyên_thể), mệnh đề If dùng thì Hiện tại đơn ("catch").',
  },
  {
    id: 'fish_mc_7',
    questionType: 'multiple_choice',
    difficulty: 'medium',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 5: Past perfect simple',
    prompt: 'By the time the sun set, the fishermen _____ more than twenty salmons.',
    hintVi: 'Thì Quá khứ hoàn thành diễn tả hành động xảy ra trước một mốc trong quá khứ.',
    options: ['had caught', 'caught', 'have caught', 'were catching'],
    correctAnswer: 'had caught',
    explanationVi:
      '[Destination B1 - Unit 5] Cấu trúc "By the time + S + V_quá_khứ_đơn, S + had + V3/ed" dùng thì Quá khứ hoàn thành ("had caught") để chỉ hành động hoàn tất trước lúc mặt trời lặn.',
  },
  {
    id: 'fish_mc_8',
    questionType: 'multiple_choice',
    difficulty: 'medium',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 17: Relative clauses',
    prompt: 'The fisherman _____ boat is parked near the lighthouse just caught a giant tuna.',
    hintVi: 'Đại từ quan hệ chỉ sự sở hữu (thay cho his/her) đứng trước danh từ "boat".',
    options: ['whose', 'who', 'which', 'whom'],
    correctAnswer: 'whose',
    explanationVi:
      '[Destination B1 - Unit 17] Đại từ quan hệ "whose" đứng trước danh từ ("whose boat" = chiếc thuyền của người ngư dân đó) để chỉ sự sở hữu.',
  },
  {
    id: 'fish_mc_9',
    questionType: 'multiple_choice',
    difficulty: 'hard',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 25: So and such, too and enough',
    prompt: 'It was _____ a heavy storm that all the fishing boats had to return to the harbour.',
    hintVi: 'Cấu trúc "so + adj + that" và "such + (a/an) + adj + N + that".',
    options: ['such', 'so', 'too', 'enough'],
    correctAnswer: 'such',
    explanationVi:
      '[Destination B1 - Unit 25] Ta dùng "such + a/an + tính từ + danh từ đếm được số ít + that" ("such a heavy storm that..."). Nếu dùng "so" thì phải là "so heavy a storm" hoặc "the storm was so heavy that...".',
  },
  {
    id: 'fish_mc_10',
    questionType: 'multiple_choice',
    difficulty: 'hard',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 29: Conditionals 2 (Third conditional)',
    prompt: 'If you had pulled the fishing rod earlier, the big fish _____ escaped!',
    hintVi: 'Câu điều kiện loại 3 diễn tả điều không có thật trong quá khứ.',
    options: ["wouldn't have", "won't have", "didn't", "wouldn't"],
    correctAnswer: "wouldn't have",
    explanationVi:
      '[Destination B1 - Unit 29] Câu điều kiện loại 3: "If + S + had + V3/ed, S + would (not) have + V3/ed" ("wouldn\'t have escaped" - đã không trốn thoát).',
  },
  {
    id: 'fish_mc_11',
    questionType: 'multiple_choice',
    difficulty: 'hard',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 37: -ing and infinitive',
    prompt: 'Captain Jack suggested _____ to the deeper side of the lake to catch rare fish.',
    hintVi: 'Sau động từ "suggest", động từ theo sau chia ở dạng V-ing hay to-V?',
    options: ['moving', 'to move', 'move', 'moved'],
    correctAnswer: 'moving',
    explanationVi:
      '[Destination B1 - Unit 37] Sau động từ "suggest" (đề nghị/gợi ý), động từ trực tiếp theo sau luôn ở dạng danh động từ V-ing ("suggested moving").',
  },

  // ==========================================================================
  // 2. TỰ LUẬN ĐIỀN TỪ (ESSAY / FILL-IN-THE-BLANK - DESTINATION B1)
  // ==========================================================================
  {
    id: 'fish_essay_1',
    questionType: 'essay_fill',
    difficulty: 'easy',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 8: Prepositions of time and place',
    prompt: 'Điền giới từ chỉ thời gian đúng vào chỗ trống:\n"Many rare nocturnal fish only swim near the surface _____ night."',
    hintVi: 'Cụm giới từ chỉ ban đêm trong tiếng Anh là "___ night" (2 chữ cái).',
    correctAnswer: 'at',
    acceptedAnswers: ['at'],
    explanationVi:
      '[Destination B1 - Unit 8] Ta dùng giới từ "at" trong cụm cố định "at night" (vào ban đêm), trong khi dùng "in the morning / in the evening".',
  },
  {
    id: 'fish_essay_2',
    questionType: 'essay_fill',
    difficulty: 'easy',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 2: Irregular Past Simple',
    prompt: 'Chia dạng Quá khứ đơn (Past Simple) của động từ trong ngoặc:\n"Yesterday, I (catch) _____ a huge golden fish at the pier."',
    hintVi: 'Quá khứ bất quy tắc của động từ "catch" là gì? (6 chữ cái: c _ _ _ _ t)',
    correctAnswer: 'caught',
    acceptedAnswers: ['caught'],
    explanationVi:
      '[Destination B1 - Unit 2] Động từ bất quy tắc "catch" có dạng quá khứ đơn (V2) và quá khứ phân từ (V3) là "caught".',
  },
  {
    id: 'fish_essay_3',
    questionType: 'essay_fill',
    difficulty: 'medium',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 3: Vocabulary - Fun and games (Word patterns)',
    prompt: 'Điền giới từ tiếng Anh đúng vào câu sau:\n"She is very keen _____ fishing and outdoor activities in the 3D metaverse."',
    hintVi: 'Cấu trúc "be keen + [giới từ] + something/V-ing" nghĩa là say mê, yêu thích.',
    correctAnswer: 'on',
    acceptedAnswers: ['on'],
    explanationVi:
      '[Destination B1 - Unit 3] Word pattern cố định: "keen on something / doing something" (say mê, rất thích làm gì), tương tự "interested in" hoặc "fond of".',
  },
  {
    id: 'fish_essay_4',
    questionType: 'essay_fill',
    difficulty: 'medium',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 6: Learning and doing (Phrasal verbs)',
    prompt: 'Điền tiểu từ đúng để tạo thành cụm động từ có nghĩa "tra cứu thông tin":\n"If you do not know the English name of this fish, you can look it _____ in a dictionary."',
    hintVi: 'Phrasal verb "look ___" = tra cứu từ điển/thông tin (2 chữ cái).',
    correctAnswer: 'up',
    acceptedAnswers: ['up'],
    explanationVi:
      '[Destination B1 - Unit 6] Phrasal verb "look up" (look something up) có nghĩa là tra cứu thông tin hoặc từ vựng trong từ điển.',
  },
  {
    id: 'fish_essay_5',
    questionType: 'essay_fill',
    difficulty: 'medium',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 23: Question tags',
    prompt: 'Điền phần hỏi đuôi (Question tag) còn thiếu (2 từ):\n"You have visited the fishing pier before, _____ you?"',
    hintVi: 'Vế trước là "You have visited..." (khẳng định thì Hiện tại hoàn thành) nên vế đuôi phủ định là gì?',
    correctAnswer: "haven't",
    acceptedAnswers: ["haven't", 'have not'],
    explanationVi:
      '[Destination B1 - Unit 23] Với mệnh đề chính dùng thì Hiện tại hoàn thành "You have visited...", phần câu hỏi đuôi (question tag) phải dùng trợ động từ phủ định tương ứng là "haven\'t you?".',
  },
  {
    id: 'fish_essay_6',
    questionType: 'essay_fill',
    difficulty: 'hard',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 36: Nature and the universe',
    prompt: 'Điền từ tiếng Anh có nghĩa là "Loài có nguy cơ tuyệt chủng":\n"Blue whales and sea turtles are _____ species that we must protect." (Gợi ý: bắt đầu bằng chữ E, 10 chữ cái)',
    hintVi: 'Tính từ ghép từ "en-" + "danger" + "-ed" (e _ _ _ _ _ _ _ _ d).',
    correctAnswer: 'endangered',
    acceptedAnswers: ['endangered'],
    explanationVi:
      '[Destination B1 - Unit 36] Cụm từ "endangered species" chỉ các loài động thực vật đang có nguy cơ tuyệt chủng cần được bảo tồn.',
  },
  {
    id: 'fish_essay_7',
    questionType: 'essay_fill',
    difficulty: 'hard',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 35: Wish',
    prompt: 'Chia động từ "know" ở thì đúng sau "I wish" (mong ước ở hiện tại):\n"I wish I (know) _____ how to catch the legendary Golden Koi!"',
    hintVi: 'Sau "I wish" diễn tả điều ước trái với hiện tại, động từ lùi 1 thì về Quá khứ đơn.',
    correctAnswer: 'knew',
    acceptedAnswers: ['knew'],
    explanationVi:
      '[Destination B1 - Unit 35] Cấu trúc "wish + Past Simple" dùng để diễn tả mong ước về một điều khác với thực tế ở hiện tại ("I wish I knew...").',
  },

  // ==========================================================================
  // 3. CÂU HỎI KIẾN THỨC & TỪ VỰNG CHỦ ĐỀ (KNOWLEDGE & TOPIC VOCAB - DESTINATION B1)
  // ==========================================================================
  {
    id: 'fish_know_1',
    questionType: 'knowledge',
    difficulty: 'easy',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 36: Nature & Animals',
    prompt: '🌍 [Kiến thức Tự nhiên - Unit 36] Which of the following marine animals is a MAMMAL (động vật có vú), not a fish?',
    hintVi: 'Loài sinh vật biển nào sau đây là động vật có vú (thở bằng phổi, nuôi con bằng sữa)?',
    options: ['Dolphin (Cá heo)', 'Tuna (Cá ngừ)', 'Salmon (Cá hồi)', 'Clownfish (Cá hề)'],
    correctAnswer: 'Dolphin (Cá heo)',
    explanationVi:
      '[Destination B1 - Unit 36] Dolphin (Cá heo) và Whale (Cá voi) là động vật có vú dưới biển (Mammals), thở bằng phổi chứ không phải loài cá thở bằng mang.',
  },
  {
    id: 'fish_know_2',
    questionType: 'knowledge',
    difficulty: 'easy',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 36: Weather & Nature Vocabulary',
    prompt: '🌍 [Từ vựng Thời tiết - Unit 36] What do we call a gentle, light wind that feels pleasant by the lake?',
    hintVi: 'Cơn gió nhẹ mát mẻ thổi qua mặt hồ trong tiếng Anh gọi là gì?',
    options: [
      'A breeze (Cơn gió nhẹ)',
      'A hurricane (Siêu bão)',
      'A blizzard (Bão tuyết)',
      'A drought (Hạn hán)',
    ],
    correctAnswer: 'A breeze (Cơn gió nhẹ)',
    explanationVi:
      '[Destination B1 - Unit 36] Trong chủ đề Thời tiết (Weather), "breeze" là làn gió nhẹ dễ chịu, "hurricane" là bão lớn, "blizzard" là bão tuyết và "drought" là hạn hán.',
  },
  {
    id: 'fish_know_3',
    questionType: 'knowledge',
    difficulty: 'medium',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 9: Coming and going (Travel Vocabulary)',
    prompt: '🌍 [Từ vựng Du lịch - Unit 9] What is the correct English word for a long journey by sea or on a ship?',
    hintVi: 'Phân biệt "trip", "voyage", "flight" và "excursion" trong Unit 9 Destination B1.',
    options: [
      'A voyage (Chuyến hải trình bằng tàu thủy)',
      'A flight (Chuyến bay)',
      'A platform (Sân ga tàu hỏa)',
      'A fee (Lệ phí)',
    ],
    correctAnswer: 'A voyage (Chuyến hải trình bằng tàu thủy)',
    explanationVi:
      '[Destination B1 - Unit 9] "Voyage" là chuyến đi xa bằng tàu thủy trên biển (hoặc trong không gian), trong khi "flight" là chuyến bay và "excursion" là chuyến tham quan ngắn.',
  },
  {
    id: 'fish_know_4',
    questionType: 'knowledge',
    difficulty: 'medium',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 3: Fun and games (Sports Vocabulary)',
    prompt: '🌍 [Từ vựng Thể thao - Unit 3] In English, which verb goes with outdoor non-team activities ending in "-ing" like fishing, swimming, and skateboarding?',
    hintVi: 'Phân biệt 3 động từ "play", "do", "go" khi đi với các môn thể thao có đuôi "-ing".',
    options: [
      'go (go fishing, go swimming, go skateboarding)',
      'play (play fishing, play swimming)',
      'do (do fishing, do swimming)',
      'make (make fishing, make swimming)',
    ],
    correctAnswer: 'go (go fishing, go swimming, go skateboarding)',
    explanationVi:
      '[Destination B1 - Unit 3] Ta dùng "go + V-ing" cho các hoạt động thể thao/dã ngoại mang tính di chuyển như "go fishing", "go swimming", "go skateboarding"; dùng "play" cho môn có bóng/đối kháng và "do" cho võ thuật/thể dục.',
  },
  {
    id: 'fish_know_5',
    questionType: 'knowledge',
    difficulty: 'hard',
    cefr: 'B1',
    unitSource: 'Destination B1 • Unit 42: Problems and solutions (Phrasal verbs)',
    prompt: '🌍 [Cụm động từ Môi trường - Unit 36 & 42] If fishermen do not throw plastic rubbish into the lake, they help prevent the water from being polluted. What does the phrasal verb "get rid of" mean?',
    hintVi: 'Cụm từ "get rid of" (Unit 42 - Problems and solutions) có nghĩa là gì?',
    options: [
      'Throw away or remove something unwanted (Loại bỏ / Vứt bỏ đúng cách)',
      'Collect and keep forever (Cất giữ mãi mãi)',
      'Buy something expensive (Mua đồ đắt tiền)',
      'Repair a broken machine (Sửa chữa máy móc)',
    ],
    correctAnswer: 'Throw away or remove something unwanted (Loại bỏ / Vứt bỏ đúng cách)',
    explanationVi:
      '[Destination B1 - Unit 42] Cụm động từ "get rid of something" có nghĩa là loại bỏ, thanh lý hoặc vứt bỏ những thứ không còn cần thiết.',
  },
  // Bổ sung toàn bộ kho câu hỏi đa nguồn (Cambridge, Oxford 3000, IELTS, TOEIC, British Council, Destination B1/B2)
  ...MULTI_SOURCE_ENGLISH_BANK.map(
    (item): EnglishChallengeQuestion => ({
      id: `fish_${item.id}`,
      questionType:
        item.category === 'culture_knowledge' ? 'knowledge' : item.questionType,
      difficulty: item.difficulty,
      cefr: item.cefr,
      unitSource: `${ENGLISH_DATABASE_SOURCES[item.sourceId].shortBadge} • ${item.unitOrTopic}`,
      prompt: item.promptEn,
      hintVi: item.hintVi,
      options: item.options,
      correctAnswer: item.correctAnswer,
      acceptedAnswers: item.acceptedAnswers,
      explanationVi: item.explanationVi,
    })
  ),
];

// ============================================================================
// HỆ THỐNG 4 CỬA HÀNG THƯƠNG MẠI & VIỆC LÀM THÊM (CAFE, QUÁN ĂN, QUẦN ÁO, XE CỘ)
// ============================================================================
export type ShopVenueId = 'CAFE' | 'DINER' | 'CLOTHING' | 'CAR_SHOWROOM';

export type AvatarTopStyle = 'streetwear' | 'suit' | 'hoodie' | 'royal' | 'cyberpunk';
export type AvatarHatStyle = 'snapback' | 'crown' | 'cat_ears' | 'halo' | 'beret' | 'none';
export type AvatarAccessoryStyle =
  | 'headphones'
  | 'crossbody_bag'
  | 'angel_wings'
  | 'cyber_wings'
  | 'guitar_back'
  | 'sunglasses'
  | 'none';
export type WorldVehicleType =
  | 'none'
  | 'skateboard'
  | 'hoverboard'
  | 'vespa'
  | 'harley'
  | 'motorbike'
  | 'cybertruck'
  | 'gclass'
  | 'sportscar'
  | 'rollsroyce';

export interface ShopProductItem {
  id: string;
  name: string;
  englishName: string;
  priceCoins: number;
  expReward: number;
  icon: string;
  description: string;
  category: 'food_drink' | 'clothing' | 'vehicle';
  brand?: string;
  // Thuộc tính trang bị nếu là quần áo hoặc xe cộ (Hỗ trợ Mix & Match tự phối đồ)
  outfitColor?: string;
  hatColor?: string;
  pantsColor?: string;
  shoeColor?: string;
  hairColor?: string;
  avatarStyle?: AvatarTopStyle;
  hatStyle?: AvatarHatStyle;
  accessory?: AvatarAccessoryStyle;
  vehicleType?: Exclude<WorldVehicleType, 'none'>;
  vehicleColor?: string;
  speedBoost?: number;
}

export interface WorkCustomerScenario {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple_choice' | 'essay_fill' | 'knowledge';
  unitSource?: string;
  customerName: string;
  customerAvatar: string;
  customerOrderEn: string;
  contextHintVi: string;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanationVi: string;
  rewardCoins: number;
  rewardExp: number;
}

export interface CityShopVenueConfig {
  id: ShopVenueId;
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  position: [number, number, number];
  interactionRadius: number;
  jobTitle: string;
  products: ShopProductItem[];
  workScenarios: WorkCustomerScenario[];
}

export const CITY_SHOPS_DATA: Record<ShopVenueId, CityShopVenueConfig> = {
  CAFE: {
    id: 'CAFE',
    title: '☕ London Artisan Cafe',
    subtitle: 'Thưởng thức Cafe & Làm Barista giao tiếp tiếng Anh',
    icon: '☕',
    accentColor: '#e11d48',
    position: [34, 0, 35],
    interactionRadius: 8.5,
    jobTitle: 'Barista Pha Chế & Thu Ngân',
    products: [
      {
        id: 'CAFE_ESPRESSO',
        name: 'Ly Espresso Ý Đậm Đà',
        englishName: 'Double Shot Espresso',
        priceCoins: 25,
        expReward: 15,
        icon: '☕',
        description: 'Tăng sự tỉnh táo, nhận ngay +15 EXP tiếng Anh',
        category: 'food_drink',
      },
      {
        id: 'CAFE_CARAMEL_MACCHIATO',
        name: 'Caramel Macchiato Đá Xay',
        englishName: 'Iced Caramel Macchiato',
        priceCoins: 40,
        expReward: 30,
        icon: '🧋',
        description: 'Thức uống bán chạy nhất tại London Cafe (+30 EXP)',
        category: 'food_drink',
      },
      {
        id: 'CAFE_MATCHA_LATTE',
        name: 'Matcha Latte Kem Cheese',
        englishName: 'Creamy Matcha Latte',
        priceCoins: 45,
        expReward: 35,
        icon: '🍵',
        description: 'Trà xanh Uji Nhật Bản kết hợp sữa tươi (+35 EXP)',
        category: 'food_drink',
      },
      {
        id: 'CAFE_CROISSANT',
        name: 'Bánh Sừng Bò Bơ Pháp',
        englishName: 'French Butter Croissant',
        priceCoins: 35,
        expReward: 25,
        icon: '🥐',
        description: 'Bánh nướng giòn rụm thơm lừng bơ tươi (+25 EXP)',
        category: 'food_drink',
      },
      {
        id: 'CAFE_TIRAMISU',
        name: 'Bánh Tiramisu Cacao Ý',
        englishName: 'Classic Italian Tiramisu',
        priceCoins: 55,
        expReward: 45,
        icon: '🍰',
        description: 'Bánh kem phô mai Mascarpone phủ bột Cacao nguyên chất (+45 EXP)',
        category: 'food_drink',
      },
      {
        id: 'CAFE_STRAWBERRY_SMOOTHIE',
        name: 'Sinh Tố Dâu Tây Kem Tuyết',
        englishName: 'Strawberry Cream Smoothie',
        priceCoins: 50,
        expReward: 40,
        icon: '🍓',
        description: 'Dâu tây Đà Lạt xay lạnh cùng kem tươi mát lành (+40 EXP)',
        category: 'food_drink',
      },
      {
        id: 'CAFE_EARL_GREY_TEA',
        name: 'Trà Báước Anh Quốc & Bánh Macaron',
        englishName: 'Royal Earl Grey & Macaron Set',
        priceCoins: 65,
        expReward: 55,
        icon: '🫖',
        description: 'Set trà chiều kiểu quý tộc London kèm bánh Macaron Pháp (+55 EXP)',
        category: 'food_drink',
      },
    ],
    workScenarios: [
      {
        id: 'cafe_work_easy_1',
        difficulty: 'easy',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 15: Buying and selling',
        customerName: 'Ms. Emily (Khách hàng)',
        customerAvatar: '👩🏼‍💼',
        customerOrderEn: '"Good morning! Can I get a hot Caramel Latte, please? How much is it?"',
        contextHintVi: '[Độ khó: Dễ] Chọn câu trả lời lịch sự báo giá món nước cho khách tại quầy Cafe.',
        options: [
          'Sure! That will be 40 coins, please. Would you like it for here or to go?',
          'No, I do not drink coffee in the morning.',
          'Where is the nearest bus station?',
          'Give me your money right now.',
        ],
        correctAnswer:
          'Sure! That will be 40 coins, please. Would you like it for here or to go?',
        explanationVi:
          '[Destination B1 - Unit 15] Khi làm thu ngân/Barista, câu "That will be 40 coins, please. Would you like it for here or to go?" (Của quý khách hết 40 xu ạ. Quý khách dùng tại quán hay mang đi?) là chuẩn mực nhất.',
        rewardCoins: 35,
        rewardExp: 25,
      },
      {
        id: 'cafe_work_easy_2',
        difficulty: 'easy',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 13: Countable and uncountable nouns',
        customerName: 'Mr. Harry (Nhân viên văn phòng)',
        customerAvatar: '👨🏻‍💼',
        customerOrderEn: '"I do not want my Espresso to be too sweet. Please do not put _____ sugar in my coffee."',
        contextHintVi: '[Độ khó: Dễ - Unit 13] "Sugar" là danh từ không đếm được (uncountable noun). Chọn lượng từ dùng với danh từ không đếm được trong câu phủ định.',
        options: ['much', 'many', 'a few', 'several'],
        correctAnswer: 'much',
        explanationVi:
          '[Destination B1 - Unit 13] "Sugar" (đường) là danh từ không đếm được (uncountable noun), nên trong câu phủ định ta dùng "much" ("not much sugar"). "Many", "a few", "several" chỉ đi với danh từ đếm được số nhiều.',
        rewardCoins: 40,
        rewardExp: 30,
      },
      {
        id: 'cafe_work_easy_3',
        difficulty: 'easy',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 15: Prepositional phrases (Buying & selling)',
        customerName: 'Mrs. Clara (Cư dân khu phố)',
        customerAvatar: '👵🏼',
        customerOrderEn: '"Oh dear, I forgot my credit card at home! Can I pay _____ cash for this Matcha Latte?"',
        contextHintVi: '[Độ khó: Dễ - Unit 15] Phân biệt giới từ đi với "cash" (tiền mặt) và "credit card" (thẻ tín dụng).',
        options: ['in', 'by', 'on', 'with'],
        correctAnswer: 'in',
        explanationVi:
          '[Destination B1 - Unit 15] Trong cụm giới từ thanh toán (Prepositional phrases): Ta luôn dùng "pay in cash" (trả bằng tiền mặt), nhưng dùng "pay by credit card / by cheque" (trả bằng thẻ/séc).',
        rewardCoins: 40,
        rewardExp: 30,
      },
      {
        id: 'cafe_work_med_1',
        difficulty: 'medium',
        questionType: 'essay_fill',
        unitSource: 'Destination B1 • Unit 15: Buying and selling',
        customerName: 'Mr. Oliver (Du khách Anh)',
        customerAvatar: '🧔🏻‍♂️',
        customerOrderEn:
          'Khách muốn gọi cà phê mang đi. Hãy điền từ còn thiếu vào câu hỏi của Barista:\n"Would you like your coffee for here or to _____?"',
        contextHintVi: '[Độ khó: Trung bình - Tự luận] Cụm từ tiếng Anh "for here or to _____" (uống tại chỗ hay mang đi).',
        correctAnswer: 'go',
        acceptedAnswers: ['go', 'take away', 'takeaway'],
        explanationVi:
          '[Destination B1 - Unit 15] "For here or to go?" (hoặc "take away") là mẫu câu giao tiếp kinh điển tại mọi quán cafe khi hỏi khách dùng tại quán hay mang đi.',
        rewardCoins: 65,
        rewardExp: 45,
      },
      {
        id: 'cafe_work_med_2',
        difficulty: 'medium',
        questionType: 'essay_fill',
        unitSource: 'Destination B1 • Unit 25: Too and enough',
        customerName: 'Miss Chloe (Sinh viên Học viện)',
        customerAvatar: '👩🏻‍🎓',
        customerOrderEn:
          'Khách phàn nàn trà vừa pha quá nóng chưa uống ngay được. Điền từ phù hợp theo cấu trúc "___ + adj + to V":\n"Careful! This cup of Earl Grey tea is _____ hot to drink right now."',
        contextHintVi: '[Độ khó: Trung bình - Unit 25] Cấu trúc "___ + tính từ + to V" (quá... đến mức không thể làm gì, 3 chữ cái: t _ _).',
        correctAnswer: 'too',
        acceptedAnswers: ['too'],
        explanationVi:
          '[Destination B1 - Unit 25] Cấu trúc "too + adjective + to V" ("too hot to drink" = quá nóng đến mức không thể uống ngay) diễn tả mức độ vượt quá giới hạn.',
        rewardCoins: 70,
        rewardExp: 50,
      },
      {
        id: 'cafe_work_med_3',
        difficulty: 'medium',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 30: Body and lifestyle (Phrasal verbs)',
        customerName: 'Dr. Watson (Bác sĩ)',
        customerAvatar: '👨🏼‍⚕️',
        customerOrderEn: '"My doctor told me to _____ down on caffeine, so could you make me a decaf Latte today?"',
        contextHintVi: '[Độ khó: Trung bình - Unit 30] Cụm động từ "___ down on something" nghĩa là cắt giảm lượng tiêu thụ (đường, cà phê).',
        options: ['cut', 'put', 'take', 'get'],
        correctAnswer: 'cut',
        explanationVi:
          '[Destination B1 - Unit 30] Phrasal verb "cut down on something" có nghĩa là cắt giảm lượng tiêu thụ một thứ gì đó (như caffeine, đường, đồ ngọt) để tốt cho sức khỏe.',
        rewardCoins: 75,
        rewardExp: 55,
      },
      {
        id: 'cafe_work_hard_1',
        difficulty: 'hard',
        questionType: 'knowledge',
        unitSource: 'Destination B1 • Unit 30: Body and lifestyle (Food & Drink)',
        customerName: 'Chef Marco (Chuyên gia Ẩm thực)',
        customerAvatar: '👨🏻‍🍳',
        customerOrderEn:
          '"I am lactose intolerant, so I cannot drink regular cow milk. Which Espresso-based drink is made ONLY with hot water and espresso, containing NO milk at all?"',
        contextHintVi:
          '[Độ khó: Khó - Kiến thức Barista] Khách bị dị ứng sữa (lactose intolerant). Loại cà phê nào chỉ pha từ Espresso và nước nóng, hoàn toàn không có sữa?',
        options: [
          'Caffè Americano',
          'Cappuccino',
          'Caffè Latte',
          'Caramel Macchiato',
        ],
        correctAnswer: 'Caffè Americano',
        explanationVi:
          '[Destination B1 - Unit 30] Caffè Americano được pha từ Espresso thêm nước nóng (không có sữa), rất phù hợp cho khách hàng không dung nạp lactose (lactose intolerant).',
        rewardCoins: 110,
        rewardExp: 80,
      },
      {
        id: 'cafe_work_hard_2',
        difficulty: 'hard',
        questionType: 'essay_fill',
        unitSource: 'Destination B1 • Unit 15: Buying and selling (Topic Vocabulary)',
        customerName: 'Mr. Sherlock (Thám tử)',
        customerAvatar: '🕵🏻‍♂️',
        customerOrderEn:
          'Khách đưa tờ 50 xu để mua ly Espresso giá 25 xu và nhận lại tiền thừa cùng biên lai. Điền từ tiếng Anh có nghĩa là "Hóa đơn / Biên lai thanh toán":\n"Here is your 25 coins change and your _____." (Gợi ý: 7 chữ cái, bắt đầu bằng R: r _ _ _ _ _ t)',
        contextHintVi: '[Độ khó: Khó - Unit 15] Từ vựng chỉ tờ biên lai sau khi đã trả tiền (chữ "p" câm: r e c e i p t).',
        correctAnswer: 'receipt',
        acceptedAnswers: ['receipt'],
        explanationVi:
          '[Destination B1 - Unit 15] Trong chủ đề Buying and Selling, "change" là tiền thừa trả lại khách, còn "receipt" (/rɪˈsiːt/) là biên lai xác nhận đã thanh toán.',
        rewardCoins: 120,
        rewardExp: 90,
      },
      {
        id: 'cafe_work_hard_3',
        difficulty: 'hard',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 19: Modals (Polite requests & permission)',
        customerName: 'Lady Eleanor (Nhà văn)',
        customerAvatar: '👩🏼‍🏫',
        customerOrderEn: '"Excuse me, Barista! Would you mind _____ the music down a little bit? I am reading an English novel."',
        contextHintVi: '[Độ khó: Khó - Unit 19 & 37] Sau cấu trúc lịch sự "Would you mind...", động từ chia ở dạng nào?',
        options: ['turning', 'to turn', 'turn', 'turned'],
        correctAnswer: 'turning',
        explanationVi:
          '[Destination B1 - Unit 19 & 37] Cấu trúc yêu cầu lịch sự "Would you mind + V-ing...?" ("Would you mind turning the music down?") luôn đi kèm danh động từ V-ing.',
        rewardCoins: 125,
        rewardExp: 90,
      },
    ],
  },

  DINER: {
    id: 'DINER',
    title: '🍔 Route 66 Burger & Pizza Diner',
    subtitle: 'Nhà hàng Đồ Ăn Nhanh & Làm Phục Vụ Nhà Hàng',
    icon: '🍔',
    accentColor: '#ea580c',
    position: [35, 0, 13],
    interactionRadius: 8.5,
    jobTitle: 'Nhân Viên Phục Vụ & Bếp Trưởng',
    products: [
      {
        id: 'DINER_BURGER',
        name: 'Double Cheese Beef Burger',
        englishName: 'Double Cheese Beef Burger',
        priceCoins: 50,
        expReward: 40,
        icon: '🍔',
        description: 'Bánh Burger 2 lớp bò Mỹ nướng & phô mai tan chảy (+40 EXP)',
        category: 'food_drink',
      },
      {
        id: 'DINER_PIZZA',
        name: 'Pizza Pepperoni Phô Mai Kéo Sợi',
        englishName: 'Supreme Pepperoni Pizza',
        priceCoins: 65,
        expReward: 55,
        icon: '🍕',
        description: 'Pizza đế giòn nướng củi truyền thống (+55 EXP)',
        category: 'food_drink',
      },
      {
        id: 'DINER_STEAK',
        name: 'Bít Tết Bò Ribeye Sốt Tiêu Đen',
        englishName: 'Grilled Ribeye Steak',
        priceCoins: 95,
        expReward: 80,
        icon: '🥩',
        description: 'Món chính thượng hạng giúp tăng mạnh +80 EXP tiếng Anh',
        category: 'food_drink',
      },
      {
        id: 'DINER_FRIES',
        name: 'Khoai Tây Chiên Giòn & Cola',
        englishName: 'Crispy French Fries & Cola',
        priceCoins: 30,
        expReward: 20,
        icon: '🍟',
        description: 'Combo ăn nhẹ giòn tan (+20 EXP)',
        category: 'food_drink',
      },
      {
        id: 'DINER_LOBSTER_PASTA',
        name: 'Mì Ý Tôm Hùm Sốt Kem Nấm Truffle',
        englishName: 'Truffle Cream Lobster Spaghetti',
        priceCoins: 115,
        expReward: 95,
        icon: '🍝',
        description: 'Mì Ý thượng hạng sốt nấm Truffle đen và tôm hùm nướng (+95 EXP)',
        category: 'food_drink',
      },
      {
        id: 'DINER_BBQ_RIBS',
        name: 'Sườn Nướng Tảng BBQ Texas',
        englishName: 'Smoked Texas BBQ Pork Ribs',
        priceCoins: 85,
        expReward: 70,
        icon: '🍖',
        description: 'Sườn nướng hun khói gỗ sồi mềm mọng đậm vị (+70 EXP)',
        category: 'food_drink',
      },
      {
        id: 'DINER_SUNDAE_SHAKE',
        name: 'Kem Sundae & Sữa Lắc Vani',
        englishName: 'Vanilla Milkshake & Fudge Sundae',
        priceCoins: 45,
        expReward: 35,
        icon: '🍨',
        description: 'Tráng miệng ngọt ngào chuẩn phong cách Diner Mỹ (+35 EXP)',
        category: 'food_drink',
      },
    ],
    workScenarios: [
      {
        id: 'diner_work_easy_1',
        difficulty: 'easy',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 30: Body and lifestyle (Food & restaurants)',
        customerName: 'Student Sam (Học sinh)',
        customerAvatar: '👦🏻',
        customerOrderEn: '"Excuse me! Are you ready to take my order? I would like a Double Cheese Burger."',
        contextHintVi: '[Độ khó: Dễ] Chọn câu đáp lại lịch sự của nhân viên phục vụ khi nhận món khách gọi.',
        options: [
          'Certainly! Would you like some French fries or a drink with your burger?',
          'Go cook it yourself in the kitchen.',
          'We only sell shoes and jackets here.',
          'I am sleeping right now.',
        ],
        correctAnswer:
          'Certainly! Would you like some French fries or a drink with your burger?',
        explanationVi:
          '[Destination B1 - Unit 30] Câu "Certainly! Would you like some French fries or a drink with your burger?" vừa xác nhận món lịch sự vừa gợi ý thêm đồ ăn kèm chuẩn nghiệp vụ nhà hàng.',
        rewardCoins: 35,
        rewardExp: 25,
      },
      {
        id: 'diner_work_easy_2',
        difficulty: 'easy',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 30: Cooking verbs (bake, fry, boil)',
        customerName: 'Little Timmy (Khách nhí)',
        customerAvatar: '🧒🏼',
        customerOrderEn: '"Waiter! How are your crispy French fries cooked? They taste so good!"',
        contextHintVi: '[Độ khó: Dễ - Unit 30] Khoai tây chiên (French fries) được chiên/rán ngập trong dầu nóng bằng động từ nào?',
        options: [
          'They are fried in hot vegetable oil until golden and crispy.',
          'They are frozen in snow for three days.',
          'They are washed with soap and cold water.',
          'They are knitted with wool.',
        ],
        correctAnswer: 'They are fried in hot vegetable oil until golden and crispy.',
        explanationVi:
          '[Destination B1 - Unit 30] Trong từ vựng nấu nướng: "fry" (chiên/rán trong dầu), "bake" (nướng bánh trong lò), "boil" (luộc bằng nước sôi) và "roast / grill" (nướng thịt).',
        rewardCoins: 40,
        rewardExp: 30,
      },
      {
        id: 'diner_work_easy_3',
        difficulty: 'easy',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 10: The passive 1',
        customerName: 'Ms. Hannah (Khách du lịch)',
        customerAvatar: '👩🏽',
        customerOrderEn: '"Does this Ribeye Steak come with any side dishes?" — "Yes, madam! Every steak _____ with a fresh garden salad and mashed potatoes."',
        contextHintVi: '[Độ khó: Dễ - Unit 10] Chọn dạng bị động ở thì Hiện tại đơn (Passive voice: is/are + V3/ed).',
        options: ['is served', 'serves', 'serving', 'has serving'],
        correctAnswer: 'is served',
        explanationVi:
          '[Destination B1 - Unit 10] Câu bị động ở Hiện tại đơn (am/is/are + V3/ed): Chủ ngữ "Every steak" là số ít nên dùng "is served" (được phục vụ kèm với...).',
        rewardCoins: 40,
        rewardExp: 30,
      },
      {
        id: 'diner_work_med_1',
        difficulty: 'medium',
        questionType: 'essay_fill',
        unitSource: 'Destination B1 • Unit 30: Food & cooking',
        customerName: 'Mr. David (Khách thương gia)',
        customerAvatar: '🤵🏻‍♂️',
        customerOrderEn:
          'Khi phục vụ món Bít tết (Steak), nhân viên hỏi khách muốn độ chín như thế nào:\n"How would you like your steak _____? Rare, medium, or well-done?"',
        contextHintVi: '[Độ khó: Trung bình - Tự luận] Điền phân từ 2 (V3/ed) của động từ "cook" (6 chữ cái: c _ _ _ _ d).',
        correctAnswer: 'cooked',
        acceptedAnswers: ['cooked', 'done'],
        explanationVi:
          '[Destination B1 - Unit 30] "How would you like your steak cooked?" (Quý khách muốn bít tết được chế biến độ chín thế nào: tái, chín vừa hay chín kỹ?) là câu hỏi chuẩn tại nhà hàng Âu.',
        rewardCoins: 65,
        rewardExp: 45,
      },
      {
        id: 'diner_work_med_2',
        difficulty: 'medium',
        questionType: 'essay_fill',
        unitSource: 'Destination B1 • Unit 9 & 30: Booking a table',
        customerName: 'Mr. & Mrs. Brown (Gia đình thực khách)',
        customerAvatar: '👨🏻‍👩🏻‍👧🏻',
        customerOrderEn:
          'Khách gọi điện đặt bàn trước cho 4 người vào tối thứ Bảy. Điền động từ có nghĩa là "đặt chỗ trước" (đồng nghĩa với reserve):\n"Hello! I would like to _____ a table for four people for tonight at 7 PM." (4 chữ cái: b _ _ k)',
        contextHintVi: '[Độ khó: Trung bình - Unit 9] Động từ 4 chữ cái vừa có nghĩa là "quyển sách", vừa có nghĩa là "đặt bàn / đặt vé trước".',
        correctAnswer: 'book',
        acceptedAnswers: ['book', 'reserve'],
        explanationVi:
          '[Destination B1 - Unit 9] Động từ "book" (book a table / book a room / book a flight) có nghĩa là đặt chỗ trước, đồng nghĩa với "reserve".',
        rewardCoins: 70,
        rewardExp: 50,
      },
      {
        id: 'diner_work_med_3',
        difficulty: 'medium',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 23: Indirect questions',
        customerName: 'Ms. Fiona (Khách ăn chay)',
        customerAvatar: '👩🏼‍🌾',
        customerOrderEn: '"I am a vegetarian, so I do not eat meat. Could you tell me what ingredients _____ in this pizza?"',
        contextHintVi: '[Độ khó: Trung bình - Unit 23] Trong câu hỏi gián tiếp (Indirect question: Could you tell me + wh-word + S + V), trật tự từ theo sau như câu trần thuật.',
        options: ['there are', 'are there', 'is there', 'there is'],
        correctAnswer: 'there are',
        explanationVi:
          '[Destination B1 - Unit 23] Trong câu hỏi gián tiếp mở đầu bằng "Could you tell me...", mệnh đề phía sau không đảo ngữ mà giữ trật tự S + V ("what ingredients there are in this pizza").',
        rewardCoins: 75,
        rewardExp: 55,
      },
      {
        id: 'diner_work_hard_1',
        difficulty: 'hard',
        questionType: 'knowledge',
        unitSource: 'Destination B1 • Unit 15 & 30: Restaurant & recipes',
        customerName: 'Lady Sophia (Thực khách VIP)',
        customerAvatar: '👩🏻‍🦰',
        customerOrderEn:
          '"We have finished our dinner and everything was delicious! Could we have the _____, please? We would like to pay by credit card."',
        contextHintVi:
          '[Độ khó: Khó - Unit 15 & 30] Từ nào dùng để gọi "Hóa đơn thanh toán" tại nhà hàng trong tiếng Anh?',
        options: [
          'bill (hoặc check)',
          'recipe (công thức nấu ăn)',
          'ingredient (nguyên liệu)',
          'prescription (đơn thuốc)',
        ],
        correctAnswer: 'bill (hoặc check)',
        explanationVi:
          '[Destination B1 - Unit 15 & 30] Trong nhà hàng, khách xin hóa đơn thanh toán bằng câu "Could we have the bill, please?" (Anh-Anh) hoặc "the check" (Anh-Mỹ). "Recipe" là công thức nấu ăn, "ingredient" là nguyên liệu, "prescription" là đơn thuốc của bác sĩ.',
        rewardCoins: 110,
        rewardExp: 80,
      },
      {
        id: 'diner_work_hard_2',
        difficulty: 'hard',
        questionType: 'essay_fill',
        unitSource: 'Destination B1 • Unit 30: Body and lifestyle (Word formation)',
        customerName: 'Critic Gordon (Nhà phê bình ẩm thực)',
        customerAvatar: '👨🏼‍🍳',
        customerOrderEn:
          'Điền tính từ chỉ vị "cay nồng" của món Pizza Pepperoni ớt Mexico:\n"Be careful with that Mexican Pepperoni Pizza — it has a lot of chilli peppers, so it is very _____!" (5 chữ cái: s _ _ _ y)',
        contextHintVi: '[Độ khó: Khó - Unit 30] Tính từ tạo bởi danh từ "spice" (gia vị) thêm hậu tố "-y" (s p i c y).',
        correctAnswer: 'spicy',
        acceptedAnswers: ['spicy', 'hot'],
        explanationVi:
          '[Destination B1 - Unit 30] Từ danh từ "spice" (gia vị), ta có tính từ "spicy" (cay nồng, đậm vị gia vị), bên cạnh các vị "sweet" (ngọt), "sour" (chua), "salty" (mặn) và "bitter" (đắng).',
        rewardCoins: 120,
        rewardExp: 90,
      },
      {
        id: 'diner_work_hard_3',
        difficulty: 'hard',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 30: Phrasal verbs (give up / cut down)',
        customerName: 'Coach Marcus (Huấn luyện viên thể hình)',
        customerAvatar: '🏋🏻‍♂️',
        customerOrderEn: '"To keep fit and stay healthy, I have completely _____ up eating junk food at late night, so I will just order a grilled chicken salad."',
        contextHintVi: '[Độ khó: Khó - Unit 30] Cụm động từ "___ up + V-ing" có nghĩa là từ bỏ hoàn toàn một thói quen.',
        options: ['given', 'taken', 'put', 'turned'],
        correctAnswer: 'given',
        explanationVi:
          '[Destination B1 - Unit 30] Phrasal verb "give up (doing something)" (ở thì Hiện tại hoàn thành: "have given up") có nghĩa là từ bỏ hoàn toàn một thói quen.',
        rewardCoins: 125,
        rewardExp: 90,
      },
    ],
  },

  CLOTHING: {
    id: 'CLOTHING',
    title: '👗 Royal Fashion Boutique',
    subtitle: 'Cửa Hàng Quần Áo Thời Trang & Làm Stylist Tư Vấn',
    icon: '👗',
    accentColor: '#9333ea',
    position: [12, 0, -34],
    interactionRadius: 8.5,
    jobTitle: 'Stylist Tư Vấn Thời Trang',
    products: [
      {
        id: 'OUTFIT_SKY_HOODIE',
        name: 'Set Hoodie Năng Động Sky Casual (Mặc định)',
        englishName: 'Sky Blue Starter Casual Hoodie',
        priceCoins: 0,
        expReward: 0,
        icon: '👕',
        description: 'Trang phục khởi đầu trẻ trung kèm tai nghe DJ, túi đeo chéo & sneaker trắng',
        category: 'clothing',
        brand: 'LifeAt Originals',
        outfitColor: '#38bdf8',
        hatColor: '#f59e0b',
        pantsColor: '#1e293b',
        shoeColor: '#ffffff',
        avatarStyle: 'streetwear',
        hatStyle: 'snapback',
        accessory: 'headphones',
      },
      {
        id: 'OUTFIT_FOG_ESSENTIALS',
        name: 'Áo Hoodie Fear of God Essentials Oversize',
        englishName: 'FOG Essentials Smoke Grey Hoodie',
        priceCoins: 160,
        expReward: 80,
        icon: '🧥',
        description: 'Streetwear tối giản tông xám khói cao cấp, phom rộng thời thượng (+80 EXP)',
        category: 'clothing',
        brand: 'Fear of God',
        outfitColor: '#64748b',
        hatColor: '#334155',
        pantsColor: '#0f172a',
        shoeColor: '#f8fafc',
        avatarStyle: 'hoodie',
        hatStyle: 'snapback',
        accessory: 'crossbody_bag',
      },
      {
        id: 'OUTFIT_BIKER_LEATHER',
        name: 'Áo Da Biker Rocker Punk & Kính Râm',
        englishName: 'Vintage Black Leather Biker Jacket',
        priceCoins: 240,
        expReward: 120,
        icon: '🕶️',
        description: 'Áo da thuộc đen bóng nạm đinh tán phong trần, kính râm gọng kim loại (+120 EXP)',
        category: 'clothing',
        brand: 'Saint Laurent',
        outfitColor: '#1e293b',
        hatColor: '#0f172a',
        pantsColor: '#0f172a',
        shoeColor: '#0f172a',
        avatarStyle: 'streetwear',
        hatStyle: 'none',
        accessory: 'sunglasses',
      },
      {
        id: 'OUTFIT_NIKE_TECH',
        name: 'Set Thể Thao Nike Tech Fleece Tracksuit',
        englishName: 'Nike Tech Fleece Athletic Tracksuit',
        priceCoins: 210,
        expReward: 110,
        icon: '⚡',
        description: 'Bộ nỉ thể thao ôm dáng co giãn, viền phản quang năng động dạo phố (+110 EXP)',
        category: 'clothing',
        brand: 'Nike Sportswear',
        outfitColor: '#0284c7',
        hatColor: '#0369a1',
        pantsColor: '#0f172a',
        shoeColor: '#38bdf8',
        avatarStyle: 'streetwear',
        hatStyle: 'snapback',
        accessory: 'headphones',
      },
      {
        id: 'OUTFIT_VINTAGE_DENIM',
        name: 'Áo Khoác Bò Vintage Denim Levi’s 1990s',
        englishName: 'Levi’s 1990s Washed Denim Jacket',
        priceCoins: 185,
        expReward: 95,
        icon: '👖',
        description: 'Chất liệu Jean bạc màu bụi bặm retro thập niên 90 kèm mũ len (+95 EXP)',
        category: 'clothing',
        brand: 'Levi’s Vintage',
        outfitColor: '#2563eb',
        hatColor: '#ea580c',
        pantsColor: '#1e293b',
        shoeColor: '#f59e0b',
        avatarStyle: 'streetwear',
        hatStyle: 'snapback',
        accessory: 'crossbody_bag',
      },
      {
        id: 'OUTFIT_Y2K_BABYTEE',
        name: 'Set Baby Tee Y2K & Chân Váy Tennis Hồng',
        englishName: 'Y2K Pastel Pink Baby Tee & Tennis Skirt',
        priceCoins: 195,
        expReward: 100,
        icon: '🌸',
        description: 'Phong cách Gen Z kẹo ngọt Y2K tông pastel với kính mắt mèo sành điệu (+100 EXP)',
        category: 'clothing',
        brand: 'Miu Miu Style',
        outfitColor: '#f472b6',
        hatColor: '#fbcfe8',
        pantsColor: '#ffffff',
        shoeColor: '#f472b6',
        avatarStyle: 'hoodie',
        hatStyle: 'cat_ears',
        accessory: 'crossbody_bag',
      },
      {
        id: 'OUTFIT_HARAJUKU_CAT',
        name: 'Áo Gió Tai Mèo Hồng Phát Sáng Harajuku',
        englishName: 'Harajuku Cat-Ears Neon Windbreaker',
        priceCoins: 230,
        expReward: 115,
        icon: '🐱',
        description: 'Áo khoác gió Tokyo đường phố kèm Mũ Tai Mèo LED phát sáng và túi đeo chéo (+115 EXP)',
        category: 'clothing',
        brand: 'Harajuku Lab',
        outfitColor: '#ec4899',
        hatColor: '#f472b6',
        pantsColor: '#f8fafc',
        shoeColor: '#ec4899',
        avatarStyle: 'hoodie',
        hatStyle: 'cat_ears',
        accessory: 'crossbody_bag',
      },
      {
        id: 'OUTFIT_OXFORD_GUITAR',
        name: 'Đồng Phục Nghệ Thuật Oxford & Guitar Gỗ',
        englishName: 'Oxford Arts Academy Blazer & Acoustic Guitar',
        priceCoins: 270,
        expReward: 140,
        icon: '🎸',
        description: 'Áo Blazer đỏ đô quý tộc kèm Đàn Guitar Acoustic gỗ đeo sau lưng cực lãng tử (+140 EXP)',
        category: 'clothing',
        brand: 'Oxford Heritage',
        outfitColor: '#991b1b',
        hatColor: '#facc15',
        pantsColor: '#1e293b',
        shoeColor: '#78350f',
        avatarStyle: 'suit',
        hatStyle: 'beret',
        accessory: 'guitar_back',
      },
      {
        id: 'OUTFIT_PARISIAN_TRENCH',
        name: 'Măng-tô Dạ Cashmere Paris & Mũ Nồi Beret',
        englishName: 'Parisian Cashmere Trench Coat & French Beret',
        priceCoins: 290,
        expReward: 145,
        icon: '🎨',
        description: 'Phong thái họa sĩ & thi sĩ sông Seine với áo dạ măng-tô xanh ngọc và mũ nồi Pháp (+145 EXP)',
        category: 'clothing',
        brand: 'Céline Paris',
        outfitColor: '#10b981',
        hatColor: '#047857',
        pantsColor: '#f5ebd6',
        shoeColor: '#78350f',
        avatarStyle: 'streetwear',
        hatStyle: 'beret',
        accessory: 'crossbody_bag',
      },
      {
        id: 'OUTFIT_BLAZER_ITALIAN',
        name: 'Blazer Lụa Kẻ Sọc Milano Old Money',
        englishName: 'Milano Silk Pinstripe Blazer Old Money',
        priceCoins: 340,
        expReward: 175,
        icon: '🍷',
        description: 'Gu thời trang giới thượng lưu Ý với chất liệu lụa dệt sọc chìm, kính râm quý phái (+175 EXP)',
        category: 'clothing',
        brand: 'Loro Piana Italy',
        outfitColor: '#334155',
        hatColor: '#475569',
        pantsColor: '#e2e8f0',
        shoeColor: '#1e293b',
        avatarStyle: 'suit',
        hatStyle: 'none',
        accessory: 'sunglasses',
      },
      {
        id: 'OUTFIT_ROYAL_SUIT',
        name: 'Bộ Vest Hoàng Gia Anh Savile Row May Đo',
        englishName: 'London Savile Row Bespoke Tuxedo',
        priceCoins: 390,
        expReward: 200,
        icon: '🤵',
        description: 'Vest dạ tiệc đen tuyền viền satin, nơ lụa quý tộc, kính đen và giày Oxford bóng bẩy (+200 EXP)',
        category: 'clothing',
        brand: 'Savile Row London',
        outfitColor: '#0f172a',
        hatColor: '#1e293b',
        pantsColor: '#0f172a',
        shoeColor: '#020617',
        avatarStyle: 'suit',
        hatStyle: 'beret',
        accessory: 'sunglasses',
      },
      {
        id: 'OUTFIT_HAUTE_COUTURE',
        name: 'Váy Dạ Hội Haute Couture Đính Đá & Vương Miện',
        englishName: 'Royal Haute Couture Evening Gown & Tiara',
        priceCoins: 460,
        expReward: 240,
        icon: '👑',
        description: 'Trang phục dạ hội đính đá pha lê lấp lánh, kèm Vương Miện Hoàng Gia tráng lệ (+240 EXP)',
        category: 'clothing',
        brand: 'Dior Couture',
        outfitColor: '#e11d48',
        hatColor: '#fbbf24',
        pantsColor: '#fda4af',
        shoeColor: '#e11d48',
        avatarStyle: 'royal',
        hatStyle: 'crown',
        accessory: 'sunglasses',
      },
      {
        id: 'OUTFIT_CYBERPUNK_NEON',
        name: 'Giáp Cơ Động Cyberpunk 2077 & Cánh Cơ Giới',
        englishName: 'Cyberpunk 2077 Neon Exosuit & Mech Wings',
        priceCoins: 520,
        expReward: 270,
        icon: '🦾',
        description: 'Bộ giáp công nghệ tương lai viền LED tím-xanh Neon kèm Đôi Cánh Cơ Giới xé gió (+270 EXP)',
        category: 'clothing',
        brand: 'Arasaka Corp',
        outfitColor: '#6366f1',
        hatColor: '#06b6d4',
        pantsColor: '#0f172a',
        shoeColor: '#06b6d4',
        avatarStyle: 'cyberpunk',
        hatStyle: 'snapback',
        accessory: 'cyber_wings',
      },
      {
        id: 'OUTFIT_CELESTIAL_ANGEL',
        name: 'Lễ Phục Thiên Thần Tuyết & Đôi Cánh Lông Vũ',
        englishName: 'Celestial Seraphim White Gown & Angel Wings',
        priceCoins: 580,
        expReward: 300,
        icon: '🪽',
        description: 'Áo choàng trắng tinh khôi thần thánh, Vòng Hào Quang vàng và Đôi Cánh Thiên Thần bay bổng (+300 EXP)',
        category: 'clothing',
        brand: 'Celestial Olympus',
        outfitColor: '#f8fafc',
        hatColor: '#fde047',
        pantsColor: '#f1f5f9',
        shoeColor: '#fbbf24',
        avatarStyle: 'royal',
        hatStyle: 'halo',
        accessory: 'angel_wings',
      },
      {
        id: 'OUTFIT_DRACULA_ROYAL',
        name: 'Áo Choàng Bá Tước Dracula Nhung Đỏ Đen',
        englishName: 'Transylvania Dracula Royal Velvet Cloak',
        priceCoins: 510,
        expReward: 260,
        icon: '🧛',
        description: 'Chất nhung tuyết đỏ thẫm phối cổ dựng đen huyền bí phong cách Gothic cổ điển châu Âu (+260 EXP)',
        category: 'clothing',
        brand: 'Gothic Castle',
        outfitColor: '#7f1d1d',
        hatColor: '#450a0a',
        pantsColor: '#0f172a',
        shoeColor: '#450a0a',
        avatarStyle: 'royal',
        hatStyle: 'crown',
        accessory: 'guitar_back',
      },
      {
        id: 'OUTFIT_GOLD_VIP',
        name: 'Hoàng Bào Long Vương & Vương Miện Hoàng Kim',
        englishName: 'Imperial Golden Dragon Robe & Royal Crown',
        priceCoins: 680,
        expReward: 360,
        icon: '👑',
        description: 'Lễ phục dát Vàng Hoàng Kim 24K quyền lực tối thượng, kèm Vương Miện đính Hồng Ngọc (+360 EXP)',
        category: 'clothing',
        brand: 'Imperial Palace',
        outfitColor: '#eab308',
        hatColor: '#facc15',
        pantsColor: '#1e293b',
        shoeColor: '#eab308',
        avatarStyle: 'royal',
        hatStyle: 'crown',
        accessory: 'angel_wings',
      },
    ],
    workScenarios: [
      {
        id: 'cloth_work_easy_1',
        difficulty: 'easy',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 33: Creating and building (Clothes)',
        customerName: 'Tourist Mia (Khách mua sắm)',
        customerAvatar: '👧🏼',
        customerOrderEn: '"Hi! I really love this pink jacket, but size S is too small for me. Do you have it in a larger size?"',
        contextHintVi: '[Độ khó: Dễ] Khách hỏi áo có cỡ lớn hơn không. Hãy chọn câu trả lời tư vấn chuẩn của nhân viên shop quần áo.',
        options: [
          'Yes, of course! Let me fetch a size M and L for you. The fitting room is right over there.',
          'No, we only sell hamburgers and pizza here.',
          'You should go to the fishing lake.',
          'Take off your shoes and run away.',
        ],
        correctAnswer:
          'Yes, of course! Let me fetch a size M and L for you. The fitting room is right over there.',
        explanationVi:
          '[Destination B1 - Unit 33] Nhân viên cửa hàng thời trang hỗ trợ lấy size M/L và chỉ dẫn khách tới "fitting room" (phòng thử đồ).',
        rewardCoins: 35,
        rewardExp: 25,
      },
      {
        id: 'cloth_work_easy_2',
        difficulty: 'easy',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 33: Confusable words (fit, suit, match)',
        customerName: 'Lady Diana (Khách hàng thanh lịch)',
        customerAvatar: '👩🏼‍💼',
        customerOrderEn: '"Look in the mirror! That red Oxford Blazer really _____ you — the color makes your face look so bright!"',
        contextHintVi: '[Độ khó: Dễ - Unit 33] Phân biệt 3 động từ "fit" (vừa kích cỡ), "suit" (hợp phong cách/màu sắc với ai) và "match" (2 món đồ hợp màu nhau).',
        options: ['suits', 'fits', 'matches', 'wears'],
        correctAnswer: 'suits',
        explanationVi:
          '[Destination B1 - Unit 33] Trong từ vựng thời trang: "suit someone" = hợp với dáng/màu da của ai; "fit someone" = vừa vặn về kích cỡ (size); "match something" = 2 món đồ (như cà vạt và áo) hợp tông màu với nhau.',
        rewardCoins: 40,
        rewardExp: 30,
      },
      {
        id: 'cloth_work_easy_3',
        difficulty: 'easy',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 15: Buying and selling (Sale & Bargain)',
        customerName: 'Student Noah (Sinh viên)',
        customerAvatar: '🧑🏻‍🎓',
        customerOrderEn: '"Are these hoodies on _____ today? I saw a 20% discount sign in the shop window!"',
        contextHintVi: '[Độ khó: Dễ - Unit 15] Cụm giới từ chỉ hàng hóa đang được "bán giảm giá / khuyến mãi" là gì?',
        options: ['sale', 'rent', 'debt', 'fee'],
        correctAnswer: 'sale',
        explanationVi:
          '[Destination B1 - Unit 15] Cụm từ "on sale" hoặc "in the sale" chỉ các mặt hàng đang được bán giảm giá khuyến mãi (kèm "discount" - mức giảm giá).',
        rewardCoins: 40,
        rewardExp: 30,
      },
      {
        id: 'cloth_work_med_1',
        difficulty: 'medium',
        questionType: 'essay_fill',
        unitSource: 'Destination B1 • Unit 33: Phrasal verbs (Clothes)',
        customerName: 'Shopper Lily (Tín đồ thời trang)',
        customerAvatar: '👩🏻‍🦱',
        customerOrderEn:
          'Khách muốn mặc thử chiếc áo khoác trước khi mua. Điền giới từ đúng vào cụm động từ:\n"Excuse me, where can I try _____ this jacket?"',
        contextHintVi: '[Độ khó: Trung bình - Unit 33] Cụm động từ "try + [giới từ]" nghĩa là "mặc thử quần áo" (2 chữ cái).',
        correctAnswer: 'on',
        acceptedAnswers: ['on'],
        explanationVi:
          '[Destination B1 - Unit 33] Phrasal verb "try on" (try something on) có nghĩa là mặc thử quần áo/giày dép xem có vừa không trước khi mua.',
        rewardCoins: 65,
        rewardExp: 45,
      },
      {
        id: 'cloth_work_med_2',
        difficulty: 'medium',
        questionType: 'essay_fill',
        unitSource: 'Destination B1 • Unit 33: Prepositional phrases (Fashion)',
        customerName: 'Model Bella (Người mẫu thời trang)',
        customerAvatar: '💃🏼',
        customerOrderEn:
          'Điền giới từ còn thiếu để tạo thành cụm từ có nghĩa là "đang hợp mốt / đang thịnh hành":\n"Neon streetwear jackets are really _____ fashion this winter!" (2 chữ cái)',
        contextHintVi: '[Độ khó: Trung bình - Unit 33] Cụm giới từ "___ fashion" (đang hợp thời trang), trái nghĩa với "out of fashion" (lỗi mốt).',
        correctAnswer: 'in',
        acceptedAnswers: ['in'],
        explanationVi:
          '[Destination B1 - Unit 33] Prepositional phrase: "in fashion" = đang hợp mốt, thịnh hành; ngược lại "out of fashion" = lỗi mốt.',
        rewardCoins: 70,
        rewardExp: 50,
      },
      {
        id: 'cloth_work_med_3',
        difficulty: 'medium',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 15: Buying and selling (Take back / Refund)',
        customerName: 'Mrs. Victoria (Khách đổi trả hàng)',
        customerAvatar: '👩🏼‍💼',
        customerOrderEn: '"I bought this shirt yesterday, but there is a small hole in the sleeve. I would like to take it back and get a full _____."',
        contextHintVi: '[Độ khó: Trung bình - Unit 15] Khi trả lại hàng bị lỗi (take something back), số tiền cửa hàng hoàn trả lại cho khách gọi là gì?',
        options: ['refund', 'charity', 'fortune', 'catalogue'],
        correctAnswer: 'refund',
        explanationVi:
          '[Destination B1 - Unit 15] Khi khách mang trả lại món đồ bị lỗi ("take it back to the shop"), số tiền hoàn lại gọi là "a refund" (tiền hoàn trả).',
        rewardCoins: 75,
        rewardExp: 55,
      },
      {
        id: 'cloth_work_hard_1',
        difficulty: 'hard',
        questionType: 'knowledge',
        unitSource: 'Destination B1 • Unit 33: Formal & casual clothes',
        customerName: 'Mr. Arthur (Giám đốc Ngân hàng)',
        customerAvatar: '🧔🏼‍♂️',
        customerOrderEn:
          '"I am attending a formal business conference at London World Bank tomorrow. Which of the following outfits is the most appropriate formal business attire?"',
        contextHintVi:
          '[Độ khó: Khó - Kiến thức Thời trang & Giao tiếp] Trang phục nào phù hợp nhất cho hội nghị kinh doanh trang trọng (formal business attire)?',
        options: [
          'A tailored suit with a dress shirt and tie',
          'Beach shorts and flip-flops',
          'Pajamas and a bathrobe',
          'A swimming wetsuit',
        ],
        correctAnswer: 'A tailored suit with a dress shirt and tie',
        explanationVi:
          '[Destination B1 - Unit 33] "A tailored suit with a dress shirt and tie" (Bộ vest may đo kèm áo sơ mi và cà vạt) là trang phục công sở trang trọng (formal business attire).',
        rewardCoins: 110,
        rewardExp: 80,
      },
      {
        id: 'cloth_work_hard_2',
        difficulty: 'hard',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 41: The causative (have something done)',
        customerName: 'Lord Henry (Quý tộc Anh)',
        customerAvatar: '🎩',
        customerOrderEn: '"The sleeves of this Royal Suit are slightly too long for me. Can I have them _____ by your tailor before tomorrow?"',
        contextHintVi: '[Độ khó: Khó - Unit 41] Cấu trúc nhờ vả/thuê người làm (The causative): "have + tân ngữ (vật) + V3/ed".',
        options: ['shortened', 'shorten', 'shortening', 'to shorten'],
        correctAnswer: 'shortened',
        explanationVi:
          '[Destination B1 - Unit 41] Cấu trúc The Causative: "have/get + something + V3/ed" ("have them shortened" = nhờ thợ may cắt ngắn tay áo lại giúp mình).',
        rewardCoins: 120,
        rewardExp: 90,
      },
      {
        id: 'cloth_work_hard_3',
        difficulty: 'hard',
        questionType: 'essay_fill',
        unitSource: 'Destination B1 • Unit 33: Creating and building (Materials)',
        customerName: 'Designer Coco (Nhà thiết kế)',
        customerAvatar: '👩🏻‍🎨',
        customerOrderEn:
          'Điền tên chất liệu vải tự nhiên thoáng mát làm từ cây bông (thường dùng may áo phông/sơ mi):\n"This summer shirt is made of 100% organic _____, so it is very soft and breathable." (6 chữ cái: c _ _ _ _ n)',
        contextHintVi: '[Độ khó: Khó - Unit 33] Từ vựng chỉ vải sợi bông trong tiếng Anh là gì? (c o t t o n)',
        correctAnswer: 'cotton',
        acceptedAnswers: ['cotton'],
        explanationVi:
          '[Destination B1 - Unit 33] Trong nhóm từ vựng chất liệu trang phục (Materials): "cotton" là vải bông, "silk" là lụa tơ tằm, "wool" là len lông cừu và "leather" là da thuộc.',
        rewardCoins: 125,
        rewardExp: 90,
      },
    ],
  },

  CAR_SHOWROOM: {
    id: 'CAR_SHOWROOM',
    title: '🚗 Kaia Luxury Auto Showroom',
    subtitle: 'Showroom Mua Bán Xe Cộ & Làm Chuyên Viên Tư Vấn Xe',
    icon: '🏎️',
    accentColor: '#0284c7',
    position: [-12, 0, -34],
    interactionRadius: 9.0,
    jobTitle: 'Chuyên Viên Tư Vấn & Kỹ Thuật Ô Tô',
    products: [
      {
        id: 'VEHICLE_SKATEBOARD',
        name: 'Ván Trượt Thể Thao Skateboard (Mặc định)',
        englishName: 'Street Pro Skateboard (Default)',
        priceCoins: 0,
        expReward: 0,
        icon: '🛹',
        description: 'Phương tiện lướt phố cơ bản được cấp sẵn miễn phí (Tốc độ: 14.5 m/s)',
        category: 'vehicle',
        brand: 'LifeAt Skate',
        vehicleType: 'skateboard',
        vehicleColor: '#f59e0b',
        speedBoost: 14.5,
      },
      {
        id: 'VEHICLE_HOVERBOARD_NEON',
        name: 'Ván Bay Đệm Từ MagLev Cyber Neon',
        englishName: 'Cyber MagLev Anti-Gravity Hoverboard',
        priceCoins: 380,
        expReward: 190,
        icon: '🛸',
        description: 'Ván bay phản trọng lực phát quang đèn LED Neon xanh ngọc tương lai (Tốc độ: 16.5 m/s • +190 EXP)',
        category: 'vehicle',
        brand: 'CyberTech Labs',
        vehicleType: 'hoverboard',
        vehicleColor: '#06b6d4',
        speedBoost: 16.5,
      },
      {
        id: 'VEHICLE_VESPA',
        name: 'Xe Tay Ga Vespa Primavera 150 Sean Wotherspoon',
        englishName: 'Italian Vintage Vespa Primavera 150',
        priceCoins: 580,
        expReward: 290,
        icon: '🛵',
        description: 'Thiết kế cổ điển Ý thanh lịch, yên da nâu thủ công dạo phố lãng mạn (Tốc độ: 17.5 m/s • +290 EXP)',
        category: 'vehicle',
        brand: 'Piaggio Italy',
        vehicleType: 'vespa',
        vehicleColor: '#fde047',
        speedBoost: 17.5,
      },
      {
        id: 'VEHICLE_HARLEY_FATBOY',
        name: 'Mô Tô Cơ Bắp Harley-Davidson Fat Boy 114',
        englishName: 'Harley-Davidson Fat Boy 114 Cruiser',
        priceCoins: 1450,
        expReward: 720,
        icon: '🏍️',
        description: 'Huyền thoại cơ bắp Mỹ với động cơ V-Twin gầm rú uy lực, ghi đông mạ chrome sáng bóng (Tốc độ: 19.5 m/s • +720 EXP)',
        category: 'vehicle',
        brand: 'Harley-Davidson USA',
        vehicleType: 'harley',
        vehicleColor: '#0f172a',
        speedBoost: 19.5,
      },
      {
        id: 'VEHICLE_BMW_S1000RR',
        name: 'Siêu Mô Tô BMW S1000RR M Sport',
        englishName: 'BMW S1000RR M Sport Superbike',
        priceCoins: 2200,
        expReward: 1100,
        icon: '🏍️',
        description: 'Cá mập Đức yếm khí động học xé gió, phuộc nhún vàng Ohlins và bô titan Akrapovic (Tốc độ: 22.0 m/s • +1100 EXP)',
        category: 'vehicle',
        brand: 'BMW Motorrad Germany',
        vehicleType: 'motorbike',
        vehicleColor: '#38bdf8',
        speedBoost: 22.0,
      },
      {
        id: 'VEHICLE_MOTORBIKE',
        name: 'Siêu Mô Tô Đua Ducati Panigale V4 S Corse',
        englishName: 'Ducati Panigale V4 S Corse Edition',
        priceCoins: 2900,
        expReward: 1450,
        icon: '🏍️',
        description: 'Siêu mô tô cỗ máy đỏ Borgo Panigale trang bị cánh gió carbon kép xé toạc làn gió (Tốc độ: 23.5 m/s • +1450 EXP)',
        category: 'vehicle',
        brand: 'Ducati Italy',
        vehicleType: 'motorbike',
        vehicleColor: '#dc2626',
        speedBoost: 23.5,
      },
      {
        id: 'VEHICLE_CYBERTRUCK',
        name: 'Siêu Bán Tải Bọc Thép Tesla Cybertruck Tri-Motor',
        englishName: 'Tesla Cybertruck Tri-Motor All-Wheel Drive',
        priceCoins: 3200,
        expReward: 1600,
        icon: '🚙',
        description: 'Chiến xa điện tương lai vỏ thép Cold-Rolled chống đạn, dải LED Horizon toàn dải cực ngầu (Tốc độ: 23.5 m/s • +1600 EXP)',
        category: 'vehicle',
        brand: 'Tesla USA',
        vehicleType: 'cybertruck',
        vehicleColor: '#94a3b8',
        speedBoost: 23.5,
      },
      {
        id: 'VEHICLE_MERCEDES_G63',
        name: 'Siêu SUV Mercedes-AMG G63 Brabus 800 V8 BiTurbo',
        englishName: 'Mercedes-AMG G63 Brabus 800 Widestar',
        priceCoins: 4600,
        expReward: 2300,
        icon: '🚙',
        description: 'Vua địa hình hộp vuông huyền thoại nước Đức, lưới tản nhiệt Panamericana và bô hông kép (Tốc độ: 23.0 m/s • +2300 EXP)',
        category: 'vehicle',
        brand: 'Mercedes-AMG Germany',
        vehicleType: 'gclass',
        vehicleColor: '#1e293b',
        speedBoost: 23.0,
      },
      {
        id: 'VEHICLE_PORSCHE_911',
        name: 'Siêu Xe Đua Porsche 911 GT3 RS Weissach Package',
        englishName: 'Porsche 911 GT3 RS Weissach Package',
        priceCoins: 5800,
        expReward: 2900,
        icon: '🏎️',
        description: 'Cỗ máy đường đua Stuttgart trang bị cánh gió carbon khổng lồ DRS và hốc gió khí động học (Tốc độ: 25.5 m/s • +2900 EXP)',
        category: 'vehicle',
        brand: 'Porsche Germany',
        vehicleType: 'sportscar',
        vehicleColor: '#ffffff',
        speedBoost: 25.5,
      },
      {
        id: 'VEHICLE_SPORTSCAR',
        name: 'Siêu Xe Mui Trần Ferrari SF90 Stradale Hybrid',
        englishName: 'Ferrari SF90 Spider Assetto Fiorano V8 Turbo',
        priceCoins: 7200,
        expReward: 3600,
        icon: '🏎️',
        description: 'Siêu xe mui trần biểu tượng ngựa chồm đỏ Rosso Corsa, 1.000 mã lực tăng tốc như tên bắn (Tốc độ: 26.5 m/s • +3600 EXP)',
        category: 'vehicle',
        brand: 'Ferrari Maranello Italy',
        vehicleType: 'sportscar',
        vehicleColor: '#ef4444',
        speedBoost: 26.5,
      },
      {
        id: 'VEHICLE_LAMBO_GOLD',
        name: 'Siêu Xe Thần Gió Lamborghini Revuelto V12 HPEV',
        englishName: 'Lamborghini Revuelto V12 Stealth Supercar',
        priceCoins: 8500,
        expReward: 4250,
        icon: '🏎️',
        description: 'Kiệt tác siêu xe bò tót cửa cắt kéo Scissor Doors, thiết kế tàng hình tàng hình Stealth Fighter V12 (Tốc độ: 27.5 m/s • +4250 EXP)',
        category: 'vehicle',
        brand: 'Lamborghini Italy',
        vehicleType: 'sportscar',
        vehicleColor: '#eab308',
        speedBoost: 27.5,
      },
      {
        id: 'VEHICLE_ROLLS_ROYCE',
        name: 'Xe Siêu Sang Rolls-Royce Phantom VIII Extended Limousine',
        englishName: 'Rolls-Royce Phantom VIII Extended Bespoke',
        priceCoins: 9900,
        expReward: 5000,
        icon: '👑',
        description: 'Đỉnh cao xa xỉ thế giới: Lưới tản nhiệt đền Pantheon mạ chrome, Nữ thần Spirit of Ecstasy lấp lánh (Tốc độ: 24.0 m/s • +5000 EXP)',
        category: 'vehicle',
        brand: 'Rolls-Royce Goodwood England',
        vehicleType: 'rollsroyce',
        vehicleColor: '#020617',
        speedBoost: 24.0,
      },
    ],
    workScenarios: [
      {
        id: 'car_work_easy_1',
        difficulty: 'easy',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 9: Coming and going (Transport)',
        customerName: 'Biker Max (Khách mua xe)',
        customerAvatar: '🕶️',
        customerOrderEn: '"Hello! This red Convertible Supercar looks amazing! Can I take it for a test drive?"',
        contextHintVi: '[Độ khó: Dễ] Khách muốn "lái thử xe" (test drive). Chọn câu trả lời chuyên nghiệp của nhân viên Showroom.',
        options: [
          "Absolutely! Please show me your driver's license, and we can start the test drive right away.",
          'No, this car is made of chocolate.',
          'Please swim across the lake first.',
          'We only sell library books here.',
        ],
        correctAnswer:
          "Absolutely! Please show me your driver's license, and we can start the test drive right away.",
        explanationVi:
          '[Destination B1 - Unit 9] Khi khách yêu cầu "test drive" (lái thử xe), nhân viên kiểm tra "driver\'s license" (bằng lái xe) và mời khách trải nghiệm ngay.',
        rewardCoins: 35,
        rewardExp: 25,
      },
      {
        id: 'car_work_easy_2',
        difficulty: 'easy',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 9: Phrasal verbs (get in / get on)',
        customerName: 'Lady Rose (Khách xem xe)',
        customerAvatar: '👩🏼‍💼',
        customerOrderEn: '"The door of the Ferrari GT is open! May I get _____ the car to test how comfortable the leather seats are?"',
        contextHintVi: '[Độ khó: Dễ - Unit 9] Phân biệt "get in / out of" (xe hơi, taxi) và "get on / off" (xe buýt, tàu hỏa, máy bay, xe máy).',
        options: ['in', 'on', 'up', 'off'],
        correctAnswer: 'in',
        explanationVi:
          '[Destination B1 - Unit 9] Với xe ô tô con hoặc taxi (a car / a taxi), ta dùng cụm động từ "get in" (bước vào xe) và "get out of" (bước ra khỏi xe). Còn với bus, train, plane, motorbike hay bike thì dùng "get on / get off".',
        rewardCoins: 40,
        rewardExp: 30,
      },
      {
        id: 'car_work_easy_3',
        difficulty: 'easy',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 9: Prepositional phrases (by car / on foot)',
        customerName: 'Mr. Kevin (Kỹ sư công nghệ)',
        customerAvatar: '👨🏻‍💻',
        customerOrderEn: '"I live in the Northern Residential District. It takes me 20 minutes to walk _____ foot, so I want to buy a Vespa scooter to commute faster!"',
        contextHintVi: '[Độ khó: Dễ - Unit 9] Cụm giới từ chỉ việc "đi bộ" trong tiếng Anh là "___ foot".',
        options: ['on', 'by', 'in', 'with'],
        correctAnswer: 'on',
        explanationVi:
          '[Destination B1 - Unit 9] Trong các cụm giới từ chỉ phương tiện di chuyển: Ta luôn nói "on foot" (đi bộ), nhưng dùng "by + phương tiện" như "by car", "by bus", "by motorbike".',
        rewardCoins: 40,
        rewardExp: 30,
      },
      {
        id: 'car_work_med_1',
        difficulty: 'medium',
        questionType: 'essay_fill',
        unitSource: 'Destination B1 • Unit 9: Road safety & transport',
        customerName: 'Officer Dan (Cảnh sát giao thông)',
        customerAvatar: '👮🏻‍♂️',
        customerOrderEn:
          'Điền từ tiếng Anh chỉ bộ phận an toàn bắt buộc phải thắt khi ngồi trên xe ô tô:\n"For your safety, please fasten your _____ belt before driving."',
        contextHintVi: '[Độ khó: Trung bình - Tự luận] Dây an toàn trên ô tô là "_____ belt" (4 chữ cái, nghĩa là ghế ngồi).',
        correctAnswer: 'seat',
        acceptedAnswers: ['seat', 'safety'],
        explanationVi:
          '[Destination B1 - Unit 9] "Fasten your seat belt" (Thắt dây an toàn) là cụm từ bắt buộc khi tham gia giao thông bằng ô tô.',
        rewardCoins: 65,
        rewardExp: 45,
      },
      {
        id: 'car_work_med_2',
        difficulty: 'medium',
        questionType: 'essay_fill',
        unitSource: 'Destination B1 • Unit 9: Phrasal verbs (slow down / speed up)',
        customerName: 'Instructor Paul (Giáo viên dạy lái xe)',
        customerAvatar: '👨🏼‍✈️',
        customerOrderEn:
          'Khi đến gần khu vực trường học và ngã tư đông người, tài xế cần giảm tốc độ. Điền từ còn thiếu vào cụm động từ:\n"You are driving too fast near the plaza! Please slow _____ immediately!" (4 chữ cái)',
        contextHintVi: '[Độ khó: Trung bình - Unit 9] Cụm động từ "slow ___" = giảm tốc độ (trái nghĩa với "speed up" = tăng tốc).',
        correctAnswer: 'down',
        acceptedAnswers: ['down'],
        explanationVi:
          '[Destination B1 - Unit 9] Phrasal verb "slow down" có nghĩa là giảm tốc độ (chạy chậm lại), trái nghĩa với "speed up" (tăng tốc).',
        rewardCoins: 70,
        rewardExp: 50,
      },
      {
        id: 'car_work_med_3',
        difficulty: 'medium',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 18: Inventions and discoveries (Phrasal verbs)',
        customerName: 'Mr. Thomas (Khách bảo dưỡng xe)',
        customerAvatar: '🧔🏻',
        customerOrderEn: '"Oh no! My motorbike suddenly stopped on the highway because the engine _____ down. Can your mechanics fix it?"',
        contextHintVi: '[Độ khó: Trung bình - Unit 18] Cụm động từ nào diễn tả xe cộ hoặc máy móc "bị hỏng / chết máy giữa đường"?',
        options: ['broke', 'turned', 'carried', 'came'],
        correctAnswer: 'broke',
        explanationVi:
          '[Destination B1 - Unit 18] Phrasal verb "break down" (quá khứ: "broke down") dùng khi xe cộ, động cơ hoặc máy móc ngừng hoạt động do bị hỏng hóc.',
        rewardCoins: 75,
        rewardExp: 55,
      },
      {
        id: 'car_work_hard_1',
        difficulty: 'hard',
        questionType: 'knowledge',
        unitSource: 'Destination B1 • Unit 18 & 36: Technology & Environment',
        customerName: 'CEO Elon (Nhà đầu tư Công nghệ)',
        customerAvatar: '🧑🏻‍💻',
        customerOrderEn:
          '"I want to buy an eco-friendly vehicle that produces zero exhaust emissions and runs entirely on battery power. What type of vehicle should you recommend?"',
        contextHintVi:
          '[Độ khó: Khó - Kiến thức Công nghệ Ô tô] Loại phương tiện nào thân thiện môi trường, không xả khí thải và chạy hoàn toàn bằng năng lượng pin?',
        options: [
          'An Electric Vehicle (EV)',
          'A Coal-Powered Steam Train',
          'A Diesel Heavy Truck',
          'A Gasoline Muscle Car',
        ],
        correctAnswer: 'An Electric Vehicle (EV)',
        explanationVi:
          '[Destination B1 - Unit 18 & 36] Electric Vehicle (EV - Xe điện) chạy bằng năng lượng pin điện (battery power) và không tạo ra khí thải ống xả (zero exhaust emissions).',
        rewardCoins: 110,
        rewardExp: 80,
      },
      {
        id: 'car_work_hard_2',
        difficulty: 'hard',
        questionType: 'multiple_choice',
        unitSource: 'Destination B1 • Unit 41: The causative (have/get something done)',
        customerName: 'Captain Sterling (Chủ siêu xe)',
        customerAvatar: '🤵🏼‍♂️',
        customerOrderEn: '"Before driving my Ferrari GT on a long road trip, I always have the brakes and engine _____ by a professional mechanic."',
        contextHintVi: '[Độ khó: Khó - Unit 41] Cấu trúc nhờ thợ chuyên nghiệp kiểm tra/bảo dưỡng xe: "have + tân ngữ (vật) + V3/ed".',
        options: ['checked', 'check', 'checking', 'to check'],
        correctAnswer: 'checked',
        explanationVi:
          '[Destination B1 - Unit 41] Cấu trúc The Causative: "have + something + V3/ed" ("have the brakes and engine checked" = đưa xe cho thợ máy chuyên nghiệp kiểm tra phanh và động cơ).',
        rewardCoins: 120,
        rewardExp: 90,
      },
      {
        id: 'car_work_hard_3',
        difficulty: 'hard',
        questionType: 'essay_fill',
        unitSource: 'Destination B1 • Unit 15 & 27: Buying, selling & contracts',
        customerName: 'Ms. Evelyn (Giám đốc Tài chính)',
        customerAvatar: '👩🏻‍💼',
        customerOrderEn:
          'Khách hỏi chiếc siêu xe trị giá 550 xu có quá đắt vượt khả năng chi trả không. Điền động từ tiếng Anh theo sau "can/cannot" có nghĩa là "đủ khả năng tài chính để mua":\n"550 coins is quite expensive! I need to save more money before I can _____ to buy this Supercar." (6 chữ cái: a _ _ _ _ d)',
        contextHintVi: '[Độ khó: Khó - Unit 15] Cấu trúc "can/cannot _____ to do something" = đủ/không đủ tiền mua thứ gì (a f f o r d).',
        correctAnswer: 'afford',
        acceptedAnswers: ['afford'],
        explanationVi:
          '[Destination B1 - Unit 15] Động từ "afford" (thường đi với "can / could / be able to afford + Noun / to V") có nghĩa là có đủ khả năng tài chính để mua hoặc chi trả cho thứ gì đó.',
        rewardCoins: 125,
        rewardExp: 90,
      },
    ],
  },
};

// Tự động bổ sung kho câu hỏi Đa Nguồn (Cambridge, Oxford 3000, IELTS, TOEIC, British Council, Destination B1/B2)
// vào danh sách khách hàng NPC của cả 4 Quán để làm việc không bao giờ bị trùng lặp câu hỏi
const SHOP_CUSTOMER_PROFILES = [
  { name: 'Mr. Oliver (Khách Quốc Tế)', avatar: '🧑🏼‍💼' },
  { name: 'Ms. Charlotte (Du Khách Anh)', avatar: '👩🏼‍🎓' },
  { name: 'Dr. William (Giáo Sư Oxford)', avatar: '👨🏻‍🏫' },
  { name: 'Lady Amelia (Khách VIP)', avatar: '💃🏼' },
  { name: 'CEO Benjamin (Doanh Nhân)', avatar: '🤵🏻‍♂️' },
  { name: 'Tourist Chloe (Blogger Du Lịch)', avatar: '📸' },
];

(Object.keys(CITY_SHOPS_DATA) as ShopVenueId[]).forEach((venueId) => {
  const extraWorkScenarios: WorkCustomerScenario[] = MULTI_SOURCE_ENGLISH_BANK.map(
    (item, idx) => {
      const cust = SHOP_CUSTOMER_PROFILES[idx % SHOP_CUSTOMER_PROFILES.length];
      const sourceMeta = ENGLISH_DATABASE_SOURCES[item.sourceId];
      return {
        id: `${venueId.toLowerCase()}_ms_${item.id}`,
        difficulty: item.difficulty,
        questionType: item.questionType,
        unitSource: `${sourceMeta.shortBadge} • ${item.unitOrTopic}`,
        customerName: cust.name,
        customerAvatar: cust.avatar,
        customerOrderEn: item.promptEn,
        contextHintVi: item.hintVi,
        options: item.options,
        correctAnswer: item.correctAnswer,
        acceptedAnswers: item.acceptedAnswers,
        explanationVi: item.explanationVi,
        rewardCoins:
          item.difficulty === 'hard' ? 115 : item.difficulty === 'medium' ? 70 : 40,
        rewardExp:
          item.difficulty === 'hard' ? 85 : item.difficulty === 'medium' ? 50 : 30,
      };
    }
  );
  CITY_SHOPS_DATA[venueId].workScenarios.push(...extraWorkScenarios);
});

// ============================================================================
// 4. DỮ LIỆU GIAO TIẾP TIẾNG ANH CÙNG CƯ DÂN & NPC TRÊN ĐƯỜNG PHỐ (PHÍM [E])
// Kết hợp trực tiếp với Cơ Sở Dữ Liệu Tiếng Anh Đa Nguồn (6 nguồn quốc tế + MongoDB API)
// ============================================================================
export interface StreetNpcScenario {
  id: string;
  sourceId?: EnglishDatabaseSourceId;
  cefr?: string;
  questionType: 'multiple_choice' | 'essay_fill';
  unitSource: string;
  npcSpeechEn: string;
  contextHintVi: string;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanationVi: string;
  rewardCoins: number;
  rewardExp: number;
}

export interface StreetNpcProfile {
  id: string;
  name: string;
  role: string;
  avatarEmoji: string;
  accentColor: string;
  locationLabel: string;
  preferredCategories?: MultiSourceEnglishItem['category'][];
  scenarios: StreetNpcScenario[];
}

export function convertMultiSourceItemToNpcScenario(
  item: MultiSourceEnglishItem
): StreetNpcScenario {
  const sourceMeta = ENGLISH_DATABASE_SOURCES[item.sourceId];
  return {
    id: item.id,
    sourceId: item.sourceId,
    cefr: item.cefr,
    questionType: item.questionType,
    unitSource: `${sourceMeta ? sourceMeta.shortBadge : '📘 English DB'} • ${item.unitOrTopic}`,
    npcSpeechEn: item.promptEn,
    contextHintVi: item.hintVi,
    options: item.options,
    correctAnswer: item.correctAnswer,
    acceptedAnswers: item.acceptedAnswers,
    explanationVi: item.explanationVi,
    rewardCoins: item.rewardCoins,
    rewardExp: item.rewardExp,
  };
}

function buildNpcScenariosWithMultiSource(
  personalScenarios: StreetNpcScenario[],
  preferredCategories: MultiSourceEnglishItem['category'][]
): StreetNpcScenario[] {
  // Ưu tiên các câu trong kho đa nguồn khớp chủ đề NPC trước, sau đó mở rộng sang toàn bộ kho đa nguồn
  const matchingItems = MULTI_SOURCE_ENGLISH_BANK.filter((item) =>
    preferredCategories.includes(item.category)
  ).map(convertMultiSourceItemToNpcScenario);

  const otherItems = MULTI_SOURCE_ENGLISH_BANK.filter(
    (item) => !preferredCategories.includes(item.category)
  ).map(convertMultiSourceItemToNpcScenario);

  return [...personalScenarios, ...matchingItems, ...otherItems];
}

export const STREET_NPCS_DIALOGUE_DATA: Record<string, StreetNpcProfile> = {
  CITIZEN_SOPHIA: {
    id: 'CITIZEN_SOPHIA',
    name: 'Sophia',
    role: 'Student B1 • Đại Lộ Học Viện',
    avatarEmoji: '👩🏻‍🎓',
    accentColor: '#f472b6',
    locationLabel: 'Đại lộ Trung tâm — Khu Học Viện',
    preferredCategories: ['study_academy', 'daily_social', 'culture_knowledge'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'sophia_1',
          sourceId: 'DESTINATION_B1_B2',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📘 Destination B1 • Unit 6: Learning and doing (Vocabulary)',
          npcSpeechEn:
            '"Hi there! I am on my way to the English Academy. Tomorrow we have an important test, so I really need to _____ for my exam tonight!"',
          contextHintVi:
            'Chọn động từ chuẩn trong Unit 6 có nghĩa là "ôn tập bài vở chuẩn bị cho kỳ thi" (đi với giới từ "for").',
          options: ['revise', 'remind', 'memorise', 'learn'],
          correctAnswer: 'revise',
          explanationVi:
            '[Destination B1 - Unit 6] Động từ "revise (for an exam/test)" có nghĩa là ôn tập lại kiến thức trước kỳ thi.',
          rewardCoins: 35,
          rewardExp: 40,
        },
        {
          id: 'sophia_2',
          sourceId: 'DESTINATION_B1_B2',
          cefr: 'B1',
          questionType: 'essay_fill',
          unitSource: '📘 Destination B1 • Unit 6: Learning and doing (Phrasal verbs)',
          npcSpeechEn:
            '"If you do not know the meaning of a new English word in Destination B1, you can _____ it up in a dictionary!" (4 chữ cái: l _ _ k)',
          contextHintVi: 'Cụm động từ "___ up a word in a dictionary" = tra từ điển (l o o k).',
          correctAnswer: 'look',
          acceptedAnswers: ['look'],
          explanationVi:
            '[Destination B1 - Unit 6] Phrasal verb "look up (something)" có nghĩa là tra cứu thông tin hoặc từ vựng trong từ điển.',
          rewardCoins: 45,
          rewardExp: 50,
        },
      ],
      ['study_academy', 'daily_social', 'culture_knowledge']
    ),
  },
  CITIZEN_LIAM: {
    id: 'CITIZEN_LIAM',
    name: 'Liam',
    role: 'London Tourist • Du Khách Quốc Tế',
    avatarEmoji: '🧳',
    accentColor: '#38bdf8',
    locationLabel: 'Quảng Trường & Phố Ẩm Thực',
    preferredCategories: ['travel_tourism', 'culture_knowledge', 'daily_social'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'liam_1',
          sourceId: 'DESTINATION_B1_B2',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📘 Destination B1 • Unit 9: Coming and going (Prepositions)',
          npcSpeechEn:
            '"Excuse me! I have just arrived _____ this beautiful city from London. Could you tell me how to get to the London Focus Cafe?"',
          contextHintVi:
            'Động từ "arrive" đi với giới từ nào khi đến một thành phố, quốc gia hoặc khu vực rộng lớn?',
          options: ['in', 'at', 'to', 'on'],
          correctAnswer: 'in',
          explanationVi:
            '[Destination B1 - Unit 9] Ta dùng "arrive in" + thành phố/đất nước lớn (arrive in London / arrive in this city), và "arrive at" + địa điểm cụ thể (arrive at the station/hotel).',
          rewardCoins: 35,
          rewardExp: 40,
        },
        {
          id: 'liam_2',
          sourceId: 'CAMBRIDGE_GRAMMAR',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📗 Cambridge Grammar • Unit 50: Indirect questions (Polite directions)',
          npcSpeechEn:
            '"I love walking around the square! By the way, could you tell me where _____?"',
          contextHintVi:
            'Trong câu hỏi gián tiếp lịch sự "Could you tell me where...", trật tự từ theo sau là S + V (không đảo ngữ).',
          options: [
            'the nearest bus stop is',
            'is the nearest bus stop',
            'does the nearest bus stop',
            'be the nearest bus stop',
          ],
          correctAnswer: 'the nearest bus stop is',
          explanationVi:
            '[Cambridge Grammar in Use - Unit 50] Trong câu hỏi gián tiếp (Indirect question): "Could you tell me + từ để hỏi + Chủ ngữ + Động từ" ("where the nearest bus stop is").',
          rewardCoins: 45,
          rewardExp: 50,
        },
      ],
      ['travel_tourism', 'culture_knowledge', 'daily_social']
    ),
  },
  CITIZEN_OLIVIA: {
    id: 'CITIZEN_OLIVIA',
    name: 'Olivia',
    role: 'IELTS 7.5 Tutor • Cố Vấn Ngữ Pháp',
    avatarEmoji: '👩🏼‍🏫',
    accentColor: '#34d399',
    locationLabel: 'Vòng xoay Quảng Trường Trung Tâm',
    preferredCategories: ['study_academy', 'cafe_diner', 'shopping_fashion'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'olivia_1',
          sourceId: 'DESTINATION_B1_B2',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📘 Destination B1 • Unit 12: Friends and relations (Phrasal verbs)',
          npcSpeechEn:
            '"Hello! Practising English with neighbours every day is wonderful. Do you _____ on well with the other players in this neighbourhood?"',
          contextHintVi:
            'Cụm động từ "___ on (well) with somebody" trong Unit 12 có nghĩa là hòa đồng, có mối quan hệ tốt với ai.',
          options: ['get', 'take', 'keep', 'go'],
          correctAnswer: 'get',
          explanationVi:
            '[Destination B1 - Unit 12] Phrasal verb "get on (well) with somebody" có nghĩa là hòa thuận, hợp tính với ai đó.',
          rewardCoins: 40,
          rewardExp: 45,
        },
        {
          id: 'olivia_2',
          sourceId: 'DESTINATION_B1_B2',
          cefr: 'B1',
          questionType: 'essay_fill',
          unitSource: '📘 Destination B1 • Unit 6: Word patterns (capable / fond / keen)',
          npcSpeechEn:
            '"You are making great progress in English! I am sure you are _____ of passing the B1 exam with flying colours!" (7 chữ cái, đi với giới từ "of": c _ _ _ _ _ e)',
          contextHintVi: 'Cấu trúc "be _____ of + V-ing" = có năng lực, có khả năng làm gì (c a p a b l e).',
          correctAnswer: 'capable',
          acceptedAnswers: ['capable'],
          explanationVi:
            '[Destination B1 - Unit 6] Word pattern: "be capable of (doing) something" = có khả năng, năng lực làm việc gì đó.',
          rewardCoins: 55,
          rewardExp: 60,
        },
      ],
      ['study_academy', 'cafe_diner', 'shopping_fashion']
    ),
  },
  CITIZEN_NOAH: {
    id: 'CITIZEN_NOAH',
    name: 'Noah',
    role: 'Street Musician • Nghệ Sĩ Đường Phố',
    avatarEmoji: '🎸',
    accentColor: '#a855f7',
    locationLabel: 'Phố Thương Mại & Rạp Phim',
    preferredCategories: ['entertainment_cinema', 'study_academy', 'culture_knowledge'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'noah_1',
          sourceId: 'DESTINATION_B1_B2',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📘 Destination B1 • Unit 24: Entertainment (Vocabulary & Phrasal verbs)',
          npcSpeechEn:
            '"Hey friend! I am playing acoustic guitar in the street tonight. Many people stop to listen because live music really _____ them up after a long day!"',
          contextHintVi:
            'Cụm động từ "_____ somebody up" có nghĩa là làm ai đó vui vẻ, phấn chấn lên.',
          options: ['cheers', 'brings', 'makes', 'turns'],
          correctAnswer: 'cheers',
          explanationVi:
            '[Destination B1 - Unit 24 & 39] Phrasal verb "cheer (somebody) up" có nghĩa là làm cho ai đó trở nên vui vẻ, yêu đời hơn.',
          rewardCoins: 40,
          rewardExp: 45,
        },
        {
          id: 'noah_2',
          sourceId: 'DESTINATION_B1_B2',
          cefr: 'B1',
          questionType: 'essay_fill',
          unitSource: '📘 Destination B1 • Unit 3: Fun and games (Word patterns)',
          npcSpeechEn:
            '"Are you _____ on listening to British pop and rock music while strolling around the city?" (4 chữ cái, đi với giới từ "on": k _ _ n)',
          contextHintVi: 'Cụm tính từ "be _____ on + V-ing / Noun" = yêu thích, say mê thứ gì (k e e n).',
          correctAnswer: 'keen',
          acceptedAnswers: ['keen'],
          explanationVi:
            '[Destination B1 - Unit 3] Word pattern: "be keen on (doing) something" = rất thích, hào hứng với điều gì.',
          rewardCoins: 45,
          rewardExp: 50,
        },
      ],
      ['entertainment_cinema', 'study_academy', 'culture_knowledge']
    ),
  },
  CITIZEN_CHLOE: {
    id: 'CITIZEN_CHLOE',
    name: 'Chloe',
    role: 'Movie & Book Lover • Thư Viện & Rạp Phim',
    avatarEmoji: '🎬',
    accentColor: '#fb7185',
    locationLabel: 'Khu Rạp Phim IMAX & Thư Viện',
    preferredCategories: ['entertainment_cinema', 'shopping_fashion', 'culture_knowledge'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'chloe_1',
          sourceId: 'CAMBRIDGE_GRAMMAR',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📗 Cambridge Grammar • Unit 9: Present Perfect Continuous',
          npcSpeechEn:
            '"Good day! I _____ this Sherlock Holmes novel in the park for two hours, and the mystery is getting so exciting!"',
          contextHintVi:
            'Hành động bắt đầu trong quá khứ và kéo dài liên tục suốt 2 tiếng đến hiện tại ("for two hours").',
          options: ['have been reading', 'am reading', 'read', 'was reading'],
          correctAnswer: 'have been reading',
          explanationVi:
            '[Cambridge Grammar in Use - Unit 9] Thì Hiện tại hoàn thành tiếp diễn (have/has been + V-ing) nhấn mạnh hành động kéo dài liên tục từ quá khứ đến hiện tại (đi kèm "for two hours").',
          rewardCoins: 40,
          rewardExp: 45,
        },
      ],
      ['entertainment_cinema', 'shopping_fashion', 'culture_knowledge']
    ),
  },
  CITIZEN_LUCAS: {
    id: 'CITIZEN_LUCAS',
    name: 'Lucas',
    role: 'Skateboarder & Camper • Vận Động Viên',
    avatarEmoji: '🛹',
    accentColor: '#fbbf24',
    locationLabel: 'Hồ Câu Cá & Khu Cắm Trại',
    preferredCategories: ['nature_fishing', 'auto_transport', 'daily_social'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'lucas_1',
          sourceId: 'DESTINATION_B1_B2',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📘 Destination B1 • Unit 3: Fun and games (Sports vocabulary)',
          npcSpeechEn:
            '"Yo! Hold Shift to ride your skateboard fast! Do you want to _____ part in our weekend skateboarding competition around the city?"',
          contextHintVi:
            'Cụm từ cố định (collocation) "_____ part in" trong Unit 3 có nghĩa là tham gia vào một hoạt động/cuộc thi.',
          options: ['take', 'make', 'do', 'have'],
          correctAnswer: 'take',
          explanationVi:
            '[Destination B1 - Unit 3] Collocation: "take part in (something)" = "participate in" (tham gia vào cuộc thi hoặc sự kiện).',
          rewardCoins: 35,
          rewardExp: 40,
        },
      ],
      ['nature_fishing', 'auto_transport', 'daily_social']
    ),
  },
  CITIZEN_DAVID: {
    id: 'CITIZEN_DAVID',
    name: 'Dr. David',
    role: 'Oxford Lecturer & Banker • C1',
    avatarEmoji: '👨🏻‍🏫',
    accentColor: '#22d3ee',
    locationLabel: 'Đại Lộ Cao Ốc Tài Chính Downtown',
    preferredCategories: ['business_downtown', 'study_academy', 'culture_knowledge'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'david_1',
          sourceId: 'CAMBRIDGE_GRAMMAR',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📗 Cambridge Grammar • Unit 38: Conditionals (Second Conditional)',
          npcSpeechEn:
            '"Good day, young scholar! If you _____ 15 minutes of English vocabulary every day, your fluency would improve remarkably."',
          contextHintVi:
            'Câu điều kiện loại 2 (If + S + V2/ed, S + would + V) diễn tả lời khuyên hoặc giả định ở hiện tại.',
          options: ['practised', 'practise', 'will practise', 'have practised'],
          correctAnswer: 'practised',
          explanationVi:
            '[Cambridge Grammar in Use - Unit 38] Trong câu điều kiện loại 2 (Second Conditional), mệnh đề If chia ở thì Quá khứ đơn ("practised") và mệnh đề chính dùng "would + V" ("would improve").',
          rewardCoins: 45,
          rewardExp: 55,
        },
      ],
      ['business_downtown', 'study_academy', 'culture_knowledge']
    ),
  },
  CITIZEN_HANNAH: {
    id: 'CITIZEN_HANNAH',
    name: 'Hannah',
    role: 'Photographer • Nhiếp Ảnh Gia Đường Phố',
    avatarEmoji: '📸',
    accentColor: '#f59e0b',
    locationLabel: 'Đại Lộ Dân Cư Phía Bắc',
    preferredCategories: ['daily_social', 'shopping_fashion', 'travel_tourism'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'hannah_1',
          sourceId: 'CAMBRIDGE_GRAMMAR',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📗 Cambridge Grammar • Unit 41: Wishes (wish + Past Simple)',
          npcSpeechEn:
            '"Look at the golden sunlight over the city rooftops! I love taking street photos, and I wish I _____ a wider camera lens with me right now."',
          contextHintVi:
            'Cấu trúc "wish + S + V2/ed" diễn tả mong ước một điều khác với thực tế ở hiện tại.',
          options: ['had', 'have', 'will have', 'am having'],
          correctAnswer: 'had',
          explanationVi:
            '[Cambridge Grammar in Use - Unit 41] Cấu trúc "wish + Quá khứ đơn (had)" dùng để diễn tả điều ước ở hiện tại ("right now").',
          rewardCoins: 40,
          rewardExp: 50,
        },
      ],
      ['daily_social', 'shopping_fashion', 'travel_tourism']
    ),
  },
  NPC_EMMA_LONDON_CAFE: {
    id: 'NPC_EMMA_LONDON_CAFE',
    name: 'Emma',
    role: 'Barista A2 • London Focus Cafe',
    avatarEmoji: '☕',
    accentColor: '#38bdf8',
    locationLabel: 'Trước cửa London Focus Cafe',
    preferredCategories: ['cafe_diner', 'daily_social', 'travel_tourism'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'emma_1',
          sourceId: 'BRITISH_COUNCIL_CULTURE',
          cefr: 'A2',
          questionType: 'multiple_choice',
          unitSource: '🌍 British Council • Unit 19: Modals (Polite requests)',
          npcSpeechEn:
            '"Good day! Welcome to the London Focus Cafe patio. What _____ you like to order before stepping inside our cafe?"',
          contextHintVi: 'Cấu trúc lịch sự khi mời hoặc hỏi đồ uống bằng tiếng Anh: "What _____ you like...?"',
          options: ['would', 'will', 'do', 'are'],
          correctAnswer: 'would',
          explanationVi:
            '[British Council Spoken English] Cấu trúc "What would you like + to V / Noun?" là mẫu câu giao tiếp lịch sự chuẩn mực tại quán cafe và nhà hàng.',
          rewardCoins: 35,
          rewardExp: 40,
        },
      ],
      ['cafe_diner', 'daily_social', 'travel_tourism']
    ),
  },
  NPC_ALEX_ACADEMY: {
    id: 'NPC_ALEX_ACADEMY',
    name: 'Prof. Alex',
    role: 'Grammar Master B1 • Học Viện Anh Ngữ',
    avatarEmoji: '🎓',
    accentColor: '#818cf8',
    locationLabel: 'Sân trước Học Viện Anh Ngữ',
    preferredCategories: ['study_academy', 'culture_knowledge', 'business_downtown'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'alex_1',
          sourceId: 'CAMBRIDGE_GRAMMAR',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📗 Cambridge Grammar • Unit 42: The Passive (Present & Past)',
          npcSpeechEn:
            '"Welcome to Oxford English Academy! Did you know that English _____ as an official language in over 50 countries around the world?"',
          contextHintVi: 'Chủ ngữ "English" chịu tác động nên động từ chia ở thể bị động Hiện tại đơn.',
          options: ['is spoken', 'speaks', 'has spoken', 'speaking'],
          correctAnswer: 'is spoken',
          explanationVi:
            '[Cambridge Grammar in Use - Unit 42] Thể bị động ở thì Hiện tại đơn: "am/is/are + V3/ed" ("English is spoken").',
          rewardCoins: 45,
          rewardExp: 55,
        },
      ],
      ['study_academy', 'culture_knowledge', 'business_downtown']
    ),
  },
  NPC_SARAH_LIBRARY: {
    id: 'NPC_SARAH_LIBRARY',
    name: 'Sarah',
    role: 'Head Librarian B2 • Thư Viện Oxford',
    avatarEmoji: '📚',
    accentColor: '#38bdf8',
    locationLabel: 'Trước sảnh Thư Viện Thành Phố',
    preferredCategories: ['study_academy', 'culture_knowledge', 'entertainment_cinema'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'sarah_1',
          sourceId: 'OXFORD_3000_VOCAB',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📙 Oxford 3000 • Library & Literature Vocabulary',
          npcSpeechEn:
            '"Welcome to the Oxford City Library! With your student card, you can _____ up to five English novels at a time for free."',
          contextHintVi: 'Phân biệt "borrow" (mượn sách từ thư viện) và "lend" (cho ai mượn).',
          options: ['borrow', 'lend', 'hire', 'pay'],
          correctAnswer: 'borrow',
          explanationVi:
            '[Oxford 3000 Vocabulary] "Borrow something from a library" có nghĩa là mượn sách từ thư viện về đọc.',
          rewardCoins: 45,
          rewardExp: 55,
        },
      ],
      ['study_academy', 'culture_knowledge', 'entertainment_cinema']
    ),
  },
  NPC_LUIGI_DINER: {
    id: 'NPC_LUIGI_DINER',
    name: 'Chef Luigi',
    role: 'Head Chef • Cozy Burger & Pizza',
    avatarEmoji: '👨‍🍳',
    accentColor: '#fb923c',
    locationLabel: 'Trước cửa Quán Ăn Cozy Burger & Pizza',
    preferredCategories: ['cafe_diner', 'daily_social', 'shopping_fashion'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'luigi_1',
          sourceId: 'DESTINATION_B1_B2',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📘 Destination B1 • Unit 30: Body and lifestyle (Food & cooking)',
          npcSpeechEn:
            '"Buongiorno! Our fresh Italian pizza dough is _____ in a traditional stone oven at high temperature until the crust is crispy!"',
          contextHintVi: 'Bánh mì, bánh ngọt và pizza được "nướng bằng lò" dùng động từ nào?',
          options: ['baked', 'boiled', 'fried', 'steamed'],
          correctAnswer: 'baked',
          explanationVi:
            '[Destination B1 - Unit 30] "Bake" (baked) là nướng bằng lò cho bánh mì, pizza, bánh ngọt; còn "boil" là luộc, "fry" là chiên/rán.',
          rewardCoins: 35,
          rewardExp: 40,
        },
      ],
      ['cafe_diner', 'daily_social', 'shopping_fashion']
    ),
  },
  NPC_LILY_GARDEN: {
    id: 'NPC_LILY_GARDEN',
    name: 'Lily',
    role: 'Daily Chat A1 • Công Viên Hoa Anh Đào',
    avatarEmoji: '🌸',
    accentColor: '#f472b6',
    locationLabel: 'Công Viên Hoa Anh Đào',
    preferredCategories: ['nature_fishing', 'daily_social', 'culture_knowledge'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'lily_1',
          sourceId: 'DESTINATION_B1_B2',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📘 Destination B1 • Unit 36: Nature and the universe',
          npcSpeechEn:
            '"Look how peaceful the cherry blossom park is! Let us sit _____ the shade of this big tree and practise English conversation."',
          contextHintVi: 'Cụm giới từ cố định trong Unit 36: ngồi "trong bóng râm" là "___ the shade".',
          options: ['in', 'on', 'at', 'to'],
          correctAnswer: 'in',
          explanationVi:
            '[Destination B1 - Unit 36] Cụm giới từ "in the shade (of a tree)" có nghĩa là ở trong bóng râm mát mẻ.',
          rewardCoins: 35,
          rewardExp: 40,
        },
      ],
      ['nature_fishing', 'daily_social', 'culture_knowledge']
    ),
  },
  NPC_CHARLIE_CINEMA: {
    id: 'NPC_CHARLIE_CINEMA',
    name: 'Charlie',
    role: 'Movie Buff A2 • Siêu Thị & Rạp Phim',
    avatarEmoji: '🎬',
    accentColor: '#c084fc',
    locationLabel: 'Sảnh ngoài Rạp Chiếu Phim Thành Phố',
    preferredCategories: ['entertainment_cinema', 'shopping_fashion', 'daily_social'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'charlie_1',
          sourceId: 'DESTINATION_B1_B2',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📘 Destination B1 • Unit 24: Entertainment (Cinema & Theatre)',
          npcSpeechEn:
            '"Hey movie lover! The new sci-fi adventure film is so popular that all tickets for tonight are completely sold _____!"',
          contextHintVi: 'Cụm tính từ/phrasal verb "sold _____" có nghĩa là đã bán hết sạch vé.',
          options: ['out', 'off', 'up', 'away'],
          correctAnswer: 'out',
          explanationVi:
            '[Destination B1 - Unit 24] Cụm từ "sold out" (sell out) có nghĩa là toàn bộ vé hoặc mặt hàng đã được bán hết sạch.',
          rewardCoins: 35,
          rewardExp: 40,
        },
      ],
      ['entertainment_cinema', 'shopping_fashion', 'daily_social']
    ),
  },
  NPC_FISHERMAN_JACK: {
    id: 'NPC_FISHERMAN_JACK',
    name: 'Capt. Jack',
    role: 'Fishing Guide • Bến Cảng Hồ Câu',
    avatarEmoji: '⚓',
    accentColor: '#34d399',
    locationLabel: 'Bến Cảng Gỗ Hồ Câu Cá',
    preferredCategories: ['nature_fishing', 'travel_tourism', 'daily_social'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'jack_1',
          sourceId: 'DESTINATION_B1_B2',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📘 Destination B1 • Unit 9 & 36: Weather & Nature',
          npcSpeechEn:
            '"Ahoy matey! Press [F] on the wooden pier to cast your fishing rod! The lake water is very _____ today, so the Golden Koi fish are biting fast!"',
          contextHintVi: 'Tính từ miêu tả mặt nước hồ hoặc biển "êm ả, phẳng lặng, không sóng lớn".',
          options: ['calm', 'rough', 'heavy', 'loud'],
          correctAnswer: 'calm',
          explanationVi:
            '[Destination B1 - Unit 36] Tính từ "calm" (calm sea / calm water) dùng để tả mặt nước êm ả, phẳng lặng, trái ngược với "rough" (biển động).',
          rewardCoins: 40,
          rewardExp: 45,
        },
      ],
      ['nature_fishing', 'travel_tourism', 'daily_social']
    ),
  },
  NPC_FISHERMAN: {
    id: 'NPC_FISHERMAN',
    name: 'Capt. Jack',
    role: 'Fishing Guide • Bến Cảng Hồ Câu',
    avatarEmoji: '⚓',
    accentColor: '#34d399',
    locationLabel: 'Bến Cảng Gỗ Hồ Câu Cá',
    preferredCategories: ['nature_fishing', 'travel_tourism', 'daily_social'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'jack_pier_1',
          sourceId: 'DESTINATION_B1_B2',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📘 Destination B1 • Unit 9 & 36: Weather & Nature',
          npcSpeechEn:
            '"Ahoy matey! Press [F] on the wooden pier to cast your fishing rod! The lake water is very _____ today, so the Golden Koi fish are biting fast!"',
          contextHintVi: 'Tính từ miêu tả mặt nước hồ hoặc biển "êm ả, phẳng lặng, không sóng lớn".',
          options: ['calm', 'rough', 'heavy', 'loud'],
          correctAnswer: 'calm',
          explanationVi:
            '[Destination B1 - Unit 36] Tính từ "calm" (calm sea / calm water) dùng để tả mặt nước êm ả, phẳng lặng, trái ngược với "rough" (biển động).',
          rewardCoins: 40,
          rewardExp: 45,
        },
      ],
      ['nature_fishing', 'travel_tourism', 'daily_social']
    ),
  },
  NPC_OFFICER_TOM: {
    id: 'NPC_OFFICER_TOM',
    name: 'Officer Tom',
    role: 'Downtown Guide B1 • Cảnh Sát Đô Thị',
    avatarEmoji: '👮🏻‍♂️',
    accentColor: '#60a5fa',
    locationLabel: 'Khu Cao Ốc Tài Chính Downtown',
    preferredCategories: ['auto_transport', 'business_downtown', 'travel_tourism'],
    scenarios: buildNpcScenariosWithMultiSource(
      [
        {
          id: 'tom_1',
          sourceId: 'OXFORD_3000_VOCAB',
          cefr: 'B1',
          questionType: 'multiple_choice',
          unitSource: '📙 Oxford 3000 • Road Safety & Downtown Traffic',
          npcSpeechEn:
            '"Good day, citizen! Welcome to the Downtown Financial District. Always cross the street at the zebra _____ when the pedestrian light turns green!"',
          contextHintVi: 'Cụm danh từ "zebra _____" chỉ vạch kẻ sọc trắng đen dành cho người đi bộ sang đường.',
          options: ['crossing', 'parking', 'building', 'turning'],
          correctAnswer: 'crossing',
          explanationVi:
            '[Oxford 3000 Road Safety] "Zebra crossing" là vạch kẻ đường dành cho người đi bộ qua đường an toàn.',
          rewardCoins: 45,
          rewardExp: 50,
        },
      ],
      ['auto_transport', 'business_downtown', 'travel_tourism']
    ),
  },
};




// ============================================================================
// 10. KHO CÂU HỎI TỰ LUẬN & KIẾN THỨC TIẾNG ANH TẠI LỚP HỌC TRỰC TUYẾN • CÔ LAN
// "NGHE HẾT ĐỀ - GÕ MỚI ĂN ĐIỂM: 100% CÂU HỎI TỰ LUẬN & KIẾN THỨC TIẾNG ANH"
// ============================================================================
export interface ClassroomQuizQuestion {
  id: string;
  subject: string;
  subjectBadgeColor: string;
  prompt: string;
  hintVi: string;
  clueLetters: string[];
  blankPattern: string;
  options: string[];
  correctAnswer: string;
  acceptedAnswers: string[];
  explanationVi: string;
  timeLimitSec: number;
}

export const CLASSROOM_QUIZ_QUESTIONS: ClassroomQuizQuestion[] = [
  {
    id: 'eng_q1',
    subject: 'Tiếng Anh B1 • Phrasal Verbs',
    subjectBadgeColor: '#2563eb',
    prompt:
      'Unit 6 Learning & Doing: Which phrasal verb (2 words) means "to find the meaning of a word in a dictionary"? — "If you do not know this word, _____ it _____ in your dictionary."',
    hintVi: 'Gợi ý: Cụm động từ gồm 2 từ (4 chữ cái + 2 chữ cái) có nghĩa là "tra từ điển".',
    clueLetters: ['K', 'O', 'U', 'L', 'P', 'O'],
    blankPattern: '_ _ _ _   _ _',
    options: [],
    correctAnswer: 'look up',
    acceptedAnswers: ['look up', 'lookup'],
    explanationVi:
      '[Destination B1 - Unit 6] Phrasal verb "look up" có nghĩa là tra cứu nghĩa của từ hoặc thông tin trong từ điển/sách tham khảo.',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q2',
    subject: 'Tiếng Anh B1 • Relative Clauses',
    subjectBadgeColor: '#2563eb',
    prompt:
      'Unit 14 Relative Clauses: Fill in the correct relative pronoun used specifically for things/objects (not people): "The laptop _____ I bought yesterday is very fast."',
    hintVi: 'Gợi ý: Đại từ quan hệ chỉ vật gồm 5 chữ cái (bắt đầu bằng W).',
    clueLetters: ['C', 'H', 'W', 'I', 'H'],
    blankPattern: '_ _ _ _ _',
    options: [],
    correctAnswer: 'which',
    acceptedAnswers: ['which', 'that'],
    explanationVi:
      '[Destination B1 - Unit 14] Đại từ quan hệ "which" (hoặc "that") được dùng để thay thế cho danh từ chỉ sự vật, đồ vật.',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q3',
    subject: 'Tiếng Anh B1 • Prepositions',
    subjectBadgeColor: '#0284c7',
    prompt:
      'Unit 10 Prepositions: Fill in the missing preposition: "She studied very hard and succeeded _____ passing the B1 English exam on her first attempt."',
    hintVi: 'Gợi ý: Cấu trúc "succeed + giới từ (2 chữ cái) + V-ing" (thành công trong việc gì).',
    clueLetters: ['N', 'A', 'T', 'I', 'O'],
    blankPattern: '_ _',
    options: [],
    correctAnswer: 'in',
    acceptedAnswers: ['in'],
    explanationVi:
      '[Destination B1 - Unit 10] Cấu trúc cố định: "succeed in doing something" (thành công trong việc làm gì).',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q4',
    subject: 'Tiếng Anh B1 • Conditionals',
    subjectBadgeColor: '#7c3aed',
    prompt:
      'Unit 29 Second Conditional: Fill in the missing verb form to give advice: "If I _____ you, I would apply for that Oxford scholarship immediately."',
    hintVi: 'Gợi ý: Động từ to be ở câu điều kiện loại 2 (4 chữ cái: If I ____ you).',
    clueLetters: ['R', 'E', 'W', 'E'],
    blankPattern: '_ _ _ _',
    options: [],
    correctAnswer: 'were',
    acceptedAnswers: ['were'],
    explanationVi:
      '[Destination B1 - Unit 29] Trong câu điều kiện loại 2 (Second Conditional), cấu trúc khuyên nhủ luôn dùng "If I were you, I would + V".',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q5',
    subject: 'Tiếng Anh B1 • Reported Speech',
    subjectBadgeColor: '#2563eb',
    prompt:
      'Unit 18 Reported Speech: Convert into Indirect Speech: "I am flying to London tomorrow." -> She said that she _____ flying to London the next day.',
    hintVi: 'Gợi ý: Lùi thì từ "am" sang quá khứ đơn (3 chữ cái).',
    clueLetters: ['S', 'A', 'W'],
    blankPattern: '_ _ _',
    options: [],
    correctAnswer: 'was',
    acceptedAnswers: ['was'],
    explanationVi:
      '[Destination B1 - Unit 18] Trong câu tường thuật (Reported Speech), thì Hiện tại tiếp diễn (am flying) lùi về Quá khứ tiếp diễn (was flying).',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q6',
    subject: 'Tiếng Anh B1 • Passive Voice',
    subjectBadgeColor: '#059669',
    prompt:
      'Unit 11 Passive Voice: Complete the passive sentence in Past Simple (2 words): "They built this school in 1995." -> "This school _____ _____ in 1995."',
    hintVi: 'Gợi ý: Thể bị động quá khứ đơn gồm 2 từ (was/were + V3 của build).',
    clueLetters: ['B', 'S', 'I', 'W', 'T', 'U', 'A', 'L'],
    blankPattern: '_ _ _   _ _ _ _ _',
    options: [],
    correctAnswer: 'was built',
    acceptedAnswers: ['was built', 'wasbuilt'],
    explanationVi:
      '[Destination B1 - Unit 11] Thể bị động ở thì Quá khứ đơn: "was/were + V3/ed". Chủ ngữ số ít "This school" đi với "was built".',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q7',
    subject: 'Tiếng Anh B1 • Articles',
    subjectBadgeColor: '#d97706',
    prompt:
      'Unit 24 Articles: Which article is always used before musical instruments? — "My brother has been learning to play _____ guitar for three years."',
    hintVi: 'Gợi ý: Mạo từ xác định (3 chữ cái) đứng trước tên các loại nhạc cụ (piano, guitar, violin).',
    clueLetters: ['E', 'H', 'T'],
    blankPattern: '_ _ _',
    options: [],
    correctAnswer: 'the',
    acceptedAnswers: ['the'],
    explanationVi:
      '[Destination B1 - Unit 24] Khi nói về việc chơi một nhạc cụ (play the guitar, play the piano), ta luôn dùng mạo từ xác định "the".',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q8',
    subject: 'Kiến Thức Tiếng Anh • Vocabulary',
    subjectBadgeColor: '#db2777',
    prompt:
      'Unit 6 Vocabulary: What verb (6 letters) means "to study again what you have learned in order to prepare for an exam"? — "I have a big test tomorrow, so I must _____ tonight!"',
    hintVi: 'Gợi ý: Động từ 6 chữ cái có nghĩa là "ôn tập trước kỳ thi" (bắt đầu bằng R).',
    clueLetters: ['V', 'E', 'R', 'S', 'I', 'E'],
    blankPattern: '_ _ _ _ _ _',
    options: [],
    correctAnswer: 'revise',
    acceptedAnswers: ['revise', 'review'],
    explanationVi:
      '[Destination B1 - Unit 6] Động từ "revise (for an exam)" có nghĩa là ôn tập lại bài vở trước kỳ kiểm tra.',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q9',
    subject: 'Tiếng Anh B1 • Word Patterns',
    subjectBadgeColor: '#4f46e5',
    prompt:
      'Unit 6 Word Patterns: Fill in the adjective (7 letters) followed by "of": "You have practised every day, so you are definitely _____ of passing the B1 exam!"',
    hintVi: 'Gợi ý: Tính từ 7 chữ cái đi với "of" nghĩa là "có khả năng / năng lực làm gì" (be _____ of doing sth).',
    clueLetters: ['P', 'A', 'C', 'L', 'B', 'E', 'A'],
    blankPattern: '_ _ _ _ _ _ _',
    options: [],
    correctAnswer: 'capable',
    acceptedAnswers: ['capable'],
    explanationVi:
      '[Destination B1 - Unit 6] Cấu trúc Word pattern: "be capable of + V-ing / Noun" (có đủ khả năng, năng lực làm gì).',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q10',
    subject: 'Tiếng Anh B1 • Transport & Travel',
    subjectBadgeColor: '#0891b2',
    prompt:
      'Unit 9 Prepositional Phrases: Which preposition completes the phrase meaning "walking"? — "The school is very close to my house, so I always go to school _____ foot."',
    hintVi: 'Gợi ý: Cụm giới từ chỉ việc đi bộ là "___ foot" (2 chữ cái).',
    clueLetters: ['N', 'B', 'Y', 'O'],
    blankPattern: '_ _',
    options: [],
    correctAnswer: 'on',
    acceptedAnswers: ['on'],
    explanationVi:
      '[Destination B1 - Unit 9] Ta luôn dùng "on foot" để chỉ việc đi bộ (nhưng dùng "by car, by bus, by train" cho các phương tiện).',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q11',
    subject: 'Tiếng Anh B1 • Phrasal Verbs',
    subjectBadgeColor: '#2563eb',
    prompt:
      'Unit 18 Phrasal Verbs: Fill in the past tense verb (5 letters): "We were late for the meeting because our car suddenly _____ down on the highway."',
    hintVi: 'Gợi ý: Quá khứ đơn của động từ "break" trong cụm "break down" (xe bị hỏng/chết máy giữa đường).',
    clueLetters: ['K', 'R', 'O', 'E', 'B'],
    blankPattern: '_ _ _ _ _',
    options: [],
    correctAnswer: 'broke',
    acceptedAnswers: ['broke'],
    explanationVi:
      '[Destination B1 - Unit 18] Phrasal verb "break down" (quá khứ: "broke down") dùng khi xe cộ hoặc máy móc bị hỏng, ngừng hoạt động.',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q12',
    subject: 'Tiếng Anh B1 • Money & Shopping',
    subjectBadgeColor: '#059669',
    prompt:
      'Unit 15 Vocabulary: What Do You Call the piece of paper a shop assistant gives you after you pay for something? (7 letters, silent "p")',
    hintVi: 'Gợi ý: Danh từ 7 chữ cái có nghĩa là "hóa đơn / biên lai thanh toán" (có chữ p câm ở gần cuối).',
    clueLetters: ['C', 'E', 'R', 'T', 'I', 'P', 'E'],
    blankPattern: '_ _ _ _ _ _ _',
    options: [],
    correctAnswer: 'receipt',
    acceptedAnswers: ['receipt'],
    explanationVi:
      '[Destination B1 - Unit 15] "Receipt" (/rɪˈsiːt/ - âm p câm) là biên lai hoặc hóa đơn xác nhận đã thanh toán tiền khi mua hàng.',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q13',
    subject: 'Tiếng Anh B1 • Money & Shopping',
    subjectBadgeColor: '#059669',
    prompt:
      'Unit 15 Word Patterns: Fill in the missing verb (6 letters): "That sports car costs 600 coins! I need to save more money before I can _____ to buy it."',
    hintVi: 'Gợi ý: Động từ 6 chữ cái đi sau "can/cannot" có nghĩa là "đủ khả năng tài chính để chi trả".',
    clueLetters: ['F', 'O', 'R', 'A', 'D', 'F'],
    blankPattern: '_ _ _ _ _ _',
    options: [],
    correctAnswer: 'afford',
    acceptedAnswers: ['afford'],
    explanationVi:
      '[Destination B1 - Unit 15] Cấu trúc "can/cannot afford (to do something)" có nghĩa là có/không có đủ tiền để mua thứ gì.',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q14',
    subject: 'Tiếng Anh B1 • Wishes',
    subjectBadgeColor: '#9333ea',
    prompt:
      'Unit 35 Wishes: Fill in the correct past form of "have": "It is raining heavily outside! I wish I _____ an umbrella with me right now."',
    hintVi: 'Gợi ý: Ước một điều ở hiện tại dùng "wish + Quá khứ đơn" (quá khứ của have, 3 chữ cái).',
    clueLetters: ['D', 'A', 'H'],
    blankPattern: '_ _ _',
    options: [],
    correctAnswer: 'had',
    acceptedAnswers: ['had'],
    explanationVi:
      '[Destination B1 - Unit 35] Để diễn tả mong ước trái với thực tế ở hiện tại ("right now"), ta dùng "wish + S + V2/ed" ("I wish I had").',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q15',
    subject: 'Tiếng Anh B1 • The Causative',
    subjectBadgeColor: '#e11d48',
    prompt:
      'Unit 41 The Causative: Fill in the past participle (V3/ed) of "check": "Before a long trip, I always have my car engine _____ by a professional mechanic."',
    hintVi: 'Gợi ý: Cấu trúc nhờ người khác làm: "have + vật + V3/ed" (thêm đuôi -ed vào động từ check).',
    clueLetters: ['K', 'C', 'E', 'D', 'H', 'E', 'C'],
    blankPattern: '_ _ _ _ _ _ _',
    options: [],
    correctAnswer: 'checked',
    acceptedAnswers: ['checked'],
    explanationVi:
      '[Destination B1 - Unit 41] Cấu trúc bị động truyền khiến (The Causative): "have/get + something + V3/ed" ("have my car engine checked").',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q16',
    subject: 'Kiến Thức Tiếng Anh • UK Culture',
    subjectBadgeColor: '#0284c7',
    prompt:
      'English Knowledge: What is the capital city of the United Kingdom, famous for Big Ben, the River Thames, and red double-decker buses?',
    hintVi: 'Gợi ý: Tên thủ đô của Vương quốc Anh (6 chữ cái, bắt đầu bằng L).',
    clueLetters: ['N', 'D', 'O', 'L', 'N', 'O'],
    blankPattern: '_ _ _ _ _ _',
    options: [],
    correctAnswer: 'London',
    acceptedAnswers: ['london'],
    explanationVi:
      'London là thủ đô của Vương quốc Anh (United Kingdom), nổi tiếng với tháp đồng hồ Big Ben, sông Thames và xe buýt 2 tầng màu đỏ.',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q17',
    subject: 'Tiếng Anh B1 • Question Tags',
    subjectBadgeColor: '#2563eb',
    prompt:
      'Unit 26 Question Tags: Complete the tag question (2 words): "You can speak English fluently, _____ _____?"',
    hintVi: 'Gợi ý: Câu hỏi đuôi phủ định của "You can..." gồm 2 từ (can\'t you).',
    clueLetters: ['Y', 'T', 'N', 'U', 'C', 'O', 'A'],
    blankPattern: "_ _ _ ' _   _ _ _",
    options: [],
    correctAnswer: "can't you",
    acceptedAnswers: ["can't you", 'cant you', 'cannot you'],
    explanationVi:
      '[Destination B1 - Unit 26] Khi mệnh đề chính ở thể khẳng định với "You can", câu hỏi đuôi (Question tag) dùng thể phủ định "can\'t you?".',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q18',
    subject: 'Tiếng Anh B1 • Gerunds & Infinitives',
    subjectBadgeColor: '#7c3aed',
    prompt:
      'Unit 25 Verb Patterns: Fill in the correct form of "meet" after "look forward to": "I really look forward to _____ you at the English Club this weekend!"',
    hintVi: 'Gợi ý: Sau cụm "look forward to" bắt buộc dùng V-ing (7 chữ cái).',
    clueLetters: ['G', 'E', 'M', 'I', 'T', 'E', 'N'],
    blankPattern: '_ _ _ _ _ _ _',
    options: [],
    correctAnswer: 'meeting',
    acceptedAnswers: ['meeting'],
    explanationVi:
      '[Destination B1 - Unit 25] Trong cụm "look forward to" (mong đợi điều gì), "to" là giới từ nên động từ theo sau luôn ở dạng V-ing ("meeting").',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q19',
    subject: 'Tiếng Anh B1 • Collocations',
    subjectBadgeColor: '#d97706',
    prompt:
      'Unit 3 Fun & Games: Which 4-letter verb completes the collocation meaning "to participate in"? — "Over 50 students will _____ part in the school English contest!"',
    hintVi: 'Gợi ý: Cụm từ cố định "____ part in" = tham gia vào (4 chữ cái, bắt đầu bằng T).',
    clueLetters: ['K', 'E', 'T', 'A'],
    blankPattern: '_ _ _ _',
    options: [],
    correctAnswer: 'take',
    acceptedAnswers: ['take'],
    explanationVi:
      '[Destination B1 - Unit 3] Collocation cố định: "take part in something" = "participate in something" (tham gia vào hoạt động/cuộc thi).',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q20',
    subject: 'Tiếng Anh B1 • Food & Cooking',
    subjectBadgeColor: '#ea580c',
    prompt:
      'Unit 30 Vocabulary: What 5-letter past participle verb means "cooked in an oven" (used for bread, cakes, and pizza)? — "Freshly _____ bread smells amazing!"',
    hintVi: 'Gợi ý: Động từ nướng bánh bằng lò ở dạng V3/ed (5 chữ cái, bắt đầu bằng B).',
    clueLetters: ['K', 'D', 'B', 'E', 'A'],
    blankPattern: '_ _ _ _ _',
    options: [],
    correctAnswer: 'baked',
    acceptedAnswers: ['baked'],
    explanationVi:
      '[Destination B1 - Unit 30] "Bake" (baked) là nướng bằng lò (dùng cho bánh mì, bánh ngọt, pizza); khác với "boil" (luộc) và "fry" (chiên).',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q21',
    subject: 'Tiếng Anh B1 • Friends & Relations',
    subjectBadgeColor: '#ec4899',
    prompt:
      'Unit 12 Phrasal Verbs: Fill in the 3-letter verb: "Do you _____ on well with your neighbours in this city?" (Meaning: have a friendly relationship)',
    hintVi: 'Gợi ý: Cụm động từ "___ on well with somebody" = hòa đồng, thân thiết với ai (3 chữ cái).',
    clueLetters: ['T', 'E', 'G'],
    blankPattern: '_ _ _',
    options: [],
    correctAnswer: 'get',
    acceptedAnswers: ['get'],
    explanationVi:
      '[Destination B1 - Unit 12] Phrasal verb "get on (well) with somebody" có nghĩa là có mối quan hệ tốt đẹp, hòa thuận với ai.',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q22',
    subject: 'Tiếng Anh B1 • Nature & Weather',
    subjectBadgeColor: '#0d9488',
    prompt:
      'Unit 36 Vocabulary: Which 4-letter adjective means "peaceful, quiet, and without big waves"? — "The lake water is very _____ today, perfect for fishing!"',
    hintVi: 'Gợi ý: Tính từ 4 chữ cái tả mặt nước/tâm trạng "êm ả, bình tĩnh, phẳng lặng" (bắt đầu bằng C).',
    clueLetters: ['M', 'L', 'C', 'A'],
    blankPattern: '_ _ _ _',
    options: [],
    correctAnswer: 'calm',
    acceptedAnswers: ['calm'],
    explanationVi:
      '[Destination B1 - Unit 36] Tính từ "calm" dùng để miêu tả mặt biển/hồ phẳng lặng, không có sóng lớn, hoặc tâm trạng bình tĩnh.',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q23',
    subject: 'Tiếng Anh B1 • Word Formation',
    subjectBadgeColor: '#6366f1',
    prompt:
      'Unit 33 Materials: What 6-letter natural material comes from plants and is used to make soft, breathable summer T-shirts? — "100% organic _____"',
    hintVi: 'Gợi ý: Tên chất liệu "vải sợi bông" trong tiếng Anh (6 chữ cái, bắt đầu bằng C).',
    clueLetters: ['T', 'O', 'C', 'N', 'T', 'O'],
    blankPattern: '_ _ _ _ _ _',
    options: [],
    correctAnswer: 'cotton',
    acceptedAnswers: ['cotton'],
    explanationVi:
      '[Destination B1 - Unit 33] "Cotton" là chất liệu vải bông tự nhiên thoáng mát, rất phổ biến trong từ vựng chủ đề quần áo & thời trang.',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q24',
    subject: 'Tiếng Anh B1 • Conjunctions',
    subjectBadgeColor: '#2563eb',
    prompt:
      'Unit 34 Contrast Linkers: Fill in the one-word conjunction (8 letters) meaning "despite the fact that": "_____ it was raining heavily, they still walked to school."',
    hintVi: 'Gợi ý: Liên từ 8 chữ cái có nghĩa là "Mặc dù" (đi trước một mệnh đề S + V, bắt đầu bằng A).',
    clueLetters: ['T', 'L', 'A', 'H', 'O', 'U', 'G', 'H'],
    blankPattern: '_ _ _ _ _ _ _ _',
    options: [],
    correctAnswer: 'although',
    acceptedAnswers: ['although', 'even though', 'though'],
    explanationVi:
      '[Destination B1 - Unit 34] Liên từ "Although + S + V" (Mặc dù...) dùng để nối hai mệnh đề mang ý nghĩa tương phản nhau.',
    timeLimitSec: 20,
  },
  {
    id: 'eng_q25',
    subject: 'Tiếng Anh B1 • Comparatives & Superlatives',
    subjectBadgeColor: '#0284c7',
    prompt:
      'Unit 16 Comparisons: What is the irregular comparative form (6 letters) of the adjective "good"? — "Your English pronunciation is getting _____ every single day!"',
    hintVi: 'Gợi ý: Dạng so sánh hơn bất quy tắc của "good" (6 chữ cái: tốt hơn).',
    clueLetters: ['T', 'R', 'B', 'E', 'T', 'E'],
    blankPattern: '_ _ _ _ _ _',
    options: [],
    correctAnswer: 'better',
    acceptedAnswers: ['better'],
    explanationVi:
      '[Destination B1 - Unit 16] Tính từ bất quy tắc "good" chuyển sang so sánh hơn là "better" và so sánh nhất là "the best".',
    timeLimitSec: 20,
  },
];
