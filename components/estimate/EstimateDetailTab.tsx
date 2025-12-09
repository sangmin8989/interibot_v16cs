'use client'

import { useState } from 'react'
import { EstimateTable } from '@/components/estimate/EstimateTable'
import type { GradeResult } from '@/lib/estimate/types'

interface EstimateDetailTabProps {
  gradeData: GradeResult
  gradeName: string
  gradeIcon: string
  isInitiallyExpanded?: boolean
}

export default function EstimateDetailTab({
  gradeData,
  gradeName,
  gradeIcon,
  isInitiallyExpanded = false
}: EstimateDetailTabProps) {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded)

  const formatPrice = (price: number): string => {
    return Math.floor(price / 10000).toLocaleString('ko-KR')
  }

  const processInfo: Record<string, { icon: string; color: string; description: string }> = {
    '철거': { icon: '🔨', color: 'red', description: '기존 시설물 해체 및 폐기물 처리' },
    '주방': { icon: '🍳', color: 'orange', description: '싱크대, 상판, 수전 등 주방 시설 설치' },
    '욕실': { icon: '🚿', color: 'blue', description: '변기, 세면대, 욕조 등 욕실 설비 설치' },
    '타일': { icon: '🔲', color: 'cyan', description: '벽/바닥 타일 시공 및 줄눈 처리' },
    '목공': { icon: '🪵', color: 'amber', description: '붙박이장, 몰딩, 가구 제작 및 설치' },
    '전기': { icon: '💡', color: 'yellow', description: '조명, 콘센트, 스위치 등 전기 설비' },
    '도배': { icon: '🎨', color: 'purple', description: '벽지 시공 및 마감' },
    '필름': { icon: '🚪', color: 'green', description: '도어, 창틀 필름 시공' },
    '기타': { icon: '🔧', color: 'gray', description: '기타 부대 공사' },
  }

  const groupedByProcess: Record<string, any[]> = {}
  if (gradeData.세부내역) {
    gradeData.세부내역.forEach((item: any) => {
      if (!groupedByProcess[item.공정]) {
        groupedByProcess[item.공정] = []
      }
      groupedByProcess[item.공정].push(item)
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-[#8B5CF6] p-6 md:p-8 mb-6 md:mb-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            {gradeIcon} {gradeName} 등급 상세 견적
          </h2>
          <p className="text-sm text-gray-600">
            {isExpanded
              ? '공정별 세부 내역을 확인하세요'
              : '세부견적보기 버튼을 눌러 자세한 내역을 확인하세요'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
        >
          {isExpanded ? (
            <>
              <span>📋</span>
              <span>접기</span>
              <span>▲</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>세부견적보기</span>
              <span>▼</span>
            </>
          )}
        </button>
      </div>

      {/* 요약 정보 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">재료비</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900">
            {formatPrice(gradeData.재료비)}만원
          </p>
        </div>
        <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">노무비</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900">
            {formatPrice(gradeData.노무비)}만원
          </p>
        </div>
        <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">직접공사비</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900">
            {formatPrice(gradeData.직접공사비)}만원
          </p>
        </div>
        <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">간접공사비</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900">
            {formatPrice(gradeData.간접공사비.합계)}만원
          </p>
        </div>
      </div>

      {/* 간접공사비 상세 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">간접공사비 상세</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">산재고용보험:</span>
            <span className="ml-2 font-semibold">{formatPrice(gradeData.간접공사비.산재고용보험)}만원</span>
          </div>
          <div>
            <span className="text-gray-600">공과잡비:</span>
            <span className="ml-2 font-semibold">{formatPrice(gradeData.간접공사비.공과잡비)}만원</span>
          </div>
          <div>
            <span className="text-gray-600">현장관리및감리:</span>
            <span className="ml-2 font-semibold">{formatPrice(gradeData.간접공사비.현장관리및감리)}만원</span>
          </div>
        </div>
      </div>

      {/* 범위 견적 */}
      <div className="mb-6 p-4 bg-argen-50 rounded-xl border border-argen-200">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">예상 범위</h3>
        <p className="text-blue-700">
          {formatPrice(gradeData.범위견적.min)}만원 ~ {formatPrice(gradeData.범위견적.max)}만원
        </p>
      </div>

      {/* 세부 내역 */}
      {isExpanded && (!gradeData.세부내역 || gradeData.세부내역.length === 0) && (
        <div className="mt-6 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
          <p className="text-yellow-800 font-semibold">
            ⚠️ 세부 내역이 없습니다. 선택한 공정이 올바르게 반영되었는지 확인해주세요.
          </p>
        </div>
      )}

      {isExpanded && gradeData.세부내역 && gradeData.세부내역.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            📋 공정별 세부 내역
            <span className="text-sm font-normal text-gray-600">
              (총 {gradeData.세부내역.length}개 항목)
            </span>
          </h3>

          {Object.entries(groupedByProcess).map(([processName, items]) => {
            const info = processInfo[processName] || { icon: '📦', color: 'gray', description: '기타 공정' }
            const processTotal = items.reduce((sum: number, item: any) => sum + (item.합계 || 0), 0)
            const processMaterial = items.reduce((sum: number, item: any) => sum + (item.재료비 || 0), 0)
            const processLabor = items.reduce((sum: number, item: any) => sum + (item.노무비 || 0), 0)

            return (
              <div key={processName} className="mb-6 border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-4 border-b-2 border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl md:text-3xl">{info.icon}</span>
                      <div>
                        <h4 className="text-base md:text-lg font-bold text-gray-800">{processName}</h4>
                        <p className="text-xs md:text-sm text-gray-600">{info.description}</p>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="text-xl md:text-2xl font-bold text-[#8B5CF6]">
                        {formatPrice(processTotal)}만원
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        재료 {formatPrice(processMaterial)} + 노무 {formatPrice(processLabor)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <EstimateTable items={items} title="" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}







