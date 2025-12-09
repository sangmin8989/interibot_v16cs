'use client'

/**
 * 주방 세분화 옵션 선택 패널
 * - 주방형태, 상판재질, 설비, 수납장 등 선택
 */

import { useState, useEffect } from 'react'
import { ChefHat, Layers, Refrigerator, Droplets, ChevronDown, ChevronUp, Check } from 'lucide-react'
import type { KitchenOptions, KitchenLayout, CountertopMaterial } from '@/lib/estimate/types'

interface KitchenOptionsPanelProps {
  value: KitchenOptions
  onChange: (options: KitchenOptions) => void
  isExpanded?: boolean
}

// 주방 형태 옵션
const KITCHEN_LAYOUTS: { value: KitchenLayout; label: string; description: string; priceNote: string }[] = [
  { value: '일자', label: '일자형', description: '가장 기본적인 형태, 좁은 주방에 적합', priceNote: '기준' },
  { value: 'ㄱ자', label: 'ㄱ자형', description: '코너를 활용, 효율적인 동선', priceNote: '+15%' },
  { value: 'ㄷ자', label: 'ㄷ자형', description: '넓은 수납공간, 양쪽 활용', priceNote: '+35%' },
  { value: '아일랜드', label: '아일랜드형', description: '독립 조리대, 개방감', priceNote: '+50%' },
  { value: 'ㄱ자+아일랜드', label: 'ㄱ자+아일랜드', description: '최고급 구성, 넓은 주방', priceNote: '+70%' },
]

// 상판 재질 옵션
const COUNTERTOP_MATERIALS: { value: CountertopMaterial; label: string; description: string; priceNote: string }[] = [
  { value: '인조대리석', label: '인조대리석', description: '가성비, 다양한 색상', priceNote: '기준' },
  { value: '엔지니어드스톤', label: '엔지니어드스톤', description: '내구성, 관리 용이 (추천)', priceNote: '+30%' },
  { value: '세라믹', label: '세라믹', description: '내열성, 고급스러움', priceNote: '+60%' },
  { value: '천연대리석', label: '천연대리석', description: '최고급, 자연의 품격', priceNote: '+120%' },
  { value: '스테인리스', label: '스테인리스', description: '위생적, 전문가용', priceNote: '+40%' },
]

// 정수기 타입 옵션
const WATER_PURIFIER_TYPES = [
  { value: '빌트인(싱크대하부)', label: '싱크대 하부', description: '가장 일반적' },
  { value: '언더싱크', label: '언더싱크', description: '수전 일체형' },
  { value: '별도공간(키큰장내)', label: '키큰장 내', description: '정수기 숨김' },
  { value: '냉온정수기공간', label: '스탠드 공간', description: '냉온정수기용' },
]

export default function KitchenOptionsPanel({ value, onChange, isExpanded = true }: KitchenOptionsPanelProps) {
  const [expanded, setExpanded] = useState(isExpanded)
  const [activeSection, setActiveSection] = useState<string | null>('layout')

  const updateOption = <K extends keyof KitchenOptions>(key: K, val: KitchenOptions[K]) => {
    onChange({ ...value, [key]: val })
  }

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-lg">주방 옵션</h3>
            <p className="text-sm text-gray-500">
              {value.형태 || '일자'}형 · {value.상판재질 || '엔지니어드스톤'}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="p-5 space-y-6">
          {/* 1. 주방 형태 */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('layout')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-lg">🏠</span> 주방 형태
              </h4>
              <span className="text-sm text-orange-600 font-medium">
                {value.형태 || '일자'}형
              </span>
            </button>
            
            {activeSection === 'layout' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {KITCHEN_LAYOUTS.map((layout) => (
                  <button
                    key={layout.value}
                    onClick={() => updateOption('형태', layout.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      value.형태 === layout.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{layout.label}</span>
                      <span className="text-xs text-orange-600 font-medium">{layout.priceNote}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{layout.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. 상판 재질 */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => toggleSection('countertop')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Layers className="w-4 h-4" /> 상판 재질
              </h4>
              <span className="text-sm text-orange-600 font-medium">
                {value.상판재질 || '엔지니어드스톤'}
              </span>
            </button>
            
            {activeSection === 'countertop' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {COUNTERTOP_MATERIALS.map((material) => (
                  <button
                    key={material.value}
                    onClick={() => updateOption('상판재질', material.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      value.상판재질 === material.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{material.label}</span>
                      <span className="text-xs text-orange-600 font-medium">{material.priceNote}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{material.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. 추가 수납장 */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => toggleSection('storage')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Refrigerator className="w-4 h-4" /> 추가 수납장
              </h4>
              <span className="text-sm text-gray-500">
                {[value.냉장고장, value.키큰장, (value as any).김치냉장고장, value.팬트리].filter(Boolean).length}개 선택
              </span>
            </button>
            
            {activeSection === 'storage' && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { key: '냉장고장', label: '냉장고장', price: '+40~120만원' },
                  { key: '키큰장', label: '키큰장', price: '+35~100만원' },
                  { key: '김치냉장고장', label: '김치냉장고장', price: '+40~100만원' },
                  { key: '팬트리', label: '팬트리', price: '+50~140만원' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => updateOption(item.key as keyof KitchenOptions, !value[item.key as keyof KitchenOptions])}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      value[item.key as keyof KitchenOptions]
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{item.label}</span>
                      {value[item.key as keyof KitchenOptions] && (
                        <Check className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.price}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. 정수기 설치 공간 */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => toggleSection('purifier')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Droplets className="w-4 h-4" /> 정수기 설치 공간
              </h4>
              <span className="text-sm text-gray-500">
                {value.정수기설치 ? '설치' : '미설치'}
              </span>
            </button>
            
            {activeSection === 'purifier' && (
              <div className="space-y-3 mt-3">
                {/* 설치 여부 토글 */}
                <button
                  onClick={() => updateOption('정수기설치', !value.정수기설치)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    value.정수기설치
                      ? 'border-argen-500 bg-argen-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">정수기 설치 공간 확보</span>
                    {value.정수기설치 && <Check className="w-4 h-4 text-argen-500" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">배관 위치 미리 확보하면 나중에 편해요</p>
                </button>

                {/* 정수기 타입 선택 (설치 시에만) */}
                {value.정수기설치 && (
                  <div className="grid grid-cols-2 gap-2">
                    {WATER_PURIFIER_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => updateOption('정수기타입' as any, type.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          (value as any).정수기타입 === type.value
                            ? 'border-argen-500 bg-argen-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <span className="font-medium text-gray-900 text-sm">{type.label}</span>
                        <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* 전용 배관 */}
                {value.정수기설치 && (
                  <button
                    onClick={() => updateOption('정수기배관' as any, !(value as any).정수기배관)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      (value as any).정수기배관
                        ? 'border-argen-500 bg-argen-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">전용 배관 시공</span>
                      {(value as any).정수기배관 && <Check className="w-4 h-4 text-argen-500" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">급수/배수 배관 별도 시공 (+15만원~)</p>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 5. 설비 옵션 */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => toggleSection('appliances')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-lg">⚡</span> 설비 옵션
              </h4>
            </button>
            
            {activeSection === 'appliances' && (
              <div className="space-y-3 mt-3">
                {/* 쿡탑 선택 */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">쿡탑</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['가스레인지', '인덕션', '하이브리드'].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          const 설비 = value.설비 || {}
                          updateOption('설비', { ...설비, 쿡탑: type as any })
                        }}
                        className={`p-2 rounded-lg border-2 text-sm transition-all ${
                          value.설비?.쿡탑 === type
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 추가 설비 체크박스 */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: '식기세척기', label: '식기세척기' },
                    { key: '빌트인오븐', label: '빌트인 오븐' },
                    { key: '빌트인정수기', label: '빌트인 정수기' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        const 설비 = value.설비 || {}
                        updateOption('설비', { ...설비, [item.key]: !(설비 as any)[item.key] })
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        (value.설비 as any)?.[item.key]
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">{item.label}</span>
                        {(value.설비 as any)?.[item.key] && (
                          <Check className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* LED 조명 */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateOption('상부장LED', !value.상부장LED)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      value.상부장LED
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-sm">상부장 LED</span>
                      {value.상부장LED && <Check className="w-4 h-4 text-yellow-500" />}
                    </div>
                  </button>
                  <button
                    onClick={() => updateOption('하부장LED', !value.하부장LED)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      value.하부장LED
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-sm">하부장 LED</span>
                      {value.하부장LED && <Check className="w-4 h-4 text-yellow-500" />}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


