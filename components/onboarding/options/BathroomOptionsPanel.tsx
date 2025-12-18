'use client'

/**
 * 욕실 세분화 옵션 선택 패널
 * - 스타일, 타일, 위생도기, 설비 등 선택
 */

import { useState } from 'react'
import { Bath, Layers, Droplets, ChevronDown, ChevronUp, Check, Sparkles } from 'lucide-react'
import type { BathroomOptions, BathroomStyle, TileSize, SanitaryGrade } from '@/lib/estimate/types'

interface BathroomOptionsPanelProps {
  value: BathroomOptions
  onChange: (options: BathroomOptions) => void
  bathroomCount?: number
  isExpanded?: boolean
}

// 욕실 스타일
const BATHROOM_STYLES: { value: BathroomStyle; label: string; description: string; priceNote: string }[] = [
  { value: '모던', label: '모던', description: '깔끔한 직선, 심플한 디자인', priceNote: '기준' },
  { value: '미니멀', label: '미니멀', description: '군더더기 없는 심플함', priceNote: '기준' },
  { value: '내추럴', label: '내추럴', description: '따뜻한 우드톤, 자연 소재', priceNote: '+10%' },
  { value: '클래식', label: '클래식', description: '우아한 디테일, 고급스러움', priceNote: '+30%' },
  { value: '호텔식', label: '호텔식', description: '럭셔리한 호텔 느낌', priceNote: '+80%' },
]

// 타일 사이즈
const TILE_SIZES: { value: TileSize; label: string; description: string }[] = [
  { value: '소형(300x300)', label: '소형 (300x300)', description: '전통적, 다양한 패턴' },
  { value: '중형(600x600)', label: '중형 (600x600)', description: '가장 인기, 균형잡힌 크기' },
  { value: '대형(800x800)', label: '대형 (800x800)', description: '넓어 보이는 효과' },
  { value: '대판(1200x600)', label: '대판 (1200x600)', description: '줄눈 최소, 고급스러움' },
]

// 위생도기 등급
const SANITARY_GRADES: { value: SanitaryGrade; label: string; description: string; priceNote: string }[] = [
  { value: '기본', label: '기본', description: '국산 기본형', priceNote: '기준' },
  { value: '중급', label: '중급', description: 'TOTO 등 브랜드', priceNote: '+50%' },
  { value: '고급', label: '고급', description: '벽걸이형, 디자인', priceNote: '+100%' },
  { value: '프리미엄', label: '프리미엄', description: '하이테크, 자동 기능', priceNote: '+200%' },
]

export default function BathroomOptionsPanel({ 
  value, 
  onChange, 
  bathroomCount = 2,
  isExpanded = true 
}: BathroomOptionsPanelProps) {
  const [expanded, setExpanded] = useState(isExpanded)
  const [activeSection, setActiveSection] = useState<string | null>('style')

  const updateOption = <K extends keyof BathroomOptions>(key: K, val: BathroomOptions[K]) => {
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
        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center">
            <Bath className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-lg">
              욕실 옵션 <span className="text-sm font-normal text-gray-500">({bathroomCount}개)</span>
            </h3>
            <p className="text-sm text-gray-500">
              {value.스타일 || '모던'} · {value.벽타일사이즈 || '중형(600x600)'}
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
          {/* 1. 욕실 스타일 */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('style')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 욕실 스타일
              </h4>
              <span className="text-sm text-cyan-600 font-medium">
                {value.스타일 || '모던'}
              </span>
            </button>
            
            {activeSection === 'style' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {BATHROOM_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => updateOption('스타일', style.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      value.스타일 === style.value
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{style.label}</span>
                      <span className="text-xs text-cyan-600 font-medium">{style.priceNote}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{style.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. 타일 사이즈 */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => toggleSection('tile')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Layers className="w-4 h-4" /> 타일 사이즈
              </h4>
              <span className="text-sm text-cyan-600 font-medium">
                {value.벽타일사이즈 || '중형(600x600)'}
              </span>
            </button>
            
            {activeSection === 'tile' && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {TILE_SIZES.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => updateOption('벽타일사이즈', size.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      value.벽타일사이즈 === size.value
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:border-cyan-300'
                    }`}
                  >
                    <span className="font-medium text-gray-900 text-sm">{size.label}</span>
                    <p className="text-xs text-gray-500 mt-1">{size.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. 위생도기 등급 */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => toggleSection('sanitary')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-lg">🚽</span> 위생도기 등급
              </h4>
              <span className="text-sm text-cyan-600 font-medium">
                {value.양변기등급 || '기본'}
              </span>
            </button>
            
            {activeSection === 'sanitary' && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {SANITARY_GRADES.map((grade) => (
                  <button
                    key={grade.value}
                    onClick={() => {
                      updateOption('양변기등급', grade.value)
                      updateOption('세면대등급', grade.value === '프리미엄' ? '고급' : grade.value)
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      value.양변기등급 === grade.value
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{grade.label}</span>
                      <span className="text-xs text-cyan-600 font-medium">{grade.priceNote}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{grade.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. 욕조/샤워부스 */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => toggleSection('bath')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Bath className="w-4 h-4" /> 욕조 / 샤워부스
              </h4>
            </button>
            
            {activeSection === 'bath' && (
              <div className="space-y-3 mt-3">
                {/* 욕조 */}
                <div>
                  <button
                    onClick={() => updateOption('욕조', !value.욕조)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      value.욕조
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">욕조 설치</span>
                      {value.욕조 && <Check className="w-4 h-4 text-cyan-500" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">반신욕을 즐기시나요?</p>
                  </button>

                  {value.욕조 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {['일반', '반신욕', '자쿠지'].map((type) => (
                        <button
                          key={type}
                          onClick={() => updateOption('욕조타입', type as any)}
                          className={`p-2 rounded-lg border-2 text-sm transition-all ${
                            value.욕조타입 === type
                              ? 'border-cyan-500 bg-cyan-50'
                              : 'border-gray-200 hover:border-cyan-300'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 샤워부스 */}
                <div>
                  <button
                    onClick={() => updateOption('샤워부스', !value.샤워부스)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      value.샤워부스
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">샤워부스</span>
                      {value.샤워부스 && <Check className="w-4 h-4 text-cyan-500" />}
                    </div>
                  </button>

                  {value.샤워부스 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { value: '일반', label: '일반' },
                        { value: '레인샤워', label: '레인샤워' },
                        { value: '월풀', label: '월풀' },
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => updateOption('샤워부스타입', type.value as any)}
                          className={`p-2 rounded-lg border-2 text-sm transition-all ${
                            value.샤워부스타입 === type.value
                              ? 'border-cyan-500 bg-cyan-50'
                              : 'border-gray-200 hover:border-cyan-300'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 5. 추가 옵션 */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => toggleSection('extras')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Droplets className="w-4 h-4" /> 추가 옵션
              </h4>
            </button>
            
            {activeSection === 'extras' && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { key: '비데', label: '비데', desc: '필수템!' },
                  { key: '젠다이', label: '젠다이', desc: '욕실 선반' },
                  { key: '파티션', label: '파티션', desc: '건식/습식 분리' },
                  { key: '바닥난방', label: '바닥난방', desc: '따뜻한 발' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => updateOption(item.key as keyof BathroomOptions, !value[item.key as keyof BathroomOptions])}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      value[item.key as keyof BathroomOptions]
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-sm">{item.label}</span>
                      {value[item.key as keyof BathroomOptions] && (
                        <Check className="w-4 h-4 text-cyan-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 6. 환풍기 등급 */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-lg">💨</span> 환풍기 등급
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: '기본', label: '기본', desc: '일반 환풍기' },
                { value: '제습형', label: '제습형', desc: '습기 제거' },
                { value: '냉온풍', label: '냉온풍', desc: '욕실 에어컨' },
              ].map((grade) => (
                <button
                  key={grade.value}
                  onClick={() => updateOption('환풍기등급', grade.value as any)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    value.환풍기등급 === grade.value
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-cyan-300'
                  }`}
                >
                  <span className="font-medium text-gray-900 text-sm">{grade.label}</span>
                  <p className="text-xs text-gray-500 mt-1">{grade.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}





























