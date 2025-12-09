'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Check, SkipForward } from 'lucide-react'

interface LifeStyleSectionProps {
  selectedTags: string[]
  onToggle: (tag: string) => void
  onSkip?: () => void
}

// "건너뛰기" 옵션 (첫 번째)
const SKIP_OPTION = { value: 'skip', label: '해당 없음 / 건너뛰기', icon: '⏭️', tip: '' }

// 업그레이드된 이모지 + 다양한 문체 + 팁
const LIFESTYLE_TAGS = [
  { value: 'hasBaby', label: '영유아가 있어요', icon: '👶', tip: '안전 모서리, 바닥 난방, 친환경 자재 추천' },
  { value: 'hasChild', label: '어린이가 있어요', icon: '🧒', tip: '수납장, 학습 공간 고려' },
  { value: 'hasTeen', label: '청소년이 있어요', icon: '🧑', tip: '학습 공간, 프라이버시 고려' },
  { value: 'hasPets', label: '반려동물과 함께 살아요', icon: '🐕', tip: '스크래치 방지, 청소 편한 마감재' },
  { value: 'hasElderly', label: '연로하신 가족이 있어요', icon: '👴', tip: '미끄럼 방지, 손잡이, 문턱 제거' },
  { value: 'hasPregnant', label: '임신 중인 가족이 있어요', icon: '🤰', tip: '친환경 무독성 자재 필수' },
  { value: 'hasMobilityNeeds', label: '이동이 불편하신 가족이 있어요', icon: '♿', tip: '넓은 문, 턱 제거, 손잡이' },
  { value: 'hasShiftWorker', label: '교대근무를 하시는 가족이 있어요', icon: '🌙', tip: '암막커튼, 방음 시공' },
]

// 추가 옵션
const ADDITIONAL_TAGS = [
  { value: 'worksFromHome', label: '재택근무를 해요', icon: '💻', tip: '조용한 업무 공간, 조명' },
  { value: 'cooksOften', label: '요리를 자주 해요', icon: '🍳', tip: '환기 시스템, 수납 강화' },
  { value: 'hasGuests', label: '손님이 자주 오세요', icon: '🛋️', tip: '넓은 거실, 게스트룸' },
  { value: 'hasAllergy', label: '알러지가 있어요', icon: '🤧', tip: '친환경 자재, 환기 필수' },
  { value: 'playsMusic', label: '악기를 연주해요', icon: '🎹', tip: '방음 시공 필수' },
  { value: 'doesHomeTraining', label: '홈트레이닝을 해요', icon: '🏋️', tip: '충격 흡수 바닥, 환기' },
]

export default function LifeStyleSection({ selectedTags, onToggle }: LifeStyleSectionProps) {
  const [showMore, setShowMore] = useState(false)
  const allTags = showMore ? [...LIFESTYLE_TAGS, ...ADDITIONAL_TAGS] : LIFESTYLE_TAGS
  
  // "건너뛰기" 선택 여부
  const isSkipSelected = selectedTags.includes('skip')

  const handleSkipToggle = () => {
    if (isSkipSelected) {
      // 건너뛰기 해제
      onToggle('skip')
    } else {
      // 건너뛰기 선택 시 다른 모든 선택 해제하고 skip만 선택
      // 현재 선택된 모든 태그 제거
      selectedTags.forEach(tag => {
        if (tag !== 'skip') onToggle(tag)
      })
      onToggle('skip')
    }
  }

  const handleTagToggle = (tag: string) => {
    // 다른 태그 선택 시 건너뛰기 해제
    if (isSkipSelected) {
      onToggle('skip')
    }
    onToggle(tag)
  }

  return (
    <fieldset className="mb-6 md:mb-8 lg:mb-10 border-0 p-0">
      {/* 헤더 */}
      <div className="mb-4">
        <legend className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">✨</span>
          생활 특성
        </legend>
      </div>
      
      <p className="text-sm text-gray-500 mb-5">
        해당되는 항목을 선택해주세요 <span className="text-gray-400">(선택사항)</span>
      </p>

      {/* 건너뛰기 옵션 (첫 번째) - ✅ 포커스 이동 대상 */}
      <div className="mb-3">
        <button
          type="button"
          data-next-focus
          onClick={handleSkipToggle}
          className={`
            w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200
            ${isSkipSelected
              ? 'bg-gray-500 text-white shadow-lg'
              : 'bg-gray-50 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-100'
            }
          `}
        >
          {/* 아이콘 영역 */}
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0
            ${isSkipSelected 
              ? 'bg-white/20' 
              : 'bg-white'
            }
          `}>
            <SkipForward className={`w-6 h-6 ${isSkipSelected ? 'text-white' : 'text-gray-400'}`} />
          </div>
          
          {/* 텍스트 */}
          <span className={`
            flex-1 text-left font-medium text-base
            ${isSkipSelected ? 'text-white' : 'text-gray-500'}
          `}>
            해당 없음 / 건너뛰기
          </span>
          
          {/* 체크 표시 */}
          <div className={`
            w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0
            ${isSkipSelected 
              ? 'bg-white text-gray-600' 
              : 'border-2 border-gray-300'
            }
          `}>
            {isSkipSelected && <Check className="w-4 h-4" strokeWidth={3} />}
          </div>
        </button>
      </div>

      {/* 구분선 */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="text-xs text-gray-400">또는 해당 항목 선택</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {/* 한 줄 카드형 리스트 */}
      <div className={`space-y-2.5 ${isSkipSelected ? 'opacity-50 pointer-events-none' : ''}`}>
        {allTags.map(({ value, label, icon, tip }) => {
          const isSelected = selectedTags.includes(value)
          
          return (
            <div key={value}>
              {/* 카드 */}
              <button
                type="button"
                onClick={() => handleTagToggle(value)}
                disabled={isSkipSelected}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200
                  ${isSelected
                    ? 'bg-gradient-to-r from-argen-500 to-pink-500 text-white shadow-lg shadow-argen-200'
                    : 'bg-white border border-gray-200 hover:border-argen-300 hover:shadow-md'
                  }
                `}
              >
                {/* 체크박스 */}
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                  ${isSelected 
                    ? 'bg-white border-white' 
                    : 'border-gray-300 bg-white'
                  }
                `}>
                  {isSelected && <Check className="w-3 h-3 text-argen-500" strokeWidth={3} />}
                </div>
                
                {/* 이모지 영역 */}
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0
                  ${isSelected 
                    ? 'bg-white/20' 
                    : 'bg-gradient-to-br from-argen-50 to-pink-50'
                  }
                `}>
                  {icon}
                </div>
                
                {/* 텍스트 */}
                <span className={`
                  flex-1 text-left font-medium text-base
                  ${isSelected ? 'text-white' : 'text-gray-700'}
                `}>
                  {label}
                </span>
              </button>
              
              {/* 팁 (선택 시 표시) */}
              {isSelected && tip && (
                <div className="ml-4 mt-2 px-4 py-2.5 bg-argen-50 rounded-xl border border-argen-100 animate-fadeIn">
                  <p className="text-sm text-argen-500 flex items-center gap-2">
                    <span>💡</span> {tip}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 더 보기 버튼 */}
      {!isSkipSelected && (
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="w-full mt-4 py-3.5 flex items-center justify-center gap-2 
                     text-argen-500 hover:text-argen-500 hover:bg-argen-50 
                     rounded-2xl border-2 border-dashed border-argen-200 
                     transition-all duration-200"
        >
          {showMore ? (
            <>
              <ChevronUp className="w-5 h-5" />
              <span className="font-medium">접기</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              <span className="font-medium">더 많은 옵션 보기 (+{ADDITIONAL_TAGS.length})</span>
            </>
          )}
        </button>
      )}

      {/* 선택 요약 */}
      {selectedTags.length > 0 && !isSkipSelected && (
        <div className="mt-4 p-4 bg-gradient-to-r from-argen-50 to-pink-50 rounded-2xl border border-argen-100">
          <p className="text-sm text-argen-600 font-medium">
            ✅ {selectedTags.length}개 선택 완료 — AI가 맞춤 추천해드릴게요!
          </p>
        </div>
      )}
    </fieldset>
  )
}
