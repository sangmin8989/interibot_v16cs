'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, AlertCircle } from 'lucide-react';
import { INTEVITY_QUESTIONS } from '@/lib/intevity/questions';
import type { IntevityQuestion } from '@/lib/intevity/questions';
import { useIntevityStore } from '@/lib/store/intevityStore';

interface IntevityQuizProps {
  onComplete?: () => void;
}

export default function IntevityQuiz({ onComplete }: IntevityQuizProps) {
  const { answers, currentQuestion, setAnswer, finalize } = useIntevityStore();
  const [error, setError] = useState<string | null>(null);

  const stepIndex = useMemo(() => Math.max(0, Math.min(6, currentQuestion - 1)), [currentQuestion]);
  const activeQuestion: IntevityQuestion = INTEVITY_QUESTIONS[stepIndex] ?? INTEVITY_QUESTIONS[0];
  const progress = Math.round(((stepIndex + 1) / INTEVITY_QUESTIONS.length) * 100);

  const handleSelect = (code: string) => {
    setError(null);
    setAnswer(activeQuestion.id as any, code as any);
    if (stepIndex === INTEVITY_QUESTIONS.length - 1) {
      try {
        finalize();
        onComplete?.();
      } catch (e: any) {
        setError(e?.message || '결과 생성에 실패했습니다.');
      }
    }
  };

  const selected = answers[activeQuestion.id as keyof typeof answers] as string | undefined;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-[#9B8C7A] mb-2">
          <span>{stepIndex + 1} / {INTEVITY_QUESTIONS.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-[#F3ECE2] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#B8956B] via-[#D6B892] to-[#F0D8B8] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeQuestion.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="p-5 rounded-2xl bg-white border border-[#E8E0D5] shadow-sm">
            <h2 className="text-2xl font-semibold text-[#1F1F1F] mb-4">
              {activeQuestion.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeQuestion.options.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => handleSelect(opt.code)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all bg-white
                    ${selected === opt.code
                      ? 'border-[#B8956B] bg-[#FDFBF7] shadow-md'
                      : 'border-[#E8E0D5] hover:border-[#B8956B] hover:bg-[#FDFBF7]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0
                      ${selected === opt.code ? 'bg-[#B8956B] border-[#B8956B]' : 'border-[#9B9B9B]'}`}>
                      {selected === opt.code && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1F1F1F]">{opt.label}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end mt-4 text-sm text-[#7A6A59] gap-2 items-center">
        <ArrowRight className="w-4 h-4" />
        <span>선택 후 자동으로 다음 문항으로 넘어갑니다.</span>
      </div>
    </div>
  );
}

