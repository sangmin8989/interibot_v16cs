'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

export default function TrustSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      ref={ref}
      className="py-16 bg-gradient-to-b from-argen-100 to-argen-50"
    >
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center space-y-4">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-sm font-medium tracking-[0.15em] uppercase text-argen-600"
        >
          FOR INTERIOR PROFESSIONALS & HOME OWNERS
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base md:text-lg text-argen-700 leading-relaxed"
        >
          인테리봇은 전시장 상담, 온라인 견적, 리모델링 기획까지 한 번에 사용할 수 있는
          AI 기반 인테리어 컨설팅 도구입니다.
        </motion.p>
      </div>
    </section>
  )
}
