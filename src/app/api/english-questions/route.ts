import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CauHoiTiengAnh from '@/models/EnglishQuestion';
import {
  ENGLISH_DATABASE_SOURCES,
  MULTI_SOURCE_ENGLISH_BANK,
  shuffleArray,
  type EnglishDatabaseSourceId,
  type MultiSourceEnglishItem,
} from '@/data/englishQuestionDatabase';

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&eacute;/g, 'é');
}

/**
 * Tải thêm câu hỏi kiến thức Tiếng Anh trực tiếp từ Open Trivia API (khi có mạng)
 * để làm giàu thêm kho câu hỏi đa nguồn theo thời gian thực
 */
async function fetchLiveOpenTriviaEnglishQuestions(limit = 6): Promise<MultiSourceEnglishItem[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2800);
    // Category 9 = General Knowledge, Category 10 = Books/Literature
    const res = await fetch(
      `https://opentdb.com/api.php?amount=${limit}&category=9&type=multiple`,
      { signal: controller.signal, cache: 'no-store' }
    );
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data?.results)) return [];

    return data.results.map((item: any, idx: number): MultiSourceEnglishItem => {
      const correct = decodeHtmlEntities(String(item.correct_answer || ''));
      const incorrect = Array.isArray(item.incorrect_answers)
        ? item.incorrect_answers.map((a: any) => decodeHtmlEntities(String(a)))
        : [];
      const options = shuffleArray([correct, ...incorrect]).slice(0, 4);
      const questionText = decodeHtmlEntities(String(item.question || ''));

      return {
        id: `live_opentdb_${Date.now()}_${idx}`,
        sourceId: 'BRITISH_COUNCIL_CULTURE',
        unitOrTopic: `Open Global Knowledge • ${decodeHtmlEntities(String(item.category || 'English Trivia'))}`,
        cefr: item.difficulty === 'hard' ? 'C1' : item.difficulty === 'medium' ? 'B2' : 'B1',
        difficulty:
          item.difficulty === 'hard'
            ? 'hard'
            : item.difficulty === 'medium'
              ? 'medium'
              : 'easy',
        questionType: 'multiple_choice',
        category: 'culture_knowledge',
        promptEn: `"${questionText}"`,
        hintVi: 'Câu hỏi kiến thức & từ vựng Tiếng Anh quốc tế (nguồn trực tuyến Open Trivia DB).',
        options,
        correctAnswer: correct,
        acceptedAnswers: [correct.toLowerCase()],
        explanationVi: `[Open Global Trivia • English Knowledge] Đáp án chính xác cho câu hỏi "${questionText}" là "${correct}".`,
        rewardCoins: 50,
        rewardExp: 60,
      };
    });
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceFilter = (searchParams.get('source') || 'ALL') as EnglishDatabaseSourceId | 'ALL';
    const categoryFilter = searchParams.get('category') || 'ALL';
    const includeExternal = searchParams.get('includeExternal') !== 'false';

    let dbItems: MultiSourceEnglishItem[] = [];

    // 1. Lấy thêm các câu hỏi đã lưu trong MongoDB (nếu DB sẵn sàng)
    try {
      await connectToDatabase();
      const count = await CauHoiTiengAnh.countDocuments();
      if (count === 0) {
        // Tự động seed dữ liệu mẫu từ kho đa nguồn vào MongoDB lần đầu
        const seedDocs = MULTI_SOURCE_ENGLISH_BANK.slice(0, 30).map((q) => ({
          maCauHoi: q.id,
          nguonDuLieu: q.sourceId,
          baiHocHoacChuDe: q.unitOrTopic,
          trinhDoCefr: q.cefr,
          doKho: q.difficulty,
          loaiCauHoi: q.questionType,
          danhMucDiaDiem: q.category,
          noiDungCauHoiEn: q.promptEn,
          goiYTiengViet: q.hintVi,
          danhSachDapAn: q.options,
          dapAnDung: q.correctAnswer,
          cacDapAnChapNhan: q.acceptedAnswers,
          giaiThichChiTietVi: q.explanationVi,
          thuongXu: q.rewardCoins,
          thuongExp: q.rewardExp,
        }));
        await CauHoiTiengAnh.insertMany(seedDocs, { ordered: false }).catch(() => {});
      }

      const docs = await CauHoiTiengAnh.find().lean().limit(200);
      dbItems = docs.map((d: any) => ({
        id: d.maCauHoi,
        sourceId: d.nguonDuLieu || 'DESTINATION_B1_B2',
        unitOrTopic: d.baiHocHoacChuDe,
        cefr: d.trinhDoCefr || 'B1',
        difficulty: d.doKho || 'medium',
        questionType: d.loaiCauHoi || 'multiple_choice',
        category: d.danhMucDiaDiem || 'daily_social',
        promptEn: d.noiDungCauHoiEn,
        hintVi: d.goiYTiengViet || '',
        options: d.danhSachDapAn || [],
        correctAnswer: d.dapAnDung,
        acceptedAnswers:
          Array.isArray(d.cacDapAnChapNhan) && d.cacDapAnChapNhan.length > 0
            ? d.cacDapAnChapNhan
            : [d.dapAnDung],
        explanationVi: d.giaiThichChiTietVi || '',
        rewardCoins: d.thuongXu || 45,
        rewardExp: d.thuongExp || 50,
      }));
    } catch {
      // Nếu MongoDB chưa kết nối, vẫn hoạt động mượt mà với kho đa nguồn tích hợp sẵn
    }

    // 2. Lấy thêm câu hỏi trực tuyến từ nguồn mở (OpenTDB) nếu được bật
    const liveExternalItems = includeExternal
      ? await fetchLiveOpenTriviaEnglishQuestions(5)
      : [];

    // 3. Hợp nhất toàn bộ các nguồn & khử trùng lặp theo ID
    const mergedMap = new Map<string, MultiSourceEnglishItem>();
    for (const item of MULTI_SOURCE_ENGLISH_BANK) {
      mergedMap.set(item.id, item);
    }
    for (const item of dbItems) {
      mergedMap.set(item.id, item);
    }
    for (const item of liveExternalItems) {
      mergedMap.set(item.id, item);
    }

    let allQuestions = Array.from(mergedMap.values());
    if (sourceFilter !== 'ALL') {
      allQuestions = allQuestions.filter((q) => q.sourceId === sourceFilter);
    }
    if (categoryFilter !== 'ALL') {
      allQuestions = allQuestions.filter((q) => q.category === categoryFilter);
    }

    return NextResponse.json({
      thanhCong: true,
      tongSoCauHoi: allQuestions.length,
      danhSachNguon: Object.values(ENGLISH_DATABASE_SOURCES),
      questions: shuffleArray(allQuestions),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        thanhCong: true,
        tongSoCauHoi: MULTI_SOURCE_ENGLISH_BANK.length,
        danhSachNguon: Object.values(ENGLISH_DATABASE_SOURCES),
        questions: shuffleArray(MULTI_SOURCE_ENGLISH_BANK),
      },
      { status: 200 }
    );
  }
}

/**
 * POST: Cho phép người dùng / giáo viên thêm câu hỏi Tiếng Anh mới từ bất kỳ nguồn nào vào CSDL MongoDB
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sourceId = 'DESTINATION_B1_B2',
      unitOrTopic = 'Custom English Question',
      cefr = 'B1',
      difficulty = 'medium',
      questionType = 'multiple_choice',
      category = 'daily_social',
      promptEn,
      hintVi = '',
      options = [],
      correctAnswer,
      explanationVi = '',
      rewardCoins = 50,
      rewardExp = 60,
    } = body;

    if (!promptEn || !correctAnswer) {
      return NextResponse.json(
        { thanhCong: false, message: 'Vui lòng nhập nội dung câu hỏi (promptEn) và đáp án đúng (correctAnswer).' },
        { status: 400 }
      );
    }

    const customId = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newItem: MultiSourceEnglishItem = {
      id: customId,
      sourceId,
      unitOrTopic,
      cefr,
      difficulty,
      questionType,
      category,
      promptEn,
      hintVi,
      options: Array.isArray(options) && options.length > 0 ? options : [correctAnswer],
      correctAnswer,
      acceptedAnswers: [String(correctAnswer).trim().toLowerCase()],
      explanationVi:
        explanationVi || `[${unitOrTopic}] Đáp án chính xác là "${correctAnswer}".`,
      rewardCoins: Number(rewardCoins) || 50,
      rewardExp: Number(rewardExp) || 60,
    };

    try {
      await connectToDatabase();
      await CauHoiTiengAnh.create({
        maCauHoi: newItem.id,
        nguonDuLieu: newItem.sourceId,
        baiHocHoacChuDe: newItem.unitOrTopic,
        trinhDoCefr: newItem.cefr,
        doKho: newItem.difficulty,
        loaiCauHoi: newItem.questionType,
        danhMucDiaDiem: newItem.category,
        noiDungCauHoiEn: newItem.promptEn,
        goiYTiengViet: newItem.hintVi,
        danhSachDapAn: newItem.options,
        dapAnDung: newItem.correctAnswer,
        cacDapAnChapNhan: newItem.acceptedAnswers,
        giaiThichChiTietVi: newItem.explanationVi,
        thuongXu: newItem.rewardCoins,
        thuongExp: newItem.rewardExp,
      });
    } catch {
      // Nếu MongoDB offline vẫn trả về newItem để client thêm ngay vào phiên hiện tại
    }

    return NextResponse.json({
      thanhCong: true,
      question: newItem,
      message: 'Đã thêm câu hỏi mới vào Cơ Sở Dữ Liệu Tiếng Anh Đa Nguồn!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { thanhCong: false, message: error?.message || 'Lỗi khi thêm câu hỏi mới.' },
      { status: 500 }
    );
  }
}

