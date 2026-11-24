'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Html } from './SafeHtml';
import confetti from 'canvas-confetti';
import {
  CLASSROOM_QUIZ_QUESTIONS,
  type ClassroomQuizQuestion,
} from '@/data/worldGameplayData';
import {
  MULTI_SOURCE_ENGLISH_BANK,
  ENGLISH_DATABASE_SOURCES,
  shuffleArray,
  type MultiSourceEnglishItem,
} from '@/data/englishQuestionDatabase';
import { FashionAvatar } from './FashionAvatar';
import { useAuth } from '@/context/AuthContext';

// Âm thanh chúc mừng Web Audio tự nhiên khi trả lời đúng
function playQuizAudio(isFastest: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const freqs = isFastest
      ? [523.25, 659.25, 783.99, 1046.5]
      : [440, 554.37, 659.25];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(
        0.18,
        ctx.currentTime + idx * 0.08 + 0.02
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + idx * 0.08 + 0.28
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.32);
    });
  } catch {}
}

// Âm thanh vinh danh trang trọng khi hoàn thành trọn vẹn 25 câu thi
function playCeremonyAudio() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [
      { f: 523.25, t: 0.0, d: 0.16 }, // C5
      { f: 659.25, t: 0.18, d: 0.16 }, // E5
      { f: 783.99, t: 0.36, d: 0.18 }, // G5
      { f: 1046.5, t: 0.56, d: 0.55 }, // C6 ngân vang
    ];
    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.t);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + n.t);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + n.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.t + n.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + n.t);
      osc.stop(ctx.currentTime + n.t + n.d + 0.04);
    });
  } catch {}
}

export const ROUND_QUESTIONS_COUNT = 25;

export interface ClassroomRoundSummary {
  round: number;
  score: number;
  correctCount: number;
  totalCount: number;
  accuracyPercent: number;
  maxStreak: number;
  fastestSec: number | null;
  bonusCoins: number;
  bonusExp: number;
  honorTitle: string;
}

export interface ClassroomQuizState {
  currentQuestion: ClassroomQuizQuestion;
  currentQIndex: number;
  totalQuestions: number;
  quizTimerSec: number;
  isQuestionLocked: boolean;
  nextCountdownSec: number | null;
  playerScore: number;
  playerStreak: number;
  correctCount: number;
  fastestRecordSec: number | null;
  lastAnswerTimeSec: number | null;
  playerRoundFeedback: {
    status: 'correct' | 'wrong' | 'timeout';
    rankTitle: string;
    coins: number;
    exp: number;
    msg: string;
  } | null;
  hasPlayerAnswered: boolean;
  typedInput: string;
  setTypedInput: (val: string) => void;
  submitAnswer: (answer: string) => void;
  nextQuestionNow: () => void;
  // Quản lý vòng đấu và vinh danh
  roundNumber: number;
  isCeremonyActive: boolean;
  ceremonyCountdownSec: number | null;
  roundSummary: ClassroomRoundSummary | null;
  startNewRound: () => void;
}

/**
 * Chuyển đổi chuẩn hóa từ câu hỏi Đa Nguồn (MultiSourceEnglishItem) sang format lớp học (ClassroomQuizQuestion)
 */
function convertMultiSourceItemToClassroomQuestion(item: MultiSourceEnglishItem): ClassroomQuizQuestion {
  const sourceMeta = ENGLISH_DATABASE_SOURCES[item.sourceId];
  const subjectBadge = sourceMeta ? sourceMeta.shortBadge : `📘 ${item.sourceId}`;
  const subjectBadgeColor = sourceMeta ? sourceMeta.badgeColor : '#0284c7';

  const cleanAns = (item.correctAnswer || '').trim();
  const ansChars = cleanAns.toUpperCase().replace(/[^A-Z]/g, '').split('');
  const extraLetters = ['A', 'E', 'I', 'O', 'U', 'R', 'S', 'T', 'N', 'L'];
  const clues = Array.from(new Set([...ansChars, ...extraLetters.slice(0, 4)])).sort(() => Math.random() - 0.5);

  const blankPattern = cleanAns
    .split(' ')
    .map((word) => word.split('').map(() => '_').join(' '))
    .join('   ');

  return {
    id: item.id,
    subject: `${subjectBadge} • ${item.unitOrTopic || item.cefr || 'Vocabulary'}`,
    subjectBadgeColor,
    prompt: item.promptEn,
    hintVi: item.hintVi || `Gợi ý: Cấp độ ${item.cefr || 'B1'} (${cleanAns.length} ký tự).`,
    clueLetters: clues,
    blankPattern: blankPattern || '_ _ _ _',
    options: item.options || [],
    correctAnswer: cleanAns,
    acceptedAnswers:
      Array.isArray(item.acceptedAnswers) && item.acceptedAnswers.length > 0
        ? item.acceptedAnswers
        : [cleanAns],
    explanationVi: item.explanationVi || `Đáp án chính xác là "${cleanAns}".`,
    timeLimitSec: 20,
  };
}

/**
 * Xây dựng Master Question Pool khổng lồ từ mọi nguồn chuẩn quốc tế:
 * 1. CLASSROOM_QUIZ_QUESTIONS (25 câu lớp học)
 * 2. MULTI_SOURCE_ENGLISH_BANK (>175 câu Destination B1/B2, Cambridge Grammar, Oxford 3000, IELTS, TOEIC, British Council)
 */
function getInitialMasterPool(): ClassroomQuizQuestion[] {
  const converted = MULTI_SOURCE_ENGLISH_BANK.map(convertMultiSourceItemToClassroomQuestion);
  const map = new Map<string, ClassroomQuizQuestion>();
  // 1. Thêm các câu lớp học chuẩn
  CLASSROOM_QUIZ_QUESTIONS.forEach((q) => map.set(q.id, q));
  // 2. Thêm toàn bộ kho câu hỏi đa nguồn
  converted.forEach((q) => {
    if (!map.has(q.id)) {
      map.set(q.id, q);
    }
  });
  return Array.from(map.values());
}

/**
 * Hook quản lý trạng thái câu hỏi, đồng hồ đếm ngược 20s, chống trùng lặp đa nguồn,
 * vinh danh khi đủ 25 câu và tính điểm lại từ đầu cho vòng mới
 */
export function useClassroomQuiz(
  isActive: boolean,
  onAwardReward?: (coins: number, exp: number, rankTitle: string) => void
): ClassroomQuizState {
  const masterPoolRef = useRef<ClassroomQuizQuestion[]>(getInitialMasterPool());
  const usedIdsRef = useRef<Set<string>>(new Set());

  // Hàm chọn 25 câu hỏi KHÔNG TRÙNG LẶP từ kho câu hỏi đa nguồn
  const pick25UniqueQuestions = useCallback((): ClassroomQuizQuestion[] => {
    let unasked = masterPoolRef.current.filter((q) => !usedIdsRef.current.has(q.id));
    // Nếu kho câu hỏi chưa hỏi còn ít hơn 25 câu -> Làm mới danh sách đã dùng để tiếp tục mượt mà
    if (unasked.length < ROUND_QUESTIONS_COUNT) {
      usedIdsRef.current.clear();
      unasked = [...masterPoolRef.current];
    }
    const shuffled = shuffleArray(unasked);
    const roundSelection = shuffled.slice(0, ROUND_QUESTIONS_COUNT);
    roundSelection.forEach((q) => usedIdsRef.current.add(q.id));
    return roundSelection;
  }, []);

  const [questionList, setQuestionList] = useState<ClassroomQuizQuestion[]>(() => {
    return pick25UniqueQuestions();
  });
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const currentQuestion =
    questionList[currentQIndex] || questionList[0] || CLASSROOM_QUIZ_QUESTIONS[0];

  const [quizTimerSec, setQuizTimerSec] = useState<number>(20);
  const [isQuestionLocked, setIsQuestionLocked] = useState<boolean>(false);
  const [nextCountdownSec, setNextCountdownSec] = useState<number | null>(null);

  const [playerScore, setPlayerScore] = useState<number>(0);
  const [playerStreak, setPlayerStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [fastestRecordSec, setFastestRecordSec] = useState<number | null>(null);
  const [lastAnswerTimeSec, setLastAnswerTimeSec] = useState<number | null>(null);

  const [typedInput, setTypedInput] = useState('');
  const [playerRoundFeedback, setPlayerRoundFeedback] = useState<{
    status: 'correct' | 'wrong' | 'timeout';
    rankTitle: string;
    coins: number;
    exp: number;
    msg: string;
  } | null>(null);
  const [hasPlayerAnswered, setHasPlayerAnswered] = useState(false);

  // Quản lý Vòng thi & Màn hình Vinh Danh
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [isCeremonyActive, setIsCeremonyActive] = useState<boolean>(false);
  const [ceremonyCountdownSec, setCeremonyCountdownSec] = useState<number | null>(null);
  const [roundSummary, setRoundSummary] = useState<ClassroomRoundSummary | null>(null);

  const questionStartRef = useRef<number>(Date.now());
  const onAwardRewardRef = useRef(onAwardReward);
  useEffect(() => {
    onAwardRewardRef.current = onAwardReward;
  }, [onAwardReward]);

  // Tải thêm câu hỏi từ API bên ngoài / MongoDB / OpenTDB để làm giàu kho câu hỏi theo thời gian thực
  useEffect(() => {
    if (!isActive) return;
    fetch('/api/english-questions?includeExternal=true')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
          const externalConverted = data.questions.map(convertMultiSourceItemToClassroomQuestion);
          const map = new Map<string, ClassroomQuizQuestion>();
          masterPoolRef.current.forEach((q) => map.set(q.id, q));
          externalConverted.forEach((q: ClassroomQuizQuestion) => {
            if (!map.has(q.id)) {
              map.set(q.id, q);
            }
          });
          masterPoolRef.current = Array.from(map.values());
        }
      })
      .catch(() => {});
  }, [isActive]);

  // Kích hoạt Lễ Vinh Danh sau khi hoàn thành câu thứ 25
  const triggerCeremony = useCallback(() => {
    setIsQuestionLocked(true);
    setNextCountdownSec(null);

    let honorTitle = '🌱 TÂN THÍ SINH TIỀM NĂNG';
    if (correctCount >= 23) {
      honorTitle = '👑 ĐẠI THỦ KHOA TIẾNG ANH (Grand Champion)';
    } else if (correctCount >= 18) {
      honorTitle = '🌟 BẬC THẦY NGÔN NGỮ (Language Master)';
    } else if (correctCount >= 12) {
      honorTitle = '⚡ CHIẾN THẦN PHẢN XẠ (Reflex Scholar)';
    } else if (correctCount >= 7) {
      honorTitle = '📖 HỌC BÁ CẦN CÙ (Diligent Student)';
    }

    const bonusCoins = 250;
    const bonusExp = 350;
    const accuracyPercent = Math.round((correctCount / ROUND_QUESTIONS_COUNT) * 100);

    const summary: ClassroomRoundSummary = {
      round: roundNumber,
      score: playerScore,
      correctCount,
      totalCount: ROUND_QUESTIONS_COUNT,
      accuracyPercent,
      maxStreak,
      fastestSec: fastestRecordSec,
      bonusCoins,
      bonusExp,
      honorTitle,
    };

    setRoundSummary(summary);
    setIsCeremonyActive(true);

    // Thưởng hoàn thành trọn vẹn 25 câu của Vòng
    onAwardRewardRef.current?.(bonusCoins, bonusExp, `Vinh Danh Vòng ${roundNumber}: ${honorTitle}`);

    // Bắn pháo hoa rực rỡ & Phát nhạc vinh danh chiến thắng
    playCeremonyAudio();
    confetti({ particleCount: 90, spread: 80, origin: { x: 0.2, y: 0.5 } });
    setTimeout(() => {
      confetti({ particleCount: 90, spread: 80, origin: { x: 0.8, y: 0.5 } });
    }, 250);
    setTimeout(() => {
      confetti({ particleCount: 120, spread: 100, origin: { x: 0.5, y: 0.4 } });
    }, 500);

    // Bộ đếm ngược 12s tự động sang vòng mới
    setCeremonyCountdownSec(12);
  }, [roundNumber, playerScore, correctCount, maxStreak, fastestRecordSec]);

  // Bắt đầu tính điểm lại cho vòng mới với 25 câu hỏi mới tinh
  const startNewRound = useCallback(() => {
    setIsCeremonyActive(false);
    setCeremonyCountdownSec(null);
    setRoundSummary(null);

    // Reset lại điểm số về 0 theo đúng yêu cầu
    setPlayerScore(0);
    setPlayerStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setFastestRecordSec(null);
    setLastAnswerTimeSec(null);
    setRoundNumber((r) => r + 1);

    // Lấy 25 câu hỏi mới hoàn toàn chưa từng xuất hiện
    const new25 = pick25UniqueQuestions();
    setQuestionList(new25);
    setCurrentQIndex(0);
    setQuizTimerSec(20);
    setIsQuestionLocked(false);
    setNextCountdownSec(null);
    setTypedInput('');
    setPlayerRoundFeedback(null);
    setHasPlayerAnswered(false);
  }, [pick25UniqueQuestions]);

  // Đếm ngược tự động của màn hình Vinh Danh
  useEffect(() => {
    if (!isCeremonyActive) return;
    const ceremonyTimer = setInterval(() => {
      setCeremonyCountdownSec((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(ceremonyTimer);
          startNewRound();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ceremonyTimer);
  }, [isCeremonyActive, startNewRound]);

  // Chuyển sang câu hỏi tiếp theo ngay lập tức (hoặc vinh danh nếu là câu 25)
  const nextQuestionNow = useCallback(() => {
    if (currentQIndex < ROUND_QUESTIONS_COUNT - 1) {
      setCurrentQIndex((q) => q + 1);
    } else {
      triggerCeremony();
    }
  }, [currentQIndex, triggerCeremony]);

  // Khởi tạo câu hỏi mới & chạy đồng hồ đếm ngược 20s -> 0s
  useEffect(() => {
    if (!isActive || isCeremonyActive) return;

    questionStartRef.current = Date.now();
    setQuizTimerSec(currentQuestion.timeLimitSec || 20);
    setIsQuestionLocked(false);
    setNextCountdownSec(null);
    setTypedInput('');
    setPlayerRoundFeedback(null);
    setHasPlayerAnswered(false);
    setLastAnswerTimeSec(null);

    const tickInterval = setInterval(() => {
      setQuizTimerSec((prev) => {
        if (prev <= 1) {
          clearInterval(tickInterval);
          setIsQuestionLocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(tickInterval);
    };
  }, [isActive, isCeremonyActive, currentQIndex, currentQuestion]);

  // Khi hết giờ (quizTimerSec === 0) hoặc khi người chơi đã trả lời đúng -> Đếm ngược 3s sang câu mới / vinh danh
  useEffect(() => {
    if (!isActive || isCeremonyActive) return;
    if (!isQuestionLocked && !hasPlayerAnswered) return;

    if (!hasPlayerAnswered && isQuestionLocked) {
      setPlayerStreak(0);
      setPlayerRoundFeedback({
        status: 'timeout',
        rankTitle: 'Hết giờ',
        coins: 0,
        exp: 0,
        msg: `⏰ Hết thời gian! Đáp án chính xác là: "${currentQuestion.correctAnswer}" — ${currentQuestion.explanationVi}`,
      });
    }

    setNextCountdownSec(3);
    const nextTimer = setInterval(() => {
      setNextCountdownSec((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(nextTimer);
          if (currentQIndex < ROUND_QUESTIONS_COUNT - 1) {
            setCurrentQIndex((q) => q + 1);
          } else {
            triggerCeremony();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(nextTimer);
    };
  }, [isActive, isCeremonyActive, isQuestionLocked, hasPlayerAnswered, currentQuestion, currentQIndex, triggerCeremony]);

  // Xử lý khi người chơi nhập đáp án tự luận tiếng Anh
  const submitAnswer = useCallback(
    (rawAnswer: string) => {
      if (!isActive || isCeremonyActive || isQuestionLocked || hasPlayerAnswered) return;
      const clean = rawAnswer.trim().toLowerCase();
      if (!clean) return;

      const normalize = (str: string) =>
        str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');

      const normInput = normalize(clean);
      const normCorrect = normalize(currentQuestion.correctAnswer);
      const isMatched =
        normInput === normCorrect ||
        currentQuestion.acceptedAnswers.some(
          (ans) => normalize(ans) === normInput
        ) ||
        clean === currentQuestion.correctAnswer.toLowerCase();

      if (isMatched) {
        const elapsedSec = Number(
          Math.max(
            0.4,
            Math.min(20, (Date.now() - questionStartRef.current) / 1000)
          ).toFixed(1)
        );
        setHasPlayerAnswered(true);
        setIsQuestionLocked(true);
        setLastAnswerTimeSec(elapsedSec);
        setFastestRecordSec((prev) =>
          prev === null ? elapsedSec : Math.min(prev, elapsedSec)
        );

        // Thưởng theo tốc độ phản xạ
        let coins = 45;
        let exp = 65;
        let pts = 10;
        let rankTitle = '⚡ Gõ Đúng Trước Giờ';

        if (elapsedSec <= 6.5) {
          coins = 100;
          exp = 150;
          pts = 20;
          rankTitle = `🥇 SIÊU TỐC ĐỘ (${elapsedSec}s)`;
          confetti({
            particleCount: 75,
            spread: 80,
            origin: { y: 0.55 },
          });
          playQuizAudio(true);
        } else if (elapsedSec <= 12.0) {
          coins = 70;
          exp = 105;
          pts = 15;
          rankTitle = `🥈 PHẢN XẠ NHANH (${elapsedSec}s)`;
          confetti({
            particleCount: 45,
            spread: 60,
            origin: { y: 0.55 },
          });
          playQuizAudio(false);
        } else {
          playQuizAudio(false);
        }

        setPlayerScore((s) => s + pts);
        setPlayerStreak((st) => {
          const nextStreak = st + 1;
          setMaxStreak((m) => Math.max(m, nextStreak));
          return nextStreak;
        });
        setCorrectCount((c) => c + 1);

        setPlayerRoundFeedback({
          status: 'correct',
          rankTitle,
          coins,
          exp,
          msg: `🏆 CHÍNH XÁC (${elapsedSec}s)! Đáp án: "${currentQuestion.correctAnswer}" — Nhận +${coins} Xu, +${exp} EXP & +${pts} Điểm!`,
        });

        onAwardRewardRef.current?.(coins, exp, rankTitle);
      } else {
        setPlayerStreak(0);
        setPlayerRoundFeedback({
          status: 'wrong',
          rankTitle: 'Chưa đúng',
          coins: 0,
          exp: 0,
          msg: '❌ Đáp án bạn gõ chưa chính xác! Hãy đọc kỹ gợi ý trên bảng và gõ lại nhé!',
        });
      }
    },
    [isActive, isCeremonyActive, isQuestionLocked, hasPlayerAnswered, currentQuestion]
  );

  return {
    currentQuestion,
    currentQIndex,
    totalQuestions: ROUND_QUESTIONS_COUNT,
    quizTimerSec,
    isQuestionLocked,
    nextCountdownSec,
    playerScore,
    playerStreak,
    correctCount,
    fastestRecordSec,
    lastAnswerTimeSec,
    playerRoundFeedback,
    hasPlayerAnswered,
    typedInput,
    setTypedInput,
    submitAnswer,
    nextQuestionNow,
    roundNumber,
    isCeremonyActive,
    ceremonyCountdownSec,
    roundSummary,
    startNewRound,
  };
}

// Bố cục 9 bàn học đôi gỗ cao cấp (3 hàng x 3 dãy = 18 chỗ ngồi, không có NPC ảo)
const CLASSROOM_DESK_POSITIONS: Array<{ x: number; z: number; bagColor: string }> = [
  // Hàng 1 (Gần bục giảng)
  { x: -6.8, z: -2.8, bagColor: '#38bdf8' },
  { x: 0.0, z: -2.8, bagColor: '#f43f5e' },
  { x: 6.8, z: -2.8, bagColor: '#fbbf24' },
  // Hàng 2 (Giữa lớp)
  { x: -6.8, z: 1.2, bagColor: '#a855f7' },
  { x: 0.0, z: 1.2, bagColor: '#10b981' },
  { x: 6.8, z: 1.2, bagColor: '#f97316' },
  // Hàng 3 (Cuối lớp)
  { x: -6.8, z: 5.2, bagColor: '#ec4899' },
  { x: 0.0, z: 5.2, bagColor: '#06b6d4' },
  { x: 6.8, z: 5.2, bagColor: '#84cc16' },
];

/**
 * 3D Scene Lớp Học Cao Cấp:
 * - Góc nhìn thẳng chính diện (0 độ), đối xứng, ấm cúng
 * - Không có NPC học sinh ảo (chỉ có người chơi thực tế + Cô Lan trên bục giảng)
 */
export function Classroom3DScene({
  quizState,
}: {
  quizState: ClassroomQuizState;
  onExit: () => void;
}) {
  return (
    <group>
      {/* 1. SÀN GỖ PARQUET ẤM ÁP & ĐƯỜNG VÂN GỖ LỚP HỌC */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[31.4, 25.4]} />
        <meshStandardMaterial color="#d4945a" roughness={0.35} />
      </mesh>
      {/* Các đường chỉ vân gỗ ngang tạo chiều sâu sàn lớp học */}
      {[-9, -6, -3, 0, 3, 6, 9].map((zLine, idx) => (
        <mesh
          key={idx}
          position={[0, 0.02, zLine]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[31.2, 0.06]} />
          <meshStandardMaterial color="#9a5b25" roughness={0.6} />
        </mesh>
      ))}

      {/* 2. LAMRI GỖ ỐP CHÂN TƯỜNG (Wainscoting) BA PHÍA BẮC - TÂY - ĐÔNG */}
      {/* Lamri Tường Bắc */}
      <mesh position={[0, 0.85, -12.55]} receiveShadow>
        <boxGeometry args={[31.6, 1.7, 0.12]} />
        <meshStandardMaterial color="#78350f" roughness={0.55} />
      </mesh>
      {/* Lamri Tường Tây (Trái) */}
      <mesh position={[-15.55, 0.85, 0]} receiveShadow>
        <boxGeometry args={[0.12, 1.7, 25.6]} />
        <meshStandardMaterial color="#78350f" roughness={0.55} />
      </mesh>
      {/* Lamri Tường Đông (Phải) */}
      <mesh position={[15.55, 0.85, 0]} receiveShadow>
        <boxGeometry args={[0.12, 1.7, 25.6]} />
        <meshStandardMaterial color="#78350f" roughness={0.55} />
      </mesh>

      {/* 3. BỤC GIẢNG GỖ CAO CẤP & BẢNG XANH TRÊN TƯỜNG BẮC */}
      <group position={[0, 0, -9.2]}>
        {/* Bục giảng gỗ sồi */}
        <mesh position={[0, 0.18, 0.6]} receiveShadow castShadow>
          <boxGeometry args={[18.5, 0.36, 3.6]} />
          <meshStandardMaterial color="#854d0e" roughness={0.45} />
        </mesh>
        {/* Viền vàng đồng меp bục giảng */}
        <mesh position={[0, 0.35, 2.38]}>
          <boxGeometry args={[18.5, 0.05, 0.08]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.5} roughness={0.3} />
        </mesh>

        {/* Bảng xanh 3D gắn trên tường Bắc làm nền cho bảng câu hỏi */}
        <group position={[0, 3.6, -3.2]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[15.6, 4.2, 0.18]} />
            <meshStandardMaterial color="#5c2409" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.06]} receiveShadow>
            <boxGeometry args={[15.0, 3.8, 0.1]} />
            <meshStandardMaterial color="#113e2b" roughness={0.75} />
          </mesh>
          {/* Máng phấn & hộp phấn */}
          <mesh position={[0, -1.95, 0.18]}>
            <boxGeometry args={[15.0, 0.08, 0.25]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
        </group>

        {/* BÀN GIÁO VIÊN & CÔ LAN (Bên trái bục giảng) */}
        <group position={[-6.2, 0.36, 0.8]} rotation={[0, 0.25, 0]}>
          {/* Bàn giáo viên gỗ đỏ */}
          <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.5, 1.3, 1.25]} />
            <meshStandardMaterial color="#7c2d12" roughness={0.45} />
          </mesh>
          {/* Khăn trải bàn trang nhã */}
          <mesh position={[0, 1.31, 0]}>
            <boxGeometry args={[2.54, 0.04, 1.28]} />
            <meshStandardMaterial color="#fef08a" roughness={0.5} />
          </mesh>
          {/* Bình hoa tươi trên bàn cô */}
          <mesh position={[-0.75, 1.5, 0.2]} castShadow>
            <cylinderGeometry args={[0.14, 0.1, 0.36, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} />
          </mesh>
          <mesh position={[-0.75, 1.78, 0.2]} castShadow>
            <sphereGeometry args={[0.22, 14, 14]} />
            <meshStandardMaterial color="#f43f5e" roughness={0.4} />
          </mesh>
          <mesh position={[-0.65, 1.85, 0.15]} castShadow>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.4} />
          </mesh>
          {/* Chồng sách giáo khoa & Laptop của cô */}
          <mesh position={[0.45, 1.38, 0.1]} castShadow>
            <boxGeometry args={[0.55, 0.12, 0.4]} />
            <meshStandardMaterial color="#2563eb" roughness={0.4} />
          </mesh>

          {/* NHÂN VẬT 3D CÔ LAN (Dùng FashionAvatar chân thực) */}
          <group position={[-1.75, 0, 0.1]} rotation={[0, 0.15, 0]}>
            <FashionAvatar
              outfitColor="#1e3a8a"
              hatColor="#f43f5e"
              scale={1.42}
              isNpc={true}
              avatarStyle="suit"
              hairColor="#3b1d11"
              accessory="none"
            />
          </group>
        </group>

        {/* Quả địa cầu & Bảng danh dự bên phải bục giảng */}
        <group position={[6.8, 0.36, 0.6]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.5, 1.2, 16]} />
            <meshStandardMaterial color="#78350f" roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.48, 0]} castShadow>
            <sphereGeometry args={[0.32, 16, 16]} />
            <meshStandardMaterial color="#0284c7" roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* 4. HỆ THỐNG 9 BÀN HỌC ĐÔI BẰNG GỖ SỒI (3 HÀNG x 3 DÃY - KHÔNG CÓ NPC ẢO) */}
      {CLASSROOM_DESK_POSITIONS.map((desk, idx) => (
        <group key={idx} position={[desk.x, 0, desk.z]}>
          {/* Mặt bàn học gỗ sồi đánh bóng */}
          <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.2, 0.09, 1.15]} />
            <meshStandardMaterial color="#e09f5a" roughness={0.4} />
          </mesh>
          {/* Ngăn bàn để sách bên dưới */}
          <mesh position={[0, 0.86, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.0, 0.05, 0.95]} />
            <meshStandardMaterial color="#b47132" roughness={0.55} />
          </mesh>
          {/* 4 Chân bàn khung sắt sơn tĩnh điện */}
          {[
            [-1.45, -0.45],
            [1.45, -0.45],
            [-1.45, 0.45],
            [1.45, 0.45],
          ].map(([cx, cz], i) => (
            <mesh key={i} position={[cx, 0.52, cz]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 1.02, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}

          {/* Sách giáo khoa mở, vở ghi chép & hộp bút đặt ngay ngắn trên bàn */}
          {[-0.75, 0.75].map((seatX, sIdx) => (
            <group key={sIdx} position={[seatX, 1.11, 0]}>
              {/* Quyển vở mở trắng tinh */}
              <mesh position={[-0.12, 0, 0.05]} rotation={[0, 0.06, 0]}>
                <boxGeometry args={[0.46, 0.03, 0.34]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
              </mesh>
              {/* Hộp bút màu sắc */}
              <mesh position={[0.28, 0.02, -0.12]} rotation={[0, -0.15, 0]}>
                <boxGeometry args={[0.28, 0.06, 0.1]} />
                <meshStandardMaterial
                  color={sIdx === 0 ? '#0284c7' : '#ec4899'}
                  roughness={0.35}
                />
              </mesh>
            </group>
          ))}

          {/* Cặp sách học sinh treo bên hông bàn */}
          <mesh position={[1.64, 0.72, 0]} castShadow>
            <boxGeometry args={[0.16, 0.42, 0.36]} />
            <meshStandardMaterial color={desk.bagColor} roughness={0.45} />
          </mesh>

          {/* Ghế băng gỗ dài phía sau bàn */}
          <mesh position={[0, 0.62, 0.85]} castShadow receiveShadow>
            <boxGeometry args={[3.2, 0.07, 0.48]} />
            <meshStandardMaterial color="#c27d38" roughness={0.45} />
          </mesh>
          {/* Tựa lưng ghế gỗ */}
          <mesh position={[0, 0.92, 1.06]} castShadow>
            <boxGeometry args={[3.2, 0.22, 0.06]} />
            <meshStandardMaterial color="#a16227" roughness={0.5} />
          </mesh>
          {[-1.35, 0, 1.35].map((gx, i) => (
            <mesh key={i} position={[gx, 0.31, 0.85]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.62, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* 5. CỬA SỔ ĐÓN NẮNG & CHẬU CÂY XANH TẠI TƯỜNG TÂY (Bên Trái) */}
      <group position={[-15.45, 0, 0]}>
        {[-6.5, -0.5, 5.5].map((wz, i) => (
          <group key={i} position={[0, 3.6, wz]} rotation={[0, Math.PI / 2, 0]}>
            {/* Khung cửa sổ gỗ trắng */}
            <mesh castShadow>
              <boxGeometry args={[3.2, 3.0, 0.14]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            {/* Kính cửa sổ bầu trời xanh nắng ấm */}
            <mesh position={[0, 0, 0.08]}>
              <boxGeometry args={[2.9, 2.7, 0.02]} />
              <meshStandardMaterial
                color="#7dd3fc"
                emissive="#bae6fd"
                emissiveIntensity={0.65}
              />
            </mesh>
            {/* Chậu cây cảnh xanh mát đặt dọc hành lang cửa sổ */}
            <group position={[0, -3.6, 0.85]}>
              <mesh position={[0, 0.35, 0]} castShadow>
                <cylinderGeometry args={[0.32, 0.24, 0.7, 12]} />
                <meshStandardMaterial color="#b45309" roughness={0.6} />
              </mesh>
              <mesh position={[0, 0.95, 0]} castShadow>
                <sphereGeometry args={[0.52, 14, 14]} />
                <meshStandardMaterial color="#16a34a" roughness={0.5} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* 6. TỦ SÁCH THƯ VIỆN & BẢNG THI ĐUA TẠI TƯỜNG ĐÔNG (Bên Phải) */}
      <group position={[15.1, 0, 0]}>
        {[-4.5, 2.5].map((sz, idx) => (
          <group key={idx} position={[0, 2.2, sz]} rotation={[0, -Math.PI / 2, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[3.8, 4.4, 0.75]} />
              <meshStandardMaterial color="#78350f" roughness={0.55} />
            </mesh>
            {[-1.3, -0.3, 0.7, 1.6].map((sy, i) => (
              <mesh key={i} position={[0, sy, 0.22]}>
                <boxGeometry args={[3.4, 0.46, 0.5]} />
                <meshStandardMaterial
                  color={
                    i === 0
                      ? '#2563eb'
                      : i === 1
                        ? '#dc2626'
                        : i === 2
                          ? '#16a34a'
                          : '#d97706'
                  }
                  roughness={0.6}
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* 6. HỌC SINH LỚP HỌC (NPC HỌC SINH NGỒI TRẬT TỰ HỌC TẬP TRÊN BÀN GHẾ) */}
      <group>
        {/* Lớp học yên tĩnh, tập trung giải đố tiếng Anh */}
      </group>
    </group>
  );
}

/**
 * Giao diện Lớp Học Trực Tuyến 2D HUD (Hoàn toàn không đè chữ, thao tác mượt mà):
 * - Phía trên: Bảng Xanh Câu Hỏi Chính Diện + Bảng Điểm Người Chơi + Bảng Thưởng Tốc Độ
 * - Phía dưới: 4 Nút chọn đáp án nhanh (A, B, C, D) + Ô gõ đáp án + Nút Đổi Câu
 */
export function ClassroomLiveHud({
  quizState,
  onExit,
}: {
  quizState: ClassroomQuizState;
  onExit: () => void;
}) {
  const { user } = useAuth();
  const playerName = user?.tenDangNhap || 'Bạn (Người Chơi)';
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    currentQuestion,
    currentQIndex,
    totalQuestions,
    quizTimerSec,
    nextCountdownSec,
    playerScore,
    playerStreak,
    correctCount,
    fastestRecordSec,
    lastAnswerTimeSec,
    playerRoundFeedback,
    hasPlayerAnswered,
    typedInput,
    setTypedInput,
    submitAnswer,
    nextQuestionNow,
  } = quizState;

  // Tự động focus vào ô nhập tự luận mỗi khi sang câu hỏi mới
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);
    return () => clearTimeout(timer);
  }, [currentQIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      submitAnswer(typedInput);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  // Danh sách người chơi giải đố trong lớp
  const realPlayersInRoom = [
    {
      name: playerName,
      score: playerScore,
      isMe: true,
    },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '58px 18px 14px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ================================================================= */}
      {/* PHẦN TRÊN: BẢNG VINH DANH (TRÁI) - BẢNG XANH CÔ LAN (GIỮA) - THƯỞNG (PHẢI) */}
      {/* ================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: '14px',
          width: '100%',
          maxWidth: '1240px',
          margin: '0 auto',
        }}
      >
        {/* 1. BẢNG TRÁI: BẢNG ĐIỂM NGƯỜI CHƠI TRONG LỚP (Chỉ hiện người chơi thật) */}
        <div
          style={{
            pointerEvents: 'auto',
            width: '235px',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '2px solid #fbbf24',
            borderRadius: '14px',
            padding: '12px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.55)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              color: '#fef08a',
              fontWeight: 900,
              fontSize: '12px',
              borderBottom: '1px solid rgba(254, 240, 138, 0.25)',
              paddingBottom: '6px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>🏆 NGƯỜI CHƠI TRONG LỚP</span>
            <span style={{ color: '#4ade80' }}>({realPlayersInRoom.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {realPlayersInRoom.map((p, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: p.isMe
                    ? 'rgba(34, 197, 94, 0.22)'
                    : 'rgba(255, 255, 255, 0.06)',
                  border: p.isMe
                    ? '1.5px solid #4ade80'
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{idx === 0 ? '🥇' : '🎓'}</span>
                  <span style={{ fontWeight: 800 }}>{p.name}</span>
                </div>
                <b style={{ color: '#fef08a' }}>{p.score} đ</b>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px dashed rgba(255,255,255,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '11px',
              color: '#cbd5e1',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🔥 Chuỗi đúng liên tiếp:</span>
              <b style={{ color: '#fb923c' }}>{playerStreak} câu</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>✅ Tổng số câu đúng:</span>
              <b style={{ color: '#4ade80' }}>{correctCount} câu</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>⚡ Kỷ lục nhanh nhất:</span>
              <b style={{ color: '#38bdf8' }}>
                {fastestRecordSec !== null ? `${fastestRecordSec}s` : '--'}
              </b>
            </div>
          </div>
        </div>

        {/* 2. BẢNG GIỮA: BẢNG XANH LỚP HỌC CÔ LAN (Chuẩn giao diện mẫu, không đè chữ) */}
        <div
          style={{
            pointerEvents: 'auto',
            flex: 1,
            maxWidth: '680px',
            borderRadius: '14px',
            overflow: 'hidden',
            border: '4px solid #78350f',
            boxShadow: '0 14px 36px rgba(0,0,0,0.65)',
          }}
        >
          {/* Thanh tiêu đề đỏ: NGHE HẾT ĐỀ - GÕ MỚI ĂN ĐIỂM */}
          <div
            style={{
              background: 'linear-gradient(90deg, #991b1b, #dc2626, #991b1b)',
              color: '#ffffff',
              padding: '7px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 900,
              fontSize: '14px',
              letterSpacing: '0.5px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#fef08a',
                  boxShadow: '0 0 8px #fef08a',
                }}
              />
              <span>NGHE HẾT ĐỀ — GÕ MỚI ĂN ĐIỂM!</span>
            </div>
            <div
              style={{
                backgroundColor: 'rgba(0,0,0,0.35)',
                padding: '2px 10px',
                borderRadius: '999px',
                fontSize: '11.5px',
                color: '#fef08a',
                fontWeight: 800,
              }}
            >
              🏅 VÒNG {quizState.roundNumber} • CÂU {currentQIndex + 1} / {totalQuestions}
            </div>
          </div>

          {/* Mặt bảng phấn xanh */}
          <div
            style={{
              backgroundColor: 'rgba(17, 62, 43, 0.96)',
              padding: '12px 18px',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.55)',
            }}
          >
            {/* Hàng trên: Môn học + Cô Lan nhắc bài + Đồng hồ đếm ngược */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    backgroundColor:
                      currentQuestion.subjectBadgeColor || '#16a34a',
                    color: '#ffffff',
                    padding: '3px 11px',
                    borderRadius: '999px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                  }}
                >
                  📖 {currentQuestion.subject}
                </span>
                <span
                  style={{
                    color: '#fbcfe8',
                    fontSize: '11.5px',
                    fontWeight: 700,
                  }}
                >
                  👩‍🏫 Cô Lan: &ldquo;Trả lời càng nhanh, thưởng Xu & Điểm càng lớn nhé!&rdquo;
                </span>
              </div>

              {/* Đồng hồ đếm ngược tròn */}
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  border: `3.5px solid ${
                    quizTimerSec <= 3 ? '#ef4444' : '#22c55e'
                  }`,
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  color: quizTimerSec <= 3 ? '#fca5a5' : '#86efac',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '17px',
                  boxShadow:
                    quizTimerSec <= 3
                      ? '0 0 12px #ef4444'
                      : '0 0 8px rgba(34, 197, 94, 0.5)',
                  flexShrink: 0,
                }}
              >
                {quizTimerSec}
              </div>
            </div>

            {/* Nội dung câu hỏi tự luận Tiếng Anh */}
            <div
              style={{
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 700,
                lineHeight: 1.4,
                marginBottom: '6px',
                textShadow: '0 2px 4px rgba(0,0,0,0.65)',
              }}
            >
              {currentQuestion.prompt}
            </div>

            {/* Gợi ý tiếng Việt cho câu hỏi tự luận (Chỉ giữ lại gợi ý ngữ cảnh này) */}
            {currentQuestion.hintVi && (
              <div
                style={{
                  color: '#fde68a',
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '10px',
                  backgroundColor: 'rgba(0,0,0,0.32)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(253, 230, 138, 0.25)',
                  lineHeight: 1.4,
                }}
              >
                💡 {currentQuestion.hintVi}
              </div>
            )}

            {/* Chỉ hiển thị đáp án khi người chơi đã nộp bài hoặc đã hết giờ làm bài */}
            {(hasPlayerAnswered || quizTimerSec === 0) && (
              <div
                style={{
                  color: '#4ade80',
                  fontSize: '16px',
                  fontWeight: 900,
                  letterSpacing: '2px',
                  textAlign: 'center',
                  margin: '8px 0 10px',
                  padding: '6px 12px',
                  backgroundColor: 'rgba(22, 163, 74, 0.2)',
                  borderRadius: '8px',
                  border: '1px solid rgba(74, 222, 128, 0.4)',
                }}
              >
                ✨ ĐÁP ÁN: {currentQuestion.correctAnswer.toUpperCase()} ✨
              </div>
            )}

            {/* Thanh trạng thái tốc độ dưới chân bảng */}
            <div
              style={{
                backgroundColor: 'rgba(0,0,0,0.45)',
                borderRadius: '8px',
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                color: '#fef08a',
              }}
            >
              <div>
                ⚡ Nhanh nhất câu này:{' '}
                <b style={{ color: '#4ade80' }}>
                  {lastAnswerTimeSec !== null
                    ? `🥇 ${playerName} (${lastAnswerTimeSec}s)`
                    : 'Đang chờ bạn nhập đáp án...'}
                </b>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {nextCountdownSec !== null && (
                  <span style={{ color: '#67e8f9', fontWeight: 800 }}>
                    ⏳ Sang câu mới: {nextCountdownSec}s
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. BẢNG PHẢI: QUY TẮC THƯỞNG TỐC ĐỘ & NÚT RỜI LỚP */}
        <div
          style={{
            pointerEvents: 'auto',
            width: '235px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(10px)',
              border: '2px solid #38bdf8',
              borderRadius: '14px',
              padding: '12px',
              boxShadow: '0 10px 28px rgba(0,0,0,0.55)',
            }}
          >
            <div
              style={{
                color: '#38bdf8',
                fontWeight: 900,
                fontSize: '12px',
                borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
                paddingBottom: '6px',
                marginBottom: '8px',
              }}
            >
              ⚡ THƯỞNG TỐC ĐỘ TRẢ LỜI
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                fontSize: '11px',
                color: '#e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🥇 Siêu tốc (0-6s):</span>
                <b style={{ color: '#fbbf24' }}>+100 Xu • +150 EXP</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🥈 Phản xạ (7-12s):</span>
                <b style={{ color: '#38bdf8' }}>+70 Xu • +105 EXP</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🥉 Đúng (13-20s):</span>
                <b style={{ color: '#4ade80' }}>+45 Xu • +65 EXP</b>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
              onExit();
            }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              color: '#ffffff',
              border: '1.5px solid #fef08a',
              borderRadius: '12px',
              padding: '9px 14px',
              fontWeight: 900,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(239, 68, 68, 0.5)',
            }}
          >
            🚪 Bước Ra Sân Trường
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* PHẦN DƯỚI: Ô NHẬP ĐÁP ÁN TỰ LUẬN TIẾNG ANH (ĐÃ BỎ 4 NÚT A,B,C,D)  */}
      {/* ================================================================= */}
      <div
        style={{
          pointerEvents: 'auto',
          maxWidth: '720px',
          width: '100%',
          margin: '0 auto',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(254, 240, 138, 0.55)',
          borderRadius: '18px',
          padding: '12px 16px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.75)',
        }}
      >
        {/* Thông báo kết quả trả lời */}
        {playerRoundFeedback && (
          <div
            style={{
              backgroundColor:
                playerRoundFeedback.status === 'correct'
                  ? 'rgba(22, 163, 74, 0.95)'
                  : playerRoundFeedback.status === 'timeout'
                    ? 'rgba(217, 119, 6, 0.95)'
                    : 'rgba(220, 38, 38, 0.95)',
              color: '#ffffff',
              padding: '7px 14px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '13px',
              textAlign: 'center',
              marginBottom: '10px',
            }}
          >
            {playerRoundFeedback.msg}
          </div>
        )}

        {/* Ô nhập đáp án tự luận bằng bàn phím */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            disabled={hasPlayerAnswered || quizTimerSec === 0}
            placeholder={
              hasPlayerAnswered
                ? '✓ Đã trả lời chính xác! Đang chuyển sang câu tiếp theo...'
                : '✍️ Nhập đáp án Tiếng Anh tự luận vào đây rồi nhấn Enter...'
            }
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              border: '2px solid #fbbf24',
              borderRadius: '999px',
              padding: '11px 20px',
              color: '#fef08a',
              fontWeight: 800,
              fontSize: '14.5px',
              outline: 'none',
            }}
          />
          {typedInput && !hasPlayerAnswered && quizTimerSec > 0 && (
            <button
              type="button"
              onClick={() => {
                setTypedInput('');
                inputRef.current?.focus();
              }}
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#cbd5e1',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '999px',
                padding: '10px 14px',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ⌫ Xóa
            </button>
          )}
          <button
            type="button"
            disabled={
              hasPlayerAnswered || quizTimerSec === 0 || !typedInput.trim()
            }
            onClick={() => submitAnswer(typedInput)}
            style={{
              background: 'linear-gradient(135deg, #e11d48, #be123c)',
              color: '#ffffff',
              border: '1.5px solid #fef08a',
              borderRadius: '999px',
              padding: '11px 24px',
              fontWeight: 900,
              fontSize: '13px',
              cursor:
                hasPlayerAnswered || quizTimerSec === 0 || !typedInput.trim()
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                hasPlayerAnswered || quizTimerSec === 0 || !typedInput.trim()
                  ? 0.55
                  : 1,
              whiteSpace: 'nowrap',
            }}
          >
            ⚡ GỬI ĐÁP ÁN [Enter]
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MÀN HÌNH VINH DANH THÍ SINH SAU KHI HOÀN THÀNH ĐỦ 25 CÂU CỦA VÒNG  */}
      {/* ================================================================= */}
      {quizState.isCeremonyActive && (
        <ClassroomCeremonyOverlay
          quizState={quizState}
          playerName={playerName}
          onExit={onExit}
        />
      )}
    </div>
  );
}

/**
 * MÀN HÌNH VINH DANH THÍ SINH SAU KHI HOÀN THÀNH 25 CÂU
 * - Hiệu ứng pháo hoa, vương miện, cúp vàng
 * - Bảng vàng vinh danh Quán quân vòng thi
 * - Thống kê chi tiết: số câu đúng, chuỗi kỷ lục, độ chính xác, phản xạ nhanh nhất
 * - Phần thưởng tốt nghiệp vòng thi đặc biệt
 * - Đếm ngược và nút bắt đầu tính điểm lại vòng mới với 25 câu hỏi mới tinh
 */
function ClassroomCeremonyOverlay({
  quizState,
  playerName,
  onExit,
}: {
  quizState: ClassroomQuizState;
  playerName: string;
  onExit: () => void;
}) {
  const summary = quizState.roundSummary;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(16px)',
        zIndex: 100,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'linear-gradient(145deg, #0f172a, #1e1b4b, #0f172a)',
          border: '3px solid #fbbf24',
          borderRadius: '24px',
          padding: '28px 24px',
          boxShadow: '0 0 50px rgba(251, 191, 36, 0.4), 0 20px 40px rgba(0,0,0,0.8)',
          textAlign: 'center',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* TIÊU ĐỀ LỄ VINH DANH */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 900,
              letterSpacing: '3px',
              color: '#fef08a',
              textTransform: 'uppercase',
            }}
          >
            ★ LỄ VINH DANH THÍ SINH XUẤT SẮC ★
          </div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 900,
              color: '#ffffff',
              textShadow: '0 2px 10px rgba(251, 191, 36, 0.5)',
            }}
          >
            HOÀN THÀNH VÒNG {summary?.round || quizState.roundNumber} (25 CÂU)
          </div>
          <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
            Chúc mừng bạn đã xuất sắc vượt qua toàn bộ 25 câu hỏi Tiếng Anh chuẩn quốc tế!
          </div>
        </div>

        {/* BỤC VINH DANH QUÁN QUÂN (PODIUM TOP 1) */}
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.18), rgba(217, 119, 6, 0.08))',
            border: '2px solid rgba(251, 191, 36, 0.65)',
            borderRadius: '18px',
            padding: '16px 20px',
            boxShadow: 'inset 0 0 20px rgba(251, 191, 36, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              filter: 'drop-shadow(0 4px 12px rgba(251, 191, 36, 0.7))',
              lineHeight: 1,
            }}
          >
            🏆
          </div>

          <div style={{ fontSize: '18px', fontWeight: 900, color: '#fef08a' }}>
            🥇 QUÁN QUÂN: {playerName}
          </div>

          <div
            style={{
              backgroundColor: 'rgba(251, 191, 36, 0.25)',
              color: '#fde047',
              border: '1px solid #fbbf24',
              borderRadius: '999px',
              padding: '4px 16px',
              fontSize: '12.5px',
              fontWeight: 900,
              letterSpacing: '0.5px',
            }}
          >
            {summary?.honorTitle || '👑 ĐẠI THỦ KHOA TIẾNG ANH'}
          </div>

          <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
            Tổng điểm vòng:{' '}
            <span style={{ color: '#4ade80', fontSize: '24px' }}>
              {summary?.score ?? quizState.playerScore} đ
            </span>
          </div>
        </div>

        {/* BẢNG 4 THỐNG KÊ THÀNH TÍCH VÒNG THI */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            width: '100%',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '10px 14px',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>🎯 Số câu đúng / Độ chính xác</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#4ade80' }}>
              {summary?.correctCount ?? quizState.correctCount} / {summary?.totalCount ?? 25}{' '}
              <span style={{ fontSize: '12px', color: '#86efac' }}>
                ({summary?.accuracyPercent ?? Math.round((quizState.correctCount / 25) * 100)}%)
              </span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '10px 14px',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>🔥 Chuỗi đúng kỷ lục</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#fb923c' }}>
              {summary?.maxStreak ?? quizState.playerStreak} câu liên tiếp
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '10px 14px',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>⚡ Phản xạ nhanh nhất</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#38bdf8' }}>
              {summary?.fastestSec !== null && summary?.fastestSec !== undefined
                ? `${summary.fastestSec}s`
                : '--'}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              border: '1.5px solid #a855f7',
              borderRadius: '12px',
              padding: '10px 14px',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '11px', color: '#d8b4fe' }}>🎁 Thưởng tốt nghiệp vòng</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#fef08a' }}>
              +{summary?.bonusCoins ?? 250} Xu • +{summary?.bonusExp ?? 350} EXP
            </div>
          </div>
        </div>

        {/* THANH ĐẾM NGƯỢC TỰ ĐỘNG BƯỚC VÀO VÒNG MỚI */}
        {quizState.ceremonyCountdownSec !== null && (
          <div
            style={{
              fontSize: '12.5px',
              color: '#cbd5e1',
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              padding: '6px 16px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            ⏳ Tự động bắt đầu Vòng {quizState.roundNumber + 1} sau:{' '}
            <b style={{ color: '#fde047', fontSize: '14px' }}>
              {quizState.ceremonyCountdownSec}s
            </b>
          </div>
        )}

        {/* 2 NÚT ĐIỀU KHIỂN HÀNH ĐỘNG */}
        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '6px' }}>
          <button
            type="button"
            onClick={quizState.startNewRound}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: '#ffffff',
              border: '2px solid #86efac',
              borderRadius: '14px',
              padding: '13px 20px',
              fontWeight: 900,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(22, 163, 74, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>🚀 BẮT ĐẦU VÒNG {quizState.roundNumber + 1} NGAY</span>
            <span style={{ fontSize: '11px', opacity: 0.85 }}>(Tính điểm lại từ đầu)</span>
          </button>

          <button
            type="button"
            onClick={onExit}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              border: '1.5px solid rgba(239, 68, 68, 0.6)',
              borderRadius: '14px',
              padding: '13px 20px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            🚪 Rời Lớp Học
          </button>
        </div>
      </div>
    </div>
  );
}
