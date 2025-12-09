'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import NavigationButtons from '@/components/analysis/NavigationButtons';
import ProgressBar from '@/components/analysis/ProgressBar';
import QuestionCard from '@/components/analysis/QuestionCard';
import { AnalysisMode } from '@/lib/analysis/types';
import { getQuestionsByMode } from '@/lib/analysis/questions';

interface AnalysisPageProps {
  mode: AnalysisMode;
}

export default function AnalysisPage({ mode }: AnalysisPageProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  const questions = getQuestionsByMode(mode);
  const currentQuestion = questions[currentIndex];

  // 디버깅: 질문 로딩 확인
  useEffect(() => {
    if (questions.length === 0) {
      console.error('❌ 질문이 로드되지 않았습니다!');
      console.error('mode:', mode);
      console.error('getQuestionsByMode 결과:', getQuestionsByMode(mode));
    }
  }, [mode, questions.length]);
  const isVibeMode = mode === 'vibe';
  const answeredCount = Object.keys(answers).length;
  const isLast = currentIndex === questions.length - 1;
  const hasAnswer = !!currentQuestion && !!answers[currentQuestion.id];
  const progress =
    questions.length === 0
      ? 0
      : isVibeMode
        ? (answeredCount / questions.length) * 100
        : ((currentIndex + 1) / questions.length) * 100;

  useEffect(() => {
    localStorage.setItem(
      'interibotAnalysis',
      JSON.stringify({
        mode,
        currentIndex,
        answers,
      }),
    );
  }, [mode, currentIndex, answers]);

  useEffect(() => {
    const saved = localStorage.getItem('interibotAnalysis');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.mode === mode) {
        setCurrentIndex(data.currentIndex || 0);
        setAnswers(data.answers || {});
      }
    }
  }, [mode]);

  const handleAnswer = (value: unknown) => {
    if (!currentQuestion) {
      return;
    }
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (!currentQuestion) {
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
      return;
    }

    if (isVibeMode && answeredCount === 0) {
      alert('최소 1개는 답변해주세요! 더 답할수록 정확해요 😊');
      return;
    }

    if (!isVibeMode && !answers[currentQuestion.id]) {
      alert('답변을 선택해주세요');
      return;
    }

    submitAnalysis();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
      return;
    }

    if (answeredCount === 0) {
      alert('최소 1개는 답변해주세요!');
      return;
    }

    submitAnalysis();
  };

  const submitAnalysis = async () => {
    try {
      const spaceInfoStr = sessionStorage.getItem('spaceInfo');
      const selectedAreasStr = sessionStorage.getItem('selectedAreas');
      const vibeInputStr = sessionStorage.getItem('vibeInput');

      const spaceInfo = spaceInfoStr ? JSON.parse(spaceInfoStr) : null;
      const selectedAreas = selectedAreasStr ? JSON.parse(selectedAreasStr) : null;
      const vibeInput = vibeInputStr ? JSON.parse(vibeInputStr) : null;

      const response = await fetch('/api/analysis/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          spaceInfo,
          selectedAreas,
          preferences: answers,
          vibeInput: isVibeMode ? vibeInput : undefined,
          answeredCount,
          completionRate: isVibeMode ? (answeredCount / Math.max(questions.length, 1)) * 100 : 100,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '분석 제출 실패');
      }

      const analysisId = data.analysisId || data.resultId || data.id;

      if (!analysisId) {
        throw new Error('분석 ID를 받지 못했습니다.');
      }

      const completeAnalysis = {
        analysisId,
        mode: data.mode ?? mode,
        summary: data.summary,
        answeredCount: data.answeredCount ?? answeredCount,
        completionRate: data.completionRate ?? (isVibeMode ? (answeredCount / Math.max(questions.length, 1)) * 100 : 100),
        preferences: data.preferences ?? {},
        vibeProfile: data.vibeProfile,
        recommendations: data.recommendations ?? [],
        spaceInfo: data.spaceInfo ?? spaceInfo,
        selectedAreas: data.selectedAreas ?? selectedAreas,
        createdAt: data.createdAt ?? new Date().toISOString(),
        // ✅ AI 리포트 포함 (놓친 부분 포함)
        aiReport: data.aiReport ?? null,
        // ✅ 점수 정보 포함
        homeValueScore: data.homeValueScore ?? null,
        lifestyleScores: data.lifestyleScores ?? null,
      };

      console.log('✅ 분석 완료 - 데이터 저장:', { analysisId, spaceInfo, hasAiReport: !!data.aiReport });
      
      // sessionStorage에 저장
      sessionStorage.setItem(`analysis_${analysisId}`, JSON.stringify(completeAnalysis));
      
      // 저장 확인
      const saved = sessionStorage.getItem(`analysis_${analysisId}`);
      console.log('✅ 저장 확인:', saved ? '성공' : '실패');
      
      localStorage.removeItem('interibotAnalysis');

      // 분석 완료 후 결과 페이지로 이동 (기존 흐름 유지)
      const params = new URLSearchParams()
      params.set('analysisId', analysisId)
      params.set('mode', mode)
      router.push(`/result?${params.toString()}`);
    } catch (error) {
      console.error('분석 제출 실패:', error);
      alert(`분석 제출 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-gray-600">
        <p className="text-lg font-semibold">질문을 불러올 수 없습니다</p>
        <p className="text-sm">모드: {mode}</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-argen-500 text-white rounded-lg hover:bg-argen-600 transition-all"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-gray-600">
        질문을 불러오는 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        {isVibeMode ? (
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {answeredCount}/{questions.length || 1} 답변 완료
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {answeredCount === 0 && '최소 1개 필요해요'}
              {answeredCount >= 1 && '더 많이 답할수록 정확해져요'}
            </p>
          </div>
        ) : (
          <ProgressBar current={currentIndex + 1} total={questions.length} />
        )}

        <QuestionCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          selectedValue={answers[currentQuestion.id]}
          isOptional={isVibeMode}
        />

        <NavigationButtons
          hasPrevious={currentIndex > 0}
          hasNext={isVibeMode || hasAnswer}
          onPrevious={handlePrev}
          onNext={handleNext}
          onSkip={isVibeMode ? handleSkip : undefined}
          isLast={isLast}
          mode={mode}
          answeredCount={answeredCount}
        />
      </div>
    </div>
  );
}


