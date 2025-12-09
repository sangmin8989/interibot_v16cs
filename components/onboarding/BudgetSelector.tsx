'use client'

/**
 * 예산 선택 컴포넌트
 * - 예산 범위 선택 또는 직접 입력
 * - "아직 정하지 않음" 옵션 포함
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BUDGET_OPTIONS, BudgetRange } from '@/lib/data/budget-options'

interface BudgetSelectorProps {
  selectedBudget: BudgetRange
  budgetAmount?: number
  onBudgetChange: (budget: BudgetRange, amount?: number) => void
}

export default function BudgetSelector({
  selectedBudget,
  budgetAmount,
  onBudgetChange,
}: BudgetSelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customAmount, setCustomAmount] = useState<string>(
    budgetAmount ? String(budgetAmount) : ''
  )

  const handleSelect = (budgetId: BudgetRange) => {
    if (budgetId === selectedBudget) return
    setShowCustomInput(false)
    onBudgetChange(budgetId)
  }

  const handleCustomAmountChange = (value: string) => {
    // 숫자만 허용
    const numericValue = value.replace(/[^0-9]/g, '')
    setCustomAmount(numericValue)

    if (numericValue) {
      const amount = parseInt(numericValue)
      // 금액에 따라 적절한 범위 선택
      let budgetRange: BudgetRange = 'unknown'
      if (amount <= 2000) budgetRange = 'under2000'
      else if (amount <= 4000) budgetRange = 'range2000_4000'
      else if (amount <= 6000) budgetRange = 'range4000_6000'
      else budgetRange = 'over6000'

      onBudgetChange(budgetRange, amount)
    }
  }

  const formatAmount = (amount: string): string => {
    if (!amount) return ''
    const num = parseInt(amount)
    return num.toLocaleString()
  }

  return (
    <div className="space-y-4">
      {/* 예산 옵션 카드 */}
      <div className="grid gap-3">
        {BUDGET_OPTIONS.map((option, index) => {
          const isSelected = selectedBudget === option.id
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelect(option.id)}
              className={`
                relative flex items-center gap-4 p-4 rounded-xl border-2 text-left
                transition-all duration-200
                ${isSelected
                  ? 'border-argen-500 bg-argen-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              {/* 이모지 */}
              <span className="text-3xl">{option.emoji}</span>

              {/* 텍스트 */}
              <div className="flex-1">
                <div className={`font-semibold ${isSelected ? 'text-argen-600' : 'text-gray-800'}`}>
                  {option.label}
                </div>
                <div className="text-sm text-gray-500">
                  {option.description}
                </div>
              </div>

              {/* 선택 표시 */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-argen-500 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* 직접 입력 토글 */}
      <div className="pt-2">
        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="text-sm text-argen-500 hover:text-argen-600 underline underline-offset-2"
        >
          {showCustomInput ? '범위로 선택하기' : '직접 금액 입력하기'}
        </button>
      </div>

      {/* 직접 입력 필드 */}
      <AnimatePresence>
        {showCustomInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                예산을 직접 입력해주세요
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatAmount(customAmount)}
                  onChange={(e) => handleCustomAmountChange(e.target.value.replace(/,/g, ''))}
                  placeholder="예: 3,500"
                  className="w-full px-4 py-3 pr-16 text-lg rounded-lg border border-gray-300 
                           focus:ring-2 focus:ring-argen-500 focus:border-argen-500 outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  만원
                </span>
              </div>
              {customAmount && parseInt(customAmount) > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  약 <span className="font-semibold text-argen-500">
                    {(parseInt(customAmount) * 10000).toLocaleString()}원
                  </span>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 안내 문구 */}
      <p className="text-xs text-gray-400 text-center mt-4">
        💡 예산은 견적 등급 추천에 참고됩니다. 나중에 변경할 수 있어요.
      </p>
    </div>
  )
}




