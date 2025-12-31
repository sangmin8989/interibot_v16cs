'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore';
import { useSpaceSelectStore } from '@/lib/store/spaceSelectStore';
import {
  SPACE_PACKAGES,
  STYLE_ONLY_PACKAGE,
  CORE_PROCESSES,
  OPTIONAL_PROCESSES,
  generateDynamicSpaces,
  generateFullRemodelPackage,
  adjustEstimateByPyeong,
  type SpacePackage,
} from '@/constants/processes';
import {
  GRADE_INFO,
  type ArgenGrade,
} from '@/lib/data/gradeSpecs';
import OptionCard from '@/components/v5-ultimate/OptionCard';

// 등급별 배율 (견적 대비)
const GRADE_MULTIPLIERS: Record<ArgenGrade, number> = {
  ESSENTIAL: 0.75,
  STANDARD: 1.0,
  OPUS: 1.4,
};

// 등급 색상
const GRADE_COLORS: Record<ArgenGrade, { bg: string; text: string; border: string }> = {
  ESSENTIAL: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  STANDARD: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  OPUS: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

export default function EstimateResultPage() {
  const router = useRouter();
  const spaceInfo = useSpaceInfoStore((s) => s.spaceInfo);
  const { selectedSpaces, additionalOptions, estimateTotal } = useSpaceSelectStore();

  const [mounted, setMounted] = useState(false);
  const [aiOption, setAiOption] = useState<any | null>(null); // AI 옵션 플로우용
  const [selectedGrade, setSelectedGrade] = useState<ArgenGrade>('STANDARD');
  const [showDetails, setShowDetails] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [materialRecommendation, setMaterialRecommendation] = useState<string>('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [isLoadingMaterial, setIsLoadingMaterial] = useState(false);

  // 마운트 확인 및 데이터 검증
  useEffect(() => {
    setMounted(true);

    // AI 플로우 결과(localStorage)에 있으면 우선 사용
    const savedAIOption = typeof window !== 'undefined' ? localStorage.getItem('selectedAIOption') : null;
    if (savedAIOption) {
      try {
        const parsed = JSON.parse(savedAIOption);
        setAiOption(parsed);
        return;
      } catch (e) {
        console.error('AI 옵션 파싱 실패:', e);
      }
    }

    // 기존 온보딩 플로우 검증
    if (!spaceInfo || selectedSpaces.length === 0) {
      router.push('/onboarding');
    }
  }, [spaceInfo, selectedSpaces, router]);

  // 동적 공간 생성
  const dynamicSpaces = useMemo(() => {
    if (!spaceInfo) return [];
    return generateDynamicSpaces(spaceInfo.rooms || 3, spaceInfo.bathrooms || 2);
  }, [spaceInfo]);

  // 평수 기반 견적 조정
  const adjustedSpaces = useMemo(() => {
    if (!spaceInfo) return dynamicSpaces;
    return dynamicSpaces.map(space => ({
      ...space,
      estimateRange: adjustEstimateByPyeong(space.estimateRange, spaceInfo.pyeong),
    }));
  }, [dynamicSpaces, spaceInfo]);

  // 전체 리모델링 패키지
  const fullRemodelPackage = useMemo(() => {
    return generateFullRemodelPackage(adjustedSpaces);
  }, [adjustedSpaces]);

  // 분위기만 바꾸기 패키지
  const styleOnlyPackage = useMemo(() => {
    if (!spaceInfo) return STYLE_ONLY_PACKAGE;
    return {
      ...STYLE_ONLY_PACKAGE,
      estimateRange: adjustEstimateByPyeong(STYLE_ONLY_PACKAGE.estimateRange, spaceInfo.pyeong),
    };
  }, [spaceInfo]);

  // 선택한 공간 정보
  const selectedSpaceDetails = useMemo(() => {
    return selectedSpaces.map(selection => {
      const space = adjustedSpaces.find(s => s.spaceId === selection.spaceId) ||
                    (selection.spaceId === 'full' ? fullRemodelPackage : null) ||
                    (selection.spaceId === 'style' ? styleOnlyPackage : null);
      return space;
    }).filter(Boolean) as SpacePackage[];
  }, [selectedSpaces, adjustedSpaces, fullRemodelPackage, styleOnlyPackage]);

  // 등급별 견적 계산
  const gradeEstimates = useMemo(() => {
    const grades: ArgenGrade[] = ['ESSENTIAL', 'STANDARD', 'OPUS'];
    return grades.reduce((acc, grade) => {
      const multiplier = GRADE_MULTIPLIERS[grade];
      acc[grade] = {
        min: Math.round(estimateTotal.min * multiplier),
        max: Math.round(estimateTotal.max * multiplier),
      };
      return acc;
    }, {} as Record<ArgenGrade, { min: number; max: number }>);
  }, [estimateTotal]);

  // AI 견적 설명 로드
  useEffect(() => {
    if (!mounted || !spaceInfo || selectedSpaces.length === 0) return;

    const loadAiExplanation = async () => {
      setIsLoadingExplanation(true);
      try {
        const response = await fetch('/api/v5/explain-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedSpaces,
            grade: selectedGrade,
            estimateRange: gradeEstimates[selectedGrade],
            spaceInfo,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAiExplanation(data.explanation);
          }
        }
      } catch (error) {
        console.error('AI 설명 로드 에러:', error);
      } finally {
        setIsLoadingExplanation(false);
      }
    };

    loadAiExplanation();
  }, [mounted, spaceInfo, selectedSpaces, selectedGrade, gradeEstimates]);

  // AI 자재 추천 로드
  useEffect(() => {
    if (!mounted || !spaceInfo || selectedSpaces.length === 0) return;

    const loadMaterialRecommendation = async () => {
      setIsLoadingMaterial(true);
      try {
        const response = await fetch('/api/v5/recommend-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grade: selectedGrade,
            budget: gradeEstimates[selectedGrade],
            selectedSpaces,
            spaceInfo,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMaterialRecommendation(data.recommendation);
          }
        }
      } catch (error) {
        console.error('자재 추천 로드 에러:', error);
      } finally {
        setIsLoadingMaterial(false);
      }
    };

    loadMaterialRecommendation();
  }, [mounted, spaceInfo, selectedSpaces, selectedGrade, gradeEstimates]);

  // 공정 이름 가져오기
  const getProcessNames = (processIds: string[]) => {
    const allProcesses = [...CORE_PROCESSES, ...OPTIONAL_PROCESSES];
    return processIds.map(pId => {
      const process = allProcesses.find(p => p.id === pId);
      return process || { id: pId, name: pId, description: '' };
    });
  };

  // 🚀 AI 플로우 결과가 있으면 전용 화면 렌더링
  if (mounted && aiOption) {
    const { option, aiReasoning, intevityType, input } = aiOption;
    return (
      <div className="min-h-screen bg-[#FDFBF7] pb-24">
        <div className="bg-gradient-to-b from-[#F7F3ED] to-[#FDFBF7] pt-12 pb-8 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <button
              onClick={() => router.push('/v5/ai-quick-input')}
              className="mb-4 text-sm text-[#7A6A59] hover:text-[#4A3D33] flex items-center gap-2 mx-auto transition-all"
            >
              ← 다시 선택하기
            </button>
            {intevityType && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E8E0D5] shadow-sm">
                <span className="text-lg">✨</span>
                <span className="text-xs font-semibold text-[#7A6A59]">{intevityType}</span>
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1F1F] tracking-tight">
              AI 맞춤 견적서
            </h1>
            <p className="text-base text-[#6B6B6B] max-w-2xl mx-auto leading-relaxed">
              {aiReasoning || 'AI 분석 기반 추천 옵션을 확인하세요'}
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs mt-4">
              {input?.pyeong && (
                <span className="px-3 py-1.5 bg-white text-[#4A3D33] rounded-full border border-[#E8E0D5] shadow-sm font-medium">
                  🏠 {input.pyeong}평
                </span>
              )}
              {input?.buildingAge !== undefined && (
                <span className="px-3 py-1.5 bg-white text-[#4A3D33] rounded-full border border-[#E8E0D5] shadow-sm font-medium">
                  🏗️ 연식 {input.buildingAge}년
                </span>
              )}
              {input?.familyType && (
                <span className="px-3 py-1.5 bg-white text-[#4A3D33] rounded-full border border-[#E8E0D5] shadow-sm font-medium">
                  👨‍👩‍👧‍👦 {input.familyType}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          {/* 선택한 옵션 카드 */}
          <OptionCard
            optionName={option.name}
            description={option.description}
            processes={option.processes}
            cost={option.cost}
            analysis={option.analysis}
            recommended
          />

          {/* 출처·면책 */}
          {option.analysis?.priceIncrease?.disclaimer && (
            <div className="bg-[#F7F3ED] px-6 py-5 text-xs text-[#6B6B6B] space-y-2 border border-[#E8E0D5] rounded-2xl">
              <p>
                <strong className="text-[#4A3D33]">📚 출처:</strong>{' '}
                {option.analysis.priceIncrease.disclaimer.sources}
              </p>
              <p>
                <strong className="text-[#4A3D33]">⚠️ 주의:</strong>{' '}
                {option.analysis.priceIncrease.disclaimer.warning}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!mounted || !spaceInfo || selectedSpaces.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3D33] mx-auto mb-4" />
          <p className="text-[#6B6B6B]">견적 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      {/* 헤더 */}
      <div className="bg-gradient-to-b from-[#F7F3ED] to-[#FDFBF7] pt-12 pb-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/onboarding')}
            className="mb-6 text-sm text-[#7A6A59] hover:text-[#4A3D33] flex items-center gap-2 transition-all"
          >
            ← 다시 선택하기
          </button>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-[#E8E0D5] shadow-sm mb-2">
              <span className="text-xs font-semibold text-[#7A6A59]">최종 견적</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1F1F] tracking-tight">
              맞춤 견적서
            </h1>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-white rounded-full text-sm text-[#6B6B6B] border border-[#E8E0D5]">
                🏠 {spaceInfo.housingType} {spaceInfo.pyeong}평
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-sm text-[#6B6B6B] border border-[#E8E0D5]">
                🚪 방 {spaceInfo.rooms}개 · 욕실 {spaceInfo.bathrooms}개
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 space-y-8">
        {/* 아르젠 3등급 카드 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold text-[#1F1F1F] mb-4 text-center">
            등급별 예상 견적
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['ESSENTIAL', 'STANDARD', 'OPUS'] as ArgenGrade[]).map((grade) => {
              const info = GRADE_INFO[grade];
              const estimate = gradeEstimates[grade];
              const colors = GRADE_COLORS[grade];
              const isSelected = selectedGrade === grade;
              const isRecommended = grade === 'STANDARD';

              return (
                <motion.button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 rounded-2xl border-2 transition-all text-left
                    ${isSelected
                      ? `${colors.bg} ${colors.border} shadow-lg`
                      : 'bg-white border-[#E8E0D5] hover:border-[#9B8C7A]'
                    }`}
                >
                  {isRecommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#4A3D33] text-white text-xs font-bold rounded-full">
                      추천
                    </span>
                  )}
                  <div className="mb-3">
                    <p className={`text-xs font-medium ${isSelected ? colors.text : 'text-[#9B8C7A]'}`}>
                      {info.nameEn}
                    </p>
                    <h3 className="text-xl font-bold text-[#1F1F1F]">{info.name}</h3>
                    <p className="text-sm text-[#6B6B6B] mt-1">{info.concept}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#E8E0D5]">
                    <p className={`text-2xl font-bold ${isSelected ? colors.text : 'text-[#4A3D33]'}`}>
                      {estimate.min.toLocaleString()}~{estimate.max.toLocaleString()}
                      <span className="text-sm font-normal ml-1">만원</span>
                    </p>
                    <p className="text-xs text-[#9B8C7A] mt-1">{info.targetCustomer}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* 선택한 공간 요약 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E0D5]"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1F1F1F]">선택한 공간</h2>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-[#7A6A59] hover:text-[#4A3D33] flex items-center gap-1"
            >
              {showDetails ? '접기' : '상세 보기'}
              <motion.span animate={{ rotate: showDetails ? 180 : 0 }}>▼</motion.span>
            </button>
          </div>

          {/* 공간 목록 */}
          <div className="space-y-3">
            {selectedSpaceDetails.map((space) => {
              const multiplier = GRADE_MULTIPLIERS[selectedGrade];
              const adjustedEstimate = {
                min: Math.round(space.estimateRange.min * multiplier),
                max: Math.round(space.estimateRange.max * multiplier),
              };

              return (
                <div key={space.spaceId} className="border-b border-[#F7F3ED] last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{space.icon}</span>
                      <span className="font-medium text-[#1F1F1F]">{space.name}</span>
                    </div>
                    <span className="text-[#4A3D33] font-bold">
                      {adjustedEstimate.min.toLocaleString()}~{adjustedEstimate.max.toLocaleString()}만원
                    </span>
                  </div>

                  {/* 상세 정보 */}
                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 ml-10"
                      >
                        <div className="flex flex-wrap gap-2">
                          {getProcessNames(space.processes).slice(0, 4).map((process) => (
                            <span
                              key={process.id}
                              className="px-2 py-1 bg-[#F7F3ED] text-[#6B6B6B] text-xs rounded-full"
                            >
                              {process.name}
                            </span>
                          ))}
                          {space.processes.length > 4 && (
                            <span className="px-2 py-1 bg-[#F7F3ED] text-[#6B6B6B] text-xs rounded-full">
                              +{space.processes.length - 4}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* 추가 옵션 */}
          {additionalOptions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#E8E0D5]">
              <p className="text-sm font-medium text-[#7A6A59] mb-2">추가 옵션</p>
              <div className="flex flex-wrap gap-2">
                {additionalOptions.map((optionId) => {
                  const optionNames: Record<string, string> = {
                    window: '창호(샷시)',
                    hvac: '시스템 에어컨',
                    expansion: '발코니 확장',
                    ceiling: '천장 공사',
                    insulation: '단열 보강',
                  };
                  return (
                    <span
                      key={optionId}
                      className="px-3 py-1 bg-[#4A3D33] text-white text-sm rounded-full"
                    >
                      {optionNames[optionId] || optionId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </motion.section>

        {/* AI 견적 설명 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#F7F3ED] to-[#FFF9F3] rounded-2xl p-6 border-2 border-dashed border-[#D4C4B0]"
        >
          <h3 className="font-bold text-[#4A3D33] mb-3 flex items-center gap-2">
            <span className="text-xl">🤖</span>
            AI 견적 설명
          </h3>
          {isLoadingExplanation ? (
            <div className="flex items-center gap-2 text-sm text-[#9B8C7A]">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4A3D33]" />
              AI가 견적을 분석하고 있어요...
            </div>
          ) : aiExplanation ? (
            <p className="text-sm text-[#6B6B6B] leading-relaxed">{aiExplanation}</p>
          ) : (
            <p className="text-sm text-[#9B8C7A]">견적 설명을 불러올 수 없습니다.</p>
          )}
        </motion.section>

        {/* AI 자재 추천 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[#F7F3ED] to-[#FFF9F3] rounded-2xl p-6 border-2 border-dashed border-[#D4C4B0]"
        >
          <h3 className="font-bold text-[#4A3D33] mb-3 flex items-center gap-2">
            <span className="text-xl">✨</span>
            추천 자재
          </h3>
          {isLoadingMaterial ? (
            <div className="flex items-center gap-2 text-sm text-[#9B8C7A]">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4A3D33]" />
              AI가 자재를 추천하고 있어요...
            </div>
          ) : materialRecommendation ? (
            <p className="text-sm text-[#6B6B6B] leading-relaxed">{materialRecommendation}</p>
          ) : (
            <p className="text-sm text-[#9B8C7A]">자재 추천을 불러올 수 없습니다.</p>
          )}
        </motion.section>

        {/* 안내 문구 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#F7F3ED] rounded-2xl p-6"
        >
          <h3 className="font-bold text-[#4A3D33] mb-2">💡 견적 안내</h3>
          <ul className="text-sm text-[#6B6B6B] space-y-2">
            <li>• 위 견적은 예상 범위이며, 현장 상황에 따라 달라질 수 있습니다.</li>
            <li>• 정확한 견적은 무료 현장 방문 상담 후 확정됩니다.</li>
            <li>• 아르젠 스튜디오는 투명한 견적을 약속합니다.</li>
          </ul>
        </motion.section>
      </div>

      {/* 하단 고정 바: 상담 신청 */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#E8E0D5] shadow-2xl z-50"
      >
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#9B8C7A]">
                {GRADE_INFO[selectedGrade].name} 기준
              </p>
              <p className="text-2xl font-bold text-[#4A3D33]">
                {gradeEstimates[selectedGrade].min.toLocaleString()}~{gradeEstimates[selectedGrade].max.toLocaleString()}
                <span className="text-base font-normal ml-1">만원</span>
              </p>
            </div>
            <a
              href="tel:03180437966"
              className="px-8 py-3 bg-[#4A3D33] text-white rounded-xl font-bold text-lg hover:bg-[#3A2D23] transition-all shadow-lg"
            >
              📞 전화 상담
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
