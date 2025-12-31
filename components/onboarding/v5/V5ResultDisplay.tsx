/**
 * V5 결과 표시 컴포넌트
 * 
 * 명세서 STEP 15: 고객 화면 출력 규칙
 * 
 * 출력 구조:
 * 1. 이번 공사의 핵심 기준 (2가지)
 * 2. 그 기준 때문에 달라진 공정·옵션
 * 3. 선택하지 않았을 때의 리스크 요약
 */

'use client'

import type { V5AnalysisResult } from '@/lib/analysis/v5'

interface V5ResultDisplayProps {
  result: V5AnalysisResult
}

export default function V5ResultDisplay({ result }: V5ResultDisplayProps) {
  // 핵심 기준 추출 (상위 2개 태그 기반)
  const keyCriteria = extractKeyCriteria(result)
  
  // 변경사항 추출
  const changes = extractChanges(result)
  
  // 리스크 요약
  const riskSummary = result.riskMessages.join('\n\n')

  return (
    <div className="space-y-6">
      {/* 핵심 기준 */}
      <div className="bg-gradient-to-r from-argen-500 to-purple-500 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-4">이번 공사의 핵심 기준</h2>
        <div className="space-y-2">
          {keyCriteria.map((criterion, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-2xl">{index === 0 ? '🎯' : '📌'}</span>
              <span className="text-lg font-medium">{criterion}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 변경사항 */}
      {changes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            그 기준 때문에 달라진 공정·옵션
          </h2>
          <div className="space-y-4">
            {changes.map((change, index) => (
              <div
                key={index}
                className="border-l-4 border-argen-500 pl-4 py-2"
              >
                <div className="font-semibold text-gray-900">
                  {change.process}
                </div>
                <div className="text-gray-700 mt-1">{change.change}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {change.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 아르젠 추천 */}
      {result.argenRecommendation.recommend_argen && (
        <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-blue-900 mb-2">
            💡 맞춤 제작 추천
          </h2>
          <p className="text-blue-800 mb-2">
            {result.argenRecommendation.mention}
          </p>
          {result.argenRecommendation.items.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-blue-700 font-medium mb-2">
                추천 품목:
              </p>
              <div className="flex flex-wrap gap-2">
                {result.argenRecommendation.items.map((item, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 리스크 요약 */}
      {riskSummary && (
        <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
          <h2 className="text-xl font-bold text-red-900 mb-3">
            ⚠️ 선택하지 않았을 때의 리스크
          </h2>
          <div className="space-y-3">
            {result.riskMessages.map((message, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 border border-red-200"
              >
                <p className="text-red-900 whitespace-pre-line leading-relaxed">
                  {message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 검증 결과 (개발용, 선택적 표시) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-sm">
          <p className="font-semibold mb-2">검증 결과:</p>
          <p className={result.validation.passed ? 'text-green-600' : 'text-red-600'}>
            {result.validation.passed ? '✅ PASS' : '❌ FAIL'}
          </p>
          {result.validation.reason && (
            <p className="text-gray-600 mt-1">{result.validation.reason}</p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 핵심 기준 추출 (상위 2개 태그 기반)
 */
function extractKeyCriteria(result: V5AnalysisResult): string[] {
  const criteria: string[] = []
  const tags = result.tags.tags

  // 태그별 기준 문구 매핑
  const criteriaMap: Record<string, string> = {
    OLD_RISK_HIGH: '노후 점검',
    OLD_RISK_MEDIUM: '노후 점검',
    STORAGE_RISK_HIGH: '수납 최적화',
    SHORT_STAY: '비용 효율',
    LONG_STAY: '장기 투자',
    SAFETY_RISK: '안전 강화',
    BUDGET_TIGHT: '예산 관리',
    KITCHEN_IMPORTANT: '주방 개선',
    BATHROOM_COMFORT: '욕실 편의성',
    MAINTENANCE_EASY: '관리 편의성',
  }

  // 태그별 상세 문구
  const detailMap: Record<string, (result: V5AnalysisResult) => string> = {
    OLD_RISK_HIGH: (r) => {
      const currentYear = new Date().getFullYear()
      // building_year는 spaceInfo에서 가져와야 하지만, 여기서는 간단히 처리
      return '25년차 노후 점검' // 실제로는 동적 계산 필요
    },
    STORAGE_RISK_HIGH: () => '소형 평형 수납 최적화',
    SHORT_STAY: () => '단기 거주 비용 효율',
    LONG_STAY: () => '장기 거주 품질 투자',
    SAFETY_RISK: () => '안전 강화',
  }

  // 상위 2개 태그 선택
  const topTags = tags.slice(0, 2)

  for (const tag of topTags) {
    if (detailMap[tag]) {
      criteria.push(detailMap[tag](result))
    } else if (criteriaMap[tag]) {
      criteria.push(criteriaMap[tag])
    }
  }

  // 기본값
  if (criteria.length === 0) {
    criteria.push('맞춤 인테리어 설계', '고객 니즈 반영')
  }

  return criteria.slice(0, 2)
}

/**
 * 변경사항 추출
 */
function extractChanges(
  result: V5AnalysisResult
): Array<{ process: string; change: string; reason: string }> {
  const changes: Array<{ process: string; change: string; reason: string }> = []

  // 공정 변경
  for (const pc of result.processChanges.processChanges) {
    const processName = getProcessName(pc.processId)
    const changeText = getChangeText(pc.action)
    changes.push({
      process: processName,
      change: changeText,
      reason: pc.reason,
    })
  }

  // 옵션 변경 (엔진 계약에 맞춤)
  for (const oc of result.processChanges.optionChanges) {
    if (oc.action === 'prioritize') {
      changes.push({
        process: getOptionName(oc.optionId),
        change: '우선 적용',
        reason: oc.reason,
      })
    } else if (oc.action === 'limit' || oc.action === 'hide') {
      changes.push({
        process: getOptionName(oc.optionId),
        change: oc.action === 'limit' ? '제한' : '제외',
        reason: oc.reason,
      })
    }
  }

  return changes
}

/**
 * 공정 이름 변환
 */
function getProcessName(processId: string): string {
  const nameMap: Record<string, string> = {
    waterproof: '방수',
    insulation: '단열',
    window: '창호',
    plumbing: '배관',
    closet: '붙박이장',
    shoeRack: '신발장',
    demolition: '구조변경',
    bathroomSafety: '욕실 안전',
    kitchen: '주방',
  }
  return nameMap[processId] || processId
}

/**
 * 변경 텍스트 변환
 */
function getChangeText(action: string): string {
  const textMap: Record<string, string> = {
    enable: '기본 ON',
    disable: 'OFF',
    recommend: '권장',
    required: '필수 체크',
  }
  return textMap[action] || action
}

/**
 * 옵션 이름 변환
 */
function getOptionName(optionId: string): string {
  const nameMap: Record<string, string> = {
    slipPrevention: '미끄럼 방지',
    handrail: '안전 손잡이',
    thresholdRemoval: '턱 제거',
    bathtub: '욕조',
    easyMaintenance: '관리 쉬운 자재',
  }
  return nameMap[optionId] || optionId
}








