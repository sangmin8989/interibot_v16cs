/**
 * 안전한 속성 접근 유틸리티
 */

/**
 * 안전하게 중첩 속성 접근
 */
export function safeGet<T>(
  obj: unknown,
  path: string,
  defaultValue: T
): T {
  try {
    const keys = path.split('.')
    let current: any = obj

    for (const key of keys) {
      if (current == null || typeof current !== 'object') {
        return defaultValue
      }
      current = current[key]
    }

    return current !== undefined && current !== null ? current : defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * 안전하게 배열 접근
 */
export function safeArray<T>(arr: unknown, defaultValue: T[] = []): T[] {
  return Array.isArray(arr) ? arr : defaultValue
}

/**
 * 안전하게 숫자 접근
 */
export function safeNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    if (!isNaN(parsed)) {
      return parsed
    }
  }
  return defaultValue
}








