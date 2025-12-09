'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PROCESS_DEFINITIONS } from '@/constants/process-definitions';
import TierOptionSelector from '@/components/onboarding/process/TierOptionSelector';
import type { OptionTier } from '@/types/process-options';
import { useProcessStore } from '@/lib/store/processStore';
import { useScopeStore } from '@/lib/store/scopeStore';
import StepIndicator, { type Step } from '@/components/onboarding/StepIndicator';

// 6단계 정의
const STEPS: Step[] = [
  { number: 1, label: '집 정보', description: '공간 정보 입력' },
  { number: 2, label: '성향 분석', description: '취향 파악' },
  { number: 3, label: '공사 범위', description: '공사 범위' },
  { number: 4, label: '공정 선택', description: '세부 공정' },
  { number: 5, label: 'AI 추천', description: '맞춤 제안' },
  { number: 6, label: '견적 확인', description: '최종 확인' },
];

export default function ProcessNewPage() {
  const router = useRouter();
  
  // Zustand 스토어에서 상태 가져오기
  const tierSelections = useProcessStore(state => state.tierSelections);
  const setTierSelection = useProcessStore(state => state.setTierSelection);
  const setAllTierSelections = useProcessStore(state => state.setAllTierSelections);
  
  // 선택된 공간 정보 가져오기
  const { selectedSpaces } = useScopeStore();
  const activeSpaceIds = useMemo(() => {
    return selectedSpaces.filter(s => s.isSelected).map(s => s.id);
  }, [selectedSpaces]);
  
  // 선택된 공간에 맞는 공정만 필터링
  const filteredProcesses = useMemo(() => {
    // 전체 공간 선택 시 모든 공정 표시
    const totalSpaces = selectedSpaces.length;
    const selectedSpaceCount = activeSpaceIds.length;
    
    if (selectedSpaceCount === totalSpaces) {
      // 전체 선택 시 모든 공정 활성화
      return PROCESS_DEFINITIONS;
    }
    
    if (activeSpaceIds.length === 0) {
      // 공간이 선택되지 않았으면 모든 공정 표시
      return PROCESS_DEFINITIONS;
    }
    
    return PROCESS_DEFINITIONS.filter(process => {
      // 철거는 항상 표시
      if (process.id === 'demolition') return true;
      
      // applicableSpaces가 'all'이면 항상 표시
      if (process.applicableSpaces.includes('all')) return true;
      
      // 선택된 공간과 공정의 applicableSpaces가 겹치는지 확인
      const hasMatchingSpace = process.applicableSpaces.some(space => 
        activeSpaceIds.includes(space as any)
      );
      
      return hasMatchingSpace;
    });
  }, [activeSpaceIds, selectedSpaces]);
  
  // 전체 선택 시 모든 공정 자동 활성화
  useEffect(() => {
    const totalSpaces = selectedSpaces.length;
    const selectedSpaceCount = activeSpaceIds.length;
    
    if (selectedSpaceCount === totalSpaces && totalSpaces > 0) {
      // 전체 선택 시 모든 공정(철거 제외) 활성화
      const allEnabled: Record<string, { enabled: boolean; tier: OptionTier }> = {};
      PROCESS_DEFINITIONS.forEach(process => {
        allEnabled[process.id] = {
          enabled: process.id !== 'demolition', // 철거는 자동 연동
          tier: tierSelections[process.id]?.tier || 'comfort',
        };
      });
      setAllTierSelections(allEnabled);
    }
  }, [activeSpaceIds.length, selectedSpaces.length]);
  
  // 로컬 상태 대신 스토어 사용
  const selections = tierSelections;

  // 공정 활성화/비활성화 토글
  const toggleProcess = (processId: string) => {
    if (processId === 'demolition') return; // 철거는 토글 불가
    
    const current = selections[processId];
    setTierSelection(processId, {
      ...current,
      enabled: !current.enabled,
    });
  };

  // 티어 변경
  const changeTier = (processId: string, tier: OptionTier) => {
    const current = selections[processId];
    setTierSelection(processId, {
      ...current,
      tier,
    });
  };

  // 활성화된 공정 수 (필터링된 공정 중에서)
  const enabledCount = Object.entries(selections)
    .filter(([id]) => filteredProcesses.some(p => p.id === id))
    .filter(([_, selection]) => selection.enabled)
    .length;

  // 철거 연동 공정 계산 (필터링된 공정 중에서)
  const demolitionLinkedProcesses = filteredProcesses
    .filter(p => p.autoDemolition && selections[p.id]?.enabled)
    .map(p => p.name);

  // 저장 및 다음 단계
  const handleNext = () => {
    console.log('선택된 공정:', selections);
    console.log('스토어에 저장됨');
    router.push('/onboarding/ai-recommendation');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 6단계 진행 표시 */}
      <StepIndicator currentStep={4} steps={STEPS} />
      
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Step 4</p>
              <h1 className="text-xl font-bold">공정 선택</h1>
              {activeSpaceIds.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  선택한 공간: {selectedSpaces.filter(s => s.isSelected).map(s => s.name).join(', ')}
                </p>
              )}
            </div>
            <span className="text-sm text-gray-600">
              {enabledCount}개 공정 선택됨
            </span>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* 공간 선택 안내 */}
        {activeSpaceIds.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              ⚠️ 공간 범위가 선택되지 않았습니다. 모든 공정이 표시됩니다.
            </p>
          </div>
        )}

        {/* 필터링 안내 */}
        {activeSpaceIds.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              ✓ 선택한 공간에 필요한 {filteredProcesses.length}개 공정만 표시됩니다.
            </p>
          </div>
        )}

        {/* 안내 문구 */}
        <div className="bg-argen-50 border border-argen-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            각 공정별로 <strong>필요한 만큼 / 생활이 편하게 / 아쉬움 없이</strong> 중 원하는 수준을 선택하세요.
            <br />
            철거는 선택한 공정에 따라 자동으로 연동됩니다.
          </p>
        </div>

        {/* 철거 연동 표시 */}
        {demolitionLinkedProcesses.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-amber-800 mb-1">🔨 철거 자동 연동</p>
            <p className="text-sm text-amber-700">
              {demolitionLinkedProcesses.join(', ')} 공정에 따른 철거가 자동 포함됩니다.
            </p>
          </div>
        )}

        {/* 공정 목록 */}
        <div className="space-y-4">
          {filteredProcesses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">선택한 공간에 해당하는 공정이 없습니다.</p>
            </div>
          ) : (
            filteredProcesses.map(process => {
              // 철거는 별도 표시
              if (process.id === 'demolition') {
                return (
                  <div 
                    key={process.id}
                    className="border rounded-lg p-4 bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔨</span>
                      <div>
                        <h3 className="font-semibold">{process.name}</h3>
                        <p className="text-sm text-gray-500">
                          선택한 공정에 따라 자동 연동됩니다
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              const selection = selections[process.id];
              
              return (
                <div key={process.id} className="relative">
                  {/* 활성화 토글 */}
                  <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1">
                    <button
                      onClick={() => toggleProcess(process.id)}
                      className={`
                        w-12 h-6 rounded-full transition-colors duration-200
                        ${selection.enabled ? 'bg-argen-500' : 'bg-gray-300'}
                      `}
                    >
                      <span 
                        className={`
                          block w-5 h-5 bg-white rounded-full shadow transform transition-transform
                          ${selection.enabled ? 'translate-x-6' : 'translate-x-0.5'}
                        `}
                      />
                    </button>
                    <span className="text-xs text-gray-500">
                      {selection.enabled ? '이번 공사에 포함 ✓' : '이번엔 안 해요'}
                    </span>
                  </div>

                  {/* 티어 선택기 */}
                  <div className={selection.enabled ? '' : 'opacity-50'}>
                    <TierOptionSelector
                      process={process}
                      selectedTier={selection.tier}
                      onTierChange={(tier) => changeTier(process.id, tier)}
                      disabled={!selection.enabled}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleNext}
            className="w-full py-3 bg-argen-500 text-white font-semibold rounded-lg hover:bg-argen-600 transition-colors"
          >
            AI 종합 분석 받기 →
          </button>
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-24" />
    </div>
  );
}

