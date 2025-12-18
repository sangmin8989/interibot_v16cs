'use client'

/**
 * 인테리봇 AI 종합 분석 페이지 (B안: 스토리텔링 스타일)
 * 고객의 모든 정보를 스토리 형식으로 분석하여 제공
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import StepIndicator from '@/components/onboarding/StepIndicator'
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore'
import { useScopeStore } from '@/lib/store/scopeStore'
import { useProcessStore } from '@/lib/store/processStore'
import { usePersonalityStore } from '@/lib/store/personalityStore'
import { 
  getColorRecommendationsForSpaces,
  type ColorRecommendation 
} from '@/lib/analysis/color-recommendation'
import type { DecisionCriteria } from '@/lib/analysis/decision-criteria'
import type { 
  ColorPalette,
  ColorPaletteState,
  ColorPaletteStatus
} from '@/lib/data/personalityQuestions'
import { 
  Sparkles, CheckCircle2, AlertTriangle, 
  ArrowRight, ArrowLeft, Home, Target, Lightbulb,
  Heart, Wallet, Clock, Star, Quote, ChevronRight, Palette
} from 'lucide-react'
import type { SpaceId } from '@/types/spaceProcess'

// 세부옵션 localStorage 키
const DETAIL_OPTIONS_KEY = 'interibot_detail_options'

// 분석 단계
type AnalysisStage = 'collecting' | 'analyzing' | 'complete' | 'error'

// ============================================================
// Phase 1: 헬퍼 함수 구현 (명세서 2 기반)
// ============================================================

// 전체 공정 카테고리 상수 정의
const ALL_PROCESS_CATEGORIES = [
  '구조 변경',
  '주방 리모델링',
  '욕실 전체 공사',
  '수납 강화',
  '마감 교체',
  '전기 증설 공사'
] as const

// 집중 카테고리 추출 함수
function getFocusedCategory(result: V31AnalysisResult): string {
  // needs에서 level === 'high'인 것 중 가장 우선순위 높은 것
  const highNeeds = result.needs?.filter(n => n.level === 'high') || []
  if (highNeeds.length > 0) {
    const topNeed = highNeeds.sort((a, b) => b.priority - a.priority)[0]
    return topNeed.name || '수납'
  }
  // fallback: processes에서 가장 많이 언급된 카테고리
  if (result.processes && result.processes.length > 0) {
    const categoryCount: Record<string, number> = {}
    result.processes.forEach(p => {
      const cat = p.category || p.name
      categoryCount[cat] = (categoryCount[cat] || 0) + 1
    })
    const topCategory = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0]
    return topCategory || '수납'
  }
  return '수납'
}

// ============================================================
// 집중 기준 선언 구조 (FOCUSED CRITERIA FINAL CURSOR SPEC)
// ============================================================

// 1️⃣ 기준 타입 정의 (고정)
type FocusedCriteria =
  | '아이 안전'
  | '정리 스트레스 최소화'
  | '유지관리 부담 최소화'
  | '공간 활용 효율'
  | '공사 범위 최소화'
  | '예산 통제 우선'
  | '동선 단순화'

// 복합 성향 감지 함수
function hasMultipleHighNeeds(result: V31AnalysisResult): boolean {
  const highNeeds = result.needs?.filter(n => n.level === 'high') || []
  return highNeeds.length > 1
}

// 3️⃣ 기준 결정 함수 (유일한 기준 진입점)
function decideFocusedCriteria(
  result: V31AnalysisResult
): FocusedCriteria {
  const needs = result.needs ?? []
  const highNeeds = needs.filter(n => n.level === 'high')

  // 1) 안전
  if (highNeeds.some(n => (n.name ?? '').includes('안전'))) {
    return '아이 안전'
  }

  // 2) 수납 / 정리
  if (highNeeds.some(n => (n.name ?? '').includes('수납'))) {
    return '정리 스트레스 최소화'
  }

  // 3) 유지관리
  if (
    highNeeds.some(n =>
      (n.name ?? '').includes('유지') ||
      (n.name ?? '').includes('청소') ||
      (n.name ?? '').includes('관리')
    )
  ) {
    return '유지관리 부담 최소화'
  }

  // 4) 동선
  if (highNeeds.some(n => (n.name ?? '').includes('동선'))) {
    return '동선 단순화'
  }

  // 5) 예산
  if (
    highNeeds.some(n =>
      (n.name ?? '').includes('예산') ||
      (n.name ?? '').includes('비용')
    )
  ) {
    return '예산 통제 우선'
  }

  // 6) 공사 범위
  if (
    highNeeds.some(n =>
      (n.name ?? '').includes('범위') ||
      (n.name ?? '').includes('최소')
    )
  ) {
    return '공사 범위 최소화'
  }

  // 7) fallback (비정상 데이터 방어 전용)
  if (!result.needs) {
    return sanitizeCriteriaAsFallback('비정상 데이터')
  }

  return '공간 활용 효율'
}

// 4️⃣ 선언 문장 함수 (단일 문장 / 단일 노출)
function getFocusedDeclaration(
  criteria: FocusedCriteria
): string {
  return `이 집은 ${criteria}을 최우선으로 결정했습니다.`
}

// 5️⃣ 보조 기준 문장 (종속 구조)
function getSecondaryNotice(
  criteria: FocusedCriteria
): string {
  switch (criteria) {
    case '아이 안전':
      return '이 기준에 따라, 수납은 동선을 방해하지 않는 범위로만 반영됩니다.'

    case '정리 스트레스 최소화':
      return '이 기준에 따라, 안전 요소는 일상 동선에 걸리는 위험만 우선 제거하는 방식으로 반영됩니다.'

    case '유지관리 부담 최소화':
      return '이 기준에 따라, 디자인 요소는 청소·관리 부담을 늘리지 않는 선에서만 반영됩니다.'

    case '예산 통제 우선':
      return '이 기준에 따라, 옵션은 공정 추가가 아닌 대체 가능한 범위에서만 반영됩니다.'

    case '동선 단순화':
      return '이 기준에 따라, 수납은 이동 경로를 좁히지 않는 범위로만 반영됩니다.'

    case '공사 범위 최소화':
      return '이 기준에 따라, 개선 요소는 철거·설비 변경 없이 가능한 범위로만 반영됩니다.'

    case '공간 활용 효율':
    default:
      return '이 기준에 따라, 선택 옵션은 공간 손실을 만들지 않는 범위로만 반영됩니다.'
  }
}

// 6️⃣ sanitize 강등 규칙 (fallback 전용)
function sanitizeCriteriaAsFallback(
  criteria: string
): FocusedCriteria {
  console.warn(
    '[FocusedCriteria] 비정상 데이터 감지, fallback 처리:',
    criteria
  )

  return '공간 활용 효율'
}

// 7️⃣ 공정 그룹 분류 함수 (Phase1+ 최소 3그룹)
type ProcessGroup = 'WET' | 'STORAGE_FLOW' | 'FINISH'

function getProcessGroup(name: string): ProcessGroup {
  const n = (name ?? '').toLowerCase()

  if (
    n.includes('욕실') || n.includes('주방') || n.includes('타일') ||
    n.includes('방수') || n.includes('설비') || n.includes('수전') ||
    n.includes('배관') || n.includes('세면') || n.includes('샤워')
  ) {
    return 'WET'
  }

  if (
    n.includes('수납') || n.includes('가구') || n.includes('붙박이') ||
    n.includes('팬트리') || n.includes('중문') || n.includes('가벽') ||
    n.includes('동선') || n.includes('수납장')
  ) {
    return 'STORAGE_FLOW'
  }

  return 'FINISH'
}

// 8️⃣ 공정 설명 생성 함수 (집중 기준 기반 + 공정 그룹 반영)
function getProcessDescription(
  process: { name: string },
  criteria: FocusedCriteria
): string {
  const name = process?.name ?? ''
  const group = getProcessGroup(name)

  switch (criteria) {
    case '아이 안전': {
      if (group === 'WET') {
        return `${name}은 미끄럼·턱·누수 같은 위험 요소를 먼저 줄이기 위해 우선 적용됩니다.`
      }
      if (group === 'STORAGE_FLOW') {
        return `${name}은 아이 이동 경로에서 걸림·충돌 요소를 줄이기 위해 포함됩니다.`
      }
      return `${name}은 손이 자주 닿는 구역의 위험 요소를 줄이기 위해 필요한 마감 공정입니다.`
    }

    case '정리 스트레스 최소화': {
      if (group === 'STORAGE_FLOW') {
        return `${name}은 물건이 쌓이는 지점을 줄이고 정리 동작을 단순하게 만들기 위해 포함됩니다.`
      }
      if (group === 'FINISH') {
        return `${name}은 정리 부담이 늘지 않도록 표면 유지가 쉬운 마감으로 정리하는 공정입니다.`
      }
      return `${name}은 사용 빈도가 높은 구역에서 어질러짐을 줄이기 위해 필요한 공정입니다.`
    }

    case '유지관리 부담 최소화': {
      if (group === 'FINISH') {
        return `${name}은 청소·오염·손상 관리 부담이 커지지 않도록 마감을 안정화하기 위해 포함됩니다.`
      }
      if (group === 'WET') {
        return `${name}은 누수·곰팡이·오염 같은 유지관리 리스크를 줄이기 위해 우선 적용됩니다.`
      }
      return `${name}은 이후 관리 부담을 늘리지 않는 범위에서 정리되는 공정입니다.`
    }

    case '공간 활용 효율': {
      if (group === 'STORAGE_FLOW') {
        return `${name}은 동일 면적에서 수납·배치 효율을 확보하기 위한 핵심 공정입니다.`
      }
      return `${name}은 사용 가능한 면적과 동선 효율을 높이는 방향으로 포함됩니다.`
    }

    case '공사 범위 최소화': {
      return `${name}은 철거·설비 변경을 키우지 않는 범위에서 효과를 확보하기 위해 제한 적용됩니다.`
    }

    case '예산 통제 우선': {
      return `${name}은 공정 추가가 아니라 대체·조정 범위에서 효과를 확보하기 위해 남겼습니다.`
    }

    case '동선 단순화': {
      if (group === 'STORAGE_FLOW') {
        return `${name}은 이동 경로를 막지 않고 이동 동작을 줄이기 위해 포함됩니다.`
      }
      return `${name}은 반복 이동이 생기는 구간을 단순하게 유지하기 위해 필요한 공정입니다.`
    }

    default:
      return `${name}은 현재 기준에 맞춰 우선 적용됩니다.`
  }
}

// 9️⃣ 옵션 그룹 분류 함수 (Phase1+ 최소 3그룹)
type OptionGroup = 'SAFETY_FUNCTIONAL' | 'STORAGE_SPACE' | 'FINISH_AESTHETIC'

function getOptionGroup(name: string): OptionGroup {
  const n = (name ?? '').toLowerCase()

  if (
    n.includes('비데') || n.includes('샤워') || n.includes('안전') ||
    n.includes('손잡이') || n.includes('방수') || n.includes('환풍') ||
    n.includes('led') || n.includes('설비') || n.includes('오븐') ||
    n.includes('정수기') || n.includes('식기세척')
  ) {
    return 'SAFETY_FUNCTIONAL'
  }

  if (
    n.includes('팬트리') || n.includes('냉장고장') || n.includes('키큰장') ||
    n.includes('아일랜드') || n.includes('욕실장') || n.includes('붙박이') ||
    n.includes('수납') || n.includes('장')
  ) {
    return 'STORAGE_SPACE'
  }

  return 'FINISH_AESTHETIC'
}

// 🔟 옵션 설명 생성 함수 (집중 기준 기반 + 옵션 그룹 반영)
function getOptionDescription(
  option: { name: string },
  criteria: FocusedCriteria
): string {
  const name = option?.name ?? ''
  const group = getOptionGroup(name)

  switch (criteria) {
    case '아이 안전': {
      if (group === 'SAFETY_FUNCTIONAL') {
        return `${name}은 아이 동선에서 발생할 수 있는 위험을 직접 줄이기 위해 포함됩니다.`
      }
      if (group === 'STORAGE_SPACE') {
        return `${name}은 아이가 접근하기 어려운 위치에 수납을 고정하여 위험 요소를 줄이기 위해 포함됩니다.`
      }
      return `${name}은 손이 닿는 구역의 위험 요소를 줄이는 방향으로 선택되었습니다.`
    }

    case '정리 스트레스 최소화': {
      if (group === 'STORAGE_SPACE') {
        return `${name}은 물건이 쌓이거나 어질러지는 지점을 줄이기 위해 포함됩니다.`
      }
      if (group === 'FINISH_AESTHETIC') {
        return `${name}은 정리 부담이 늘지 않도록 표면 유지가 쉬운 마감으로 선택되었습니다.`
      }
      return `${name}은 사용 빈도가 높은 구역에서 정리 동작을 단순하게 만들기 위해 포함됩니다.`
    }

    case '유지관리 부담 최소화': {
      if (group === 'FINISH_AESTHETIC') {
        return `${name}은 청소·오염·손상 관리 부담이 커지지 않도록 마감을 안정화하기 위해 포함됩니다.`
      }
      if (group === 'SAFETY_FUNCTIONAL') {
        return `${name}은 유지관리 빈도를 줄이고 기능을 안정적으로 유지하기 위해 포함됩니다.`
      }
      return `${name}은 이후 관리 부담을 늘리지 않는 범위에서 선택되었습니다.`
    }

    case '공간 활용 효율': {
      if (group === 'STORAGE_SPACE') {
        return `${name}은 동일 면적에서 수납·배치 효율을 확보하기 위해 포함됩니다.`
      }
      return `${name}은 사용 가능한 면적과 동선 효율을 높이는 방향으로 선택되었습니다.`
    }

    case '공사 범위 최소화': {
      return `${name}은 구조 변경 없이 효과를 볼 수 있는 범위에서 선택되었습니다.`
    }

    case '예산 통제 우선': {
      return `${name}은 공정 추가가 아니라 대체·조정 범위에서 효과를 확보하기 위해 포함됩니다.`
    }

    case '동선 단순화': {
      if (group === 'STORAGE_SPACE') {
        return `${name}은 이동 경로를 막지 않고 이동 동작을 줄이기 위해 포함됩니다.`
      }
      return `${name}은 반복 이동이 생기는 구간을 단순하게 유지하기 위해 선택되었습니다.`
    }

    default:
      return `${name}은 현재 기준에 맞춰 포함되었습니다.`
  }
}

// 제외된 공정 계산 함수
function getExcludedProcesses(result: V31AnalysisResult): string[] {
  // 포함된 공정 카테고리/이름 추출
  const included = result.processes.map(p => p.category || p.name).filter(Boolean)
  
  // 전체 카테고리에서 포함되지 않은 것만 반환
  return ALL_PROCESS_CATEGORIES.filter(cat => {
    // 부분 매칭도 고려 (예: "주방 리모델링"과 "주방" 매칭)
    return !included.some(inc => 
      inc.includes(cat) || 
      cat.includes(inc) ||
      inc === cat
    )
  })
}

// 공정 포함 여부 판단 함수 (사용자 선택 기반)
function isProcessIncluded(
  category: string, 
  processes: V31AnalysisResult['processes'],
  selectedSpaces?: Array<{ id: string; isSelected: boolean }>
): boolean {
  // ✅ 핵심 수정: 사용자가 선택한 공간을 우선 확인
  if (selectedSpaces) {
    const selectedSpaceIds = selectedSpaces.filter(s => s.isSelected).map(s => s.id)
    
    // 카테고리와 공간 ID 매핑
    const categoryToSpaceMap: Record<string, string[]> = {
      '주방 리모델링': ['kitchen', '주방'],
      '욕실 전체 공사': ['bathroom', '욕실', 'commonBathroom'],
      '수납 강화': ['dressRoom', 'entrance', 'balcony', '수납', '현관', '발코니'],
      '마감 교체': ['living', 'bedroom', 'room', '거실', '침실', '방'],
      '전기 증설 공사': ['living', 'bedroom', 'room', 'kitchen', 'bathroom'], // 모든 공간에서 가능
      '구조 변경': [] // 사용자가 직접 선택할 수 없음
    }
    
    const mappedSpaces = categoryToSpaceMap[category] || []
    
    // ✅ 사용자가 선택한 공간 중에 해당 카테고리의 공간이 있는지 확인
    const hasSelectedSpace = mappedSpaces.some(spaceId => 
      selectedSpaceIds.includes(spaceId) || 
      selectedSpaceIds.some(selected => selected.includes(spaceId) || spaceId.includes(selected))
    )
    
    if (hasSelectedSpace) {
      return true
    }
  }
  
  // Fallback: AI 분석 결과에서 확인 (기존 로직)
  return processes.some(p => {
    const processCategory = p.category || p.name
    return processCategory === category ||
           processCategory.includes(category) ||
           category.includes(processCategory) ||
           p.name.includes(category) ||
           category.includes(p.name)
  })
}

// V3.1 분석 결과 타입
interface V31AnalysisResult {
  summary: {
    title: string
    description: string
  }
  needs: {
    id: string
    name: string
    level: 'high' | 'mid' | 'low'
    levelText: string
    category: 'safety' | 'lifestyle' | 'aesthetic'
    categoryText: string
    reason: string
    priority: number
    icon?: string
  }[]
  processes: {
    id: string
    name: string
    category: string
    priority: 'must' | 'recommended' | 'optional'
    priorityText: string
    reason: string
    relatedNeeds: string[]
    relatedNeedsText: string
  }[]
  explanation: {
    segments: {
      order: number
      title: string
      content: string
      relatedNeeds?: string[]
    }[]
  }
  homeValueScore?: {
    score: number
    reason: string
    investmentValue: string
  }
  lifestyleScores?: {
    storage: number
    cleaning: number
    flow: number
    comment: string
  }
  meta: {
    version: string
    timestamp: string
    executionTime: number
  }
}

// 레거시 분석 결과 타입 (fallback용)
interface LegacyAnalysisResult {
  summary: string
  customerProfile: {
    lifestyle: string
    priorities: string[]
    style: string
  }
  homeValueScore?: {
    score: number
    reason: string
    investmentValue: string
  }
  lifestyleScores?: {
    storage: number
    cleaning: number
    flow: number
    comment: string
  }
  spaceAnalysis: {
    space: string
    recommendation: string
    tips: string[]
    estimatedImpact: string
  }[]
  budgetAdvice: {
    grade: string
    reason: string
    savingTips: string[]
  }
  warnings: string[]
  nextSteps: string[]
}

type AnalysisResult = V31AnalysisResult | LegacyAnalysisResult

// 타입 가드
function isV31Result(result: any): result is V31AnalysisResult {
  return result && 'needs' in result && 'explanation' in result
}

export default function AIRecommendationPage() {
  const router = useRouter()
  
  // 스토어에서 데이터 가져오기
  const { spaceInfo } = useSpaceInfoStore()
  const { selectedSpaces } = useScopeStore()
  // ✅ 헌법 적용: tierSelections 제거
  const { selectedProcessesBySpace } = useProcessStore()
  const personalityAnalysis = usePersonalityStore((state) => state.analysis)
  const vibeData = usePersonalityStore((state) => state.vibeData)
  const hasDecisionCriteria = usePersonalityStore((state) => state.hasDecisionCriteria)
  const decisionCriteria = usePersonalityStore((state) => state.decisionCriteria)
  const decisionCriteriaDeclaration = usePersonalityStore((state) => state.decisionCriteriaDeclaration)
  
  // 상태
  const [stage, setStage] = useState<AnalysisStage>('collecting')
  const [showCriteriaPrompt, setShowCriteriaPrompt] = useState(false)  // 기준 설정 재진입 제안 표시 여부
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('데이터 수집 중...')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detailOptions, setDetailOptions] = useState<any>(null)
  const [colorRecommendations, setColorRecommendations] = useState<ColorRecommendation[]>([])
  
  // Phase 3: 색상 파렛트 상태 (구조만 설계, 실행은 OFF)
  const [colorPaletteState, setColorPaletteState] = useState<ColorPaletteState | null>(null)
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>([])
  
  // Phase 3: 기능 플래그 (백엔드와 동일)
  const featureFlags = {
    colorPalette: true,  // Phase 3: 색상 파렛트 (ON)
  }
  
  /**
   * Phase 3: 색상 파렛트 생성 조건 평가 (백엔드와 동일 로직)
   * 조건 충족 여부만 반환 (실제 파렛트 생성은 featureFlags.colorPalette === true일 때만)
   */
  const evaluateColorPaletteConditions = (): {
    satisfied: number
    total: number
    canGenerate: boolean
  } => {
    if (!featureFlags.colorPalette) {
      return { satisfied: 0, total: 5, canGenerate: false }
    }
    
    let satisfied = 0
    const total = 5
    
    // 조건 1: 주거 / 상업 구분
    if (spaceInfo?.housingType) {
      satisfied++
    }
    
    // 조건 2: 가족 구성 (영유아 / 노부모)
    const hasYoungChildren = spaceInfo?.ageGroups && (
      (spaceInfo.ageGroups.baby && spaceInfo.ageGroups.baby > 0) ||
      (spaceInfo.ageGroups.child && spaceInfo.ageGroups.child > 0)
    )
    const hasElderly = spaceInfo?.ageGroups && (
      (spaceInfo.ageGroups.senior && spaceInfo.ageGroups.senior > 0)
    )
    if (hasYoungChildren || hasElderly) {
      satisfied++
    }
    
    // 조건 3: 반려동물 여부
    if (spaceInfo?.lifestyleTags && spaceInfo.lifestyleTags.includes('hasPets')) {
      satisfied++
    }
    
    // 조건 4: 사용 목적 (실거주 / 임대)
    if (spaceInfo?.livingPurpose && spaceInfo.livingPurpose !== '입력안함') {
      satisfied++
    }
    
    // 조건 5: 선택된 공정 종류 (주방 / 욕실 / 거실 등)
    const selectedSpaceIds = selectedSpaces
      .filter(s => s.isSelected)
      .map(s => s.id) as SpaceId[]
    if (selectedSpaceIds.length > 0) {
      satisfied++
    }
    
    const canGenerate = satisfied >= 2
    
    return { satisfied, total, canGenerate }
  }
  
  /**
   * Phase 3: 색상 파렛트 생성 (실제 구현)
   * decisionCriteria와 spaceInfo 기반으로 파렛트 생성
   */
  const generateColorPalettes = (): ColorPalette[] => {
    if (!featureFlags.colorPalette) {
      return []
    }
    
    const evaluation = evaluateColorPaletteConditions()
    if (!evaluation.canGenerate) {
      console.log('🎨 Phase 3: 조건 미충족으로 파렛트 생성 안 함')
      return []
    }
    
    console.log('🎨 Phase 3: 색상 파렛트 생성 시작')
    
    // decisionCriteria와 spaceInfo 기반으로 파렛트 생성
    const palettes: ColorPalette[] = []
    
    // 기본 파렛트 1개 (항상 생성)
    const basePalette: ColorPalette = {
      id: 'palette_1',
      mainColor: '웜 화이트',
      subColor: '뉴트럴 그레이',
      pointColor: '소프트 우드톤',
    }
    palettes.push(basePalette)
    
    // 조건 충족 수에 따라 2번째 파렛트 생성
    if (evaluation.satisfied >= 3) {
      // decisionCriteria에 따라 다른 파렛트 생성
      let secondPalette: ColorPalette
      
      if (decisionCriteria === '아이 안전' || decisionCriteria === '유지관리 부담 최소화') {
        // 밝고 깔끔한 톤
        secondPalette = {
          id: 'palette_2',
          mainColor: '쿨 화이트',
          subColor: '라이트 그레이',
          pointColor: '클린 화이트',
        }
      } else if (decisionCriteria === '정리 스트레스 최소화' || decisionCriteria === '공간 활용 효율') {
        // 중립적이고 실용적인 톤
        secondPalette = {
          id: 'palette_2',
          mainColor: '뉴트럴 베이지',
          subColor: '소프트 그레이',
          pointColor: '딥 그레이',
        }
      } else {
        // 기본 대안 파렛트
        secondPalette = {
          id: 'palette_2',
          mainColor: '쿨 화이트',
          subColor: '딥 그레이',
          pointColor: '모던 블랙',
        }
      }
      
      palettes.push(secondPalette)
    }
    
    // 최대 2개만 반환
    const finalPalettes = palettes.slice(0, 2)
    console.log(`🎨 Phase 3: 파렛트 생성 완료 (${finalPalettes.length}개)`, finalPalettes)
    
    return finalPalettes
  }

  // 세부옵션 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(DETAIL_OPTIONS_KEY)
      if (saved) {
        setDetailOptions(JSON.parse(saved))
      }
    }
  }, [])
  
  // 기준 없는 결과 화면 최초 진입 시 재진입 제안 표시
  useEffect(() => {
    if (stage === 'complete' && !hasDecisionCriteria && !showCriteriaPrompt) {
      setShowCriteriaPrompt(true)
    }
  }, [stage, hasDecisionCriteria, showCriteriaPrompt])
  
  // 기준 설정 재진입 핸들러
  const handleSetCriteria = () => {
    router.push('/onboarding/personality')
  }

  // 분석 실행
  useEffect(() => {
    if (stage !== 'collecting') return
    
    const runAnalysis = async () => {
      setProgress(10)
      setProgressText(`${spaceInfo?.pyeong || 0}평 구조 분석 중...`)
      await delay(500)
      
      if (!spaceInfo) {
        setError('집 정보가 없습니다. 처음부터 다시 진행해주세요.')
        setStage('error')
        return
      }
      
      setProgress(25)
      setProgressText('가족 구성 및 안전성 체크 중...')
      await delay(500)
      
      const selectedSpaceIds = selectedSpaces
        .filter(s => s.isSelected)
        .map(s => s.name)
      
      if (selectedSpaceIds.length === 0) {
        setError('선택된 공간이 없습니다. 공간 선택부터 다시 진행해주세요.')
        setStage('error')
        return
      }
      
      setProgress(40)
      setProgressText(`${selectedSpaceIds.length}개 공간별 니즈 분석 중...`)
      await delay(500)
      
      setStage('analyzing')
      setProgress(55)
      setProgressText('🤖 AI가 당신만의 인테리어 스토리를 만들고 있어요...')
      await delay(600)
      
      try {
        setProgress(70)
        setProgressText('생활 패턴과 라이프스타일 매칭 중...')
        await delay(500)
        
        const personalityAnswers: Record<string, string> = {}
        if (personalityAnalysis?.answers) {
          personalityAnalysis.answers.forEach(a => {
            personalityAnswers[a.questionId] = a.answer
          })
        }
        
        const requestBody = {
          spaceInfo: {
            housingType: spaceInfo.housingType,
            pyeong: spaceInfo.pyeong,
            rooms: spaceInfo.rooms,
            bathrooms: spaceInfo.bathrooms,
            budget: spaceInfo.budget,
            budgetAmount: spaceInfo.budgetAmount,
            familySizeRange: spaceInfo.familySizeRange,
            ageRanges: spaceInfo.ageRanges,
            ageGroups: spaceInfo.ageGroups, // ✅ 연령대별 구체적 인원수 추가
            lifestyleTags: spaceInfo.lifestyleTags,
            livingPurpose: spaceInfo.livingPurpose,
            livingYears: spaceInfo.livingYears,
            totalPeople: spaceInfo.totalPeople,
            additionalNotes: spaceInfo.additionalNotes, // ✅ 추가 정보 전달
            specialConditions: spaceInfo.specialConditions,
          },
          selectedSpaces: selectedSpaceIds,
          selectedProcessesBySpace: selectedProcessesBySpace || {}, // ✅ 선택된 공정 전달
          // ✅ 헌법 적용: tierSelections 제거
          personality: {
            mode: personalityAnalysis?.mode,
            answers: personalityAnswers,
            vibeData: vibeData || null,
          },
        };
        
        console.log('📤 [AI 분석 페이지] 선택된 공정 데이터:', {
          selectedProcessesBySpace: selectedProcessesBySpace,
          // ✅ 헌법 적용: tierSelections 제거
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ai-recommendation/page.tsx:226',message:'API 요청 데이터 전송',data:{totalPeople:requestBody.spaceInfo.totalPeople,familySizeRange:requestBody.spaceInfo.familySizeRange,lifestyleTags:requestBody.spaceInfo.lifestyleTags,specialConditions:requestBody.spaceInfo.specialConditions,전체spaceInfo:requestBody.spaceInfo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        console.log('📤 [AI 분석 페이지] API 요청 데이터:', {
          평수: requestBody.spaceInfo.pyeong,
          평수타입: typeof requestBody.spaceInfo.pyeong,
          평수값확인: requestBody.spaceInfo.pyeong === spaceInfo?.pyeong ? '일치' : '불일치',
          원본spaceInfo평수: spaceInfo?.pyeong,
          가족수: requestBody.spaceInfo.totalPeople,
          연령대범위: requestBody.spaceInfo.ageRanges,
          연령대인원수: requestBody.spaceInfo.ageGroups,
          생활태그: requestBody.spaceInfo.lifestyleTags,
          추가정보: requestBody.spaceInfo.additionalNotes,
          선택공정: Object.keys(selectedProcessesBySpace || {}).length,
          전체spaceInfo: JSON.stringify(requestBody.spaceInfo),
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ai-recommendation/page.tsx:776',message:'AI 분석 페이지 평수 전달 확인',data:{평수:requestBody.spaceInfo.pyeong,원본평수:spaceInfo?.pyeong,일치여부:requestBody.spaceInfo.pyeong === spaceInfo?.pyeong ? '일치' : '불일치',전체spaceInfo:JSON.stringify(requestBody.spaceInfo)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
        // #endregion
        
        const response = await fetch('/api/analyze/v31', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })
        
        setProgress(85)
        setProgressText('분석 결과 정리 중...')
        await delay(500)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '분석 중 오류가 발생했습니다.')
        }
        
        const data = await response.json()
        
        console.log('✅ V3.1 분석 완료:', data)
        
        setProgress(100)
        setProgressText('완료!')
        await delay(300)
        
        // V3.1 결과인지 확인
        if (data.success && data.result) {
          setAnalysisResult(data.result)
        } else {
          throw new Error('분석 결과 형식이 올바르지 않습니다.')
        }
        setStage('complete')
        
        // ✅ 색상 추천 생성 (기준 있는 경우만)
        if (hasDecisionCriteria && decisionCriteria) {
          const selectedSpaceIds = selectedSpaces
            .filter(s => s.isSelected)
            .map(s => s.id) as SpaceId[]
          
          if (selectedSpaceIds.length > 0) {
            const recommendations = getColorRecommendationsForSpaces(
              decisionCriteria as DecisionCriteria,
              selectedSpaceIds,
              {
                pyeong: spaceInfo?.pyeong || 30,
                ageRanges: spaceInfo?.ageRanges || [],
                lifestyleTags: spaceInfo?.lifestyleTags || []
              }
            )
            setColorRecommendations(recommendations)
            console.log('🎨 색상 추천 생성:', recommendations)
          }
        }
        
        // Phase 3: 색상 파렛트 생성 (구조만 설계, 실행은 OFF)
        if (featureFlags.colorPalette) {
          const palettes = generateColorPalettes()
          setColorPalettes(palettes)
          console.log('🎨 Phase 3: 색상 파렛트 생성:', palettes)
        }
        
      } catch (err: any) {
        console.error('AI 분석 오류:', err)
        setError(err.message || '분석 중 오류가 발생했습니다.')
        setStage('error')
      }
    }
    
    runAnalysis()
  }, [stage, spaceInfo, selectedSpaces, selectedProcessesBySpace, detailOptions, personalityAnalysis, vibeData])

  const [isNavigating, setIsNavigating] = useState(false)
  
  const handleNext = () => {
    // 중복 클릭 방지
    if (isNavigating) {
      console.log('⏳ 이미 이동 중입니다...')
      return
    }
    
    setIsNavigating(true)
    
    // 페이지 이동
    router.push('/onboarding/estimate')
    
    // 이동 완료 후 상태 초기화 (페이지 이동 전까지)
    setTimeout(() => {
      setIsNavigating(false)
    }, 1000)
  }

  const handleBack = () => {
    router.push('/onboarding/detail-options')
  }

  const handleRetry = () => {
    setError(null)
    setStage('collecting')
    setProgress(0)
  }

  // ✅ 영어 → 한글 변환 매핑
  const KOREAN_LABELS: Record<string, string> = {
    // 스타일
    'family': '패밀리',
    'healing': '힐링 내추럴',
    'modern': '모던 미니멀',
    'luxury': '럭셔리',
    'natural': '내추럴',
    'minimal': '미니멀',
    'scandinavian': '북유럽',
    'industrial': '인더스트리얼',
    'hotel': '호텔 라운지',
    'cozy': '코지 워밍',
    'classic': '클래식',
    // 우선순위/포인트
    'lighting': '분위기 조명',
    'finish_quality': '마감 품질',
    'flow': '생활 동선',
    'storage': '수납 공간',
    'natural_light': '자연광',
    'soundproof': '방음/프라이버시',
    'cleaning': '청소 용이성',
    'safety': '안전성',
    'durability': '내구성',
    // 공간
    'kitchen': '주방',
    'bathroom': '욕실',
    'living': '거실',
    'bedroom': '침실',
    'masterBedroom': '안방',
    'room': '방',
    'entrance': '현관',
    'balcony': '발코니',
    'dressRoom': '수납/드레스룸',
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-argen-50/30">
      <StepIndicator currentStep={5} />
      
      <main className="max-w-3xl mx-auto px-4 py-8 pb-32">
        <AnimatePresence mode="wait">
          {/* 분석 중 화면 */}
          {(stage === 'collecting' || stage === 'analyzing') && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              {/* 분석 애니메이션 */}
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-28 h-28 mx-auto mb-8 bg-gradient-to-br from-argen-500 to-argen-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-300/50"
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="text-6xl"
                >
                  ⏳
                </motion.span>
              </motion.div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                인테리봇이 분석 중입니다
              </h1>
              <p className="text-gray-500 mb-8 text-lg">{progressText}</p>
              
              {/* 프로그레스 바 */}
              <div className="max-w-sm mx-auto mb-10">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-argen-500 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">{progress}%</p>
              </div>
              
              {/* 수집 정보 카드 */}
              <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-100 max-w-sm mx-auto">
                <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">분석 중인 정보</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Home className="w-5 h-5 text-argen-500" />
                    <span>{spaceInfo?.pyeong || 0}평 {spaceInfo?.housingType || ''}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Target className="w-5 h-5 text-argen-500" />
                    <span>공간 {selectedSpaces.filter(s => s.isSelected).length}개 선택</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Heart className="w-5 h-5 text-argen-500" />
                    <span>성향 분석 {personalityAnalysis?.mode ? '완료' : '기본'}</span>
                  </div>
                  {spaceInfo?.additionalNotes && spaceInfo.additionalNotes.trim() && (
                    <div className="flex items-start gap-3 text-gray-700 pt-2 border-t border-gray-200">
                      <span className="text-lg">📝</span>
                      <span className="text-sm line-clamp-2">{spaceInfo.additionalNotes}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 에러 화면 */}
          {stage === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">분석 중 문제가 발생했습니다</h1>
              <p className="text-gray-500 mb-8">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  이전 단계로
                </button>
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-argen-500 text-white rounded-xl hover:bg-argen-600"
                >
                  다시 시도
                </button>
              </div>
            </motion.div>
          )}

          {/* 분석 완료 화면 - V3.1 또는 레거시 */}
          {stage === 'complete' && analysisResult && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Phase 2 + Phase 3: 가정 문구 표시 (UNKNOWN, EXPERT_ASSUMPTION, 또는 색상 파렛트 미확정) */}
              {(() => {
                const hasUnknown = personalityAnalysis?.answers?.some(
                  (a) => a.answer === 'UNKNOWN'
                )
                const hasExpertAssumption = personalityAnalysis?.answers?.some(
                  (a) => a.answer === 'EXPERT_ASSUMPTION'
                )
                // Phase 3: 색상 파렛트 "잘 모르겠어요" 선택
                const hasColorPaletteUnknown = featureFlags.colorPalette && colorPaletteState?.status === 'UNKNOWN'
                // Phase 3: 색상 파렛트 미확정 (선택 안 함)
                const isColorPaletteUnconfirmed = featureFlags.colorPalette && 
                  colorPalettes.length > 0 && 
                  (!colorPaletteState || colorPaletteState.status === null)
                
                if (hasUnknown || hasExpertAssumption || hasColorPaletteUnknown || isColorPaletteUnconfirmed) {
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 mb-6"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-amber-900 mb-2">
                            가정 사항 안내
                          </h3>
                          <p className="text-sm text-amber-800 leading-relaxed">
                            색상은 현장 조명, 자재 수급, 샘플 확인 후 최종 확정되며, 현재 단계에서는 범위 기준으로 제안됩니다.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                }
                return null
              })()}
              
              {/* 완료 헤더 */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </motion.div>
                {isV31Result(analysisResult) ? (
                  <>
                    {hasDecisionCriteria && decisionCriteria && decisionCriteriaDeclaration ? (
                      // 기준 있는 경우: Store에 저장된 기준 사용
                      <>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                          선택 기준 선언
                        </h1>
                        <div className="text-base text-gray-700 whitespace-pre-line leading-relaxed">
                          {decisionCriteriaDeclaration}
                        </div>
                        <p className="text-sm text-gray-500 mt-4">
                          구조·설비 공사는 이번 분석에서 제외되었습니다.
                        </p>
                      </>
                    ) : (
                      // 기준 없는 경우: 기준 없는 결과 안내
                      <>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                          분석 결과
                        </h1>
                        <p className="text-sm text-gray-600 mt-2">
                          이 결과는 특정 선택 기준 없이 일반적인 조합으로 구성된 결과입니다.
                        </p>
                        {showCriteriaPrompt && (
                          <div className="mt-4 p-4 bg-argen-50 border-2 border-argen-200 rounded-xl">
                            <p className="text-sm text-gray-700 mb-3">
                              더 정확한 분석을 위해 기준을 먼저 정리하시겠어요?
                            </p>
                            <button
                              onClick={handleSetCriteria}
                              className="w-full px-4 py-2 bg-argen-500 text-white rounded-lg hover:bg-argen-600 transition-colors font-medium"
                            >
                              기준을 먼저 정리하고 다시 보기
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      🎉 AI 분석 완료!
                    </h1>
                    <p className="text-gray-500">
                      {spaceInfo?.pyeong}평 {spaceInfo?.housingType}의 {selectedSpaces.filter(s => s.isSelected).length}개 공간을 분석했습니다
                    </p>
                  </>
                )}
              </div>

              {/* Phase 3: 색상 파렛트 카드 (결과 요약 화면 상단, 조건 충족 시만) */}
              {featureFlags.colorPalette && (() => {
                const evaluation = evaluateColorPaletteConditions()
                if (!evaluation.canGenerate || colorPalettes.length === 0) {
                  return null
                }
                
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg border-2 border-purple-200 mb-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Palette className="w-5 h-5 text-purple-600" />
                      <h2 className="text-lg font-bold text-gray-900">
                        색상 파렛트 제안
                      </h2>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-6">
                      색상은 결정 사항이 아닙니다. 선택 부담을 줄이기 위한 범위 제안입니다.
                    </p>
                    
                    {/* 파렛트 카드 (1~2개만) */}
                    <div className="space-y-4">
                      {colorPalettes.map((palette) => {
                        const isSelected = colorPaletteState?.paletteId === palette.id
                        
                        return (
                          <div
                            key={palette.id}
                            className={`bg-white rounded-xl p-5 border-2 ${
                              isSelected ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-4 mb-4">
                              {/* 메인 컬러 */}
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">메인 컬러</div>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-gray-100 border border-gray-300"></div>
                                  <span className="font-medium text-gray-900">{palette.mainColor}</span>
                                </div>
                              </div>
                              
                              {/* 서브 컬러 */}
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">서브 컬러</div>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 border border-gray-400"></div>
                                  <span className="font-medium text-gray-900">{palette.subColor}</span>
                                </div>
                              </div>
                              
                              {/* 포인트 컬러 (선택) */}
                              {palette.pointColor && (
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500 mb-1">포인트 컬러</div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-200 to-amber-300 border border-amber-400"></div>
                                    <span className="font-medium text-gray-900">{palette.pointColor}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* 고객 선택 버튼 (3개만) */}
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => setColorPaletteState({
                                  status: 'KEEP',
                                  paletteId: palette.id,
                                })}
                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  colorPaletteState?.status === 'KEEP' && colorPaletteState?.paletteId === palette.id
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                이대로 진행
                              </button>
                              
                              <button
                                onClick={() => {
                                  // Phase 3: TONE_ADJUST는 1회만 허용, 2회 이상 요청 시 자동 KEEP 처리
                                  if (colorPaletteState?.status === 'TONE_ADJUST' && colorPaletteState?.paletteId === palette.id) {
                                    // 이미 TONE_ADJUST 선택됨 → 자동 KEEP 처리
                                    setColorPaletteState({
                                      status: 'KEEP',
                                      paletteId: palette.id,
                                    })
                                    console.log('🎨 Phase 3: TONE_ADJUST 2회 요청 → 자동 KEEP 처리')
                                  } else {
                                    setColorPaletteState({
                                      status: 'TONE_ADJUST',
                                      paletteId: palette.id,
                                      toneShift: 'NEUTRAL', // 기본값 (WARM ↔ NEUTRAL ↔ COOL 이동)
                                    })
                                    console.log('🎨 Phase 3: TONE_ADJUST 선택 - 톤 이동만 허용 (1회)')
                                  }
                                }}
                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  colorPaletteState?.status === 'TONE_ADJUST' && colorPaletteState?.paletteId === palette.id
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                톤만 조금 바꾸고 싶어요
                              </button>
                              
                              <button
                                onClick={() => {
                                  setColorPaletteState({
                                    status: 'UNKNOWN',
                                  })
                                  // Phase 2와 연결: 가정 문구 표시 필요
                                }}
                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  colorPaletteState?.status === 'UNKNOWN'
                                    ? 'bg-gray-300 text-gray-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                잘 모르겠어요
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )
              })()}
              
              {/* V3.1 결과 렌더링 */}
              {isV31Result(analysisResult) ? (
                <>
                  {/* V3.1 Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-argen-500 via-argen-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl"
                  >
                    <div className="flex items-center gap-2 mb-4 text-purple-200">
                      <Quote className="w-5 h-5" />
                      <span className="text-sm font-medium">V3.1 인과 구조 기반 분석</span>
                    </div>
                    
                    {hasDecisionCriteria && decisionCriteria ? (
                      // 기준 있는 경우: Store에 저장된 기준 사용
                      <>
                        <h2 className="text-2xl font-bold mb-3">
                          {spaceInfo?.pyeong || 0}평 · {spaceInfo?.totalPeople || spaceInfo?.familySizeRange || 'N'}가구 기준<br />
                          '{decisionCriteria}' 판단 결과입니다.
                        </h2>
                        <p className="text-lg leading-relaxed text-white/95">
                          {decisionCriteria} 기준으로 이번 공정 범위를 정리했습니다.
                        </p>
                      </>
                    ) : (
                      // 기준 없는 경우: 일반적인 결과 안내
                      <>
                        <h2 className="text-2xl font-bold mb-3">
                          {spaceInfo?.pyeong || 0}평 · {spaceInfo?.totalPeople || spaceInfo?.familySizeRange || 'N'}가구 기준<br />
                          일반적인 조합 결과입니다.
                        </h2>
                        <p className="text-lg leading-relaxed text-white/95">
                          특정 선택 기준 없이 구성된 공정 범위입니다.
                        </p>
                      </>
                    )}
                  </motion.div>

                  {/* 집값 방어 점수 + 생활 개선 점수 */}
                  {(analysisResult.homeValueScore || analysisResult.lifestyleScores) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 집값 방어 점수 */}
                      {analysisResult.homeValueScore && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-lg"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                              🏡 집값 방어 점수
                            </h3>
                            <div className="text-2xl text-yellow-500">
                              {'★'.repeat(analysisResult.homeValueScore.score)}
                              {'☆'.repeat(5 - analysisResult.homeValueScore.score)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                            {analysisResult.homeValueScore.reason}
                          </p>
                          <p className="text-xs text-emerald-700 bg-emerald-100 rounded-lg px-3 py-2">
                            💰 {analysisResult.homeValueScore.investmentValue}
                          </p>
                        </motion.div>
                      )}

                      {/* 생활 개선 점수 */}
                      {analysisResult.lifestyleScores && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg"
                        >
                          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            📈 생활 개선 점수
                          </h3>
                          
                          {/* 수납 점수 */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-700">수납</span>
                              <span className="text-sm font-bold text-blue-600">{analysisResult.lifestyleScores.storage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                                style={{ width: `${analysisResult.lifestyleScores.storage}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          {/* 청소 점수 */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-700">청소</span>
                              <span className="text-sm font-bold text-green-600">{analysisResult.lifestyleScores.cleaning}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                                style={{ width: `${analysisResult.lifestyleScores.cleaning}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          {/* 동선 점수 */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-700">동선</span>
                              <span className="text-sm font-bold text-purple-600">{analysisResult.lifestyleScores.flow}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
                                style={{ width: `${analysisResult.lifestyleScores.flow}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-blue-700 bg-blue-100 rounded-lg px-3 py-2 mt-4">
                            ✨ {analysisResult.lifestyleScores.comment}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* V3.1 Needs 카드 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  >
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-argen-500" />
                      핵심 니즈 (Needs)
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysisResult.needs
                        .filter(need => need.level === 'high')
                        .map((need, i) => (
                          <div
                            key={need.id}
                            className={`p-4 rounded-xl border-2 ${
                              need.category === 'safety' 
                                ? 'bg-red-50 border-red-200' 
                                : need.category === 'lifestyle'
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-purple-50 border-purple-200'
                            }`}
                          >
                            <div className="flex items-start gap-3 mb-2">
                              <span className="text-2xl">{need.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-gray-900">{need.name}</h3>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    need.level === 'high' 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {need.levelText}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{need.reason}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    {/* Mid/Low Needs 요약 */}
                    {analysisResult.needs.filter(n => n.level !== 'high').length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                          보조 니즈: {analysisResult.needs
                            .filter(n => n.level !== 'high')
                            .map(n => n.name)
                            .join(', ')}
                        </p>
                      </div>
                    )}
                  </motion.div>

                  {/* V3.1 Explanation (인과 구조 설명) - 기준 있는 경우만 표시 */}
                  {hasDecisionCriteria && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        왜 이런 설계가 나왔나요?
                      </h2>
                      
                      <div className="space-y-6">
                        {/* [1] 이번 분석에서 고려한 것 */}
                        <div>
                          <h3 className="font-bold text-gray-900 mb-3 text-base">이번 분석에서 고려한 것</h3>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                              <span className="text-argen-500 mt-1">•</span>
                              <span>가족 구성</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-argen-500 mt-1">•</span>
                              <span>{getFocusedCategory(analysisResult)} 문제</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-argen-500 mt-1">•</span>
                              <span>사용 빈도 높은 공간</span>
                            </li>
                          </ul>
                        </div>

                        {/* [2] 이번 분석에서 제외한 것 */}
                        <div>
                          <h3 className="font-bold text-gray-900 mb-3 text-base">이번 분석에서 제외한 것</h3>
                          <ul className="space-y-2 text-sm text-gray-700 mb-3">
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span>구조 변경 공사</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span>주방 리모델링</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span>욕실 전체 교체</span>
                            </li>
                          </ul>
                          <p className="text-sm font-semibold text-gray-800 bg-gray-50 rounded-lg p-3 border-l-4 border-argen-500">
                            이번 분석에서는<br />
                            필요하지 않은 공사를 먼저 제외했습니다.
                          </p>
                        </div>

                        {/* [3] 그래서 남은 선택 */}
                        <div>
                          <h3 className="font-bold text-gray-900 mb-3 text-base">그래서 남은 선택</h3>
                          <div className="space-y-2">
                            {analysisResult.processes
                              .filter(p => p.priority === 'must')
                              .map((process, i) => (
                                <div key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-green-600 mt-1">•</span>
                                  <span>{process.name} (필수 선택)</span>
                                </div>
                              ))}
                            {analysisResult.processes
                              .filter(p => p.priority === 'recommended')
                              .map((process, i) => (
                                <div key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-blue-600 mt-1">•</span>
                                  <span>{process.name} (선택 가능)</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 추가 정보 표시 (사용자가 입력한 내용) */}
                  {spaceInfo?.additionalNotes && spaceInfo.additionalNotes.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg border-2 border-purple-200"
                    >
                      <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-xl">📝</span>
                        고객님이 알려주신 추가 정보
                      </h2>
                      <div className="bg-white/80 rounded-xl p-4 border border-purple-100">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {spaceInfo.additionalNotes}
                        </p>
                      </div>
                      <p className="text-xs text-purple-600 mt-3 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        이 정보를 바탕으로 AI가 분석을 진행했습니다
                      </p>
                    </motion.div>
                  )}

                  {/* AI 판단 요약 박스 (남은 선택 섹션 상단) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200 shadow-lg"
                  >
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      🧠 인테리봇 판단 요약
                    </h2>
                    
                    <div className="space-y-2 mb-4">
                      {ALL_PROCESS_CATEGORIES.map((category) => {
                        // ✅ 핵심 수정: 사용자가 선택한 공간을 기반으로 판단
                        const included = isProcessIncluded(category, analysisResult.processes, selectedSpaces)
                        
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ai-recommendation/page.tsx:1590',message:'인테리봇 판단 요약 카테고리 확인',data:{카테고리:category,포함여부:included,선택된공간:selectedSpaces?.filter(s => s.isSelected).map(s => s.id),전체선택공간:JSON.stringify(selectedSpaces)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                        // #endregion
                        
                        return (
                          <div key={category} className="flex items-center gap-3 text-sm">
                            <span className="text-lg">{included ? '⭕' : '❌'}</span>
                            <span className={included ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                              {category}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    
                    <p className="text-sm text-gray-600 pt-4 border-t border-gray-200">
                      이번 조건에서는<br />
                      위 공정들을 검토하지 않아도 충분합니다.
                    </p>
                  </motion.div>

                  {/* V3.1 Processes (남은 선택) */}
                  {(() => {
                    // 기준 있는 경우에만 focusedCriteria 계산
                    const focusedCriteria = hasDecisionCriteria 
                      ? decideFocusedCriteria(analysisResult)
                      : '공간 활용 효율' // fallback (기준 없는 경우에도 타입 안정성을 위해 기본값 사용)
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                      >
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Home className="w-5 h-5 text-blue-600" />
                          남은 선택
                        </h2>
                        
                        {/* 필수 선택 */}
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-red-700 mb-3">필수 선택</h3>
                          <div className="space-y-3">
                            {analysisResult.processes
                              .filter(p => p.priority === 'must')
                              .map((process, i) => (
                                <div key={i} className="p-4 bg-red-50 rounded-xl border border-red-200">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                      {i + 1}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-bold text-gray-900 mb-1">{process.name}</h4>
                                      <p className="text-sm text-gray-600 mb-2">
                                        {hasDecisionCriteria 
                                          ? getProcessDescription(process, focusedCriteria as FocusedCriteria)
                                          : `${process.name}은 선택된 공정입니다.`
                                        }
                                      </p>
                                      <p className="text-xs text-gray-500 mb-1">
                                        다른 공정 없이도 체감 변화가 큽니다.
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        관련 니즈: {process.relatedNeedsText}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                        
                        {/* 선택 가능 */}
                        {analysisResult.processes.filter(p => p.priority === 'recommended').length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-blue-700 mb-3">선택 가능</h3>
                            <div className="space-y-2">
                              {analysisResult.processes
                                .filter(p => p.priority === 'recommended')
                                .map((process, i) => (
                                  <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-blue-600">•</span>
                                      <span className="font-medium text-gray-900">{process.name}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 ml-4">
                                      {hasDecisionCriteria 
                                        ? getProcessDescription(process, focusedCriteria as FocusedCriteria)
                                        : `${process.name}은 선택된 공정입니다.`
                                      }
                                    </p>
                                    <p className="text-xs text-gray-500 ml-4 mt-1">
                                      다른 공정 없이도 체감 변화가 큽니다.
                                    </p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })()}

                  {/* 제외된 공정 접힘 영역 */}
                  {getExcludedProcesses(analysisResult).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                      <details className="cursor-pointer">
                        <summary className="text-lg font-bold text-gray-900 mb-4 list-none">
                          <div className="flex items-center justify-between">
                            <span>이번 분석에서 제외한 공정</span>
                            <ChevronRight className="w-5 h-5 text-gray-400 transition-transform duration-200 group-open:rotate-90" />
                          </div>
                        </summary>
                        
                        <div className="mt-4 space-y-2">
                          {getExcludedProcesses(analysisResult).map((process, i) => (
                            <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <span className="text-gray-700 text-sm">{process}</span>
                            </div>
                          ))}
                        </div>
                        
                        <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200">
                          필요해지면 이후 단계에서 다시 선택할 수 있습니다.
                        </p>
                      </details>
                    </motion.div>
                  )}

                  {/* 색상 범위 제시 섹션 (기준 있는 경우만) */}
                  {hasDecisionCriteria && decisionCriteria && colorRecommendations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg border-2 border-purple-200"
                    >
                      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-purple-600" />
                        색상 선택 범위
                      </h2>
                      
                      <p className="text-sm text-gray-600 mb-6">
                        색상은 정답이 아닙니다. 기준이 색을 줄입니다.
                      </p>
                      
                      {/* 공간별 색상 추천 */}
                      <div className="space-y-6">
                        {colorRecommendations.map((rec, index) => (
                          <div key={index} className="bg-white rounded-xl p-5 border border-purple-100">
                            <h3 className="font-bold text-gray-900 mb-4 text-base">
                              {rec.spaceCategory}
                            </h3>
                            
                            {/* 선택 가능한 색 범위 */}
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-green-700 mb-2">
                                선택 가능한 색 범위
                              </h4>
                              <div className="space-y-2 mb-3">
                                {rec.availableRanges.map((range, i) => (
                                  <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200">
                                    <p className="text-sm text-gray-800 font-medium mb-1">
                                      {range.description}
                                    </p>
                                    {range.examples && range.examples.length > 0 && (
                                      <p className="text-xs text-gray-600">
                                        예시: {range.examples.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                {rec.rangeDescription}
                              </p>
                            </div>
                            
                            {/* 제외 색 */}
                            <div className="pt-4 border-t border-gray-200">
                              <h4 className="text-sm font-semibold text-red-700 mb-2">
                                제외 색
                              </h4>
                              <div className="space-y-2 mb-3">
                                {rec.excludedColors.map((color, i) => (
                                  <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-200">
                                    <p className="text-sm text-gray-800 font-medium">
                                      {color}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                {rec.excludedDescription}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-purple-200">
                        💡 이 범위 안에서 선택하면 결정이 단순해집니다. 색상 선택 결과는 저장되지 않으며, 실제 선택은 시공/상담 단계에서 진행됩니다.
                      </p>
                    </motion.div>
                  )}
                </>
              ) : (
                /* 레거시 또는 범위 밖 - 간단한 fallback */
                <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
                  <h3 className="font-bold text-gray-900 mb-2">⚠️ V3.1 Core Edition 범위 밖</h3>
                  <p className="text-gray-700">
                    현재 설정은 V3.1 Core Edition (20-34평 아파트) 범위를 벗어났습니다.
                    일반 분석 결과를 확인하시려면 기존 API를 사용해주세요.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 하단 네비게이션 */}
      {stage === 'complete' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                이전
              </button>
              <button
                onClick={handleNext}
                disabled={isNavigating}
                aria-label={isNavigating ? '처리 중입니다...' : '견적 확인하기'}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl transition-all duration-200 font-bold shadow-lg relative min-h-[44px] ${
                  isNavigating
                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-70'
                    : 'bg-gradient-to-r from-argen-500 to-argen-600 text-white hover:from-argen-600 hover:to-indigo-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transform hover:brightness-110'
                }`}
                style={!isNavigating ? {} : {}}
              >
                <div className="flex flex-col items-center">
                  {isNavigating ? (
                    <>
                      <span className="text-sm md:text-base flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        처리 중...
                      </span>
                      <span className="text-xs mt-0.5 md:mt-1 opacity-90">잠시만 기다려주세요</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        <span className="text-sm md:text-base">견적 확인하기</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 지연 함수
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
