'use client'

import { useRouter } from 'next/navigation'

type Mode = 'quick' | 'standard' | 'deep' | 'vibe'

interface ModeSelectionProps {
  showTitle?: boolean
  className?: string
}

export default function ModeSelection({ showTitle = true, className = '' }: ModeSelectionProps) {
  const router = useRouter()

  const handleModeSelect = (mode: Mode) => {
    router.push(`/space-info?mode=${mode}`)
  }

  const modes: Array<{
    mode: Mode
    icon: string
    title: string
    description: string
    features: string[]
  }> = [
    {
      mode: 'quick',
      icon: '⚡',
      title: 'Quick Mode',
      description: '3~4개 질문으로 빠르게 스타일과 색감을 추천받으세요',
      features: ['스타일·색감·예산 중심', '약 30초 소요', '빠른 추천'],
    },
    {
      mode: 'standard',
      icon: '🏠',
      title: 'Standard Mode',
      description: '8~10개 질문으로 가족 구성과 취향을 반영한 추천',
      features: ['가족·예산·취향 포함', '불편 요소 분석', '기본 사용자용'],
    },
    {
      mode: 'deep',
      icon: '🔍',
      title: 'Deep Mode',
      description: '15~20개 질문으로 건강, 수면, 정리 습관까지 상세 분석',
      features: ['건강·수면·아이·반려동물', '정리 습관 분석', '시공 가능성 고려'],
    },
    {
      mode: 'vibe',
      icon: '✨',
      title: 'Vibe Mode',
      description: 'MBTI, 혈액형, 별자리로 나만의 홈 바이브 타입 찾기',
      features: ['MBTI / 혈액형 / 별자리', 'My Home Vibe 타입 생성', 'SNS 공유용 리포트'],
    },
  ]

  return (
    <section id="modes" className={`py-20 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        {showTitle && (
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              나에게 맞는 분석 모드를 선택하세요
            </h2>
            <p className="text-xl text-gray-600">
              원하는 분석 깊이와 시간에 따라 4가지 모드 중에서 선택할 수 있습니다.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {modes.map((modeData) => (
            <div
              key={modeData.mode}
              onClick={() => handleModeSelect(modeData.mode)}
              className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all border border-slate-100"
            >
              <div className="text-4xl mb-4">{modeData.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{modeData.title}</h3>
              <p className="text-gray-600 mb-4">{modeData.description}</p>
              <ul className="text-sm text-gray-500 space-y-1">
                {modeData.features.map((feature, idx) => (
                  <li key={idx}>• {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 사진 업로드 옵션 */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">또는</p>
          <button
            onClick={() => router.push('/upload')}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl text-lg font-semibold"
          >
            📸 사진 업로드로 분석하기
          </button>
          <p className="text-sm text-gray-500 mt-2">
            인테리어 사진을 업로드하면 AI가 자동으로 분석해드립니다
          </p>
        </div>
      </div>
    </section>
  )
}


