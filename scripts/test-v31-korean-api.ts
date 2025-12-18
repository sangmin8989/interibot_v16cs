/**
 * V3.1 API - 한글 주거 형태 테스트
 */

const API_URL = 'http://localhost:3001/api/analyze/v31';

async function testKoreanHousingAPI() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  V3.1 API - 한글 주거 형태 테스트');
  console.log('════════════════════════════════════════════════════════════\n');

  // 한글 '아파트'로 테스트 (35평으로 변경)
  const requestBody = {
    spaceInfo: {
      housingType: '아파트',  // 한글!
      pyeong: 35,  // 35평으로 테스트
      rooms: 3,
      bathrooms: 2,
      budget: 'medium',
      totalPeople: 3,
      lifestyleTags: ['재택근무', '요리 자주함'],
    },
    selectedSpaces: ['bathroom', 'kitchen', 'living'],
    personality: {
      mode: 'quick',
      answers: {
        Q1: 'home_decor',
        Q8: '아이',
        Q_FAMILY_SIZE: '3',
      },
    },
  };

  console.log('📡 요청 데이터:');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\n⏳ API 호출 중...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log('📊 응답 상태:', response.status);
    console.log('📊 성공 여부:', data.success);
    console.log('📊 엔진:', data.engine);

    if (data.success && data.result) {
      console.log('\n✅ API 성공!\n');
      console.log('📋 결과 요약:');
      console.log(`   - 제목: ${data.result.summary?.title}`);
      console.log(`   - Needs: ${data.result.needs?.length || 0}개`);
      console.log(`   - 공정: ${data.result.processes?.length || 0}개`);
      console.log(`   - 실행 시간: ${data.meta?.totalExecutionTime || 0}ms`);

      if (data.result.needs && data.result.needs.length > 0) {
        console.log('\n🎯 Needs:');
        data.result.needs.forEach((n: any, i: number) => {
          console.log(`   ${i + 1}. ${n.name} [${n.level}]: ${n.reason?.substring(0, 50)}...`);
        });
      }

      if (data.result.homeValueScore) {
        console.log('\n🏡 집값 방어 점수:');
        console.log(`   점수: ${'★'.repeat(data.result.homeValueScore.score)}${'☆'.repeat(5 - data.result.homeValueScore.score)}`);
        console.log(`   이유: ${data.result.homeValueScore.reason}`);
        console.log(`   투자 가치: ${data.result.homeValueScore.investmentValue}`);
      } else {
        console.log('\n⚠️ 집값 정보 없음');
      }

      if (data.result.lifestyleScores) {
        console.log('\n📈 생활 개선 점수:');
        console.log(`   수납: ${data.result.lifestyleScores.storage}%`);
        console.log(`   청소: ${data.result.lifestyleScores.cleaning}%`);
        console.log(`   동선: ${data.result.lifestyleScores.flow}%`);
        console.log(`   코멘트: ${data.result.lifestyleScores.comment}`);
      } else {
        console.log('\n⚠️ 생활 개선 점수 없음');
      }
    } else if (data.engine === 'v3.1-out-of-scope') {
      console.log('\n❌ 범위 밖!');
      console.log('   메시지:', data.message);
      console.log('   scopeCheck:', JSON.stringify(data.scopeCheck, null, 2));
    } else {
      console.log('\n❌ 실패!');
      console.log('   오류:', data.error);
    }

  } catch (error) {
    console.log('❌ 오류 발생:', error instanceof Error ? error.message : String(error));
  }

  console.log('\n════════════════════════════════════════════════════════════\n');
}

testKoreanHousingAPI();

export {};

