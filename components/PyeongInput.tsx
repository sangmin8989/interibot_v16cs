'use client'

import { useState, useEffect } from 'react'

const PYEONG_TO_M2 = 3.3058 // 1평 = 3.3058㎡

interface PyeongInputProps {
  value: number | ''
  onChange: (pyeong: number) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  className?: string
  label?: string
  showM2?: boolean
}

export default function PyeongInput({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 0.1,
  placeholder = '평',
  className = '',
  label,
  showM2 = true,
}: PyeongInputProps) {
  const [pyeong, setPyeong] = useState<string>(value === '' ? '' : String(value))
  const [m2, setM2] = useState<string>('')

  // 평수 → ㎡ 변환
  useEffect(() => {
    if (value !== '' && typeof value === 'number' && value > 0) {
      setPyeong(String(value))
      const calculatedM2 = (value * PYEONG_TO_M2).toFixed(2)
      setM2(calculatedM2)
    } else {
      setPyeong('')
      setM2('')
    }
  }, [value])

  // 평수 입력 핸들러
  const handlePyeongChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setPyeong(inputValue)

    if (inputValue === '') {
      setM2('')
      onChange(0)
      return
    }

    const numValue = parseFloat(inputValue)
    console.log('📝 PyeongInput 입력:', { inputValue, numValue, isValid: !isNaN(numValue) && numValue >= 0 })
    
    if (!isNaN(numValue) && numValue >= 0) {
      const calculatedM2 = (numValue * PYEONG_TO_M2).toFixed(2)
      setM2(calculatedM2)
      console.log('✅ PyeongInput onChange 호출:', numValue)
      onChange(numValue)
    } else {
      setM2('')
    }
  }

  // ㎡ 입력 핸들러
  const handleM2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setM2(inputValue)

    if (inputValue === '') {
      setPyeong('')
      onChange(0)
      return
    }

    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue) && numValue >= 0) {
      // ㎡ → 평수 변환
      const calculatedPyeong = (numValue / PYEONG_TO_M2).toFixed(2)
      const pyeongValue = parseFloat(calculatedPyeong)
      setPyeong(calculatedPyeong)
      onChange(pyeongValue)
    } else {
      setPyeong('')
    }
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {label && (
        <label className="text-lg font-semibold text-argen-800">{label}</label>
      )}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        {/* 평수 입력 */}
        <div className="flex items-center gap-3 flex-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={pyeong}
            onChange={handlePyeongChange}
            placeholder={placeholder}
            className="w-full px-5 py-5 border-2 border-argen-300 rounded-2xl focus:border-argen-500 focus:outline-none focus:ring-4 focus:ring-argen-100 text-3xl font-bold bg-white text-argen-800 text-center transition-all"
          />
          <span className="text-2xl text-argen-600 font-bold whitespace-nowrap">평</span>
        </div>

        {/* ㎡ 표시/입력 */}
        {showM2 && (
          <>
            <span className="text-2xl text-argen-400 font-bold hidden md:block">≈</span>
            <div className="flex items-center gap-3 flex-1">
              <input
                type="number"
                step="0.01"
                value={m2}
                onChange={handleM2Change}
                placeholder="㎡"
                className="w-full px-5 py-5 border-2 border-argen-300 rounded-2xl focus:border-argen-500 focus:outline-none focus:ring-4 focus:ring-argen-100 text-3xl font-bold bg-white text-argen-800 text-center transition-all"
              />
              <span className="text-2xl text-argen-600 font-bold whitespace-nowrap">㎡</span>
            </div>
          </>
        )}
      </div>
      {showM2 && pyeong && !isNaN(parseFloat(pyeong)) && (
        <p className="text-sm text-argen-600 text-center md:text-left">
          💡 1평 = 약 3.3㎡
        </p>
      )}
    </div>
  )
}


