# InteriBot 세부 내역서 생성 스크립트

## 개요

ARGEN 2025 Standard 기준으로 상세 견적서를 생성하는 Python 스크립트입니다.

## 필수 패키지

```bash
pip install pandas tabulate
```

## 실행 방법

```bash
cd scripts
python generate_estimate.py
```

## 출력 형식

스크립트는 다음 형식의 세부 내역서를 생성합니다:

- 공정별 항목 상세 내역 (재료비/노무비 분리)
- 간접비 계산 (산재/고용보험, 공과잡비, 현장관리/감리)
- 최종 합계

## 커스터마이징

`InteriorDB.ITEMS`에 항목을 추가하거나 단가를 수정하여 맞춤형 견적을 생성할 수 있습니다.

