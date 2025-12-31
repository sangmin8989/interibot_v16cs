import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Share2 } from 'lucide-react'

type Letter = 'H' | 'M' | 'C' | 'W'

type Option = {
  label: string
  letter: Letter
  description: string
  emoji: string
}

type Question = {
  id: string
  title: string
  options: Option[]
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    title: '집에서 쉬는 스타일에 가까운 건?',
    options: [
      { label: '홈카페 느낌을 즐겨요', letter: 'H', description: '포근한 감성, 디저트/커피 타임', emoji: '☕' },
      { label: '가볍게 정돈된 공간이 좋아요', letter: 'M', description: '심플함, 최소한의 물건', emoji: '🧘' },
    ],
  },
  {
    id: 'q2',
    title: '선호하는 색감은?',
    options: [
      { label: '색 포인트/소품을 좋아해요', letter: 'C', description: '컬러 포인트, 활기찬 무드', emoji: '🎨' },
      { label: '톤온톤·뉴트럴이 편해요', letter: 'M', description: '뉴트럴, 깔끔한 톤온톤', emoji: '🤍' },
    ],
  },
  {
    id: 'q3',
    title: '재질과 소재 취향은?',
    options: [
      { label: '우드/패브릭이 편안해요', letter: 'W', description: '우드, 패브릭, 자연 소재', emoji: '🪵' },
      { label: '메탈/유리의 세련미', letter: 'C', description: '메탈, 유리, 모던한 느낌', emoji: '🪟' },
    ],
  },
  {
    id: 'q4',
    title: '정리·수납에 대한 생각은?',
    options: [
      { label: '보이는 건 최소, 숨김 수납 선호', letter: 'M', description: '미니멀, 숨김 수납', emoji: '📦' },
      { label: '보이는 소품도 분위기의 일부', letter: 'H', description: '디스플레이, 오브제', emoji: '🕯️' },
    ],
  },
]

const LETTER_DESC: Record<Letter, { title: string; summary: string }> = {
  H: { title: '홈카페 러버', summary: '포근한 감성과 소품, 커피 타임을 즐김' },
  M: { title: '미니멀리스트', summary: '심플/정돈, 숨김 수납과 깔끔한 동선' },
  C: { title: '컬러 센서티브', summary: '포인트 컬러와 톤 조합에 민감' },
  W: { title: '우드 매니아', summary: '우드/패브릭 등 자연 소재를 선호' },
}

function buildType(letters: Letter[]) {
  // 출현 순으로 2~4글자 조합
  const unique: Letter[] = []
  letters.forEach((l) => {
    if (!unique.includes(l)) unique.push(l)
  })
  return unique.slice(0, 4).join('')
}

function formatShareText(type: string, topLetters: Letter[]) {
  const labels = topLetters
    .map((l) => LETTER_DESC[l]?.title || l)
    .join(', ')
  return `인테리봇 인테리어 MBTI: ${type}\n핵심 취향: ${labels}`
}

export default function MBTIQuiz() {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Letter>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [copied, setCopied] = useState(false)

  const progress = Math.round(((current) / QUESTIONS.length) * 100)

  const letters = useMemo(() => Object.values(answers) as Letter[], [answers])
  const resultType = useMemo(() => (isComplete ? buildType(letters) : ''), [isComplete, letters])
  const topLetters = useMemo(() => {
    const counts: Record<Letter, number> = { H: 0, M: 0, C: 0, W: 0 }
    letters.forEach((l) => {
      counts[l] = (counts[l] || 0) + 1
    })
    return (Object.entries(counts) as [Letter, number][])
      .sort((a, b) => b[1] - a[1])
      .filter(([, v]) => v > 0)
      .map(([k]) => k)
      .slice(0, 3)
  }, [letters])

  const handleSelect = (letter: Letter) => {
    const qid = QUESTIONS[current].id
    const next = { ...answers, [qid]: letter }
    setAnswers(next)

    if (current + 1 >= QUESTIONS.length) {
      setIsComplete(true)
    } else {
      setCurrent((v) => v + 1)
    }
  }

  const handleRestart = () => {
    setCurrent(0)
    setAnswers({})
    setIsComplete(false)
    setCopied(false)
  }

  const handleShare = async () => {
    if (!resultType) return
    try {
      await navigator.clipboard.writeText(formatShareText(resultType, topLetters))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <p className="text-sm text-[#9B8C7A]">인테리어 MBTI</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1F1F1F] mt-2">
            몇 번만 눌러서 내 인테리어 MBTI 알아보기
          </h1>
          <p className="text-sm text-[#7A6A59] mt-2">총 {QUESTIONS.length}문 | 취향 태그 조합으로 결과를 만들어요.</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-[#9B8C7A] mb-1">
            <span>{Math.min(current + 1, QUESTIONS.length)} / {QUESTIONS.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-[#F3ECE2] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#B8956B] via-[#D6B892] to-[#F0D8B8] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isComplete ? (
            <motion.div
              key={QUESTIONS[current].id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="p-5 rounded-2xl bg-white border border-[#E8E0D5] shadow-sm">
                <h2 className="text-2xl font-semibold text-[#1F1F1F] mb-4 flex items-center gap-2">
                  {QUESTIONS[current].title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {QUESTIONS[current].options.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleSelect(opt.letter)}
                      className="w-full text-left p-4 rounded-2xl border-2 border-[#E8E0D5] bg-white hover:border-[#B8956B] hover:bg-[#FDFBF7] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{opt.emoji}</span>
                        <div>
                          <p className="font-semibold text-[#1F1F1F]">{opt.label}</p>
                          <p className="text-sm text-[#7A6A59]">{opt.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="p-6 rounded-2xl bg-white border border-[#E8E0D5] shadow-md space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-[#9B8C7A]">당신의 인테리어 MBTI</p>
                  <p className="text-3xl font-bold text-[#1F1F1F] mt-1">{resultType || 'MBTI'}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {topLetters.map((l) => (
                      <span
                        key={l}
                        className="px-3 py-1 rounded-full text-sm bg-[#F3ECE2] text-[#4A3D33] border border-[#E8E0D5]"
                      >
                        {LETTER_DESC[l]?.title || l}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-[#9B8C7A]">
                  {QUESTIONS.length}문 완료
                </div>
              </div>

              <div className="space-y-2">
                {topLetters.map((l) => (
                  <div key={l} className="p-3 rounded-xl bg-[#FDFBF7] border border-[#E8E0D5]">
                    <p className="font-semibold text-[#1F1F1F]">{LETTER_DESC[l]?.title || l}</p>
                    <p className="text-sm text-[#7A6A59] mt-1">{LETTER_DESC[l]?.summary || ''}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <button
                  onClick={handleShare}
                  className="w-full py-3 rounded-xl bg-[#B8956B] text-white font-semibold hover:bg-[#A08056] transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {copied ? '복사 완료!' : '결과 복사/공유'}
                </button>
                <button
                  onClick={handleRestart}
                  className="w-full py-3 rounded-xl border border-[#E8E0D5] text-[#7A6A59] hover:bg-[#F8F3EC] transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  다시 하기
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
