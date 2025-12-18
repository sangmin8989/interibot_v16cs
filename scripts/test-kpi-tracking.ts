/**
 * KPI 계측 테스트 스크립트
 * 
 * KPI 이벤트 수집 및 조회가 정상 동작하는지 확인합니다.
 */

async function testKPITracking() {
  console.log('🧪 KPI 계측 테스트 시작')
  console.log('='.repeat(60))

  // 테스트 세션 ID
  const testSessionId = `test_session_${Date.now()}`

  try {
    // 1. decision_start 이벤트 전송
    console.log('\n📋 1. decision_start 이벤트 전송')
    const startResponse = await fetch('http://localhost:3000/api/kpi/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: testSessionId,
        eventType: 'decision_start',
        eventData: { sessionId: testSessionId },
        timestamp: new Date().toISOString()
      })
    })
    const startResult = await startResponse.json()
    console.log('결과:', startResult.success ? '✅ 성공' : '❌ 실패')

    // 2. option_change 이벤트 전송 (2회)
    console.log('\n📋 2. option_change 이벤트 전송 (2회)')
    for (let i = 0; i < 2; i++) {
      const optionResponse = await fetch('http://localhost:3000/api/kpi/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: testSessionId,
          eventType: 'option_change',
          eventData: {
            processId: `process_${i}`,
            fromOption: 'basic',
            toOption: 'standard'
          },
          timestamp: new Date().toISOString()
        })
      })
      const optionResult = await optionResponse.json()
      console.log(`  옵션 변경 ${i + 1}:`, optionResult.success ? '✅ 성공' : '❌ 실패')
    }

    // 3. lock_override_attempt 이벤트 전송
    console.log('\n📋 3. lock_override_attempt 이벤트 전송')
    const lockResponse = await fetch('http://localhost:3000/api/kpi/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: testSessionId,
        eventType: 'lock_override_attempt',
        eventData: {
          processId: 'demolition',
          lockLevel: 'hard',
          attemptedOption: 'premium'
        },
        timestamp: new Date().toISOString()
      })
    })
    const lockResult = await lockResponse.json()
    console.log('결과:', lockResult.success ? '✅ 성공' : '❌ 실패')

    // 4. decision_complete 이벤트 전송
    console.log('\n📋 4. decision_complete 이벤트 전송')
    const completeResponse = await fetch('http://localhost:3000/api/kpi/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: testSessionId,
        eventType: 'decision_complete',
        eventData: {
          decisionStartAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10분 전
          finalOptions: { process_0: 'standard', process_1: 'argen' }
        },
        timestamp: new Date().toISOString()
      })
    })
    const completeResult = await completeResponse.json()
    console.log('결과:', completeResult.success ? '✅ 성공' : '❌ 실패')

    // 5. KPI 조회
    console.log('\n📋 5. KPI 조회')
    await new Promise(resolve => setTimeout(resolve, 1000)) // DB 반영 대기
    
    const kpiResponse = await fetch(`http://localhost:3000/api/kpi/session/${testSessionId}`)
    const kpiResult = await kpiResponse.json()
    
    if (kpiResult.success) {
      console.log('✅ KPI 조회 성공:')
      console.log('  결정 완료 시간:', kpiResult.kpi.decisionDurationMs ? `${Math.round(kpiResult.kpi.decisionDurationMs / 1000 / 60)}분` : 'N/A')
      console.log('  옵션 변경 횟수:', kpiResult.kpi.optionChangeCount)
      console.log('  LOCK 변경 시도 횟수:', kpiResult.kpi.lockOverrideAttemptCount)
      
      // 목표 달성 여부 확인
      const durationMinutes = kpiResult.kpi.decisionDurationMs ? kpiResult.kpi.decisionDurationMs / 1000 / 60 : null
      const durationOk = durationMinutes ? durationMinutes >= 8 && durationMinutes <= 12 : false
      const optionChangeOk = kpiResult.kpi.optionChangeCount <= 3
      const lockAttemptOk = kpiResult.kpi.lockOverrideAttemptCount <= 1
      
      console.log('\n📊 목표 달성 여부:')
      console.log('  결정 시간 8-12분:', durationOk ? '✅' : '❌', durationMinutes ? `(${durationMinutes.toFixed(1)}분)` : '(N/A)')
      console.log('  옵션 변경 3회 이하:', optionChangeOk ? '✅' : '❌', `(${kpiResult.kpi.optionChangeCount}회)`)
      console.log('  LOCK 변경 시도 ≤1회:', lockAttemptOk ? '✅' : '❌', `(${kpiResult.kpi.lockOverrideAttemptCount}회)`)
    } else {
      console.error('❌ KPI 조회 실패:', kpiResult.error)
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ 테스트 완료')
  } catch (error) {
    console.error('❌ 테스트 오류:', error)
    process.exit(1)
  }
}

// 실행
if (require.main === module) {
  testKPITracking().catch(console.error)
}

export { testKPITracking }













