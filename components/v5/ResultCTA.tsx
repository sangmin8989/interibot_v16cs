/**
 * Phase 4-3: 결과 페이지 CTA 컴포넌트
 * 
 * 공유 및 다음 단계 유도 버튼
 */

'use client'

interface ResultCTAProps {
  onShare: (type: 'kakao' | 'link') => void
  onEstimate: () => void
}

/**
 * 결과 페이지 CTA
 * 
 * 공유 버튼 및 견적 받기 버튼
 */
export default function ResultCTA({ onShare, onEstimate }: ResultCTAProps) {
  return (
    <div className="space-y-4">
      {/* 공유 버튼 그룹 */}
      <div className="flex gap-3">
        <button
          onClick={() => onShare('kakao')}
          className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-6 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <span>💬</span>
          <span>카카오로 공유</span>
        </button>
        <button
          onClick={() => onShare('link')}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <span>🔗</span>
          <span>링크 복사</span>
        </button>
      </div>

      {/* 견적 받기 버튼 */}
      <button
        onClick={onEstimate}
        className="w-full bg-gradient-to-r from-argen-500 to-purple-500 hover:from-argen-600 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
      >
        <span>견적 받기</span>
        <span>→</span>
      </button>
    </div>
  )
}




