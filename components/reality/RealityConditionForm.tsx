'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Minus, Plus } from 'lucide-react';
import { useSpaceInfoStore, type HousingTypeLabel } from '@/lib/store/spaceInfoStore';

interface RealityConditionFormProps {
  onComplete: () => void;
  onBack?: () => void;
}

// 평수별 기본 구성
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
};

// 인기 평수
const POPULAR_PYEONG = [20, 25, 32, 40];

// 주거형태 옵션
const HOUSING_TYPES: { value: HousingTypeLabel; label: string; icon: string }[] = [
  { value: '아파트', label: '아파트', icon: '🏢' },
  { value: '빌라', label: '빌라', icon: '🏘️' },
  { value: '오피스텔', label: '오피스텔', icon: '🏙️' },
  { value: '단독주택', label: '단독주택', icon: '🏠' },
];

// 평수 → ㎡
const pyeongToSqm = (pyeong: number): number => {
  return Math.round(pyeong * 3.3058 * 10) / 10;
};

// 가장 가까운 기본 구성 찾기
const getDefaultConfig = (pyeong: number): { rooms: number; bathrooms: number } => {
  const keys = Object.keys(PYEONG_CONFIG).map(Number).sort((a, b) => a - b);
  let closest = keys[0];
  for (const key of keys) {
    if (Math.abs(key - pyeong) < Math.abs(closest - pyeong)) {
      closest = key;
    }
  }
  return PYEONG_CONFIG[closest] || { rooms: 3, bathrooms: 2 };
};

export default function RealityConditionForm({ onComplete, onBack }: RealityConditionFormProps) {
  const { updateSpaceInfo } = useSpaceInfoStore();
  
  const [housingType, setHousingType] = useState<HousingTypeLabel>('아파트');
  const [pyeong, setPyeong] = useState<number>(32);
  const [rooms, setRooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [isRoomAuto, setIsRoomAuto] = useState<boolean>(true);
  const [isBathroomAuto, setIsBathroomAuto] = useState<boolean>(true);

  // 평수 변경 시 자동 업데이트
  useEffect(() => {
    if (pyeong > 0) {
      const config = getDefaultConfig(pyeong);
      if (isRoomAuto) setRooms(config.rooms);
      if (isBathroomAuto) setBathrooms(config.bathrooms);
    }
  }, [pyeong, isRoomAuto, isBathroomAuto]);

  const handleSubmit = () => {
    if (!isFormValid) return;
    
    updateSpaceInfo({
      housingType,
      pyeong,
      squareMeter: pyeongToSqm(pyeong),
      rooms,
      bathrooms,
      inputMethod: 'exact',
      isRoomAuto,
      isBathroomAuto,
    });

    onComplete();
  };

  const isFormValid = pyeong > 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F7F3ED] to-[#E8E4DC] mb-4">
          <Home className="w-8 h-8 text-[#4A3D33]" />
        </div>
        <h1 className="text-3xl font-bold text-[#1F1F1F] mb-2">집 정보 입력</h1>
        <p className="text-[#6B6B6B]">정확한 견적을 위해 필요해요</p>
      </motion.div>

      {/* 주거형태 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="block text-[#1F1F1F] font-bold text-lg mb-3">
          주거형태
        </label>
        <div className="grid grid-cols-2 gap-3">
          {HOUSING_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setHousingType(type.value)}
              type="button"
              className={`
                p-4 rounded-xl border-2 transition-all font-semibold
                flex items-center gap-3
                ${
                  housingType === type.value
                    ? 'bg-[#4A3D33] text-white border-[#4A3D33] shadow-lg'
                    : 'bg-white text-[#1F1F1F] border-[#E8E0D5] hover:border-[#4A3D33] hover:bg-[#F7F3ED]'
                }
              `}
            >
              <span className="text-2xl">{type.icon}</span>
              <span className="text-base">{type.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* 평수 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-[#1F1F1F] font-bold text-lg mb-3">
          평수 <span className="text-[#9B8C7A] text-sm font-normal">(필수)</span>
        </label>
        
        {/* 빠른 선택 */}
        <div className="flex gap-3 mb-3">
          {POPULAR_PYEONG.map((popularPyeong) => (
            <button
              key={popularPyeong}
              onClick={() => setPyeong(popularPyeong)}
              type="button"
              className={`
                flex-1 px-4 py-3 rounded-xl text-base font-semibold transition-all
                ${
                  pyeong === popularPyeong
                    ? 'bg-[#4A3D33] text-white shadow-lg'
                    : 'bg-[#F7F3ED] text-[#6B6B6B] hover:bg-[#E8E0D5]'
                }
              `}
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
            onChange={(e) => setPyeong(e.target.value ? Number(e.target.value) : 0)}
            placeholder="또는 직접 입력"
            min="1"
            max="200"
            className="w-full px-5 py-4 rounded-xl border-2 border-[#E8E0D5] 
                     bg-white text-[#1F1F1F] text-lg font-semibold
                     focus:outline-none focus:border-[#4A3D33] focus:ring-4 focus:ring-[#4A3D33]/20
                     transition-all placeholder:text-[#D4D4D4] placeholder:font-normal"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-[#6B6B6B] font-bold">평</span>
            {pyeong > 0 && (
              <span className="text-[#4A3D33] text-sm bg-[#F7F3ED] px-2 py-1 rounded-lg font-semibold">
                {pyeongToSqm(pyeong)}㎡
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* 방 개수 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label className="block text-[#1F1F1F] font-bold text-lg mb-3">
          방 개수 <span className="text-[#9B8C7A] text-sm font-normal">(자동 설정)</span>
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setRooms(Math.max(1, rooms - 1)); setIsRoomAuto(false); }}
            className="p-3 rounded-xl border-2 border-[#E8E0D5] bg-white hover:border-[#4A3D33] hover:bg-[#F7F3ED] transition-all"
            type="button"
          >
            <Minus className="w-5 h-5 text-[#6B6B6B]" />
          </button>
          <div className="flex-1 text-center py-5 rounded-xl border-2 border-[#4A3D33] bg-[#F7F3ED] text-2xl font-bold text-[#1F1F1F]">
            {rooms}개
          </div>
          <button
            onClick={() => { setRooms(Math.min(6, rooms + 1)); setIsRoomAuto(false); }}
            className="p-3 rounded-xl border-2 border-[#E8E0D5] bg-white hover:border-[#4A3D33] hover:bg-[#F7F3ED] transition-all"
            type="button"
          >
            <Plus className="w-5 h-5 text-[#6B6B6B]" />
          </button>
        </div>
      </motion.div>

      {/* 화장실 개수 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <label className="block text-[#1F1F1F] font-bold text-lg mb-3">
          화장실 개수 <span className="text-[#9B8C7A] text-sm font-normal">(자동 설정)</span>
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setBathrooms(Math.max(1, bathrooms - 1)); setIsBathroomAuto(false); }}
            className="p-3 rounded-xl border-2 border-[#E8E0D5] bg-white hover:border-[#4A3D33] hover:bg-[#F7F3ED] transition-all"
            type="button"
          >
            <Minus className="w-5 h-5 text-[#6B6B6B]" />
          </button>
          <div className="flex-1 text-center py-5 rounded-xl border-2 border-[#4A3D33] bg-[#F7F3ED] text-2xl font-bold text-[#1F1F1F]">
            {bathrooms}개
          </div>
          <button
            onClick={() => { setBathrooms(Math.min(3, bathrooms + 1)); setIsBathroomAuto(false); }}
            className="p-3 rounded-xl border-2 border-[#E8E0D5] bg-white hover:border-[#4A3D33] hover:bg-[#F7F3ED] transition-all"
            type="button"
          >
            <Plus className="w-5 h-5 text-[#6B6B6B]" />
          </button>
        </div>
      </motion.div>

      {/* 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-3 pt-4"
      >
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl border-2 border-[#E8E0D5] text-[#1F1F1F] font-semibold hover:bg-[#F7F3ED] transition-all"
          >
            이전
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`
            flex-1 px-8 py-3 rounded-xl font-semibold transition-all
            ${
              isFormValid
                ? 'bg-[#4A3D33] text-white hover:bg-[#3A2D23] shadow-lg'
                : 'bg-[#E8E0D5] text-[#9B8C7A] cursor-not-allowed'
            }
          `}
        >
          다음 단계
        </button>
      </motion.div>
    </div>
  );
}
