'use client'

import { useEffect, useMemo, useState } from 'react'

// 동적 렌더링 강제 (빌드 타임 정적 생성 방지)
export const dynamic = 'force-dynamic'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, CheckCircle2, Plus, RefreshCw } from 'lucide-react'

type Vote = {
  id: string
  name: string
  choice: string
  memo?: string
  createdAt: string
}

const STYLE_CHOICES = [
  { id: 'modern', label: '모던/미니멀', emoji: '🤍' },
  { id: 'natural', label: '내추럴/우드', emoji: '🪵' },
  { id: 'scandi', label: '스칸디/포근', emoji: '🌿' },
  { id: 'hotel', label: '호텔식/럭셔리', emoji: '🏨' },
  { id: 'color', label: '컬러/포인트', emoji: '🎨' },
]

export default function FamilyVotePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [pollId, setPollId] = useState<string>('')
  const [name, setName] = useState('')
  const [choice, setChoice] = useState<string>('')
  const [memo, setMemo] = useState('')
  const [votes, setVotes] = useState<Vote[]>([])
  const [copied, setCopied] = useState(false)

  // 초기 pollId 생성/복원
  useEffect(() => {
    const urlPoll = searchParams.get('poll')
    if (urlPoll) {
      setPollId(urlPoll)
      return
    }
    const newId = `fam_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
    setPollId(newId)
    // URL에 poll 파라미터 추가
    const params = new URLSearchParams(searchParams.toString())
    params.set('poll', newId)
    router.replace(`/v5/family?${params.toString()}`)
  }, [searchParams, router])

  // 투표 불러오기
  useEffect(() => {
    if (!pollId) return
    const raw = localStorage.getItem(`family-votes-${pollId}`)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setVotes(parsed)
        }
      } catch {
        // ignore
      }
    }
  }, [pollId])

  // 투표 저장
  const saveVotes = (next: Vote[]) => {
    setVotes(next)
    localStorage.setItem(`family-votes-${pollId}`, JSON.stringify(next))
  }

  const handleSubmit = () => {
    if (!name.trim() || !choice) return
    const next: Vote[] = [
      ...votes,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        choice,
        memo: memo.trim() || undefined,
        createdAt: new Date().toISOString(),
      },
    ]
    saveVotes(next)
    setName('')
    setChoice('')
    setMemo('')
  }

  const handleReset = () => {
    saveVotes([])
  }

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const summary = useMemo(() => {
    const counts: Record<string, number> = {}
    votes.forEach((v) => {
      counts[v.choice] = (counts[v.choice] || 0) + 1
    })
    const total = votes.length || 1
    return STYLE_CHOICES.map((s) => ({
      ...s,
      count: counts[s.id] || 0,
      ratio: Math.round(((counts[s.id] || 0) / total) * 100),
    }))
  }, [votes])

  const topChoice = useMemo(() => {
    return [...summary].sort((a, b) => b.count - a.count)[0]
  }, [summary])

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-[#9B8C7A]">가족 의견 모으기</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1F1F1F]">
            가족·지인 투표 링크 공유하고 취향 합치기
          </h1>
          <p className="text-sm text-[#7A6A59]">
            링크를 공유하면 누구나 클릭 한 번으로 투표하고, 결과가 실시간으로 갱신됩니다.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-3">
            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-xl bg-[#B8956B] text-white text-sm font-semibold hover:bg-[#A08056] transition-colors flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              {copied ? '링크 복사 완료' : '투표 링크 복사'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl border border-[#E8E0D5] text-[#7A6A59] text-sm hover:bg-[#F8F3EC] transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              투표 초기화
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 투표 입력 */}
          <div className="p-5 rounded-2xl border border-[#E8E0D5] bg-white shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-[#1F1F1F] flex items-center gap-2">
              <Plus className="w-4 h-4" />
              투표하기
            </h2>
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름 또는 별명"
                className="w-full px-3 py-3 rounded-xl border border-[#E8E0D5] bg-[#FDFBF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B]"
              />
              <div className="grid grid-cols-2 gap-2">
                {STYLE_CHOICES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setChoice(s.id)}
                    className={`
                      w-full text-left p-3 rounded-xl border-2 transition-all
                      ${choice === s.id ? 'border-[#B8956B] bg-[#FDFBF7]' : 'border-[#E8E0D5] bg-white hover:border-[#B8956B]'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{s.emoji}</span>
                      <span className="text-sm text-[#1F1F1F]">{s.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="추가 의견 (선택)"
                rows={3}
                className="w-full px-3 py-3 rounded-xl border border-[#E8E0D5] bg-[#FDFBF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#B8956B] resize-none"
              />
              <button
                onClick={handleSubmit}
                disabled={!name.trim() || !choice}
                className={`
                  w-full py-3 rounded-xl text-white font-semibold transition-colors
                  ${!name.trim() || !choice ? 'bg-[#D3C5B5] cursor-not-allowed' : 'bg-[#B8956B] hover:bg-[#A08056]'}
                `}
              >
                투표 등록
              </button>
            </div>
          </div>

          {/* 결과 요약 */}
          <div className="p-5 rounded-2xl border border-[#E8E0D5] bg-white shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-[#1F1F1F] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              실시간 결과
            </h2>
            <div className="space-y-3">
              {summary.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl border border-[#E8E0D5] bg-[#FDFBF7] flex items-center gap-3"
                >
                  <span className="text-xl">{s.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm text-[#1F1F1F] font-semibold">{s.label}</p>
                    <div className="h-2 bg-white rounded-full overflow-hidden mt-2 border border-[#E8E0D5]">
                      <div
                        className="h-full bg-gradient-to-r from-[#B8956B] to-[#D6B892] transition-all"
                        style={{ width: `${s.ratio}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-[#7A6A59] w-12 text-right">
                    {s.count}명
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#E8E0D5] text-sm text-[#7A6A59]">
              {topChoice ? (
                <>
                  현재 가장 많은 선택: <span className="font-semibold text-[#4A3D33]">{topChoice.label}</span> ({topChoice.count}명)
                </>
              ) : (
                '아직 투표가 없습니다.'
              )}
            </div>
          </div>
        </div>

        {/* 투표 리스트 */}
        <div className="p-5 rounded-2xl border border-[#E8E0D5] bg-white shadow-sm space-y-3">
          <h3 className="text-base font-semibold text-[#1F1F1F]">투표 내역</h3>
          <AnimatePresence>
            {votes.length === 0 ? (
              <p className="text-sm text-[#7A6A59]">아직 투표가 없습니다. 링크를 복사해 가족/지인에게 공유하세요.</p>
            ) : (
              votes
                .slice()
                .reverse()
                .map((v) => {
                  const style = STYLE_CHOICES.find((s) => s.id === v.choice)
                  return (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="p-3 rounded-xl border border-[#E8E0D5] bg-[#FDFBF7]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{style?.emoji}</span>
                        <p className="text-sm font-semibold text-[#1F1F1F]">{v.name}</p>
                        <span className="text-sm text-[#7A6A59]">· {style?.label}</span>
                        <span className="ml-auto text-xs text-[#9B8C7A]">
                          {new Date(v.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {v.memo ? <p className="text-sm text-[#7A6A59] mt-1">{v.memo}</p> : null}
                    </motion.div>
                  )
                })
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
