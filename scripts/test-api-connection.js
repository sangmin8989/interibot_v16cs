/**
 * API 연결 테스트 스크립트
 * 
 * 사용법:
 * 1. 개발 서버 실행: npm run dev
 * 2. 이 스크립트 실행: node scripts/test-api-connection.js
 * 
 * 주의: 실제 OpenAI API 호출이 발생하므로 비용이 발생할 수 있습니다.
 */

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001';

// 테스트할 API 엔드포인트 목록
const API_ENDPOINTS = [
  {
    path: '/api/v5/analyze/chat',
    method: 'POST',
    body: {
      messages: [
        { role: 'user', content: '안녕하세요' }
      ],
      photoAnalysis: null
    },
    description: 'V5 채팅 분석 API'
  },
  {
    path: '/api/generate-questions',
    method: 'POST',
    body: {
      spaceInfo: { pyeong: 30, bathroomCount: 1 },
      budgetRange: '30m_50m'
    },
    description: '질문 생성 API'
  },
  {
    path: '/api/recommend/process',
    method: 'POST',
    body: {
      traitScores: {
        TR_VIS: 0,
        TR_TONE: 0,
        TR_STORE: 0,
        TR_MAINT: 0,
        TR_LIFE: 0,
        TR_HOST: 0
      },
      spaceInfo: { pyeong: 30, bathroomCount: 1 }
    },
    description: '공정 추천 API'
  }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n[테스트] ${endpoint.description}`);
    console.log(`  경로: ${endpoint.path}`);
    
    const response = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': `test-${Date.now()}`
      },
      body: JSON.stringify(endpoint.body)
    });

    const status = response.status;
    const data = await response.json().catch(() => ({ error: '응답 파싱 실패' }));

    if (status >= 200 && status < 300) {
      console.log(`  ✅ 성공 (${status})`);
      if (data.success !== undefined) {
        console.log(`  결과: ${data.success ? '성공' : '실패'}`);
      }
      return { success: true, status, endpoint: endpoint.path };
    } else {
      console.log(`  ❌ 실패 (${status})`);
      console.log(`  에러: ${data.error || JSON.stringify(data).substring(0, 100)}`);
      return { success: false, status, endpoint: endpoint.path, error: data.error };
    }
  } catch (error) {
    console.log(`  ❌ 연결 실패`);
    console.log(`  에러: ${error.message}`);
    return { success: false, endpoint: endpoint.path, error: error.message };
  }
}

async function checkServerHealth() {
  try {
    console.log('[서버 상태 확인]');
    const response = await fetch(`${BASE_URL}/api/health`).catch(() => null);
    
    if (response && response.ok) {
      console.log('  ✅ 서버 정상');
      return true;
    } else {
      console.log('  ⚠️  /api/health 엔드포인트 없음 (정상일 수 있음)');
      // health 엔드포인트가 없어도 정상일 수 있으므로 계속 진행
      return true;
    }
  } catch (error) {
    console.log('  ❌ 서버 연결 실패');
    console.log(`  에러: ${error.message}`);
    console.log(`  확인: 개발 서버가 실행 중인지 확인하세요 (npm run dev)`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('API 연결 테스트 시작');
  console.log(`서버 URL: ${BASE_URL}`);
  console.log('='.repeat(60));

  // 서버 상태 확인
  const serverOk = await checkServerHealth();
  if (!serverOk) {
    console.log('\n❌ 서버가 실행되지 않았습니다. 먼저 "npm run dev"를 실행하세요.');
    process.exit(1);
  }

  // 각 엔드포인트 테스트
  const results = [];
  for (const endpoint of API_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    // 요청 간 간격 (서버 부하 방지)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('테스트 결과 요약');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  
  console.log(`총 테스트: ${results.length}개`);
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  
  if (failCount > 0) {
    console.log('\n실패한 엔드포인트:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.endpoint}: ${r.error || `HTTP ${r.status}`}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('테스트 완료');
  console.log('='.repeat(60));
}

// 스크립트 실행
main().catch(error => {
  console.error('테스트 실행 중 오류:', error);
  process.exit(1);
});

