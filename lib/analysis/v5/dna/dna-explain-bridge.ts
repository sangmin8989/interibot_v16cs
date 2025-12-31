/**
 * Phase 4-2: DNA Explain Bridge
 * 
 * ⚠️ 절대 원칙:
 * - DNA에서 태그 재해석 금지
 * - DNA에서 점수 계산 금지
 * - DNA에서 새로운 분기 생성 금지
 * - Explain 결과를 그대로 인용
 * - "이 DNA는 이런 이유 때문에 나왔다"만 표현
 * 
 * 역할: Explain 결과를 DNA 결과와 연결하는 브리지
 * - DNA는 표현 레이어
 * - Explain은 근거 레이어
 * - 태그는 진실 소스
 */

import type { ExplainResult } from '../explain'
import type { DNATypeInfo } from './dna-types'

/**
 * DNA Explain Bridge를 포함한 DNA 결과
 */
export interface DNAWithExplain extends DNATypeInfo {
  explain: DNAExplainBridge
}

/**
 * DNA Explain Bridge
 * 
 * DNA 결과와 Explain 결과를 연결하는 브리지
 */
export interface DNAExplainBridge {
  /** 헤드라인 (예: "실용 패밀리형 유형으로 분석된 이유") */
  headline: string
  /** 이유 목록 (Explain 결과에서 최대 3개만 인용) */
  reasons: {
    title: string
    description: string
  }[]
}

/**
 * DNA Explain Bridge 생성
 * 
 * ⚠️ 절대 원칙:
 * - Explain 결과 그대로 사용
 * - 최대 3개만 노출 (UX 기준)
 * - 선택/정렬 ❌ (Explain 순서 유지)
 * - 태그 재해석 금지
 * - 점수 계산 금지
 * 
 * @param dna DNA 유형 정보
 * @param explain Explain 결과
 * @returns DNA Explain Bridge
 */
export function buildDNAExplainBridge(
  dna: DNATypeInfo,
  explain: ExplainResult
): DNAExplainBridge {
  // ⚠️ 절대 원칙: Explain 결과 그대로 사용
  // 선택/정렬/재해석 금지

  // Explain의 tagReasons에서 최대 3개만 인용
  // 순서 유지 (선택/정렬 금지)
  const reasons = explain.tagReasons.slice(0, 3).map((r) => ({
    title: r.title,
    description: r.description,
  }))

  return {
    headline: `${dna.name} 유형으로 분석된 이유`,
    reasons,
  }
}




