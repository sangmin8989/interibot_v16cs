'use client'

import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore'
import { usePersonalityStore } from '@/lib/store/personalityStore'

interface EstimateSummaryCardProps {
  totalCost: number
  homeUsePurpose?: string
  livingYears?: number
  hasChildren?: boolean
  hasPets?: boolean
  scores?: {
    storage: number
    cleaning: number
    flow: number
  }
}

export default function EstimateSummaryCard({
  totalCost,
  homeUsePurpose,
  livingYears,
  hasChildren,
  hasPets,
  scores
}: EstimateSummaryCardProps) {
  const { spaceInfo } = useSpaceInfoStore()
  const { analysis } = usePersonalityStore()

  // 금액 포맷팅
  const formatPrice = (price: number): string => {
    return Math.floor(price / 10000).toLocaleString('ko-KR')
  }

  // 월 비용 환산 (총액 ÷ 120개월)
  const monthlyCost = Math.floor(totalCost / 120 / 10000)

  // 상황 요약 생성
  const generateSummary = (): string => {
    const parts: string[] = []

    // 거주 목적 및 기간
    if (homeUsePurpose === '실거주' && livingYears) {
      parts.push(`${livingYears}년 실거주`)
    } else if (homeUsePurpose === '매도') {
      parts.push('매도 준비')
    } else if (homeUsePurpose === '임대') {
      parts.push('임대 목적')
    } else {
      parts.push('실거주')
    }

    // 가족 구성
    const familyParts: string[] = []
    if (hasChildren) familyParts.push('아이')
    if (hasPets) familyParts.push('반려동물')
    if (familyParts.length > 0) {
      parts.push(`${familyParts.join('+')} 있음`)
    }

    // 핵심 개선 포인트
    if (scores) {
      const topScores: string[] = []
      if (scores.storage >= 70) topScores.push('수납')
      if (scores.cleaning >= 70) topScores.push('청소')
      if (scores.flow >= 70) topScores.push('동선')
      
      if (topScores.length > 0) {
        parts.push(`${topScores.join('·')} 중심 구성`)
      } else {
        parts.push('맞춤형 구성')
      }
    }

    return parts.join(' → ')
  }

  // 집값 방어 점수 계산 (1-5점)
  const calculateHomeValueScore = (): number => {
    let score = 3 // 기본 3점

    // 거주 목적에 따른 가산점
    if (homeUsePurpose === '실거주' && livingYears && livingYears >= 10) {
      score += 1
    } else if (homeUsePurpose === '매도') {
      score += 0.5
    }

    // 개선 점수에 따른 가산점
    if (scores) {
      const avgScore = (scores.storage + scores.cleaning + scores.flow) / 3
      if (avgScore >= 75) {
        score += 1
      } else if (avgScore >= 60) {
        score += 0.5
      }
    }

    return Math.min(5, Math.max(1, Math.round(score)))
  }

  // 별점 렌더링
  const renderStars = (rating: number): string => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return '★'.repeat(fullStars) + (hasHalfStar ? '⯨' : '') + '☆'.repeat(emptyStars)
  }

  const homeValueScore = calculateHomeValueScore()
  const summary = generateSummary()

  // 기본 점수 (props로 전달되지 않은 경우)
  const defaultScores = scores || { storage: 70, cleaning: 60, flow: 65 }

  return (
    <div className="bg-gradient-to-br from-white to-argen-50 rounded-3xl shadow-2xl border-2 border-argen-200 p-6 md:p-8 mb-6 animate-fadeIn">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          💎 맞춤 견적 요약
        </h2>
      </div>

      {/* 총 공사비 */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-md border border-argen-100">
        <p className="text-sm text-gray-600 mb-2">총 공사비</p>
        <p className="text-4xl md:text-5xl font-bold text-[#8B5CF6] mb-3">
          ₩{formatPrice(totalCost)}만원
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>💰</span>
          <span>월 비용 환산: 약 {monthlyCost.toLocaleString('ko-KR')}만원</span>
          <span className="text-xs text-gray-500">(10년 기준)</span>
        </div>
      </div>

      {/* 상황 요약 */}
      <div className="bg-gradient-to-r from-argen-50 to-roseSoft/30 rounded-xl p-4 mb-6 border border-argen-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🏠</span>
          <div>
            <p className="text-xs text-gray-600 mb-1 font-semibold">맞춤 설계 포인트</p>
            <p className="text-sm md:text-base text-gray-800 font-medium leading-relaxed">
              {summary}
            </p>
          </div>
        </div>
      </div>

      {/* 집값 방어 점수 */}
      <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">🏡 집값 방어 점수</span>
          <span className="text-2xl text-yellow-500">{renderStars(homeValueScore)}</span>
        </div>
        <p className="text-xs text-gray-500">
          {homeValueScore >= 4
            ? '훌륭한 투자 가치! 장기적으로 자산 가치를 보호합니다'
            : homeValueScore >= 3
            ? '적절한 투자! 집값 유지에 도움이 됩니다'
            : '기본적인 보수로 실용성 중심입니다'}
        </p>
      </div>

      {/* 생활 개선 점수 */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-3">📈 생활 개선 점수</p>
        
        {/* 수납 */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">📦 수납</span>
            <span className="text-sm font-bold text-[#8B5CF6]">{defaultScores.storage}% 개선</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-argen-400 to-argen-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${defaultScores.storage}%` }}
            ></div>
          </div>
        </div>

        {/* 청소 */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">✨ 청소</span>
            <span className="text-sm font-bold text-[#8B5CF6]">{defaultScores.cleaning}% 개선</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-argen-400 to-argen-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${defaultScores.cleaning}%` }}
            ></div>
          </div>
        </div>

        {/* 동선 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">🚶 동선</span>
            <span className="text-sm font-bold text-[#8B5CF6]">{defaultScores.flow}% 개선</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${defaultScores.flow}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="mt-6 p-4 bg-argen-50 rounded-lg border border-argen-200">
        <p className="text-xs text-gray-600 text-center">
          💡 성향 분석 기반으로 최적화된 견적입니다
        </p>
      </div>
    </div>
  )
}

