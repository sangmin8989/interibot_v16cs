/**
 * 공간 효율지수 계산기
 * 
 * 평수 대비 공간을 얼마나 효율적으로 활용하는지 측정
 */

import type { ReportInput, SpaceEfficiencyResult } from './types'

/**
 * 공간 효율지수 계산
 */
export function calculateSpaceEfficiencyIndex(input: ReportInput): SpaceEfficiencyResult {
  const baseScore = 40
  
  // 1. 수납 점수 (0~25점)
  const storage = calculateStorageScore(
    input.selectedProcesses,
    input.options || [],
    input.spaceInfo.pyeong,
    getFamilySize(input.familyType)
  )
  
  // 2. 가족 적정도 (0~20점)
  const familySpace = calculateFamilySpaceScore(
    input.spaceInfo.pyeong,
    input.familyType
  )
  
  // 3. 공간 활용도 (0~15점)
  const spaceUtilization = calculateSpaceUtilization(
    input.selectedProcesses,
    input.options || []
  )
  
  // 합계 계산
  const totalScore = baseScore + storage.score + familySpace.score + spaceUtilization.score
  
  // 최소/최대 점수 제한
  const finalScore = Math.max(40, Math.min(100, totalScore))
  
  // AI 메시지 생성
  const message = generateSpaceEfficiencyMessage(finalScore, storage, familySpace)
  
  return {
    score: Math.round(finalScore),
    factors: {
      storage,
      familySpace,
      spaceUtilization,
    },
    message,
  }
}

/**
 * 수납 점수 (0~25점)
 */
function calculateStorageScore(
  selectedProcesses: string[],
  options: string[],
  pyeong: number,
  familySize: number
): { 
  score: number
  details: Array<{ item: string; score: number; capacity: string }>
} {
  const details: Array<{ item: string; score: number; capacity: string }> = []
  let total = 0
  
  // 평당 필요 수납량 기준
  const neededStorage = familySize * 3  // 1인당 3㎥ 필요
  let providedStorage = 0
  
  if (selectedProcesses.includes('붙박이장')) {
    details.push({ item: '붙박이장', score: 8, capacity: '약 5㎥' })
    total += 8
    providedStorage += 5
  }
  
  if (options.includes('드레스룸') || selectedProcesses.includes('드레스룸')) {
    details.push({ item: '드레스룸', score: 7, capacity: '약 4㎥' })
    total += 7
    providedStorage += 4
  }
  
  if (selectedProcesses.includes('신발장') || options.includes('신발장확장')) {
    details.push({ item: '신발장', score: 5, capacity: '약 1.5㎥' })
    total += 5
    providedStorage += 1.5
  }
  
  if (options.includes('키큰장')) {
    details.push({ item: '주방 키큰장', score: 3, capacity: '약 1㎥' })
    total += 3
    providedStorage += 1
  }
  
  if (selectedProcesses.includes('수납')) {
    details.push({ item: '수납 공간', score: 4, capacity: '약 2㎥' })
    total += 4
    providedStorage += 2
  }
  
  // 수납 충족도 보너스
  if (providedStorage >= neededStorage) {
    total += 2
  }
  
  return { score: Math.min(25, total), details }
}

/**
 * 가족 적정도 (0~20점)
 */
function calculateFamilySpaceScore(
  pyeong: number,
  familyType: string
): { 
  score: number
  spacePerPerson: number
  evaluation: string
} {
  const familySize = getFamilySize(familyType)
  const spacePerPerson = pyeong / familySize
  
  let score: number
  let evaluation: string
  
  if (spacePerPerson >= 12) {
    score = 20
    evaluation = '1인당 공간이 여유로워요'
  } else if (spacePerPerson >= 10) {
    score = 16
    evaluation = '1인당 공간이 적정해요'
  } else if (spacePerPerson >= 8) {
    score = 12
    evaluation = '1인당 공간이 약간 좁아요. 수납이 중요해요'
  } else if (spacePerPerson >= 6) {
    score = 8
    evaluation = '1인당 공간이 좁아요. 효율적 수납이 필수예요'
  } else {
    score = 4
    evaluation = '공간이 매우 좁아요. 미니멀 라이프가 필요해요'
  }
  
  return { 
    score, 
    spacePerPerson: Math.round(spacePerPerson * 10) / 10, 
    evaluation 
  }
}

/**
 * 공간 활용도 (0~15점)
 */
function calculateSpaceUtilization(
  selectedProcesses: string[],
  options: string[]
): { 
  score: number
  items: string[]
} {
  let score = 0
  const items: string[] = []
  
  // 거실-주방 오픈 (추정)
  if (options.includes('오픈키친') || options.includes('거실주방오픈')) {
    score += 5
    items.push('거실-주방 오픈으로 시각적 확장')
  }
  
  // 베란다 확장
  if (options.includes('베란다확장') || options.includes('베란다확대')) {
    score += 4
    items.push('베란다 확장으로 실사용 면적 증가')
  }
  
  // 다용도실 활용
  if (options.includes('다용도실') || options.includes('작업공간')) {
    score += 3
    items.push('다용도실로 숨은 공간 활용')
  }
  
  // 현관 재구성
  if (selectedProcesses.includes('신발장') || options.includes('현관수납')) {
    score += 2
    items.push('현관 재구성으로 동선 효율화')
  }
  
  // 아치/문틀 정리
  if (options.includes('아치정리') || options.includes('문틀정리')) {
    score += 1
    items.push('아치/문틀 정리로 시각적 정리')
  }
  
  return { score: Math.min(15, score), items }
}

/**
 * 가족 구성에서 인원수 추출
 */
function getFamilySize(familyType: string): number {
  if (familyType.includes('1인') || familyType === '1인') return 1
  if (familyType.includes('2인') || familyType === '신혼' || familyType === '2인') return 2
  if (familyType.includes('3') || familyType.includes('4')) return 3.5  // 평균
  if (familyType.includes('5인')) return 5
  return 2  // 기본값
}

/**
 * AI 메시지 생성
 */
function generateSpaceEfficiencyMessage(
  score: number,
  storage: { score: number; details: any[] },
  familySpace: { score: number; spacePerPerson: number; evaluation: string }
): string {
  if (score >= 85) {
    return `공간 활용이 매우 효율적이에요. ${familySpace.evaluation} 수납 공간도 충분해서 생활이 편할 거예요.`
  }
  if (score >= 70) {
    return `공간 활용이 양호해요. ${familySpace.evaluation} ${storage.details.length > 0 ? '수납 공간도 확보됐어요' : '수납 공간을 추가하면 더 좋아요'}.`
  }
  if (score >= 55) {
    return `기본적인 공간 활용은 됐어요. ${familySpace.evaluation} 수납 공간을 늘리면 효율이 더 올라갈 거예요.`
  }
  return `공간이 좁아서 효율적 활용이 중요해요. 수납 공간을 최대한 활용하시는 게 좋아요.`
}




