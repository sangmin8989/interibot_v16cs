/**
 * V3.1 Core Edition - 통합 예제
 * 
 * V3 엔진과 V3.1 Core를 함께 실행하는 예제입니다.
 * 
 * 사용 방법:
 * 1. V3 엔진 실행
 * 2. V3.1 Core 엔진 실행 (병렬)
 * 3. 결과 비교
 */

import { V3Engine } from '../engine-v3';
import { V31CoreEngine } from '../engine-v3.1-core';
import type { V3EngineInput } from '../engine-v3/types';
import type { SpaceInfo } from '../types';

// ============ 통합 예제 ============

export async function runIntegrationExample() {
  console.log('🔗 [V3 + V3.1 통합] 예제 시작\n');

  // Step 1: 테스트 입력 데이터 준비
  const testInput = createTestInput();

  // Step 2: V3 엔진 실행
  console.log('🚀 V3 엔진 실행 중...');
  const v3Engine = new V3Engine();
  const v3Result = await v3Engine.analyze(testInput);
  console.log('✅ V3 엔진 완료:', {
    indicators: Object.keys(v3Result.traitResult.indicators).length,
    processes: v3Result.processResult.recommendedProcesses.length,
    risks: v3Result.riskResult.risks.length,
  });

  // Step 3: V3.1 Core 엔진 실행 (병렬)
  console.log('\n🚀 V3.1 Core 엔진 실행 중...');
  const v31Engine = new V31CoreEngine();
  const v31Result = v31Engine.analyze(testInput, v3Result.traitResult);
  console.log('✅ V3.1 Core 완료:', {
    inScope: v31Result.inScope,
    needs: v31Result.needsResult?.needs.length || 0,
    processes: v31Result.actionResult?.processes.length || 0,
  });

  // Step 4: 결과 비교
  console.log('\n📊 결과 비교:');
  compareResults(v3Result, v31Result);

  return { v3Result, v31Result };
}

// ============ 테스트 입력 생성 ============

// 테스트용 확장 SpaceInfo 타입
interface TestSpaceInfo extends SpaceInfo {
  buildingAge?: number;
  hasBalcony?: boolean;
}

function createTestInput(): V3EngineInput {
  const spaceInfo = {
    pyeong: 24,
    housingType: 'apartment',
    buildingAge: 20,
    rooms: 2,
    bathrooms: 1,
    hasBalcony: true,
  } as TestSpaceInfo;

  const answers: Record<string, string> = {
    Q1: '아침 준비 시간',
    Q2: '집에 머무는 시간 많음',
    Q3: '거실',
    Q4: '자주 치우지만 항상 어지럽다',
    Q5: '거의 매일 한다',
    Q6: '꼭 필요한 것만 최소로',
    Q7: '밝게',
    Q8: '아이 있음',
  };

  return {
    answers,
    spaceInfo,
    selectedSpaces: ['living', 'kitchen', 'bathroom'],
    budget: 'medium',
  };
}

// ============ 결과 비교 ============

function compareResults(v3Result: any, v31Result: any) {
  console.log('\n【V3 엔진 결과】');
  console.log('- 성향 지표: 12개');
  console.log('- 추천 공정:', v3Result.processResult.recommendedProcesses.length, '개');
  console.log('- 리스크:', v3Result.riskResult.risks.length, '개');
  console.log('- 시나리오:', v3Result.scenarioResult.scenarios.length, '개');

  if (v31Result.inScope) {
    console.log('\n【V3.1 Core 결과】');
    console.log('- Core Needs:', v31Result.needsResult?.needs.length || 0, '개');
    console.log('- 해결된 Needs:', v31Result.resolutionResult?.resolved.length || 0, '개');
    console.log('- 추천 공정:', v31Result.actionResult?.processes.length || 0, '개');
    console.log('- 충돌:', v31Result.resolutionResult?.conflicts?.length || 0, '개');

    // Needs 상세
    console.log('\n【V3.1 Core Needs 상세】');
    v31Result.needsResult?.needs.forEach((need: any) => {
      console.log(`  - ${need.id}: ${need.level} (${need.source})`);
    });

    // 추천 공정 상세
    console.log('\n【V3.1 Core 추천 공정 상세】');
    const mustProcesses = v31Result.actionResult?.processes.filter((p: any) => p.priority === 'must') || [];
    mustProcesses.forEach((proc: any) => {
      console.log(`  ✓ ${proc.processName}`);
      console.log(`    → ${proc.reason.substring(0, 60)}...`);
    });
  } else {
    console.log('\n【V3.1 Core 결과】');
    console.log('⚠️ 범위 밖:', v31Result.scopeCheck?.message);
  }

  // 실행 시간 비교
  console.log('\n【실행 시간 비교】');
  console.log('- V3 엔진:', v3Result.executionTime?.total || 0, 'ms');
  console.log('- V3.1 Core:', v31Result.executionTime, 'ms');
}

// ============ CLI 실행 ============

if (require.main === module) {
  runIntegrationExample()
    .then(() => {
      console.log('\n✅ 통합 예제 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

export default runIntegrationExample;

