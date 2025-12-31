'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SpacePackage } from '@/constants/processes';
import { CORE_PROCESSES, OPTIONAL_PROCESSES } from '@/constants/processes';

interface SpaceCardProps {
  space: SpacePackage;
  isSelected: boolean;
  onToggle: () => void;
}

export default function SpaceCard({ space, isSelected, onToggle }: SpaceCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // 공정 이름 가져오기
  const getProcessNames = () => {
    return space.processes.map(pId => {
      const process = [...CORE_PROCESSES, ...OPTIONAL_PROCESSES].find(p => p.id === pId);
      return process?.name || pId;
    });
  };

  return (
    <motion.div
      layout
      className="relative"
    >
      {/* 메인 카드 */}
      <button
        onClick={onToggle}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
        className={`
          w-full p-6 rounded-2xl border-2 transition-all
          ${
            isSelected
              ? 'bg-[#4A3D33] text-white border-[#4A3D33] shadow-lg'
              : 'bg-white text-[#1F1F1F] border-[#E8E0D5] hover:border-[#4A3D33] hover:bg-[#F7F3ED]'
          }
        `}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">{space.icon}</span>
          <span className="text-base font-bold">{space.name}</span>
          {isSelected && (
            <span className="text-xs opacity-80">
              {space.estimateRange.min}~{space.estimateRange.max}만원
            </span>
          )}
        </div>
      </button>

      {/* 호버 시 상세 정보 (데스크톱) */}
      <AnimatePresence>
        {showDetails && !isSelected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 left-0 right-0 top-full mt-2 p-4 bg-white rounded-xl border-2 border-[#4A3D33] shadow-xl hidden md:block"
            onMouseEnter={() => setShowDetails(true)}
            onMouseLeave={() => setShowDetails(false)}
          >
            <p className="text-xs font-semibold text-[#7A6A59] mb-2">포함 내역</p>
            <ul className="space-y-1">
              {getProcessNames().map((name, idx) => (
                <li key={idx} className="text-sm text-[#4A3D33] flex items-start gap-2">
                  <span className="text-[#9B8C7A] mt-0.5">•</span>
                  <span>{name}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-[#E8E0D5]">
              <p className="text-xs text-[#9B8C7A]">
                예상: {space.estimateRange.min}~{space.estimateRange.max}만원
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
