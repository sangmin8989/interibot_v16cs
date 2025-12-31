'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { ReportResult } from '@/lib/analysis/report';

interface SixIndexDashboardProps {
  report: ReportResult;
  onNext: () => void;
  showCTA?: boolean; // CTA 버튼 표시 여부 (기본값: true)
}

export default function SixIndexDashboard({ report, onNext, showCTA = true }: SixIndexDashboardProps) {
  const indices = [
    {
      id: 'homeValue',
      name: '집값 방어지수',
      score: report.homeValue.score,
      icon: '🏠',
      color: 'from-[#B8956B] to-[#D4B896]',
      message: report.homeValue.message,
    },
    {
      id: 'lifeQuality',
      name: '생활 안정지수',
      score: report.lifeQuality.score,
      icon: '✨',
      color: 'from-[#6B8E7B] to-[#A7C4A0]',
      message: report.lifeQuality.message,
    },
    {
      id: 'spaceEfficiency',
      name: '공간 효율지수',
      score: report.spaceEfficiency.score,
      icon: '📦',
      color: 'from-[#8B7FA8] to-[#B5A8C8]',
      message: report.spaceEfficiency.message,
    },
    {
      id: 'maintenance',
      name: '유지관리 용이도',
      score: report.maintenance.score,
      icon: '🔧',
      color: 'from-[#D4A574] to-[#E8C19A]',
      message: report.maintenance.message,
    },
    {
      id: 'energy',
      name: '에너지 효율지수',
      score: report.energy.score,
      icon: '⚡',
      color: 'from-[#4A90A4] to-[#6BA8B8]',
      message: report.energy.message,
    },
    {
      id: 'investment',
      name: '투자 효율지수',
      score: report.investment.score,
      icon: '💰',
      color: 'from-[#C9A961] to-[#E0C085]',
      message: report.investment.message,
    },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#1F1F1F] mb-2">
          6대 지수 분석 리포트
        </h1>
        <p className="text-[#6B6B6B]">
          종합 점수: <span className="text-[#B8956B] font-bold text-2xl">{report.overall.totalScore}점</span>
        </p>
      </div>

      {/* 6대 지수 그리드 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {indices.map((index, idx) => (
          <motion.div
            key={index.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl border border-[#E8E4DC] p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{index.icon}</span>
                <span className="text-sm font-semibold text-[#1F1F1F]">{index.name}</span>
              </div>
              <span className="text-xl font-bold text-[#B8956B]">
                {index.score}점
              </span>
            </div>
            <div className="h-2 bg-[#F7F3ED] rounded-full overflow-hidden mb-2">
              <motion.div
                className={`h-full bg-gradient-to-r ${index.color} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${index.score}%` }}
                transition={{ duration: 1, delay: 0.3 + idx * 0.1 }}
              />
            </div>
            <p className="text-xs text-[#6B6B6B] line-clamp-2">
              {index.message}
            </p>
          </motion.div>
        ))}
      </div>

      {/* 종합 메시지 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-[#F7F3ED] rounded-2xl p-6 mb-6"
      >
        <h3 className="text-lg font-bold text-[#1F1F1F] mb-3">종합 평가</h3>
        <p className="text-[#6B6B6B] text-sm leading-relaxed mb-4">
          {report.overall.message}
        </p>
        <div className="pt-4 border-t border-[#E8E4DC]">
          <p className="text-xs text-[#9B9B9B] mb-2">
            <span className="font-semibold text-[#B8956B]">강점:</span> {report.overall.strongest}
          </p>
          <p className="text-xs text-[#9B9B9B]">
            <span className="font-semibold text-[#6B6B6B]">보완점:</span> {report.overall.weakest}
          </p>
        </div>
      </motion.div>

      {/* 5년 후 시나리오 */}
      {report.overall.fiveYearScenario && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-r from-[#B8956B] to-[#D4B896] rounded-2xl p-6 mb-6 text-white"
        >
          <h3 className="text-lg font-bold mb-2">5년 후 시나리오</h3>
          <p className="text-sm leading-relaxed opacity-95">
            {report.overall.fiveYearScenario}
          </p>
        </motion.div>
      )}

      {/* CTA 버튼 (선택적) */}
      {showCTA && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          onClick={onNext}
          className="w-full py-5 bg-[#1F1F1F] text-white font-bold text-xl 
                     rounded-2xl hover:bg-[#333] transition-all
                     flex items-center justify-center gap-3
                     shadow-xl"
        >
          공정 선택하기
          <ArrowRight className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
}




