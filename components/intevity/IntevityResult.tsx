'use client';

import { motion } from 'framer-motion';
import type { IntevityResult } from '@/lib/intevity/types';
import { getTraitImpactMap } from '@/lib/intevity/analyzer';

interface IntevityResultProps {
  result: IntevityResult;
  onRestart?: () => void;
  onNext?: () => void;
}

export default function IntevityResultView({ result, onRestart, onNext }: IntevityResultProps) {
  const traitImpacts = getTraitImpactMap(result.profile.traits);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-[#E8E0D5] rounded-2xl p-6 shadow-sm">
        <p className="text-sm text-[#9B8C7A] mb-2">인테비티 결과</p>
        <h1 className="text-3xl font-bold text-[#1F1F1F] mb-2">{result.profile.type}</h1>
        <p className="text-[#6B6B6B] leading-relaxed">{result.profile.description}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {result.profile.traits.map((t) => (
            <div key={t} className="flex flex-col gap-1">
              <span className="px-3 py-1 rounded-full bg-[#F3ECE2] text-[#4A3D33] text-sm border border-[#E8E0D5]">
                {t}
              </span>
              {traitImpacts[t] && (
                <span className="text-xs text-[#7A6A59] px-2 text-center">
                  {traitImpacts[t]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white border border-[#E8E0D5] rounded-2xl p-6 shadow-sm space-y-3"
      >
        <h3 className="text-lg font-bold text-[#1F1F1F]">선택 근거 리플레이</h3>
        {result.reasoningReplay.map((item) => (
          <div
            key={item.questionId}
            className="p-3 rounded-xl bg-[#FDFBF7] border border-[#E8E0D5]"
          >
            <p className="text-sm font-semibold text-[#1F1F1F]">{item.question}</p>
            <p className="text-sm text-[#7A6A59] mt-1">답변: {item.answer}</p>
            <p className="text-sm text-[#6B6B6B] mt-1">{item.reason}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="bg-white border border-[#E8E0D5] rounded-2xl p-6 shadow-sm"
      >
        <h3 className="text-lg font-bold text-[#1F1F1F] mb-2">일상 공감</h3>
        <p className="text-sm text-[#6B6B6B] leading-relaxed">
          {result.dailyEmpathy}
        </p>
      </motion.div>

      {result.conflictWarning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-[#FFF7E6] border border-[#F2D8A7] rounded-2xl p-4 text-sm text-[#8B6B2D]"
        >
          ⚠️ 충돌 예고: {result.conflictWarning}
        </motion.div>
      )}

      <div className="bg-[#FDFBF7] border border-[#E8E0D5] rounded-2xl p-4 text-sm text-[#4A3D33]">
        이제부터 추천/설명은 이 기준으로 진행할게요.
      </div>

      <div className="flex justify-between items-center gap-3">
        {onRestart && (
          <button
            onClick={onRestart}
            className="px-5 py-3 rounded-xl border-2 border-[#E8E0D5] text-[#1F1F1F] font-semibold hover:bg-[#F7F3ED] transition-all"
          >
            다시 시작하기
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="ml-auto px-8 py-3 rounded-xl bg-[#4A3D33] text-white font-semibold hover:bg-[#3A2D23] shadow-lg transition-all"
          >
            다음 단계 →
          </button>
        )}
      </div>
    </div>
  );
}

