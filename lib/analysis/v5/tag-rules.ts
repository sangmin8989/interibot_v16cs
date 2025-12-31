/**
 * V5 태그 충돌·중복 규칙 정의
 * 
 * Phase 3-1: 태그 충돌·중복 규칙 명세
 * 
 * ⚠️ 헌법 원칙:
 * - 태그 충돌 자체는 허용
 * - 동일 속성 중복 매핑 시 우선순위 규칙 적용
 * - 점수 비교 금지
 * - 누적 계산 금지
 */

/**
 * 태그 우선순위 규칙
 * 
 * 같은 속성으로 매핑되는 태그가 여러 개일 경우,
 * priority 배열에서 가장 앞선 태그만 유효
 * 뒤 태그는 무시 (삭제 아님)
 */
export const TAG_PRIORITY_RULES: Record<string, string[]> = {
  /**
   * 내구성 관련 태그 우선순위
   * 
   * OLD_RISK_HIGH > OLD_RISK_MEDIUM > LONG_STAY
   */
  durability: ['OLD_RISK_HIGH', 'OLD_RISK_MEDIUM', 'LONG_STAY'],
}

/**
 * 태그 그룹 정의
 * 
 * 같은 속성으로 매핑되는 태그들을 그룹화
 */
export const TAG_GROUPS: Record<string, string[]> = {
  durability: ['OLD_RISK_HIGH', 'OLD_RISK_MEDIUM', 'LONG_STAY'],
}

/**
 * 태그 우선순위 적용
 * 
 * @param tags 입력 태그 배열
 * @returns 우선순위 규칙 적용된 태그 배열
 * 
 * ⚠️ 헌법 원칙:
 * - 점수 비교 금지
 * - 누적 계산 금지
 * - 순수 우선순위만 적용
 */
export function applyTagPriority(tags: string[]): string[] {
  const result: string[] = []
  const groupTags: Record<string, string[]> = {} // 그룹별 태그 수집

  // 1단계: 태그를 그룹별로 분류
  for (const tag of tags) {
    // 태그가 속한 그룹 찾기
    let groupName: string | null = null
    for (const [group, groupTagList] of Object.entries(TAG_GROUPS)) {
      if (groupTagList.includes(tag)) {
        groupName = group
        break
      }
    }

    // 그룹에 속하지 않으면 그대로 추가
    if (!groupName) {
      result.push(tag)
      continue
    }

    // 그룹별로 태그 수집
    if (!groupTags[groupName]) {
      groupTags[groupName] = []
    }
    groupTags[groupName].push(tag)
  }

  // 2단계: 각 그룹에서 우선순위가 가장 높은 태그만 선택
  for (const [groupName, tagList] of Object.entries(groupTags)) {
    const priority = TAG_PRIORITY_RULES[groupName]
    if (!priority) {
      // 우선순위 규칙이 없으면 첫 번째 태그만 추가
      result.push(tagList[0])
      continue
    }

    // 우선순위가 가장 높은 태그 찾기 (priority 배열에서 인덱스가 가장 작은 것)
    let highestPriorityTag: string | null = null
    let highestPriorityIndex = Infinity

    for (const tag of tagList) {
      const tagIndex = priority.indexOf(tag)
      if (tagIndex !== -1 && tagIndex < highestPriorityIndex) {
        highestPriorityIndex = tagIndex
        highestPriorityTag = tag
      }
    }

    // 우선순위 규칙에 있는 태그가 없으면 첫 번째 태그 사용
    if (highestPriorityTag) {
      result.push(highestPriorityTag)
    } else if (tagList.length > 0) {
      result.push(tagList[0])
    }
  }

  return result
}




