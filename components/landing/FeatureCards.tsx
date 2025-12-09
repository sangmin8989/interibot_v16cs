'use client'

import { BrainCircuit, LayoutTemplate, ReceiptText } from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: BrainCircuit,
    title: 'AI 성향 분석',
    description:
      '15개 라이프스타일 질문으로 가족 구성, 건강, 수면, 정리 습관까지 정밀 분석합니다.',
  },
  {
    icon: LayoutTemplate,
    title: '맞춤 설계',
    description:
      '분석 결과를 바탕으로 공간 구성, 자재, 조명, 스타일 보드를 자동으로 제안합니다.',
  },
  {
    icon: ReceiptText,
    title: '투명한 견적',
    description:
      '평수·예산·성향에 따라 공정별 견적이 실시간으로 반영되어 투명하게 확인할 수 있습니다.',
  },
]

interface FeatureCardsProps {
  isInView: boolean
}

export default function FeatureCards({ isInView }: FeatureCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      {features.map((feature, index) => {
        const IconComponent = feature.icon
        return (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            className="rounded-2xl bg-white/80 border border-argen-100 p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-argen-50 border border-argen-100 mb-4">
              <IconComponent className="h-6 w-6 text-argen-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-semibold text-argen-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-base leading-relaxed text-argen-600">
                {feature.description}
              </p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}


