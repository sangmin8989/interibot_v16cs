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
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-[#E8E0D5] mb-2">
            <span className="text-xs font-semibold text-[#7A6A59]">
              내 인테비티: {profileType}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[#1F1F1F]">방향 선택</h1>
          <p className="text-[#6B6B6B] max-w-xl mx-auto">
            인테비티 결과를 바탕으로 3가지 방향을 준비했어요.
            <br />
            각 방향은 별점이나 추천 없이, 트레이드오프만 비교합니다.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            {profileTraits.map((trait) => (
              <span
                key={trait}
                className="px-3 py-1 rounded-full bg-[#F3ECE2] text-[#4A3D33] text-xs border border-[#E8E0D5]"
              >
                {trait}
              </span>
            ))}
          </div>
        </motion.div>

        {/* 옵션 카드 그리드 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {options.map((option) => (
            <DirectionCard
              key={option.code}
              option={option}
              isSelected={selectedCode === option.code}
              onSelect={() => select(option.code)}
            />
          ))}
        </motion.div>

        {/* 안내 메시지 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-[#E8E0D5] rounded-2xl p-4 text-sm text-[#6B6B6B] text-center"
        >
          💡 방향은 나중에 공간별로 다르게 선택할 수 있어요.
        </motion.div>

        {/* AI 옵션 추천 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-2xl">🤖</span>
            <h3 className="text-lg font-bold text-gray-800">AI 맞춤 옵션 추천</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            방향을 고민 중이신가요? AI가 당신의 상황에 맞는 3가지 옵션을 자동으로 추천해드립니다.
          </p>
          <button
            onClick={() => router.push('/v5/ai-quick-input')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            AI 추천받기 →
          </button>
        </motion.div>

        {/* 다음 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end gap-3"
        >
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border-2 border-[#E8E0D5] text-[#1F1F1F] font-semibold hover:bg-[#F7F3ED] transition-all"
          >
            이전
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedCode}
            className={`
              px-8 py-3 rounded-xl font-semibold transition-all
              ${
                selectedCode
                  ? 'bg-[#4A3D33] text-white hover:bg-[#3A2D23] shadow-lg'
                  : 'bg-[#E8E0D5] text-[#9B8C7A] cursor-not-allowed'
              }
            `}
          >
            다음 단계
          </button>
        </motion.div>
      </div>
    </div>
  );
}
