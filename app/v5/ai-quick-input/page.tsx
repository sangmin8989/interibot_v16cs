'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Calendar, Users, DollarSign } from 'lucide-react';
import { useIntevityStore } from '@/lib/store/intevityStore';

// 가족 구성 옵션
const FAMILY_TYPES = [
  { value: 'single', label: '1인 가구', icon: '👤' },
  { value: 'couple', label: '부부', icon: '👫' },
  { value: 'newborn_infant', label: '신생아/영유아', icon: '👶' },
  { value: 'dual_income', label: '맞벌이', icon: '💼' },
  { value: 'elderly', label: '노부모 동거', icon: '👴' },
  { value: 'multi_generation', label: '다세대', icon: '👨‍👩‍👧‍👦' },
] as const;

// 건물 연식 옵션
const BUILDING_AGE_OPTIONS = [
  { value: 5, label: '신축 (5년 이하)' },
  { value: 15, label: '준신축 (10-20년)' },
  { value: 25, label: '노후 (20-30년)' },
  { value: 35, label: '매우 노후 (30년 이상)' },
];

// 인기 평수
const POPULAR_PYEONG = [20, 25, 32, 40];

export default function AIQuickInputPage() {
  const router = useRouter();
  
  // 인테비티 결과 가져오기
  const intevityResult = useIntevityStore((s) => s.result);
  
  const [pyeong, setPyeong] = useState<number>(32);
  const [customPyeong, setCustomPyeong] = useState<string>('');
  const [buildingAge, setBuildingAge] = useState<number>(15);
  const [familyType, setFamilyType] = useState<string>('couple');
  const [currentPrice, setCurrentPrice] = useState<string>('');

  const handleSubmit = () => {
    // 최종 평수 결정
    const finalPyeong = customPyeong ? parseFloat(customPyeong) : pyeong;
    
    if (finalPyeong <= 0 || finalPyeong > 200) {
      alert('평수를 올바르게 입력해주세요 (1-200평)');
      return;
    }

    // URL 파라미터로 전달
    const params = new URLSearchParams({
      pyeong: finalPyeong.toString(),
      buildingAge: buildingAge.toString(),
      familyType: familyType,
    });

    // 현재 시세 입력한 경우에만 추가
    if (currentPrice && parseFloat(currentPrice) > 0) {
      params.append('currentPrice', currentPrice);
    }

    // 인테비티 결과가 있으면 전달
    if (intevityResult) {
      params.append('intevityType', intevityResult.profile.type);
      params.append('intevityTraits', intevityResult.profile.traits.join(','));
    }

    router.push(`/v5/estimate-options?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          {/* 인테비티 결과가 있으면 표시 */}
          {intevityResult && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E8E0D5] shadow-sm mb-2">
              <span className="text-lg">✨</span>
              <span className="text-xs font-semibold text-[#7A6A59]">
                {intevityResult.profile.type}
              </span>
            </div>
          )}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E8E0D5] shadow-sm mb-2">
            <span className="text-2xl">🤖</span>
            <span className="text-xs font-semibold text-[#7A6A59]">AI 맞춤 추천</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1F1F] tracking-tight">
            간단한 정보만 알려주세요
          </h1>
          <p className="text-base text-[#6B6B6B] max-w-xl mx-auto leading-relaxed">
            {intevityResult 
              ? `"${intevityResult.profile.type}" 성향을 바탕으로 AI가 맞춤 옵션을 추천합니다`
              : 'AI가 당신의 상황에 맞는 최적의 인테리어 옵션 3가지를 추천해드립니다'
            }
          </p>
          {/* 인테비티 특성 태그 */}
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

        {/* 입력 폼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-8"
        >
          {/* 1. 평수 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#1F1F1F]">
              <Home className="w-5 h-5 text-[#4A3D33]" />
              <label className="text-lg font-semibold">평수</label>
              <span className="text-sm text-red-500">*</span>
            </div>
            
            {/* 인기 평수 선택 */}
            <div className="grid grid-cols-4 gap-3">
              {POPULAR_PYEONG.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPyeong(p);
                    setCustomPyeong('');
                  }}
                  className={`
                    py-3 rounded-xl font-semibold transition-all
                    ${
                      pyeong === p && !customPyeong
                        ? 'bg-[#4A3D33] text-white shadow-md scale-105'
                        : 'bg-[#F7F3ED] text-[#1F1F1F] hover:bg-[#E8E0D5]'
                    }
                  `}
                >
                  {p}평
                </button>
              ))}
            </div>

            {/* 직접 입력 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#9B8C7A]">또는</span>
              <input
                type="number"
                placeholder="직접 입력 (예: 35)"
                value={customPyeong}
                onChange={(e) => setCustomPyeong(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[#E8E0D5] focus:border-[#4A3D33] focus:outline-none"
              />
              <span className="text-sm text-[#9B8C7A]">평</span>
            </div>
          </div>

          {/* 2. 건물 연식 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#1F1F1F]">
              <Calendar className="w-5 h-5 text-[#4A3D33]" />
              <label className="text-lg font-semibold">건물 연식</label>
              <span className="text-sm text-red-500">*</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {BUILDING_AGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBuildingAge(option.value)}
                  className={`
                    py-3 px-4 rounded-xl font-medium transition-all text-sm
                    ${
                      buildingAge === option.value
                        ? 'bg-[#4A3D33] text-white shadow-md scale-105'
                        : 'bg-[#F7F3ED] text-[#1F1F1F] hover:bg-[#E8E0D5]'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. 가족 구성 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#1F1F1F]">
              <Users className="w-5 h-5 text-[#4A3D33]" />
              <label className="text-lg font-semibold">가족 구성</label>
              <span className="text-sm text-red-500">*</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FAMILY_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFamilyType(type.value)}
                  className={`
                    py-3 px-4 rounded-xl font-medium transition-all text-sm flex items-center gap-2 justify-center
                    ${
                      familyType === type.value
                        ? 'bg-[#4A3D33] text-white shadow-md scale-105'
                        : 'bg-[#F7F3ED] text-[#1F1F1F] hover:bg-[#E8E0D5]'
                    }
                  `}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. 현재 시세 (선택사항) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#1F1F1F]">
              <DollarSign className="w-5 h-5 text-[#4A3D33]" />
              <label className="text-lg font-semibold">현재 시세</label>
              <span className="text-xs text-[#9B8C7A]">(선택사항)</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="예: 50000 (5억)"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[#E8E0D5] focus:border-[#4A3D33] focus:outline-none"
              />
              <span className="text-sm text-[#9B8C7A]">만원</span>
            </div>
            <p className="text-xs text-[#9B8C7A]">
              * 입력하시면 집값 상승 예측이 더 정확해집니다
            </p>
          </div>
        </motion.div>

        {/* 제출 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4"
        >
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-[#E8E0D5] text-[#1F1F1F] font-semibold hover:bg-[#F7F3ED] transition-all"
          >
            ← 이전
          </button>
          <button
            onClick={handleSubmit}
            className="w-full sm:flex-1 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-[#4A3D33] text-white font-bold text-base sm:text-lg hover:bg-[#3A2D23] transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            AI 옵션 3안 추천받기 →
          </button>
        </motion.div>

        {/* 안내 메시지 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#F7F3ED] rounded-2xl p-4 sm:p-5 text-center"
        >
          <p className="font-semibold text-[#4A3D33] mb-2 text-sm sm:text-base">💡 AI가 어떻게 추천하나요?</p>
          <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
            입력하신 정보를 바탕으로 생활 만족도와 집값 상승 효과를 분석하여,
            <br className="hidden sm:block" />
            <strong>가성비형 · 균형형 · 프리미엄형</strong> 3가지 옵션을 제안합니다
          </p>
        </motion.div>
      </div>
    </div>
  );
}
