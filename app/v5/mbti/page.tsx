'use client'

import MBTIQuiz from '@/components/v5-ultimate/MBTIQuiz'

// 동적 렌더링 강제
export const dynamic = 'force-dynamic'

export default function V5MbtiPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <MBTIQuiz />
    </main>
  )
}
