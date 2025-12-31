'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore';

interface SpaceInfoFormProps {
  onComplete: () => void;
  onBack: () => void;
}

const HOUSING_TYPES = [
  { key: 'apartment', label: '아파트', icon: '🏢' },
  { key: 'villa', label: '빌라', icon: '🏘️' },
  { key: 'house', label: '단독주택', icon: '🏠' },
  { key: 'officetel', label: '오피스텔', icon: '🏬' },
] as const;

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
  
  const [housingType, setHousingType] = useState<string>('아파트');
  const [pyeong, setPyeong] = useState<number>(32);
  const [rooms, setRooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [isRoomAuto, setIsRoomAuto] = useState<boolean>(true);
  const [isBathroomAuto, setIsBathroomAuto] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    
    // Store에 저장
    updateSpaceInfo({
      housingType: housingType as any,
      pyeong: pyeong,
      squareMeter: pyeongToSqm(pyeong),
      rooms: rooms,
      bathrooms: bathrooms,
      inputMethod: 'exact',
      isRoomAuto: isRoomAuto,
      isBathroomAuto: isBathroomAuto,
    });

    // 약간의 딜레이 후 다음 스텝으로 (UX용)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsLoading(false);
    onComplete();  // 다음 스텝(mood)으로 이동
  };

  const isFormValid = housingType && pyeong > 0;

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* 헤더 */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1F1F1F] mb-4">
          집 정보를 알려주세요
        </h1>
        <p className="text-lg text-[#6B6B6B]">
          더 정확한 견적을 위해 필요해요
        </p>
      </div>

      {/* 주거 형태 */}
      <div className="mb-8">
        <label className="block text-[#1F1F1F] font-semibold mb-4">
          주거 형태
        </label>
        <div className="grid grid-cols-2 gap-3">
          {HOUSING_TYPES.map((type) => (
            <motion.button
              key={type.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setHousingType(type.label)}
              className={`
                p-4 rounded-2xl border-2 transition-all
                ${housingType === type.label
                  ? 'border-[#B8956B] bg-[#F7F3ED]'
                  : 'border-[#E8E4DC] bg-white hover:border-[#B8956B]/50'
                }
              `}
            >
              <span className="text-3xl mb-2 block">{type.icon}</span>
              <span className="text-[#1F1F1F] font-medium">{type.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 평수 */}
      <div className="mb-8">
        <label className="block text-[#1F1F1F] font-semibold mb-3">
          평수 <span className="text-[#9B9B9B] font-normal">(필수)</span>
        </label>
        <div className="relative">
          <input
            type="number"
            value={pyeong || ''}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : 0;
              setPyeong(value);
            }}
            placeholder="예: 25"
            className="w-full px-6 py-4 rounded-xl border-2 border-[#E8E4DC] 
                     bg-white text-[#1F1F1F] text-lg
                     focus:outline-none focus:border-[#B8956B] focus:ring-2 focus:ring-[#B8956B]/10
                     transition-all"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-[#9B9B9B]">평</span>
            {pyeong > 0 && (
              <span className="text-[#9B9B9B] text-sm">
                ({pyeongToSqm(pyeong)}㎡)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 방 개수 */}
      <div className="mb-8">
        <label className="block text-[#1F1F1F] font-semibold mb-3">
          방 개수 <span className="text-[#9B9B9B] font-normal">(자동 설정)</span>
        </label>
        <select
          value={rooms}
          onChange={(e) => {
            setRooms(Number(e.target.value));
            setIsRoomAuto(false);
          }}
          className="w-full px-6 py-4 rounded-xl border-2 border-[#E8E4DC] 
                   bg-white text-[#1F1F1F] text-lg
                   focus:outline-none focus:border-[#B8956B] focus:ring-2 focus:ring-[#B8956B]/10
                   transition-all"
        >
          {[1, 2, 3, 4, 5, 6].map(n => (
            <option key={n} value={n}>{n}개</option>
          ))}
        </select>
        {isRoomAuto && pyeong > 0 && (
          <p className="mt-2 text-sm text-[#9B9B9B]">
            💡 {pyeong}평 기준으로 자동 설정되었어요
          </p>
        )}
      </div>

      {/* 화장실 개수 */}
      <div className="mb-10">
        <label className="block text-[#1F1F1F] font-semibold mb-3">
          화장실 개수 <span className="text-[#9B9B9B] font-normal">(자동 설정)</span>
        </label>
        <select
          value={bathrooms}
          onChange={(e) => {
            setBathrooms(Number(e.target.value));
            setIsBathroomAuto(false);
          }}
          className="w-full px-6 py-4 rounded-xl border-2 border-[#E8E4DC] 
                   bg-white text-[#1F1F1F] text-lg
                   focus:outline-none focus:border-[#B8956B] focus:ring-2 focus:ring-[#B8956B]/10
                   transition-all"
        >
          {[1, 2, 3].map(n => (
            <option key={n} value={n}>{n}개</option>
          ))}
        </select>
        {isBathroomAuto && pyeong > 0 && (
          <p className="mt-2 text-sm text-[#9B9B9B]">
            💡 {pyeong}평 기준으로 자동 설정되었어요
          </p>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 py-4 px-6 rounded-xl border-2 border-[#E8E4DC] 
                   text-[#1F1F1F] font-semibold
                   hover:bg-[#F7F3ED] transition-all
                   flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          뒤로
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading}
          className={`
            flex-1 py-4 px-6 rounded-xl font-semibold
            flex items-center justify-center gap-2
            transition-all
            ${isFormValid && !isLoading
              ? 'bg-[#1F1F1F] text-white hover:bg-[#333]'
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
      </div>
    </div>
  );
}




