'use client'

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'

interface ZodiacInputProps {
  value: string
  onChange: (value: string) => void
}

function getZodiacSign(month: number, day: number): string {
  const signs = [
    { name: '양자리', start: [3, 21], end: [4, 19] },
    { name: '황소자리', start: [4, 20], end: [5, 20] },
    { name: '쌍둥이자리', start: [5, 21], end: [6, 21] },
    { name: '게자리', start: [6, 22], end: [7, 22] },
    { name: '사자자리', start: [7, 23], end: [8, 22] },
    { name: '처녀자리', start: [8, 23], end: [9, 23] },
    { name: '천칭자리', start: [9, 24], end: [10, 22] },
    { name: '전갈자리', start: [10, 23], end: [11, 22] },
    { name: '사수자리', start: [11, 23], end: [12, 24] },
    { name: '염소자리', start: [12, 25], end: [1, 19] },
    { name: '물병자리', start: [1, 20], end: [2, 18] },
    { name: '물고기자리', start: [2, 19], end: [3, 20] }
  ]

  for (const sign of signs) {
    const [startMonth, startDay] = sign.start
    const [endMonth, endDay] = sign.end

    if (
      (month === startMonth && day >= startDay) ||
      (month === endMonth && day <= endDay)
    ) {
      return sign.name
    }
  }

  return ''
}

export default function ZodiacInput({ value, onChange }: ZodiacInputProps) {
  const [zodiac, setZodiac] = useState('')

  useEffect(() => {
    if (value && value.length === 10) {
      const [year, month, day] = value.split('-').map(Number)
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const sign = getZodiacSign(month, day)
        setZodiac(sign)
      }
    } else {
      setZodiac('')
    }
  }, [value])

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          생년월일을 입력해주세요
        </h3>
        <p className="text-sm text-gray-600">
          별자리를 자동으로 알려드립니다
        </p>
      </div>

      <div className="relative">
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full h-14 pl-12 pr-4 text-lg border-2 border-gray-300 rounded-xl
                     focus:border-argen-500 focus:outline-none transition-colors"
        />
      </div>

      {zodiac && (
        <div className="text-center p-4 bg-argen-50 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">당신의 별자리는</p>
          <p className="text-2xl font-bold text-argen-500">✨ {zodiac} ✨</p>
        </div>
      )}

      <button
        onClick={() => onChange('')}
        className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 underline"
      >
        건너뛰기
      </button>
    </div>
  )
}