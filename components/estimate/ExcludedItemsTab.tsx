'use client'

export default function ExcludedItemsTab() {
  const excludedItems = [
    '가전제품 (냉장고, 세탁기, TV 등)',
    '가구 (소파, 침대, 식탁 등)',
    '커튼 및 블라인드',
    '조명 기구 (매입등 제외)',
    '에어컨 설치',
    '인테리어 소품 및 장식품',
    '이사 비용',
    '폐기물 처리 비용 (일부 대형 폐기물)'
  ]

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">❌ 불포함 항목</h3>
      <p className="text-sm text-gray-600 mb-6">
        아래 항목들은 견적에 포함되지 않습니다. 추가 시공을 원하시면 별도 상담이 필요합니다.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {excludedItems.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-red-500 text-xl mt-0.5">•</span>
            <span className="text-gray-700">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}










