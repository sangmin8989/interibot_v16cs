'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function FinalCTA() {
  const router = useRouter()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* 배경 이미지 */}
      <div className="absolute inset-0 z-0">
        {/* 실제 배경 이미지가 있다면 */}
        {/* <img
          src="/images/cta-background.jpg"
          alt="CTA Background"
          className="w-full h-full object-cover"
        /> */}
        
        {/* 배경 그라디언트 (placeholder) */}
        <div className="w-full h-full bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800">
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
      </div>

      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/50 z-10"></div>

      {/* 콘텐츠 */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
            무료로 AI 인테리어 컨설팅을 받아보고, 당신만의 맞춤 설계를 확인해보세요.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToSection('modes')}
            className="bg-white text-primary-600 rounded-full px-12 py-5 font-bold text-xl hover:bg-primary-50 transition-all shadow-2xl hover:shadow-3xl"
          >
            무료로 시작하기
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}


