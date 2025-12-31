/**
 * Phase 6.5 — AI 호출 제한 가상 시뮬레이션 스크립트
 * 
 * 목적: Phase 5 로그를 분석하여 정책 트리거 충족 여부와 가상 제한 레벨 판정
 * 
 * 사용법:
 * 1. Phase 5 로그를 파일로 저장 (예: logs/ai-calls.log)
 * 2. node scripts/phase6-5-simulation.js logs/ai-calls.log
 * 
 * ⚠️ 주의: 코드 변경 없음, 읽기 전용 분석만 수행
 */

const fs = require('fs');
const path = require('path');

// 로그 파싱 함수
function parseLogLine(line) {
  const log = {};
  
  // route 추출
  const routeMatch = line.match(/route=(\w+)/);
  if (routeMatch) log.routeName = routeMatch[1];
  
  // model 추출
  const modelMatch = line.match(/model=([^\n]+)/);
  if (modelMatch) log.model = modelMatch[1].trim();
  
  // duration 추출
  const durationMatch = line.match(/duration=(\d+)ms/);
  if (durationMatch) log.duration_ms = parseInt(durationMatch[1]);
  
  // success 추출
  const successMatch = line.match(/success=(true|false)/);
  if (successMatch) log.success = successMatch[1] === 'true';
  
  // error 추출
  const errorMatch = line.match(/error=(\w+)/);
  if (errorMatch) log.error_code = errorMatch[1];
  
  // timestamp는 로그 파일의 타임스탬프 사용 (또는 별도 파싱)
  
  return log;
}

// 로그 파일 읽기
function readLogFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const logs = [];
  let currentLog = {};
  
  for (const line of lines) {
    if (line.startsWith('[AI_CALL]')) {
      if (Object.keys(currentLog).length > 0) {
        logs.push(currentLog);
      }
      currentLog = { raw: line };
    } else if (line.trim() && currentLog.raw) {
      const parsed = parseLogLine(currentLog.raw + '\n' + line);
      Object.assign(currentLog, parsed);
    }
  }
  
  if (Object.keys(currentLog).length > 0) {
    logs.push(currentLog);
  }
  
  return logs;
}

// 분당 호출 집계
function aggregateCallsPerMinute(logs) {
  const buckets = new Map();
  
  for (const log of logs) {
    // timestamp가 없으면 현재 시간 사용 (실제로는 로그에서 추출)
    const timestamp = log.timestamp || Date.now();
    const minuteBucket = Math.floor(timestamp / 60000);
    const key = `${log.routeName || 'UNKNOWN'}_${minuteBucket}`;
    
    if (!buckets.has(key)) {
      buckets.set(key, { routeName: log.routeName, minuteBucket, count: 0 });
    }
    buckets.get(key).count++;
  }
  
  return Array.from(buckets.values());
}

// 지연 지표 계산
function calculateLatencyMetrics(logs) {
  const byRoute = new Map();
  
  for (const log of logs) {
    const route = log.routeName || 'UNKNOWN';
    if (!byRoute.has(route)) {
      byRoute.set(route, []);
    }
    if (log.duration_ms) {
      byRoute.get(route).push(log.duration_ms);
    }
  }
  
  const metrics = {};
  for (const [route, durations] of byRoute.entries()) {
    durations.sort((a, b) => a - b);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const p95Index = Math.floor(durations.length * 0.95);
    const p95 = durations[p95Index] || 0;
    
    metrics[route] = {
      avg_duration_ms: Math.round(avg),
      p95_duration_ms: p95,
      count: durations.length,
    };
  }
  
  return metrics;
}

// 실패율 계산
function calculateFailureRate(logs) {
  const byRoute = new Map();
  
  for (const log of logs) {
    const route = log.routeName || 'UNKNOWN';
    if (!byRoute.has(route)) {
      byRoute.set(route, { total: 0, failed: 0 });
    }
    byRoute.get(route).total++;
    if (!log.success) {
      byRoute.get(route).failed++;
    }
  }
  
  const rates = {};
  for (const [route, stats] of byRoute.entries()) {
    rates[route] = {
      total_calls: stats.total,
      failed_calls: stats.failed,
      failure_rate: ((stats.failed / stats.total) * 100).toFixed(2) + '%',
    };
  }
  
  return rates;
}

// 점유율 계산
function calculateRouteShare(logs) {
  const total = logs.length;
  const byRoute = new Map();
  
  for (const log of logs) {
    const route = log.routeName || 'UNKNOWN';
    byRoute.set(route, (byRoute.get(route) || 0) + 1);
  }
  
  const shares = {};
  for (const [route, count] of byRoute.entries()) {
    shares[route] = {
      calls: count,
      total_calls: total,
      route_share: ((count / total) * 100).toFixed(2) + '%',
    };
  }
  
  return shares;
}

// 정책 트리거 판정
function checkPolicyTriggers(metrics, callsPerMinute, failureRates, routeShares) {
  const triggers = {
    IMAGE: {
      callsPerMinute: [],
      avgDuration: [],
      failureRate: [],
    },
    CHAT: {
      callsPerMinute: [],
      routeShare: false,
    },
  };
  
  // IMAGE 계열 트리거
  const imageRoutes = ['IMAGE_GENERATE', 'IMAGE_PROMPT', 'VISION_ANALYSIS'];
  for (const route of imageRoutes) {
    if (metrics[route]) {
      // 분당 호출 ≥ 20
      const highTrafficMinutes = callsPerMinute.filter(
        c => c.routeName === route && c.count >= 20
      );
      if (highTrafficMinutes.length > 0) {
        triggers.IMAGE.callsPerMinute.push({
          route,
          occurrences: highTrafficMinutes.length,
        });
      }
      
      // avg_duration ≥ 3000ms
      if (metrics[route].avg_duration_ms >= 3000) {
        triggers.IMAGE.avgDuration.push({
          route,
          value: metrics[route].avg_duration_ms,
        });
      }
      
      // failure_rate ≥ 10%
      if (failureRates[route] && parseFloat(failureRates[route].failure_rate) >= 10) {
        triggers.IMAGE.failureRate.push({
          route,
          rate: failureRates[route].failure_rate,
        });
      }
    }
  }
  
  // CHAT 계열 트리거
  const chatRoutes = ['CHAT', 'PROCESS_RECOMMEND', 'OPTION_RECOMMEND'];
  for (const route of chatRoutes) {
    if (metrics[route]) {
      // 분당 호출 ≥ 60
      const highTrafficMinutes = callsPerMinute.filter(
        c => c.routeName === route && c.count >= 60
      );
      if (highTrafficMinutes.length > 0) {
        triggers.CHAT.callsPerMinute.push({
          route,
          occurrences: highTrafficMinutes.length,
        });
      }
    }
    
    // route_share ≥ 40%
    if (routeShares[route] && parseFloat(routeShares[route].route_share) >= 40) {
      triggers.CHAT.routeShare = true;
    }
  }
  
  return triggers;
}

// 가상 제한 레벨 판정
function calculateVirtualLevels(logs, triggers) {
  // Level 1: 트리거 1개 충족
  // Level 2: 트리거 2개 이상 동시 충족
  
  // 간단한 구현 (실제로는 더 복잡한 로직 필요)
  const level1Count = 0; // TODO: 실제 계산
  const level2Count = 0; // TODO: 실제 계산
  
  return {
    level1: {
      count: level1Count,
      percentage: ((level1Count / logs.length) * 100).toFixed(2) + '%',
    },
    level2: {
      count: level2Count,
      percentage: ((level2Count / logs.length) * 100).toFixed(2) + '%',
    },
  };
}

// 메인 실행
function main() {
  const logFile = process.argv[2];
  
  if (!logFile) {
    console.error('사용법: node scripts/phase6-5-simulation.js <log-file>');
    process.exit(1);
  }
  
  if (!fs.existsSync(logFile)) {
    console.error(`로그 파일을 찾을 수 없습니다: ${logFile}`);
    process.exit(1);
  }
  
  console.log('='.repeat(80));
  console.log('Phase 6.5 — AI 호출 제한 가상 시뮬레이션');
  console.log('='.repeat(80));
  console.log(`로그 파일: ${logFile}\n`);
  
  // 로그 읽기
  const logs = readLogFile(logFile);
  console.log(`총 로그 수: ${logs.length}\n`);
  
  // 집계
  const callsPerMinute = aggregateCallsPerMinute(logs);
  const latencyMetrics = calculateLatencyMetrics(logs);
  const failureRates = calculateFailureRate(logs);
  const routeShares = calculateRouteShare(logs);
  
  // 출력
  console.log('1. 분당 호출 집계 (상위 10개):');
  callsPerMinute
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .forEach(c => {
      console.log(`  ${c.routeName}: ${c.count}회/분`);
    });
  console.log();
  
  console.log('2. 지연 지표:');
  for (const [route, metrics] of Object.entries(latencyMetrics)) {
    console.log(`  ${route}:`);
    console.log(`    평균: ${metrics.avg_duration_ms}ms`);
    console.log(`    P95: ${metrics.p95_duration_ms}ms`);
  }
  console.log();
  
  console.log('3. 실패율:');
  for (const [route, rates] of Object.entries(failureRates)) {
    console.log(`  ${route}: ${rates.failure_rate} (${rates.failed_calls}/${rates.total_calls})`);
  }
  console.log();
  
  console.log('4. 점유율:');
  for (const [route, share] of Object.entries(routeShares)) {
    console.log(`  ${route}: ${share.route_share} (${share.calls}/${share.total_calls})`);
  }
  console.log();
  
  // 정책 트리거 판정
  const triggers = checkPolicyTriggers(latencyMetrics, callsPerMinute, failureRates, routeShares);
  
  console.log('5. 정책 트리거 판정:');
  console.log('  IMAGE 계열:');
  if (triggers.IMAGE.callsPerMinute.length > 0) {
    console.log('    분당 ≥ 20: 충족');
    triggers.IMAGE.callsPerMinute.forEach(t => {
      console.log(`      - ${t.route}: ${t.occurrences}회`);
    });
  }
  if (triggers.IMAGE.avgDuration.length > 0) {
    console.log('    avg_duration ≥ 3000ms: 충족');
    triggers.IMAGE.avgDuration.forEach(t => {
      console.log(`      - ${t.route}: ${t.value}ms`);
    });
  }
  if (triggers.IMAGE.failureRate.length > 0) {
    console.log('    failure_rate ≥ 10%: 충족');
    triggers.IMAGE.failureRate.forEach(t => {
      console.log(`      - ${t.route}: ${t.rate}`);
    });
  }
  
  console.log('  CHAT 계열:');
  if (triggers.CHAT.callsPerMinute.length > 0) {
    console.log('    분당 ≥ 60: 충족');
    triggers.CHAT.callsPerMinute.forEach(t => {
      console.log(`      - ${t.route}: ${t.occurrences}회`);
    });
  }
  if (triggers.CHAT.routeShare) {
    console.log('    route_share ≥ 40%: 충족');
  }
  console.log();
  
  // Go/No-Go 판정
  console.log('6. 최종 Go/No-Go 판정:');
  const hasImageTriggers = 
    triggers.IMAGE.callsPerMinute.length > 0 ||
    triggers.IMAGE.avgDuration.length > 0 ||
    triggers.IMAGE.failureRate.length > 0;
  const hasChatTriggers = 
    triggers.CHAT.callsPerMinute.length > 0 ||
    triggers.CHAT.routeShare;
  
  console.log(`  IMAGE 트리거 충족: ${hasImageTriggers ? 'O' : 'X'}`);
  console.log(`  CHAT 트리거 충족: ${hasChatTriggers ? 'O' : 'X'}`);
  console.log();
  
  if (hasImageTriggers || hasChatTriggers) {
    console.log('  결론: ⬜ Go 또는 ⬜ Hold (상세 분석 필요)');
  } else {
    console.log('  결론: ⬜ Hold (관측 연장)');
  }
  
  console.log('\n' + '='.repeat(80));
}

if (require.main === module) {
  main();
}

module.exports = {
  parseLogLine,
  readLogFile,
  aggregateCallsPerMinute,
  calculateLatencyMetrics,
  calculateFailureRate,
  calculateRouteShare,
  checkPolicyTriggers,
};


