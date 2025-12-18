/**
 * V3.1 Core Edition - 테스트 케이스
 * 
 * 실제 시나리오 기반 테스트 케이스 5개
 */

import { V31CoreEngine, V31CoreResult } from './index';
import { V3EngineInput, TraitEngineResult, TraitIndicators12 } from '../engine-v3/types';
import { SpaceInfo } from '../types';

// ============ 테스트 헬퍼 ============

// 테스트용 확장 SpaceInfo 타입
interface TestSpaceInfo extends SpaceInfo {
  buildingAge?: number;
  hasBalcony?: boolean;
  type?: string;
}

function createTestInput(
  pyeong: number,
  buildingAge: number,
  answers: Record<string, string>,
  selectedSpaces: string[]
): V3EngineInput {
  // 테스트용 확장 속성 포함
  const spaceInfo = {
    pyeong,
    housingType: 'apartment',
    buildingAge,
    hasBalcony: true,
  } as TestSpaceInfo;

  return {
    answers,
    spaceInfo,
    selectedSpaces,
    budget: 'medium',
  };
}

function createTestTraitResult(indicators: Partial<TraitIndicators12>): TraitEngineResult {
  const defaultIndicators: TraitIndicators12 = {
    수납중요도: 50,
    동선중요도: 50,
    조명취향: 50,
    소음민감도: 50,
    관리민감도: 50,
    스타일고집도: 50,
    색감취향: 50,
    가족영향도: 50,
    반려동물영향도: 50,
    예산탄력성: 50,
    공사복잡도수용성: 50,
    집값방어의식: 50,
  };

  return {
    indicators: { ...defaultIndicators, ...indicators },
    keywords: [],
    priorityAreas: [],
    lifestyleType: 'general',
  };
}

// ============ 테스트 케이스 ============

export function runV31CoreTests() {
  console.log('🧪 [V3.1 Core Tests] 테스트 시작\n');

  const engine = new V31CoreEngine();

  // 테스트 케이스 1: 영유아 + 수납 스트레스 + 구축 아파트
  console.log('📋 Test Case 1: 영유아 + 수납 스트레스 + 구축 20년');
  const test1Input = createTestInput(
    24,
    20,
    {
      Q8: '아이 있음',
      Q4: '정리가 항상 스트레스',
    },
    ['living', 'kitchen', 'bathroom', 'child-room']
  );
  const test1Trait = createTestTraitResult({
    수납중요도: 85,
    가족영향도: 90,
    관리민감도: 70,
  });
  const result1 = engine.analyze(test1Input, test1Trait);
  printResult('Test 1', result1);

  // 테스트 케이스 2: 반려견 + 층간소음 민감 + 청소 스트레스
  console.log('\n📋 Test Case 2: 반려견 + 청소 스트레스');
  const test2Input = createTestInput(
    32,
    10,
    {
      Q8: '반려동물 중형견 있음',
      Q4: '청소 스트레스 높음',
    },
    ['living', 'kitchen', 'bathroom', 'balcony']
  );
  const test2Trait = createTestTraitResult({
    반려동물영향도: 85,
    관리민감도: 80,
    소음민감도: 75,
  });
  const result2 = engine.analyze(test2Input, test2Trait);
  printResult('Test 2', result2);

  // 테스트 케이스 3: 재택근무 + 채광 불만
  console.log('\n📋 Test Case 3: 재택근무 + 채광 문제');
  const test3Input = createTestInput(
    28,
    7,
    {
      Q2: '재택근무 주 5일',
      Q7: '거실이 너무 어두움',
    },
    ['living', 'kitchen', 'bathroom', 'study']
  );
  const test3Trait = createTestTraitResult({
    조명취향: 80,
    동선중요도: 75,
  });
  const result3 = engine.analyze(test3Input, test3Trait);
  printResult('Test 3', result3);

  // 테스트 케이스 4: 요리 자주 + 기름때 고민
  console.log('\n📋 Test Case 4: 요리 자주 + 기름 요리 많음');
  const test4Input = createTestInput(
    30,
    12,
    {
      Q5: '요리 거의 매일 함, 기름 요리 많음',
    },
    ['living', 'kitchen', 'dining', 'bathroom']
  );
  const test4Trait = createTestTraitResult({
    동선중요도: 85,
    관리민감도: 75,
  });
  const result4 = engine.analyze(test4Input, test4Trait);
  printResult('Test 4', result4);

  // 테스트 케이스 5: 고령 부모 동거 + 안전 우려
  console.log('\n📋 Test Case 5: 고령 부모 동거 + 안전 우려');
  const test5Input = createTestInput(
    34,
    18,
    {
      Q8: '부모님 동거',
    },
    ['living', 'kitchen', 'bathroom', 'master-bedroom', 'guest-room']
  );
  const test5Trait = createTestTraitResult({
    가족영향도: 85,
    관리민감도: 70,
  });
  const result5 = engine.analyze(test5Input, test5Trait);
  printResult('Test 5', result5);

  console.log('\n✅ [V3.1 Core Tests] 모든 테스트 완료');
}

function printResult(testName: string, result: V31CoreResult) {
  console.log(`\n--- ${testName} 결과 ---`);
  console.log('범위 내:', result.inScope);
  
  if (!result.inScope) {
    console.log('범위 밖 메시지:', result.scopeCheck?.message);
    return;
  }

  console.log('실행 시간:', result.executionTime, 'ms');
  
  // Needs 결과
  console.log('\n🧠 Needs 결과 (초기):');
  result.needsResult?.needs.forEach((need, idx) => {
    console.log(`  ${idx + 1}. [${need.level.toUpperCase()}] ${need.id} (${need.category})`);
    console.log(`     출처: ${need.source}`);
  });

  // Resolution 결과
  if (result.resolutionResult) {
    console.log('\n🔧 Resolution 결과 (최종):');
    result.resolutionResult.resolved.forEach((resolved) => {
      console.log(`  우선순위 ${resolved.priority}. [${resolved.finalLevel.toUpperCase()}] ${resolved.id}`);
    });

    // 충돌 정보
    if (result.resolutionResult.conflicts && result.resolutionResult.conflicts.length > 0) {
      console.log('\n⚠️ 감지된 충돌 및 해결:');
      result.resolutionResult.conflicts.forEach((conflict) => {
        console.log(`  - ${conflict.description}`);
        console.log(`    해결: ${conflict.resolution}`);
      });
    } else {
      console.log('\n✅ 충돌 없음');
    }
  }

  // Action 결과
  if (result.actionResult) {
    console.log('\n⚡ Action 결과 (추천 공정):');
    
    const mustProcesses = result.actionResult.processes.filter((p) => p.priority === 'must');
    const recommendedProcesses = result.actionResult.processes.filter((p) => p.priority === 'recommended');
    
    if (mustProcesses.length > 0) {
      console.log('\n  【필수 공정】');
      mustProcesses.forEach((proc) => {
        console.log(`  ✓ ${proc.processName}`);
        console.log(`    연결 Needs: ${proc.relatedNeeds.join(', ')}`);
        console.log(`    이유: ${proc.reason.substring(0, 60)}...`);
      });
    }
    
    if (recommendedProcesses.length > 0) {
      console.log('\n  【권장 공정】');
      recommendedProcesses.slice(0, 3).forEach((proc) => {
        console.log(`  • ${proc.processName}`);
        console.log(`    연결 Needs: ${proc.relatedNeeds.join(', ')}`);
      });
      if (recommendedProcesses.length > 3) {
        console.log(`  ... 외 ${recommendedProcesses.length - 3}개`);
      }
    }
  }

  console.log('\n🔍 적용된 규칙:');
  result.needsResult?.debug?.appliedRules.slice(0, 5).forEach((rule) => {
    console.log(`  - ${rule}`);
  });
  if ((result.needsResult?.debug?.appliedRules.length || 0) > 5) {
    console.log(`  ... 외 ${(result.needsResult?.debug?.appliedRules.length || 0) - 5}개`);
  }
}

// ============ CLI 실행 ============

if (require.main === module) {
  runV31CoreTests();
}

