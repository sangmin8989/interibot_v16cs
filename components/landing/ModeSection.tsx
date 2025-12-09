'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Home, Search, Sparkles } from 'lucide-react'
import { usePersonalityStore } from '@/lib/store/personalityStore'

type ModeId = 'quick' | 'standard' | 'deep' | 'vibe'

type Mode = {
  id: ModeId
  label: string
  timeLabel: string
  description: string
  bullets: string[]
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const MODES: Mode[] = [
  {
    id: 'quick',
    label: 'Quick Mode',
    timeLabel: '10분',
    description: '3~4개 핵심 질문으로 스타일과 색감을 빠르게 추천받는 모드입니다.',
    bullets: [
      '스타일·색감·예산 중심',
      '약 30초~1분 소요',
      '처음 사용하는 고객에게 적합',
    ],
    icon: Zap,
  },
  {
    id: 'standard',
    label: 'Standard Mode',
    timeLabel: '15분',
    description: '8~10개 질문으로 가족 구성과 취향을 반영한 균형 잡힌 추천을 제공합니다.',
    bullets: ['가족·예산·취향 포함', '불편 요소 분석', '기본 사용자용'],
    icon: Home,
  },
  {
    id: 'deep',
    label: 'Deep Mode',
    timeLabel: '25분',
    description: '15~20개 질문으로 건강, 수면, 정리 습관까지 상세하게 분석하는 심화 모드입니다.',
    bullets: ['건강·수면·아이·반려동물', '정리 습관 분석', '시공 가능성 고려'],
    icon: Search,
  },
  {
    id: 'vibe',
    label: 'My Way',
    timeLabel: '5분',
    description: 'MBTI, 혈액형, 별자리로 나만의 홈 바이브 타입을 찾는 가벼운 성향 테스트입니다.',
    bullets: ['MBTI / 혈액형 / 별자리', 'My Home Vibe 타입 생성', 'SNS 공유용 리포트'],
    icon: Sparkles,
  },
]

export default function ModeSection() {
  const router = useRouter()
  const { setAnalysisMode } = usePersonalityStore()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const handleModeSelect = (modeId: ModeId) => {
    // ✅ 모드를 Store에 저장 (AI 분석하기 버튼 누를 때 사용)
    setAnalysisMode(modeId)
    router.push(`/space-info?mode=${modeId}`)
  }

  return (
    <section id="modes" ref={ref} className="bg-argen-50 py-20 md:py-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 md:px-6">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-argen-800">
            나에게 맞는 분석 모드를 선택하세요
          </h2>
          <p className="text-base md:text-base text-argen-600 leading-relaxed">
            원하는 분석 깊이와 시간에 따라 4가지 모드 중에서 선택할 수 있습니다.
          </p>
        </motion.div>

        {/* 카드 그리드 */}
        <div className="grid gap-6 md:grid-cols-2">
          {MODES.map((mode, index) => {
            const Icon = mode.icon
            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                onClick={() => handleModeSelect(mode.id)}
                className="relative flex flex-col justify-between rounded-2xl bg-white/85 border border-argen-100 p-6 md:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all cursor-pointer active:scale-95"
              >
                {/* 시간 뱃지 */}
                <div className="absolute right-4 top-4 md:right-6 md:top-6 inline-flex items-center rounded-full bg-argen-50 px-3 py-1.5 text-sm font-medium text-argen-700 border border-argen-100">
                  {mode.timeLabel}
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-full bg-argen-50 border border-argen-100 flex-shrink-0">
                    <Icon className="h-6 w-6 text-argen-700" />
                  </div>
                  <div className="space-y-2 pr-16">
                    <h3 className="text-lg md:text-xl font-semibold text-argen-800">
                      {mode.label}
                    </h3>
                    <p className="text-sm md:text-base leading-relaxed text-argen-600">
                      {mode.description}
                    </p>
                  </div>
                </div>

                <ul className="mt-6 space-y-2 text-sm md:text-base text-argen-600">
                  {mode.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-argen-400 flex-shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
