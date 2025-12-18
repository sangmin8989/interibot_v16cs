/**
 * V3.1 Core Edition - Phase 1 테스트
 * 
 * ExplanationService와 ResultFormatter 기능 검증
 */

import { V31CoreEngine, V31CoreResult } from './index';
import { ExplanationService } from './services/ExplanationService';
import { ResultFormatter } from './services/ResultFormatter';
import { V3EngineInput, TraitEngineResult } from '../engine-v3/types';

console.log('🧪 V3.1 Core - Phase 1 테스트 시작\n');

// ============ 테스트 데이터 ============

const mockV3Input: V3EngineInput = {
  answers: {
    Q1: 'home_decor',
    Q2: 'functionality',
    Q3: 'storage',
    Q4: 'cleaning_easy',
    Q5: 'bright',
    Q6: 'cozy',
    Q8: '아이',
    Q_COOKING: 'often',
    Q_STORAGE: 'high',
    Q_CLEANING: 'weekly-2-3',
    Q_FAMILY_SIZE: '3',
  },
  spaceInfo: {
    pyeong: 25,
    housingType: 'apartment',
  },
  selectedSpaces: ['bathroom', 'kitchen', 'living'],
  vibeInput: undefined,
  budget: 'medium',
};

const mockTraitResult: TraitEngineResult = {
  indicators: {
    수납중요도: 75,
    동선중요도: 60,
    조명취향: 65,
    소음민감도: 50,
    관리민감도: 70,
    스타일고집도: 60,
    색감취향: 70,
    가족영향도: 80,
    반려동물영향도: 20,
    예산탄력성: 50,
    공사복잡도수용성: 60,
    집값방어의식: 55,
  },
  keywords: ['수납', '안전', '동선', '청소편의'],
  priorityAreas: ['bathroom', 'storage', 'safety'],
  lifestyleType: 'general',
};

// ============ 테스트 실행 ============

console.log('1️⃣ V3.1 Core 엔진 실행...');
const engine = new V31CoreEngine();
const result = engine.analyze(mockV3Input, mockTraitResult);

console.log('✅ 엔진 실행 완료\n');
console.log('📊 결과 요약:');
console.log(`  - 버전: ${result.version}`);
console.log(`  - 범위 내: ${result.inScope}`);
console.log(`  - 실행 시간: ${result.executionTime}ms`);

if (result.inScope && result.needsResult && result.actionResult) {
  console.log(`  - Needs 개수: ${result.needsResult.needs.length}`);
  console.log(`  - 공정 개수: ${result.actionResult.processes.length}`);
  console.log('');

  // ============ ExplanationService 테스트 ============
  
  console.log('2️⃣ ExplanationService 테스트...');
  const explanationService = new ExplanationService();
  const explanations = explanationService.generateExplanation(result);
  
  console.log(`✅ 설명 생성 완료: ${explanations.length}개 세그먼트\n`);
  
  explanations.forEach((segment, index) => {
    console.log(`📝 Segment ${index + 1}: ${segment.title}`);
    console.log(`   ${segment.content.substring(0, 100)}${segment.content.length > 100 ? '...' : ''}`);
    console.log('');
  });

  // ============ ResultFormatter 테스트 ============
  
  console.log('3️⃣ ResultFormatter 테스트...');
  const formatter = new ResultFormatter();
  const uiResult = formatter.formatForUI(result, explanations);
  
  console.log('✅ UI 형식 변환 완료\n');
  console.log('📊 UI 결과:');
  console.log(`  - 제목: ${uiResult.summary.title}`);
  console.log(`  - 설명: ${uiResult.summary.description}`);
  console.log('');
  
  console.log('  🎯 Needs:');
  uiResult.needs.forEach(need => {
    console.log(`    - ${need.name} (${need.levelText}): ${need.reason.substring(0, 50)}...`);
  });
  console.log('');
  
  console.log('  🔨 공정:');
  uiResult.processes.slice(0, 5).forEach(proc => {
    console.log(`    - ${proc.name} [${proc.priorityText}]: ${proc.reason.substring(0, 50)}...`);
  });
  if (uiResult.processes.length > 5) {
    console.log(`    ... 외 ${uiResult.processes.length - 5}개`);
  }
  console.log('');

  // ============ JSON 출력 (디버그용) ============
  
  console.log('4️⃣ JSON 구조 검증...');
  
  try {
    const jsonString = JSON.stringify(uiResult, null, 2);
    console.log('✅ JSON 직렬화 성공');
    console.log(`   크기: ${(jsonString.length / 1024).toFixed(2)}KB`);
    console.log('');
  } catch (error) {
    console.error('❌ JSON 직렬화 실패:', error);
  }

  // ============ 품질 검증 ============
  
  console.log('5️⃣ 품질 검증...');
  const qualityChecks = {
    'Needs가 있음': uiResult.needs.length > 0,
    '공정이 있음': uiResult.processes.length > 0,
    '설명이 있음': uiResult.explanation.segments.length > 0,
    '제목이 비어있지 않음': uiResult.summary.title.length > 0,
    '모든 공정에 이유가 있음': uiResult.processes.every(p => p.reason.length > 0),
    '모든 Needs에 이유가 있음': uiResult.needs.every(n => n.reason.length > 0),
  };

  let passCount = 0;
  let failCount = 0;

  Object.entries(qualityChecks).forEach(([check, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`  ${icon} ${check}`);
    if (passed) passCount++;
    else failCount++;
  });

  console.log('');
  console.log(`📊 품질 검증 결과: ${passCount}/${passCount + failCount} 통과`);
  console.log('');

} else {
  console.warn('⚠️ 범위 밖 또는 결과 불완전');
  if (result.scopeCheck) {
    console.log(`   ${result.scopeCheck.message}`);
  }
}

console.log('🎉 Phase 1 테스트 완료!');
console.log('');
console.log('다음 단계:');
console.log('  - Phase 2: V3.1 API 엔드포인트 생성');
console.log('  - Phase 3: UI 연결');

