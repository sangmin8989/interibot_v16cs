/**
 * Phase 5-2: 최적화 정책 블록 컴포넌트
 * 
 * ⚠️ 절대 원칙:
 * - 읽기 전용 (Read-only)
 * - 정책 재계산 금지
 * - 순서/우선순위 조정 금지
 * - V5 결과 그대로 표시만
 */

'use client'

import type { MaterialPolicy, GradePolicy, ContingencyPolicy } from '@/lib/analysis/v5/estimate/policies'

interface OptimizationPolicyBlockProps {
  materialPolicy: MaterialPolicy[]
  gradePolicy: GradePolicy[]
  contingencyPolicy: ContingencyPolicy[]
}

/**
 * 최적화 정책 블록
 * 
 * 자재/등급/예비비 정책을 상담사가 바로 설명할 수 있게 표시
 */
export default function OptimizationPolicyBlock({
  materialPolicy,
  gradePolicy,
  contingencyPolicy,
}: OptimizationPolicyBlockProps) {
  // ⚠️ 절대 원칙: 읽기 전용
  // 정책 그대로 표시만 수행 (순서/우선순위 조정 금지)

  // ⚠️ 가드 규칙: 데이터 누락 시 해당 블록 숨김
  const hasAnyPolicy = materialPolicy.length > 0 || gradePolicy.length > 0 || contingencyPolicy.length > 0

  if (!hasAnyPolicy) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">견적 최적화 정책</h2>

      <div className="space-y-6">
        {/* 자재 방향 */}
        {materialPolicy.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>📦</span>
              <span>자재 선택 방향</span>
            </h3>
            <div className="space-y-2">
              {materialPolicy.map((policy, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400">
                  <p className="text-gray-800 leading-relaxed">{policy.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 등급 방향 */}
        {gradePolicy.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>⭐</span>
              <span>등급 선택 방향</span>
            </h3>
            <div className="space-y-2">
              {gradePolicy.map((policy, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-400">
                  <p className="text-gray-800 leading-relaxed">{policy.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 예비비/리스크 */}
        {contingencyPolicy.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>⚠️</span>
              <span>예비비/리스크 고려사항</span>
            </h3>
            <div className="space-y-2">
              {contingencyPolicy.map((policy, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-amber-400">
                  <p className="text-gray-800 leading-relaxed">{policy.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}




