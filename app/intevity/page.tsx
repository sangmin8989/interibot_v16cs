'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import IntevityQuiz from '@/components/intevity/IntevityQuiz';
import IntevityResultView from '@/components/intevity/IntevityResult';
import { useIntevityStore } from '@/lib/store/intevityStore';

export default function IntevityPage() {
  const router = useRouter();
  const { result, reset } = useIntevityStore();

  useEffect(() => {
    // 첫 진입 시 상태 초기화 (세션 분리 목적)
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <header className="space-y-3">
          <p className="text-sm text-[#9B8C7A]">인테비티 7문항</p>
          <h1 className="text-4xl font-bold text-[#1F1F1F]">
            나의 인테리어 기준부터 확인하기
          </h1>
          <p className="text-base text-[#6B6B6B]">
            설명 없이 7문항만 선택하면, 혼합형 프로필과 근거/공감/충돌 예고를 바로 생성합니다.
          </p>
        </header>

        {!result ? (
          <IntevityQuiz onComplete={() => { /* 결과는 store에 저장됨 */ }} />
        ) : (
          <IntevityResultView
            result={result}
            onRestart={reset}
            onNext={() => router.push('/direction')}
          />
        )}
      </div>
    </main>
  );
}

