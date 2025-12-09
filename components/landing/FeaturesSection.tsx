'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import FeatureCards from './FeatureCards'

export default function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="features"
      ref={ref}
      className="py-20 md:py-28 bg-gradient-to-b from-argen-50 to-argen-100"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-argen-800">
            AI가 도와주는 인테리어 의사결정
          </h2>
          <p className="text-base md:text-lg text-argen-700 max-w-2xl mx-auto leading-relaxed">
            집과 가족의 성향, 예산, 생활 패턴까지 반영해 설계와 견적을 동시에 제안합니다.
          </p>
        </motion.div>

        {/* 기능 카드 3개 */}
        <FeatureCards isInView={isInView} />
      </div>
    </section>
  )
}
