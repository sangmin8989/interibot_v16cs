# 규칙 엔진 v0 자연어 명세서 (Cursor 입력용 / 단일 기준)

## 0. 목표(절대 기준)

* 규칙 엔진은 **"견적 숫자(총액/공정별/옵션 증감/범위)"만** 만든다.
* AI는 **어떤 경우에도 숫자 생성/계산/보정/추정**을 하지 않는다.
* 결과 화면에는 반드시 아래 4개 숫자가 나온다:

  1. 제외 공정별 감소 범위
  2. 옵션 선택별 증가 범위
  3. 전체 절감 범위
  4. 현재 추천 총액 범위

---

## 1. 입력(규칙 엔진이 받는 데이터)

규칙 엔진은 아래 입력이 모두 있어야 동작한다. 하나라도 없으면 "견적 산출 불가"로 반환한다.

### 1-1. 하드 입력(필수)

* 평형(또는 전용/공급면적 중 하나)
* 주거 유형(아파트/빌라/오피스텔/단독 등)
* 방 개수
* 욕실 개수
* 공사 범위(전체/부분)
* 공정 선택 상태(선택/제외 목록)
* 옵션 선택 상태(옵션 ID 목록)

### 1-2. 현장 변수(필수, 최소 2개는 반드시 입력받거나 '미확인'으로 명시)

* 엘리베이터 유무/사용 가능 여부
* 주차/양중 조건
* 관리규정(작업 시간/소음 제한)
* 폐기물 반출 동선(1층/지하/거리)
* 보양 범위(공용부 포함 여부)

> 규칙: 현장 변수 2개 이상이 '미확인'이면 **범위를 자동으로 넓힌다(리스크 가중치 적용)**

### 1-3. 등급/브랜드(선택)

* 등급은 v0에서 **사용하지 않는다.**
* v0는 "단일 추천안 1개 + 옵션 증감"만 산출한다.
* 기존 4등급(Basic/Standard/Argen/Premium)은 v0에서 **전면 비활성화**한다.

---

## 2. 출력(규칙 엔진이 반환해야 하는 형태)

규칙 엔진은 아래 JSON 구조로만 반환한다. 필드 누락 금지.

```json
{
  "summary": {
    "removed": [
      {"id": "", "name": "", "min": 0, "max": 0}
    ],
    "focused": [
      {"id": "", "name": ""}
    ],
    "saving": {"min": 0, "max": 0},
    "total": {"min": 0, "max": 0}
  },
  "processCosts": [
    {"id": "", "name": "", "min": 0, "max": 0, "type": "selected|removed"}
  ],
  "optionDeltas": [
    {"id": "", "name": "", "min": 0, "max": 0}
  ],
  "risk": {
    "unknownCount": 0,
    "multiplier": 1.00,
    "notes": ["", ""]
  }
}
```

* min/max 단위는 "원" 기준 정수(프론트에서 만원 단위 표기)
* focused는 "선택된 핵심 공정(체감 변화)" 용도이며 금액은 여기에는 넣지 않는다.

---

## 3. 핵심 계산 규칙(숫자 산식 계약)

### 3-1. 공정 비용 산식(공정별 최소/최대)

각 공정은 DB 또는 로컬 가격표에서 아래 3개를 갖는다.

* baseMin, baseMax (평형/면적에 따른 최소/최대)
* areaRule (평형 → 적용 면적 변환 규칙)
* siteFactorGroup (현장 변수 가중 그룹)

공정비는 다음처럼 계산한다.

* processMin = baseMin × riskMultiplier
* processMax = baseMax × riskMultiplier

> v0에서는 공정비를 "면적 × 단가"로 쪼개지 않아도 된다.
> 단, 반드시 "공정별 최소/최대(baseMin/baseMax)"는 유지한다.

### 3-2. 총액 산식

* selectedTotalMin = Σ(processMin where type=selected)
* selectedTotalMax = Σ(processMax where type=selected)
* optionTotalMin = Σ(optionDeltaMin for selected options)
* optionTotalMax = Σ(optionDeltaMax for selected options)
* totalMin = selectedTotalMin + optionTotalMin
* totalMax = selectedTotalMax + optionTotalMax

### 3-3. 절감 산식(제외 공정 기반)

* removedTotalMin = Σ(processMin where type=removed)
* removedTotalMax = Σ(processMax where type=removed)
* savingMin = removedTotalMin
* savingMax = removedTotalMax

> 규칙: "절감"은 **반드시 제외 공정 합계로만** 계산한다.
> AI 추정 절감 금지.

---

## 4. 리스크 가중치(riskMultiplier) 규칙

### 4-1. unknownCount 산정

현장 변수 5개 중 "미확인" 개수를 카운트한다.

* unknownCount = 0~5

### 4-2. multiplier 계산(고정 룰)

* unknownCount 0~1 → 1.00
* unknownCount 2 → 1.05
* unknownCount 3 → 1.10
* unknownCount 4 → 1.15
* unknownCount 5 → 1.20

risk.notes는 "왜 범위가 넓어졌는지"를 짧게 2줄로 넣는다.
예:

* "현장 변수 3개 미확인으로 견적 범위를 확대했습니다."
* "양중/작업시간 조건 확인 시 범위가 줄어듭니다."

---

## 5. 데이터 소스 우선순위(충돌 방지)

* 1순위: Supabase(가격표/패키지)
* 2순위: 로컬 가격표(pricing-v3)
* 3순위: 하드코딩 금지 (없으면 '산출 불가')

---

## 6. 실패 처리(무조건 반환해야 함)

입력이 부족하면 예외 던지지 말고 아래처럼 반환한다.

```json
{
  "error": {
    "code": "INSUFFICIENT_INPUT",
    "missing": ["bathroomCount", "processSelection", "siteRules"]
  }
}
```

> 규칙: 프론트는 이 error를 받으면
> "견적 산출 불가" 안내 + 부족한 입력 2~3개만 재요청한다.

---

## 7. 강제 금지 규칙(가장 중요)

* AI가 만든 숫자 사용 금지
* 등급별 배수(Basic/Standard/Argen/Premium) v0 사용 금지
* "평형×단가×마진" 같은 임의 계산을 AI가 만들면 즉시 폐기
* 공정 금액이 없는 상태로 결과 화면 렌더링 금지
* 옵션은 반드시 min/max 증감 금액을 가진다. 없으면 옵션 노출 금지

---

## 8. v0 완료 조건(통과 기준)

아래 3개 테스트 케이스에서 **항상** 숫자가 나온다.

1. 24~25평 / 욕실 2 / 주방 제외 / 구조 변경 제외
2. 32~34평 / 욕실 2 / 욕실 수납 옵션 ON
3. 40평대 / 현장 변수 3개 미확인(리스크 multiplier 적용 확인)

통과 기준:

* 변화 요약 카드에 절감/총액 범위가 표시됨
* 제외 공정에 -금액 범위가 표시됨
* 옵션 선택에 +금액 범위가 표시됨
* 현장 변수 미확인 시 multiplier가 적용됨

---

## 9. 적용 지시(실행 문장)

* "견적 화면/결과 화면은 4등급 견적을 숨기고, v0 단일 추천안 + 옵션 증감만 보여준다."
* "규칙 엔진 반환 JSON을 그대로 결과 화면 출력 계약 v1.0에 매핑한다."
* "AI 설명은 규칙 엔진이 반환한 숫자를 읽어서 문장으로만 설명한다. 숫자 수정/재계산 금지."

---

위 내용대로 규칙 엔진 v0를 구현하면, 지금 한프로님이 느끼는 문제('뭐가 바뀐지 모르겠고 견적이 없다')가 구조적으로 해결됩니다.




















