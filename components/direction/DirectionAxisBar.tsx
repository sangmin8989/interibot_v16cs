'use client';

// 화살표 기반 축(axis) 비주얼 컴포넌트
// position: 0~1 사이 값 (0: 왼쪽, 1: 오른쪽)

interface DirectionAxisBarProps {
  labelLeft: string;
  labelRight: string;
  position: number; // 0~1
}

export default function DirectionAxisBar({
  labelLeft,
  labelRight,
  position,
}: DirectionAxisBarProps) {
  const percentage = Math.round(position * 100);

  return (
    <div className="w-full space-y-2">
      {/* 레이블 */}
      <div className="flex justify-between text-xs text-[#7A6A59] font-medium">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>

      {/* 축 바 */}
      <div className="relative w-full h-2 bg-gradient-to-r from-[#E8E0D5] to-[#F3ECE2] rounded-full overflow-hidden">
        {/* 포지션 마커 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#4A3D33] rounded-full border-2 border-white shadow-md transition-all"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>

      {/* 퍼센트 표시 (선택적) */}
      <div className="text-center">
        <span className="text-xs text-[#9B8C7A]">
          {position < 0.4 && '← 중심'}
          {position >= 0.4 && position <= 0.6 && '균형'}
          {position > 0.6 && '중심 →'}
        </span>
      </div>
    </div>
  );
}
