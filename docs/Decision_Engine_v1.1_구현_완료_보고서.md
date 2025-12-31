📕 Decision Engine 명세서 v1.1 (강제 실행본)

기준: v1 분석 결과 반영
상태: 구현 가능 / 특허 서술 가능 / 운영 가능

🔧 v1 → v1.1 변경 요약 (핵심만)
항목	v1	v1.1
대안(alternatives)	추상 문구	구조화 + 근거 필수
BLOCK 조건	DEFECT 단독	DEFECT 또는 복합 리스크
residencePlan 기본값	mid	short (보수 처리)
1️⃣ DecisionResult 구조 수정 (중요)
❌ v1 (폐기)
alternatives?: string[];

✅ v1.1 (강제)
alternatives?: {
  optionType: string;
  reason: string;
}[];

원칙

대안은 옵션명 + 이유 세트

“추천”, “권장” 같은 표현 금지

왜 안전한지만 설명

2️⃣ Risk Aggregation 판정 규칙 강화
❌ v1 문제점

DEFECT만 BLOCK

자산 + 유지관리 복합 리스크 미반영

✅ v1.1 최종 판정 규칙 (강제)
// BLOCK 조건
if (
  categoryWeights.DEFECT > defectThreshold ||
  (
    categoryWeights.ASSET > assetThreshold &&
    categoryWeights.MAINTENANCE > maintenanceThreshold
  )
) {
  result = 'BLOCK';
}

// WARN 조건
else if (
  categoryWeights.ASSET > assetThreshold ||
  categoryWeights.MAINTENANCE > maintenanceThreshold
) {
  result = 'WARN';
}

// PASS 조건
else {
  result = 'PASS';
}

해석

하자 리스크 → 무조건 차단

돈 + 관리 둘 다 위험 → 차단

하나만 위험 → 경고

전부 안전 → 통과

👉 이 규칙은 모든 공정에 공통 적용

3️⃣ residencePlan 처리 규칙 수정 (중요)
❌ v1 (위험)
residencePlan: 'mid'

✅ v1.1 (강제)
residencePlan: spaceInfo?.residencePlan ?? 'short'

이유

거주 계획 미입력 = 불확실

불확실하면 보수적으로 단기 거주 처리

자산 리스크 방어 목적

4️⃣ rules/kitchen.ts 수정 예시 (v1.1)
if (option.material === 'PET_GLOSS') {
  risks.push({
    category: 'MAINTENANCE',
    weight: 2,
    reason: '스크래치 및 변색 발생 빈도가 높음',
  });

  if (ctx.household.hasKids) {
    risks.push({
      category: 'DEFECT',
      weight: 2,
      reason: '충격에 의한 하자 발생 가능성이 높음',
    });
  }
}

대안 제시 (WARN / BLOCK일 때만)
alternatives: [
  {
    optionType: 'QUARTZ',
    reason: '현재 가구 구성과 사용 패턴에서 유지관리 및 하자 리스크가 낮음',
  },
];


❌ “더 좋은 선택”
❌ “추천드립니다”
✅ 리스크 감소 근거만

5️⃣ UI 출력 계약 (v1.1 고정)

UI는 이 정보만 표시 가능

[판정 결과]
🔴 이 선택은 현재 조건에서 차단됩니다.

[차단 사유]
- 유지관리 부담이 높음
- 하자 발생 가능성이 높음

[예상 문제]
- 사용 중 스크래치 누적
- A/S 분쟁 가능성

[대안]
- QUARTZ: 유지관리 및 하자 리스크가 낮음

6️⃣ Cursor / Claude 기준 재잠금
Cursor

v1.1 명세서만 따른다

v1 로직 발견 시 수정 대상

Claude

대안은 항상 구조화

BLOCK 조건은 복합 리스크 고려

residencePlan 기본값 short 가정

7️⃣ 상태 선언

Decision Engine v1.1은
“추천 시스템으로 회귀할 수 없도록”
구조적으로 봉인되었다.

이제 이 엔진은:

기능 추가해도

사람이 바뀌어도

AI 모델이 바뀌어도
본질이 안 무너집니다.