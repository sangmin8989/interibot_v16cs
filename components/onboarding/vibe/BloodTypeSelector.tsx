'use client'

import { Check } from 'lucide-react'

interface BloodTypeSelectorProps {
  value: string | null
  onChange: (value: string) => void
}

const BLOOD_TYPES = ['A', 'B', 'O', 'AB']

export default function BloodTypeSelector({ value, onChange }: BloodTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          혈액형을 알려주세요
        </h3>
        <p className="text-sm text-gray-600">
          모르시면 건너뛰셔도 됩니다
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {BLOOD_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`
              relative h-20 rounded-xl font-bold text-2xl
              transition-all duration-200
              ${
                value === type
                  ? 'bg-argen-500 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
              }
            `}
          >
            {type}형
            {value === type && (
              <Check className="absolute top-2 right-2 w-5 h-5" />
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