/**
 * Phase 5-2: 리포트 액션 컴포넌트
 * 
 * 견적 상세 보기 및 상담 메모 저장
 */

'use client'

interface ReportActionsProps {
  onViewEstimate?: () => void
  onSaveMemo?: (memo: string) => void
}

/**
 * 리포트 액션
 * 
 * 견적 상세 보기 및 상담 메모 저장 버튼
 */
export default function ReportActions({ onViewEstimate, onSaveMemo }: ReportActionsProps) {
  const handleViewEstimate = () => {
    if (onViewEstimate) {
      onViewEstimate()
    } else {
      // 기본 동작: 견적 페이지로 이동
      window.location.href = '/onboarding/estimate'
    }
  }

  const handleSaveMemo = () => {
    const memo = prompt('상담 메모를 입력하세요:')
    if (memo && onSaveMemo) {
      onSaveMemo(memo)
      alert('상담 메모가 저장되었습니다.')
    }
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={handleViewEstimate}
        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
      >
        <span>견적 상세 보기</span>
        <span>→</span>
      </button>
      
      {onSaveMemo && (
        <button
          onClick={handleSaveMemo}
          className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl shadow-md transition-colors"
        >
          상담 메모 저장
        </button>
      )}
    </div>
  )
}




