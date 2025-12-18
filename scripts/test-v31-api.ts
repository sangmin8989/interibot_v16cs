/**
 * V3.1 API 테스트 스크립트
 * 
 * 로컬 서버에서 V3.1 API를 테스트합니다.
 */

const API_URL = 'http://localhost:3001/api/analyze/v31';

// ============ 테스트 데이터 ============

const testRequest = {
  spaceInfo: {
    housingType: 'apartment',
    pyeong: 25,
    rooms: 3,
    bathrooms: 2,
    buildingAge: 10,
    hasBalcony: true,
    budget: 'medium',
    totalPeople: 3,
    specialConditions: {
      hasPets: false,
      hasElderly: false,
    },
    lifestyleTags: ['재택근무', '요리 자주함', '수납 많이 필요'],
  },
  selectedSpaces: ['bathroom', 'kitchen', 'living'],
  personality: {
    mode: 'quick',
    answers: {
      Q1: 'home_decor',
      Q2: 'functionality',
      Q3: 'storage',
      Q4: 'cleaning_easy',
      Q5: 'bright',
      Q8: '아이',
      Q_FAMILY_SIZE: '3',
    },
  },
};

// ============ 테스트 실행 ============

async function testV31API() {
  console.log('🧪 V3.1 API 테스트 시작\n');
  console.log('📡 요청 URL:', API_URL);
  console.log('📦 요청 데이터:', JSON.stringify(testRequest, null, 2));
  console.log('');

  try {
    console.log('⏳ API 호출 중...');
    const startTime = Date.now();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest),
    });

    const elapsed = Date.now() - startTime;

    console.log(`✅ 응답 수신 (${elapsed}ms)\n`);
    console.log('📊 응답 상태:', response.status, response.statusText);

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API 오류:');
      console.error(JSON.stringify(data, null, 2));
      return;
    }

    // ============ 결과 분석 ============

    console.log('');
    console.log('✅ API 성공!');
    console.log('');
    console.log('📊 결과 요약:');
    console.log(`  - 엔진: ${data.engine}`);
    console.log(`  - 버전: ${data.version}`);
    console.log(`  - 실행 시간: ${data.meta?.totalExecutionTime}ms`);
    console.log('');

    if (data.result) {
      console.log('🎯 분석 결과:');
      console.log(`  - 제목: ${data.result.summary.title}`);
      console.log(`  - 설명: ${data.result.summary.description}`);
      console.log('');

      console.log('  📦 Needs:');
      data.result.needs.forEach((need: any) => {
        console.log(`    - ${need.icon} ${need.name} [${need.levelText}]: ${need.reason.substring(0, 50)}...`);
      });
      console.log('');

      console.log('  🔨 공정:');
      data.result.processes.slice(0, 5).forEach((proc: any) => {
        console.log(`    - ${proc.name} [${proc.priorityText}]: ${proc.reason.substring(0, 50)}...`);
      });
      if (data.result.processes.length > 5) {
        console.log(`    ... 외 ${data.result.processes.length - 5}개`);
      }
      console.log('');

      console.log('  📝 설명:');
      data.result.explanation.segments.forEach((seg: any) => {
        console.log(`    ${seg.order}. ${seg.title}`);
        console.log(`       ${seg.content.substring(0, 80)}...`);
      });
      console.log('');
    }

    // ============ 품질 검증 ============

    console.log('🔍 품질 검증:');
    const checks = {
      '성공 플래그': data.success === true,
      'Needs 있음': data.result?.needs?.length > 0,
      '공정 있음': data.result?.processes?.length > 0,
      '설명 있음': data.result?.explanation?.segments?.length > 0,
      '제목 있음': data.result?.summary?.title?.length > 0,
      '메타 정보 있음': !!data.meta,
    };

    let passed = 0;
    let failed = 0;

    Object.entries(checks).forEach(([check, result]) => {
      const icon = result ? '✅' : '❌';
      console.log(`  ${icon} ${check}`);
      if (result) passed++;
      else failed++;
    });

    console.log('');
    console.log(`📊 검증 결과: ${passed}/${passed + failed} 통과`);
    console.log('');

    // ============ JSON 저장 (옵션) ============

    if (process.argv.includes('--save')) {
      const fs = require('fs');
      const outputPath = './v31-api-test-result.json';
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      console.log(`💾 결과 저장: ${outputPath}`);
      console.log('');
    }

  } catch (error: any) {
    console.error('❌ 테스트 실패:', error.message);
    if (error.cause) {
      console.error('   원인:', error.cause);
    }
  }
}

// ============ 헬스 체크 테스트 ============

async function testHealthCheck() {
  console.log('🏥 헬스 체크 테스트...');
  
  try {
    const response = await fetch(API_URL, { method: 'GET' });
    const data = await response.json();
    
    console.log('✅ 헬스 체크 성공:');
    console.log(`   상태: ${data.status}`);
    console.log(`   엔진: ${data.engine}`);
    console.log(`   버전: ${data.version}`);
    console.log('');
    
    return true;
  } catch (error) {
    console.error('❌ 헬스 체크 실패:', error);
    console.error('   서버가 실행 중인지 확인하세요: npm run dev');
    console.log('');
    return false;
  }
}

// ============ 실행 ============

async function main() {
  console.log('═'.repeat(60));
  console.log('  V3.1 Core API 통합 테스트');
  console.log('═'.repeat(60));
  console.log('');

  // 1. 헬스 체크
  const healthy = await testHealthCheck();
  
  if (!healthy) {
    console.log('💡 서버를 먼저 실행하세요: npm run dev');
    process.exit(1);
  }

  // 2. API 테스트
  await testV31API();

  console.log('═'.repeat(60));
  console.log('  테스트 완료');
  console.log('═'.repeat(60));
}

main();

// 이 파일을 독립 모듈로 만들기 (변수명 충돌 방지)
export {};

