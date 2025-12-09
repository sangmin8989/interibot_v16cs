import { Suspense } from 'react'
import ResultContent from './ResultContent'

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-xl text-gray-700">결과를 준비하고 있습니다...</p>
          </div>
        </main>
      }
    >
      <ResultContent />
    </Suspense>
  )
}