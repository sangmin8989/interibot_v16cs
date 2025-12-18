'use client'

import { Check } from 'lucide-react'
import { motion } from 'framer-motion'

export interface Step {
  number: number
  label: string
  description: string
  icon?: string  // 이모지 아이콘 (선택)
}

interface StepIndicatorProps {
  currentStep: number
  steps?: Step[]  // 선택적 (기본값: DEFAULT_STEPS)
}

// 기본 6단계 정의 (새 플로우: 집 정보 → 성향 분석 → 공사 범위 → 공정 선택 → 결과 화면 → 견적 확인)
export const DEFAULT_STEPS: Step[] = [
  { number: 1, label: '집 정보', description: '기본 정보', icon: '🏠' },
  { number: 2, label: '성향 분석', description: '취향 파악', icon: '🎨' },
  { number: 3, label: '공사 범위', description: '범위 설정', icon: '📍' },
  { number: 4, label: '공정 선택', description: '세부 공정', icon: '🔧' },
  { number: 5, label: '결과 화면', description: 'AI 분석', icon: '✨' },
  { number: 6, label: '견적 확인', description: '최종 확인', icon: '📋' },
]

export default function StepIndicator({ currentStep, steps = DEFAULT_STEPS }: StepIndicatorProps) {
  return (
    <nav 
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100"
      aria-label="진행 단계"
    >
      <div className="max-w-4xl mx-auto px-3 py-3 md:py-4">
        {/* 모바일: 컴팩트한 프로그레스 바 */}
        <div className="md:hidden">
          {/* 현재 단계 표시 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">
              {currentStep} / {steps.length} 단계
            </span>
            <span className="text-sm font-semibold text-argen-500">
              {steps[currentStep - 1]?.label}
            </span>
          </div>
          
          {/* 프로그레스 바 */}
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-argen-500 to-argen-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          
          {/* 단계 도트 */}
          <div className="flex justify-between mt-2 px-1">
            {steps.map((step) => {
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div 
                  key={step.number}
                  className="flex flex-col items-center"
                >
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all
                      ${isCompleted 
                        ? 'bg-argen-500 text-white' 
                        : isActive 
                        ? 'bg-argen-500 text-white ring-2 ring-argen-200' 
                        : 'bg-gray-200 text-gray-400'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3" strokeWidth={3} />
                    ) : (
                      step.number
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 데스크탑: 전체 단계 표시 */}
        <div 
          className="hidden md:flex items-start justify-between"
          role="list"
        >
          {steps.map((step, index) => {
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number
            const isLast = index === steps.length - 1

            return (
              <div 
                key={step.number} 
                className="flex items-center flex-1"
                role="listitem"
                aria-current={isActive ? 'step' : undefined}
              >
                {/* 단계 아이콘 및 텍스트 */}
                <div className="flex flex-col items-center relative">
                  {/* 원형 아이콘 */}
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    className={`
                      relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                      ${isActive 
                        ? 'bg-gradient-to-br from-argen-500 to-argen-500 shadow-lg shadow-argen-200' 
                        : isCompleted
                        ? 'bg-argen-500'
                        : 'bg-gray-100 border-2 border-gray-200'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    ) : (
                      <span
                        className={`
                          text-sm font-bold
                          ${isActive || isCompleted ? 'text-white' : 'text-gray-400'}
                        `}
                      >
                        {step.number}
                      </span>
                    )}
                    
                    {/* 활성 단계 애니메이션 링 */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-argen-300"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1.4, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </motion.div>

                  {/* 텍스트 */}
                  <div className="mt-2 text-center">
                    <p
                      className={`
                        text-xs font-semibold whitespace-nowrap
                        ${isActive 
                          ? 'text-argen-500' 
                          : isCompleted 
                          ? 'text-gray-700' 
                          : 'text-gray-400'
                        }
                      `}
                    >
                      {step.label}
                    </p>
                    <p
                      className={`
                        text-[10px] mt-0.5 whitespace-nowrap
                        ${isActive || isCompleted
                          ? 'text-gray-500' 
                          : 'text-gray-300'
                        }
                      `}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* 연결선 */}
                {!isLast && (
                  <div className="flex-1 h-[2px] mx-2 relative" style={{ marginBottom: '40px' }}>
                    <div className="absolute inset-0 bg-gray-200 rounded-full"></div>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-argen-500 to-argen-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
