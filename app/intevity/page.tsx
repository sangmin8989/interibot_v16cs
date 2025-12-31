'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* 헤더 */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-[#E8E0D5] shadow-sm mb-2">
            <span className="text-xs font-semibold text-[#7A6A59]">STEP 1</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1F1F] tracking-tight">
            인테비티 7문항
          </h1>
          <p className="text-base text-[#6B6B6B] max-w-2xl mx-auto leading-relaxed">
            나의 인테리어 기준부터 확인하기
          </p>
          <p className="text-sm text-[#9B8C7A] max-w-xl mx-auto">
            7문항만 선택하면 혼합형 프로필과 근거를 바로 생성합니다
          </p>
        </motion.header>

        {/* 컨텐츠 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {!result ? (
            <IntevityQuiz onComplete={() => { /* 결과는 store에 저장됨 */ }} />
          ) : (
            <IntevityResultView
              result={result}
              onRestart={reset}
              onNext={() => router.push('/direction')}
            />
          )}
        </motion.div>
      </div>
    </main>
  );
}

