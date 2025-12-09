/**
 * 견적 계산 엔진 테스트 코드
 * 43평 Standard 기준으로 기존 로직 vs 새 로직 비교
 */

import {
  calculateBaseAmount,
  allocateByProcess,
  applyTraitAdjustments,
  getBaseEstimate,
  determineGrade,
  buildProcessItems,
  applyTraitWeights,
  calculateTotal,
} from './estimateCalculator'
import { getProcessRatios } from './dataLoader'
import { TraitScores } from '@/types/estimate'

/**
 * 테스트용 성향 점수 (중간값)
 */
const defaultTraitScores: TraitScores = {
  T01: 50, // 공간 감각
  T02: 50, // 시각 민감도
  T03: 50, // 청각 민감도
  T04: 50, // 청소 성향
  T05: 50, // 정리정돈 습관
  T06: 50, // 가족 구성
  T07: 50, // 건강 요소
  T08: 50, // 예산 감각
  T09: 50, // 색감 취향
  T10: 50, // 조명 취향
  T11: 50, // 집 사용 목적
  T12: 50, // 불편 요소
  T13: 50, // 활동 동선
  T14: 50, // 수면 패턴
  T15: 50, // 취미·라이프스타일
}

/**
 * 43평 Standard 기준 테스트
 */
function test43PyStandard() {
  console.log('\n=== 43평 Standard 기준 견적 테스트 ===\n')

  const sizePyeong = 43
  const grade: 'standard' = 'standard'
  const region: 'gyeonggi' = 'gyeonggi'

  // 1. 새 로직: 기본 금액 산출
  console.log('1. 기본 금액 산출 (새 로직)')
  try {
    const baseAmount = calculateBaseAmount(sizePyeong, grade, region)
    console.log(`   기본 금액 (VAT 제외): ${baseAmount.toLocaleString()}원`)
    console.log(`   목표: 50,000,000원`)
    console.log(`   차이: ${(baseAmount - 50000000).toLocaleString()}원 (${((baseAmount - 50000000) / 50000000 * 100).toFixed(1)}%)`)
  } catch (error) {
    console.error(`   오류: ${error}`)
  }

  // 2. 기존 로직: 기본 견적 조회
  console.log('\n2. 기본 견적 조회 (기존 로직)')
  const baseEstimate = getBaseEstimate(sizePyeong, region)
  if (baseEstimate) {
    const avgStandard = (baseEstimate.standard_min + baseEstimate.standard_max) / 2
    console.log(`   평균 Standard: ${Math.round(avgStandard).toLocaleString()}원`)
    console.log(`   범위: ${baseEstimate.standard_min.toLocaleString()}원 ~ ${baseEstimate.standard_max.toLocaleString()}원`)
  }

  // 3. 공정별 배분 (새 로직)
  console.log('\n3. 공정별 배분 (새 로직)')
  try {
    const baseAmount = calculateBaseAmount(sizePyeong, grade, region)
    const processRatios = getProcessRatios('full_remodeling')
    const allocated = allocateByProcess(baseAmount, processRatios)

    console.log('   공정별 배분 금액:')
    for (const [code, amount] of Object.entries(allocated)) {
      const ratio = processRatios[code] || 0
      console.log(`   ${code}: ${amount.toLocaleString()}원 (${(ratio * 100).toFixed(1)}%)`)
    }

    const totalAllocated = Object.values(allocated).reduce((sum, val) => sum + val, 0)
    console.log(`   총 배분 금액: ${totalAllocated.toLocaleString()}원`)
    console.log(`   원본 금액: ${baseAmount.toLocaleString()}원`)
    console.log(`   차이: ${(totalAllocated - baseAmount).toLocaleString()}원`)
  } catch (error) {
    console.error(`   오류: ${error}`)
  }

  // 4. 성향 가중치 적용 (새 로직)
  console.log('\n4. 성향 가중치 적용 (새 로직)')
  try {
    const baseAmount = calculateBaseAmount(sizePyeong, grade, region)
    const processRatios = getProcessRatios('full_remodeling')
    const allocated = allocateByProcess(baseAmount, processRatios)
    
    const { adjustedAmounts, weightApplied, traitInfluence } = applyTraitAdjustments(
      allocated,
      defaultTraitScores
    )

    console.log('   공정별 가중치 적용 결과:')
    for (const [code, adjusted] of Object.entries(adjustedAmounts)) {
      const original = allocated[code] || 0
      const weight = weightApplied[code] || 0
      const diff = adjusted - original
      const diffPercent = original > 0 ? (diff / original * 100).toFixed(1) : '0.0'
      console.log(`   ${code}: ${original.toLocaleString()}원 → ${adjusted.toLocaleString()}원 (${weight > 0 ? '+' : ''}${weight}%, ${diffPercent}% 변동)`)
    }

    const totalAdjusted = Object.values(adjustedAmounts).reduce((sum, val) => sum + val, 0)
    const totalOriginal = Object.values(allocated).reduce((sum, val) => sum + val, 0)
    console.log(`   총 금액: ${totalOriginal.toLocaleString()}원 → ${totalAdjusted.toLocaleString()}원`)
    console.log(`   변동: ${((totalAdjusted - totalOriginal) / totalOriginal * 100).toFixed(1)}%`)
  } catch (error) {
    console.error(`   오류: ${error}`)
  }

  // 5. 기존 로직 전체 흐름 (비교용)
  console.log('\n5. 기존 로직 전체 흐름 (비교용)')
  try {
    const baseEstimate = getBaseEstimate(sizePyeong, region)
    if (!baseEstimate) {
      console.log('   기본 견적을 찾을 수 없습니다')
      return
    }

    const determinedGrade = determineGrade(defaultTraitScores, baseEstimate)
    console.log(`   결정된 등급: ${determinedGrade}`)

    // 주요 공정만 테스트 (시간 절약)
    const testProcessCodes = ['100', '200', '300', '400', '1000']
    const processes: any[] = []

    for (const processCode of testProcessCodes) {
      const items = buildProcessItems(sizePyeong, determinedGrade, processCode, 'apartment')
      if (items.length === 0) continue

      const { items: adjustedItems, weightApplied, traitInfluence } = applyTraitWeights(
        items,
        processCode,
        defaultTraitScores
      )

      const subtotal = adjustedItems.reduce((sum, item) => sum + item.amount, 0)
      processes.push({
        code: processCode,
        subtotal,
        weightApplied,
        traitInfluence,
      })
    }

    const directCost = processes.reduce((sum, p) => sum + p.subtotal, 0)
    console.log(`   직접공사비 (주요 공정만): ${directCost.toLocaleString()}원`)

    // 간접비 추정
    const laborCost = directCost * 0.15 // 추정
    const indirectCost = Math.round(laborCost * 0.0307) + // 산재
                         Math.round(laborCost * 0.015) +   // 고용
                         Math.round(directCost * 0.03) +  // 공과
                         Math.round(directCost * 0.05)     // 이윤

    const totalBeforeVAT = directCost + indirectCost
    console.log(`   VAT 전 총액 (추정): ${totalBeforeVAT.toLocaleString()}원`)
    console.log(`   목표: 50,000,000원`)
    console.log(`   차이: ${(totalBeforeVAT - 50000000).toLocaleString()}원`)
  } catch (error) {
    console.error(`   오류: ${error}`)
  }

  console.log('\n=== 테스트 완료 ===\n')
}

/**
 * 실행
 */
if (require.main === module) {
  test43PyStandard()
}

export { test43PyStandard }





