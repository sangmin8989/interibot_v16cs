/**
 * 인테리봇 v5 - 옵션 카드 컴포넌트
 * 
 * A/B/C 옵션을 카드 형식으로 표시
 */

'use client';

import { motion } from 'framer-motion';
import type { ComprehensiveAnalysisResult } from '@/lib/engines/comprehensive-analysis';

interface OptionCardProps {
  optionName: string;
  description: string;
  processes: string[];
  cost: number;
  analysis: ComprehensiveAnalysisResult;
  recommended?: boolean;
  onSelect?: () => void;
}

export default function OptionCard({
  optionName,
  description,
  processes,
  cost,
  analysis,
  recommended = false,
  onSelect,
}: OptionCardProps) {
  const { satisfaction, priceIncrease, overall, comparison } = analysis;

  // 등급별 색상
  const gradeColors = {
    S: 'from-purple-500 to-pink-500',
    A: 'from-blue-500 to-cyan-500',
    B: 'from-green-500 to-emerald-500',
    C: 'from-yellow-500 to-orange-500',
    D: 'from-red-500 to-rose-500',
  };

  const gradientColor = gradeColors[overall.grade] || gradeColors.C;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all ${
        recommended ? 'ring-4 ring-[#4A3D33]' : ''
      }`}
    >
      {/* 추천 배지 */}
      {recommended && (
        <div className="absolute top-4 right-4 z-10">
          <span className="px-3 py-1 bg-[#4A3D33] text-white text-sm font-bold rounded-full shadow-md">
            ⭐ 추천
          </span>
        </div>
      )}

      {/* 그라데이션 헤더 */}
      <div className={`bg-gradient-to-r ${gradientColor} p-6 text-white`}>
        <h3 className="text-2xl font-bold mb-2">{optionName}</h3>
        <p className="text-sm opacity-90">{description}</p>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold">{cost.toLocaleString()}</span>
          <span className="text-lg">만원</span>
        </div>
      </div>

      {/* 본문 */}
      <div className="bg-white p-6">
        {/* 등급 배지 */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-r ${gradientColor} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}
          >
            {overall.grade}
          </div>
          <div className="flex-1">
            <p className="text-xs text-[#9B8C7A] mb-1">종합 평가</p>
            <p className={`text-sm font-bold ${overall.balanced ? 'text-green-600' : 'text-gray-600'}`}>
              {overall.balanced ? '✅ 균형있는 선택' : '⚠️ 특화형'}
            </p>
          </div>
        </div>

        {/* 핵심 지표 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-[#F7F3ED] rounded-xl">
            <p className="text-xs text-[#9B8C7A] mb-1">생활 만족도</p>
            <p className="text-2xl font-bold text-[#4A3D33]">{satisfaction.finalScore}</p>
            <p className="text-xs text-[#9B8C7A]">점</p>
          </div>
          <div className="text-center p-3 bg-[#F7F3ED] rounded-xl">
            <p className="text-xs text-[#9B8C7A] mb-1">집값 상승</p>
            <p className="text-lg font-bold text-[#4A3D33]">
              +{priceIncrease.expectedIncrease.toLocaleString()}
            </p>
            <p className="text-xs text-[#9B8C7A]">만원</p>
          </div>
          <div className="text-center p-3 bg-[#F7F3ED] rounded-xl">
            <p className="text-xs text-[#9B8C7A] mb-1">투자 회수율</p>
            <p className="text-2xl font-bold text-[#4A3D33]">{priceIncrease.roi}</p>
            <p className="text-xs text-[#9B8C7A]">%</p>
          </div>
        </div>

        {/* 비교 지표 (레이더 차트 대신 바) */}
        <div className="space-y-2 mb-4">
          <div>
            <div className="flex justify-between text-xs text-[#6B6B6B] mb-1">
              <span>비용 효율</span>
              <span className="font-bold">{comparison.costEfficiency}점</span>
            </div>
            <div className="h-2 bg-[#E8E0D5] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#4A3D33] to-[#6B5B4D] rounded-full transition-all"
                style={{ width: `${comparison.costEfficiency}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-[#6B6B6B] mb-1">
              <span>생활 질</span>
              <span className="font-bold">{comparison.lifeQuality}점</span>
            </div>
            <div className="h-2 bg-[#E8E0D5] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#4A3D33] to-[#6B5B4D] rounded-full transition-all"
                style={{ width: `${comparison.lifeQuality}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-[#6B6B6B] mb-1">
              <span>투자 가치</span>
              <span className="font-bold">{comparison.investmentValue}점</span>
            </div>
            <div className="h-2 bg-[#E8E0D5] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#4A3D33] to-[#6B5B4D] rounded-full transition-all"
                style={{ width: `${comparison.investmentValue}%` }}
              />
            </div>
          </div>
        </div>

        {/* 관리비 절감 (있을 경우만 표시) */}
        {priceIncrease.utilitySavings && priceIncrease.utilitySavings.monthlySavings > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-green-700">💰 관리비 절감 효과</span>
              <span className="text-sm font-bold text-green-600">
                월 {Math.round(priceIncrease.utilitySavings.monthlySavings / 10000)}만원
              </span>
            </div>
            <p className="text-xs text-green-700">
              10년간 약 {priceIncrease.utilitySavings.presentValue.toLocaleString()}만원 절약
            </p>
          </div>
        )}

        {/* 포함 공정 */}
        <div className="mb-4">
          <p className="text-xs text-[#9B8C7A] mb-2">포함 공정</p>
          <div className="flex flex-wrap gap-2">
            {processes.map((process, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-[#F7F3ED] text-[#4A3D33] text-xs rounded-full border border-[#E8E0D5]"
              >
                {process}
              </span>
            ))}
          </div>
        </div>

        {/* 추천 메시지 */}
        <div className="p-3 bg-[#F7F3ED] rounded-xl mb-4">
          <p className="text-sm text-[#4A3D33] leading-relaxed">{overall.recommendation}</p>
        </div>

        {/* 강점 */}
        {overall.strengths.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-[#9B8C7A] mb-2 font-bold">✅ 강점</p>
            <ul className="space-y-1">
              {overall.strengths.slice(0, 3).map((strength, index) => (
                <li key={index} className="text-xs text-[#6B6B6B] pl-4 relative">
                  <span className="absolute left-0">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 약점 (있는 경우) */}
        {overall.weaknesses.length > 0 &&
          !overall.weaknesses[0].includes('발견되지 않았습니다') && (
            <div className="mb-4">
              <p className="text-xs text-[#9B8C7A] mb-2 font-bold">⚠️ 주의사항</p>
              <ul className="space-y-1">
                {overall.weaknesses.slice(0, 2).map((weakness, index) => (
                  <li key={index} className="text-xs text-[#6B6B6B] pl-4 relative">
                    <span className="absolute left-0">•</span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* 선택 버튼 */}
        {onSelect && (
          <button
            onClick={onSelect}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              recommended
                ? 'bg-[#4A3D33] text-white hover:bg-[#3A2D23] shadow-md'
                : 'bg-white text-[#4A3D33] border-2 border-[#4A3D33] hover:bg-[#F7F3ED]'
            }`}
          >
            {recommended ? '이 옵션 선택하기 ⭐' : '이 옵션 선택하기'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
