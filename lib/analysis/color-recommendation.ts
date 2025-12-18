/**
 * 색상 범위 제시 모듈
 * 
 * 명세서 요구사항:
 * - 색상을 추천하지 않음
 * - 색상을 하나로 단정하지 않음
 * - 선택 가능한 색의 범위만 제시
 * - 후회 가능성이 높은 제외 색 명시
 * - 색상 판단 기준은 decisionCriteria 하나만 사용
 */

import type { DecisionCriteria } from './decision-criteria'
import type { SpaceId } from '@/types/spaceProcess'

// 공간 타입 분류 (명세서: 거실 / 주방 / 방 / 욕실)
export type SpaceCategory = '거실' | '주방' | '방' | '욕실'

// 색상 범위 타입
export interface ColorRange {
  description: string  // "톤/명도/채도" 수준의 범위 표현
  examples?: string[]  // 참고용 예시 (선택사항)
}

// 색상 추천 결과
export interface ColorRecommendation {
  spaceCategory: SpaceCategory
  availableRanges: ColorRange[]  // 선택 가능한 색 범위 (2~4개)
  excludedColors: string[]  // 제외 색 (1개 이상)
  rangeDescription: string  // 색 범위 설명 문장
  excludedDescription: string  // 제외 색 설명 문장
}

/**
 * SpaceId를 공간 카테고리로 변환
 */
export function getSpaceCategory(spaceId: SpaceId): SpaceCategory {
  if (spaceId === 'living') return '거실'
  if (spaceId === 'kitchen') return '주방'
  if (spaceId === 'bathroom' || spaceId === 'masterBathroom' || spaceId === 'commonBathroom' || spaceId === 'bathroom3') {
    return '욕실'
  }
  // 나머지는 모두 '방'
  return '방'
}

/**
 * 평형 정보를 대분류로 변환
 */
export function getPyeongCategory(pyeong: number): '소형' | '중형' | '대형' {
  if (pyeong <= 20) return '소형'
  if (pyeong <= 40) return '중형'
  return '대형'
}

/**
 * 가족 구성에서 아이/반려동물 여부 확인
 */
export function hasChildrenOrPets(spaceInfo: {
  ageRanges?: string[]
  lifestyleTags?: string[]
}): boolean {
  const ageRanges = spaceInfo.ageRanges || []
  const lifestyleTags = spaceInfo.lifestyleTags || []
  
  // 아이 여부 확인
  const hasChildren = ageRanges.some(range => 
    range === 'baby' || range === 'child' || range === 'teen'
  )
  
  // 반려동물 여부 확인
  const hasPets = lifestyleTags.includes('hasPets')
  
  return hasChildren || hasPets
}

/**
 * 기준(decisionCriteria) 기반 색 범위 산출
 * 
 * @param criteria - 결정 기준
 * @param spaceCategory - 공간 카테고리
 * @param pyeongCategory - 평형 대분류
 * @param hasChildrenOrPets - 아이/반려동물 여부
 * @returns 색상 추천 결과
 */
export function getColorRecommendation(
  criteria: DecisionCriteria,
  spaceCategory: SpaceCategory,
  pyeongCategory: '소형' | '중형' | '대형',
  hasChildrenOrPets: boolean
): ColorRecommendation {
  // 기준별 색 범위 결정 로직
  let availableRanges: ColorRange[] = []
  let excludedColors: string[] = []
  
  switch (criteria) {
    case '아이 안전':
      // 아이 안전 기준: 밝고 명확한 색상 범위, 어두운 색 제외
      if (spaceCategory === '거실') {
        availableRanges = [
          { description: '밝은 톤 (명도 7 이상)', examples: ['아이보리', '연한 베이지', '밝은 그레이'] },
          { description: '중간 명도 (명도 5~7)', examples: ['베이지', '연한 브라운', '밝은 그린'] }
        ]
        excludedColors = ['어두운 색상 (명도 3 이하)', '강한 대비 색상']
      } else if (spaceCategory === '방') {
        availableRanges = [
          { description: '밝고 부드러운 톤 (명도 7 이상)', examples: ['파스텔 톤', '연한 블루', '연한 그린'] },
          { description: '중간 명도 (명도 5~7)', examples: ['밝은 베이지', '연한 그레이'] }
        ]
        excludedColors = ['어두운 색상', '강렬한 원색']
      } else if (spaceCategory === '주방') {
        availableRanges = [
          { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리', '연한 그레이'] },
          { description: '중간 명도 (명도 5~7)', examples: ['밝은 베이지', '연한 브라운'] }
        ]
        excludedColors = ['어두운 색상', '강한 대비 색상']
      } else { // 욕실
        availableRanges = [
          { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리', '연한 그레이'] },
          { description: '중간 명도 (명도 5~7)', examples: ['밝은 베이지', '연한 블루'] }
        ]
        excludedColors = ['어두운 색상', '미끄럼 위험 색상']
      }
      break
      
    case '정리 스트레스 최소화':
      // 정리 스트레스 최소화: 눈에 띄지 않는 색상 범위, 눈에 띄는 색 제외
      if (spaceCategory === '거실') {
        availableRanges = [
          { description: '중립 톤 (명도 5~7)', examples: ['베이지', '그레이', '연한 브라운'] },
          { description: '부드러운 톤 (명도 6~8)', examples: ['아이보리', '연한 그린', '연한 블루'] }
        ]
        excludedColors = ['강렬한 색상', '눈에 띄는 원색']
      } else if (spaceCategory === '방') {
        availableRanges = [
          { description: '중립 톤 (명도 5~7)', examples: ['베이지', '그레이', '연한 브라운'] },
          { description: '부드러운 톤 (명도 6~8)', examples: ['파스텔 톤', '연한 블루'] }
        ]
        excludedColors = ['강렬한 색상', '눈에 띄는 원색']
      } else if (spaceCategory === '주방') {
        availableRanges = [
          { description: '중립 톤 (명도 5~7)', examples: ['화이트', '그레이', '연한 브라운'] },
          { description: '부드러운 톤 (명도 6~8)', examples: ['아이보리', '연한 그린'] }
        ]
        excludedColors = ['강렬한 색상', '눈에 띄는 원색']
      } else { // 욕실
        availableRanges = [
          { description: '중립 톤 (명도 5~7)', examples: ['화이트', '그레이', '연한 블루'] },
          { description: '부드러운 톤 (명도 6~8)', examples: ['아이보리', '연한 그린'] }
        ]
        excludedColors = ['강렬한 색상', '눈에 띄는 원색']
      }
      break
      
    case '유지관리 부담 최소화':
      // 유지관리 부담 최소화: 오염이 잘 안 보이는 색상 범위, 오염이 잘 보이는 색 제외
      if (spaceCategory === '거실') {
        availableRanges = [
          { description: '중간 명도 (명도 5~7)', examples: ['베이지', '그레이', '연한 브라운'] },
          { description: '어두운 톤 (명도 3~5)', examples: ['다크 그레이', '어두운 브라운'] }
        ]
        excludedColors = ['밝은 화이트', '연한 파스텔']
      } else if (spaceCategory === '방') {
        availableRanges = [
          { description: '중간 명도 (명도 5~7)', examples: ['베이지', '그레이', '연한 브라운'] },
          { description: '어두운 톤 (명도 3~5)', examples: ['다크 그레이', '어두운 브라운'] }
        ]
        excludedColors = ['밝은 화이트', '연한 파스텔']
      } else if (spaceCategory === '주방') {
        availableRanges = [
          { description: '중간 명도 (명도 5~7)', examples: ['그레이', '연한 브라운', '베이지'] },
          { description: '어두운 톤 (명도 3~5)', examples: ['다크 그레이', '어두운 브라운'] }
        ]
        excludedColors = ['밝은 화이트', '연한 파스텔']
      } else { // 욕실
        availableRanges = [
          { description: '중간 명도 (명도 5~7)', examples: ['그레이', '연한 블루', '베이지'] },
          { description: '어두운 톤 (명도 3~5)', examples: ['다크 그레이', '어두운 블루'] }
        ]
        excludedColors = ['밝은 화이트', '연한 파스텔']
      }
      break
      
    case '공간 활용 효율':
      // 공간 활용 효율: 밝고 넓어 보이는 색상 범위, 어둡고 좁아 보이는 색 제외
      if (spaceCategory === '거실') {
        availableRanges = [
          { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리', '연한 그레이'] },
          { description: '중간 명도 (명도 5~7)', examples: ['베이지', '연한 브라운'] }
        ]
        excludedColors = ['어두운 색상 (명도 3 이하)', '강한 색상']
      } else if (spaceCategory === '방') {
        availableRanges = [
          { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리', '연한 그레이'] },
          { description: '중간 명도 (명도 5~7)', examples: ['베이지', '연한 브라운'] }
        ]
        excludedColors = ['어두운 색상 (명도 3 이하)', '강한 색상']
      } else if (spaceCategory === '주방') {
        availableRanges = [
          { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리', '연한 그레이'] },
          { description: '중간 명도 (명도 5~7)', examples: ['베이지', '연한 브라운'] }
        ]
        excludedColors = ['어두운 색상 (명도 3 이하)', '강한 색상']
      } else { // 욕실
        availableRanges = [
          { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리', '연한 그레이'] },
          { description: '중간 명도 (명도 5~7)', examples: ['밝은 베이지', '연한 블루'] }
        ]
        excludedColors = ['어두운 색상 (명도 3 이하)', '강한 색상']
      }
      break
      
    case '공사 범위 최소화':
      // 공사 범위 최소화: 표준 색상 범위, 특수 색상 제외
      if (spaceCategory === '거실') {
        availableRanges = [
          { description: '표준 톤 (명도 5~7)', examples: ['베이지', '그레이', '연한 브라운'] },
          { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리'] }
        ]
        excludedColors = ['특수 색상', '커스텀 색상']
      } else if (spaceCategory === '방') {
        availableRanges = [
          { description: '표준 톤 (명도 5~7)', examples: ['베이지', '그레이', '연한 브라운'] },
          { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리'] }
        ]
        excludedColors = ['특수 색상', '커스텀 색상']
      } else if (spaceCategory === '주방') {
        availableRanges = [
          { description: '표준 톤 (명도 5~7)', examples: ['그레이', '연한 브라운', '베이지'] },
          { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리'] }
        ]
        excludedColors = ['특수 색상', '커스텀 색상']
      } else { // 욕실
        availableRanges = [
          { description: '표준 톤 (명도 5~7)', examples: ['그레이', '연한 블루', '베이지'] },
          { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리'] }
        ]
        excludedColors = ['특수 색상', '커스텀 색상']
      }
      break
      
    case '예산 통제 우선':
      // 예산 통제 우선: 표준 색상 범위, 고가 색상 제외
      if (spaceCategory === '거실') {
        availableRanges = [
          { description: '표준 톤 (명도 5~7)', examples: ['베이지', '그레이', '연한 브라운'] },
          { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리'] }
        ]
        excludedColors = ['고가 색상', '특수 제작 색상']
      } else if (spaceCategory === '방') {
        availableRanges = [
          { description: '표준 톤 (명도 5~7)', examples: ['베이지', '그레이', '연한 브라운'] },
          { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리'] }
        ]
        excludedColors = ['고가 색상', '특수 제작 색상']
      } else if (spaceCategory === '주방') {
        availableRanges = [
          { description: '표준 톤 (명도 5~7)', examples: ['그레이', '연한 브라운', '베이지'] },
          { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리'] }
        ]
        excludedColors = ['고가 색상', '특수 제작 색상']
      } else { // 욕실
        availableRanges = [
          { description: '표준 톤 (명도 5~7)', examples: ['그레이', '연한 블루', '베이지'] },
          { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리'] }
        ]
        excludedColors = ['고가 색상', '특수 제작 색상']
      }
      break
      
    case '동선 단순화':
      // 동선 단순화: 중립 색상 범위, 강한 대비 색 제외
      if (spaceCategory === '거실') {
        availableRanges = [
          { description: '중립 톤 (명도 5~7)', examples: ['베이지', '그레이', '연한 브라운'] },
          { description: '부드러운 톤 (명도 6~8)', examples: ['아이보리', '연한 그린'] }
        ]
        excludedColors = ['강한 대비 색상', '눈에 띄는 원색']
      } else if (spaceCategory === '방') {
        availableRanges = [
          { description: '중립 톤 (명도 5~7)', examples: ['베이지', '그레이', '연한 브라운'] },
          { description: '부드러운 톤 (명도 6~8)', examples: ['파스텔 톤', '연한 블루'] }
        ]
        excludedColors = ['강한 대비 색상', '눈에 띄는 원색']
      } else if (spaceCategory === '주방') {
        availableRanges = [
          { description: '중립 톤 (명도 5~7)', examples: ['그레이', '연한 브라운', '베이지'] },
          { description: '부드러운 톤 (명도 6~8)', examples: ['아이보리', '연한 그린'] }
        ]
        excludedColors = ['강한 대비 색상', '눈에 띄는 원색']
      } else { // 욕실
        availableRanges = [
          { description: '중립 톤 (명도 5~7)', examples: ['그레이', '연한 블루', '베이지'] },
          { description: '부드러운 톤 (명도 6~8)', examples: ['아이보리', '연한 그린'] }
        ]
        excludedColors = ['강한 대비 색상', '눈에 띄는 원색']
      }
      break
      
    default:
      // fallback: 공간 활용 효율과 동일
      availableRanges = [
        { description: '밝은 톤 (명도 7 이상)', examples: ['화이트', '아이보리', '연한 그레이'] },
        { description: '중간 명도 (명도 5~7)', examples: ['베이지', '연한 브라운'] }
      ]
      excludedColors = ['어두운 색상 (명도 3 이하)', '강한 색상']
  }
  
  // 아이/반려동물이 있으면 추가 제외 색 조정
  if (hasChildrenOrPets) {
    // 강렬한 색상 추가 제외
    if (!excludedColors.some(c => c.includes('강렬') || c.includes('원색'))) {
      excludedColors.push('강렬한 원색')
    }
  }
  
  // 색 범위 설명 문장 생성 (명세서 템플릿)
  const rangeDescriptions = availableRanges.map(r => r.description).join(', ')
  const rangeDescription = `${criteria} 기준으로 보면,\n이 공간은\n${rangeDescriptions} 안에서 선택할 때\n결정이 가장 단순해집니다.`
  
  // 제외 색 설명 문장 생성 (명세서 템플릿)
  const excludedList = excludedColors.join(', ')
  const excludedDescription = `반대로,\n${excludedList}은\n지금 기준(${criteria})에서는\n후회 가능성이 커질 수 있어\n피하는 편이 안전합니다.`
  
  return {
    spaceCategory,
    availableRanges,
    excludedColors,
    rangeDescription,
    excludedDescription,
  }
}

/**
 * 공간별 색상 추천 결과 생성 (공간별로 분리 실행)
 * 
 * @param criteria - 결정 기준
 * @param spaceIds - 선택된 공간 ID 목록
 * @param spaceInfo - 집 정보 (평수, 가족 구성 등)
 * @returns 공간별 색상 추천 결과 목록
 */
export function getColorRecommendationsForSpaces(
  criteria: DecisionCriteria,
  spaceIds: SpaceId[],
  spaceInfo: {
    pyeong?: number
    ageRanges?: string[]
    lifestyleTags?: string[]
  }
): ColorRecommendation[] {
  const pyeongCategory = getPyeongCategory(spaceInfo.pyeong || 30)
  const hasChildrenOrPetsFlag = hasChildrenOrPets(spaceInfo)
  
  // 공간별로 색상 추천 생성
  const recommendations: ColorRecommendation[] = []
  
  for (const spaceId of spaceIds) {
    const spaceCategory = getSpaceCategory(spaceId)
    
    // 이미 같은 카테고리의 추천이 있으면 스킵 (같은 카테고리는 동일한 결과)
    const existingCategory = recommendations.find(r => r.spaceCategory === spaceCategory)
    if (existingCategory) {
      continue
    }
    
    const recommendation = getColorRecommendation(
      criteria,
      spaceCategory,
      pyeongCategory,
      hasChildrenOrPetsFlag
    )
    
    recommendations.push(recommendation)
  }
  
  return recommendations
}












