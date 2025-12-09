/**
 * 공사 일정 계산 유틸리티
 * 공정별 기본 일수와 평수 기반 조정
 */

import type { ProcessId } from './config'
import { PROCESS_NAMES } from './config'

/**
 * 공정별 기본 일수 (일)
 */
const PROCESS_DAYS: Record<ProcessId, number> = {
  '100': 5,   // 주방/다용도실: 5일
  '200': 10,  // 목공사/가구공사: 10일
  '210': 3,   // 문틀/문짝: 3일
  '220': 7,   // 붙박이장: 7일
  '230': 5,   // 거실수납장: 5일
  '240': 4,   // 아일랜드/주방가구: 4일
  '250': 6,   // 기타 맞춤가구: 6일
  '300': 4,   // 전기/통신: 4일
  '400': 6,   // 욕실/수전: 6일
  '500': 5,   // 타일/석재: 5일
  '600': 3,   // 도장/마감: 3일
  '700': 2,   // 필름/시트: 2일
  '800': 4,   // 창호/샤시: 4일
  '900': 3,   // 도배/벽지: 3일
  '1000': 2,  // 철거/폐기: 2일
}

export interface ProcessSchedule {
  processName: string
  days: number
}

export interface ScheduleResult {
  estimatedDays: number
  processSchedule: ProcessSchedule[]
}

/**
 * 공사 일정 계산
 * @param selectedProcesses 선택된 공정 코드 배열
 * @param areaPyeong 시공 면적 (평)
 * @returns 공사 일정 결과
 */
export function calculateSchedule(
  selectedProcesses: ProcessId[],
  areaPyeong: number
): ScheduleResult {
  const processSchedule: ProcessSchedule[] = []

  // 평수 보정 계수
  let sizeFactor = 1.0
  if (areaPyeong < 30) {
    sizeFactor = 0.8 // 작은 평수는 일수 감소
  } else if (areaPyeong >= 50) {
    sizeFactor = 1.2 // 큰 평수는 일수 증가
  }

  let totalDays = 0

  for (const processId of selectedProcesses) {
    const baseDays = PROCESS_DAYS[processId] || 3

    // 목공사는 평수에 따라 추가 일수
    let adjustedDays = baseDays
    if ((processId === '200' || processId === '220' || processId === '230' || processId === '240' || processId === '250') && areaPyeong >= 40) {
      adjustedDays += Math.floor(areaPyeong / 20) // 20평당 1일 추가
    }

    // 평수 보정 적용
    adjustedDays = Math.round(adjustedDays * sizeFactor)
    
    // 최소 1일 보장
    adjustedDays = Math.max(1, adjustedDays)

    processSchedule.push({
      processName: PROCESS_NAMES[processId] || processId,
      days: adjustedDays,
    })

    totalDays += adjustedDays
  }

  // 공정이 겹칠 수 있으므로 전체 일수는 최대값 + 여유 일수
  // 병렬 공사 가능한 공정들을 고려하여 조정
  const maxProcessDays = Math.max(...processSchedule.map(p => p.days), 0)
  const parallelFactor = selectedProcesses.length > 3 ? 0.7 : 0.85 // 공정이 많으면 병렬 작업 가능
  const finalTotalDays = Math.round(maxProcessDays + (totalDays - maxProcessDays) * parallelFactor)

  return {
    estimatedDays: Math.max(finalTotalDays, totalDays * 0.6), // 최소 60% 일수 보장
    processSchedule,
  }
}


