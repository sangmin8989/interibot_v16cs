'use client'

import { useState, useEffect, useRef } from 'react'

interface FamilySizeSectionProps {
  selectedFamilySize: string | null
  onSelect: (familySize: string) => void
  onTotalPeopleChange?: (count: number) => void
  initialTotalPeople?: number // ✅ 실제 인원수를 전달받음
}

export default function FamilySizeSection({ 
  selectedFamilySize, 
  onSelect,
  onTotalPeopleChange,
  initialTotalPeople // ✅ 추가
}: FamilySizeSectionProps) {
  const [inputValue, setInputValue] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const isUserTypingRef = useRef(false) // ✅ useRef로 입력 중 추적 (리렌더링 방지)
  const isInitializedRef = useRef(false) // ✅ 초기화 완료 여부 추적

  // ✅ 초기 마운트 시에만 실행 (한 번만)
  useEffect(() => {
    // 이미 초기화되었거나 사용자가 입력 중이면 실행하지 않음
    if (isInitializedRef.current || isUserTypingRef.current) {
      return
    }
    
    console.log('🔄 FamilySizeSection 초기화:', { 
      initialTotalPeople, 
      selectedFamilySize
    });
    
    if (initialTotalPeople && initialTotalPeople > 0) {
      // ✅ totalPeople이 있으면 우선 사용 (가장 정확한 값)
      setInputValue(initialTotalPeople.toString())
      console.log('✅ totalPeople 우선 사용:', initialTotalPeople);
      isInitializedRef.current = true
    } else if (selectedFamilySize) {
      // familySizeRange에서 숫자 추출 (fallback)
      const match = selectedFamilySize.match(/^(\d+)/)
      if (match) {
        setInputValue(match[1])
        console.log('⚠️ familySizeRange에서 추출:', match[1]);
        isInitializedRef.current = true
      }
    } else {
      setInputValue('')
      console.log('📝 빈 값으로 초기화');
      isInitializedRef.current = true
    }
  }, []) // ✅ 빈 의존성 배열 - 마운트 시 한 번만 실행

  // ✅ initialTotalPeople이 외부에서 변경되었을 때만 업데이트 (사용자 입력 중이 아닐 때)
  useEffect(() => {
    // 사용자가 입력 중이거나 이미 초기화되지 않았으면 무시
    if (isUserTypingRef.current || !isInitializedRef.current) {
      return
    }
    
    // inputValue가 이미 같은 값이면 업데이트하지 않음
    if (initialTotalPeople && initialTotalPeople.toString() === inputValue) {
      return
    }
    
    // 외부에서 totalPeople이 변경되었고, 현재 입력값과 다를 때만 업데이트
    if (initialTotalPeople && initialTotalPeople > 0) {
      console.log('🔄 외부에서 totalPeople 변경 감지:', initialTotalPeople);
      setInputValue(initialTotalPeople.toString())
    }
  }, [initialTotalPeople, inputValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // ✅ 사용자 입력 중임을 표시 (useRef 사용)
    isUserTypingRef.current = true
    
    // 숫자만 입력 허용
    if (value === '' || /^\d+$/.test(value)) {
      setInputValue(value)
      
      const numValue = parseInt(value, 10)
      if (!isNaN(numValue) && numValue > 0) {
        // totalPeople 콜백 호출
        if (onTotalPeopleChange) {
          onTotalPeopleChange(numValue)
        }
        
        // familySizeRange 자동 생성 (호환성)
        let range: string
        if (numValue === 1) range = '1인'
        else if (numValue === 2) range = '2인'
        else if (numValue === 3) range = '3인'  // ✅ 3명은 정확히 '3인'
        else if (numValue === 4) range = '4인'  // ✅ 4명은 정확히 '4인'
        else if (numValue >= 5) range = '5인 이상'
        else range = `${numValue}인`
        
        onSelect(range)
      } else if (value === '') {
        // 빈 값일 때 초기화
        onSelect('')
        if (onTotalPeopleChange) {
          onTotalPeopleChange(0)
        }
      }
    }
    
    // ✅ 입력 후 일정 시간 후 isUserTyping 해제 (초기화 방지)
    setTimeout(() => {
      isUserTypingRef.current = false
    }, 500)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter 키 또는 최대 자릿수(2자리) 도달 시 다음 필드로 포커스 이동
    if (e.key === 'Enter') {
      e.preventDefault()
      // 다음 입력 가능한 필드 찾기 (생활 특성 섹션의 첫 번째 버튼)
      const nextElement = document.querySelector('[data-next-focus]') as HTMLElement
      if (nextElement) {
        nextElement.focus()
      }
    }
    // 숫자 입력 시 자동으로 다음 필드로 이동 (선택사항)
    else if (inputValue.length >= 3 && /^\d$/.test(e.key)) {
      // 3자리 이상 입력 시 포커스 이동 (선택사항)
      setTimeout(() => {
        const nextElement = document.querySelector('[data-next-focus]') as HTMLElement
        if (nextElement) {
          nextElement.focus()
        }
      }, 50)
    }
  }

  // ✅ "3명 이상" 버튼 핸들러
  const handleThreeOrMore = () => {
    setInputValue('3+')
    
    // totalPeople은 3으로 설정 (최소값)
    if (onTotalPeopleChange) {
      onTotalPeopleChange(3)
    }
    
    // familySizeRange는 '3명 이상'으로 설정
    onSelect('3명 이상')
    
    console.log('✅ 3명 이상 선택:', { totalPeople: 3, range: '3명 이상' })
  }

  // ✅ 올림 버튼 (값 증가)
  const handleIncrement = () => {
    const currentValue = parseInt(inputValue || '0', 10)
    const newValue = currentValue + 1 // ✅ 최대값 제한 제거
    const newValueStr = newValue.toString()
    setInputValue(newValueStr)
    isUserTypingRef.current = true // ✅ 사용자 입력 중 표시
    
    if (onTotalPeopleChange) {
      onTotalPeopleChange(newValue)
    }
    
    // familySizeRange 자동 생성
    let range: string
    if (newValue === 1) range = '1인'
    else if (newValue === 2) range = '2인'
    else if (newValue === 3) range = '3인'  // ✅ 3명은 정확히 '3인'
    else if (newValue === 4) range = '4인'  // ✅ 4명은 정확히 '4인'
    else if (newValue >= 5) range = '5인 이상'
    else range = `${newValue}인`
    
    onSelect(range)
    
    setTimeout(() => {
      isUserTypingRef.current = false
    }, 500)
  }

  // ✅ 내림 버튼 (값 감소)
  const handleDecrement = () => {
    const currentValue = parseInt(inputValue || '0', 10)
    const newValue = Math.max(currentValue - 1, 1) // 최소 1명
    const newValueStr = newValue.toString()
    setInputValue(newValueStr)
    isUserTypingRef.current = true // ✅ 사용자 입력 중 표시
    
    if (onTotalPeopleChange) {
      onTotalPeopleChange(newValue)
    }
    
    // familySizeRange 자동 생성
    let range: string
    if (newValue === 1) range = '1인'
    else if (newValue === 2) range = '2인'
    else if (newValue === 3) range = '3인'  // ✅ 3명은 정확히 '3인'
    else if (newValue === 4) range = '4인'  // ✅ 4명은 정확히 '4인'
    else if (newValue >= 5) range = '5인 이상'
    else range = `${newValue}인`
    
    onSelect(range)
    
    setTimeout(() => {
      isUserTypingRef.current = false
    }, 500)
  }

  return (
    <fieldset className="mb-6 md:mb-8 lg:mb-10 border-0 p-0">
      <legend className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <span className="text-xl md:text-2xl" aria-hidden="true">👨‍👩‍👧‍👦</span>
        가족 수 입력
      </legend>
      <p className="text-sm text-gray-700 ml-9 mb-6">
        함께 거주하시는 가족 인원수를 직접 입력해주세요.
      </p>

      <div className="max-w-md">
        <div className="relative flex items-center gap-2">
          {/* ✅ 내림 버튼 (-) */}
          <button
            type="button"
            onClick={handleDecrement}
            disabled={!inputValue || parseInt(inputValue, 10) <= 1 || isNaN(parseInt(inputValue, 10))}
            aria-label="가족 수 감소"
            className={`
              w-12 h-12 md:w-14 md:h-14 flex items-center justify-center
              rounded-xl border-2 transition-all duration-200
              font-bold text-xl md:text-2xl
              ${!inputValue || parseInt(inputValue, 10) <= 1 || isNaN(parseInt(inputValue, 10))
                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'border-argen-500 bg-white text-argen-600 hover:bg-argen-50 hover:scale-105 active:scale-95'
              }
            `}
          >
            −
          </button>

          {/* 입력 필드 */}
          <div className="flex-1 relative">
            <label htmlFor="family-size-input" className="sr-only">
              가족 수 입력
            </label>
            <input
              id="family-size-input"
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="예) 3"
              aria-label="가족 수 입력 (단위: 명)"
              aria-required="false"
              className={`
                w-full p-4 md:p-5 pr-12 border-2 rounded-xl 
                focus:outline-none focus:ring-4 text-2xl md:text-3xl font-bold 
                bg-white text-gray-900 transition-all text-center
                ${inputValue 
                  ? 'border-argen-500 focus:border-argen-500 focus:ring-argen-100' 
                  : 'border-gray-300 focus:border-argen-500 focus:ring-argen-100'
                }
              `}
            />
            <span 
              className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 
                         text-lg md:text-xl text-gray-600 font-semibold pointer-events-none" 
              aria-hidden="true"
            >
              명
            </span>
          </div>

          {/* ✅ 올림 버튼 (+) */}
          <button
            type="button"
            onClick={handleIncrement}
            aria-label="가족 수 증가"
            className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-xl border-2 border-argen-500 bg-white text-argen-600 hover:bg-argen-50 hover:scale-105 active:scale-95 transition-all duration-200 font-bold text-xl md:text-2xl"
          >
            +
          </button>
        </div>
        
        {/* 안내 문구 */}
        <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <span className="text-lg flex-shrink-0">💡</span>
          <p className="text-sm text-blue-900">
            {inputValue 
              ? `${inputValue}명 가구 기준으로 맞춤 추천해드릴게요`
              : '가족 수를 입력하면 더 정확한 추천을 받을 수 있어요'
            }
          </p>
        </div>
      </div>
    </fieldset>
  )
}



