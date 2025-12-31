// app/api/generate-questions/route.ts
// AI 맞춤형 질문 생성 API v2
// 고객 정보를 분석해서 맞춤형 질문을 직접 생성합니다

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { SpaceInfo } from '@/lib/store/spaceInfoStore'
import type { AnalysisMode, Question, QuestionOption, QuestionImpactType } from '@/lib/data/personalityQuestions'
import { callAIWithLimit } from '@/lib/api/ai-call-limiter'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 모드별 질문 개수
const MODE_QUESTION_COUNT: Record<AnalysisMode, number> = {
  quick: 4,
  standard: 10,
  deep: 18,
  vibe: 7,
}

// Phase 2 + Phase 3: 기능 플래그 (통합 설계)
const featureFlags = {
  answerUncertainty: true,   // Phase 2: 답변 곤란 처리 (ON)
  colorPalette: true,        // Phase 3: 색상 파렛트 (ON)
}

// AI가 응답할 때의 원시 타입 정의
interface AIQuestionOptionRaw {
  id?: string
  text?: string
  value?: string
  icon?: string
}

interface AIQuestionRaw {
  id?: string
  text?: string
  options?: AIQuestionOptionRaw[]
  category?: string
  goal?: string
  // Phase 0: AI가 제공할 수 있는 메타데이터 (선택적)
  referencedFields?: string[]
  impactType?: string
  allowIfMissingOnly?: boolean
}

interface AIResponseRaw {
  questions?: AIQuestionRaw[]
  reason?: string
}

function buildCustomerProfile(spaceInfo: SpaceInfo): string {
  // 고객 정보를 사람이 읽기 좋은 한국어 요약으로 정리
  // "미입력" 대신 해당 정보가 있을 때만 표시하여 AI가 활용하기 쉽게 함
  const parts: string[] = []
  
  // 주거 정보 (항상 있음)
  parts.push(`주거 정보:
- 주거형태: ${spaceInfo.housingType}
- 평수: ${spaceInfo.pyeong}평 (약 ${spaceInfo.squareMeter}㎡)
- 방 개수: ${spaceInfo.rooms}개
- 욕실: ${spaceInfo.bathrooms}개`)

  // 가족 구성 (있을 때만 표시)
  const familyParts: string[] = []
  if (spaceInfo.familySizeRange || spaceInfo.totalPeople) {
    if (spaceInfo.familySizeRange) {
      familyParts.push(`- 가족 규모: ${spaceInfo.familySizeRange}`)
    }
    if (spaceInfo.totalPeople) {
      familyParts.push(`- 총 인원: ${spaceInfo.totalPeople}명`)
    }
    if (spaceInfo.ageRanges && spaceInfo.ageRanges.length > 0) {
      familyParts.push(`- 연령대: ${spaceInfo.ageRanges.join(', ')}`)
    }
    if (spaceInfo.ageGroups) {
      const ageGroupText = Object.entries(spaceInfo.ageGroups)
        .filter(([_, count]) => count > 0)
        .map(([age, count]) => `${age} ${count}명`)
        .join(', ')
      if (ageGroupText) {
        familyParts.push(`- 연령대별 인원수: ${ageGroupText}`)
      }
    }
    if (familyParts.length > 0) {
      parts.push(`가족 구성:\n${familyParts.join('\n')}`)
    }
  }

  // 추가 정보 (있을 때만 표시, 매우 중요!)
  if (spaceInfo.additionalNotes && spaceInfo.additionalNotes.trim()) {
    parts.push(`추가 정보 (반드시 질문에 활용하세요!):
- ${spaceInfo.additionalNotes.trim()}`)
  }

  // 라이프스타일 (있을 때만 표시)
  if (spaceInfo.lifestyleTags && spaceInfo.lifestyleTags.length > 0) {
    parts.push(`라이프스타일:
- ${spaceInfo.lifestyleTags.join('\n- ')}`)
  }

  // 예산 정보 (있을 때만 표시)
  const budgetParts: string[] = []
  if (spaceInfo.budget && spaceInfo.budget !== 'unknown') {
    budgetParts.push(`- 예산 범위: ${spaceInfo.budget}`)
  }
  if (spaceInfo.budgetAmount) {
    budgetParts.push(`- 예산 금액: ${spaceInfo.budgetAmount}만원`)
  }
  if (spaceInfo.livingPurpose && spaceInfo.livingPurpose !== '입력안함') {
    budgetParts.push(`- 거주 목적: ${spaceInfo.livingPurpose}`)
  }
  if (spaceInfo.livingYears) {
    budgetParts.push(`- 예상 거주 기간: ${spaceInfo.livingYears}년`)
  }
  if (budgetParts.length > 0) {
    parts.push(`예산 및 거주 계획:\n${budgetParts.join('\n')}`)
  }

  return parts.join('\n\n')
}

// 모드별 설명을 프롬프트에 전달하기 위한 헬퍼 (6개 묶음 기준으로 수정)
function getModeDescription(mode: AnalysisMode, targetCount: number): string {
  switch (mode) {
    case 'quick':
      return `- quick 모드: 총 ${targetCount}문항.
- 6개 묶음(가족 구성, 생활 패턴, 수납·정리, 청소·관리, 감성·분위기, 불편·걱정) 중에서 "핵심만" 빠르게 파악할 수 있는 질문 위주로 구성합니다.
- 각 묶음에서 가장 중요한 질문을 우선 선택해 주세요.`

    case 'standard':
      return `- standard 모드: 총 ${targetCount}문항.
- 6개 묶음을 비교적 고르게 다루어, 전반적인 인테리어 성향을 균형 있게 파악합니다.
- 특정 묶음에 치우치지 않도록 해주세요.`

    case 'deep':
      return `- deep 모드: 총 ${targetCount}문항.
- 6개 묶음을 모두 다루되, 생활 패턴(lifestyle), 수납·정리(storage), 청소·관리(cleaning)에 조금 더 많은 비중을 둡니다.
- 고객의 생활 패턴, 실제 사용성, 관리 편의성까지 깊게 파고드는 질문을 포함합니다.`

    case 'vibe':
      return `- vibe 모드: 총 ${targetCount}문항.
- 감성·분위기(mood) 묶음에 가장 큰 비중을 두고, 나머지 묶음은 가볍게 보조적으로 확인합니다.
- 집을 "어떤 감정, 어떤 영화, 어떤 여행 스타일"로 느끼고 싶은지 등 감성 중심 질문을 만들어 주세요.`

    default:
      return ''
  }
}

/**
 * Phase 0: 질문 텍스트에서 참조하는 고객 입력 필드 추출
 * 질문 텍스트와 category를 분석하여 어떤 SpaceInfo 필드를 참조하는지 추론
 */
function extractReferencedFields(
  questionText: string,
  spaceInfo: SpaceInfo,
  category?: string
): string[] {
  const referenced: string[] = []
  const textLower = questionText.toLowerCase()
  
  // 평수 관련 키워드
  if (textLower.includes('평') || textLower.includes('평수') || textLower.includes('평형')) {
    referenced.push('pyeong')
  }
  
  // 가족 구성 관련 키워드
  if (
    textLower.includes('가족') || textLower.includes('인원') || textLower.includes('명') ||
    textLower.includes('아이') || textLower.includes('어르신') || textLower.includes('노인') ||
    textLower.includes('영유아') || textLower.includes('초등') || textLower.includes('고령')
  ) {
    if (spaceInfo.totalPeople) referenced.push('totalPeople')
    if (spaceInfo.familySizeRange) referenced.push('familySizeRange')
    if (spaceInfo.ageRanges && spaceInfo.ageRanges.length > 0) referenced.push('ageRanges')
    if (spaceInfo.ageGroups) referenced.push('ageGroups')
  }
  
  // 반려동물 관련
  if (textLower.includes('반려동물') || textLower.includes('펫') || textLower.includes('강아지') || textLower.includes('고양이')) {
    if (spaceInfo.lifestyleTags?.includes('hasPets')) referenced.push('lifestyleTags')
  }
  
  // 주거형태 관련
  if (textLower.includes('아파트') || textLower.includes('주거형태') || textLower.includes('주택')) {
    referenced.push('housingType')
  }
  
  // 방/욕실 개수 관련
  if (textLower.includes('방') && (textLower.includes('개') || textLower.includes('수'))) {
    referenced.push('rooms')
  }
  if (textLower.includes('욕실') && (textLower.includes('개') || textLower.includes('수'))) {
    referenced.push('bathrooms')
  }
  
  // 예산 관련
  if (textLower.includes('예산') || textLower.includes('비용') || textLower.includes('금액')) {
    if (spaceInfo.budget) referenced.push('budget')
    if (spaceInfo.budgetAmount) referenced.push('budgetAmount')
  }
  
  // 거주 목적/기간 관련
  if (textLower.includes('거주') || textLower.includes('거주기간') || textLower.includes('거주 목적')) {
    if (spaceInfo.livingPurpose) referenced.push('livingPurpose')
    if (spaceInfo.livingYears) referenced.push('livingYears')
  }
  
  // 추가 정보 (additionalNotes) 관련
  if (spaceInfo.additionalNotes && spaceInfo.additionalNotes.trim()) {
    // 질문 텍스트에 추가 정보의 키워드가 포함되어 있으면 참조로 간주
    const notesLower = spaceInfo.additionalNotes.toLowerCase()
    const notesKeywords = notesLower.split(/\s+/)
    const hasNotesReference = notesKeywords.some(keyword => 
      keyword.length > 2 && textLower.includes(keyword)
    )
    if (hasNotesReference) {
      referenced.push('additionalNotes')
    }
  }
  
  return [...new Set(referenced)] // 중복 제거
}

/**
 * Phase 0: category와 goal을 기반으로 impactType 추론
 */
function inferImpactType(category?: string, goal?: string): QuestionImpactType {
  if (!category && !goal) return 'NONE'
  
  const categoryLower = category?.toLowerCase() || ''
  const goalLower = goal?.toLowerCase() || ''
  const combined = `${categoryLower} ${goalLower}`
  
  // 견적 금액에 영향 (PRICE)
  if (
    combined.includes('예산') || combined.includes('비용') || combined.includes('금액') ||
    combined.includes('가격') || combined.includes('등급') || combined.includes('자재')
  ) {
    return 'PRICE'
  }
  
  // 공정 수/종류에 영향 (PROCESS)
  if (
    combined.includes('공정') || combined.includes('공사') || combined.includes('시공') ||
    combined.includes('철거') || combined.includes('마감') || combined.includes('수납') ||
    combined.includes('주방') || combined.includes('욕실') || combined.includes('거실')
  ) {
    return 'PROCESS'
  }
  
  // 옵션 분기에 영향 (OPTION)
  if (
    combined.includes('옵션') || combined.includes('선택') || combined.includes('분기') ||
    combined.includes('타일') || combined.includes('바닥') || combined.includes('조명') ||
    combined.includes('문') || combined.includes('창호')
  ) {
    return 'OPTION'
  }
  
  // 기본값: 영향 없음
  return 'NONE'
}

/**
 * Phase 0: allowIfMissingOnly 판단
 * 
 * 의미:
 * - true: 참조 필드가 비어있을 때만 질문 허용 (이미 입력된 정보 재질문 방지)
 * - false: 값이 있어도 추가 확인 필요 (추가 검증 질문)
 * 
 * Phase 0에서는 기본값 true로 설정 (Phase 1에서 실제 필터링 로직 구현)
 */
function determineAllowIfMissingOnly(referencedFields: string[]): boolean {
  // Phase 0: 기본값 true (자리만 확보)
  // Phase 1에서 실제 필터링 로직 구현 예정:
  // - referencedFields가 비어있으면 true
  // - referencedFields가 있으면, spaceInfo에서 해당 필드 값 확인 후 판단
  return true
}

/**
 * Phase 1: 질문 필터링 및 우선순위 정렬
 * 
 * 처리 순서 (고정):
 * 1. 필터링: 중복/불필요 질문 제거
 * 2. 필터링: 고객 입력 이미 존재하는 질문 제거
 * 3. 필터링: 영향 없는 질문 제거
 * 4. 정렬: 영향도 기준 정렬
 * 5. 제한: 최대 6개로 제한
 */
function filterAndRankQuestions(
  questions: Question[],
  spaceInfo: SpaceInfo
): Question[] {
  console.log(`🔍 Phase 1: 필터링 시작 (입력: ${questions.length}개 질문)`)
  
  // 1단계: 필터링 - referencedFields 기반 제거
  // 규칙: referencedFields가 존재하고, 해당 필드가 spaceInfo에 이미 값이 있으면 제거
  const filteredByReferencedFields = questions.filter((q) => {
    if (!q.referencedFields || q.referencedFields.length === 0) {
      return true // 참조 필드가 없으면 유지
    }
    
    // allowIfMissingOnly === false인 경우만 유지 가능 (Phase 1에서는 기본적으로 true이므로 대부분 제거)
    if (q.allowIfMissingOnly === false) {
      return true
    }
    
    // referencedFields 중 하나라도 이미 값이 있으면 제거
    const hasExistingValue = q.referencedFields.some((field) => {
      const value = (spaceInfo as any)[field]
      
      // 값이 존재하는지 확인 (null, undefined, 빈 문자열, 빈 배열 제외)
      if (value === null || value === undefined) return false
      if (typeof value === 'string' && value.trim() === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      if (typeof value === 'object' && Object.keys(value).length === 0) return false
      
      return true // 값이 존재함
    })
    
    if (hasExistingValue) {
      console.log(`  ❌ 제거: 이미 입력된 정보 재질문 (질문 ID: ${q.id}, 참조 필드: ${q.referencedFields.join(', ')})`)
      return false
    }
    
    return true
  })
  
  console.log(`  ✅ referencedFields 필터링 후: ${filteredByReferencedFields.length}개`)
  
  // 2단계: 필터링 - impactType === "NONE" 제거
  const filteredByImpactType = filteredByReferencedFields.filter((q) => {
    if (q.impactType === 'NONE') {
      console.log(`  ❌ 제거: 영향 없는 질문 (질문 ID: ${q.id}, impactType: NONE)`)
      return false
    }
    return true
  })
  
  console.log(`  ✅ impactType 필터링 후: ${filteredByImpactType.length}개`)
  
  // 3단계: 필터링 - referencedFields가 비어있고 impactType도 불명확한 질문 제거
  const filteredByEmpty = filteredByImpactType.filter((q) => {
    const hasNoReferencedFields = !q.referencedFields || q.referencedFields.length === 0
    const hasNoImpact = !q.impactType || q.impactType === 'NONE'
    
    if (hasNoReferencedFields && hasNoImpact) {
      console.log(`  ❌ 제거: 참조 필드 없고 영향도 불명확 (질문 ID: ${q.id})`)
      return false
    }
    return true
  })
  
  console.log(`  ✅ 빈 참조/영향도 필터링 후: ${filteredByEmpty.length}개`)
  
  // 4단계: 정렬 - impactType 우선순위 (PRICE > PROCESS > OPTION)
  const impactTypeOrder: Record<QuestionImpactType, number> = {
    PRICE: 1,
    PROCESS: 2,
    OPTION: 3,
    NONE: 999, // 이미 제거되었지만 타입 안전성을 위해
  }
  
  const sorted = [...filteredByEmpty].sort((a, b) => {
    const aImpact = a.impactType || 'NONE'
    const bImpact = b.impactType || 'NONE'
    const aOrder = impactTypeOrder[aImpact] || 999
    const bOrder = impactTypeOrder[bImpact] || 999
    
    // 동일 impactType 내에서는 순서 유지 (stable sort)
    if (aOrder === bOrder) {
      return 0
    }
    
    return aOrder - bOrder
  })
  
  console.log(`  ✅ 정렬 완료: ${sorted.length}개`)
  
  // 5단계: 제한 - 최대 6개
  const limited = sorted.slice(0, 6)
  
  if (sorted.length > 6) {
    console.log(`  ⚠️ 질문 수 제한: ${sorted.length}개 → ${limited.length}개 (상위 6개만 유지)`)
  }
  
  // Phase 1 FAIL 체크
  if (limited.length > 6) {
    console.error(`  ❌ FAIL: 질문 수가 6개 초과 (${limited.length}개)`)
  }
  
  const hasNoneType = limited.some((q) => q.impactType === 'NONE')
  if (hasNoneType) {
    console.error(`  ❌ FAIL: impactType === NONE 질문이 결과에 포함됨`)
  }
  
  console.log(`✅ Phase 1 완료: 최종 ${limited.length}개 질문`)
  console.log(`  - impactType 분포:`, limited.reduce((acc, q) => {
    const type = q.impactType || 'NONE'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>))
  
  return limited
}

/**
 * Phase 2: 답변 곤란 처리
 * 모든 질문에 "잘 모르겠습니다", "전문가 판단에 맡길게요" 옵션 추가
 */
function addAnswerUncertaintyOptions(questions: Question[]): Question[] {
  if (!featureFlags.answerUncertainty) {
    return questions
  }

  console.log(`🔧 Phase 2: 답변 곤란 옵션 추가 (${questions.length}개 질문)`)

  return questions.map((q) => {
    // 기존 옵션에 이미 있는지 확인 (중복 방지)
    const hasUnknown = q.options.some((opt) => opt.value === 'UNKNOWN' || opt.value === 'answer_unknown')
    const hasExpert = q.options.some((opt) => opt.value === 'EXPERT_ASSUMPTION' || opt.value === 'answer_expert')

    const newOptions = [...q.options]

    // "잘 모르겠습니다" 옵션 추가
    if (!hasUnknown) {
      newOptions.push({
        id: `${q.id}_unknown`,
        text: '잘 모르겠습니다',
        value: 'UNKNOWN',
        icon: '❓',
      })
    }

    // "전문가 판단에 맡길게요" 옵션 추가
    if (!hasExpert) {
      newOptions.push({
        id: `${q.id}_expert`,
        text: '전문가 판단에 맡길게요',
        value: 'EXPERT_ASSUMPTION',
        icon: '👨‍🔧',
      })
    }

    return {
      ...q,
      options: newOptions,
    }
  })
}

/**
 * Phase 3: 색상 관련 질문 필터링 (이중 안전망)
 * Phase 1 필터링 이후에도 추가 안전망으로 색상 질문 제거
 * 
 * 금지 키워드:
 * - 색상, 컬러, 톤, 색
 * - 화이트, 그레이, 베이지 (색상명)
 * - 밝기, 어두움 (색상 관련)
 * - RGB, HEX (색상 코드)
 */
function filterColorQuestions(questions: Question[]): Question[] {
  console.log(`🎨 Phase 3: 색상 질문 필터링 (이중 안전망, 입력: ${questions.length}개)`)

  const colorKeywords = [
    // 기본 키워드
    '색상', '색깔', '컬러', '톤', '색', 'rgb', 'hex', '브랜드 컬러',
    // 질문 형식
    '무슨 색', '어떤 색', '색 선택', '색 골라', '톤 선택', '톤 골라',
    // 색상명
    '화이트', '그레이', '베이지', '블랙', '화이트톤', '그레이톤',
    // 색상 관련 속성
    '밝기', '어두움', '밝은', '어두운', '명도', '채도',
  ]

  const filtered = questions.filter((q) => {
    const textLower = q.text.toLowerCase()
    const hasColorKeyword = colorKeywords.some((keyword) => textLower.includes(keyword))

    if (hasColorKeyword) {
      console.log(`  ❌ 제거: 색상 관련 질문 (질문 ID: ${q.id}, 텍스트: ${q.text.substring(0, 50)}...)`)
      return false
    }

    return true
  })

  console.log(`  ✅ 색상 질문 필터링 후: ${filtered.length}개`)

  return filtered
}

/**
 * Phase 3: 색상 파렛트 생성 조건 평가 (구조만 설계, 실행은 OFF)
 * 조건 충족 여부만 반환 (실제 파렛트 생성은 featureFlags.colorPalette === true일 때만)
 */
function evaluateColorPaletteConditions(spaceInfo: SpaceInfo): {
  satisfied: number
  total: number
  canGenerate: boolean
} {
  if (!featureFlags.colorPalette) {
    return { satisfied: 0, total: 5, canGenerate: false }
  }

  let satisfied = 0
  const total = 5

  // 조건 1: 주거 / 상업 구분
  // housingType은 HousingTypeLabel 타입이므로 항상 유효한 값 (빈 문자열 불가)
  if (spaceInfo.housingType) {
    satisfied++
  }

  // 조건 2: 가족 구성 (영유아 / 노부모)
  // AgeGroups 타입은 영어 키 사용: baby (0-2세), child (3-12세), teen, adult, senior (65세 이상)
  const hasYoungChildren = spaceInfo.ageGroups && (
    (spaceInfo.ageGroups.baby && spaceInfo.ageGroups.baby > 0) ||
    (spaceInfo.ageGroups.child && spaceInfo.ageGroups.child > 0)
  )
  const hasElderly = spaceInfo.ageGroups && (
    (spaceInfo.ageGroups.senior && spaceInfo.ageGroups.senior > 0)
  )
  if (hasYoungChildren || hasElderly) {
    satisfied++
  }

  // 조건 3: 반려동물 여부
  if (spaceInfo.lifestyleTags && spaceInfo.lifestyleTags.includes('hasPets')) {
    satisfied++
  }

  // 조건 4: 사용 목적 (실거주 / 임대)
  if (spaceInfo.livingPurpose && spaceInfo.livingPurpose !== '입력안함') {
    satisfied++
  }

  // 조건 5: 선택된 공정 종류 (주방 / 욕실 / 거실 등)
  // 공정 정보는 별도로 관리되므로, 기본적으로 충족으로 간주
  // (실제로는 공정 선택 단계에서 이미 선택된 공간이 있음)
  satisfied++

  const canGenerate = satisfied >= 2

  console.log(`🎨 Phase 3: 색상 파렛트 조건 평가 - ${satisfied}/${total} 충족, 생성 가능: ${canGenerate}`)

  return { satisfied, total, canGenerate }
}

/**
 * Phase 3: 색상 파렛트 생성 (실제 구현)
 * decisionCriteria와 spaceInfo 기반으로 파렛트 생성
 */
function generateColorPalettes(
  spaceInfo: SpaceInfo,
  decisionCriteria?: string
): Array<{ paletteId: string; main: string; sub: string; accent?: string }> {
  if (!featureFlags.colorPalette) {
    return []
  }

  const evaluation = evaluateColorPaletteConditions(spaceInfo)
  if (!evaluation.canGenerate) {
    console.log('🎨 Phase 3: 조건 미충족으로 파렛트 생성 안 함')
    return []
  }

  console.log('🎨 Phase 3: 색상 파렛트 생성 시작')

  // decisionCriteria와 spaceInfo 기반으로 파렛트 생성
  const palettes: Array<{ paletteId: string; main: string; sub: string; accent?: string }> = []

  // 기본 파렛트 1개 (항상 생성)
  const basePalette = {
    paletteId: 'palette_1',
    main: '웜 화이트',
    sub: '뉴트럴 그레이',
    accent: '소프트 우드톤',
  }
  palettes.push(basePalette)

  // 조건 충족 수에 따라 2번째 파렛트 생성
  if (evaluation.satisfied >= 3) {
    // decisionCriteria에 따라 다른 파렛트 생성
    let secondPalette: { paletteId: string; main: string; sub: string; accent?: string }
    
    if (decisionCriteria === '아이 안전' || decisionCriteria === '유지관리 부담 최소화') {
      // 밝고 깔끔한 톤
      secondPalette = {
        paletteId: 'palette_2',
        main: '쿨 화이트',
        sub: '라이트 그레이',
        accent: '클린 화이트',
      }
    } else if (decisionCriteria === '정리 스트레스 최소화' || decisionCriteria === '공간 활용 효율') {
      // 중립적이고 실용적인 톤
      secondPalette = {
        paletteId: 'palette_2',
        main: '뉴트럴 베이지',
        sub: '소프트 그레이',
        accent: '딥 그레이',
      }
    } else {
      // 기본 대안 파렛트
      secondPalette = {
        paletteId: 'palette_2',
        main: '쿨 화이트',
        sub: '딥 그레이',
        accent: '모던 블랙',
      }
    }
    
    palettes.push(secondPalette)
  }

  // 최대 2개만 반환
  const finalPalettes = palettes.slice(0, 2)
  console.log(`🎨 Phase 3: 파렛트 생성 완료 (${finalPalettes.length}개)`, finalPalettes)

  return finalPalettes
}

// AI 응답을 우리 서비스에서 사용하는 Question 형태로 안전하게 변환
// Phase 0: 메타데이터 추출 및 추가
function normalizeAIQuestions(
  raw: AIQuestionRaw[], 
  targetCount: number,
  spaceInfo: SpaceInfo
): Question[] {
  const normalized: Question[] = raw
    .filter((q) => q && typeof q.text === 'string' && q.text.trim().length > 0)
    .map((q, questionIndex) => {
      const baseQuestionId = q.id && q.id.trim().length > 0
        ? q.id
        : `ai_q_${questionIndex + 1}`

      const rawOptions = Array.isArray(q.options) ? q.options : []

      // 옵션 4~6개만 사용, 텍스트가 없는 옵션은 제외
      const slicedOptions = rawOptions
        .filter((opt) => opt && typeof opt.text === 'string' && opt.text.trim().length > 0)
        .slice(0, 6)

      // 최소 2개는 있어야 의미 있는 질문으로 간주
      if (slicedOptions.length < 2) {
        return null
      }

      const options: QuestionOption[] = slicedOptions.map((opt, optionIndex) => {
        const optId = opt.id && opt.id.trim().length > 0
          ? opt.id
          : `opt_${questionIndex + 1}_${optionIndex + 1}`

        // value는 분석에서 사용할 코드값이므로, id나 text 기반으로 안전하게 생성
        const valueBase = opt.value && opt.value.trim().length > 0
          ? opt.value
          : opt.id && opt.id.trim().length > 0
            ? opt.id
            : opt.text!

        return {
          id: optId,
          text: opt.text!,
          value: valueBase,
          icon: opt.icon,
        }
      })

      if (options.length === 0) {
        return null
      }

      const question: Question = {
        id: baseQuestionId,
        text: q.text!,
        options,
      }

      return question
    })
    .filter((q): q is Question => q !== null)

  // 목표 개수만큼 자르기 (AI가 더 많이 준 경우)
  return normalized.slice(0, targetCount)
}

// AI 응답에서 JSON 블록만 안전하게 추출
function extractJsonFromContent(content: string): AIResponseRaw {
  console.log('📝 AI 응답 원본:', content.substring(0, 500) + '...')
  
  // 1. 코드 블록 (```json ... ```) 찾기
  const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]) as AIResponseRaw
      if (parsed && typeof parsed === 'object') {
        console.log('✅ 코드 블록에서 JSON 추출 성공')
        return parsed
      }
    } catch (e) {
      console.warn('⚠️ 코드 블록 JSON 파싱 실패, 다른 방법 시도:', e)
    }
  }

  // 2. 중괄호로 시작하는 JSON 블록 찾기 (더 정확한 매칭)
  // 첫 번째 { 부터 시작해서 짝이 맞는 } 까지 찾기
  let braceCount = 0
  let startIndex = -1
  let endIndex = -1

  for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') {
      if (startIndex === -1) {
        startIndex = i
      }
      braceCount++
    } else if (content[i] === '}') {
      braceCount--
      if (braceCount === 0 && startIndex !== -1) {
        endIndex = i
        break
      }
    }
  }

  if (startIndex !== -1 && endIndex !== -1) {
    const jsonString = content.substring(startIndex, endIndex + 1)
    try {
      const parsed = JSON.parse(jsonString) as AIResponseRaw
      if (parsed && typeof parsed === 'object') {
        console.log('✅ 중괄호 매칭으로 JSON 추출 성공')
        return parsed
      }
    } catch (e) {
      console.warn('⚠️ 중괄호 매칭 JSON 파싱 실패:', e)
      // 불완전한 JSON 복구 시도
      try {
        // 마지막 불완전한 객체/배열 닫기
        let fixedJson = jsonString
        let openBraces = (fixedJson.match(/\{/g) || []).length
        let closeBraces = (fixedJson.match(/\}/g) || []).length
        let openBrackets = (fixedJson.match(/\[/g) || []).length
        let closeBrackets = (fixedJson.match(/\]/g) || []).length

        // 닫히지 않은 문자열 따옴표 처리
        fixedJson = fixedJson.replace(/"([^"]*)$/, '"$1"')
        
        // 닫히지 않은 중괄호/대괄호 닫기
        while (openBraces > closeBraces) {
          fixedJson += '}'
          closeBraces++
        }
        while (openBrackets > closeBrackets) {
          fixedJson += ']'
          closeBrackets++
        }

        const parsed = JSON.parse(fixedJson) as AIResponseRaw
        if (parsed && typeof parsed === 'object') {
          console.log('✅ JSON 복구 후 파싱 성공')
          return parsed
        }
      } catch (fixError) {
        console.error('❌ JSON 복구 실패:', fixError)
      }
    }
  }

  // 3. 단순 정규식 시도 (fallback)
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as AIResponseRaw
      if (parsed && typeof parsed === 'object') {
        console.log('✅ 정규식으로 JSON 추출 성공')
        return parsed
      }
    } catch (e) {
      console.error('❌ 정규식 JSON 파싱 실패:', e)
    }
  }

  throw new Error('AI 응답에서 유효한 JSON을 찾을 수 없습니다. 응답이 불완전하거나 형식이 잘못되었습니다.')
}

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY가 설정되지 않았습니다.')
      return NextResponse.json(
        { 
          error: 'OpenAI API 키가 설정되지 않았습니다.',
          message: '.env.local 파일을 확인해주세요.',
        },
        { status: 500 },
      )
    }

    const body = await request.json()
    const { mode, spaceInfo }: { mode: AnalysisMode; spaceInfo: SpaceInfo | null } = body

    // 입력 검증: 모드
    if (!mode) {
      return NextResponse.json(
        { error: '모드가 필요합니다.' },
        { status: 400 },
      )
    }

    // 입력 검증: 집 정보
    if (!spaceInfo) {
      return NextResponse.json(
        { error: '집 정보가 필요합니다.' },
        { status: 400 },
      )
    }

    const targetCount = MODE_QUESTION_COUNT[mode]
    console.log('🤖 AI 질문 생성 시작:', { mode, pyeong: spaceInfo.pyeong, targetCount })

    // 1) 고객 정보 요약 텍스트 생성
    const customerProfile = buildCustomerProfile(spaceInfo)

    // 2) 시스템 프롬프트 (명세서 v1.0 기반 질문 설계 규칙 + JSON 스키마)
    const systemPrompt = `
당신은 인테리어 설계·견적에 필요한 정보를 정확히 수집하는 질문 생성기입니다.
질문의 목적은 오직 정보 수집입니다. UX는 질문 엔진의 책임이 아닙니다.

⚠️ 톤 봉인 규칙 (절대 준수):
- 존댓말만 사용합니다.
- 감탄사, 추임새, 이모티콘, 웃음 표현 전면 금지 ("아", "음", "ㅎㅎ", "괜찮으세요?", "편하게" 등 전부 금지)
- 감정 표현, 공감 문장, 리액션 문장 금지
- 질문은 반드시 한 문장입니다.
- 질문 하나당 정보 하나만 수집합니다.
- 설명, 배경, 예시 문장 포함 금지
- 질문 앞뒤에 다른 문장 추가 금지
- 고객을 배려하거나 안심시키는 문장은 작성하지 않습니다.
- 잡담, 대화 유도 문장은 작성하지 않습니다.
- 오직 "답변을 통해 데이터가 채워지는지"만 고려합니다.

🎯 핵심 미션: Trait(성향 축) 수집을 위한 질문 설계
- 질문 답변은 그대로 쓰지 않고, Trait(성향 축)으로 정리됩니다.
- 각 질문은 1~2개의 Trait을 수집하기 위한 목적을 가져야 합니다.
- 질문은 고객의 느낌·상황을 묻습니다. 전문가 결정을 고객한테 떠넘기지 않습니다.

⚠️ 질문 생성 로직 규칙 (명세서 v1.0):
- 이미 수집된 정보는 다시 질문하지 않습니다.
- 필수 정보가 누락된 경우에만 질문을 생성합니다.
- 질문은 우선순위 순으로 1개씩 생성합니다.

[고객 정보 요약]
${customerProfile}

⚠️ 매우 중요: 고객 정보 활용 규칙
- 위 고객 정보 요약에 표시된 정보만 사용하세요.
- "추가 정보"가 있으면 반드시 질문에 활용하세요! (예: "2살 아기가 있어요" → 안전 관련 질문 생성)
- 평수, 가족 구성, 라이프스타일 태그 등은 질문의 맥락으로 자연스럽게 활용하세요.
- 이미 제공된 정보(평수, 주거형태, 가족 구성 등)를 다시 물어보는 질문은 절대 만들지 마세요.

⚠️ 절대 금지 사항 (명세서 v1.0 기준):
1. 해결책을 선택하게 하는 질문 금지
   ❌ "어떤 바닥재가 좋으신가요?"
   ✅ "아이 때문에 바닥에서 어떤 상황이 가장 걱정되세요?"

2. 전문 용어 최소화
   ❌ "포세린, 강마루"
   ✅ "차갑지만 튼튼한 바닥", "따뜻하지만 잔기스가 생길 수 있는 바닥"

3. 고객이 아는 언어만 사용
   ✅ "미닫이, 여닫이"는 괜찮음
   ❌ "역구배, 설비 코어" 같은 용어는 사용 금지

4. 답이 바로 Trait/Needs로 연결되도록 설계
   - 각 질문은 "이 질문으로 무엇을 판단할지"가 명확해야 함.

5. 실패 판정 기준 (명세서 v1.0):
   - 질문에 감정 표현이 포함되면 실패
   - 질문 앞뒤에 불필요한 문장이 붙으면 실패
   - 한 질문에서 두 가지 정보를 동시에 묻으면 실패
   - 질문이 잡담처럼 느껴지면 실패
   - 질문 톤이 "사람 상담사"처럼 보이면 실패

[질문 설계 축 - 명세서 v1.0 기준]
각 질문은 아래 6개 묶음 중 하나에 해당해야 하며, 각 묶음마다 AI가 질문을 1~2개만 생성하도록 합니다.

⚠️ 질문 순서 고정 (명세서 v1.0):
1. 기본 정보 (주거 유형, 평형, 가족 구성)
2. 공간 사용 정보 (방, 욕실, 주방 사용 방식)
3. 생활 특성 (수납, 청소, 사용 빈도)
4. 예산 및 품질 기대 수준
5. 추가 요구 사항
※ 순서 변경 금지

1. 가족 구성·라이프 스테이지 (family)
   - 3인 가족 / 영유아 / 초등 / 고령자 / 1인 가구 등
   - 목적: 안전 민감도, 수납 필요도, 정리 스트레스 Trait 수집
   - 질문 예: "집에서 아이나 어르신이 다치지 않을까 가장 걱정되는 곳은 어디인가요?"

2. 생활 패턴 (lifestyle)
   - 집에 있는 시간(평일/주말), 재택 여부, 손님 빈도
   - 목적: 동선 중요도, 채광·밝기 중요도 Trait 수집
   - 질문 예: "아침에 가장 분주한 시간대(등원, 출근 준비 등)에 어느 공간에서 가장 붐비나요?"

3. 수납·정리 스트레스 (storage)
   - 짐이 많은지, 정리 스트레스가 어느 정도인지
   - 목적: 수납 필요도, 정리 스트레스 Trait 수집
   - 질문 예: "집에서 가장 정리가 안 돼서 스트레스 받는 공간이 어디인가요?"

4. 청소·관리 여력 (cleaning)
   - 바닥/욕실 청소 자주 하는지, 힘든지, 민감한지
   - 목적: 청소·관리 민감도 Trait 수집
   - 질문 예: "욕실 청소가 힘든 이유에 가장 가까운 것은 무엇인가요?"

5. 감성·분위기 선호 (mood)
   - 밝기, 색감, 분위기(따뜻/차분/호텔식/내추럴 등)
   - 목적: 감성·분위기 중요도 Trait 수집
   - 질문 예: "집에서 가장 중요하게 느끼는 분위기를 하나 고르신다면 어떤 느낌이 가장 가깝나요?"

6. 불편·걱정 포인트 (concerns)
   - 미끄럼, 곰팡이, 소음, 냄새, 결로나 냉기 등
   - 목적: 안전 민감도, 내구성 중요도 Trait 수집
   - 질문 예: "욕실·주방에서 미끄러질까 걱정된 적이 자주 있으세요?"

[질문 생성 공통 규칙 - V3.1 설계서 기준]

⚠️ 매우 중요: 절대 금지 사항
1. 해결책을 선택하게 하는 질문 금지
   ❌ "어떤 타일/강마루/카펫이 좋으신가요?"
   ✅ "아이 때문에 바닥에서 어떤 상황이 가장 걱정되세요?"

2. 전문 용어 사용 금지
   ❌ "포세린, 강마루, 역구배, 설비 코어"
   ✅ "차갑지만 튼튼한 바닥", "따뜻하지만 잔기스가 생길 수 있는 바닥"

3. 고객 정보 재질문 금지
   - 고객 정보 요약에 이미 포함된 정보(평수, 주거형태, 방 개수, 욕실 개수, 가족 구성, 연령대, 라이프스타일 태그, 예산, 거주 목적, 거주 기간 등)를 다시 물어보는 질문 절대 금지
   - 예: 평수가 32평으로 제공되었다면 "몇 평인가요?" 같은 질문 절대 금지
   - 이미 제공된 정보는 질문의 맥락으로만 활용하고, 새로운 Trait을 파악하는 질문만 생성

4. 답이 바로 Trait/Needs로 연결되도록 설계
   - 각 질문은 "이 질문으로 무엇을 판단할지"가 명확해야 함
   - 예: "짐이 너무 많아서 늘 고민" 선택 시 → 수납 필요도 +30, 정리 스트레스 +30
   - 예: "욕실 미끄러움이 자주 걱정된다" → 안전 민감도 +25

1. 각 질문에는 반드시 아래 필드를 포함합니다.
   - category: "family" | "lifestyle" | "storage" | "cleaning" | "mood" | "concerns"
   - goal: 이 질문으로 수집할 Trait(성향 축) 명시 (예: "안전 민감도", "수납 필요도", "정리 스트레스" 등)
   - text: 고객에게 보여줄 실제 질문 문장 (해결책 선택 금지, 느낌·상황 묻기)

2. 질문 설계 원칙 (V3.1 설계서 기준):
   - 각 질문의 text 안에 고객 정보에서 가져온 구체 정보(예: 평수, 주거형태, 가족 구성 등)를 자연스럽게 녹여서 질문하세요.
   - ⚠️ 매우 중요: 반드시 고객 정보 요약에 실제로 제공된 정보만 사용하세요. 존재하지 않는 정보를 임의로 추가하거나 상상하지 마세요.
   - 질문은 고객의 느낌·상황을 묻습니다. 전문가 결정을 고객한테 떠넘기지 않습니다.
   - 각 질문은 1~2개의 Trait을 수집하기 위한 목적을 가져야 합니다.
   - ✅ 추가 정보(additionalNotes)가 있으면 반드시 활용하세요! 예: "2살 아기가 있어요" → 안전 관련 질문 생성
   
   질문 예시 (V3.1 설계서 기준 - 고객 정보 활용):
   - 수납·정리: "25평 아파트에서 3인 가족이 거주하시는데, 집에서 가장 정리가 안 돼서 스트레스 받는 공간이 어디인가요?"
   - 안전: "2살 아기가 계시는 상황에서, 집에서 아이가 다치지 않을까 가장 걱정되는 곳은 어디인가요?"
   - 청소·관리: "욕실 청소가 힘든 이유에 가장 가까운 것은 무엇인가요?" (물때·곰팡이 / 허리·무릎 / 시간 / 신경 안 씀)
   - 동선: "아침에 가장 분주한 시간대(등원, 출근 준비 등)에 어느 공간에서 가장 붐비나요?"
   - 채광·밝기: "25평 아파트에서 집이 전체적으로 어떤 느낌에 더 가깝나요?" (밝고 환한 편 / 낮 괜찮고 저녁 어둡다 / 하루 종일 어둡다)
   - 감성·분위기: "집에서 가장 중요하게 느끼는 분위기를 하나 고르신다면 어떤 느낌이 가장 가깝나요?" (따뜻하고 편안한 / 깔끔하고 호텔 같은 / 자연스럽고 내추럴한 / 심플하고 미니멀한)
   
   ✅ 고객 정보 활용 예시:
   - 평수 정보 있음 → "25평 아파트에서..." 같은 맥락으로 질문 시작
   - 가족 구성 정보 있음 → "3인 가족이 거주하시는데..." 같은 맥락으로 질문 시작
   - 추가 정보 있음 → "2살 아기가 계시는 상황에서..." 같은 맥락으로 질문 시작
   - 라이프스타일 태그 있음 → "재택근무를 하시는 상황에서..." 같은 맥락으로 질문 시작

3. 선택지(options):
   - 각 질문마다 4~6개의 선택지를 생성합니다.
   - 각 선택지는 서로 뚜렷하게 다른 방향성을 가져야 합니다.
   - text: 사용자가 보는 문장
   - value: 나중에 분석에 사용할 코드값 (id 또는 의미 있는 문자열)
   - icon: 그림 이모지 하나 (예: 🛋️, ☀️ 등)

4. 말투/톤 (명세서 v1.0 톤 봉인):
   - 존댓말만 사용합니다.
   - 감탄사, 추임새, 이모티콘, 웃음 표현 전면 금지
   - 감정 표현, 공감 문장, 리액션 문장 금지
   - 질문은 반드시 한 문장입니다.
   - 질문 하나당 정보 하나만 수집합니다.
   - 설명, 배경, 예시 문장 포함 금지
   - 질문 앞뒤에 다른 문장 추가 금지
   - 한 질문에는 하나의 핵심만 묻고, 두 가지 이상을 섞어서 묻지 마세요.

5. JSON 형식:
   - 반드시 유효한 JSON만 반환해야 합니다.
   - JSON 바깥에 설명 문장을 쓰지 마세요.
   - JSON 안의 "reason"에는 전체 질문 구성을 이렇게 만든 이유를 한 줄로 요약하세요.

[응답 형식 (반드시 아래 예시 구조를 따릅니다)]

⚠️ Phase 0 중요: AI는 질문 "후보"만 생성합니다.
- 질문 채택/폐기/우선순위는 코드가 결정합니다.
- 메타데이터(referencedFields, impactType 등)는 선택사항입니다.
- 제공하지 않아도 코드가 자동으로 추론합니다.

{
  "questions": [
    {
      "id": "q1",
      "category": "lifestyle",
      "goal": "고객이 하루 중 가장 많이 사용하는 공간과 패턴을 파악하기 위함",
      "text": "질문 내용 (고객 정보를 반영한 구체적 질문)",
      "options": [
        {
          "id": "opt1",
          "text": "선택지 1",
          "value": "option_value_1",
          "icon": "🏠"
        }
      ],
      "referencedFields": ["totalPeople", "lifestyleTags"],  // 선택사항: 코드가 자동 추론 가능
      "impactType": "PROCESS",  // 선택사항: 코드가 자동 추론 가능
      "allowIfMissingOnly": true  // 선택사항: 코드가 자동 추론 가능
    }
  ],
  "reason": "이 질문 세트를 이렇게 구성한 이유 (한 줄 요약)"
}
`.trim()

    // 3) 사용자 프롬프트 (모드별 전략 + 개수 지시)
    const modeDescription = getModeDescription(mode, targetCount)

    const userPrompt = `
위 고객 정보를 바탕으로 "${mode}" 모드에 적합한 ${targetCount}개의 질문을 설계해주세요.

[모드별 전략]
${modeDescription}

[요청 사항 요약 - V3.1 설계서 기준]
- 총 ${targetCount}개의 질문을 생성합니다.
- 각 질문은 위에서 설명한 6개 묶음 중 하나의 category를 가져야 합니다.
- ⚠️ 절대 금지: 이미 제공된 고객 정보(평수, 주거형태, 방 개수, 욕실 개수, 가족 구성, 연령대, 라이프스타일, 예산, 거주 목적, 거주 기간 등)를 다시 물어보는 질문을 만들지 마세요.
- ⚠️ 매우 중요: 존재하지 않는 정보를 임의로 추가하거나 상상하지 마세요. 고객 정보 요약에 실제로 제공된 정보만 사용하세요.
- ✅ 추가 정보(additionalNotes)가 있으면 반드시 활용하세요! 예: "2살 아기가 있어요" → 안전 관련 질문 생성

🎯 핵심 목표: Trait(성향 축) 수집을 위한 질문 설계
- 질문은 고객의 느낌·상황을 묻습니다. 전문가 결정을 고객한테 떠넘기지 않습니다.
- 각 질문은 1~2개의 Trait을 수집하기 위한 목적을 가져야 합니다.
- 해결책을 선택하게 하는 질문 금지 (예: "어떤 바닥재가 좋으신가요?" ❌)
- 전문 용어 최소화, 고객이 아는 언어만 사용
- 답이 바로 Trait/Needs로 연결되도록 설계
- 고객 정보를 질문 맥락으로 자연스럽게 활용 (예: "25평 아파트에서 3인 가족이 거주하시는데...")

✅ 질문 생성 체크리스트 (명세서 v1.0):
1. 고객 정보 요약에 표시된 정보를 활용했는가?
2. 추가 정보(additionalNotes)가 있으면 활용했는가?
3. 이미 제공된 정보를 다시 물어보지 않았는가?
4. 해결책 선택 질문이 아닌가?
5. 전문 용어를 사용하지 않았는가?
6. 각 질문이 1~2개의 Trait을 수집할 수 있는가?
7. 질문에 감정 표현이 포함되지 않았는가?
8. 질문 앞뒤에 불필요한 문장이 붙지 않았는가?
9. 한 질문에서 두 가지 정보를 동시에 묻지 않았는가?
10. 질문이 잡담처럼 느껴지지 않는가?
11. 질문 톤이 "사람 상담사"처럼 보이지 않는가?

🎯 최종 성공 상태 (명세서 v1.0):
- 질문만 읽어도 데이터 구조가 떠오른다
- 고객이 "대답하기 쉽다"
- 실무자가 "바로 견적/설계에 쓸 수 있다"
- 질문 엔진의 말투가 차갑고 명확하다

⚠️ **중요**: 반드시 위에서 제공한 JSON 형식으로만 응답하세요. JSON이 불완전하거나 잘리면 오류가 발생합니다.
- JSON의 모든 문자열 필드(text, goal 등)는 반드시 따옴표로 닫아주세요.
- JSON의 모든 객체와 배열은 반드시 닫는 중괄호(})와 대괄호(])를 포함해야 합니다.
- 응답은 반드시 완전한 JSON 객체여야 하며, 코드 블록으로 감싸거나 일반 텍스트 없이 순수 JSON만 반환하세요.
`.trim()

    // 4) OpenAI 호출 (명세서 v1.0: gpt-4 사용)
    // Phase 4: AI 호출 래퍼 적용 (enableLimit=false)
    const enableLimit = process.env.NEXT_PUBLIC_AI_RATE_LIMIT === 'true';
    const sessionId = request.headers.get('x-session-id') || undefined;
    
    const completion = await callAIWithLimit({
      sessionId,
      action: 'TRAIT_ANALYSIS',
      prompt: { systemPrompt, userPrompt },
      enableLimit: false, // 🔒 Phase 4: 반드시 false
      aiCall: async () => {
        return await openai.chat.completions.create({
          model: 'gpt-4', // 명세서 v1.0: gpt-4-turbo → 실제 사용 가능: gpt-4
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3, // 명세서 v1.0: 정확한 정보 수집을 위해 낮은 temperature
          max_tokens: 3000,
        });
      },
    });

    const content = completion.choices[0].message.content || '{}'
    console.log('🤖 AI 응답 원본 (전체):', content)
    console.log('📏 AI 응답 길이:', content.length, '자')

    // 5) AI 응답 JSON 파싱
    const aiResponse = extractJsonFromContent(content)
    const rawQuestions = Array.isArray(aiResponse.questions) ? aiResponse.questions : []

    if (!rawQuestions || rawQuestions.length === 0) {
      throw new Error('AI가 질문을 생성하지 못했습니다.')
    }

    // 6) 우리 서비스에서 사용하는 Question 타입으로 정제 (Phase 0: 메타데이터 포함)
    const normalizedQuestions = normalizeAIQuestions(rawQuestions, targetCount, spaceInfo)

    if (normalizedQuestions.length === 0) {
      throw new Error('AI가 유효한 질문을 생성하지 못했습니다.')
    }

    console.log(`✅ AI가 ${normalizedQuestions.length}개 질문 생성/정제 완료`)
    if (aiResponse.reason) {
      console.log('💡 생성 이유:', aiResponse.reason)
    }

    // 7) Phase 1: 질문 필터링 · 우선순위 정렬 · 최대 6개 제한
    let finalQuestions = filterAndRankQuestions(normalizedQuestions, spaceInfo)

    if (finalQuestions.length === 0) {
      console.warn('⚠️ Phase 1 필터링 후 질문이 0개입니다. 최소 1개는 유지하도록 조정합니다.')
      // 최소 1개는 유지 (필터링이 너무 강한 경우 대비)
      const fallbackQuestion = normalizedQuestions[0]
      if (fallbackQuestion) {
        console.log(`  → 대체 질문 사용: ${fallbackQuestion.id}`)
        return NextResponse.json({
          success: true,
          questions: [fallbackQuestion],
          mode,
          targetCount,
          actualCount: 1,
          reason: aiResponse.reason ?? null,
          warning: 'Phase 1 필터링 후 대체 질문 사용',
        })
      }
    }

    // 8) Phase 3: 색상 관련 질문 필터링 (안전망)
    finalQuestions = filterColorQuestions(finalQuestions)

    // 9) Phase 2: 답변 곤란 옵션 추가 (ON)
    finalQuestions = addAnswerUncertaintyOptions(finalQuestions)

    // 10) Phase 3: 색상 파렛트 생성 (ON)
    const colorPaletteEvaluation = evaluateColorPaletteConditions(spaceInfo)
    const colorPalettes = generateColorPalettes(spaceInfo)
    const hasColorPalette = colorPalettes.length > 0

    // Phase 2 FAIL 체크
    const hasUnknownOptions = finalQuestions.some((q) =>
      q.options.some((opt) => opt.value === 'UNKNOWN')
    )
    const hasExpertOptions = finalQuestions.some((q) =>
      q.options.some((opt) => opt.value === 'EXPERT_ASSUMPTION')
    )

    if (featureFlags.answerUncertainty && (!hasUnknownOptions || !hasExpertOptions)) {
      console.error('❌ Phase 2 FAIL: 답변 곤란 옵션이 일부 질문에 누락됨')
    }

    // Phase 3 FAIL 체크
    if (featureFlags.colorPalette) {
      // 색상 질문이 남아있는지 확인
      const hasColorQuestion = finalQuestions.some((q) => {
        const textLower = q.text.toLowerCase()
        const colorKeywords = ['색상', '색깔', '컬러', '톤', '화이트', '그레이', '베이지']
        return colorKeywords.some((keyword) => textLower.includes(keyword))
      })
      
      if (hasColorQuestion) {
        console.error('❌ Phase 3 FAIL: 색상 관련 질문이 노출됨')
      }
    }

    // 11) 프런트로 응답
    return NextResponse.json({
      success: true,
      questions: finalQuestions,
      mode,
      targetCount,
      actualCount: finalQuestions.length,
      reason: aiResponse.reason ?? null,
      // Phase 2 + Phase 3 메타데이터
      metadata: {
        answerUncertaintyEnabled: featureFlags.answerUncertainty,
        colorPaletteEnabled: featureFlags.colorPalette,
        colorPaletteEvaluation: featureFlags.colorPalette ? colorPaletteEvaluation : null,
      },
      // Phase 3: 색상 파렛트 정보 (조건 충족 시만)
      colorPalette: hasColorPalette ? {
        palettes: colorPalettes,
        selectedState: null,  // 프론트엔드에서 선택 후 업데이트
        assumptionRequired: false,  // 프론트엔드에서 UNKNOWN 선택 시 true
      } : undefined,
    })
  } catch (error: unknown) {
    console.error('❌ AI 질문 생성 오류:', error)
    
    // JSON 파싱 오류인 경우 더 자세한 정보 제공
    if (error instanceof SyntaxError) {
      console.error('📄 JSON 파싱 오류 상세:', {
        message: error.message,
        stack: error.stack,
      })
      
      return NextResponse.json(
        {
          error: 'AI가 생성한 질문 형식이 올바르지 않습니다.',
          message: error.message,
          type: 'JSON_PARSE_ERROR',
          suggestion: '다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.',
        },
        { status: 500 },
      )
    }

    // 상세 에러 메시지
    let errorMessage = '질문 생성 중 오류가 발생했습니다.'
    const errorObj = error as { message?: string }

    if (errorObj?.message) {
      if (errorObj.message.includes('API key')) {
        errorMessage = 'OpenAI API 키가 유효하지 않습니다. 환경 변수를 확인해주세요.'
      } else if (errorObj.message.includes('rate limit')) {
        errorMessage = 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      } else if (errorObj.message.includes('JSON')) {
        errorMessage = 'AI 응답 형식(JSON) 파싱에 실패했습니다.'
      } else {
        errorMessage = `오류: ${errorObj.message}`
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        hint: 'OpenAI API 키를 확인하거나 잠시 후 다시 시도해주세요.',
        details: errorObj?.message,
      },
      { status: 500 },
    )
  }
}

