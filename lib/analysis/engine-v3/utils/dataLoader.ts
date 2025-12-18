/**
 * V3 엔진 데이터 로더
 * JSON 기준표 파일들을 로드하고 캐싱합니다.
 */

import fs from 'fs/promises'
import path from 'path'
import { 
  QuestionCriteriaV3, 
  TraitIndicatorDefinition,
  LifestyleScenarioData 
} from '../types'

// 캐시 객체
const cache = new Map<string, any>()

/**
 * JSON 파일 로드 (캐싱 포함)
 */
async function loadJSON<T>(filename: string): Promise<T> {
  if (cache.has(filename)) {
    return cache.get(filename) as T
  }

  const filePath = path.join(process.cwd(), 'lib', 'traits', filename)
  
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(content) as T
    cache.set(filename, data)
    return data
  } catch (error) {
    console.error(`[DataLoader] ${filename} 로드 실패:`, error)
    throw new Error(`Failed to load ${filename}`)
  }
}

/**
 * 질문 기준표 V3 로드
 */
export async function loadQuestionCriteria(): Promise<QuestionCriteriaV3> {
  return loadJSON<QuestionCriteriaV3>('question-criteria-v3.json')
}

/**
 * 성향 지표 정의 로드
 */
export async function loadTraitIndicators(): Promise<{ indicators: TraitIndicatorDefinition[] }> {
  return loadJSON<{ indicators: TraitIndicatorDefinition[] }>('trait-indicators-v3.json')
}

/**
 * 생활 시나리오 데이터 로드
 */
export async function loadLifestyleScenarios(): Promise<{ scenarios: LifestyleScenarioData[] }> {
  return loadJSON<{ scenarios: LifestyleScenarioData[] }>('lifestyle-scenarios-v3.json')
}

/**
 * 성향 → 공정 매핑 로드
 */
export async function loadTraitProcessMapping(): Promise<any> {
  return loadJSON('trait-process-mapping-v3.json')
}

/**
 * 성향 → 스타일 매핑 로드
 */
export async function loadTraitStyleMapping(): Promise<any> {
  return loadJSON('trait-style-mapping-v3.json')
}

/**
 * 성향 → 리스크 감지표 로드
 */
export async function loadTraitRiskDetection(): Promise<any> {
  return loadJSON('trait-risk-detection-v3.json')
}

/**
 * 교차 영향 매트릭스 로드
 */
export async function loadCrossImpactMatrix(): Promise<any> {
  return loadJSON('cross-impact-matrix-v3.json')
}

/**
 * 캐시 초기화 (테스트용)
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * 캐시 사전 로드 (성능 최적화)
 */
export async function preloadAll(): Promise<void> {
  try {
    await Promise.all([
      loadQuestionCriteria(),
      loadTraitIndicators(),
      loadLifestyleScenarios(),
      loadTraitProcessMapping(),
      loadTraitStyleMapping(),
      loadTraitRiskDetection(),
      loadCrossImpactMatrix()
    ])
    console.log('✅ [DataLoader] 모든 기준표 사전 로드 완료')
  } catch (error) {
    console.error('❌ [DataLoader] 사전 로드 실패:', error)
  }
}




















