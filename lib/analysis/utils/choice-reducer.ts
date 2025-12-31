/**
 * 인테리봇 AI 판단 레이어 - 선택지 축소 유틸리티
 * 
 * 통합 설계서 기준:
 * - 옵션 6개 이상 → 3개로 자동 축소
 * - 기본 출력: 3안 (표준/가성비/강화)
 * - 예외 규칙: 2안/4안
 */

import { InterventionLevel } from '../types/judgment-axes'
import { ProcessClassification, getProcessClassification } from '../config/process-classification'
import type { ChoiceVariables } from './choice-variables'

/**
 * 선택지 옵션 타입
 */
export interface ProcessOption {
  id: string
  name: string
  description?: string
  priceKey?: string
  isStandard?: boolean  // 표준안 여부
  tier?: 'basic' | 'comfort' | 'premium'
}

/**
 * 축소된 선택지 결과
 */
export interface ReducedChoices {
  options: ProcessOption[]
  reductionReason: string
  originalCount: number
  reducedCount: number
}

/**
 * 선택지 축소 함수
 * 
 * Phase 3: choiceVariables를 우선 사용, 없으면 기존 로직 사용
 * 
 * 통합 설계서 기준:
 * - 기본: 3안 (표준/가성비/강화)
 * - 예외: 2안 (결정 지연 + 비용 민감 높음) 또는 4안 (통제 욕구 매우 높음)
 */
export function reduceChoices(
  options: ProcessOption[],
  interventionLevel: InterventionLevel,
  classification: ProcessClassification,
  axes?: {
    costSensitivity: number
    decisionDrag: number
    controlNeed: number
  },
  choiceVariables?: ChoiceVariables
): ReducedChoices {
  const originalCount = options.length

  // ✅ Phase 3: choiceVariables가 있으면 우선 사용
  if (choiceVariables) {
    const targetCount = choiceVariables.optionCount
    
    // LOCK 공정이고 defaultPlan이 true면 표준안만
    if (classification === 'LOCK' && choiceVariables.defaultPlan) {
      const standardOptions = options.filter(opt => opt.isStandard === true)
      if (standardOptions.length > 0) {
        return {
          options: standardOptions.slice(0, targetCount),
          reductionReason: `질문 답변에 따라 ${targetCount}개로 축소했습니다. (LOCK + 기본계획 고정)`,
          originalCount,
          reducedCount: Math.min(standardOptions.length, targetCount)
        }
      }
    }

    // 일반적인 경우: targetCount만큼 선택
    const reduced = options.slice(0, targetCount)
    return {
      options: reduced,
      reductionReason: `질문 답변에 따라 ${targetCount}개로 축소했습니다.`,
      originalCount,
      reducedCount: targetCount
    }
  }

  // 옵션이 6개 미만이면 축소 불필요
  if (originalCount < 6) {
    return {
      options,
      reductionReason: '선택지가 6개 미만이므로 축소하지 않습니다.',
      originalCount,
      reducedCount: originalCount
    }
  }

  // BASE 공정: 표준안만 남기기
  if (classification === 'BASE') {
    const standardOptions = options.filter(opt => opt.isStandard === true)
    if (standardOptions.length > 0) {
      return {
        options: standardOptions,
        reductionReason: '기본 진행 공정이므로 표준안만 표시합니다.',
        originalCount,
        reducedCount: standardOptions.length
      }
    }
  }

  // LOCK 공정: 표준안만 남기기 (강제)
  if (classification === 'LOCK') {
    const standardOptions = options.filter(opt => opt.isStandard === true)
    if (standardOptions.length > 0) {
      return {
        options: standardOptions,
        reductionReason: '되돌릴 수 없는 공정이므로 표준안만 표시합니다.',
        originalCount,
        reducedCount: standardOptions.length
      }
    }
  }

  // LATER 공정: 개입 강도에 따라 제거 또는 유지
  if (classification === 'LATER') {
    if (interventionLevel === 'high') {
      return {
        options: [],
        reductionReason: '나중에 해도 되는 공정이므로 제거했습니다.',
        originalCount,
        reducedCount: 0
      }
    }
    // 중간/낮음: 유지하되 "나중에" 표시
    return {
      options: options.map(opt => ({ ...opt, canDoLater: true })),
      reductionReason: '나중에 해도 되는 공정입니다.',
      originalCount,
      reducedCount: originalCount
    }
  }

  // NARROW 공정: 개입 강도에 따라 축소
  if (classification === 'NARROW') {
    // 예외 규칙 1: 2안으로 줄이기
    // 결정 지연 성향(C) 높음(70↑) + 비용 민감도(A) 높음(70↑)
    if (
      axes &&
      axes.decisionDrag >= 70 &&
      axes.costSensitivity >= 70 &&
      interventionLevel === 'high'
    ) {
      const standardOptions = options.filter(opt => opt.isStandard === true)
      const budgetOptions = options.filter(opt => opt.tier === 'basic')
      
      // 표준안 + 가성비안만
      const twoOptions = [
        ...standardOptions.slice(0, 1),
        ...budgetOptions.slice(0, 1)
      ].slice(0, 2)
      
      if (twoOptions.length > 0) {
        return {
          options: twoOptions,
          reductionReason: '결정 지연 성향과 비용 민감도가 높아 표준안과 가성비안만 표시합니다.',
          originalCount,
          reducedCount: twoOptions.length
        }
      }
    }

    // 예외 규칙 2: 4안으로 늘리기
    // 통제 욕구(D) 매우 높음(85↑) + 리스크 회피도(B) 낮음(40↓)
    if (
      axes &&
      axes.controlNeed >= 85 &&
      interventionLevel === 'low'
    ) {
      // 표준안 + 가성비안 + 강화안 + 디자인 강조안
      const standardOptions = options.filter(opt => opt.isStandard === true)
      const budgetOptions = options.filter(opt => opt.tier === 'basic')
      const premiumOptions = options.filter(opt => opt.tier === 'premium')
      const designOptions = options.filter(opt => !opt.isStandard && opt.tier !== 'basic' && opt.tier !== 'premium')
      
      const fourOptions = [
        ...standardOptions.slice(0, 1),
        ...budgetOptions.slice(0, 1),
        ...premiumOptions.slice(0, 1),
        ...designOptions.slice(0, 1)
      ].slice(0, 4)
      
      if (fourOptions.length >= 3) {
        return {
          options: fourOptions,
          reductionReason: '통제 욕구가 높아 4안을 표시합니다.',
          originalCount,
          reducedCount: fourOptions.length
        }
      }
    }

    // 기본 규칙: 3안 (표준/가성비/강화)
    const standardOptions = options.filter(opt => opt.isStandard === true)
    const budgetOptions = options.filter(opt => opt.tier === 'basic' || opt.tier === 'comfort')
    const premiumOptions = options.filter(opt => opt.tier === 'premium')
    
    // 개입 강도에 따라 선택
    let selectedOptions: ProcessOption[] = []
    
    if (interventionLevel === 'high') {
      // 높음: 표준안만
      selectedOptions = standardOptions.slice(0, 1)
    } else if (interventionLevel === 'mid') {
      // 중간: 표준안 + 가성비안
      selectedOptions = [
        ...standardOptions.slice(0, 1),
        ...budgetOptions.slice(0, 1)
      ].slice(0, 2)
    } else {
      // 낮음: 표준안 + 가성비안 + 강화안 (3안)
      selectedOptions = [
        ...standardOptions.slice(0, 1),
        ...budgetOptions.slice(0, 1),
        ...premiumOptions.slice(0, 1)
      ].slice(0, 3)
    }

    // 최소 1개는 보장
    if (selectedOptions.length === 0 && options.length > 0) {
      selectedOptions = [options[0]]
    }

    return {
      options: selectedOptions,
      reductionReason: `개입 강도 ${interventionLevel}에 따라 ${selectedOptions.length}안으로 축소했습니다.`,
      originalCount,
      reducedCount: selectedOptions.length
    }
  }

  // 기본: 3안으로 축소
  const threeOptions = options.slice(0, 3)
  return {
    options: threeOptions,
    reductionReason: '기본 규칙에 따라 3안으로 축소했습니다.',
    originalCount,
    reducedCount: threeOptions.length
  }
}

/**
 * 공정별 선택지 축소
 */
export function reduceProcessOptions(
  processId: string,
  options: ProcessOption[],
  interventionLevel: InterventionLevel,
  axes?: {
    costSensitivity: number
    decisionDrag: number
    controlNeed: number
  }
): ReducedChoices {
  const classification = getProcessClassification(processId)
  return reduceChoices(options, interventionLevel, classification, axes)
}




















