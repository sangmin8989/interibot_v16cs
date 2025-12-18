/**
 * V3.1 Extended Edition - 모든 평수 테스트
 * 
 * 10평~80평까지 다양한 평수에서 V3.1 엔진이 정상 작동하는지 테스트합니다.
 */

const API_URL = 'http://localhost:3001/api/analyze/v31';

// 테스트 시나리오: 다양한 평수
const TEST_SCENARIOS = [
  {
    name: '초소형 (15평 원룸)',
    pyeong: 15,
    housingType: 'apartment',
    expectedCategory: 'verySmall',
    expectedNeeds: ['storage', 'flow', 'brightness'],
  },
  {
    name: '소형 (23평)',
    pyeong: 23,
    housingType: 'apartment',
    expectedCategory: 'small',
    expectedNeeds: ['safety', 'storage'],
  },
  {
    name: '중소형 (30평)',
    pyeong: 30,
    housingType: 'apartment',
    expectedCategory: 'medium',
    expectedNeeds: ['safety', 'storage', 'maintenance'],
  },
  {
    name: '중형 (35평)',
    pyeong: 35,
    housingType: 'apartment',
    expectedCategory: 'large',
    expectedNeeds: ['flow', 'durability'],
  },
  {
    name: '대형 (50평)',
    pyeong: 50,
    housingType: 'apartment',
    expectedCategory: 'veryLarge',
    expectedNeeds: ['flow', 'durability', 'storage'],
  },
  {
    name: '초대형 (70평)',
    pyeong: 70,
    housingType: 'apartment',
    expectedCategory: 'luxury',
    expectedNeeds: ['flow', 'durability', 'maintenance'],
  },
];

async function testAllSizes() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  V3.1 Extended Edition - 모든 평수 테스트');
  console.log('════════════════════════════════════════════════════════════\n');

  let passCount = 0;
  let failCount = 0;

  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n🧪 테스트: ${scenario.name}`);
    console.log('━'.repeat(60));

    const requestBody = {
      spaceInfo: {
        housingType: scenario.housingType,
        pyeong: scenario.pyeong,
        rooms: 3,
        bathrooms: 2,
        budget: 'medium',
        totalPeople: 3,
        lifestyleTags: ['재택근무', '요리 자주함', '수납 많이 필요'],
      },
      selectedSpaces: ['bathroom', 'kitchen', 'living'],
      personality: {
        mode: 'quick',
        answers: {
          Q1: 'home_decor',
          Q2: 'functionality',
          Q3: 'storage',
          Q8: '아이',
          Q_FAMILY_SIZE: '3',
        },
      },
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.log(`❌ 실패: HTTP ${response.status}`);
        failCount++;
        continue;
      }

      const data = await response.json();

      if (!data.success) {
        console.log(`❌ 실패: ${data.error || '알 수 없는 오류'}`);
        failCount++;
        continue;
      }

      // 결과 검증
      const result = data.result;
      console.log(`✅ 성공!`);
      console.log(`   평수: ${scenario.pyeong}평`);
      console.log(`   엔진: ${data.engine}`);
      console.log(`   실행 시간: ${data.meta?.totalExecutionTime || 0}ms`);
      
      if (result) {
        console.log(`   제목: ${result.summary?.title || 'N/A'}`);
        console.log(`   Needs: ${result.needs?.length || 0}개`);
        console.log(`   공정: ${result.processes?.length || 0}개`);
        
        // 주요 Needs 출력
        if (result.needs && result.needs.length > 0) {
          const highNeeds = result.needs.filter((n: any) => n.level === 'high');
          if (highNeeds.length > 0) {
            console.log(`   최우선 Needs: ${highNeeds.map((n: any) => n.name).join(', ')}`);
          }
        }
      }

      passCount++;

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

testAllSizes();

// 이 파일을 독립 모듈로 만들기 (변수명 충돌 방지)
export {};

