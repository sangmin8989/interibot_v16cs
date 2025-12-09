'use client';

interface NavigationButtonsProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSkip?: () => void;
  isLast: boolean;
  mode: string;
  answeredCount?: number;
}

export default function NavigationButtons({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onSkip,
  isLast,
  mode,
  answeredCount = 0,
}: NavigationButtonsProps) {
  const isVibeMode = mode === 'vibe';

  return (
    <div className="mt-8 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onPrevious}
        disabled={!hasPrevious}
        className={`rounded-xl px-6 py-3 text-sm font-medium transition ${
          hasPrevious ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'cursor-not-allowed bg-gray-50 text-gray-400'
        }`}
      >
        ← 이전
      </button>

      {isVibeMode && onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="rounded-xl bg-argen-50 px-6 py-3 text-sm font-medium text-argen-500 transition hover:bg-argen-100"
        >
          건너뛰기 →
        </button>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        className={`rounded-xl px-8 py-3 text-sm font-bold transition ${
          hasNext
            ? 'bg-argen-500 text-white shadow-lg hover:bg-argen-600 hover:shadow-xl'
            : 'cursor-not-allowed bg-gray-200 text-gray-400'
        }`}
      >
        {isLast
          ? isVibeMode
            ? `내 홈바이브 보기 ${answeredCount > 0 ? '✨' : '(최소 1개)'}`
            : '분석 결과 보기'
          : '다음 →'}
      </button>
    </div>
  );
}


