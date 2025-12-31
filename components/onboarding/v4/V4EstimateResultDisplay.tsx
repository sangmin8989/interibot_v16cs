/**
 * V4 견적 결과 UI 컴포넌트
 * 
 * 사용법:
 * import { V4EstimateResultDisplay } from '@/components/onboarding/v4/V4EstimateResultDisplay'
 * 
 * <V4EstimateResultDisplay result={estimateResult} />
 */

'use client'

import React from 'react'
import type { V4EstimateResult } from '@/lib/estimate-v4/types/v4-estimate-types'

interface Props {
  result: V4EstimateResult | null
  isCalculating?: boolean
}

export function V4EstimateResultDisplay({ result, isCalculating = false }: Props) {
  // 로딩 중
  if (isCalculating) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">견적 계산 중...</span>
      </div>
    )
  }
  
  // 결과 없음
  if (!result) {
    return null
  }
  
  // 실패
  if (!result.isSuccess) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-bold text-lg mb-2">❌ 견적 계산 실패</h3>
        <p className="text-red-600">{result.errorMessage || '알 수 없는 오류가 발생했습니다.'}</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* 등급 및 총액 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-1">{result.gradeName}</h2>
            <p className="text-blue-200 text-sm">
              {result.grade === 'ARGEN_E' && '합리적인 가성비'}
              {result.grade === 'ARGEN_S' && '균형 잡힌 품질과 가격'}
              {result.grade === 'ARGEN_O' && '프리미엄 맞춤형'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{result.total.formatted}</div>
            <div className="text-blue-200 text-sm mt-1">{result.total.perPyeong}</div>
          </div>
        </div>
      </div>
      
      {/* 경고 메시지 */}
      {result.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-bold text-lg mb-2">⚠️ 주의사항</h3>
          <ul className="space-y-2">
            {result.warnings.map((warning, idx) => (
              <li key={idx} className="text-yellow-700 flex items-start">
                <span className="mr-2">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 성향 매칭 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          🎯 성향 분석 매칭
        </h3>
        <div className="flex items-center mb-4">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${result.personalityMatch.score}%` }}
              ></div>
            </div>
          </div>
          <span className="ml-4 text-2xl font-bold text-blue-600">
            {result.personalityMatch.score}점
          </span>
        </div>
        <ul className="space-y-2">
          {result.personalityMatch.highlights.map((highlight, idx) => (
            <li key={idx} className="text-gray-700 flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* 공정별 내역 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📋 공정별 상세 내역
        </h3>
        <div className="space-y-4">
          {result.breakdown.map((process, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              {/* 공정 헤더 */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b">
                <h4 className="font-bold text-lg text-gray-800">
                  {process.processName}
                </h4>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-800">
                    {process.amount}
                  </div>
                  <div className="text-sm text-gray-500">
                    전체의 {process.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {/* 자재 목록 */}
              {process.materials.length > 0 && (
                <div className="mb-3">
                  <h5 className="font-semibold text-gray-700 mb-2 text-sm">
                    자재 내역
                  </h5>
                  <div className="space-y-1">
                    {process.materials.map((material, mIdx) => (
                      <div 
                        key={mIdx} 
                        className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                      >
                        <span className="text-gray-700">{material.name}</span>
                        <span className="text-gray-600">
                          {material.quantity} × {material.unitPrice} = {material.totalPrice}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 노무 정보 */}
              {process.labor && (
                <div className="bg-blue-50 p-3 rounded">
                  <h5 className="font-semibold text-gray-700 mb-1 text-sm">
                    노무비
                  </h5>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{process.labor.type}</span>
                    <span className="font-semibold text-blue-600">
                      {process.labor.amount}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ✅ 간단한 등급 선택 컴포넌트
export function V4GradeSelector({ 
  selectedGrade, 
  onSelect 
}: { 
  selectedGrade: string
  onSelect: (grade: 'ARGEN_E' | 'ARGEN_S' | 'ARGEN_O') => void 
}) {
  const grades = [
    { 
      value: 'ARGEN_E' as const, 
      label: 'ARGEN 에이', 
      description: '합리적인 가성비',
      color: 'from-green-500 to-green-600'
    },
    { 
      value: 'ARGEN_S' as const, 
      label: 'ARGEN 에스', 
      description: '균형 잡힌 품질과 가격',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      value: 'ARGEN_O' as const, 
      label: 'ARGEN 오퍼스', 
      description: '프리미엄 맞춤형',
      color: 'from-purple-500 to-purple-600'
    },
  ]
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {grades.map((grade) => (
        <button
          key={grade.value}
          onClick={() => onSelect(grade.value)}
          className={`
            p-6 rounded-lg border-2 transition-all
            ${selectedGrade === grade.value 
              ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
              : 'border-gray-200 bg-white hover:border-blue-300'
            }
          `}
        >
          <div className={`
            inline-block px-4 py-2 rounded-full text-white font-bold mb-3
            bg-gradient-to-r ${grade.color}
          `}>
            {grade.label}
          </div>
          <p className="text-gray-600 text-sm">{grade.description}</p>
        </button>
      ))}
    </div>
  )
}

export default V4EstimateResultDisplay








