/**
 * V5 Ultimate 질문 엔진
 * 
 * 질문 생성은 오직 이 엔진에서만 수행됩니다.
 * UX 레이어나 다른 곳에서는 절대 질문을 생성하지 않습니다.
 */

import OpenAI from 'openai';
import { PhotoAnalysisResult, ChatMessage } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 누락된 정보 목록 타입
 */
export interface MissingInfo {
  spaceType?: boolean;
  activity?: boolean;
  familyInfo?: boolean;
  cleaningStyle?: boolean;
  spaceInterests?: boolean;
  budgetRange?: boolean;
}

/**
 * 톤 봉인 시스템 프롬프트
 * 이 프롬프트는 절대 수정하지 마세요.
 */
const TONE_LOCKED_SYSTEM_PROMPT = `당신은 친구처럼 편하게 대화하는 인테리어 상담사입니다.

[절대 금지]
- 길게 말하기 (질문은 15자 이내)
- "~하세요?", "원하세요?", "어떠세요?" 금지
- "분위기", "스타일", "느낌" 같은 인테리어 용어 금지
- 선택지 나열하며 묻기 금지
- "예를 들어" 금지

[필수]
- 짧고 직접적으로
- 일상 대화처럼
- 한 문장으로 끝내기

[좋은 예시]
"요즘 집에서 뭐가 제일 불편해요?"
"집에 손님 자주 와요?"
"퇴근하고 집에서 뭐 해요?"
"청소 자주 하는 편이에요?"
"아침에 바빠요?"

[나쁜 예시 - 절대 하지 말 것]
"어떤 분위기를 원하세요?" ❌
"예를 들어 A가 좋으신가요, B가 좋으신가요?" ❌
"주방에서 요리할 때 어떤 느낌이 좋으세요?" ❌

JSON으로만 응답:
{
  "question": "짧은 질문 (15자 이내)",
  "quickReplies": ["답1", "답2", "답3", "답4"]
}`;

/**
 * 대화에서 누락된 정보를 파악
 * 실제 데이터 존재 여부 기준으로 판단
 */
function analyzeMissingInfo(
  messages: ChatMessage[],
  photoAnalysis: PhotoAnalysisResult | null,
  spaceInfo?: {
    housingType?: string;
    pyeong?: number;
    rooms?: number;
    bathrooms?: number;
  } | null,
  styleResult?: { styleTag?: string; keywords?: string[] } | null
): MissingInfo {
  const hasPhoto = !!photoAnalysis;
  const hasSpaceType = hasPhoto && !!photoAnalysis?.spaceType;
  
  // 대화 내용에서 정보 추출
  const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
  const userMessages = messages.filter(m => m.role === 'user');
  
  // 실제 데이터 존재 여부 기준으로 판단
  const hasActivityInfo = userMessages.some(m => {
    const content = m.content.toLowerCase();
    return content.includes('요리') || content.includes('재택') || content.includes('근무') || 
           content.includes('시간') || content.includes('활동');
  });
  
  const hasFamilyInfo = userMessages.some(m => {
    const content = m.content.toLowerCase();
    return content.includes('가족') || content.includes('아이') || content.includes('자녀') || 
           content.includes('부모') || content.includes('혼자') || content.includes('1인');
  }) || (spaceInfo && (spaceInfo.rooms || spaceInfo.bathrooms));
  
  const hasCleaningStyle = userMessages.some(m => {
    const content = m.content.toLowerCase();
    return content.includes('청소') || content.includes('정리') || content.includes('관리');
  });
  
  const hasSpaceInterests = userMessages.some(m => {
    const content = m.content.toLowerCase();
    return content.includes('거실') || content.includes('주방') || content.includes('침실') || 
           content.includes('욕실') || content.includes('공간');
  }) || hasSpaceType;
  
  const hasBudgetRange = userMessages.some(m => {
    const content = m.content.toLowerCase();
    return content.includes('예산') || content.includes('비용') || content.includes('금액') || 
           content.includes('만원') || content.includes('천만');
  });
  
  return {
    spaceType: !hasSpaceType,
    activity: !hasActivityInfo,
    familyInfo: !hasFamilyInfo,
    cleaningStyle: !hasCleaningStyle,
    spaceInterests: !hasSpaceInterests,
    budgetRange: !hasBudgetRange,
  };
}

/**
 * 누락된 정보 목록을 텍스트로 변환
 */
function formatMissingInfo(missingInfo: MissingInfo): string {
  const missing: string[] = [];
  
  if (missingInfo.spaceType) missing.push('주 사용 공간');
  if (missingInfo.activity) missing.push('주요 활동');
  if (missingInfo.familyInfo) missing.push('가족 구성');
  if (missingInfo.cleaningStyle) missing.push('정리정돈 스타일');
  if (missingInfo.spaceInterests) missing.push('관심 공간');
  if (missingInfo.budgetRange) missing.push('예산 범위');
  
  return missing.length > 0 
    ? `누락된 정보: ${missing.join(', ')}`
    : '모든 정보 수집 완료';
}

/**
 * 고정 첫 질문 반환
 * 첫 질문은 AI 생성이 아닌 고정 질문 세트로 봉인
 */
function getFixedFirstQuestions(): { question: string; quickReplies: string[] } {
  return {
    question: "안녕하세요! 먼저 어떤 공간을 가장 바꾸고 싶으세요?",
    quickReplies: ["거실", "주방", "침실", "욕실", "전체 다"]
  };
}

/**
 * 질문 엔진 - 질문 생성
 * 
 * @param messages 대화 내역
 * @param photoAnalysis 사진 분석 결과
 * @param styleResult 스타일 선택 결과
 * @param spaceInfo 집 정보
 * @returns 생성된 질문과 빠른 답변, 또는 null (질문 완료)
 */
export async function generateQuestion(
  messages: ChatMessage[],
  photoAnalysis: PhotoAnalysisResult | null,
  styleResult?: { styleTag?: string; keywords?: string[] } | null,
  spaceInfo?: {
    housingType?: string;
    pyeong?: number;
    rooms?: number;
    bathrooms?: number;
  } | null
): Promise<{ question: string; quickReplies: string[] } | null> {
  const userMessages = messages.filter(m => m.role === 'user');
  
  // 5개 질문 완료 체크
  if (userMessages.length >= 5) {
    return null;
  }
  
  // 누락된 정보 파악 (실제 데이터 기반)
  const missingInfo = analyzeMissingInfo(messages, photoAnalysis, spaceInfo, styleResult);
  const missingInfoText = formatMissingInfo(missingInfo);
  
  // 모든 정보 수집 완료
  // V5는 5문항을 "완주"하는 구조이므로, 여기서 조기 종료하지 않게 처리
  if (missingInfoText === '모든 정보 수집 완료' && userMessages.length >= 5) {
    return null;
  }
  
  // ===== V5 PRIMARY (local, no new files) =====
  // userMessages.length: 0~4 (5 이상은 위에서 null 처리)
  const v5Index = userMessages.length;

  // (헌법) 현장 변수 누락 자동 경고 → 질문 강제 삽입 가능
  const v5Risk = v5RiskLocal({ photoAnalysis, spaceInfo });

  // 5문항 내 "견적/공정 선택에 영향 큰 질문"만 순차 제공
  const v5Planned = v5PlannerLocal({
    questionIndex: v5Index,
    spaceInfo: spaceInfo ?? null,
    styleResult: styleResult ?? null,
  });

  // HIGH 리스크면 최우선 질문으로 교체(중복 방지)
  // 리스크 질문은 index 0에서만 1회 강제 (이후에는 플래너 질문 우선)
  const shouldForceRisk = v5Index === 0; // 첫 질문에서만 강제
  const v5Candidate =
    shouldForceRisk &&
    v5Risk.level === 'HIGH' &&
    v5Risk.requiredQuestion &&
    !isSameQuestion(v5Risk.requiredQuestion, v5Planned)
      ? v5Risk.requiredQuestion
      : v5Planned;

  console.log('[V5_PLANNER_RESULT]', {
    idx: v5Index,
    risk: v5Risk.level,
    question: v5Candidate.question,
    quickReplies: v5Candidate.quickReplies,
  });

  const v5Validation = v5ValidateLocal(v5Candidate);

  // V5가 PASS면 즉시 반환 → OpenAI 호출 경로는 기본적으로 실행되지 않음
  if (v5Validation.result === 'PASS') {
    return v5Candidate;
  }

  console.log('[V5_VALIDATION_FAIL]', v5Validation);
  // FAIL이면 기존 로직(OpenAI 생성)로 자연스럽게 fallback 진행
  // ===== /V5 PRIMARY =====
  
  // 대화 내용 요약
  const conversationSummary = messages
    .map(m => `${m.role === 'user' ? '고객' : '상담사'}: ${m.content}`)
    .join('\n');
  
  // user 프롬프트: 현재 상황과 대화 내역 전달
  const userPrompt = `[고객 집 정보]
${spaceInfo ? `
- 주거형태: ${spaceInfo.housingType || '미입력'}
- 평수: ${spaceInfo.pyeong || '미입력'}평
- 방: ${spaceInfo.rooms || '미입력'}개
- 화장실: ${spaceInfo.bathrooms || '미입력'}개
` : '집 정보 미입력'}

${styleResult?.styleTag ? `[선택한 스타일]: ${styleResult.styleTag}` : ''}

[대화 내역]
${conversationSummary || '아직 대화 시작 전 - 첫 질문 생성해주세요'}

${photoAnalysis ? `[사진 분석 결과]\n공간: ${photoAnalysis.spaceType}` : ''}

질문 수: ${userMessages.length}/5
다음 질문을 자연스럽게 생성해주세요.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: TONE_LOCKED_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7, // 첫 질문 제외한 나머지 질문에 적용 (다양성 확보)
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('질문 생성 실패');
    }

    // JSON 파싱
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON 파싱 실패');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.question || !Array.isArray(parsed.quickReplies)) {
      throw new Error('질문 형식 오류');
    }

    return {
      question: parsed.question,
      quickReplies: parsed.quickReplies
    };

  } catch (error) {
    console.error('질문 엔진 에러:', error);
    // Fallback: 기본 질문 템플릿 사용 (첫 질문 제외)
    if (userMessages.length === 0) {
      // 첫 질문은 이미 고정 질문으로 처리되었으므로 여기 도달하지 않아야 함
      // 안전장치: 고정 질문 반환
      return getFixedFirstQuestions();
    }
    return getFallbackQuestion(userMessages.length, photoAnalysis);
  }
}

/**
 * Fallback 질문 (질문 엔진 실패 시)
 * 첫 질문은 사용하지 않음 (고정 질문으로 처리)
 */
function getFallbackQuestion(
  questionIndex: number,
  photoAnalysis: PhotoAnalysisResult | null
): { question: string; quickReplies: string[] } | null {
  // 첫 질문은 fallback에서 제외 (이미 고정 질문으로 처리됨)
  if (questionIndex === 0) {
    return null;
  }

  const fallbackQuestions = [
    {
      question: "주로 어떤 공간에서 시간을 보내세요?",
      quickReplies: ["거실", "주방", "침실", "서재"]
    },
    {
      question: "혼자 사세요, 아니면 같이 사는 분이 계세요?",
      quickReplies: ["혼자요", "가족이랑", "친구랑", "그때그때 달라요"]
    },
    {
      question: "청소나 정리는 어떤 스타일이세요?",
      quickReplies: ["매일 깔끔하게", "주말에 몰아서", "솔직히 귀찮아요", "로봇청소기가 해요"]
    },
    {
      question: "이번 인테리어에서 꼭 바꾸고 싶은 거 하나만 꼽는다면?",
      quickReplies: ["주방이요", "욕실이요", "수납공간", "전체 분위기"]
    },
    {
      question: "예산은 대충 어느 정도 생각하세요?",
      quickReplies: ["3천만원 이하", "3천~5천", "5천~7천", "7천 이상"]
    }
  ];

  if (questionIndex >= fallbackQuestions.length) {
    return null;
  }

  return fallbackQuestions[questionIndex];
}

// ===== V5 Local Helpers (NO new files) =====
type V5QuestionShape = { question: string; quickReplies: string[] };

function isSameQuestion(a: V5QuestionShape, b: V5QuestionShape): boolean {
  return (a?.question ?? '').trim() !== '' && (a.question ?? '').trim() === (b?.question ?? '').trim();
}

function v5ValidateLocal(q: V5QuestionShape): { result: 'PASS' | 'FAIL'; reason?: string } {
  if (!q || typeof q.question !== 'string') return { result: 'FAIL', reason: 'question 없음' };
  const text = q.question.trim();
  if (text.length < 5) return { result: 'FAIL', reason: 'question 너무 짧음' };
  if (!Array.isArray(q.quickReplies)) return { result: 'FAIL', reason: 'quickReplies 배열 아님' };
  const replies = q.quickReplies.filter(v => typeof v === 'string' && v.trim().length > 0);
  if (replies.length < 2) return { result: 'FAIL', reason: 'quickReplies 2개 미만' };
  if (replies.length > 8) return { result: 'FAIL', reason: 'quickReplies 과다(>8)' };
  return { result: 'PASS' };
}

function v5RiskLocal(input: {
  photoAnalysis: PhotoAnalysisResult | null;
  spaceInfo?: {
    housingType?: string;
    pyeong?: number;
    rooms?: number;
    bathrooms?: number;
  } | null;
}): { level: 'LOW' | 'MEDIUM' | 'HIGH'; requiredQuestion?: V5QuestionShape } {
  // 사진/평수/기본 집정보가 부족하면 HIGH로 보고 "현장 변수" 질문을 1순위로 강제
  const hasPhoto = !!input.photoAnalysis;
  const hasPyeong = typeof input.spaceInfo?.pyeong === 'number' && (input.spaceInfo?.pyeong ?? 0) > 0;
  const hasHousing = !!input.spaceInfo?.housingType;

  if (!hasPhoto || !hasPyeong || !hasHousing) {
    return {
      level: 'HIGH',
      requiredQuestion: {
        question: '관리규정/작업시간/주차·양중 제한이 있나요?',
        quickReplies: ['있음', '없음', '확인 필요', '모름'],
      },
    };
  }

  return { level: 'LOW' };
}

function v5PlannerLocal(input: {
  questionIndex: number; // 0~4
  spaceInfo: {
    housingType?: string;
    pyeong?: number;
    rooms?: number;
    bathrooms?: number;
  } | null;
  styleResult: { styleTag?: string; keywords?: string[] } | null;
}): V5QuestionShape {
  const idx = Math.max(0, Math.min(4, input.questionIndex));
  const pyeong = input.spaceInfo?.pyeong;
  const bathrooms = input.spaceInfo?.bathrooms;

  const base: V5QuestionShape[] = [
    {
      question: '공사 범위는 어디까지인가요?',
      quickReplies: ['전체 리모델링', '부분 공사', '한 공간만', '상담 후 결정'],
    },
    {
      question: '철거는 어느 정도로 진행하나요?',
      quickReplies: ['올철거', '부분철거', '철거 거의 없음', '모르겠음'],
    },
    {
      question: '욕실은 몇 개 공사하나요?',
      quickReplies: ['1개', '2개', '전체', '욕실 공사 없음'],
    },
    {
      question: '주방 공사는 어느 수준인가요?',
      quickReplies: ['교체(전체)', '부분(도어/상판)', '수리/보수', '변경 없음'],
    },
    {
      question: '바닥/도배는 어디까지 진행하나요?',
      quickReplies: ['전체', '부분', '안 함', '모르겠음'],
    },
  ];

  // 집정보가 있으면 문구만 현실화(계산/추천 아님)
  if (idx === 0 && typeof pyeong === 'number' && pyeong > 0) {
    return {
      question: `공사 범위는 어디까지인가요? (약 ${pyeong}평 기준)`,
      quickReplies: base[0].quickReplies,
    };
  }
  if (idx === 2 && typeof bathrooms === 'number' && bathrooms > 0) {
    return {
      question: `욕실 공사는 몇 개 하시나요? (현재 ${bathrooms}개 기준)`,
      quickReplies: base[2].quickReplies,
    };
  }  return base[idx];
}
// ===== /V5 Local Helpers =====