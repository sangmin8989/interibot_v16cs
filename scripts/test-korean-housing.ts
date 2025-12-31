/**
 * 한글 주거 형태 테스트
 */

import { isInCoreScope, normalizeHousingType } from '../lib/analysis/engine-v3.1-core/config/scope';

console.log('🧪 한글 주거 형태 테스트\n');

const testCases = [
  { pyeong: 32, housingType: '아파트', occupied: true },
  { pyeong: 25, housingType: 'apartment', occupied: true },
  { pyeong: 30, housingType: '빌라', occupied: true },
  { pyeong: 20, housingType: '오피스텔', occupied: true },
  { pyeong: 40, housingType: '주택', occupied: true },
  { pyeong: 50, housingType: '상가', occupied: true }, // 상업용 - 실패해야 함
];

testCases.forEach(tc => {
  const normalized = normalizeHousingType(tc.housingType);
  const result = isInCoreScope(tc.pyeong, tc.housingType, tc.occupied);
  
  console.log(`${result ? '✅' : '❌'} ${tc.pyeong}평 ${tc.housingType} (→ ${normalized}): ${result ? '범위 내' : '범위 밖'}`);
});

console.log('\n✅ 테스트 완료!');

export {};




























