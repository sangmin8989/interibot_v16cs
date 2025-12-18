'use client'

/**
 * 현관/발코니 옵션 선택 패널
 */

import { useState } from 'react'
import { DoorOpen, Layers, ChevronDown, ChevronUp, Check } from 'lucide-react'

export interface EntranceOptions {
  // 타일
  타일사이즈?: '소형' | '중형' | '대형'
  타일패턴?: '일반' | '헤링본' | '다이아몬드'
  
  // 신발장
  신발장교체?: boolean
  신발장크기?: '소형' | '중형' | '대형' | '벽면전체'
  신발장벤치?: boolean
  신발장거울?: boolean
  
  // 중문
  중문설치?: boolean
  중문타입?: '슬라이딩' | '폴딩' | '여닫이'
}

interface EntranceOptionsPanelProps {
  value: EntranceOptions
  onChange: (options: EntranceOptions) => void
  isBalcony?: boolean
  isExpanded?: boolean
}

export default function EntranceOptionsPanel({ 
  value, 
  onChange, 
  isBalcony = false,
  isExpanded = false 
}: EntranceOptionsPanelProps) {
  const [expanded, setExpanded] = useState(isExpanded)
  const [activeSection, setActiveSection] = useState<string | null>('tile')

  const updateOption = <K extends keyof EntranceOptions>(key: K, val: EntranceOptions[K]) => {
    onChange({ ...value, [key]: val })
  }

  const spaceName = isBalcony ? '발코니' : '현관'
  const bgColor = isBalcony ? 'from-green-50 to-emerald-50' : 'from-amber-50 to-orange-50'
  const iconBg = isBalcony ? 'bg-green-500' : 'bg-amber-500'

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-5 bg-gradient-to-r ${bgColor} hover:opacity-90 transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
            <DoorOpen className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-lg">{spaceName} 옵션</h3>
            <p className="text-sm text-gray-500">
              타일 {value.타일사이즈 || '중형'} · {value.타일패턴 || '일반'}
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
          {/* 1. 타일 */}
          <div className="space-y-3">
            <button
              onClick={() => activeSection === 'tile' ? setActiveSection(null) : setActiveSection('tile')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Layers className="w-4 h-4" /> 바닥 타일
              </h4>
            </button>
            
            {activeSection === 'tile' && (
              <div className="space-y-3 mt-3">
                {/* 타일 사이즈 */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">타일 사이즈</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['소형', '중형', '대형'].map((size) => (
                      <button
                        key={size}
                        onClick={() => updateOption('타일사이즈', size as any)}
                        className={`p-2 rounded-lg border-2 text-sm transition-all ${
                          value.타일사이즈 === size
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 타일 패턴 */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">타일 패턴</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: '일반', label: '일반', desc: '기본' },
                      { value: '헤링본', label: '헤링본', desc: '+30%' },
                      { value: '다이아몬드', label: '다이아몬드', desc: '+20%' },
                    ].map((pattern) => (
                      <button
                        key={pattern.value}
                        onClick={() => updateOption('타일패턴', pattern.value as any)}
                        className={`p-2 rounded-lg border-2 text-sm transition-all ${
                          value.타일패턴 === pattern.value
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        <span>{pattern.label}</span>
                        <p className="text-xs text-gray-400">{pattern.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. 신발장 (현관만) */}
          {!isBalcony && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => activeSection === 'shoebox' ? setActiveSection(null) : setActiveSection('shoebox')}
                className="w-full flex items-center justify-between"
              >
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-lg">👟</span> 신발장
                </h4>
              </button>
              
              {activeSection === 'shoebox' && (
                <div className="space-y-3 mt-3">
                  <button
                    onClick={() => updateOption('신발장교체', !value.신발장교체)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      value.신발장교체
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">신발장 교체</span>
                      {value.신발장교체 && <Check className="w-4 h-4 text-amber-500" />}
                    </div>
                  </button>

                  {value.신발장교체 && (
                    <>
                      <div className="grid grid-cols-4 gap-2">
                        {['소형', '중형', '대형', '벽면전체'].map((size) => (
                          <button
                            key={size}
                            onClick={() => updateOption('신발장크기', size as any)}
                            className={`p-2 rounded-lg border-2 text-xs transition-all ${
                              value.신발장크기 === size
                                ? 'border-amber-500 bg-amber-50'
                                : 'border-gray-200 hover:border-amber-300'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => updateOption('신발장벤치', !value.신발장벤치)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            value.신발장벤치
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-gray-200 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 text-sm">벤치형</span>
                            {value.신발장벤치 && <Check className="w-4 h-4 text-amber-500" />}
                          </div>
                        </button>
                        <button
                          onClick={() => updateOption('신발장거울', !value.신발장거울)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            value.신발장거울
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-gray-200 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 text-sm">거울 포함</span>
                            {value.신발장거울 && <Check className="w-4 h-4 text-amber-500" />}
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. 중문 (현관만) */}
          {!isBalcony && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => activeSection === 'door' ? setActiveSection(null) : setActiveSection('door')}
                className="w-full flex items-center justify-between"
              >
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-lg">🚪</span> 중문
                </h4>
              </button>
              
              {activeSection === 'door' && (
                <div className="space-y-3 mt-3">
                  <button
                    onClick={() => updateOption('중문설치', !value.중문설치)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      value.중문설치
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">중문 설치</span>
                      {value.중문설치 && <Check className="w-4 h-4 text-amber-500" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">냄새, 소음 차단 + 미관</p>
                  </button>

                  {value.중문설치 && (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: '슬라이딩', label: '슬라이딩', desc: '공간 절약' },
                        { value: '폴딩', label: '폴딩', desc: '넓은 개방감' },
                        { value: '여닫이', label: '여닫이', desc: '클래식' },
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => updateOption('중문타입', type.value as any)}
                          className={`p-2 rounded-lg border-2 text-sm transition-all ${
                            value.중문타입 === type.value
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-gray-200 hover:border-amber-300'
                          }`}
                        >
                          <span className="font-medium">{type.label}</span>
                          <p className="text-xs text-gray-400">{type.desc}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}





























