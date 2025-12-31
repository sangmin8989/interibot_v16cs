'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PROCESS_DEFINITIONS } from '@/constants/process-definitions';
import TierOptionSelector from '@/components/onboarding/process/TierOptionSelector';
import type { OptionTier } from '@/types/process-options';
import { useProcessStore, type ProcessMode } from '@/lib/store/processStore';
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
  
  // ✅ 헌법 적용: 전체/부분 공정 모드 상태
  const { processMode, setProcessMode } = useProcessStore();
  
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
    
    // TODO: ProcessOption 타입으로 전환 시 applicableSpaces 로직 재구현 필요
    // 현재는 모든 공정을 표시 (하위 호환성)
    return PROCESS_DEFINITIONS.filter(process => {
      // 철거는 항상 표시
      if (process.id === 'DEMOLITION') return true;
      
      // ProcessOption에는 applicableSpaces가 없으므로 일단 모든 공정 표시
      // 향후 SSOT에 applicableSpaces 추가 또는 별도 매핑 필요
      return true;
    });
  }, [activeSpaceIds, selectedSpaces]);
  
  // ✅ 헌법 적용: tierSelections 제거 - processSelections만 사용
  // TODO: 전체/부분 공정 모드 선택 UI 추가 시 이 로직 재구현

  // ✅ 헌법 적용: tierSelections 제거 - processSelections 기반으로 재구현 필요
  // TODO: processSelections 기반 공정 활성화/비활성화 로직 재구현
  const toggleProcess = (processId: string) => {
    // TODO: processSelections 기반으로 재구현
    console.warn('tierSelections 제거됨 - processSelections 기반으로 재구현 필요')
  };

  const changeTier = (processId: string, tier: OptionTier) => {
    // TODO: processSelections 기반으로 재구현
    console.warn('tierSelections 제거됨 - processSelections 기반으로 재구현 필요')
  };

  // TODO: processSelections 기반으로 재구현
  const enabledCount = 0;
  const demolitionLinkedProcesses: string[] = [];
  
  // ✅ 임시: selections 객체 생성 (빌드 에러 해결용)
  // TODO: processSelections 기반으로 제대로 재구현 필요
  const selections: Record<string, { enabled: boolean; tier: OptionTier }> = useMemo(() => {
    const result: Record<string, { enabled: boolean; tier: OptionTier }> = {};
    PROCESS_DEFINITIONS.forEach(process => {
      result[process.id] = {
        enabled: process.id !== 'DEMOLITION', // 철거는 기본 비활성화
        tier: 'comfort' as OptionTier, // 기본값
      };
    });
    return result;
  }, []);

  // 저장 및 다음 단계
  const handleNext = () => {
    // ✅ 헌법 적용: processSelections 기반으로 재구현 필요
    console.log('processSelections 기반으로 재구현 필요');
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
        {/* ✅ 헌법 5-2: 전체/부분 공정 모드 선택 (명시적 선택만) */}
        <div className="bg-gradient-to-r from-purple-50 to-argen-50 border-2 border-argen-300 rounded-xl p-5 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            🏗️ 공정 범위 선택
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            원하시는 공사 범위를 선택해주세요. 선택에 따라 견적이 달라집니다.
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {/* 전체 공정 */}
            <button
              type="button"
              onClick={() => setProcessMode('FULL')}
              className={`p-4 rounded-xl border-2 transition-all ${
                processMode === 'FULL'
                  ? 'border-argen-500 bg-argen-100 ring-2 ring-argen-300'
                  : 'border-gray-200 bg-white hover:border-argen-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏠</span>
                <span className="font-bold text-gray-900">전체 공정</span>
              </div>
              <p className="text-xs text-gray-600 text-left">
                집 전체를 새것처럼!<br />
                철거부터 마감까지 모든 공정 포함
              </p>
              {processMode === 'FULL' && (
                <div className="mt-2 text-xs text-argen-600 font-medium">
                  ✓ 선택됨
                </div>
              )}
            </button>
            
            {/* 부분 공정 */}
            <button
              type="button"
              onClick={() => setProcessMode('PARTIAL')}
              className={`p-4 rounded-xl border-2 transition-all ${
                processMode === 'PARTIAL'
                  ? 'border-argen-500 bg-argen-100 ring-2 ring-argen-300'
                  : 'border-gray-200 bg-white hover:border-argen-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🔧</span>
                <span className="font-bold text-gray-900">부분 공정</span>
              </div>
              <p className="text-xs text-gray-600 text-left">
                필요한 부분만 선택!<br />
                아래에서 원하는 공정만 선택
              </p>
              {processMode === 'PARTIAL' && (
                <div className="mt-2 text-xs text-argen-600 font-medium">
                  ✓ 선택됨
                </div>
              )}
            </button>
          </div>
          
          {processMode === 'FULL' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ <strong>전체 공정</strong>이 선택되었습니다. 모든 기본 공정이 견적에 포함됩니다.
              </p>
            </div>
          )}
        </div>

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

        {/* 안내 문구 - 부분 공정일 때만 표시 */}
        {processMode === 'PARTIAL' && (
          <div className="bg-argen-50 border border-argen-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              각 공정별로 <strong>필요한 만큼 / 생활이 편하게 / 아쉬움 없이</strong> 중 원하는 수준을 선택하세요.
              <br />
              철거는 선택한 공정에 따라 자동으로 연동됩니다.
            </p>
          </div>
        )}

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
              if (process.id === 'DEMOLITION') {
                return (
                  <div 
                    key={process.id}
                    className="border rounded-lg p-4 bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔨</span>
                      <div>
                        <h3 className="font-semibold">{process.label}</h3>
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
                    {/* TODO: ProcessOption 타입으로 전환 시 TierOptionSelector 수정 필요 */}
                    {/* 임시로 주석 처리 - Phase 1에서는 SSOT 전환만 수행 */}
                    {/* <TierOptionSelector
                      process={process as any}
                      selectedTier={selection.tier}
                      onTierChange={(tier) => changeTier(process.id, tier)}
                      disabled={!selection.enabled}
                    /> */}
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold">{process.label}</h3>
                      <p className="text-sm text-gray-500">티어 선택 기능은 재구현 중입니다</p>
                    </div>
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

