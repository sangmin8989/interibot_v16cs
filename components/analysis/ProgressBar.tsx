'use client';

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const clampedTotal = Math.max(total, 1);
  const progress = Math.min(Math.max(current / clampedTotal, 0), 1) * 100;

  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between text-sm text-gray-600">
        <span>진행률</span>
        <span>
          {current}/{total}
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-argen-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}















