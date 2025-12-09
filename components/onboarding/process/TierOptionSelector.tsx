'use client';

import { useState } from 'react';
import type { ProcessDefinition, OptionTier } from '@/types/process-options';

interface TierOptionSelectorProps {
  process: ProcessDefinition;
  selectedTier: OptionTier;
  onTierChange: (tier: OptionTier) => void;
  disabled?: boolean;
}

// 티어 라벨
const TIER_LABELS: Record<OptionTier, string> = {
  basic: '필요한 만큼',
  comfort: '생활이 편하게',
  premium: '아쉬움 없이',
};

// 공통 서브텍스트
const COMMON_SUB_TEXT: Record<'basic' | 'comfort', string> = {
  basic: '망가진 곳·보기 싫은 곳만 정리해요',
  comfort: '동선·수납·조명까지 지금보다 편하게 바꿔요',
};

// 공정별 premium 서브텍스트
const PREMIUM_SUB_TEXT: Record<string, string> = {
  finish: '도장 느낌의 고급 벽지와 천연 텍스처 마루로, 갤러리 같은 공간감',
  electric: '손가락 하나로 제어하는 IoT 시스템과 마그네틱 조명으로 무드 완성',
  kitchen: '블룸(Blum) 하드웨어와 엔지니어드 스톤, 셰프가 꿈꾸던 럭셔리 키친',
  bathroom: '600각 포세린 타일과 플리킷 시공, 5성급 호텔 욕실 그대로',
  door_window: '단열 1등급 시스템 창호와 히든 도어, 디자인과 성능의 정점',
  furniture: 'EO 친환경 자재와 독일산 하드웨어, 1mm 오차 없는 완벽한 맞춤',
  balcony: '프리미엄 세라믹 코트와 타일 마감, 창고가 아닌 또 하나의 휴식 공간',
  entrance: '프리미엄 자동 중문과 히든 센서, 들어서는 순간부터 다른 느낌',
  demolition: '선택한 공정에 맞춰 정밀하게',
  film: '프리미엄 브랜드 필름과 전문 시공',
};

// 공정별 가격 데이터 (임시 하드코딩)
const PROCESS_PRICES: Record<string, Record<OptionTier, string>> = {
  finish: { basic: '기준', comfort: '+100~150만', premium: '+300~350만' },
  electric: { basic: '기준', comfort: '+50~80만', premium: '+180~220만' },
  kitchen: { basic: '기준', comfort: '+200~300만', premium: '+550~650만' },
  bathroom: { basic: '기준', comfort: '+150~250만', premium: '+400~450만' },
  door_window: { basic: '기준', comfort: '+80~120만', premium: '+250~300만' },
  furniture: { basic: '기준', comfort: '+150~250만', premium: '+400~450만' },
  balcony: { basic: '기준', comfort: '+50~80만', premium: '+150~180만' },
  entrance: { basic: '기준', comfort: '+30~50만', premium: '+100~130만' },
  demolition: { basic: '기준', comfort: '+0', premium: '+0' },
  film: { basic: '기준', comfort: '+30~50만', premium: '+80~100만' },
};

// 추천 공정 (⭐ 배지 표시)
const RECOMMENDED_PROCESSES = ['finish', 'electric', 'kitchen', 'bathroom'];

export default function TierOptionSelector({
  process,
  selectedTier,
  onTierChange,
  disabled = false,
}: TierOptionSelectorProps) {
  const [showAllItems, setShowAllItems] = useState(false);
  
  const isRecommended = RECOMMENDED_PROCESSES.includes(process.id);
  const prices = PROCESS_PRICES[process.id] || PROCESS_PRICES.finish;
  
  // 서브텍스트 가져오기
  const getSubText = (tier: OptionTier): string => {
    if (tier === 'premium') {
      return PREMIUM_SUB_TEXT[process.id] || '최고급 자재와 시공으로 완성도를 높여요';
    }
    return COMMON_SUB_TEXT[tier] || '';
  };

  // 선택된 티어까지의 모든 항목 가져오기
  const getItemsUpToTier = (tier: OptionTier) => {
    const items = [...process.tierOptions.basic];
    if (tier === 'basic') return items;
    
    items.push(...process.tierOptions.comfort);
    if (tier === 'comfort') return items;
    
    items.push(...process.tierOptions.premium);
    return items;
  };

  // 해당 티어에서 추가되는 항목만 가져오기
  const getTierItems = (tier: OptionTier) => {
    if (tier === 'basic') return process.tierOptions.basic;
    if (tier === 'comfort') return process.tierOptions.comfort;
    if (tier === 'premium') return process.tierOptions.premium;
    return [];
  };

  const currentItems = getItemsUpToTier(selectedTier);
  const currentTierItems = getTierItems(selectedTier);

  return (
    <div className={`border rounded-xl p-5 bg-white shadow-sm ${disabled ? 'opacity-50' : ''}`}>
      {/* 공정 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{process.name}</h3>
            {isRecommended && (
              <span className="px-2 py-0.5 bg-argen-100 text-argen-500 text-xs font-medium rounded">
                ⭐ 추천
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{process.description}</p>
        </div>
      </div>

      {/* 3단계 카드 */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {(['basic', 'comfort', 'premium'] as OptionTier[]).map((tier) => (
          <button
            key={tier}
            onClick={() => !disabled && onTierChange(tier)}
            disabled={disabled}
            className={`
              p-3 rounded-lg border-2 transition-all duration-200
              ${selectedTier === tier 
                ? 'border-argen-500 bg-argen-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="text-center">
              <div className={`
                text-sm font-bold mb-1
                ${selectedTier === tier ? 'text-argen-600' : 'text-gray-700'}
              `}>
                {TIER_LABELS[tier]}
              </div>
              <div className={`
                text-xs
                ${selectedTier === tier ? 'text-argen-500' : 'text-gray-500'}
              `}>
                {prices[tier]}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 선택된 티어 설명 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-700 mb-3">
          {getSubText(selectedTier)}
        </p>

        {/* 가격 표시 */}
        {selectedTier !== 'basic' && (
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">
                💰 기본 대비 {prices[selectedTier]}
              </span>
            </div>
          </div>
        )}

        {/* 이렇게 달라져요 - 티어별 누적 표시 */}
        <div className="space-y-3">
          {/* 📦 필요한 만큼 (항상 표시) */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <span>📦</span>
              <span>필요한 만큼</span>
              <span className="text-gray-400 font-normal">(기본 포함)</span>
            </p>
            <div className="flex flex-wrap gap-1">
              {process.tierOptions.basic.slice(0, 5).map((item) => (
                <span key={item.id} className="text-xs text-gray-600">
                  • {item.name}
                </span>
              ))}
              {process.tierOptions.basic.length > 5 && (
                <span className="text-xs text-gray-400">
                  외 {process.tierOptions.basic.length - 5}개
                </span>
              )}
            </div>
          </div>

          {/* ➕ 생활이 편하게 (comfort 이상 선택 시) */}
          {(selectedTier === 'comfort' || selectedTier === 'premium') && process.tierOptions.comfort.length > 0 && (
            <div className="bg-argen-50 rounded-lg p-3 border border-argen-200">
              <p className="text-xs font-semibold text-argen-600 mb-2 flex items-center gap-1">
                <span>➕</span>
                <span>생활이 편하게</span>
                <span className="text-blue-400 font-normal">(추가)</span>
              </p>
              <div className="flex flex-wrap gap-1">
                {process.tierOptions.comfort.map((item) => (
                  <span key={item.id} className="text-xs text-argen-500">
                    • {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ➕ 아쉬움 없이 (premium 선택 시) */}
          {selectedTier === 'premium' && process.tierOptions.premium.length > 0 && (
            <div className="bg-argen-50 rounded-lg p-3 border border-argen-200">
              <p className="text-xs font-semibold text-argen-600 mb-2 flex items-center gap-1">
                <span>➕</span>
                <span>아쉬움 없이</span>
                <span className="text-argen-400 font-normal">(추가)</span>
              </p>
              <div className="flex flex-wrap gap-1">
                {process.tierOptions.premium.map((item) => (
                  <span key={item.id} className="text-xs text-argen-500">
                    • {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 안내 문구 (comfort 선택 시) */}
        {selectedTier === 'comfort' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-argen-500 flex items-center gap-1">
              <span>ℹ️</span>
              <span className="font-medium">가장 많이 선택하는 조합이에요</span>
            </p>
          </div>
        )}
      </div>

      {/* 전체 항목 보기 버튼 */}
      <button
        onClick={() => setShowAllItems(!showAllItems)}
        className="w-full py-2 text-sm text-argen-500 hover:text-argen-600 font-medium transition-colors flex items-center justify-center gap-1"
      >
        <span>{showAllItems ? '접기' : '전체 항목 보기'}</span>
        <span>{showAllItems ? '▲' : '▼'}</span>
      </button>

      {/* 전체 항목 목록 (티어별 그룹핑) */}
      {showAllItems && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {/* 기본 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                필요한 만큼
              </span>
              <span className="text-xs text-gray-500">기준</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {process.tierOptions.basic.map((item) => (
                <div
                  key={item.id}
                  className="text-xs bg-gray-50 px-2 py-1.5 rounded text-gray-700 border border-gray-200"
                >
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          {/* 편하게 */}
          {process.tierOptions.comfort.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-argen-100 text-argen-600 text-xs font-semibold rounded">
                  생활이 편하게
                </span>
                <span className="text-xs text-gray-500">{prices.comfort}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {process.tierOptions.comfort.map((item) => (
                  <div
                    key={item.id}
                    className="text-xs bg-argen-50 px-2 py-1.5 rounded text-argen-600 border border-argen-200"
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 프리미엄 */}
          {process.tierOptions.premium.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-argen-100 text-argen-600 text-xs font-semibold rounded">
                  아쉬움 없이
                </span>
                <span className="text-xs text-gray-500">{prices.premium}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {process.tierOptions.premium.map((item) => (
                  <div
                    key={item.id}
                    className="text-xs bg-argen-50 px-2 py-1.5 rounded text-argen-600 border border-argen-200"
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
