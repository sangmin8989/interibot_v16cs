'use client'

/**
 * 아르젠 3등급 선택 컴포넌트
 * 
 * 등급별 상세 정보 표시 및 선택 기능
 */

import React, { useState } from 'react'
import type { ArgenGrade } from '@/lib/data/gradeSpecs'
import { GRADE_INFO, TOTAL_ESTIMATE_32PY, scaleEstimateByPyeong } from '@/lib/data/gradeSpecs'
import type { GradeRecommendation } from '@/lib/analysis/gradeRecommender'

interface GradeSelectorProps {
  pyeong: number
  recommendedGrade?: ArgenGrade
  recommendation?: GradeRecommendation
  selectedGrade?: ArgenGrade
  onGradeSelect: (grade: ArgenGrade) => void
  showComparison?: boolean
}

export default function GradeSelector({
  pyeong,
  recommendedGrade,
  recommendation,
  selectedGrade,
  onGradeSelect,
  showComparison = false,
}: GradeSelectorProps) {
  const [expandedGrade, setExpandedGrade] = useState<ArgenGrade | null>(
    recommendedGrade || null
  )

  const grades: ArgenGrade[] = ['ESSENTIAL', 'STANDARD', 'OPUS']

  return (
    <div className="w-full space-y-4">
      {/* 추천 등급 표시 */}
      {recommendedGrade && recommendation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-blue-900 mb-2">
                {GRADE_INFO[recommendedGrade].name} 추천
              </h3>
              <p className="text-sm text-blue-800 mb-2">
                {recommendation.reasons[0]}
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-700">
                <span>신뢰도: {recommendation.confidence === 'high' ? '높음' : '보통'}</span>
                <span>•</span>
                <span>점수: {recommendation.score}점</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 등급 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {grades.map((grade) => {
          const gradeInfo = GRADE_INFO[grade]
          const estimate32py = TOTAL_ESTIMATE_32PY[grade]
          const estimate = scaleEstimateByPyeong(estimate32py, pyeong)
          const isRecommended = grade === recommendedGrade
          const isSelected = grade === selectedGrade
          const isExpanded = expandedGrade === grade

          return (
            <div
              key={grade}
              className={`
                relative border-2 rounded-lg p-5 cursor-pointer transition-all
                ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                ${isRecommended ? 'ring-2 ring-blue-300' : ''}
                hover:border-blue-300 hover:shadow-md
              `}
              onClick={() => onGradeSelect(grade)}
            >
              {/* 추천 뱃지 */}
              {isRecommended && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  추천
                </div>
              )}

              {/* 등급 헤더 */}
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">{gradeInfo.nameEn}</div>
                <h3 className="text-xl font-bold text-gray-900">{gradeInfo.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{gradeInfo.concept}</p>
              </div>

              {/* 가격 정보 */}
              <div className="mb-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {estimate.totalCost.toLocaleString()}만원
                </div>
                <div className="text-xs text-gray-500">
                  평당 {Math.round(estimate.totalCost / pyeong).toLocaleString()}만원
                </div>
              </div>

              {/* 타겟 고객 */}
              <div className="text-xs text-gray-600 mb-4">
                {gradeInfo.targetCustomer}
              </div>

              {/* 주요 특징 (간략) */}
              <div className="space-y-1 text-xs text-gray-700">
                {grade === 'ESSENTIAL' && (
                  <>
                    <div>• 필수 공정만 확실하게</div>
                    <div>• 샤시/중문 기존 활용</div>
                    <div>• 실속 있는 구성</div>
                  </>
                )}
                {grade === 'STANDARD' && (
                  <>
                    <div>• 엔지니어드스톤 상판</div>
                    <div>• 이중샤시 추가</div>
                    <div>• 브랜드 가구</div>
                  </>
                )}
                {grade === 'OPUS' && (
                  <>
                    <div>• 세라믹/천연대리석</div>
                    <div>• 시스템창호</div>
                    <div>• 커스텀 가구</div>
                  </>
                )}
              </div>

              {/* 선택 버튼 */}
              <button
                className={`
                  w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
                onClick={(e) => {
                  e.stopPropagation()
                  onGradeSelect(grade)
                }}
              >
                {isSelected ? '선택됨' : '선택하기'}
              </button>

              {/* 상세 보기 토글 */}
              <button
                className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedGrade(isExpanded ? null : grade)
                }}
              >
                {isExpanded ? '▲ 상세 접기' : '▼ 상세 보기'}
              </button>
            </div>
          )
        })}
      </div>

      {/* 상세 정보 (확장) */}
      {expandedGrade && (
        <GradeDetailCard grade={expandedGrade} pyeong={pyeong} />
      )}

      {/* 등급 비교 테이블 */}
      {showComparison && (
        <GradeComparisonTable pyeong={pyeong} />
      )}
    </div>
  )
}

/**
 * 등급 상세 정보 카드
 */
function GradeDetailCard({ grade, pyeong }: { grade: ArgenGrade; pyeong: number }) {
  const gradeInfo = GRADE_INFO[grade]
  const estimate32py = TOTAL_ESTIMATE_32PY[grade]
  const estimate = scaleEstimateByPyeong(estimate32py, pyeong)

  return (
    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-6">
      <h4 className="font-bold text-lg mb-4">{gradeInfo.name} 상세 정보</h4>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <div className="text-xs text-gray-500 mb-1">직접공사비</div>
          <div className="text-lg font-semibold">{estimate.directCost.toLocaleString()}만원</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">간접비 (8%)</div>
          <div className="text-lg font-semibold">{estimate.indirectCost.toLocaleString()}만원</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">총 공사비</div>
          <div className="text-lg font-semibold text-blue-600">
            {estimate.totalCost.toLocaleString()}만원
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">평당 비용</div>
          <div className="text-lg font-semibold">
            {Math.round(estimate.totalCost / pyeong).toLocaleString()}만원/평
          </div>
        </div>
      </div>

      {/* 공정별 상세 */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">철거</span>
          <span className="font-medium">{estimate.demolition.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">주방</span>
          <span className="font-medium">{estimate.kitchen.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">욕실 (2개소)</span>
          <span className="font-medium">{estimate.bathroom.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">바닥재</span>
          <span className="font-medium">{estimate.flooring.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">도배</span>
          <span className="font-medium">{estimate.wallpaper.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">샤시/창호</span>
          <span className="font-medium">{estimate.window.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">중문</span>
          <span className="font-medium">{estimate.slidingDoor.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">도어</span>
          <span className="font-medium">{estimate.door.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">전기/조명</span>
          <span className="font-medium">{estimate.electrical.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">도장</span>
          <span className="font-medium">{estimate.painting.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">필름</span>
          <span className="font-medium">{estimate.film.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">가구</span>
          <span className="font-medium">{estimate.furniture.toLocaleString()}만원</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">기타</span>
          <span className="font-medium">{estimate.other.toLocaleString()}만원</span>
        </div>
      </div>
    </div>
  )
}

/**
 * 등급 비교 테이블
 */
function GradeComparisonTable({ pyeong }: { pyeong: number }) {
  const grades: ArgenGrade[] = ['ESSENTIAL', 'STANDARD', 'OPUS']

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left">공정</th>
            {grades.map((grade) => (
              <th key={grade} className="border border-gray-300 px-4 py-2 text-center">
                {GRADE_INFO[grade].name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { label: '철거', key: 'demolition' as const },
            { label: '주방', key: 'kitchen' as const },
            { label: '욕실', key: 'bathroom' as const },
            { label: '바닥재', key: 'flooring' as const },
            { label: '도배', key: 'wallpaper' as const },
            { label: '샤시', key: 'window' as const },
            { label: '중문', key: 'slidingDoor' as const },
            { label: '도어', key: 'door' as const },
            { label: '전기/조명', key: 'electrical' as const },
            { label: '도장', key: 'painting' as const },
            { label: '필름', key: 'film' as const },
            { label: '가구', key: 'furniture' as const },
            { label: '기타', key: 'other' as const },
          ].map(({ label, key }) => {
            const estimate32py = TOTAL_ESTIMATE_32PY
            return (
              <tr key={key}>
                <td className="border border-gray-300 px-4 py-2 font-medium">{label}</td>
                {grades.map((grade) => {
                  const estimate = scaleEstimateByPyeong(estimate32py[grade], pyeong)
                  return (
                    <td key={grade} className="border border-gray-300 px-4 py-2 text-center">
                      {estimate[key].toLocaleString()}만원
                    </td>
                  )
                })}
              </tr>
            )
          })}
          <tr className="bg-blue-50 font-bold">
            <td className="border border-gray-300 px-4 py-2">총 공사비</td>
            {grades.map((grade) => {
              const estimate = scaleEstimateByPyeong(TOTAL_ESTIMATE_32PY[grade], pyeong)
              return (
                <td key={grade} className="border border-gray-300 px-4 py-2 text-center text-blue-600">
                  {estimate.totalCost.toLocaleString()}만원
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}




