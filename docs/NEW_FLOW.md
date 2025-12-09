# 새로운 사용자 흐름

## 🔄 변경된 흐름

### 이전 흐름
```
1. 공간 정보 입력 (/space-info)
2. 영역 선택 (/space-area)
3. 성향 분석 (/analysis/[mode] 또는 /analyze)
4. 결과 페이지 (/result)
5. 공정 선택 (/process-select)
6. 견적 확인 (/estimate)
```

### 새로운 흐름 ⭐
```
1. 공간 정보 입력 (/space-info)
2. 영역 선택 (/space-area)
3. 공정 선택 (/process-select-pre) ⭐ 새로 추가!
4. 성향 분석 (/analysis/[mode] 또는 /analyze)
5. 결과 페이지 (/result)
6. 견적 확인 (/estimate)
```

---

## 📍 새로운 페이지: /process-select-pre

### 목적
- 성향 분석 **전에** 필요한 공정을 미리 선택
- 선택된 영역에 따라 자동으로 필요한 공정 표시
- 사용자가 공정을 추가/제거 가능

### 기능
1. **영역별 자동 공정 선택**
   - 거실 선택 → 목공, 도배, 필름, 기타, 철거 자동 선택
   - 주방 선택 → 주방, 타일, 철거 자동 선택
   - 욕실 선택 → 욕실, 타일, 철거 자동 선택

2. **공정 수정 가능**
   - 자동 선택된 공정 해제 가능
   - 추가 공정 선택 가능 (사용 가능한 공정만)

3. **전체 리모델링 옵션**
   - 전체 리모델링 선택 시 모든 공정 자동 선택

4. **선택된 공정 저장**
   - `sessionStorage.selectedProcesses`에 저장
   - 성향 분석 페이지로 전달

---

## 🔧 수정된 파일

### 1. app/space-area/page.tsx
**변경 전:**
```typescript
if (mode === 'vibe') {
  router.push('/analysis/vibe')
} else if (mode === 'quick') {
  router.push('/analysis/quick')
}
// ...
```

**변경 후:**
```typescript
// 영역 선택 후 공정 선택 페이지로 이동
const params = new URLSearchParams({
  mode,
  ...spaceInfoParams,
  areas: areaInfo.selectedAreas.join(','),
})

router.push(`/process-select-pre?${params.toString()}`)
```

### 2. app/process-select-pre/page.tsx (신규)
- 영역별 공정 자동 선택
- 공정 수정 기능
- 선택된 공정을 sessionStorage에 저장
- 성향 분석 페이지로 이동

---

## 📊 데이터 흐름

### 1단계: 영역 선택 (/space-area)
```typescript
sessionStorage.setItem('spaceInfo', JSON.stringify({
  areas: ['living', 'kitchen'],
  size: 43,
  roomCount: 3,
  bathroomCount: 2
}))

// 공정 선택 페이지로 이동
router.push('/process-select-pre?areas=living,kitchen&...')
```

### 2단계: 공정 선택 (/process-select-pre) ⭐ 새로운 단계
```typescript
// URL에서 영역 읽기
const areas = ['living', 'kitchen']

// 필요한 공정 자동 계산
const processCodes = getDefaultProcessesByAreas(areas)
// → ['100', '200', '500', '600', '700', '800', '900', '1000']

// 공정 이름으로 변환
const processNames = ['주방', '목공', '타일', '기타', '필름', '도배', '철거']

// 자동 선택
setSelectedProcesses(processNames)

// 사용자가 수정 가능...

// 선택 완료 후 저장
sessionStorage.setItem('selectedProcesses', JSON.stringify(selectedProcesses))

// 성향 분석으로 이동
router.push('/analysis/quick')
```

### 3단계: 성향 분석 (/analysis/[mode])
```typescript
// 선택된 공정 읽기
const selectedProcesses = JSON.parse(
  sessionStorage.getItem('selectedProcesses') || '[]'
)

// 분석 완료 후 저장
sessionStorage.setItem(`analysis_${analysisId}`, JSON.stringify({
  spaceInfo: { areas: [...], ... },
  preferences: {...},
  selectedProcesses: selectedProcesses // 저장
}))
```

### 4단계: 결과 페이지 (/result)
```typescript
// 분석 데이터 읽기
const analysisData = sessionStorage.getItem(`analysis_${analysisId}`)
// → selectedProcesses 포함

// "견적 확인" 버튼 클릭 시 바로 견적 페이지로
router.push(`/estimate?analysisId=${analysisId}&...`)
```

### 5단계: 견적 페이지 (/estimate)
```typescript
// 분석 데이터에서 공정 읽기
const parsed = JSON.parse(analysisData)
const selectedProcesses = parsed.selectedProcesses

// 견적 계산
const response = await fetch('/api/estimate/calculate', {
  body: JSON.stringify({
    평수: 43,
    방개수: 3,
    욕실개수: 2,
    selectedProcesses: selectedProcesses // 전달
  })
})
```

---

## ✅ 장점

1. **사용자 경험 개선**
   - 성향 분석 전에 필요한 공정을 미리 확인
   - 불필요한 공정 제외 가능

2. **정확한 견적**
   - 선택된 공정만으로 견적 계산
   - 사용자 의도에 맞는 견적 제공

3. **유연성**
   - 자동 선택된 공정 수정 가능
   - 추가 공정 선택 가능

4. **일관성**
   - 영역 선택 → 공정 자동 매핑
   - 전체 흐름에서 일관된 데이터 사용

---

## 🧪 테스트 시나리오

### 시나리오 1: 거실만 선택
1. 공간 정보 입력 (43평, 3방, 2욕실)
2. 영역 선택: "거실" 선택
3. **공정 선택 페이지** ⭐
   - 자동 선택: 목공, 도배, 필름, 기타, 철거
   - 사용자가 "전기" 추가 선택 가능
   - "성향 분석 시작" 버튼 클릭
4. 성향 분석 진행
5. 결과 페이지
6. 견적 확인 (선택된 공정만)

### 시나리오 2: 전체 리모델링
1. 공간 정보 입력
2. 영역 선택: "전체 리모델링" 선택
3. **공정 선택 페이지** ⭐
   - "전체 리모델링" 자동 선택
   - 모든 공정 포함
   - "성향 분석 시작" 버튼 클릭
4. 성향 분석 진행
5. 결과 페이지
6. 견적 확인 (모든 공정)

---

## 📝 주의사항

### 기존 /process-select 페이지
- 기존 `/process-select` 페이지는 **유지**
- 결과 페이지에서 "공정 선택 & 견적" 버튼으로 접근
- 주방/욕실/목공 옵션 선택 기능 포함

### 새로운 /process-select-pre 페이지
- 성향 분석 **전에** 사용
- 간단한 공정 선택만 (옵션 선택 없음)
- 선택된 공정을 sessionStorage에 저장

### 데이터 저장 위치
```typescript
// 공정 선택 (분석 전)
sessionStorage.setItem('selectedProcesses', JSON.stringify([...]))

// 분석 데이터 (분석 후)
sessionStorage.setItem(`analysis_${analysisId}`, JSON.stringify({
  selectedProcesses: [...], // 포함
  spaceInfo: {...},
  preferences: {...}
}))
```

---

## 🎯 결론

성향 분석 전에 공정을 선택하여:
- ✅ 사용자가 필요한 공정을 미리 확인
- ✅ 불필요한 공정 제외
- ✅ 더 정확한 견적 제공
- ✅ 향상된 사용자 경험











