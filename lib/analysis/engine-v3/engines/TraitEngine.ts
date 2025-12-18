/**
 * V3 성향 엔진 (TraitEngine)
 * 
 * 고객의 질문 답변을 기반으로 12개 성향 지표를 계산합니다.
 * 
 * 처리 흐름:
 * 1. 질문 답변 정규화
 * 2. 질문 기준표 로드
 * 3. 12개 지표 계산 (답변별 영향 누적)
 * 4. 키워드 추출
 * 5. 우선 문제 영역 도출
 * 6. 생활 루틴 유형 판단
 */

import {
  TraitEngineInput,
  TraitEngineResult,
  TraitIndicators12,
  LifestyleType,
  QuestionDefinition
} from '../types'
import { loadQuestionCriteria } from '../utils/dataLoader'
import {
  createDefaultIndicators,
  validateAllIndicators,
  validateIndicatorRange,
  getTopIndicators,
  scoreToLevel
} from '../utils/scoreValidator'
import { getAnswerImpacts, type AnswerImpact } from '../../answer-mappings'

export class TraitEngine {
  /**
   * 성향 분석 메인 함수
   */
  async analyze(input: TraitEngineInput): Promise<TraitEngineResult> {
    console.log('🔍 [TraitEngine] 성향 분석 시작')
    const startTime = Date.now()

    try {
      // 1. 질문 기준표 로드
      const criteria = await loadQuestionCriteria()

      // 2. 초기 지표 생성 (모두 50점)
      let indicators = createDefaultIndicators()

      // 3. 키워드 수집
      const keywords = new Set<string>()

      // 4. 생활 루틴 유형 후보
      const lifestyleTypes: LifestyleType[] = []

      // 5. 답변별 영향 적용
      for (const [questionId, answerId] of Object.entries(input.answers)) {
        // 먼저 answer-mappings.ts에서 찾기 (판단 축 질문 등)
        let impact: any = null
        const answerMappingsImpacts = getAnswerImpacts(questionId, answerId)
        
        if (answerMappingsImpacts && answerMappingsImpacts.length > 0) {
          // answer-mappings 형식을 TraitEngine 형식으로 변환
          impact = this.convertAnswerMappingsToImpact(answerMappingsImpacts)
        } else {
          // answer-mappings에 없으면 질문 기준표에서 찾기
          impact = this.getAnswerImpact(criteria, questionId, answerId)
        }
        
        if (impact) {
          // 지표 점수 변화 적용
          if (impact.indicators) {
            for (const [indicator, change] of Object.entries(impact.indicators)) {
              const key = indicator as keyof TraitIndicators12
              const currentValue = indicators[key]
              // 타입 가드: change가 ImpactValue 객체인지 확인
              if (change && typeof change === 'object' && 'value' in change) {
                const newValue = currentValue + (change.value as number)
                indicators[key] = validateIndicatorRange(key, newValue)
              } else if (typeof change === 'number') {
                // answer-mappings에서 온 경우 직접 숫자일 수 있음
                const newValue = currentValue + change
                indicators[key] = validateIndicatorRange(key, newValue)
              }
            }
          }

          // 키워드 수집
          if (impact.keywords) {
            impact.keywords.forEach((kw: string) => keywords.add(kw))
          }

          // 생활 루틴 유형 수집
          if (impact.lifestyleType) {
            lifestyleTypes.push(impact.lifestyleType)
          }
        } else {
          console.warn(`[TraitEngine] 답변 영향 없음: ${questionId} → ${answerId}`)
        }
      }

      // 6. 최종 검증
      indicators = validateAllIndicators(indicators)

      // 7. SpaceInfo 기반 추가 조정
      indicators = this.adjustBySpaceInfo(indicators, input.spaceInfo)

      // 8. VibeInput 기반 추가 조정 (옵션)
      if (input.vibeInput) {
        indicators = this.adjustByVibeInput(indicators, input.vibeInput)
      }

      // 9. 우선 문제 영역 도출
      const priorityAreas = this.identifyPriorityAreas(indicators)

      // 10. 생활 루틴 유형 판단
      const lifestyleType = this.determineLifestyleType(lifestyleTypes)

      // 11. 키워드 최종 정리 (상위 7개)
      const finalKeywords = Array.from(keywords).slice(0, 7)

      const executionTime = Date.now() - startTime
      console.log(`✅ [TraitEngine] 성향 분석 완료 (${executionTime}ms)`)

      return {
        indicators,
        keywords: finalKeywords,
        priorityAreas,
        lifestyleType
      }
    } catch (error) {
      console.error('❌ [TraitEngine] 성향 분석 오류:', error)
      
      // Fallback: 기본 결과 반환
      return {
        indicators: createDefaultIndicators(),
        keywords: ['일반'],
        priorityAreas: ['거실', '주방'],
        lifestyleType: 'general'
      }
    }
  }

  /**
   * 질문 기준표에서 답변의 영향 가져오기
   */
  private getAnswerImpact(
    criteria: any,
    questionId: string,
    answerId: string
  ): any | null {
    // quick/standard/deep 모드 순회
    for (const mode of ['quick', 'standard', 'deep']) {
      const questions = criteria.questions[mode]
      
      for (const [qId, question] of Object.entries(questions) as Array<[string, QuestionDefinition]>) {
        if (question.id === questionId || qId === questionId) {
          const option = question.options[answerId]
          if (option && option.impact) {
            return option.impact
          }
        }
      }
    }

    // 경고는 상위에서 출력하므로 여기서는 null만 반환
    return null
  }

  /**
   * answer-mappings 형식을 TraitEngine 형식으로 변환
   */
  private convertAnswerMappingsToImpact(answerMappingsImpacts: AnswerImpact[]): any {
    const indicators: Record<string, { value: number }> = {}
    
    // answer-mappings의 score(1-10)를 TraitEngine의 value(-50~+50)로 변환
    // score 1-10을 -50~+50 범위로 매핑: (score - 5.5) * 10
    answerMappingsImpacts.forEach(({ category, score }) => {
      // PreferenceCategory를 TraitIndicators12 키로 매핑
      const indicatorKey = this.mapCategoryToIndicator(category)
      if (indicatorKey) {
        // score 1-10을 -50~+50 범위로 변환
        const value = (score - 5.5) * 10
        indicators[indicatorKey] = { value }
      }
    })
    
    return Object.keys(indicators).length > 0 ? { indicators } : null
  }

  /**
   * PreferenceCategory를 TraitIndicators12 키로 매핑
   */
  private mapCategoryToIndicator(category: string): keyof TraitIndicators12 | null {
    const mapping: Record<string, keyof TraitIndicators12> = {
      'space_sense': '스타일고집도',
      'sensory_sensitivity': '소음민감도',
      'cleaning_preference': '관리민감도',
      'organization_habit': '수납중요도',
      'family_composition': '가족영향도',
      'health_factors': '관리민감도',
      'budget_sense': '예산탄력성',
      'color_preference': '색감취향',
      'lighting_preference': '조명취향',
      'home_purpose': '집값방어의식',
      'discomfort_factors': '공사복잡도수용성',
      'activity_flow': '동선중요도',
      'life_routine': '가족영향도',
      'sleep_pattern': '소음민감도',
      'hobby_lifestyle': '스타일고집도',
    }
    
    return mapping[category] || null
  }

  /**
   * SpaceInfo 기반 추가 조정
   */
  private adjustBySpaceInfo(
    indicators: TraitIndicators12,
    spaceInfo: any
  ): TraitIndicators12 {
    const adjusted = { ...indicators }

    // 가족 구성원 수가 많으면 가족영향도, 수납중요도 증가
    if (spaceInfo.totalPeople && spaceInfo.totalPeople >= 4) {
      adjusted.가족영향도 = validateIndicatorRange('가족영향도', adjusted.가족영향도 + 10)
      adjusted.수납중요도 = validateIndicatorRange('수납중요도', adjusted.수납중요도 + 10)
    }

    // 평수가 작으면 동선중요도, 수납중요도 증가
    if (spaceInfo.pyeong && spaceInfo.pyeong <= 20) {
      adjusted.동선중요도 = validateIndicatorRange('동선중요도', adjusted.동선중요도 + 10)
      adjusted.수납중요도 = validateIndicatorRange('수납중요도', adjusted.수납중요도 + 5)
    }

    // 욕실 1개면 동선중요도 증가
    if (spaceInfo.bathrooms && spaceInfo.bathrooms === 1) {
      adjusted.동선중요도 = validateIndicatorRange('동선중요도', adjusted.동선중요도 + 5)
    }

    return adjusted
  }

  /**
   * VibeInput 기반 추가 조정
   */
  private adjustByVibeInput(
    indicators: TraitIndicators12,
    vibeInput: any
  ): TraitIndicators12 {
    const adjusted = { ...indicators }

    // MBTI 기반 조정 (간단한 예시)
    if (vibeInput.mbti) {
      const mbti = vibeInput.mbti.toUpperCase()
      
      // J 유형: 정리정돈 중시
      if (mbti.includes('J')) {
        adjusted.수납중요도 = validateIndicatorRange('수납중요도', adjusted.수납중요도 + 5)
        adjusted.관리민감도 = validateIndicatorRange('관리민감도', adjusted.관리민감도 + 5)
      }
      
      // P 유형: 자유로운 편
      if (mbti.includes('P')) {
        adjusted.스타일고집도 = validateIndicatorRange('스타일고집도', adjusted.스타일고집도 + 5)
      }
      
      // F 유형: 감성 중시
      if (mbti.includes('F')) {
        adjusted.조명취향 = validateIndicatorRange('조명취향', adjusted.조명취향 + 5)
        adjusted.색감취향 = validateIndicatorRange('색감취향', adjusted.색감취향 + 5)
      }
    }

    return adjusted
  }

  /**
   * 우선 문제 영역 도출
   * 지표 점수 상위 3개를 영역으로 변환
   */
  private identifyPriorityAreas(indicators: TraitIndicators12): string[] {
    const topIndicators = getTopIndicators(indicators, 3)

    const areaMapping: Record<keyof TraitIndicators12, string> = {
      수납중요도: '수납',
      동선중요도: '동선',
      조명취향: '조명',
      소음민감도: '방음',
      관리민감도: '관리/청소',
      스타일고집도: '스타일',
      색감취향: '색감',
      가족영향도: '가족 공간',
      반려동물영향도: '반려동물',
      예산탄력성: '예산',
      공사복잡도수용성: '구조 변경',
      집값방어의식: '집값 방어'
    }

    return topIndicators
      .filter(item => item.score >= 60)  // 60점 이상만
      .map(item => areaMapping[item.indicator])
  }

  /**
   * 생활 루틴 유형 판단
   * 답변에서 수집된 lifestyleType 중 가장 많이 나온 것
   */
  private determineLifestyleType(types: LifestyleType[]): LifestyleType {
    if (types.length === 0) return 'general'

    // 빈도 계산
    const frequency = types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<LifestyleType, number>)

    // 가장 많이 나온 타입
    const mostCommon = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])[0][0] as LifestyleType

    return mostCommon
  }
}

/**
 * 싱글톤 인스턴스 (옵션)
 */
export const traitEngine = new TraitEngine()

