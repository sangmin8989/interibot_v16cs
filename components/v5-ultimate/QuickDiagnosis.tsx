import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react'

export interface QuickDiagnosisResult {
  styleId: string
  styleName: string
  styleTag: string
  confidence: number
  selections: string[]
}

interface QuickDiagnosisProps {
  onComplete: (result: QuickDiagnosisResult) => void
}

type StyleOption = {
  id: string
  name: string
  styleTag: string
  image: string
  fallbackGradient: string
  emoji: string
  description: string
}

const STYLE_PAIRS: Array<[StyleOption, StyleOption]> = [
  [
    {
      id: 'clean-white',
      name: '깔끔한 화이트',
      styleTag: '미니멀 모던',
      image: '/moods/clean-white.jpg',
      fallbackGradient: 'from-gray-50 via-slate-50 to-zinc-50',
      emoji: '🤍',
      description: '군더더기 없이 정돈된 공간',
    },
    {
      id: 'warm-wood',
      name: '따뜻한 우드',
      styleTag: '내추럴 모던',
      image: '/moods/warm-wood.jpg',
      fallbackGradient: 'from-amber-50 via-orange-50 to-yellow-50',
      emoji: '🪵',
      description: '원목의 따스함이 느껴지는 공간',
    },
  ],
  [
    {
      id: 'cozy-living',
      name: '포근한 거실',
      styleTag: '코지 내추럴',
      image: '/moods/cozy-living.jpg',
      fallbackGradient: 'from-stone-100 via-amber-50 to-orange-50',
      emoji: '🛋️',
      description: '가족이 모이는 따뜻한 공간',
    },
    {
      id: 'modern-kitchen',
      name: '모던 주방',
      styleTag: '모던 심플',
      image: '/moods/modern-kitchen.jpg',
      fallbackGradient: 'from-slate-100 via-gray-100 to-stone-100',
      emoji: '🍳',
      description: '요리가 즐거워지는 세련된 공간',
    },
  ],
  [
    {
      id: 'lux-hotel',
      name: '호텔식 무드',
      styleTag: '럭셔리 클래식',
      image: '/moods/lux-hotel.jpg',
      fallbackGradient: 'from-zinc-900 via-slate-800 to-gray-800',
      emoji: '🏨',
      description: '고급스러운 호텔 감성',
    },
    {
      id: 'scandi',
      name: '스칸디 감성',
      styleTag: '스칸디 내추럴',
      image: '/moods/scandi.jpg',
      fallbackGradient: 'from-emerald-50 via-teal-50 to-lime-50',
      emoji: '🌿',
      description: '밝고 편안한 북유럽 감성',
    },
  ],
  [
    {
      id: 'industrial',
      name: '인더스트리얼',
      styleTag: '빈티지 모던',
      image: '/moods/industrial.jpg',
      fallbackGradient: 'from-zinc-800 via-neutral-800 to-slate-700',
      emoji: '🏭',
      description: '노출 콘크리트, 메탈 포인트',
    },
    {
      id: 'classic',
      name: '클래식 우아함',
      styleTag: '클래식',
      image: '/moods/classic.jpg',
      fallbackGradient: 'from-amber-100 via-orange-100 to-yellow-100',
      emoji: '🪞',
      description: '우아한 몰딩과 조명',
    },
  ],
  [
    {
      id: 'minimal',
      name: '미니멀 블랙',
      styleTag: '미니멀',
      image: '/moods/minimal.jpg',
      fallbackGradient: 'from-slate-200 via-slate-300 to-slate-400',
      emoji: '⚫️',
      description: '선이 깔끔한 최소 디자인',
    },
    {
      id: 'kids-friendly',
      name: '패브릭 포근',
      styleTag: '패밀리 코지',
      image: '/moods/kids-friendly.jpg',
      fallbackGradient: 'from-pink-50 via-rose-50 to-orange-50',
      emoji: '🧸',
      description: '아이와 함께 쓰기 좋은 포근함',
    },
  ],
]

const TOTAL_ROUNDS = 5

export default function QuickDiagnosis({ onComplete }: QuickDiagnosisProps) {
  const [round, setRound] = useState(0)
  const [selections, setSelections] = useState<string[]>([])
  const [isFinished, setIsFinished] = useState(false)
  const [finalResult, setFinalResult] = useState<QuickDiagnosisResult | null>(null)

  // 5회 선택 완료 시 자동으로 다음 단계로 이동 (사용자가 헷갈리지 않도록)
  useEffect(() => {
    if (isFinished && finalResult) {
      const timer = setTimeout(() => {
        onComplete(finalResult)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [isFinished, finalResult, onComplete])

  const currentPair = useMemo(() => {
    const index = round % STYLE_PAIRS.length
    return STYLE_PAIRS[index]
  }, [round])

  const progress = Math.round((selections.length / TOTAL_ROUNDS) * 100)

  const handleSelect = (style: StyleOption) => {
    if (isFinished) return
    const nextSelections = [...selections, style.id]
    setSelections(nextSelections)

    const nextRound = round + 1
    if (nextRound >= TOTAL_ROUNDS) {
      setIsFinished(true)
      const scoreMap = nextSelections.reduce<Record<string, { count: number; lastId: string; lastName: string; lastTag: string }>>(
        (acc, id) => {
          const opt =
            STYLE_PAIRS.flat().find((o) => o.id === id) ||
            currentPair.find((o) => o.id === id)
          if (!opt) return acc
          if (!acc[opt.styleTag]) acc[opt.styleTag] = { count: 0, lastId: opt.id, lastName: opt.name, lastTag: opt.styleTag }
          acc[opt.styleTag].count += 1
          acc[opt.styleTag].lastId = opt.id
          acc[opt.styleTag].lastName = opt.name
          acc[opt.styleTag].lastTag = opt.styleTag
          return acc
        },
        {}
      )

      const sorted = Object.entries(scoreMap).sort((a, b) => b[1].count - a[1].count)
      const top = sorted[0]
      const confidence = Math.round((top[1].count / TOTAL_ROUNDS) * 100)

      setFinalResult({
        styleId: top[1].lastId,
        styleName: top[1].lastName,
        styleTag: top[1].lastTag,
        confidence,
        selections: nextSelections,
      })
    } else {
      setRound(nextRound)
    }
  }

  const handleConfirm = () => {
    if (!finalResult) return
    onComplete(finalResult)
  }

  const handleRestart = () => {
    setRound(0)
    setSelections([])
    setIsFinished(false)
    setFinalResult(null)
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#F3ECE2] rounded-xl">
          <Sparkles className="w-5 h-5 text-[#B8956B]" />
        </div>
        <div>
          <p className="text-sm text-[#9B8C7A]">3초 진단</p>
          <p className="text-xl font-semibold text-[#5A4B3C]">사진 2장 중 더 끌리는 공간을 선택하세요</p>
        </div>
        <div className="ml-auto text-sm text-[#9B8C7A]">
          {selections.length}/{TOTAL_ROUNDS}회
        </div>
      </div>

      <div className="w-full h-2 bg-[#F3ECE2] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#B8956B] via-[#D6B892] to-[#F0D8B8] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={round}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {currentPair.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              className="relative overflow-hidden rounded-2xl border-2 border-[#E8E0D5] bg-white shadow-sm hover:shadow-md transition-all"
              disabled={isFinished}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${option.fallbackGradient}`} />
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,#000_1px,transparent_1px)] [background-size:18px_18px]" />

              <div className="relative p-4 flex flex-col gap-3 min-h-[180px]">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{option.emoji}</span>
                  <div>
                    <p className="font-semibold text-[#4A3D33]">{option.name}</p>
                    <p className="text-sm text-[#8B7A68]">{option.styleTag}</p>
                  </div>
                </div>
                <p className="text-sm text-[#6B5B4A] leading-relaxed">{option.description}</p>
                <div className="flex items-center gap-2 text-sm text-[#9B8C7A] mt-auto">
                  <span className="flex items-center gap-1">
                    <ArrowRight className="w-4 h-4" />
                    선택해서 다음으로
                  </span>
                </div>
              </div>
            </button>
          ))}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isFinished && finalResult && (
          <motion.div
            key="result-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mt-6 p-4 rounded-2xl border border-[#E8E0D5] bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#F3ECE2] rounded-xl">
                <Sparkles className="w-5 h-5 text-[#B8956B]" />
              </div>
              <div>
                <p className="text-sm text-[#9B8C7A]">예상 스타일</p>
                <p className="text-lg font-semibold text-[#4A3D33]">{finalResult.styleName}</p>
                <p className="text-sm text-[#7A6A59]">{finalResult.styleTag}</p>
              </div>
              <div className="ml-auto text-sm text-[#9B8C7A]">
                신뢰도 {finalResult.confidence}%
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3 mt-3">
              <div className="w-full py-3 rounded-xl bg-[#B8956B] text-white font-semibold flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                다음 단계로 이동 중이에요...
              </div>
              <button
                onClick={handleRestart}
                className="w-full py-3 rounded-xl border border-[#E8E0D5] text-[#7A6A59] hover:bg-[#F8F3EC] transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                다시 선택하기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
