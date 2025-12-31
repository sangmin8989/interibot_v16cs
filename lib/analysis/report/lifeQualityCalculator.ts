/**
 * 생활 안정지수 계산기
 * 
 * 인테리어가 일상 생활의 편의성, 만족도, 건강에 얼마나 기여하는지 예측
 */

import type { ReportInput, LifeQualityResult } from './types'

/**
 * 생활 안정지수 계산
 */
export function calculateLifeQualityIndex(input: ReportInput): LifeQualityResult {
  const baseScore = 30
  
  // 1. 라이프스타일 매칭 점수 (0~30점)
  const lifestyleMatch = calculateLifestyleMatch(input)
  
  // 2. 가족 맞춤 점수 (0~15점)
  const familyMatch = calculateFamilyMatch(input)
  
  // 3. 건강 요소 점수 (0~15점)
  const health = calculateHealthScore(input)
  
  // 4. 편의 기능 점수 (0~10점)
  const convenience = calculateConvenienceScore(input)
  
  // 합계 계산
  const totalScore = baseScore + 
    lifestyleMatch.score + 
    familyMatch.score + 
    health.score + 
    convenience.score
  
  // 최소/최대 점수 제한
  const finalScore = Math.max(30, Math.min(100, totalScore))
  
  // 예상 생활 변화 계산
  const lifeChanges = predictLifeChanges(input, finalScore)
  
  // AI 메시지 생성
  const message = generateLifeQualityMessage(finalScore, lifestyleMatch, familyMatch)
  
  return {
    score: Math.round(finalScore),
    factors: {
      lifestyleMatch: {
        score: lifestyleMatch.score,
        details: lifestyleMatch.details
      },
      familyMatch: {
        score: familyMatch.score,
        message: familyMatch.message,
        improvement: familyMatch.improvement
      },
      health: {
        score: health.score,
        factors: health.factors
      },
      convenience: {
        score: convenience.score,
        features: convenience.features
      }
    },
    lifeChanges,
    message,
  }
}

/**
 * 라이프스타일 매칭 점수 (0~30점)
 */
function calculateLifestyleMatch(input: ReportInput): { 
  score: number
  details: Array<{ category: string; score: number; message: string; improvement?: string }>
} {
  const details: Array<{ category: string; score: number; message: string; improvement?: string }> = []
  let totalScore = 0
  
  // 요리 빈도 매칭
  const cookingMatch = calculateCookingMatch(
    input.lifestyle.cookingFrequency,
    input.kitchenGrade || input.grade,
    input.selectedProcesses.includes('주방')
  )
  details.push({
    category: '요리 빈도 매칭',
    score: cookingMatch.score,
    message: cookingMatch.message,
    improvement: cookingMatch.improvement
  })
  totalScore += cookingMatch.score
  
  // 청소 성향 매칭
  const cleaningMatch = calculateCleaningMatch(
    input.lifestyle.cleaningStyle,
    input.floorType || '',
    input.colorTone || ''
  )
  details.push({
    category: '청소 성향 매칭',
    score: cleaningMatch.score,
    message: cleaningMatch.message,
    improvement: cleaningMatch.improvement
  })
  totalScore += cleaningMatch.score
  
  // 소음 민감도 매칭
  const noiseMatch = calculateNoiseMatch(
    input.lifestyle.noiseSensitivity,
    input.hasDoor || false,
    input.doorType || '',
    input.hasSash || false,
    input.sashType || ''
  )
  details.push({
    category: '소음 민감도 매칭',
    score: noiseMatch.score,
    message: noiseMatch.message,
    improvement: noiseMatch.improvement
  })
  totalScore += noiseMatch.score
  
  return {
    score: Math.min(30, totalScore),
    details
  }
}

/**
 * 요리 빈도 매칭
 */
function calculateCookingMatch(
  cookingFrequency: string,
  kitchenGrade: string,
  hasKitchen: boolean
): { score: number; message: string; improvement: string } {
  if (!hasKitchen) {
    return { score: 0, message: '주방 공사 미포함', improvement: '' }
  }
  
  const matrix: Record<string, Record<string, { score: number; message: string }>> = {
    'daily': {
      'OPUS': { score: 10, message: '매일 요리하시니까 프리미엄 주방이 삶의 질을 확 높여요' },
      'STANDARD': { score: 8, message: '요리 자주 하시는데 주방 투자가 적절해요' },
      'ESSENTIAL': { score: 4, message: '요리를 많이 하시는데 주방 등급을 올리면 훨씬 편해져요' },
    },
    'often': {
      'OPUS': { score: 7, message: '주방에 약간 과투자일 수 있지만 요리가 즐거워질 거예요' },
      'STANDARD': { score: 9, message: '요리 빈도에 딱 맞는 주방이에요' },
      'ESSENTIAL': { score: 6, message: '가끔 요리하시면 이 정도면 충분해요' },
    },
    'sometimes': {
      'OPUS': { score: 5, message: '주방보다 다른 공간에 투자하는 게 나을 수 있어요' },
      'STANDARD': { score: 8, message: '적당한 주방 구성이에요' },
      'ESSENTIAL': { score: 9, message: '요리 빈도에 맞는 효율적인 선택이에요' },
    },
    'rarely': {
      'OPUS': { score: 3, message: '거의 요리 안 하시면 주방 과투자예요' },
      'STANDARD': { score: 6, message: '주방 대신 다른 공간 투자를 고려해보세요' },
      'ESSENTIAL': { score: 10, message: '현명한 선택이에요. 주방 최소 투자로 다른 곳에 집중하세요' },
    },
  }
  
  const result = matrix[cookingFrequency]?.[kitchenGrade] || { score: 5, message: '' }
  
  const improvement = cookingFrequency === 'daily' && kitchenGrade === 'ESSENTIAL'
    ? '주방 상판만 업그레이드해도 요리 시간이 30% 단축돼요'
    : ''
    
  return { ...result, improvement }
}

/**
 * 청소 성향 매칭
 */
function calculateCleaningMatch(
  cleaningStyle: string,
  floorType: string,
  colorTone: string
): { score: number; message: string; improvement: string } {
  // 청소 편한 조합 점수
  const easyCleaningCombo = (floorType === '강마루' || floorType === '장판') && 
                           (colorTone === '그레이' || colorTone === '베이지')
  
  if (cleaningStyle === 'lazy' || cleaningStyle === 'robot') {
    if (easyCleaningCombo) {
      return {
        score: 10,
        message: '청소 귀찮아하시는 분께 딱 맞는 자재 조합이에요',
        improvement: '청소 시간이 50% 이상 줄어들 거예요'
      }
    }
    if (floorType === '원목마루') {
      return {
        score: 3,
        message: '원목마루는 관리가 많이 필요해서 청소 부담이 커질 수 있어요',
        improvement: '강마루로 변경하면 관리가 훨씬 편해져요'
      }
    }
  }
  
  if (cleaningStyle === 'daily') {
    return {
      score: 8,
      message: '매일 청소하시니까 어떤 자재든 잘 관리하실 거예요',
      improvement: ''
    }
  }
  
  return { score: 6, message: '적당한 조합이에요', improvement: '' }
}

/**
 * 소음 민감도 매칭
 */
function calculateNoiseMatch(
  noiseSensitivity: string,
  hasDoor: boolean,
  doorType: string,
  hasSash: boolean,
  sashType: string
): { score: number; message: string; improvement: string } {
  if (noiseSensitivity === 'high') {
    let score = 0
    const reasons: string[] = []
    
    if (hasDoor && (doorType === '자동' || doorType === '슬림')) {
      score += 5
      reasons.push('중문으로 현관 소음 차단')
    }
    if (hasSash && (sashType === '이중' || sashType === '시스템')) {
      score += 5
      reasons.push('샤시로 외부 소음 차단')
    }
    
    if (score >= 8) {
      return {
        score: 10,
        message: '소음에 민감하신 분께 완벽한 방음 구성이에요',
        improvement: '조용한 집에서 숙면하실 수 있어요'
      }
    }
    
    return {
      score: score + 2,
      message: '소음에 민감하신데 방음 투자가 부족해요',
      improvement: score < 5 ? '중문 추가로 체감 소음 40% 감소' : '샤시 업그레이드로 외부 소음 차단'
    }
  }
  
  return { score: 8, message: '소음에 크게 민감하지 않으시네요', improvement: '' }
}

/**
 * 가족 맞춤 점수 (0~15점)
 */
function calculateFamilyMatch(input: ReportInput): { 
  score: number
  message: string
  improvement: string
} {
  let score = 0
  let message = ''
  let improvement = ''
  
  const familyType = input.familyType
  const selectedProcesses = input.selectedProcesses
  const grade = input.grade
  const options = input.options || []
  
  if (familyType.includes('1인') || familyType === '1인') {
    // 1인 가구: 수납, 서재 중요
    if (selectedProcesses.includes('붙박이장') || selectedProcesses.includes('수납')) {
      score += 8
      message = '혼자 사시니까 수납 공간을 잘 챙기셨어요'
    }
    if (options.includes('서재') || options.includes('작업공간')) {
      score += 5
      message += ' 개인 공간도 확보됐네요'
    }
  }
  
  if (familyType.includes('2인') || familyType === '신혼' || familyType === '2인') {
    // 신혼: 주방, 드레스룸
    if (selectedProcesses.includes('주방')) {
      score += 6
      message = '함께 요리하기 좋은 주방이에요'
    }
    if (selectedProcesses.includes('드레스룸') || options.includes('드레스룸')) {
      score += 5
      message += ' 드레스룸으로 수납 고민 해결'
    }
  }
  
  if (familyType.includes('아이') || familyType.includes('3') || familyType.includes('4')) {
    // 자녀 가정: 수납, 안전, 내구성
    if (selectedProcesses.includes('붙박이장') || selectedProcesses.includes('수납')) {
      score += 5
    }
    if (grade === 'STANDARD' || grade === 'OPUS') {
      score += 5  // 내구성 있는 자재
    }
    if (options.includes('안전마감') || options.includes('모서리처리')) {
      score += 5
    }
    message = '아이 있는 가정에 맞게 안전하고 튼튼하게 구성됐어요'
    improvement = score < 12 ? '아이방 수납장 추가하면 정리가 훨씬 편해져요' : ''
  }
  
  if (familyType.includes('반려') || familyType.includes('5인')) {
    // 반려동물/대가족: 내구성, 청소 용이
    const hasStrongFloor = selectedProcesses.includes('바닥재') && grade !== 'OPUS'  // 원목 X
    if (hasStrongFloor) {
      score += 7
      message = '반려동물/대가족에 맞게 튼튼한 자재로 구성됐어요'
    }
    if (selectedProcesses.includes('붙박이장')) {
      score += 5
    }
  }
  
  return { 
    score: Math.min(15, score), 
    message: message || '가족 구성에 맞는 인테리어예요',
    improvement 
  }
}

/**
 * 건강 요소 점수 (0~15점)
 */
function calculateHealthScore(input: ReportInput): { 
  score: number
  factors: Array<{ item: string; score: number; reason: string }>
} {
  const factors: Array<{ item: string; score: number; reason: string }> = []
  let total = 0
  
  // 샤시
  if (input.hasSash && (input.sashType === '이중' || input.sashType === '시스템')) {
    factors.push({
      item: '이중/시스템 샤시',
      score: 5,
      reason: '결로 방지로 곰팡이 예방, 호흡기 건강에 좋아요'
    })
    total += 5
  }
  
  // 친환경 자재
  if (input.grade === 'STANDARD' || input.grade === 'OPUS') {
    factors.push({
      item: '친환경 자재 (E0등급)',
      score: 4,
      reason: '새집증후군 걱정 없는 친환경 자재예요'
    })
    total += 4
  }
  
  // 욕실 환기
  if (input.selectedProcesses.includes('욕실') && input.grade !== 'ESSENTIAL') {
    factors.push({
      item: '욕실 환기 시스템',
      score: 3,
      reason: '곰팡이 방지로 피부/호흡기 건강에 좋아요'
    })
    total += 3
  }
  
  // 조명
  if (input.options?.includes('조광') || input.options?.includes('색온도')) {
    factors.push({
      item: '색온도 조절 조명',
      score: 2,
      reason: '저녁에는 따뜻한 빛으로 숙면에 도움돼요'
    })
    total += 2
  }
  
  // 바닥 난방
  if (input.selectedProcesses.includes('바닥재')) {
    factors.push({
      item: '바닥 난방 효율',
      score: 1,
      reason: '바닥 난방 효율로 겨울 관절 건강에 좋아요'
    })
    total += 1
  }
  
  return { score: Math.min(15, total), factors }
}

/**
 * 편의 기능 점수 (0~10점)
 */
function calculateConvenienceScore(input: ReportInput): { 
  score: number
  features: string[]
} {
  let score = 0
  const features: string[] = []
  const options = input.options || []
  
  if (options.includes('스마트홈')) {
    score += 3
    features.push('스마트홈으로 조명/가전 원격 제어')
  }
  if (options.includes('자동중문')) {
    score += 2
    features.push('자동 중문으로 손 안 대고 열림')
  }
  if (options.includes('빌트인')) {
    score += 2
    features.push('빌트인 가전으로 주방 동선 효율화')
  }
  if (options.includes('시스템에어컨')) {
    score += 2
    features.push('시스템 에어컨으로 쾌적한 실내')
  }
  if (options.includes('USB콘센트')) {
    score += 1
    features.push('USB 콘센트로 충전 편리')
  }
  
  return { score: Math.min(10, score), features }
}

/**
 * 예상 생활 변화 계산
 */
function predictLifeChanges(
  input: ReportInput,
  lifeQualityScore: number
): Array<{
  category: string
  before: string
  after: string
  changePercent: number
  unit: string
}> {
  const changes: Array<{
    category: string
    before: string
    after: string
    changePercent: number
    unit: string
  }> = []
  
  // 요리 시간 변화
  if (input.lifestyle.cookingFrequency === 'daily' && 
      input.selectedProcesses.includes('주방')) {
    const kitchenGrade = input.kitchenGrade || input.grade
    let timeReduction = 0
    if (kitchenGrade === 'OPUS') timeReduction = 40
    else if (kitchenGrade === 'STANDARD') timeReduction = 25
    else timeReduction = 10
    
    changes.push({
      category: '요리 준비 시간',
      before: '45분',
      after: `${Math.round(45 * (1 - timeReduction/100))}분`,
      changePercent: -timeReduction,
      unit: '분'
    })
  }
  
  // 청소 시간 변화
  if (input.lifestyle.cleaningStyle === 'lazy') {
    const floorGrade = input.grade
    let cleanReduction = 0
    if (floorGrade === 'STANDARD') cleanReduction = 50  // 강마루
    else if (floorGrade === 'ESSENTIAL') cleanReduction = 40
    else cleanReduction = 30  // 원목은 관리 필요
    
    changes.push({
      category: '주말 청소 시간',
      before: '2시간',
      after: `${Math.round(120 * (1 - cleanReduction/100))}분`,
      changePercent: -cleanReduction,
      unit: '분'
    })
  }
  
  // 수납 스트레스
  if (input.selectedProcesses.includes('붙박이장') || 
      input.selectedProcesses.includes('수납')) {
    changes.push({
      category: '수납 스트레스',
      before: '높음',
      after: '낮음',
      changePercent: -60,
      unit: ''
    })
  }
  
  // 집 만족도
  changes.push({
    category: '집 만족도',
    before: '★★☆☆☆',
    after: lifeQualityScore >= 80 ? '★★★★★' : 
           lifeQualityScore >= 60 ? '★★★★☆' : '★★★☆☆',
    changePercent: Math.round((lifeQualityScore - 40) / 40 * 100),
    unit: ''
  })
  
  return changes
}

/**
 * AI 메시지 생성
 */
function generateLifeQualityMessage(
  score: number,
  lifestyleMatch: { score: number; details: any[] },
  familyMatch: { score: number; message: string; improvement: string }
): string {
  if (score >= 85) {
    return `생활의 질이 크게 향상될 거예요. 라이프스타일에 완벽하게 맞춰진 인테리어로 일상이 훨씬 편해질 거예요.`
  }
  if (score >= 70) {
    return `생활 편의성이 크게 개선될 거예요. ${familyMatch.message} ${lifestyleMatch.details[0]?.message || ''}`
  }
  if (score >= 55) {
    return `기본적인 생활 편의는 확보됐어요. ${familyMatch.improvement || '추가 투자로 더 편리해질 수 있어요'}.`
  }
  return `필수 기능 위주로 구성됐어요. 생활 편의를 위해 추가 공정을 고려해보세요.`
}




