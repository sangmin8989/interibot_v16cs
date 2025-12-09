'use client'

import { Check } from 'lucide-react'

interface MBTISelectorProps {
  value: string | null
  onChange: (value: string) => void
}

const MBTI_TYPES = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
]

export default function MBTISelector({ value, onChange }: MBTISelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          MBTI 유형을 알려주세요
        </h3>
        <p className="text-sm text-gray-600">
          모르시면 건너뛰셔도 됩니다
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {MBTI_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`
              relative h-14 rounded-lg font-semibold text-sm
              transition-all duration-200
              ${
                value === type
                  ? 'bg-argen-500 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
              }
            `}
          >
            {type}
            {value === type && (
              <Check className="absolute top-1 right-1 w-4 h-4" />
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => onChange('')}
        className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 underline"
      >
        건너뛰기
      </button>
    </div>
  )
}