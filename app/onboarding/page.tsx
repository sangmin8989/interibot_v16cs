'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpaceInfoStore, type HousingTypeLabel } from '@/lib/store/spaceInfoStore';
import { useSpaceSelectStore } from '@/lib/store/spaceSelectStore';
import { useIntevityStore } from '@/lib/store/intevityStore';
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

// 주거형태 옵션
const HOUSING_TYPES: HousingTypeLabel[] = ['아파트', '빌라', '단독주택', '오피스텔', '기타'];

// 평수 프리셋
const PYEONG_PRESETS = [
  { label: '20평대', value: 25 },
  { label: '30평대', value: 32 },
  { label: '40평대', value: 43 },
  { label: '50평 이상', value: 55 },
];

// 건물 연식 옵션
const BUILDING_AGE_OPTIONS = [
  { value: 5, label: '신축 (5년 이하)', icon: '🏗️' },
  { value: 15, label: '준신축 (10-20년)', icon: '🏠' },
  { value: 25, label: '노후 (20-30년)', icon: '🏚️' },
  { value: 35, label: '매우 노후 (30년+)', icon: '🏛️' },
];

// 가족 구성 옵션
const FAMILY_TYPE_OPTIONS = [
  { value: 'single', label: '1인 가구', icon: '👤' },
  { value: 'couple', label: '부부', icon: '👫' },
  { value: 'newborn_infant', label: '신생아/영유아', icon: '👶' },
  { value: 'dual_income', label: '맞벌이', icon: '💼' },
  { value: 'elderly', label: '노부모 동거', icon: '👴' },
  { value: 'multi_generation', label: '다세대', icon: '👨‍👩‍👧‍👦' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { spaceInfo, updateSpaceInfo, setSpaceInfo } = useSpaceInfoStore();
  const {
    selectedSpaces,
    additionalOptions,
    estimateTotal,
    addSpace,
    removeSpace,
    toggleAdditionalOption,
    updateEstimate,
    reset: resetSpaceSelect,
  } = useSpaceSelectStore();

  // Intevity 성향 분석 결과
  const intevityResult = useIntevityStore((s) => s.result);

  // 로컬 상태
  const [mounted, setMounted] = useState(false);
  const [pyeong, setPyeong] = useState(32);
  const [housingType, setHousingType] = useState<HousingTypeLabel>('아파트');
  const [rooms, setRooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [buildingAge, setBuildingAge] = useState(15); // 건물 연식 (기본: 준신축)
  const [familyType, setFamilyType] = useState('couple'); // 가족 구성 (기본: 부부)
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const [discomfort, setDiscomfort] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 마운트 시 초기화
  useEffect(() => {
    setMounted(true);
    // 기존 상태가 있으면 복원, 없으면 초기화
    if (spaceInfo) {
      setPyeong(spaceInfo.pyeong || 32);
      setHousingType(spaceInfo.housingType || '아파트');
      setRooms(spaceInfo.rooms || 3);
      setBathrooms(spaceInfo.bathrooms || 2);
    }
  }, [spaceInfo]);

  // 기본 정보 변경 시 Store 업데이트
  useEffect(() => {
    if (mounted) {
      setSpaceInfo({
        pyeong,
        housingType,
        rooms,
        bathrooms,
      });
    }
  }, [pyeong, housingType, rooms, bathrooms, mounted, setSpaceInfo]);

  // 동적 공간 생성 (방/욕실 개수 반영)
  const dynamicSpaces = useMemo(() => {
    return generateDynamicSpaces(rooms, bathrooms);
  }, [rooms, bathrooms]);

  // 평수 기반 견적 조정된 공간 목록
  const adjustedSpaces = useMemo(() => {
    return dynamicSpaces.map(space => ({
      ...space,
      estimateRange: adjustEstimateByPyeong(space.estimateRange, pyeong),
    }));
  }, [dynamicSpaces, pyeong]);

  // 전체 리모델링 패키지 생성
  const fullRemodelPackage = useMemo(() => {
    return generateFullRemodelPackage(adjustedSpaces);
  }, [adjustedSpaces]);

  // 분위기만 바꾸기 패키지 (평수 반영)
  const styleOnlyPackage = useMemo(() => {
    return {
      ...STYLE_ONLY_PACKAGE,
      estimateRange: adjustEstimateByPyeong(STYLE_ONLY_PACKAGE.estimateRange, pyeong),
    };
  }, [pyeong]);

  // 견적 자동 계산
  useEffect(() => {
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
      
      // 추가 옵션 견적 반영 (하드코딩 - 추후 DB 연동)
      const optionCosts: Record<string, { min: number; max: number }> = {
        window: { min: 600, max: 900 },
        hvac: { min: 800, max: 1200 },
        expansion: { min: 400, max: 700 },
        ceiling: { min: 200, max: 350 },
        insulation: { min: 150, max: 250 },
      };
      
      additionalOptions.forEach(optionId => {
        const cost = optionCosts[optionId];
        if (cost) {
          const adjusted = adjustEstimateByPyeong(cost, pyeong);
          total.min += adjusted.min;
          total.max += adjusted.max;
        }
      });
      
      updateEstimate(total.min, total.max);
    } else {
      updateEstimate(0, 0);
    }
  }, [selectedSpaces, additionalOptions, adjustedSpaces, fullRemodelPackage, styleOnlyPackage, pyeong, updateEstimate]);

  // 공간 선택 토글
  const handleSpaceToggle = (space: SpacePackage) => {
    const isSelected = selectedSpaces.some(s => s.spaceId === space.spaceId);
    
    // 전체 리모델링 선택 시 다른 공간 초기화
    if (space.spaceId === 'full' && !isSelected) {
      resetSpaceSelect();
      addSpace(space.spaceId, space.processes);
      return;
    }
    
    // 분위기만 바꾸기 선택 시 다른 공간 초기화
    if (space.spaceId === 'style' && !isSelected) {
      resetSpaceSelect();
      addSpace(space.spaceId, space.processes);
      return;
    }
    
    // 전체/스타일 패키지가 선택된 상태에서 개별 공간 선택 시 초기화
    const hasSpecialPackage = selectedSpaces.some(s => s.spaceId === 'full' || s.spaceId === 'style');
    if (hasSpecialPackage && !isSelected) {
      resetSpaceSelect();
    }
    
    if (isSelected) {
      removeSpace(space.spaceId);
    } else {
      addSpace(space.spaceId, space.processes);
    }
  };

  // AI 공간 추천
  const handleAiRecommendation = async () => {
    if (!discomfort.trim()) {
      alert('불편한 점을 입력해주세요.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/v5/space-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discomfort, pyeong, housingType, rooms, bathrooms }),
      });

      if (!response.ok) throw new Error('AI 추천 실패');

      const data = await response.json();
      if (data.success) {
        setAiRecommendation(data.recommendation);
        // AI가 추천한 공간 자동 선택
        if (data.recommendedSpaces && data.recommendedSpaces.length > 0) {
          resetSpaceSelect();
          data.recommendedSpaces.forEach((spaceId: string) => {
            const space = adjustedSpaces.find(s => s.spaceId === spaceId);
            if (space) {
              addSpace(space.spaceId, space.processes);
            }
          });
        }
      } else {
        alert('AI 추천 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('AI 추천 에러:', error);
      alert('AI 추천 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 다음 페이지로 이동
  const handleNext = () => {
    if (selectedSpaces.length === 0) {
      alert('공간을 하나 이상 선택해주세요.');
      return;
    }
    router.push('/estimate-result');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3D33]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      {/* 헤더 */}
      <div className="bg-gradient-to-b from-[#F7F3ED] to-[#FDFBF7] pt-12 pb-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Intevity 결과가 있으면 표시 */}
            {intevityResult && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E8E0D5] shadow-sm mb-2">
                <span className="text-lg">✨</span>
                <span className="text-xs font-semibold text-[#7A6A59]">
                  {intevityResult.profile.type}
                </span>
              </div>
            )}
            
            <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-[#E8E0D5] shadow-sm mb-2">
              <span className="text-xs font-semibold text-[#7A6A59]">STEP 3</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1F1F] tracking-tight">
              맞춤 견적 받기
            </h1>
            <p className="text-base text-[#6B6B6B] max-w-xl mx-auto leading-relaxed">
              {intevityResult 
                ? `${intevityResult.profile.type} 성향에 맞는 맞춤 견적을 받아보세요`
                : '기본 정보와 원하는 공간을 선택하면 즉시 견적을 확인할 수 있어요'
              }
            </p>
            
            {/* Intevity 특성 태그 */}
            {intevityResult && intevityResult.profile.traits && (
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {intevityResult.profile.traits.slice(0, 4).map((trait, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1.5 rounded-full bg-white text-[#4A3D33] text-xs font-medium border border-[#E8E0D5] shadow-sm"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        {/* 섹션 1: 기본 정보 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#E8E0D5]"
        >
          <h2 className="text-xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-3">
            <span className="w-8 h-8 bg-[#4A3D33] text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
            기본 정보
          </h2>

          <div className="space-y-6">
            {/* 주거형태 */}
            <div>
              <label className="block text-sm font-semibold text-[#4A3D33] mb-3">주거형태</label>
              <div className="flex flex-wrap gap-2">
                {HOUSING_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setHousingType(type)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${housingType === type
                        ? 'bg-[#4A3D33] text-white shadow-md'
                        : 'bg-[#F7F3ED] text-[#6B6B6B] hover:bg-[#E8E0D5]'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 평수 */}
            <div>
              <label className="block text-sm font-semibold text-[#4A3D33] mb-3">평수</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {PYEONG_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setPyeong(preset.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${pyeong === preset.value
                        ? 'bg-[#4A3D33] text-white shadow-md'
                        : 'bg-[#F7F3ED] text-[#6B6B6B] hover:bg-[#E8E0D5]'
                      }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={pyeong}
                  onChange={(e) => setPyeong(Math.max(10, Math.min(100, parseInt(e.target.value) || 32)))}
                  className="flex-1 sm:flex-none sm:w-28 px-4 py-2.5 border-2 border-[#E8E0D5] rounded-xl text-center focus:border-[#4A3D33] focus:outline-none font-semibold"
                />
                <span className="text-sm text-[#6B6B6B]">평 (직접 입력)</span>
              </div>
            </div>

            {/* 방/욕실 개수 */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#4A3D33] mb-3">방 개수</label>
                <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                  <button
                    onClick={() => setRooms(Math.max(1, rooms - 1))}
                    className="w-10 h-10 rounded-xl bg-[#F7F3ED] text-[#4A3D33] hover:bg-[#E8E0D5] transition-all flex items-center justify-center font-bold text-xl"
                  >
                    −
                  </button>
                  <span className="flex-1 sm:w-12 text-center text-lg font-bold text-[#1F1F1F]">{rooms}개</span>
                  <button
                    onClick={() => setRooms(Math.min(6, rooms + 1))}
                    className="w-10 h-10 rounded-xl bg-[#F7F3ED] text-[#4A3D33] hover:bg-[#E8E0D5] transition-all flex items-center justify-center font-bold text-xl"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4A3D33] mb-3">욕실 개수</label>
                <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                  <button
                    onClick={() => setBathrooms(Math.max(1, bathrooms - 1))}
                    className="w-10 h-10 rounded-xl bg-[#F7F3ED] text-[#4A3D33] hover:bg-[#E8E0D5] transition-all flex items-center justify-center font-bold text-xl"
                  >
                    −
                  </button>
                  <span className="flex-1 sm:w-12 text-center text-lg font-bold text-[#1F1F1F]">{bathrooms}개</span>
                  <button
                    onClick={() => setBathrooms(Math.min(4, bathrooms + 1))}
                    className="w-10 h-10 rounded-xl bg-[#F7F3ED] text-[#4A3D33] hover:bg-[#E8E0D5] transition-all flex items-center justify-center font-bold text-xl"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* 건물 연식 */}
            <div>
              <label className="block text-sm font-medium text-[#4A3D33] mb-3">건물 연식</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {BUILDING_AGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setBuildingAge(option.value)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1
                      ${buildingAge === option.value
                        ? 'bg-[#4A3D33] text-white shadow-lg'
                        : 'bg-[#F7F3ED] text-[#6B6B6B] hover:bg-[#E8E0D5]'
                      }`}
                  >
                    <span className="text-lg">{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 가족 구성 */}
            <div>
              <label className="block text-sm font-medium text-[#4A3D33] mb-3">가족 구성</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {FAMILY_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFamilyType(option.value)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 justify-center
                      ${familyType === option.value
                        ? 'bg-[#4A3D33] text-white shadow-lg'
                        : 'bg-[#F7F3ED] text-[#6B6B6B] hover:bg-[#E8E0D5]'
                      }`}
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* 섹션 1.5: 불편사항 입력 (AI 추천) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-[#F7F3ED] to-[#FFF9F3] rounded-2xl p-6 shadow-sm border-2 border-dashed border-[#D4C4B0]"
        >
          <h2 className="text-lg font-bold text-[#1F1F1F] mb-3 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI 공간 추천 (선택)
          </h2>
          <p className="text-sm text-[#6B6B6B] mb-4">
            현재 불편한 점을 말씀해주시면 AI가 필요한 공간을 추천해드려요
          </p>
          
          <div className="space-y-3">
            <textarea
              value={discomfort}
              onChange={(e) => setDiscomfort(e.target.value)}
              placeholder="예: 욕실이 너무 낡았어요, 수납공간이 부족해요, 거실이 어두워요..."
              className="w-full px-4 py-3 border-2 border-[#E8E0D5] rounded-xl focus:border-[#4A3D33] focus:outline-none resize-none h-24"
            />
            
            <button
              onClick={handleAiRecommendation}
              disabled={isAnalyzing || !discomfort.trim()}
              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                ${isAnalyzing || !discomfort.trim()
                  ? 'bg-[#E8E0D5] text-[#9B8C7A] cursor-not-allowed'
                  : 'bg-[#4A3D33] text-white hover:bg-[#3A2D23] shadow-md'
                }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  AI가 분석 중...
                </>
              ) : (
                '✨ AI 추천 받기'
              )}
            </button>

            {aiRecommendation && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white rounded-xl border border-[#E8E0D5]"
              >
                <p className="text-sm font-medium text-[#4A3D33] mb-2">💡 AI 추천</p>
                <p className="text-sm text-[#6B6B6B]">{aiRecommendation}</p>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* 섹션 2: 공간 선택 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E0D5]"
        >
          <h2 className="text-lg font-bold text-[#1F1F1F] mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-[#4A3D33] text-white rounded-full flex items-center justify-center text-sm">2</span>
            어디를 리모델링 할까요?
          </h2>

          {/* 특별 패키지 */}
          <div className="mb-6 p-4 bg-[#F7F3ED] rounded-xl">
            <p className="text-sm font-medium text-[#7A6A59] mb-3">추천 패키지</p>
            <div className="grid grid-cols-2 gap-3">
              <SpaceCard
                space={fullRemodelPackage}
                isSelected={selectedSpaces.some(s => s.spaceId === 'full')}
                onToggle={() => handleSpaceToggle(fullRemodelPackage)}
              />
              <SpaceCard
                space={styleOnlyPackage}
                isSelected={selectedSpaces.some(s => s.spaceId === 'style')}
                onToggle={() => handleSpaceToggle(styleOnlyPackage)}
              />
            </div>
          </div>

          {/* 개별 공간 선택 */}
          <p className="text-sm font-medium text-[#7A6A59] mb-3">공간별 선택</p>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {adjustedSpaces.map((space) => (
              <SpaceCard
                key={space.spaceId}
                space={space}
                isSelected={selectedSpaces.some(s => s.spaceId === space.spaceId)}
                onToggle={() => handleSpaceToggle(space)}
              />
            ))}
          </div>

          {/* 추가 옵션 */}
          <div className="mt-6 pt-6 border-t border-[#E8E0D5]">
            <button
              onClick={() => setShowAdditionalOptions(!showAdditionalOptions)}
              className="flex items-center gap-2 text-sm font-medium text-[#7A6A59] hover:text-[#4A3D33] transition-colors"
            >
              <span>추가 옵션</span>
              <motion.span
                animate={{ rotate: showAdditionalOptions ? 180 : 0 }}
              >
                ▼
              </motion.span>
            </button>
            
            <AnimatePresence>
              {showAdditionalOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3"
                >
                  {ADDITIONAL_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => toggleAdditionalOption(option.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all
                        ${additionalOptions.includes(option.id)
                          ? 'bg-[#4A3D33] text-white border-[#4A3D33]'
                          : 'bg-white text-[#1F1F1F] border-[#E8E0D5] hover:border-[#4A3D33]'
                        }`}
                    >
                      <div className="text-sm font-bold">{option.name}</div>
                      <div className={`text-xs mt-1 ${additionalOptions.includes(option.id) ? 'opacity-80' : 'text-[#9B8C7A]'}`}>
                        {option.description}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>

      {/* 하단 고정 바: AI 옵션 추천 */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#E8E0D5] shadow-2xl z-50"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          {/* 견적 정보 */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs sm:text-sm text-[#9B8C7A]">예상 견적</p>
              {estimateTotal.min > 0 ? (
                <p className="text-lg sm:text-xl font-bold text-[#4A3D33]">
                  {estimateTotal.min.toLocaleString()}~{estimateTotal.max.toLocaleString()}
                  <span className="text-xs sm:text-sm font-normal ml-1">만원</span>
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-[#9B8C7A]">기본 정보만 입력해도 AI 추천 가능!</p>
              )}
            </div>
            <div className="text-right text-xs text-[#9B8C7A]">
              <p>{pyeong}평 · {BUILDING_AGE_OPTIONS.find(o => o.value === buildingAge)?.label?.replace(/\s*\(.*?\)/, '')}</p>
              <p className="hidden sm:block">{FAMILY_TYPE_OPTIONS.find(o => o.value === familyType)?.label}</p>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-2 sm:gap-3">
            {/* 견적 확인 버튼 */}
            {selectedSpaces.length > 0 && (
              <button
                onClick={handleNext}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all shadow-lg bg-[#4A3D33] text-white hover:bg-[#3A2D23] active:scale-95"
              >
                견적 확인하기 →
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
