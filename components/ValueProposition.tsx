'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const values = [
  {
    icon: '🧠',
    title: 'AI 성향 분석',
    description:
      '15개 라이프스타일 질문으로 가족 구성, 건강, 수면, 정리 습관까지 깊이 있게 분석합니다.',
  },
  {
    icon: '🎨',
    title: '맞춤 설계',
    description:
      '분석 결과를 바탕으로 공간 구성, 자재, 조명, 스타일 보드를 자동으로 제안합니다.',
  },
  {
    icon: '💰',
    title: '투명한 견적',
    description:
      '평수·예산·성향에 따라 공정별 견적이 실시간으로 반영되어 투명하게 확인할 수 있습니다.',
  },
]

export default function ValueProposition() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="features" ref={ref} className="py-20 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            AI가 도와주는 인테리어 의사결정
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            감(감성)과 숫자(견적)를 동시에 다루는 인테리어 의사결정을, 인테리봇이 구조화합니다.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 50 }}
              animate={
                isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
              }
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center mb-6 text-4xl">
                {value.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {value.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}


