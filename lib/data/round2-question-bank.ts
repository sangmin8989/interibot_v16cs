/**
 * V5 2차 질문 뱅크 SSOT (Single Source of Truth)
 * 
 * ⚠️ 절대 규칙: 2차 질문 정의는 오직 이 파일에서만 관리합니다.
 * 
 * @see Phase 1 작업 2️⃣
 * @see 통합 명세서 제6장 2차 질문 뱅크
 */

import { type ProcessId } from '@/lib/data/process-options'

/**
 * 2차 질문 타입
 */
export type Round2Question = {
  id: string
  processId: ProcessId
  question: string
  options: {
    label: string
    traitDelta: Partial<Record<string, number>>
  }[]
}

/**
 * 2차 질문 뱅크
 * 
 * 통합 명세서 제6장 기준
 * - 공정당 기본 2~3개
 * - Phase 1에서는 최소 구성으로 작성
 */
export const ROUND2_QUESTION_BANK: Round2Question[] = [
  // 주방 (KITCHEN)
  {
    id: 'KITCHEN_Q1',
    processId: 'KITCHEN',
    question: '주방에서 가장 중요한 건?',
    options: [
      { label: '청소·관리 쉬움', traitDelta: { TR_MAINT: -2 } },
      { label: '수납·정리', traitDelta: { TR_STORE: -2 } },
      { label: '가족 소통 오픈형', traitDelta: { TR_HOST: +2 } },
      { label: '감각적 디자인', traitDelta: { TR_VIS: +2 } },
    ],
  },
  {
    id: 'KITCHEN_Q2',
    processId: 'KITCHEN',
    question: '상판·도어 느낌은?',
    options: [
      { label: '무광 단색', traitDelta: { TR_MAINT: -1, TR_VIS: -1 } },
      { label: '우드·스톤 질감', traitDelta: { TR_TONE: -1 } },
      { label: '유광 포인트', traitDelta: { TR_VIS: +2, TR_MAINT: +1 } },
      { label: '튼튼하고 관리 쉬운 것', traitDelta: { TR_MAINT: -1 } },
    ],
  },
  {
    id: 'KITCHEN_Q3',
    processId: 'KITCHEN',
    question: '조리도구 보관 방식은?',
    options: [
      { label: '전부 숨김', traitDelta: { TR_STORE: -2 } },
      { label: '자주 쓰는 건 오픈', traitDelta: { TR_STORE: 0 } },
      { label: '손닿는 곳에 꺼내둠', traitDelta: { TR_STORE: +1 } },
      { label: '빠른 동선 중요', traitDelta: { TR_LIFE: +1 } },
    ],
  },

  // 욕실 (BATH)
  {
    id: 'BATH_Q1',
    processId: 'BATH',
    question: '욕실에서 가장 신경 쓰는 건?',
    options: [
      { label: '청소·곰팡이 관리', traitDelta: { TR_MAINT: -2 } },
      { label: '따뜻하고 편안한 분위기', traitDelta: { TR_TONE: -2 } },
      { label: '호텔처럼 세련된 느낌', traitDelta: { TR_VIS: +1, TR_MAINT: +1 } },
      { label: '욕조·스파 기능', traitDelta: { TR_LIFE: -2 } },
    ],
  },
  {
    id: 'BATH_Q2',
    processId: 'BATH',
    question: '욕실 수납은?',
    options: [
      { label: '전부 숨김', traitDelta: { TR_STORE: -2 } },
      { label: '자주 쓰는 건 오픈', traitDelta: { TR_STORE: +1 } },
      { label: '용품이 적어 큰 수납 불필요', traitDelta: { TR_STORE: +2, TR_LIFE: +1 } },
      { label: '수납보다 디자인', traitDelta: { TR_VIS: +1 } },
    ],
  },
  {
    id: 'BATH_Q3',
    processId: 'BATH',
    question: '욕실 색감은?',
    options: [
      { label: '화이트', traitDelta: { TR_TONE: +1, TR_VIS: -1 } },
      { label: '크림·베이지', traitDelta: { TR_TONE: -1 } },
      { label: '대리석 패턴', traitDelta: { TR_VIS: +2 } },
      { label: '딥톤 고급스럽게', traitDelta: { TR_TONE: +2, TR_VIS: +1 } },
    ],
  },

  // 바닥재 (FLOOR)
  {
    id: 'FLOOR_Q1',
    processId: 'FLOOR',
    question: '바닥재에서 가장 중요한 건?',
    options: [
      { label: '스크래치·오염 내구성', traitDelta: { TR_MAINT: -2 } },
      { label: '따뜻한 느낌·촉감', traitDelta: { TR_TONE: -2 } },
      { label: '미끄럼 방지 안전', traitDelta: { TR_MAINT: +1, TR_HOST: +1 } },
      { label: '개성 있는 패턴·색감', traitDelta: { TR_VIS: +2 } },
    ],
  },
  {
    id: 'FLOOR_Q2',
    processId: 'FLOOR',
    question: '바닥재 질감·소재는?',
    options: [
      { label: '자연스러운 원목', traitDelta: { TR_TONE: -2 } },
      { label: '세라믹·석재 시원함', traitDelta: { TR_TONE: +1 } },
      { label: '관리 편한 강화마루·SPC', traitDelta: { TR_MAINT: -2 } },
      { label: '부드러운 카펫·쿠션감', traitDelta: { TR_TONE: -1 } },
    ],
  },

  // 타일 (TILE)
  {
    id: 'TILE_Q1',
    processId: 'TILE',
    question: '타일 크기 선호는?',
    options: [
      { label: '600×600 이상 대형', traitDelta: { TR_MAINT: -2 } },
      { label: '300×300 중간', traitDelta: { TR_MAINT: -1 } },
      { label: '모자이크·헥사곤 소형', traitDelta: { TR_VIS: +2, TR_MAINT: +1 } },
      { label: '상관없음', traitDelta: {} },
    ],
  },
  {
    id: 'TILE_Q2',
    processId: 'TILE',
    question: '타일 색상·패턴은?',
    options: [
      { label: '단색·무채색', traitDelta: { TR_VIS: -2 } },
      { label: '잔잔한 패턴·자연색', traitDelta: { TR_TONE: -1, TR_VIS: -1 } },
      { label: '대비 강한 패턴·컬러', traitDelta: { TR_VIS: +2 } },
      { label: '상관없음', traitDelta: {} },
    ],
  },

  // 도배/벽지 (WALLPAPER)
  {
    id: 'WALLPAPER_Q1',
    processId: 'WALLPAPER',
    question: '벽면 느낌은?',
    options: [
      { label: '단색 깔끔', traitDelta: { TR_VIS: -1 } },
      { label: '은은한 패턴·질감', traitDelta: { TR_VIS: +1 } },
      { label: '컬러·그림 포인트', traitDelta: { TR_VIS: +2 } },
      { label: '전체 화이트 통일', traitDelta: { TR_TONE: +1 } },
    ],
  },
  {
    id: 'WALLPAPER_Q2',
    processId: 'WALLPAPER',
    question: '벽지 색상 선호는?',
    options: [
      { label: '크림·베이지', traitDelta: { TR_TONE: -1 } },
      { label: '그레이·화이트', traitDelta: { TR_TONE: +1 } },
      { label: '파스텔 색채감', traitDelta: { TR_VIS: +1 } },
      { label: '딥톤 포인트', traitDelta: { TR_VIS: +1, TR_TONE: +1 } },
    ],
  },

  // 가구 (FURNITURE)
  {
    id: 'FURNITURE_Q1',
    processId: 'FURNITURE',
    question: '가구 선택에서 중요한 건?',
    options: [
      { label: '기능·수납', traitDelta: { TR_STORE: -2 } },
      { label: '디자인·분위기', traitDelta: { TR_VIS: +1 } },
      { label: '편안함·촉감', traitDelta: { TR_TONE: -1 } },
      { label: '공간 넓게 최소 가구', traitDelta: { TR_STORE: +2 } },
    ],
  },
  {
    id: 'FURNITURE_Q2',
    processId: 'FURNITURE',
    question: '가구 재질은?',
    options: [
      { label: '우드·라탄 자연소재', traitDelta: { TR_TONE: -2 } },
      { label: '금속·유리 현대적', traitDelta: { TR_TONE: +1 } },
      { label: '패브릭·쿠션감', traitDelta: { TR_TONE: -1 } },
      { label: '가죽 고급소재', traitDelta: { TR_VIS: +1 } },
    ],
  },

  // 창호/샤시 (WINDOW)
  {
    id: 'WINDOW_Q1',
    processId: 'WINDOW',
    question: '창호에서 중요한 건?',
    options: [
      { label: '단열·방음', traitDelta: { TR_MAINT: -1 } },
      { label: '디자인·프레임 색감', traitDelta: { TR_VIS: +1 } },
      { label: '개폐 편리함', traitDelta: { TR_LIFE: +1 } },
      { label: '자동·스마트 기능', traitDelta: { TR_LIFE: -1 } },
    ],
  },
  {
    id: 'WINDOW_Q2',
    processId: 'WINDOW',
    question: '창호 프레임 색상은?',
    options: [
      { label: '화이트·밝은 톤', traitDelta: { TR_TONE: -1 } },
      { label: '그레이·블랙', traitDelta: { TR_TONE: +1 } },
      { label: '우드 컬러', traitDelta: { TR_TONE: -2 } },
      { label: '눈에 띄는 컬러', traitDelta: { TR_VIS: +2 } },
    ],
  },

  // 중문 (DOOR)
  {
    id: 'DOOR_Q1',
    processId: 'DOOR',
    question: '중문에서 중요한 건?',
    options: [
      { label: '단열·방음', traitDelta: { TR_MAINT: -1 } },
      { label: '개방감·디자인', traitDelta: { TR_VIS: +1 } },
      { label: '손쉬운 개폐·동선', traitDelta: { TR_LIFE: +1 } },
      { label: '프라이버시', traitDelta: { TR_HOST: -1 } },
    ],
  },
  {
    id: 'DOOR_Q2',
    processId: 'DOOR',
    question: '중문 프레임 색상·재질은?',
    options: [
      { label: '화이트·크림', traitDelta: { TR_TONE: -1 } },
      { label: '블랙·그레이', traitDelta: { TR_TONE: +1 } },
      { label: '우드 느낌', traitDelta: { TR_TONE: -2 } },
      { label: '금속·컬러 포인트', traitDelta: { TR_VIS: +2 } },
    ],
  },

  // 도장 (PAINT)
  {
    id: 'PAINT_Q1',
    processId: 'PAINT',
    question: '도장에서 중요한 건?',
    options: [
      { label: '오염 방지·관리 쉬움', traitDelta: { TR_MAINT: -2 } },
      { label: '색상·톤', traitDelta: { TR_TONE: -1 } },
      { label: '디자인 포인트', traitDelta: { TR_VIS: +1 } },
      { label: '기능성 (방수, 방오)', traitDelta: { TR_MAINT: -1 } },
    ],
  },

  // 전기 (ELECTRIC)
  {
    id: 'ELECTRIC_Q1',
    processId: 'ELECTRIC',
    question: '전기 공사에서 중요한 건?',
    options: [
      { label: '안전·내구성', traitDelta: { TR_MAINT: -1 } },
      { label: '조명 디자인', traitDelta: { TR_VIS: +1 } },
      { label: '편리한 스마트 기능', traitDelta: { TR_LIFE: -1 } },
      { label: '기본 기능 충실', traitDelta: { TR_MAINT: -1 } },
    ],
  },

  // 필름 (FILM)
  {
    id: 'FILM_Q1',
    processId: 'FILM',
    question: '필름에서 중요한 건?',
    options: [
      { label: '관리 쉬움·내구성', traitDelta: { TR_MAINT: -2 } },
      { label: '디자인·패턴', traitDelta: { TR_VIS: +1 } },
      { label: '기능성 (차단, 보호)', traitDelta: { TR_MAINT: -1 } },
      { label: '가성비', traitDelta: {} },
    ],
  },
]

/**
 * 선택된 공정에 해당하는 질문 필터링
 */
export function getRound2Questions(selectedProcesses: ProcessId[]): Round2Question[] {
  return ROUND2_QUESTION_BANK.filter(q => selectedProcesses.includes(q.processId))
}

/**
 * 질문 ID로 질문 찾기
 */
export function getRound2QuestionById(questionId: string): Round2Question | undefined {
  return ROUND2_QUESTION_BANK.find(q => q.id === questionId)
}


