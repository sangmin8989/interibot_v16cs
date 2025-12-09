'use client'

export default function EstimateAdvice() {
  const adviceItems = [
    {
      icon: '🎯',
      title: '맞춤 설계',
      description: '귀하의 성향 분석 결과를 바탕으로 최적의 자재와 공정을 추천했습니다.'
    },
    {
      icon: '💰',
      title: '예산 계획',
      description: '간접공사비(산재보험, 관리비 등)까지 포함된 정확한 견적입니다.'
    },
    {
      icon: '✅',
      title: '품질 보장',
      description: '검증된 브랜드 자재로 시공 품질을 보장합니다.'
    },
    {
      icon: '👨‍🔧',
      title: '전문가 상담',
      description: '더 자세한 상담이 필요하시면 전문가와 연결해드립니다.'
    }
  ]

  return (
    <div className="bg-gradient-to-br from-argen-50 to-roseSoft/30 rounded-2xl shadow-xl border border-argen-200 p-6 md:p-8 mb-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="text-4xl">🤖</div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">인테리봇의 조언</h3>
          <p className="text-sm text-gray-600">
            AI 분석 기반으로 최적화된 견적을 제공합니다
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adviceItems.map((item, idx) => (
          <div key={idx} className="bg-white/70 rounded-xl p-4 border border-argen-100">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-700">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}







