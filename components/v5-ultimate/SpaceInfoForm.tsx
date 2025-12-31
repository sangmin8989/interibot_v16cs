'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Minus, Plus, Home, Check } from 'lucide-react';
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore';

interface SpaceInfoFormProps {
  onComplete: () => void;
  onBack: () => void;
}

// 평수별 기본 구성 데이터
const PYEONG_CONFIG: Record<number, { rooms: number; bathrooms: number }> = {
  15: { rooms: 2, bathrooms: 1 },
  18: { rooms: 2, bathrooms: 1 },
  20: { rooms: 2, bathrooms: 1 },
  24: { rooms: 3, bathrooms: 1 },
  25: { rooms: 3, bathrooms: 1 },
  28: { rooms: 3, bathrooms: 2 },
  30: { rooms: 3, bathrooms: 2 },
  32: { rooms: 3, bathrooms: 2 },
  34: { rooms: 4, bathrooms: 2 },
  40: { rooms: 4, bathrooms: 2 },
  43: { rooms: 4, bathrooms: 2 },
  49: { rooms: 4, bathrooms: 2 },
  55: { rooms: 5, bathrooms: 2 },
  60: { rooms: 5, bathrooms: 3 },
};

// 인기 평수 옵션 (빠른 선택용)
const POPULAR_PYEONG = [20, 25, 32, 40, 49];

// 생활특성 태그 옵션
const LIFESTYLE_TAGS = [
  { value: 'hasBaby', label: '영유아가 있어요', icon: '👶' },
  { value: 'hasChild', label: '어린이가 있어요', icon: '🧒' },
  { value: 'hasTeen', label: '청소년이 있어요', icon: '🧑' },
  { value: 'hasPets', label: '반려동물과 함께 살아요', icon: '🐕' },
  { value: 'hasElderly', label: '연로하신 가족이 있어요', icon: '👴' },
  { value: 'hasPregnant', label: '임신 중인 가족이 있어요', icon: '🤰' },
  { value: 'worksFromHome', label: '재택근무를 해요', icon: '💻' },
  { value: 'cooksOften', label: '요리를 자주 해요', icon: '🍳' },
  { value: 'hasGuests', label: '손님이 자주 오세요', icon: '🛋️' },
  { value: 'hasShiftWorker', label: '교대근무를 하시는 가족이 있어요', icon: '🌙' },
];

// 연령대 옵션
const AGE_RANGES = [
  { value: '20대', label: '20대', icon: '🧑' },
  { value: '30대', label: '30대', icon: '👨' },
  { value: '40대', label: '40대', icon: '🧔' },
  { value: '50대', label: '50대', icon: '👴' },
  { value: '60대 이상', label: '60+', icon: '😊' },
];

// 가족수 옵션
const FAMILY_SIZE_OPTIONS = [
  { value: '1인', label: '1인' },
  { value: '2인', label: '2인' },
  { value: '3인', label: '3인' },
  { value: '4인', label: '4인' },
  { value: '5인 이상', label: '5인 이상' },
];

// 평수 → ㎡ 변환 (1평 = 3.3058㎡)
const pyeongToSqm = (pyeong: number): number => {
  return Math.round(pyeong * 3.3058 * 10) / 10;
};

// 평수에 가장 가까운 기본 구성 찾기
const getDefaultConfig = (pyeong: number): { rooms: number; bathrooms: number } => {
  const keys = Object.keys(PYEONG_CONFIG).map(Number).sort((a, b) => a - b);
  
  // 가장 가까운 평수 찾기
  let closest = keys[0];
  for (const key of keys) {
    if (Math.abs(key - pyeong) < Math.abs(closest - pyeong)) {
      closest = key;
    }
  }
  
  return PYEONG_CONFIG[closest] || { rooms: 3, bathrooms: 2 };
};

export default function SpaceInfoForm({ onComplete, onBack }: SpaceInfoFormProps) {
  const { updateSpaceInfo } = useSpaceInfoStore();
  
  const [pyeong, setPyeong] = useState<number>(32);
  const [rooms, setRooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [isRoomAuto, setIsRoomAuto] = useState<boolean>(true);
  const [isBathroomAuto, setIsBathroomAuto] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [additionalNotes, setAdditionalNotes] = useState<string>(''); // 고객 추가 정보
  const [lifestyleTags, setLifestyleTags] = useState<string[]>([]); // 생활특성 태그
  const [ageRanges, setAgeRanges] = useState<string[]>([]); // 연령대 (다중 선택)
  const [familySizeRange, setFamilySizeRange] = useState<string | null>(null); // 가족수 범위
  const [totalPeople, setTotalPeople] = useState<number>(0); // 실제 가족 인원수

  // 평수 변경 시 자동 업데이트
  useEffect(() => {
    if (pyeong > 0) {
      const config = getDefaultConfig(pyeong);
      if (isRoomAuto) {
        setRooms(config.rooms);
      }
      if (isBathroomAuto) {
        setBathrooms(config.bathrooms);
      }
    }
  }, [pyeong, isRoomAuto, isBathroomAuto]);

  const handleSubmit = async () => {
    if (isLoading || !isFormValid) return;
    
    setIsLoading(true);
    
    // Store에 저장 (고객이 입력한 정보를 분석 엔진에 반영하기 위해 additionalNotes, lifestyleTags, ageRanges, familySizeRange 포함)
    updateSpaceInfo({
      housingType: '아파트',
      pyeong: pyeong,
      squareMeter: pyeongToSqm(pyeong),
      rooms: rooms,
      bathrooms: bathrooms,
      inputMethod: 'exact',
      isRoomAuto: isRoomAuto,
      isBathroomAuto: isBathroomAuto,
      ageRanges: ageRanges, // 연령대 저장
      familySizeRange: familySizeRange, // 가족수 범위 저장
      totalPeople: totalPeople, // 실제 가족 인원수 저장
      lifestyleTags: lifestyleTags, // 생활특성 태그 저장
      additionalNotes: additionalNotes.trim(), // 고객이 입력한 추가 정보 저장
    });

    // 약간의 딜레이 후 다음 스텝으로 (UX용)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsLoading(false);
    onComplete();  // 다음 스텝(analyzing)으로 이동
  };

  // housingType은 항상 '아파트'로 고정이므로 평수만 체크
  const isFormValid = pyeong > 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* 헤더 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F7F3ED] to-[#E8E4DC] mb-5">
          <Home className="w-10 h-10 text-[#B8956B]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#1F1F1F] mb-4">
          집 정보를 알려주세요
        </h1>
        <p className="text-lg text-[#6B6B6B]">
          더 정확한 견적을 위해 필요해요
        </p>
      </motion.div>

      {/* 평수 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-10"
      >
        <label className="block text-[#1F1F1F] font-bold text-lg mb-4">
          평수 <span className="text-[#B8956B] text-base font-normal">(필수)</span>
        </label>
        
        {/* 빠른 선택 버튼 */}
        <div className="flex flex-wrap gap-3 mb-4">
          {POPULAR_PYEONG.map((popularPyeong) => (
            <button
              key={popularPyeong}
              onClick={() => setPyeong(popularPyeong)}
              className={`px-5 py-3 rounded-xl text-base font-semibold transition-all
                ${pyeong === popularPyeong
                  ? 'bg-[#B8956B] text-white shadow-lg scale-105'
                  : 'bg-[#F7F3ED] text-[#6B6B6B] hover:bg-[#E8E4DC] hover:scale-105'
                }`}
              type="button"
            >
              {popularPyeong}평
            </button>
          ))}
        </div>

        {/* 직접 입력 */}
        <div className="relative">
          <input
            type="number"
            value={pyeong || ''}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : 0;
              setPyeong(value);
            }}
            placeholder="또는 직접 입력하세요"
            min="1"
            max="200"
            className="w-full px-6 py-5 rounded-2xl border-2 border-[#E8E4DC] 
                     bg-white text-[#1F1F1F] text-xl font-semibold
                     focus:outline-none focus:border-[#B8956B] focus:ring-4 focus:ring-[#B8956B]/20
                     transition-all placeholder:text-[#D4D4D4] placeholder:font-normal"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <span className="text-[#6B6B6B] font-bold text-lg">평</span>
            {pyeong > 0 && (
              <span className="text-[#B8956B] text-sm bg-[#F7F3ED] px-3 py-1.5 rounded-lg font-semibold">
                {pyeongToSqm(pyeong)}㎡
              </span>
            )}
          </div>
        </div>
        {pyeong > 0 && (
          <p className="mt-3 text-sm text-[#9B9B9B] flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span>{pyeong}평은 약 {pyeongToSqm(pyeong)}㎡입니다</span>
          </p>
        )}
      </motion.div>

      {/* 방 개수 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-10"
      >
        <label className="block text-[#1F1F1F] font-bold text-lg mb-4">
          방 개수 <span className="text-[#B8956B] text-base font-normal">(자동 설정)</span>
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setRooms(Math.max(1, rooms - 1)); setIsRoomAuto(false); }}
            className="p-4 rounded-2xl border-2 border-[#E8E4DC] bg-white hover:border-[#B8956B] hover:bg-[#F7F3ED] hover:scale-110 transition-all active:scale-95"
            aria-label="방 개수 감소"
            type="button"
          >
            <Minus className="w-6 h-6 text-[#6B6B6B]" />
          </button>
          <div className="flex-1 text-center py-6 rounded-2xl border-2 border-[#B8956B] bg-gradient-to-br from-[#F7F3ED] to-[#E8E4DC] text-3xl font-bold text-[#1F1F1F] shadow-inner">
            {rooms}개
          </div>
          <button
            onClick={() => { setRooms(Math.min(6, rooms + 1)); setIsRoomAuto(false); }}
            className="p-4 rounded-2xl border-2 border-[#E8E4DC] bg-white hover:border-[#B8956B] hover:bg-[#F7F3ED] hover:scale-110 transition-all active:scale-95"
            aria-label="방 개수 증가"
            type="button"
          >
            <Plus className="w-6 h-6 text-[#6B6B6B]" />
          </button>
        </div>
        {isRoomAuto && pyeong > 0 && (
          <p className="mt-3 text-sm text-[#9B9B9B] flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span>{pyeong}평 기준으로 자동 설정되었어요</span>
          </p>
        )}
      </motion.div>

      {/* 화장실 개수 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-10"
      >
        <label className="block text-[#1F1F1F] font-bold text-lg mb-4">
          화장실 개수 <span className="text-[#B8956B] text-base font-normal">(자동 설정)</span>
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setBathrooms(Math.max(1, bathrooms - 1)); setIsBathroomAuto(false); }}
            className="p-4 rounded-2xl border-2 border-[#E8E4DC] bg-white hover:border-[#B8956B] hover:bg-[#F7F3ED] hover:scale-110 transition-all active:scale-95"
            aria-label="화장실 개수 감소"
            type="button"
          >
            <Minus className="w-6 h-6 text-[#6B6B6B]" />
          </button>
          <div className="flex-1 text-center py-6 rounded-2xl border-2 border-[#B8956B] bg-gradient-to-br from-[#F7F3ED] to-[#E8E4DC] text-3xl font-bold text-[#1F1F1F] shadow-inner">
            {bathrooms}개
          </div>
          <button
            onClick={() => { setBathrooms(Math.min(3, bathrooms + 1)); setIsBathroomAuto(false); }}
            className="p-4 rounded-2xl border-2 border-[#E8E4DC] bg-white hover:border-[#B8956B] hover:bg-[#F7F3ED] hover:scale-110 transition-all active:scale-95"
            aria-label="화장실 개수 증가"
            type="button"
          >
            <Plus className="w-6 h-6 text-[#6B6B6B]" />
          </button>
        </div>
        {isBathroomAuto && pyeong > 0 && (
          <p className="mt-3 text-sm text-[#9B9B9B] flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span>{pyeong}평 기준으로 자동 설정되었어요</span>
          </p>
        )}
      </motion.div>

      {/* 연령대 선택 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-10"
      >
        <label className="block text-[#1F1F1F] font-bold text-lg mb-4">
          연령대 <span className="text-[#B8956B] text-base font-normal">(선택, 여러 개 가능)</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {AGE_RANGES.map((age) => {
            const isSelected = ageRanges.includes(age.value);
            return (
              <button
                key={age.value}
                onClick={() => {
                  if (isSelected) {
                    setAgeRanges(ageRanges.filter(a => a !== age.value));
                  } else {
                    setAgeRanges([...ageRanges, age.value]);
                  }
                }}
                type="button"
                className={`
                  flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all font-semibold
                  ${isSelected
                    ? 'bg-[#B8956B] text-white border-[#B8956B] shadow-lg scale-105'
                    : 'bg-white text-[#1F1F1F] border-[#E8E4DC] hover:border-[#B8956B] hover:bg-[#F7F3ED] hover:scale-105'
                  }
                `}
              >
                <span className="text-xl">{age.icon}</span>
                <span className="text-base">{age.label}</span>
              </button>
            );
          })}
        </div>
        {ageRanges.length > 0 && (
          <p className="mt-3 text-sm text-[#B8956B] font-semibold flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>{ageRanges.length}개 선택됨</span>
          </p>
        )}
      </motion.div>

      {/* 가족수 선택 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        className="mb-10"
      >
        <label className="block text-[#1F1F1F] font-bold text-lg mb-4">
          가족수 <span className="text-[#B8956B] text-base font-normal">(선택)</span>
        </label>
        <div className="flex flex-wrap gap-3 mb-4">
          {FAMILY_SIZE_OPTIONS.map((option) => {
            const isSelected = familySizeRange === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setFamilySizeRange(option.value);
                  // 가족수 범위에 따라 totalPeople 설정
                  if (option.value === '1인') setTotalPeople(1);
                  else if (option.value === '2인') setTotalPeople(2);
                  else if (option.value === '3인') setTotalPeople(3);
                  else if (option.value === '4인') setTotalPeople(4);
                  else if (option.value === '5인 이상') setTotalPeople(5);
                }}
                type="button"
                className={`
                  px-5 py-3 rounded-xl border-2 text-base font-semibold transition-all
                  ${isSelected
                    ? 'bg-[#B8956B] text-white border-[#B8956B] shadow-lg scale-105'
                    : 'bg-white text-[#1F1F1F] border-[#E8E4DC] hover:border-[#B8956B] hover:bg-[#F7F3ED] hover:scale-105'
                  }
                `}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {/* 직접 입력 옵션 */}
        <div className="flex items-center justify-between p-4 bg-[#F7F3ED] rounded-xl">
          <span className="text-base text-[#6B6B6B] font-medium">또는 직접 입력:</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const newValue = Math.max(1, totalPeople - 1);
                setTotalPeople(newValue);
                // totalPeople에 따라 familySizeRange 자동 설정
                if (newValue === 1) setFamilySizeRange('1인');
                else if (newValue === 2) setFamilySizeRange('2인');
                else if (newValue === 3) setFamilySizeRange('3인');
                else if (newValue === 4) setFamilySizeRange('4인');
                else if (newValue >= 5) setFamilySizeRange('5인 이상');
              }}
              className="p-3 rounded-xl border-2 border-[#E8E4DC] bg-white hover:border-[#B8956B] hover:bg-[#F7F3ED] hover:scale-110 transition-all"
              type="button"
            >
              <Minus className="w-5 h-5 text-[#6B6B6B]" />
            </button>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={totalPeople || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : 0;
                  setTotalPeople(value);
                  // totalPeople에 따라 familySizeRange 자동 설정
                  if (value === 1) setFamilySizeRange('1인');
                  else if (value === 2) setFamilySizeRange('2인');
                  else if (value === 3) setFamilySizeRange('3인');
                  else if (value === 4) setFamilySizeRange('4인');
                  else if (value >= 5) setFamilySizeRange('5인 이상');
                }}
                placeholder="0"
                min="1"
                max="20"
                className="w-20 px-3 py-3 rounded-xl border-2 border-[#E8E4DC] 
                         bg-white text-[#1F1F1F] text-center text-lg font-bold
                         focus:outline-none focus:border-[#B8956B] focus:ring-4 focus:ring-[#B8956B]/20
                         transition-all"
              />
              <span className="text-base text-[#6B6B6B] font-semibold">명</span>
            </div>
            <button
              onClick={() => {
                const newValue = Math.min(20, totalPeople + 1);
                setTotalPeople(newValue);
                // totalPeople에 따라 familySizeRange 자동 설정
                if (newValue === 1) setFamilySizeRange('1인');
                else if (newValue === 2) setFamilySizeRange('2인');
                else if (newValue === 3) setFamilySizeRange('3인');
                else if (newValue === 4) setFamilySizeRange('4인');
                else if (newValue >= 5) setFamilySizeRange('5인 이상');
              }}
              className="p-3 rounded-xl border-2 border-[#E8E4DC] bg-white hover:border-[#B8956B] hover:bg-[#F7F3ED] hover:scale-110 transition-all"
              type="button"
            >
              <Plus className="w-5 h-5 text-[#6B6B6B]" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 생활특성 선택 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-10"
      >
        <label className="block text-[#1F1F1F] font-bold text-lg mb-4">
          생활특성 <span className="text-[#B8956B] text-base font-normal">(선택, 여러 개 가능)</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {LIFESTYLE_TAGS.map((tag) => {
            const isSelected = lifestyleTags.includes(tag.value);
            return (
              <button
                key={tag.value}
                onClick={() => {
                  if (isSelected) {
                    setLifestyleTags(lifestyleTags.filter(t => t !== tag.value));
                  } else {
                    setLifestyleTags([...lifestyleTags, tag.value]);
                  }
                }}
                type="button"
                className={`
                  flex items-center gap-3 p-4 rounded-2xl border-2 transition-all
                  ${isSelected
                    ? 'bg-[#B8956B] text-white border-[#B8956B] shadow-lg scale-105'
                    : 'bg-white text-[#1F1F1F] border-[#E8E4DC] hover:border-[#B8956B] hover:bg-[#F7F3ED] hover:scale-105'
                  }
                `}
              >
                <div className={`
                  w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0
                  ${isSelected 
                    ? 'bg-white border-white' 
                    : 'border-[#9B9B9B] bg-white'
                  }
                `}>
                  {isSelected && <Check className="w-4 h-4 text-[#B8956B]" strokeWidth={3} />}
                </div>
                <span className="text-xl">{tag.icon}</span>
                <span className="text-sm font-semibold flex-1 text-left">{tag.label}</span>
              </button>
            );
          })}
        </div>
        {lifestyleTags.length > 0 && (
          <p className="mt-3 text-sm text-[#B8956B] font-semibold flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>{lifestyleTags.length}개 선택됨</span>
          </p>
        )}
      </motion.div>

      {/* 추가 정보 입력 (고객이 입력한 내용을 분석 엔진에 반영) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.43 }}
        className="mb-12"
      >
        <label className="block text-[#1F1F1F] font-bold text-lg mb-4">
          추가로 알려주고 싶은 내용 <span className="text-[#B8956B] text-base font-normal">(선택)</span>
        </label>
        <textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="예: 2살 아기가 있어요, 강아지를 키우고 있어요, 재택근무를 자주 해요 등"
          rows={5}
          maxLength={500}
          className="w-full px-6 py-5 rounded-2xl border-2 border-[#E8E4DC] 
                   bg-white text-[#1F1F1F] text-base
                   focus:outline-none focus:border-[#B8956B] focus:ring-4 focus:ring-[#B8956B]/20
                   transition-all resize-none placeholder:text-[#D4D4D4]"
        />
        <div className="flex justify-between items-center mt-3">
          <p className="text-sm text-[#9B9B9B] flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span>입력하신 내용은 분석 엔진에 반영되어 더 정확한 추천을 받을 수 있어요</span>
          </p>
          <span className="text-sm text-[#B8956B] font-semibold">
            {additionalNotes.length}/500
          </span>
        </div>
      </motion.div>

      {/* 버튼 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
        className="flex gap-4 pb-8"
      >
        <button
          onClick={onBack}
          className="flex-1 py-5 px-6 rounded-2xl border-2 border-[#E8E4DC] 
                   text-[#1F1F1F] font-bold text-lg
                   hover:bg-[#F7F3ED] hover:border-[#B8956B] transition-all
                   flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" />
          뒤로
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading}
          className={`
            flex-1 py-5 px-6 rounded-2xl font-bold text-lg
            flex items-center justify-center gap-2
            transition-all shadow-xl
            ${isFormValid && !isLoading
              ? 'bg-gradient-to-r from-[#B8956B] to-[#A07D52] text-white hover:shadow-2xl hover:scale-105 active:scale-95'
              : 'bg-[#E8E4DC] text-[#9B9B9B] cursor-not-allowed'
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              잠시만요...
            </span>
          ) : (
            <>
              다음
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}




