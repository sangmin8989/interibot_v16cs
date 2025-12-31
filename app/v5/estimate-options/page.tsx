/**
 * 인테리봇 v5 - 옵션 3안 페이지
 * 
 * A안(최소) / B안(균형) / C안(프리미엄) 비교 및 선택
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import OptionCard from '@/components/v5-ultimate/OptionCard';

interface ThreeOptionsData {
  optionA: any;
  optionB: any;
  optionC: any;
  aiReasoning?: string;
  intevityType?: string;
}

export default function EstimateOptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [options, setOptions] = useState<ThreeOptionsData | null>(null);

  // URL에서 파라미터 가져오기
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pyeong = parseInt(params.get('pyeong') || '25');
    const buildingAge = parseInt(params.get('buildingAge') || '18');
    const familyType = params.get('familyType') || 'dual_income';
    const currentPriceParam = params.get('currentPrice');
    const currentPrice = currentPriceParam ? parseInt(currentPriceParam) : undefined;
    
    // 인테비티 결과 (URL 파라미터로 전달됨)
    const intevityType = params.get('intevityType') || undefined;
    const intevityTraitsParam = params.get('intevityTraits');
    const intevityTraits = intevityTraitsParam ? intevityTraitsParam.split(',') : undefined;

    // 옵션 3안 자동 생성 API 호출
    generateOptions({ pyeong, buildingAge, familyType, currentPrice, intevityType, intevityTraits });
  }, []);

  const generateOptions = async (input: {
    pyeong: number;
    buildingAge: number;
    familyType: string;
    currentPrice?: number;
    intevityType?: string;
    intevityTraits?: string[];
  }) => {
    try {
      setLoading(true);
      setError('');

      const requestBody: any = {
        pyeong: input.pyeong,
        buildingAge: input.buildingAge,
        familyType: input.familyType,
        lifestyleFactors: [],
        marketCondition: 'normal_rising',
        region: 'gyeonggi_normal',
      };

      // currentPrice가 있을 때만 추가
      if (input.currentPrice && input.currentPrice > 0) {
        requestBody.currentPrice = input.currentPrice;
      }

      // 인테비티 결과가 있으면 추가 (AI 분석용)
      if (input.intevityType) {
        requestBody.intevityType = input.intevityType;
        requestBody.intevityTraits = input.intevityTraits || [];
      }

      const response = await fetch('/api/v5/generate-three-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('옵션 생성 실패');
      }

      const result = await response.json();
      setOptions(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionName: string, cost: number) => {
    // 선택한 옵션 정보를 저장하고 상세 페이지로 이동
    localStorage.setItem(
      'selectedOption',
      JSON.stringify({ optionName, cost, timestamp: Date.now() })
    );
    router.push('/estimate-result');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F3ED] to-[#FFF9F3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#4A3D33] mx-auto mb-4" />
          <p className="text-[#4A3D33] font-bold">맞춤 옵션 생성 중...</p>
          <p className="text-[#9B8C7A] text-sm mt-2">생활 만족도와 집값 상승을 계산하고 있습니다</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F3ED] to-[#FFF9F3] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">오류 발생</h2>
          <p className="text-[#6B6B6B] mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="w-full py-3 bg-[#4A3D33] text-white rounded-xl font-bold hover:bg-[#3A2D23]"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!options) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F3ED] to-[#FFF9F3] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {/* 인테비티 성향 표시 */}
          {options.intevityType && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 mb-4">
              <span className="text-lg">✨</span>
              <span className="text-sm font-semibold text-purple-700">
                나의 인테비티: {options.intevityType}
              </span>
            </div>
          )}
          <h1 className="text-4xl font-bold text-[#1F1F1F] mb-4">
            {options.intevityType ? 'AI 맞춤 견적 옵션 3안' : '맞춤 견적 옵션 3안'}
          </h1>
          <p className="text-lg text-[#6B6B6B] mb-2">
            {options.aiReasoning || 'AI가 분석한 생활 만족도와 집값 상승을 비교하세요'}
          </p>
          <p className="text-sm text-[#9B8C7A]">
            옵션을 선택하시면 상세 견적서를 확인하실 수 있습니다
          </p>
        </motion.div>

        {/* 비교 표 (모바일 숨김) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden lg:block mb-12"
        >
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#4A3D33] text-white">
                <tr>
                  <th className="py-4 px-6 text-left">비교 항목</th>
                  <th className="py-4 px-6 text-center">A안 (안전형)</th>
                  <th className="py-4 px-6 text-center bg-[#3A2D23]">B안 (균형형) ⭐</th>
                  <th className="py-4 px-6 text-center">C안 (프리미엄)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D5]">
                <tr>
                  <td className="py-3 px-6 font-bold text-[#4A3D33]">공사비</td>
                  <td className="py-3 px-6 text-center">{options.optionA.cost.toLocaleString()}만원</td>
                  <td className="py-3 px-6 text-center bg-[#F7F3ED] font-bold">
                    {options.optionB.cost.toLocaleString()}만원
                  </td>
                  <td className="py-3 px-6 text-center">{options.optionC.cost.toLocaleString()}만원</td>
                </tr>
                <tr>
                  <td className="py-3 px-6 font-bold text-[#4A3D33]">생활 만족도</td>
                  <td className="py-3 px-6 text-center">
                    {options.optionA.analysis.satisfaction.finalScore}점
                  </td>
                  <td className="py-3 px-6 text-center bg-[#F7F3ED] font-bold">
                    {options.optionB.analysis.satisfaction.finalScore}점
                  </td>
                  <td className="py-3 px-6 text-center">
                    {options.optionC.analysis.satisfaction.finalScore}점
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-6 font-bold text-[#4A3D33]">집값 상승</td>
                  <td className="py-3 px-6 text-center">
                    +{options.optionA.analysis.priceIncrease.expectedIncrease.toLocaleString()}만원
                  </td>
                  <td className="py-3 px-6 text-center bg-[#F7F3ED] font-bold">
                    +{options.optionB.analysis.priceIncrease.expectedIncrease.toLocaleString()}만원
                  </td>
                  <td className="py-3 px-6 text-center">
                    +{options.optionC.analysis.priceIncrease.expectedIncrease.toLocaleString()}만원
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-6 font-bold text-[#4A3D33]">ROI</td>
                  <td className="py-3 px-6 text-center">
                    {options.optionA.analysis.priceIncrease.roi}%
                  </td>
                  <td className="py-3 px-6 text-center bg-[#F7F3ED] font-bold">
                    {options.optionB.analysis.priceIncrease.roi}%
                  </td>
                  <td className="py-3 px-6 text-center">
                    {options.optionC.analysis.priceIncrease.roi}%
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-6 font-bold text-[#4A3D33]">종합 등급</td>
                  <td className="py-3 px-6 text-center">
                    <span className="px-3 py-1 rounded-full bg-[#E8E0D5] text-[#4A3D33] font-bold">
                      {options.optionA.analysis.overall.grade}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center bg-[#F7F3ED]">
                    <span className="px-3 py-1 rounded-full bg-[#4A3D33] text-white font-bold">
                      {options.optionB.analysis.overall.grade}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <span className="px-3 py-1 rounded-full bg-[#E8E0D5] text-[#4A3D33] font-bold">
                      {options.optionC.analysis.overall.grade}
                    </span>
                  </td>
                </tr>
                {/* 관리비 절감 (있을 경우만 표시) */}
                {(options.optionA.analysis.priceIncrease.utilitySavings || 
                  options.optionB.analysis.priceIncrease.utilitySavings ||
                  options.optionC.analysis.priceIncrease.utilitySavings) && (
                  <tr className="bg-green-50">
                    <td className="py-3 px-6 font-bold text-green-700">💰 관리비 절감</td>
                    <td className="py-3 px-6 text-center text-sm">
                      {options.optionA.analysis.priceIncrease.utilitySavings 
                        ? `월 ${Math.round(options.optionA.analysis.priceIncrease.utilitySavings.monthlySavings / 10000)}만원`
                        : '-'}
                    </td>
                    <td className="py-3 px-6 text-center bg-green-100 font-bold text-sm">
                      {options.optionB.analysis.priceIncrease.utilitySavings 
                        ? `월 ${Math.round(options.optionB.analysis.priceIncrease.utilitySavings.monthlySavings / 10000)}만원`
                        : '-'}
                    </td>
                    <td className="py-3 px-6 text-center text-sm">
                      {options.optionC.analysis.priceIncrease.utilitySavings 
                        ? `월 ${Math.round(options.optionC.analysis.priceIncrease.utilitySavings.monthlySavings / 10000)}만원`
                        : '-'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* 출처·면책 문구 */}
            <div className="bg-[#F7F3ED] px-6 py-4 text-xs text-[#6B6B6B] space-y-2 border-t border-[#E8E0D5]">
              <p>
                <strong className="text-[#4A3D33]">📚 출처:</strong>{' '}
                {options.optionB.analysis.priceIncrease.disclaimer.sources}
              </p>
              <p>
                <strong className="text-[#4A3D33]">⚠️ 주의:</strong>{' '}
                {options.optionB.analysis.priceIncrease.disclaimer.warning}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 옵션 카드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* A안 */}
          <OptionCard
            optionName={options.optionA.name}
            description={options.optionA.description}
            processes={options.optionA.processes}
            cost={options.optionA.cost}
            analysis={options.optionA.analysis}
            onSelect={() => handleSelectOption(options.optionA.name, options.optionA.cost)}
          />

          {/* B안 (추천) */}
          <OptionCard
            optionName={options.optionB.name}
            description={options.optionB.description}
            processes={options.optionB.processes}
            cost={options.optionB.cost}
            analysis={options.optionB.analysis}
            recommended
            onSelect={() => handleSelectOption(options.optionB.name, options.optionB.cost)}
          />

          {/* C안 */}
          <OptionCard
            optionName={options.optionC.name}
            description={options.optionC.description}
            processes={options.optionC.processes}
            cost={options.optionC.cost}
            analysis={options.optionC.analysis}
            onSelect={() => handleSelectOption(options.optionC.name, options.optionC.cost)}
          />
        </div>

        {/* 하단 안내 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-[#9B8C7A] mb-4">
            ※ 위 금액은 예상 견적이며, 실제 공사비는 현장 상황에 따라 달라질 수 있습니다.
          </p>
          <button
            onClick={() => router.back()}
            className="px-8 py-3 bg-white text-[#4A3D33] border-2 border-[#4A3D33] rounded-xl font-bold hover:bg-[#F7F3ED] transition-all"
          >
            ← 뒤로 가기
          </button>
        </motion.div>
      </div>
    </div>
  );
}
