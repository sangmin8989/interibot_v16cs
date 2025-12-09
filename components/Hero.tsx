'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function Hero() {
  const router = useRouter()

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 배경 영상/이미지 */}
      <div className="absolute inset-0 z-0">
        {/* 배경 영상이 있다면 */}
        {/* <video
          autoPlay
          loop
          muted
          className="w-full h-full object-cover"
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video> */}
        
        {/* 배경 그라디언트 (누드핑크 톤) */}
        <div className="w-full h-full bg-gradient-to-br from-argen-400 via-argen-500 to-argen-700">
          <div className="absolute inset-0 bg-argen-900/20"></div>
        </div>
      </div>

      {/* 오버레이 (누드핑크 반투명) */}
      <div className="absolute inset-0 bg-argen-800/30 z-10"></div>

      {/* 콘텐츠 */}
      <div className="relative z-20 max-w-6xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* ARGEN STUDIO 로고 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-8"
          >
            <div className="inline-block">
              <div className="text-white/90 text-sm md:text-base font-light tracking-[0.3em] mb-2">
                POWERED BY
              </div>
              <div className="relative">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-white via-argen-100 to-white bg-clip-text text-transparent">
                    ARGEN STUDIO
                  </span>
                </h2>
                <div className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
              </div>
            </div>
          </motion.div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            당신의 취향을 아는
            <br />
            <span className="text-roseSoft">AI 인테리어 설계사</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 mb-10 max-w-2xl mx-auto leading-relaxed">
            집과 가족의 성향을 분석해, 예산에 맞는 설계와 스타일을 한 번에 제안합니다.
          </p>

          {/* CTA 버튼 2개 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection('modes')}
              className="w-full sm:w-auto bg-argen-500 text-white rounded-full px-8 py-4 font-semibold text-base md:text-lg hover:bg-argen-600 transition-all shadow-lg hover:shadow-xl min-h-[52px]"
            >
              무료로 시작하기
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection('features')}
              className="w-full sm:w-auto bg-transparent border-2 border-white/80 text-white rounded-full px-8 py-4 font-semibold text-base md:text-lg hover:bg-white/20 transition-all min-h-[52px]"
            >
              더 알아보기
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* 스크롤 인디케이터 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-white/50 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
