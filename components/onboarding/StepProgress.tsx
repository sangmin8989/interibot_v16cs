'use client'

import { Check } from 'lucide-react'

interface StepProgressProps {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6
}

const STEPS = [
  { number: 1, label: '집 정보', desc: '집 정보 입력' },
  { number: 2, label: '성향 분석', desc: '취향 파악' },
  { number: 3, label: '공간 범위', desc: '공사 범위' },
  { number: 4, label: '공정 선택', desc: '세부 선택' },
  { number: 5, label: 'AI 추천', desc: '맞춤 제안' },
  { number: 6, label: '견적 확인', desc: '최종 견적' },
]

export default function StepProgress({ currentStep }: StepProgressProps) {
  return (
    <div className="mb-8 bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = step.number < currentStep
          const isCurrent = step.number === currentStep
          const isPending = step.number > currentStep

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* 단계 원 */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    transition-all duration-300
                    ${isCompleted ? 'bg-argen-500 text-white' : ''}
                    ${isCurrent ? 'bg-argen-500 text-white ring-4 ring-argen-200' : ''}
                    ${isPending ? 'bg-gray-200 text-gray-500' : ''}
                  `}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <div className="text-center">
                  <div
                    className={`
                      text-xs font-medium whitespace-nowrap
                      ${isCompleted ? 'text-gray-900' : ''}
                      ${isCurrent ? 'text-argen-500' : ''}
                      ${isPending ? 'text-gray-400' : ''}
                    `}
                  >
                    {step.label}
                  </div>
                  <div className="text-[10px] text-gray-400 hidden sm:block">
                    {step.desc}
                  </div>
                </div>
              </div>

              {/* 연결선 (마지막 단계 제외) */}
              {index < STEPS.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 transition-all duration-300
                    ${step.number < currentStep ? 'bg-argen-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


