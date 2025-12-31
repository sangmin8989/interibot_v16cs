'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function Hero() {
  const router = useRouter()

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleStartClick = () => {
    // Intevity 성향 분석 페이지로 이동
    router.push('/intevity')
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 배경 영상/이미지 */}
      <div className="absolute inset-0 z-0">
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
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 mb-32 max-w-2xl mx-auto leading-relaxed">
            집과 가족의 성향을 분석해, 예산에 맞는 설계와 스타일을 한 번에 제안합니다.
          </p>

          {/* 메인 CTA 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartClick}
              className="group relative inline-flex items-center gap-3 px-8 py-4 
                         bg-[#FFFAE0]
                         text-[#9B6244] rounded-full text-lg font-bold
                         transition-all duration-300
                         overflow-hidden
                         border-2 border-white/30
                         hover:shadow-lg hover:shadow-yellow-100/50"
              style={{
                boxShadow: '0 0 25px rgba(255, 255, 255, 0.7), 0 0 10px rgba(255, 255, 255, 0.4)'
              }}
            >
              {/* 골드 글로우 테두리 (호버 시) */}
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   style={{
                     boxShadow: '0 0 20px rgba(255, 255, 200, 0.5), inset 0 0 20px rgba(255, 255, 200, 0.2)'
                   }}
              />
              
              {/* Shimmer 애니메이션 (호버 시) */}
              <div className="absolute inset-0 w-full h-full shimmer-animation opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* 반짝이는 점 3개 */}
              <span className="absolute top-2 left-4 w-1.5 h-1.5 bg-[#9B6244]/60 rounded-full sparkle-animation" 
                    style={{ animationDelay: '0s' }} />
              <span className="absolute top-3 right-8 w-1.5 h-1.5 bg-[#9B6244]/60 rounded-full sparkle-animation" 
                    style={{ animationDelay: '0.3s' }} />
              <span className="absolute bottom-2 left-1/2 w-1.5 h-1.5 bg-[#9B6244]/60 rounded-full sparkle-animation" 
                    style={{ animationDelay: '0.6s' }} />

              {/* 텍스트 */}
              <span className="relative z-10 flex items-center gap-3">
                <Sparkles className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span>AI 설계 시작하기</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-white/70 text-sm"
            >
              약 2분 소요 · 무료 · 회원가입 없음
            </motion.p>
          </motion.div>
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
