/**
 * 성향 어댑터 - Supabase DB 조회
 * 
 * 성향 관련 데이터를 Supabase에서 조회하는 어댑터
 * personality_traits, personality_materials, answer_score_mapping 테이블 사용
 */

import { supabase } from '@/lib/db/supabase'
import type { PreferenceScores } from '@/lib/analysis/types'

// ============================================================
// 타입 정의
// ============================================================

/** 성향-자재 매핑 결과 */
export interface PersonalityMaterialMapping {
  mapping_id: number
  trait_code: string
  trait_name: string
  material_id: string | null
  phase_id: string | null
  recommendation_type: 'upgrade' | 'downgrade' | 'must' | 'optional'
  grade_adjustment: number
  priority: number
  reason_template: string | null
  material_code: string | null
  product_name: string | null
  grade: string | null
}

/** 답변-점수 매핑 결과 */
export interface AnswerScoreMapping {
  mapping_id: number
  question_id: string
  answer_value: string
  analysis_mode: string
  trait_scores: Partial<PreferenceScores>
}

// ============================================================
// 답변-점수 매핑 조회
// ============================================================

/**
 * 답변-점수 매핑 조회 (DB)
 * 
 * @param questionId - 질문 ID
 * @param answerValue - 답변 값
 * @param analysisMode - 분석 모드 ('quick', 'standard', 'deep', 'vibe')
 * @returns 성향 점수 맵핑 또는 null
 */
export async function getAnswerScoreMappingFromDB(
  questionId: string,
  answerValue: string,
  analysisMode: string = 'standard'
): Promise<Partial<PreferenceScores> | null> {
  try {
    const { data, error } = await supabase
      .from('answer_score_mapping')
      .select('trait_scores')
      .eq('question_id', questionId)
      .eq('answer_value', answerValue)
      .eq('analysis_mode', analysisMode)
      .maybeSingle()
    
    if (error) {
      console.error('답변-점수 매핑 조회 에러:', error)
      return null
    }
    
    if (!data) {
      return null
    }
    
    // JSONB를 PreferenceScores 형태로 변환
    return data.trait_scores as Partial<PreferenceScores>
    
  } catch (error: any) {
    console.error('getAnswerScoreMappingFromDB 에러:', error)
    return null
  }
}

/**
 * 모든 답변에 대한 점수 매핑 조회 (배치)
 * 
 * @param answers - 질문ID → 답변값 맵
 * @param analysisMode - 분석 모드
 * @returns 통합된 성향 점수
 */
export async function getTraitScoresFromAnswers(
  answers: Record<string, string>,
  analysisMode: string = 'standard'
): Promise<PreferenceScores> {
  // 기본 점수 초기화 (모든 카테고리 5점)
  const scores: PreferenceScores = {
    space_sense: 5,
    sensory_sensitivity: 5,
    cleaning_preference: 5,
    organization_habit: 5,
    family_composition: 5,
    health_factors: 5,
    budget_sense: 5,
    color_preference: 5,
    lighting_preference: 5,
    home_purpose: 5,
    discomfort_factors: 5,
    activity_flow: 5,
    life_routine: 5,
    sleep_pattern: 5,
    hobby_lifestyle: 5,
  }
  
  // 각 답변에 대해 DB에서 매핑 조회
  const mappingPromises = Object.entries(answers).map(async ([questionId, answerValue]) => {
    return getAnswerScoreMappingFromDB(questionId, answerValue, analysisMode)
  })
  
  const mappings = await Promise.all(mappingPromises)
  
  // 매핑 결과를 점수에 반영 (가중 평균)
  const impactCounts: Record<keyof PreferenceScores, number> = {
    space_sense: 0,
    sensory_sensitivity: 0,
    cleaning_preference: 0,
    organization_habit: 0,
    family_composition: 0,
    health_factors: 0,
    budget_sense: 0,
    color_preference: 0,
    lighting_preference: 0,
    home_purpose: 0,
    discomfort_factors: 0,
    activity_flow: 0,
    life_routine: 0,
    sleep_pattern: 0,
    hobby_lifestyle: 0,
  }
  
  const totalScores: Record<keyof PreferenceScores, number> = { ...scores }
  Object.keys(totalScores).forEach((key) => {
    totalScores[key as keyof PreferenceScores] = 0
  })
  
  mappings.forEach((mapping) => {
    if (mapping) {
      Object.entries(mapping).forEach(([trait, score]) => {
        const traitKey = trait as keyof PreferenceScores
        if (traitKey in totalScores && typeof score === 'number') {
          totalScores[traitKey] += score
          impactCounts[traitKey] += 1
        }
      })
    }
  })
  
  // 평균 점수 계산 (영향 받은 카테고리만)
  Object.keys(scores).forEach((key) => {
    const traitKey = key as keyof PreferenceScores
    if (impactCounts[traitKey] > 0) {
      scores[traitKey] = Math.round(totalScores[traitKey] / impactCounts[traitKey])
    }
  })
  
  return scores
}

// ============================================================
// 성향-자재 매핑 조회
// ============================================================

/**
 * 성향 점수 기반 자재 추천 조회 (DB)
 * 
 * @param traitScores - 성향 점수 (15개 항목)
 * @param phaseId - 공정 ID (옵션, null이면 모든 공정)
 * @returns 추천 자재 목록
 */
export async function getRecommendedMaterialsFromDB(
  traitScores: PreferenceScores,
  phaseId?: string | null
): Promise<PersonalityMaterialMapping[]> {
  try {
    // JSONB로 변환
    const traitScoresJson = traitScores as unknown as Record<string, number>
    
    console.log('🔍 getRecommendedMaterialsFromDB 호출:', {
      traitScores: Object.keys(traitScoresJson).length + '개',
      phaseId
    })
    
    // Supabase 함수 호출 또는 직접 쿼리
    // 방법 1: 함수 사용 (권장)
    const { data, error } = await supabase.rpc('get_recommended_materials', {
      p_trait_scores: traitScoresJson,
      p_phase_id: phaseId || null
    })
    
    console.log('🔍 함수 호출 결과:', {
      hasError: !!error,
      error: error?.message || null,
      dataCount: data?.length || 0,
      data: data?.slice(0, 2) || []
    })
    
    if (error) {
      console.error('❌ 성향-자재 매핑 조회 에러 (함수):', error)
      
      // 방법 2: 직접 쿼리 (fallback)
      console.log('🔄 fallback: getRecommendedMaterialsDirect 호출')
      const fallbackResult = await getRecommendedMaterialsDirect(traitScores, phaseId)
      console.log('✅ fallback 결과:', fallbackResult.length + '개')
      return fallbackResult
    }
    
    // 함수가 빈 배열을 반환하는 경우도 fallback 시도
    if (!data || data.length === 0) {
      console.log('⚠️ 함수가 빈 배열 반환, fallback 시도')
      const fallbackResult = await getRecommendedMaterialsDirect(traitScores, phaseId)
      console.log('✅ fallback 결과:', fallbackResult.length + '개')
      return fallbackResult
    }
    
    console.log('✅ 함수 결과 반환:', data.length + '개')
    return (data || []) as PersonalityMaterialMapping[]
    
  } catch (error: any) {
    console.error('❌ getRecommendedMaterialsFromDB 에러:', error)
    // 에러 발생 시에도 fallback 시도
    try {
      console.log('🔄 에러 발생, fallback 시도')
      const fallbackResult = await getRecommendedMaterialsDirect(traitScores, phaseId)
      console.log('✅ fallback 결과:', fallbackResult.length + '개')
      return fallbackResult
    } catch (fallbackError: any) {
      console.error('❌ fallback도 실패:', fallbackError)
      return []
    }
  }
}

/**
 * 성향-자재 매핑 직접 조회 (함수 실패 시 fallback)
 */
async function getRecommendedMaterialsDirect(
  traitScores: PreferenceScores,
  phaseId?: string | null
): Promise<PersonalityMaterialMapping[]> {
  try {
    console.log('🔍 getRecommendedMaterialsDirect 호출:', {
      traitScores: Object.keys(traitScores).length + '개',
      phaseId
    })
    
    // personality_traits와 personality_materials 조인 조회
    let query = supabase
      .from('personality_materials')
      .select(`
        mapping_id,
        trait_id,
        material_id,
        phase_id,
        score_threshold,
        score_direction,
        recommendation_type,
        grade_adjustment,
        priority,
        reason_template,
        personality_traits!inner(trait_code, trait_name),
        materials(material_code, product_name, category_1, category_2, category_3)
      `)
      .eq('is_active', true)
    
    if (phaseId) {
      query = query.eq('phase_id', phaseId)
    }
    
    const { data, error } = await query
    
    console.log('🔍 직접 쿼리 결과:', {
      hasError: !!error,
      error: error?.message || null,
      dataCount: data?.length || 0
    })
    
    if (error) {
      console.error('❌ 성향-자재 매핑 직접 조회 에러:', error)
      return []
    }
    
    if (!data) {
      console.log('⚠️ 데이터 없음')
      return []
    }
    
    console.log('🔍 필터링 전 데이터:', data.length + '개')
    
    // 점수 조건에 맞는 것만 필터링
    const filtered = data
      .filter((item: any) => {
        const traitCode = item.personality_traits?.trait_code
        if (!traitCode) return false
        
        const score = traitScores[traitCode as keyof PreferenceScores]
        if (score === undefined) return false
        
        const threshold = item.score_threshold
        const direction = item.score_direction
        
        if (direction === 'gte') return score >= threshold
        if (direction === 'lte') return score <= threshold
        if (direction === 'eq') return score === threshold
        return false
      })
      .map((item: any) => ({
        mapping_id: item.mapping_id,
        trait_code: item.personality_traits?.trait_code || '',
        trait_name: item.personality_traits?.trait_name || '',
        material_id: item.material_id,
        phase_id: item.phase_id,
        recommendation_type: item.recommendation_type,
        grade_adjustment: item.grade_adjustment,
        priority: item.priority,
        reason_template: item.reason_template,
        material_code: item.materials?.material_code || null,
        product_name: item.materials?.product_name || null,
        grade: null, // materials 테이블에 grade 컬럼이 없으므로 null
      }))
      .sort((a, b) => b.priority - a.priority)
    
    console.log('✅ 필터링 후 결과:', filtered.length + '개')
    return filtered
    
  } catch (error: any) {
    console.error('getRecommendedMaterialsDirect 에러:', error)
    return []
  }
}

