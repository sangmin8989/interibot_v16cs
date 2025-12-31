/**
 * Phase 4-2: DNA 타입 정의
 * 
 * DNA는 결과 요약(UI/브랜딩) 레이어
 * Explain은 근거(이유)
 * V5 태그는 유일한 진실 소스(Single Source of Truth)
 * 
 * ⚠️ 원칙:
 * - DNA는 Explain 위에 얹힌 '표현 레이어'일 뿐
 * - Explain이나 태그를 절대 건드리지 않음
 */

/**
 * DNA 유형 정보
 * 
 * DNA는 태그 기반으로 결정되는 성향 유형
 * (실제 결정 로직은 별도 파일에서 구현)
 */
export interface DNATypeInfo {
  /** DNA 유형 ID (예: 'practical_family', 'minimal_lifestyle') */
  type: string
  /** DNA 유형 이름 (예: '실용 패밀리형', '미니멀 라이프형') */
  name: string
  /** DNA 유형 설명 (예: '가족 중심의 실용적인 인테리어를 선호하는 유형') */
  description: string
  /** DNA 유형 키워드 (예: ['가족', '실용', '수납']) */
  keywords: string[]
  /** DNA 유형 색상 (UI 표시용) */
  color?: string
  /** DNA 유형 아이콘 (UI 표시용) */
  icon?: string
}




