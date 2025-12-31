'use client';

import { motion } from 'framer-motion';
import type { DirectionOption } from '@/lib/direction/types';
import DirectionAxisBar from './DirectionAxisBar';

interface DirectionCardProps {
  option: DirectionOption;
  isSelected: boolean;
  onSelect: () => void;
}

export default function DirectionCard({
  option,
  isSelected,
  onSelect,
}: DirectionCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full text-left p-6 rounded-2xl border-2 transition-all
        ${
          isSelected
            ? 'border-[#4A3D33] bg-[#FDFBF7] shadow-lg'
            : 'border-[#E8E0D5] bg-white hover:border-[#D4C5B1] hover:shadow-md'
        }
      `}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#9B8C7A] tracking-wider">
              옵션 {option.code}
            </span>
            {isSelected && (
              <span className="text-xs bg-[#4A3D33] text-white px-2 py-0.5 rounded-full">
                선택됨
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-[#1F1F1F]">{option.name}</h3>
        </div>
      </div>

      {/* 한 줄 설명 */}
      <p className="text-sm text-[#6B6B6B] mb-4 leading-relaxed">
        {option.description}
      </p>

      {/* 화살표 축 */}
      <div className="mb-4">
        <DirectionAxisBar
          labelLeft={option.axis.labelLeft}
          labelRight={option.axis.labelRight}
          position={option.axis.position}
        />
      </div>

      {/* 적용 포인트 */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-[#7A6A59] mb-2">적용 포인트</p>
        <ul className="space-y-1">
          {option.applications.map((app, idx) => (
            <li key={idx} className="text-sm text-[#4A3D33] flex items-start gap-2">
              <span className="text-[#9B8C7A] mt-1">•</span>
              <span>{app}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 트레이드오프 */}
      <div className="mb-4 p-3 bg-[#F9F7F3] rounded-xl border border-[#E8E0D5]">
        <p className="text-xs font-semibold text-[#7A6A59] mb-2">트레이드오프</p>
        <div className="flex gap-4 text-xs text-[#6B6B6B] mb-2">
          <span>변수성: <strong>{option.tradeoff.variability}</strong></span>
          <span>체감: <strong>{option.tradeoff.perception}</strong></span>
        </div>
        <p className="text-xs text-[#6B6B6B]">{option.tradeoff.note}</p>
      </div>

      {/* 인테비티 연결 설명 */}
      <div className="p-3 bg-[#FFF7E6] rounded-xl border border-[#F2D8A7]">
        <p className="text-xs font-semibold text-[#8B6B2D] mb-1">
          내 인테비티 기준과의 연결
        </p>
        <p className="text-xs text-[#6B6B6B]">{option.explanation}</p>
      </div>
    </motion.button>
  );
}
