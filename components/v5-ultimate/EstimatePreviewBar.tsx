import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface EstimatePreviewBarProps {
  pyeong?: number | null
  processCount: number
}

/**
 * 아주 단순한 추정치입니다.
 * - 평당 80~120만원 기준
 * - 공정 개수에 따라 가중치
 * 실제 견적과 다를 수 있으며, 참고용입니다.
 */
export default function EstimatePreviewBar({ pyeong, processCount }: EstimatePreviewBarProps) {
  const { min, max } = useMemo(() => {
    const py = Math.max(10, Math.min(pyeong || 30, 100)) // 10~100평 클램프
    const count = Math.max(1, processCount)
    const weight = 1 + (count - 1) * 0.15 // 공정 추가 시 15%씩 증가
    const baseMinPerPy = 800_000
    const baseMaxPerPy = 1_200_000
    const estMin = Math.round(py * baseMinPerPy * weight / 1_000_0) * 10_000
    const estMax = Math.round(py * baseMaxPerPy * weight / 1_000_0) * 10_000
    return { min: estMin, max: estMax }
  }, [pyeong, processCount])

  const progress = Math.min(100, (processCount / 8) * 100) // 대략 8개 공정 기준

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-40"
    >
      <div className="rounded-2xl border border-[#E8E0D5] bg-white shadow-lg p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm text-[#9B8C7A]">실시간 견적 미리보기 (참고용)</p>
            <p className="text-lg sm:text-xl font-semibold text-[#4A3D33]">
              약 {formatWon(min)} ~ {formatWon(max)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#9B8C7A]">선택된 공정</p>
            <p className="text-base font-semibold text-[#4A3D33]">{processCount}개</p>
            {pyeong ? <p className="text-xs text-[#9B8C7A]">{pyeong}평 기준</p> : null}
          </div>
        </div>
        <div className="h-2 bg-[#F7F3ED] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#B8956B] via-[#D6B892] to-[#F0D8B8] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-[#9B8C7A]">
          실제 견적과 차이가 있을 수 있습니다. 옵션·등급 선택에 따라 변동됩니다.
        </p>
      </div>
    </motion.div>
  )
}

function formatWon(value: number) {
  if (!value || Number.isNaN(value)) return '-'
  // 만원 단위로 간략 표기
  if (value >= 100_000_000) {
    return `${Math.round(value / 100_000_000)}억`
  }
  if (value >= 10_000) {
    return `${Math.round(value / 10_000)}만원`
  }
  return `${value.toLocaleString()}원`
}
