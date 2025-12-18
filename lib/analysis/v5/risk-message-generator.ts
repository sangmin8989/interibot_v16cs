/**
 * V5 리스크 문구 생성
 * 
 * 명세서 STEP 13: 리스크 문구 생성 규칙
 * 
 * 구조 (3줄 고정):
 * 1. 현재 조건 요약 (1줄)
 * 2. 통계·경험 기반 리스크 (1줄)
 * 3. 이번 공사에서의 의미 (1줄)
 */

import type { BasicInfoInput } from './types'

/**
 * 리스크 문구 템플릿
 */
interface RiskTemplate {
  summary: string
  statistic: string
  meaning: string
}

/**
 * 리스크 문구 템플릿 정의
 */
const RISK_TEMPLATES: Record<string, RiskTemplate> = {
  OLD_RISK_HIGH: {
    summary: '{buildingAge}년차 아파트로, 배관·방수 노후 가능성이 높습니다.',
    statistic: '비슷한 연식의 45%가 철거 시 숨은 하자가 발견됩니다.',
    meaning: '방수·배관 점검을 제외하면 입주 후 누수 위험이 있습니다.',
  },
  OLD_RISK_MEDIUM: {
    summary: '{buildingAge}년차 아파트로, 일부 설비 노후가 시작될 시점입니다.',
    statistic: '15-20년차 아파트의 30%가 배관 문제를 경험합니다.',
    meaning: '방수·단열 점검을 권장합니다.',
  },
  STORAGE_RISK_HIGH: {
    summary: '{pyeong}평에서 수납 스트레스가 자주 발생하신다고 하셨습니다.',
    statistic: '소형 평형은 붙박이장으로 15-20% 공간 효율이 올라갑니다.',
    meaning: '아르젠 맞춤 제작으로 밀리 단위 설계가 가능합니다.',
  },
  SHORT_STAY: {
    summary: '{stayPlan} 거주 계획이 있으시네요.',
    statistic: '구조 변경은 투자 회수가 어려울 수 있습니다.',
    meaning: '마감 위주로 가시면 비용 대비 효과가 높습니다.',
  },
  SAFETY_RISK: {
    summary: '{safetyArea}에서 안전 우려가 있으시다고 하셨습니다.',
    statistic: '가정 내 낙상 사고의 60%가 욕실에서 발생합니다.',
    meaning: '미끄럼 방지, 안전 손잡이는 필수입니다.',
  },
  BUDGET_TIGHT: {
    summary: '예산 초과 시 {cutProcess} 공정을 줄이시겠다고 하셨습니다.',
    statistic: '해당 공정 축소 시 만족도가 20% 하락하는 경향이 있습니다.',
    meaning: '정말 줄여도 괜찮은지 한 번 더 고려해보세요.',
  },
  DECISION_FATIGUE_HIGH: {
    summary: '선택이 어려우시다고 하셨습니다.',
    statistic: '선택지가 많을수록 결정 만족도가 오히려 떨어집니다.',
    meaning: '제가 2-3개로 추려서 보여드리겠습니다.',
  },
}

/**
 * 리스크 문구 생성
 * 
 * @param tag 성향 태그
 * @param context 컨텍스트 정보
 * @returns 리스크 문구 (3줄)
 */
export function generateRiskMessage(
  tag: string,
  context: {
    buildingAge?: number
    pyeong?: number
    stayPlan?: string
    safetyArea?: string
    cutProcess?: string
  }
): string {
  const template = RISK_TEMPLATES[tag]
  if (!template) return ''

  let summary = template.summary
  let statistic = template.statistic
  let meaning = template.meaning

  // 변수 치환
  for (const [key, value] of Object.entries(context)) {
    const placeholder = `{${key}}`
    summary = summary.replace(placeholder, String(value))
    statistic = statistic.replace(placeholder, String(value))
    meaning = meaning.replace(placeholder, String(value))
  }

  return `${summary}\n${statistic}\n${meaning}`
}

/**
 * 여러 태그의 리스크 문구 생성
 */
export function generateRiskMessages(
  tags: string[],
  basicInfo: BasicInfoInput,
  answers: Record<string, string>
): string[] {
  const currentYear = new Date().getFullYear()
  const buildingAge = currentYear - basicInfo.building_year
  const pyeongNum = convertPyeongToNumber(basicInfo.pyeong_range)

  const messages: string[] = []

  for (const tag of tags) {
    const context: Record<string, any> = {}

    switch (tag) {
      case 'OLD_RISK_HIGH':
      case 'OLD_RISK_MEDIUM':
        context.buildingAge = buildingAge
        break

      case 'STORAGE_RISK_HIGH':
        context.pyeong = pyeongNum
        break

      case 'SHORT_STAY':
        context.stayPlan = answers.Q06 || basicInfo.stay_plan
        break

      case 'SAFETY_RISK':
        context.safetyArea = answers.Q08 || '해당 공간'
        break

      case 'BUDGET_TIGHT':
        context.cutProcess = answers.Q09 || '해당'
        break
    }

    const message = generateRiskMessage(tag, context)
    if (message) {
      messages.push(message)
    }
  }

  return messages
}

/**
 * 평형 구간을 숫자로 변환
 */
function convertPyeongToNumber(range: string): number {
  switch (range) {
    case 'under10':
      return 8
    case '11to15':
      return 13
    case '16to25':
      return 20
    case '26to40':
      return 33
    case 'over40':
      return 45
    default:
      return 25
  }
}

