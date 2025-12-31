'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useIntevityStore } from '@/lib/store/intevityStore';
import { useDirectionStore } from '@/lib/store/directionStore';
import DirectionCard from '@/components/direction/DirectionCard';

export default function DirectionPage() {
  const router = useRouter();
  const intevity = useIntevityStore((s) => s.result);
  const {
    options,
    profileType,
    profileTraits,
    selectedCode,
    setFromIntevity,
    select,
  } = useDirectionStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 인테비티 결과가 없으면 redirect
    if (!intevity) {
      router.push('/intevity');
      return;
    }

    // 옵션이 없으면 생성
    if (options.length === 0) {
      setFromIntevity(intevity);
    }
  }, [intevity, options.length, setFromIntevity, router]);

  if (!mounted || !intevity || options.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3D33] mx-auto mb-4" />
          <p className="text-sm text-[#6B6B6B]">방향 옵션 준비 중...</p>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (!selectedCode) {
      alert('방향을 선택해주세요.');
      return;
    }

    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6">
      <div className="w-full max-w-5xl mx-auto space-y-10">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-[#E8E0D5] shadow-sm mb-2">
            <span className="text-xs font-semibold text-[#7A6A59]">
              STEP 2 · {profileType}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1F1F] tracking-tight">
            방향 선택
          </h1>
          <p className="text-base text-[#6B6B6B] max-w-2xl mx-auto leading-relaxed">
            인테비티 결과를 바탕으로 3가지 방향을 준비했어요
          </p>
          <p className="text-sm text-[#9B8C7A] max-w-xl mx-auto">
            각 방향은 별점이나 추천 없이, 트레이드오프만 비교합니다
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {profileTraits.map((trait) => (
              <span
                key={trait}
                className="px-3 py-1.5 rounded-full bg-white text-[#4A3D33] text-xs font-medium border border-[#E8E0D5] shadow-sm"
              >
                {trait}
              </span>
            ))}
          </div>
        </motion.div>

        {/* 옵션 카드 그리드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {options.map((option, index) => (
            <motion.div
              key={option.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <DirectionCard
                option={option}
                isSelected={selectedCode === option.code}
                onSelect={() => select(option.code)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* AI 옵션 추천 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white border-2 border-[#E8E0D5] rounded-2xl p-6 sm:p-8 shadow-sm"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">🤖</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#1F1F1F] mb-2">
                AI 맞춤 옵션 추천
              </h3>
              <p className="text-sm text-[#6B6B6B] max-w-md mx-auto">
                방향을 고민 중이신가요? AI가 당신의 상황에 맞는 3가지 옵션을 자동으로 추천해드립니다
              </p>
            </div>
            <button
              onClick={() => router.push('/v5/ai-quick-input')}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#4A3D33] text-white font-semibold hover:bg-[#3A2D23] transition-all shadow-md hover:shadow-lg"
            >
              AI 추천받기 →
            </button>
          </div>
        </motion.div>

        {/* 안내 메시지 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-[#F7F3ED] rounded-2xl p-4 text-center"
        >
          <p className="text-sm text-[#6B6B6B]">
            💡 방향은 나중에 공간별로 다르게 선택할 수 있어요
          </p>
        </motion.div>

        {/* 하단 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4"
        >
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-[#E8E0D5] text-[#1F1F1F] font-semibold hover:bg-[#F7F3ED] transition-all"
          >
            ← 이전
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedCode}
            className={`
              w-full sm:flex-1 sm:max-w-xs px-8 py-3 rounded-xl font-semibold transition-all
              ${
                selectedCode
                  ? 'bg-[#4A3D33] text-white hover:bg-[#3A2D23] shadow-md hover:shadow-lg'
                  : 'bg-[#E8E0D5] text-[#9B8C7A] cursor-not-allowed'
              }
            `}
          >
            다음 단계 →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
