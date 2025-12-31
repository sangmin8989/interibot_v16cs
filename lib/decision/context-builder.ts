// lib/decision/context-builder.ts

import type { DecisionContext, HousingType, BudgetLevel, ResidencePlan } from './types'

// 입력 타입은 기존 코드와 충돌 피하려고 최소 가정만 둡니다.
// (기존 타입 import가 깨질 수 있으니, 여기서는 any-safe로 처리)
type SpaceInfoLike = {
  housingType?: string
  pyeong?: number
  rooms?: number
  bathrooms?: number
  residencePlan?: ResidencePlan
} | null

type FusionLike = {
  tags?: string[]
  finalTags?: string[]
} | null

function normalizeHousingType(v?: string): HousingType {
  if (!v) return 'apartment'
  const s = String(v).toLowerCase()
  if (s.includes('빌라') || s.includes('villa')) return 'villa'
  if (s.includes('오피스텔') || s.includes('officetel')) return 'officetel'
  if (s.includes('단독') || s.includes('주택') || s.includes('house')) return 'house'
  if (s.includes('아파트') || s.includes('apartment')) return 'apartment'
  return 'other'
}

function getTags(fusion: FusionLike): string[] {
  // 프로젝트마다 tags / finalTags가 달라질 수 있으니 둘 다 허용
  const t1 = fusion?.finalTags ?? []
  const t2 = fusion?.tags ?? []
  const merged = [...t1, ...t2].filter(Boolean)
  // 중복 제거
  return Array.from(new Set(merged.map(String)))
}

function inferBudgetLevel(tags: string[]): BudgetLevel {
  // 보수적 기본값 mid
  if (tags.includes('BUDGET_STRICT')) return 'low'
  if (tags.includes('BUDGET_FLEXIBLE')) return 'high'
  return 'mid'
}

export function buildDecisionContext(spaceInfo: SpaceInfoLike, fusionResult: FusionLike): DecisionContext {
  const tags = getTags(fusionResult)

  // residencePlan: v1.1 강제 (미입력 = short)
  const residencePlan: ResidencePlan = spaceInfo?.residencePlan ?? 'short'

  const ctx: DecisionContext = {
    space: {
      housingType: normalizeHousingType(spaceInfo?.housingType),
      pyeong: typeof spaceInfo?.pyeong === 'number' && spaceInfo.pyeong > 0 ? spaceInfo.pyeong : 25,
      rooms: typeof spaceInfo?.rooms === 'number' && spaceInfo.rooms > 0 ? spaceInfo.rooms : 2,
      bathrooms: typeof spaceInfo?.bathrooms === 'number' && spaceInfo.bathrooms > 0 ? spaceInfo.bathrooms : 2,
      residencePlan,
    },
    household: {
      hasKids: tags.includes('HAS_CHILD') || tags.includes('HAS_INFANT') || tags.includes('HAS_TEEN'),
      hasPets: tags.includes('HAS_PET_DOG') || tags.includes('HAS_PET_CAT'),
    },
    personality: {
      maintenanceSensitive: tags.includes('CLEANING_SYSTEM_NEED'),
      budgetSensitive: tags.includes('BUDGET_STRICT'),
      riskAverse: tags.includes('SAFETY_NEED') || tags.includes('OLD_RISK_HIGH'),
    },
    budget: {
      level: inferBudgetLevel(tags),
    },
  }

  return ctx
}
