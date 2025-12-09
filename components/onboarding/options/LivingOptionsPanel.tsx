'use client'

/**
 * 거실/방 공간 옵션 선택 패널
 * - 도배, 바닥재, 조명 옵션
 */

import { useState } from 'react'
import { Sofa, Layers, Lightbulb, ChevronDown, ChevronUp, Check, Paintbrush } from 'lucide-react'

export interface LivingOptions {
  // 도배
  벽지종류?: '합지' | '실크' | '수입벽지' | '친환경' | '페인트'
  포인트벽지?: boolean
  천장도배?: boolean
  
  // 바닥
  바닥재종류?: '강마루' | '강화마루' | '온돌마루' | '원목마루' | 'SPC'
  걸레받이?: boolean
  
  // 조명
  조명타입?: '다운라이트' | '간접조명' | '라인조명' | '펜던트'
  조명개수?: number
  디밍가능?: boolean
  
  // 기타
  아트월?: boolean
  몰딩?: boolean
}

interface LivingOptionsPanelProps {
  value: LivingOptions
  onChange: (options: LivingOptions) => void
  spaceName?: string
  isExpanded?: boolean
}

// 벽지 종류
const WALLPAPER_TYPES = [
  { value: '합지', label: '합지', desc: '가성비, 교체 쉬움', price: '기준' },
  { value: '실크', label: '실크', desc: '고급스러운 질감', price: '+30%' },
  { value: '수입벽지', label: '수입벽지', desc: '디자인, 내구성', price: '+80%' },
  { value: '친환경', label: '친환경', desc: '새집증후군 예방', price: '+50%' },
  { value: '페인트', label: '페인트', desc: '모던, 보수 쉬움', price: '+20%' },
]

// 바닥재 종류
const FLOOR_TYPES = [
  { value: '강마루', label: '강마루', desc: '내구성, 관리 쉬움', price: '기준' },
  { value: '강화마루', label: '강화마루', desc: '가성비, 다양한 디자인', price: '-10%' },
  { value: '온돌마루', label: '온돌마루', desc: '난방 효율 좋음', price: '+30%' },
  { value: '원목마루', label: '원목마루', desc: '자연스러운 질감', price: '+100%' },
  { value: 'SPC', label: 'SPC', desc: '방수, 내구성 최고', price: '+20%' },
]

// 조명 타입
const LIGHTING_TYPES = [
  { value: '다운라이트', label: '다운라이트', desc: '기본, 깔끔함' },
  { value: '간접조명', label: '간접조명', desc: '분위기 연출' },
  { value: '라인조명', label: '라인조명', desc: '모던, 세련됨' },
  { value: '펜던트', label: '펜던트', desc: '포인트 조명' },
]

export default function LivingOptionsPanel({ 
  value, 
  onChange, 
  spaceName = '거실',
  isExpanded = true 
}: LivingOptionsPanelProps) {
  const [expanded, setExpanded] = useState(isExpanded)
  const [activeSection, setActiveSection] = useState<string | null>('wallpaper')

  const updateOption = <K extends keyof LivingOptions>(key: K, val: LivingOptions[K]) => {
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
        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-argen-50 to-argen-50 hover:from-argen-100 hover:to-argen-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-argen-500 flex items-center justify-center">
            <Sofa className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-lg">{spaceName} 옵션</h3>
            <p className="text-sm text-gray-500">
              {value.벽지종류 || '실크'} · {value.바닥재종류 || '강마루'}
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
          {/* 1. 도배/벽지 */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('wallpaper')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Paintbrush className="w-4 h-4" /> 도배 / 벽지
              </h4>
              <span className="text-sm text-argen-500 font-medium">
                {value.벽지종류 || '실크'}
              </span>
            </button>
            
            {activeSection === 'wallpaper' && (
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WALLPAPER_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateOption('벽지종류', type.value as any)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        value.벽지종류 === type.value
                          ? 'border-argen-500 bg-argen-50'
                          : 'border-gray-200 hover:border-argen-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">{type.label}</span>
                        <span className="text-xs text-argen-500">{type.price}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                    </button>
                  ))}
                </div>

                {/* 추가 옵션 */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => updateOption('포인트벽지', !value.포인트벽지)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      value.포인트벽지
                        ? 'border-argen-500 bg-argen-50'
                        : 'border-gray-200 hover:border-argen-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-sm">포인트 벽지</span>
                      {value.포인트벽지 && <Check className="w-4 h-4 text-argen-500" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">한쪽 벽면 강조</p>
                  </button>
                  <button
                    onClick={() => updateOption('천장도배', !value.천장도배)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      value.천장도배
                        ? 'border-argen-500 bg-argen-50'
                        : 'border-gray-200 hover:border-argen-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-sm">천장 도배</span>
                      {value.천장도배 && <Check className="w-4 h-4 text-argen-500" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">천장까지 새롭게</p>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. 바닥재 */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => toggleSection('floor')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Layers className="w-4 h-4" /> 바닥재
              </h4>
              <span className="text-sm text-argen-500 font-medium">
                {value.바닥재종류 || '강마루'}
              </span>
            </button>
            
            {activeSection === 'floor' && (
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FLOOR_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateOption('바닥재종류', type.value as any)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        value.바닥재종류 === type.value
                          ? 'border-argen-500 bg-argen-50'
                          : 'border-gray-200 hover:border-argen-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">{type.label}</span>
                        <span className="text-xs text-argen-500">{type.price}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => updateOption('걸레받이', !value.걸레받이)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    value.걸레받이
                      ? 'border-argen-500 bg-argen-50'
                      : 'border-gray-200 hover:border-argen-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-sm">걸레받이 교체</span>
                    {value.걸레받이 && <Check className="w-4 h-4 text-argen-500" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">바닥재와 어울리는 새 걸레받이</p>
                </button>
              </div>
            )}
          </div>

          {/* 3. 조명 */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => toggleSection('lighting')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> 조명
              </h4>
              <span className="text-sm text-argen-500 font-medium">
                {value.조명타입 || '다운라이트'}
              </span>
            </button>
            
            {activeSection === 'lighting' && (
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-2">
                  {LIGHTING_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateOption('조명타입', type.value as any)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        value.조명타입 === type.value
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-yellow-300'
                      }`}
                    >
                      <span className="font-medium text-gray-900 text-sm">{type.label}</span>
                      <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => updateOption('디밍가능', !value.디밍가능)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    value.디밍가능
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-yellow-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-sm">디밍(밝기 조절)</span>
                    {value.디밍가능 && <Check className="w-4 h-4 text-yellow-500" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">분위기에 맞게 밝기 조절</p>
                </button>
              </div>
            )}
          </div>

          {/* 4. 특수 옵션 */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-lg">✨</span> 특수 옵션
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateOption('아트월', !value.아트월)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  value.아트월
                    ? 'border-argen-500 bg-argen-50'
                    : 'border-gray-200 hover:border-argen-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm">아트월</span>
                  {value.아트월 && <Check className="w-4 h-4 text-argen-500" />}
                </div>
                <p className="text-xs text-gray-500 mt-1">포인트 벽면 연출</p>
              </button>
              <button
                onClick={() => updateOption('몰딩', !value.몰딩)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  value.몰딩
                    ? 'border-argen-500 bg-argen-50'
                    : 'border-gray-200 hover:border-argen-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm">몰딩 교체</span>
                  {value.몰딩 && <Check className="w-4 h-4 text-argen-500" />}
                </div>
                <p className="text-xs text-gray-500 mt-1">천장/벽 경계 마감</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}




