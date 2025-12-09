/**
 * MBTI, 혈액형, 별자리 기반 성향 분석 로직
 */

export interface VibeInput {
  mbti?: string
  bloodType?: string
  zodiac?: string
}

export interface TraitScore {
  요리빈도: number
  정리정돈: number
  청소성향: number
  조명취향: number
  예산감각: number
}

/**
 * MBTI 기반 성향 점수 매핑
 */
const MBTI_TRAITS: Record<string, Partial<TraitScore>> = {
  // 외향형 (E)
  ENFJ: { 요리빈도: 80, 정리정돈: 70, 청소성향: 75, 조명취향: 85, 예산감각: 65 },
  ENFP: { 요리빈도: 75, 정리정돈: 50, 청소성향: 55, 조명취향: 90, 예산감각: 60 },
  ENTJ: { 요리빈도: 70, 정리정돈: 85, 청소성향: 80, 조명취향: 75, 예산감각: 80 },
  ENTP: { 요리빈도: 65, 정리정돈: 55, 청소성향: 60, 조명취향: 80, 예산감각: 70 },
  ESFJ: { 요리빈도: 85, 정리정돈: 80, 청소성향: 85, 조명취향: 70, 예산감각: 65 },
  ESFP: { 요리빈도: 80, 정리정돈: 60, 청소성향: 65, 조명취향: 85, 예산감각: 55 },
  ESTJ: { 요리빈도: 75, 정리정돈: 90, 청소성향: 90, 조명취향: 65, 예산감각: 75 },
  ESTP: { 요리빈도: 70, 정리정돈: 65, 청소성향: 70, 조명취향: 75, 예산감각: 65 },
  
  // 내향형 (I)
  INFJ: { 요리빈도: 70, 정리정돈: 75, 청소성향: 80, 조명취향: 80, 예산감각: 70 },
  INFP: { 요리빈도: 65, 정리정돈: 55, 청소성향: 60, 조명취향: 85, 예산감각: 65 },
  INTJ: { 요리빈도: 60, 정리정돈: 80, 청소성향: 75, 조명취향: 70, 예산감각: 85 },
  INTP: { 요리빈도: 55, 정리정돈: 60, 청소성향: 65, 조명취향: 75, 예산감각: 75 },
  ISFJ: { 요리빈도: 80, 정리정돈: 85, 청소성향: 90, 조명취향: 65, 예산감각: 70 },
  ISFP: { 요리빈도: 75, 정리정돈: 65, 청소성향: 70, 조명취향: 80, 예산감각: 60 },
  ISTJ: { 요리빈도: 70, 정리정돈: 95, 청소성향: 95, 조명취향: 60, 예산감각: 80 },
  ISTP: { 요리빈도: 65, 정리정돈: 70, 청소성향: 75, 조명취향: 70, 예산감각: 70 },
}

/**
 * 혈액형 기반 성향 점수 매핑
 */
const BLOOD_TYPE_TRAITS: Record<string, Partial<TraitScore>> = {
  A: { 요리빈도: 75, 정리정돈: 85, 청소성향: 90, 조명취향: 70, 예산감각: 75 },
  B: { 요리빈도: 70, 정리정돈: 60, 청소성향: 65, 조명취향: 85, 예산감각: 65 },
  O: { 요리빈도: 80, 정리정돈: 70, 청소성향: 75, 조명취향: 75, 예산감각: 70 },
  AB: { 요리빈도: 65, 정리정돈: 75, 청소성향: 70, 조명취향: 80, 예산감각: 80 },
}

/**
 * 별자리 기반 성향 점수 매핑
 */
const ZODIAC_TRAITS: Record<string, Partial<TraitScore>> = {
  // 불의 별자리 (양자리, 사자자리, 사수자리)
  aries: { 요리빈도: 75, 정리정돈: 65, 청소성향: 70, 조명취향: 85, 예산감각: 65 },
  leo: { 요리빈도: 80, 정리정돈: 70, 청소성향: 75, 조명취향: 90, 예산감각: 60 },
  sagittarius: { 요리빈도: 70, 정리정돈: 60, 청소성향: 65, 조명취향: 85, 예산감각: 70 },
  
  // 흙의 별자리 (황소자리, 처녀자리, 염소자리)
  taurus: { 요리빈도: 85, 정리정돈: 80, 청소성향: 85, 조명취향: 70, 예산감각: 80 },
  virgo: { 요리빈도: 75, 정리정돈: 95, 청소성향: 95, 조명취향: 65, 예산감각: 85 },
  capricorn: { 요리빈도: 70, 정리정돈: 90, 청소성향: 90, 조명취향: 60, 예산감각: 90 },
  
  // 공기의 별자리 (쌍둥이자리, 천칭자리, 물병자리)
  gemini: { 요리빈도: 65, 정리정돈: 55, 청소성향: 60, 조명취향: 85, 예산감각: 65 },
  libra: { 요리빈도: 75, 정리정돈: 70, 청소성향: 75, 조명취향: 90, 예산감각: 70 },
  aquarius: { 요리빈도: 60, 정리정돈: 65, 청소성향: 70, 조명취향: 85, 예산감각: 75 },
  
  // 물의 별자리 (게자리, 전갈자리, 물고기자리)
  cancer: { 요리빈도: 90, 정리정돈: 80, 청소성향: 85, 조명취향: 75, 예산감각: 70 },
  scorpio: { 요리빈도: 75, 정리정돈: 85, 청소성향: 90, 조명취향: 80, 예산감각: 80 },
  pisces: { 요리빈도: 70, 정리정돈: 65, 청소성향: 70, 조명취향: 85, 예산감각: 65 },
}

/**
 * MBTI, 혈액형, 별자리를 종합하여 성향 점수 계산
 */
export function analyzeVibeTraits(input: VibeInput): TraitScore {
  const scores: TraitScore = {
    요리빈도: 50,
    정리정돈: 50,
    청소성향: 50,
    조명취향: 50,
    예산감각: 50,
  }

  let count = 0

  // MBTI 점수 반영 (가중치: 40%)
  if (input.mbti && MBTI_TRAITS[input.mbti.toUpperCase()]) {
    const mbtiScores = MBTI_TRAITS[input.mbti.toUpperCase()]
    Object.keys(scores).forEach((key) => {
      const traitKey = key as keyof TraitScore
      if (mbtiScores[traitKey] !== undefined) {
        scores[traitKey] += (mbtiScores[traitKey]! - 50) * 0.4
      }
    })
    count++
  }

  // 혈액형 점수 반영 (가중치: 30%)
  if (input.bloodType && BLOOD_TYPE_TRAITS[input.bloodType.toUpperCase()]) {
    const bloodScores = BLOOD_TYPE_TRAITS[input.bloodType.toUpperCase()]
    Object.keys(scores).forEach((key) => {
      const traitKey = key as keyof TraitScore
      if (bloodScores[traitKey] !== undefined) {
        scores[traitKey] += (bloodScores[traitKey]! - 50) * 0.3
      }
    })
    count++
  }

  // 별자리 점수 반영 (가중치: 30%)
  if (input.zodiac && ZODIAC_TRAITS[input.zodiac.toLowerCase()]) {
    const zodiacScores = ZODIAC_TRAITS[input.zodiac.toLowerCase()]
    Object.keys(scores).forEach((key) => {
      const traitKey = key as keyof TraitScore
      if (zodiacScores[traitKey] !== undefined) {
        scores[traitKey] += (zodiacScores[traitKey]! - 50) * 0.3
      }
    })
    count++
  }

  // 점수를 0-100 범위로 제한
  Object.keys(scores).forEach((key) => {
    const traitKey = key as keyof TraitScore
    scores[traitKey] = Math.max(0, Math.min(100, Math.round(scores[traitKey])))
  })

  return scores
}

/**
 * 성향 점수를 바탕으로 설명 생성
 */
export function generateVibeDescription(input: VibeInput, scores: TraitScore): string {
  const parts: string[] = []

  if (input.mbti) {
    parts.push(`MBTI ${input.mbti.toUpperCase()} 유형`)
  }
  if (input.bloodType) {
    parts.push(`${input.bloodType.toUpperCase()}형`)
  }
  if (input.zodiac) {
    const zodiacNames: Record<string, string> = {
      aries: '양자리',
      taurus: '황소자리',
      gemini: '쌍둥이자리',
      cancer: '게자리',
      leo: '사자자리',
      virgo: '처녀자리',
      libra: '천칭자리',
      scorpio: '전갈자리',
      sagittarius: '사수자리',
      capricorn: '염소자리',
      aquarius: '물병자리',
      pisces: '물고기자리',
    }
    parts.push(zodiacNames[input.zodiac.toLowerCase()] || input.zodiac)
  }

  const profile = parts.length > 0 ? parts.join(' · ') : '기본 프로필'

  let description = `${profile}의 성향 분석 결과입니다.\n\n`

  // 가장 높은 점수와 낮은 점수 찾기
  const sortedTraits = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const highest = sortedTraits[0]
  const lowest = sortedTraits[sortedTraits.length - 1]

  const traitDescriptions: Record<string, string> = {
    요리빈도: '요리와 주방 활용',
    정리정돈: '정리정돈과 수납',
    청소성향: '청소와 관리',
    조명취향: '조명과 분위기',
    예산감각: '예산 관리',
  }

  description += `특히 ${traitDescriptions[highest[0]]}에 대한 관심이 높으며, `
  description += `${traitDescriptions[lowest[0]]}은 상대적으로 덜 중요하게 생각하시는 편입니다.`

  return description
}











