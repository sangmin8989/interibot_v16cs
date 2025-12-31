/**
 * Phase 6: 재현성 가드
 * 
 * ⚠️ 절대 원칙:
 * - 동일 입력 → 동일 hash 필수
 * - hash 불일치 시 운영 로그 기록
 * - 재현성 보장
 */

import crypto from 'crypto'

/**
 * 재현성 해시 생성
 * 
 * ⚠️ 절대 원칙:
 * - 동일 입력 → 동일 hash 필수
 * - 결정론적 해시 알고리즘 사용
 * 
 * @param payload 입력 또는 출력 데이터
 * @returns SHA-256 해시 (hex)
 */
export function buildReproducibilityHash(payload: unknown): string {
  // ⚠️ 절대 원칙: 결정론적 해시 알고리즘 사용
  // JSON.stringify로 직렬화 (순서 보장)
  // 재귀적으로 객체 키를 정렬하여 순서 보장
  const sortedPayload = sortObjectKeys(payload)
  const serialized = JSON.stringify(sortedPayload)
  
  // SHA-256 해시 생성
  const hash = crypto.createHash('sha256').update(serialized).digest('hex')
  
  return hash
}

/**
 * 객체 키 정렬 (재귀)
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sortObjectKeys(item))
  }

  if (typeof obj === 'object') {
    const sorted: Record<string, unknown> = {}
    const keys = Object.keys(obj).sort()
    for (const key of keys) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key])
    }
    return sorted
  }

  return obj
}

/**
 * 입력 스냅샷 해시
 * 
 * V5 입력의 해시를 생성하여 재현성 보장
 * 
 * @param input V5 입력
 * @returns 입력 해시
 */
export function buildInputHash(input: {
  basicInfo: unknown
  answers: Record<string, string>
}): string {
  // ⚠️ 절대 원칙: 동일 입력 → 동일 hash
  // answers를 정렬하여 순서 보장
  const sortedAnswers = Object.keys(input.answers)
    .sort()
    .reduce((acc, key) => {
      acc[key] = input.answers[key]
      return acc
    }, {} as Record<string, string>)

  return buildReproducibilityHash({
    basicInfo: input.basicInfo,
    answers: sortedAnswers,
  })
}

/**
 * 출력 스냅샷 해시
 * 
 * V5 출력의 해시를 생성하여 재현성 보장
 * 
 * @param output V5 출력
 * @returns 출력 해시
 */
export function buildOutputHash(output: {
  tags: { tags: string[] }
  dna: { type: string }
  explain: { summary: string }
}): string {
  // ⚠️ 절대 원칙: 동일 출력 → 동일 hash
  // 핵심 필드만 해시 (전체 출력은 너무 큼)
  return buildReproducibilityHash({
    tags: output.tags.tags.sort(), // 순서 보장
    dnaType: output.dna.type,
    explainSummary: output.explain.summary,
  })
}




