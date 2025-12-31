'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore';
import { useSpaceSelectStore } from '@/lib/store/spaceSelectStore';
import {
  SPACE_PACKAGES,
  STYLE_ONLY_PACKAGE,
  ADDITIONAL_OPTIONS,
  generateDynamicSpaces,
  generateFullRemodelPackage,
  adjustEstimateByPyeong,
  type SpacePackage,
} from '@/constants/processes';
import SpaceCard from '@/components/space-select/SpaceCard';
import SelectedSpaceDetail from '@/components/space-select/SelectedSpaceDetail';

export default function SpaceSelectPage() {
  const router = useRouter();
  const spaceInfo = useSpaceInfoStore((s) => s.spaceInfo);
  
  const {
    selectedSpaces,
    additionalOptions,
    estimateTotal,
    addSpace,
    removeSpace,
    toggleAdditionalOption,
    updateEstimate,
  } = useSpaceSelectStore();
  
  const [mounted, setMounted] = useState(false);
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);

  // 동적 공간 생성 (욕실/방 개수 반영)
  const dynamicSpaces = useMemo(() => {
    if (!spaceInfo) return [];
    return generateDynamicSpaces(spaceInfo.rooms || 3, spaceInfo.bathrooms || 2);
  }, [spaceInfo]);

  // 평수 기반 견적 조정된 공간 목록
  const adjustedSpaces = useMemo(() => {
    if (!spaceInfo) return dynamicSpaces;
    return dynamicSpaces.map(space => ({
      ...space,
      estimateRange: adjustEstimateByPyeong(space.estimateRange, spaceInfo.pyeong),
    }));
  }, [dynamicSpaces, spaceInfo]);

  // 전체 리모델링 패키지 생성
  const fullRemodelPackage = useMemo(() => {
    return generateFullRemodelPackage(adjustedSpaces);
  }, [adjustedSpaces]);

  // 분위기만 바꾸기 패키지 (평수 반영)
  const styleOnlyPackage = useMemo(() => {
    if (!spaceInfo) return STYLE_ONLY_PACKAGE;
    return {
      ...STYLE_ONLY_PACKAGE,
      estimateRange: adjustEstimateByPyeong(STYLE_ONLY_PACKAGE.estimateRange, spaceInfo.pyeong),
    };
  }, [spaceInfo]);

  useEffect(() => {
    setMounted(true);
    
    if (!spaceInfo || !spaceInfo.pyeong) {
      router.push('/reality');
    }
  }, [spaceInfo, router]);

  useEffect(() => {
    // 견적 자동 계산 (평수 반영)
    if (selectedSpaces.length > 0) {
      const total = selectedSpaces.reduce(
        (acc, space) => {
          const pkg = adjustedSpaces.find(p => p.spaceId === space.spaceId) ||
                      (space.spaceId === 'full' ? fullRemodelPackage : null) ||
                      (space.spaceId === 'style' ? styleOnlyPackage : null);
          
          if (pkg) {
            return {
              min: acc.min + pkg.estimateRange.min,
              max: acc.max + pkg.estimateRange.max,
            };
          }
          return acc;
        },
        { min: 0, max: 0 }
      );
      
      // 추가 옵션 견적 반영
      additionalOptions.forEach(optionId => {
        const option = ADDITIONAL_OPTIONS.find(o => o.id === optionId);
        if (option) {
          // 추가 옵션 대략적인 견적 (향후 세분화 필요)
          const optionCost = {
            window: { min: 600, max: 900 },
            hvac: { min: 700, max: 1200 },
            expansion: { min: 500, max: 800 },
            ceiling: { min: 300, max: 500 },
            insulation: { min: 200, max: 400 },
          }[optionId] || { min: 0, max: 0 };
          
          const adjusted = adjustEstimateByPyeong(optionCost, spaceInfo?.pyeong || 32);
          total.min += adjusted.min;
          total.max += adjusted.max;
        }
      });
      
      updateEstimate(total.min, total.max);
    } else {
      updateEstimate(0, 0);
    }
  }, [selectedSpaces, additionalOptions, adjustedSpaces, fullRemodelPackage, styleOnlyPackage, spaceInfo, updateEstimate]);

  if (!mounted || !spaceInfo) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3D33] mx-auto mb-4" />
          <p className="text-sm text-[#6B6B6B]">정보 확인 중...</p>
        </div>
      </div>
    );
  }

  const handleSpaceToggle = (packageData: SpacePackage) => {
    const exists = selectedSpaces.find(s => s.spaceId === packageData.spaceId);
    
    if (exists) {
      removeSpace(packageData.spaceId);
    } else {
      addSpace(packageData.spaceId, packageData.processes);
    }
  };

  const handleSpecialPackage = (packageData: SpacePackage) => {
    // 전체/스타일 패키지는 기존 선택 초기화 후 추가
    selectedSpaces.forEach(s => removeSpace(s.spaceId));
    addSpace(packageData.spaceId, packageData.processes);
  };

  const isSpaceSelected = (spaceId: string) => {
    return selectedSpaces.some(s => s.spaceId === spaceId);
  };

  const handleNext = () => {
    if (selectedSpaces.length === 0) {
      alert('최소 1개 공간을 선택해주세요.');
      return;
    }

    router.push('/estimate-result');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-[#1F1F1F] mb-2">어디 고치실 거예요?</h1>
          <p className="text-[#6B6B6B]">
            {spaceInfo.pyeong}평 {spaceInfo.housingType} · 방 {spaceInfo.rooms}개 · 화장실{' '}
            {spaceInfo.bathrooms}개
          </p>
          <p className="text-sm text-[#9B8C7A] mt-2">(여러 개 선택 가능)</p>
        </motion.div>

        {/* 공간 선택 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4"
        >
          {adjustedSpaces.map((space) => (
            <SpaceCard
              key={space.spaceId}
              space={space}
              isSelected={isSpaceSelected(space.spaceId)}
              onToggle={() => handleSpaceToggle(space)}
            />
          ))}
        </motion.div>

        {/* 특별 패키지 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {/* 전체 리모델링 */}
          <button
            onClick={() => handleSpecialPackage(fullRemodelPackage)}
            className={`
              w-full p-5 rounded-2xl border-2 transition-all text-left
              ${
                isSpaceSelected('full')
                  ? 'bg-[#4A3D33] text-white border-[#4A3D33] shadow-lg'
                  : 'bg-white text-[#1F1F1F] border-[#E8E0D5] hover:border-[#4A3D33] hover:bg-[#F7F3ED]'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{fullRemodelPackage.icon}</span>
                <div>
                  <h3 className="text-lg font-bold">{fullRemodelPackage.name}</h3>
                  <p className="text-sm opacity-80">모든 공간 + 마감 통일</p>
                </div>
              </div>
              {isSpaceSelected('full') && (
                <span className="text-sm font-semibold">
                  {fullRemodelPackage.estimateRange.min}~{fullRemodelPackage.estimateRange.max}만원
                </span>
              )}
            </div>
          </button>

          {/* 분위기만 */}
          <button
            onClick={() => handleSpecialPackage(styleOnlyPackage)}
            className={`
              w-full p-5 rounded-2xl border-2 transition-all text-left
              ${
                isSpaceSelected('style')
                  ? 'bg-[#4A3D33] text-white border-[#4A3D33] shadow-lg'
                  : 'bg-white text-[#1F1F1F] border-[#E8E0D5] hover:border-[#4A3D33] hover:bg-[#F7F3ED]'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{styleOnlyPackage.icon}</span>
                <div>
                  <h3 className="text-lg font-bold">{styleOnlyPackage.name}</h3>
                  <p className="text-sm opacity-80">도배 + 바닥 + 조명 (철거 없음)</p>
                </div>
              </div>
              {isSpaceSelected('style') && (
                <span className="text-sm font-semibold">
                  {styleOnlyPackage.estimateRange.min}~{styleOnlyPackage.estimateRange.max}만원
                </span>
              )}
            </div>
          </button>
        </motion.div>

        {/* 선택 요약 및 상세 */}
        {selectedSpaces.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-[#1F1F1F]">선택하신 공간</h3>
            
            {/* 선택된 공간 상세 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {selectedSpaces.map((space) => {
                  const pkg = adjustedSpaces.find(p => p.spaceId === space.spaceId) ||
                              (space.spaceId === 'full' ? fullRemodelPackage : null) ||
                              (space.spaceId === 'style' ? styleOnlyPackage : null);
                  
                  if (!pkg) return null;
                  
                  return (
                    <SelectedSpaceDetail
                      key={space.spaceId}
                      space={pkg}
                      onRemove={() => removeSpace(space.spaceId)}
                    />
                  );
                })}
              </AnimatePresence>
            </div>

            {/* 총 견적 */}
            <div className="bg-[#4A3D33] text-white rounded-2xl p-6">
              <div className="flex justify-between items-center">
                <span className="text-base">총 예상 견적</span>
                <span className="text-3xl font-bold">
                  {estimateTotal.min}~{estimateTotal.max}만원
                </span>
              </div>
              <p className="text-xs opacity-80 mt-2">
                * {spaceInfo.pyeong}평 기준 예상 금액입니다
              </p>
            </div>
          </motion.div>
        )}

        {/* 추가 옵션 버튼 */}
        {selectedSpaces.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => setShowAdditionalOptions(!showAdditionalOptions)}
              className="w-full p-4 rounded-xl border-2 border-[#E8E0D5] bg-white hover:bg-[#F7F3ED] transition-all text-[#4A3D33] font-semibold"
            >
              {showAdditionalOptions ? '− 추가 옵션 접기' : '+ 추가로 필요하신 거 있으세요?'}
            </button>
          </motion.div>
        )}

        {/* 추가 옵션 목록 */}
        {showAdditionalOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            {ADDITIONAL_OPTIONS.map((option) => {
              const selected = additionalOptions.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleAdditionalOption(option.id)}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all text-left
                    ${
                      selected
                        ? 'bg-[#F7F3ED] border-[#4A3D33]'
                        : 'bg-white border-[#E8E0D5] hover:border-[#4A3D33]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0
                        ${
                          selected
                            ? 'bg-[#4A3D33] border-[#4A3D33]'
                            : 'border-[#9B8C7A] bg-white'
                        }
                      `}
                    >
                      {selected && <span className="text-white text-sm">✓</span>}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1F1F1F]">{option.name}</h4>
                      <p className="text-sm text-[#6B6B6B]">{option.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}

        {/* 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3"
        >
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border-2 border-[#E8E0D5] text-[#1F1F1F] font-semibold hover:bg-[#F7F3ED] transition-all"
          >
            이전
          </button>
          <button
            onClick={handleNext}
            disabled={selectedSpaces.length === 0}
            className={`
              flex-1 px-8 py-3 rounded-xl font-semibold transition-all
              ${
                selectedSpaces.length > 0
                  ? 'bg-[#4A3D33] text-white hover:bg-[#3A2D23] shadow-lg'
                  : 'bg-[#E8E0D5] text-[#9B8C7A] cursor-not-allowed'
              }
            `}
          >
            다음 단계
          </button>
        </motion.div>
      </div>
    </div>
  );
}
