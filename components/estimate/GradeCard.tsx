'use client'

interface GradeCardProps {
  grade: 'basic' | 'standard' | 'argen' | 'premium'
  totalAmount: number
  isSelected: boolean
  onSelect: () => void
}

export default function GradeCard({
  grade,
  totalAmount,
  isSelected,
  onSelect
}: GradeCardProps) {
  const formatPrice = (price: number): string => {
    return Math.floor(price / 10000).toLocaleString('ko-KR')
  }

  const gradeInfo = {
    basic: {
      icon: '💰',
      title: '기본형',
      features: ['합리적인 가격의 기본 자재', '실용성 중심'],
      color: 'from-gray-100 to-gray-50',
      buttonColor: 'bg-gray-600 hover:bg-gray-700'
    },
    standard: {
      icon: '⭐',
      title: '표준형',
      features: ['검증된 브랜드 자재', '품질과 가격의 균형'],
      color: 'from-yellow-50 to-orange-50',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
    },
    argen: {
      icon: '🏆',
      title: '아르젠',
      features: ['성향 분석 기반 맞춤 설계', '아르젠 제작 + 프리미엄 브랜드'],
      color: 'from-argen-50 to-pink-50',
      buttonColor: 'bg-argen-500 hover:bg-argen-600'
    },
    premium: {
      icon: '💎',
      title: '프리미엄',
      features: ['최고급 수입 자재', '럭셔리 마감'],
      color: 'from-argen-50 to-roseSoft/30',
      buttonColor: 'bg-argen-500 hover:bg-argen-600'
    }
  }

  const info = gradeInfo[grade]

  return (
    <div
      className={`
        bg-gradient-to-br ${info.color} rounded-2xl shadow-lg border-2 p-6 
        cursor-pointer transition-all duration-300
        hover:scale-[1.02] hover:shadow-xl
        ${isSelected 
          ? 'border-[#8B5CF6] ring-2 ring-[#8B5CF6] ring-opacity-50 shadow-argen-200' 
          : 'border-gray-200 hover:border-gray-300'
        }
      `}
      onClick={onSelect}
    >
      {/* 선택됨 표시 */}
      {isSelected && (
        <div className="absolute -top-2 -right-2">
          <div className="w-8 h-8 bg-[#8B5CF6] rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      <div className="text-3xl mb-3">{info.icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{info.title}</h3>
      <p className={`text-2xl md:text-3xl font-bold mb-4 ${isSelected ? 'text-[#8B5CF6]' : 'text-gray-900'}`}>
        ₩{formatPrice(totalAmount)}만원
      </p>
      <ul className="text-sm text-gray-600 space-y-1 mb-4">
        {info.features.map((feature, idx) => (
          <li key={idx}>• {feature}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        className={`w-full mt-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          isSelected
            ? 'bg-[#8B5CF6] text-white shadow-lg'
            : `${info.buttonColor} text-white`
        }`}
      >
        {isSelected ? '✓ 선택됨' : '상세보기'}
      </button>
    </div>
  )
}
