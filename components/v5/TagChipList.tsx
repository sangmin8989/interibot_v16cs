/**
 * Phase 4-3: 태그 칩 리스트 컴포넌트
 * 
 * ⚠️ 절대 원칙:
 * - 읽기 전용 (Read-only)
 * - 태그 재계산 금지
 * - 태그 없는 경우 컴포넌트 숨김 (기본값 생성 금지)
 */

'use client'

interface TagChipListProps {
  tags: string[]
}

/**
 * 태그 → 라벨 매핑 테이블
 * 
 * ⚠️ 하드코딩 허용 (명세서 명시)
 */
const TAG_LABEL_MAP: Record<string, string> = {
  STORAGE_RISK_HIGH: '수납 중요',
  STORAGE_RISK_MEDIUM: '수납 고려',
  OLD_RISK_HIGH: '노후 리스크',
  OLD_RISK_MEDIUM: '노후 주의',
  SHORT_STAY: '단기 거주',
  LONG_STAY: '장기 거주',
  SAFETY_RISK: '안전 우선',
  BUDGET_TIGHT: '예산 절약',
  DECISION_FATIGUE_HIGH: '선택 피로',
  KITCHEN_IMPORTANT: '주방 중요',
  BATHROOM_COMFORT: '욕실 편의',
  STYLE_EXCLUDE: '스타일 제외',
  MAINTENANCE_EASY: '관리 쉬움',
}

/**
 * 태그 칩 리스트
 * 
 * V5 태그를 의미 있는 칩 형태로 표시
 */
export default function TagChipList({ tags }: TagChipListProps) {
  // ⚠️ 절대 원칙: 태그 없는 경우 컴포넌트 숨김
  if (!tags || tags.length === 0) {
    return null
  }

  // 태그를 라벨로 변환 (매핑 테이블 사용)
  const tagLabels = tags
    .map((tag) => ({
      tag,
      label: TAG_LABEL_MAP[tag] || tag,
    }))
    .filter((item) => item.label) // 라벨이 없는 태그는 제외

  // ⚠️ 변환된 라벨이 없으면 컴포넌트 숨김
  if (tagLabels.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">핵심 태그</h3>
      <div className="flex flex-wrap gap-2">
        {tagLabels.map((item, index) => (
          <span
            key={index}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-medium shadow-sm"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}




