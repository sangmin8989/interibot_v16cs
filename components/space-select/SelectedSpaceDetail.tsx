'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SpacePackage } from '@/constants/processes';
import { CORE_PROCESSES, OPTIONAL_PROCESSES } from '@/constants/processes';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface SelectedSpaceDetailProps {
  space: SpacePackage;
  onRemove: () => void;
}

export default function SelectedSpaceDetail({ space, onRemove }: SelectedSpaceDetailProps) {
  const [expanded, setExpanded] = useState(false);

  const getProcessDetails = () => {
    return space.processes.map(pId => {
      const process = [...CORE_PROCESSES, ...OPTIONAL_PROCESSES].find(p => p.id === pId);
      return process || { id: pId, name: pId, description: '', category: 'core' as const };
    });
  };

  const processes = getProcessDetails();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white border-2 border-[#4A3D33] rounded-xl p-4"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{space.icon}</span>
          <div>
            <h4 className="font-bold text-[#1F1F1F]">{space.name}</h4>
            <p className="text-sm text-[#6B6B6B]">
              {space.estimateRange.min}~{space.estimateRange.max}만원
            </p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-2 rounded-lg hover:bg-[#F7F3ED] transition-all"
          aria-label="제거"
        >
          <X className="w-5 h-5 text-[#6B6B6B]" />
        </button>
      </div>

      {/* 포함 내역 요약 */}
      <div className="mb-2">
        <p className="text-xs text-[#7A6A59] font-semibold mb-2">포함 내역</p>
        <div className="flex flex-wrap gap-2">
          {processes.slice(0, 3).map(p => (
            <span
              key={p.id}
              className="px-2 py-1 bg-[#F7F3ED] text-[#4A3D33] text-xs rounded-lg"
            >
              {p.name}
            </span>
          ))}
          {processes.length > 3 && (
            <span className="px-2 py-1 text-[#9B8C7A] text-xs">
              외 {processes.length - 3}개
            </span>
          )}
        </div>
      </div>

      {/* 전체 보기 버튼 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#4A3D33] font-semibold hover:bg-[#F7F3ED] rounded-lg transition-all"
      >
        {expanded ? (
          <>
            <span>접기</span>
            <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            <span>전체 보기</span>
            <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>

      {/* 확장 영역 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-[#E8E0D5] space-y-2">
              {processes.map(p => (
                <div key={p.id} className="flex items-start gap-2">
                  <span className="text-[#4A3D33] mt-1">✓</span>
                  <div>
                    <p className="text-sm font-semibold text-[#1F1F1F]">{p.name}</p>
                    {p.description && (
                      <p className="text-xs text-[#6B6B6B]">{p.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
