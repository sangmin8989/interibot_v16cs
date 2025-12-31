'use client'

import SeasonalTips from '@/components/v5-ultimate/SeasonalTips'

// 동적 렌더링 강제
export const dynamic = 'force-dynamic'

export default function V5TipsPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <SeasonalTips />
    </main>
  )
}
