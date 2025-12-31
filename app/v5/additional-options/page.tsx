'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type StoredData<T> = {
  schemaVersion: '5.0'
  createdAt: string
  data: T
}

const ADDITIONAL_OPTIONS = [
  {
    category: '냉난방',
    icon: '❄️',
    items: [
      { code: 'aircon_system', name: '시스템 에어컨', icon: '❄️', description: '천장 매립형' },
      { code: 'aircon_wall', name: '벽걸이 에어컨', icon: '🌬️', description: '벽면 설치형' },
      { code: 'aircon_stand', name: '스탠드 에어컨', icon: '🧊', description: '이동 가능형' },
    ]
  },
  {
    category: '빌트인 가전',
    icon: '🔌',
    items: [
      { code: 'dishwasher', name: '식기세척기', icon: '🍽️', description: '빌트인/프리스탠딩' },
      { code: 'builtin_oven', name: '빌트인 오븐', icon: '🔥', description: '빌트인 매립' },
      { code: 'builtin_purifier', name: '빌트인 정수기', icon: '💧', description: '냉온정' },
    ]
  },
  {
    category: '스마트홈',
    icon: '📱',
    items: [
      { code: 'smart_switch', name: '스마트 스위치', icon: '📱', description: 'IoT 연동' },
      { code: 'home_auto', name: '홈오토메이션', icon: '🏠', description: '통합 제어' },
    ]
  },
  {
    category: '부가서비스',
    icon: '🧹',
    items: [
      { code: 'cleaning', name: '입주청소', icon: '🧹', description: '전문 청소' },
    ]
  },
] as const;

export default function AdditionalOptionsPage() {
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const toggleOption = (code: string) => {
    setSelectedOptions(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const handleNext = () => {
    const toStore: StoredData<string[]> = {
      schemaVersion: '5.0',
      createdAt: new Date().toISOString(),
      data: selectedOptions,
    };
    localStorage.setItem('v5AdditionalOptions', JSON.stringify(toStore));
    router.push('/v5/options');
  };

  const handleSkip = () => {
    const toStore: StoredData<string[]> = {
      schemaVersion: '5.0',
      createdAt: new Date().toISOString(),
      data: [],
    };
    localStorage.setItem('v5AdditionalOptions', JSON.stringify(toStore));
    router.push('/v5/options');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">추가 옵션</h1>
        <p className="text-gray-600 mb-6">필요한 추가 항목을 선택하세요</p>

        {ADDITIONAL_OPTIONS.map((category) => (
          <div key={category.category} className="mb-6">
            <h2 className="text-lg font-semibold mb-3">
              {category.icon} {category.category}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {category.items.map((item) => (
                <button
                  key={item.code}
                  onClick={() => toggleOption(item.code)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedOptions.includes(item.code)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.description}</div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="flex gap-3 mt-8">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 border border-gray-300 rounded-lg"
          >
            건너뛰기
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}


