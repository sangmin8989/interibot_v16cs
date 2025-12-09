'use client'

interface AgeRangeSectionProps {
  selectedAgeRanges: string[]
  onToggle: (ageRange: string) => void
}

const AGE_RANGES = [
  { value: '20대', label: '20대', icon: '🧑' },
  { value: '30대', label: '30대', icon: '👨' },
  { value: '40대', label: '40대', icon: '🧔' },
  { value: '50대', label: '50대', icon: '👴' },
  { value: '60대 이상', label: '60+', icon: '😊' },
]

export default function AgeRangeSection({ selectedAgeRanges, onToggle }: AgeRangeSectionProps) {
  return (
    <fieldset className="mb-6 md:mb-8 lg:mb-10 border-0 p-0">
      <legend className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <span className="text-xl md:text-2xl" aria-hidden="true">👤</span>
        연령대 선택
      </legend>
      <p className="text-sm text-gray-700 ml-9 mb-4">
        가족의 연령대를 선택해주세요. <span className="text-gray-400">(복수 선택 가능)</span>
      </p>

      {/* 가로 일자 카드형 */}
      <div className="flex flex-wrap gap-2">
        {AGE_RANGES.map(({ value, label, icon }) => {
          const isSelected = selectedAgeRanges.includes(value)
          
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all duration-200
                hover:scale-[1.03] active:scale-[0.97] transform
                ${isSelected
                  ? 'border-argen-500 bg-argen-500 text-white shadow-lg shadow-argen-200'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-argen-300 hover:bg-argen-50'
                }
              `}
              aria-label={`${value} 선택${isSelected ? ', 현재 선택됨' : ''}`}
              aria-pressed={isSelected}
            >
              <span className="text-lg">{icon}</span>
              <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                {label}
              </span>
              {isSelected && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      {/* 선택 요약 */}
      {selectedAgeRanges.length > 0 && (
        <div className="mt-3 text-sm text-argen-500 font-medium">
          ✅ {selectedAgeRanges.join(', ')} 선택됨
        </div>
      )}
    </fieldset>
  )
}
