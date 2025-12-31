/**
 * V3 ↔ V4 성향 코드 매핑
 * 
 * V3는 한글 키를 사용하고, V4는 영문 키를 사용하므로 양방향 매핑 필요
 */

/**
 * V3 한글 키 → V4 영문 키 매핑
 */
export const V3_KO_TO_V4_EN: Record<string, string> = {
  // 기본 성향
  '수납중요도': 'storage_importance',
  '동선중요도': 'flow_importance',
  '조명취향': 'light_importance',
  '소음민감도': 'noise_sensitivity',
  '관리민감도': 'cleaning_preference',
  '스타일고집도': 'style_preference',
  '색감취향': 'color_preference',
  '가족영향도': 'family_impact',
  '반려동물영향도': 'pet_friendly',
  '예산탄력성': 'budget_flexibility',
  '공사복잡도수용성': 'complexity_tolerance',
  '집값방어의식': 'value_protection',
  
  // V3 TraitIndicators12의 실제 키 (한글)
  '정리습관': 'organization_habit',
  '요리빈도': 'cooking_frequency',
  '손님빈도': 'guest_frequency',
  '재택근무': 'work_from_home',
  '아이안전': 'child_safety',
  '노인배려': 'elderly_care',
}

/**
 * V4 영문 키 → V3 한글 키 매핑
 */
export const V4_EN_TO_V3_KO: Record<string, string> = {
  'storage_importance': '수납중요도',
  'flow_importance': '동선중요도',
  'light_importance': '조명취향',
  'noise_sensitivity': '소음민감도',
  'cleaning_preference': '관리민감도',
  'style_preference': '스타일고집도',
  'color_preference': '색감취향',
  'family_impact': '가족영향도',
  'pet_friendly': '반려동물영향도',
  'budget_flexibility': '예산탄력성',
  'complexity_tolerance': '공사복잡도수용성',
  'value_protection': '집값방어의식',
  'organization_habit': '정리습관',
  'cooking_frequency': '요리빈도',
  'guest_frequency': '손님빈도',
  'work_from_home': '재택근무',
  'child_safety': '아이안전',
  'elderly_care': '노인배려',
}

/**
 * V3 TraitIndicators12 타입 (한글 키)
 */
export interface V3TraitIndicators12 {
  수납중요도: number
  동선중요도: number
  조명취향: number
  소음민감도: number
  관리민감도: number
  스타일고집도: number
  색감취향: number
  가족영향도: number
  반려동물영향도: number
  예산탄력성: number
  공사복잡도수용성: number
  집값방어의식: number
}

/**
 * 타입 분류 → 관련 V3 한글 키 매핑
 */
export const TYPE_TO_V3_TRAIT_MAP: Record<string, string[]> = {
  // 생활 유형
  'remote_work': ['재택근무', '소음민감도'],
  'cooking_focused': ['요리빈도'],
  'social_host': ['손님빈도'],
  
  // 가족 유형
  'has_infant': ['아이안전', '소음민감도'],
  'has_child': ['아이안전', '수납중요도'],
  'has_elderly': ['노인배려', '동선중요도'],
  'has_pet': ['반려동물영향도', '관리민감도'],
  
  // 성격 유형
  'clean_oriented': ['관리민감도', '정리습관'],
  'storage_focused': ['수납중요도', '정리습관'],
  'noise_sensitive': ['소음민감도'],
  'light_focused': ['조명취향'],
}

/**
 * 공정 → 관련 V3 한글 키 매핑
 */
export const PROCESS_TO_V3_TRAIT_MAP: Record<string, string[]> = {
  'kitchen_core': ['요리빈도'],
  'bathroom_waterproof': ['관리민감도'],
  'storage_system': ['수납중요도', '정리습관'],
  'soundproof': ['소음민감도'],
  'lighting': ['조명취향'],
  'flooring': ['관리민감도', '아이안전'],
  'wallpaper': ['조명취향'],
  'window': ['소음민감도', '조명취향'],
}








