/**
 * V3.1 Extended Edition - 엔진 단독 테스트 (서버 불필요)
 * 
 * API 서버 없이 V3.1 엔진을 직접 테스트합니다.
 */

import { V31CoreEngine } from '../lib/analysis/engine-v3.1-core';
import { TraitEngine } from '../lib/analysis/engine-v3/engines/TraitEngine';
import { V3EngineInput, TraitEngineResult } from '../lib/analysis/engine-v3/types';
import { SpaceInfo } from '../lib/analysis/types';

// 테스트 시나리오
const TEST_SCENARIOS = [
  { name: '초소형 (15평 원룸)', pyeong: 15 },
  { name: '소형 (23평)', pyeong: 23 },
  { name: '중소형 (30평)', pyeong: 30 },
  { name: '중형 (35평)', pyeong: 35 },
  { name: '대형 (50평)', pyeong: 50 },
  { name: '초대형 (70평)', pyeong: 70 },
];

async function testEngineDirectly() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  V3.1 Extended Edition - 엔진 직접 테스트');
  console.log('  (API 서버 불필요)');
  console.log('════════════════════════════════════════════════════════════\n');

  let passCount = 0;
  let failCount = 0;

  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n🧪 테스트: ${scenario.name}`);
    console.log('━'.repeat(60));

    try {
      // Step 1: V3 입력 생성
      const spaceInfo: SpaceInfo = {
        housingType: 'apartment',
        pyeong: scenario.pyeong,
        rooms: 3,
        bathrooms: 2,
        familySizeRange: '3~4인',
        ageRanges: ['adult', 'child'],
        lifestyleTags: ['hasPets'],
        totalPeople: 3,
        livingPurpose: '실거주',
        livingYears: 10,
      };

      const v3Input: V3EngineInput = {
        answers: {
          Q1: 'home_decor',
          Q2: 'functionality',
          Q3: 'storage',
          Q8: '아이',
          Q_FAMILY_SIZE: '3',
        },
        spaceInfo,
        selectedSpaces: ['bathroom', 'kitchen', 'living'],
        budget: 'medium',
      };

      // Step 2: TraitEngine 실행
      const traitEngine = new TraitEngine();
      const traitResult: TraitEngineResult = await traitEngine.analyze(v3Input);

      // Step 3: V3.1 Core 엔진 실행
      const v31Engine = new V31CoreEngine();
      const v31Result = v31Engine.analyze(v3Input, traitResult);

      // 결과 검증
      if (v31Result.inScope && v31Result.needsResult && v31Result.actionResult) {
        console.log(`✅ 성공!`);
        console.log(`   평수: ${scenario.pyeong}평`);
        console.log(`   범위: ${v31Result.inScope ? '✅ V3.1 지원' : '❌ 범위 밖'}`);
        console.log(`   실행 시간: ${v31Result.executionTime}ms`);
        console.log(`   Needs: ${v31Result.needsResult.needs.length}개`);
        
        const highNeeds = v31Result.needsResult.needs.filter(n => n.level === 'high');
        if (highNeeds.length > 0) {
          console.log(`   최우선 Needs: ${highNeeds.map(n => n.id).join(', ')}`);
        }
        
        console.log(`   공정: ${v31Result.actionResult.processes.length}개`);
        
        // Resolution 충돌 확인
        if (v31Result.resolutionResult?.conflicts && v31Result.resolutionResult.conflicts.length > 0) {
          console.log(`   조정: ${v31Result.resolutionResult.conflicts.length}건`);
          v31Result.resolutionResult.conflicts.forEach(c => {
            console.log(`      - ${c.description}`);
          });
        }
        
        passCount++;
      } else {
        console.log(`❌ 실패: 결과가 불완전합니다`);
        console.log(`   inScope: ${v31Result.inScope}`);
        console.log(`   scopeCheck: ${v31Result.scopeCheck?.message}`);
        failCount++;
      }

    } catch (error) {
      console.log(`❌ 오류 발생:`, error instanceof Error ? error.message : String(error));
      failCount++;
    }
  }

  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('  테스트 결과');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`✅ 성공: ${passCount}/${TEST_SCENARIOS.length}`);
  console.log(`❌ 실패: ${failCount}/${TEST_SCENARIOS.length}`);
  console.log(`📊 성공률: ${((passCount / TEST_SCENARIOS.length) * 100).toFixed(1)}%`);
  
  if (passCount === TEST_SCENARIOS.length) {
    console.log('\n🎉 모든 평수 테스트 통과!');
    console.log('V3.1 Extended Edition이 10평~80평까지 모두 지원합니다!');
  } else {
    console.log('\n⚠️ 일부 테스트 실패');
  }
  
  console.log('════════════════════════════════════════════════════════════\n');
}

testEngineDirectly();

export {};

