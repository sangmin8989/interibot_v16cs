/**
 * 견적 엔진 결과 어댑터
 * 
 * 목적: 견적 엔진 결과를 프론트엔드(UI)에서 안전하게 사용할 수 있는 형태로 변환
 * 
 * 규칙:
 * - 계산, API, DB 로직을 포함하지 않음
 * - undefined 값이 UI로 전달되지 않도록 모든 필드는 안전값을 가짐
 * - 에러를 throw 하지 않음
 * - UI와 엔진 사이의 경계 레이어 역할
 */

/**
 * 엔진 결과 타입 (입력)
 */
export interface EngineEstimateResult {
  total?: number;
  materialTotal?: number;
  laborTotal?: number;
  breakdown?: unknown[];
}

/**
 * UI 견적 결과 타입 (출력)
 */
export interface UIEstimateResult {
  grandTotal: number;
  materialTotal: number;
  laborTotal: number;
  breakdown: unknown[];
}

/**
 * 견적 엔진 결과를 UI에서 안전하게 사용할 수 있는 형태로 변환
 * 
 * @param engineResult - 견적 엔진 결과 객체
 * @returns UI 전용 견적 결과 객체 (모든 필드가 안전값을 가짐)
 */
export function adaptEstimateResult(
  engineResult: EngineEstimateResult | null | undefined
): UIEstimateResult {
  // null 또는 undefined인 경우 모든 값을 안전값으로 반환
  if (!engineResult) {
    return {
      grandTotal: 0,
      materialTotal: 0,
      laborTotal: 0,
      breakdown: [],
    };
  }

  // total이 없으면 grandTotal은 0
  const grandTotal = typeof engineResult.total === 'number' && !isNaN(engineResult.total)
    ? engineResult.total
    : 0;

  // materialTotal이 없으면 0
  const materialTotal = typeof engineResult.materialTotal === 'number' && !isNaN(engineResult.materialTotal)
    ? engineResult.materialTotal
    : 0;

  // laborTotal이 없으면 0
  const laborTotal = typeof engineResult.laborTotal === 'number' && !isNaN(engineResult.laborTotal)
    ? engineResult.laborTotal
    : 0;

  // breakdown이 없으면 빈 배열
  const breakdown = Array.isArray(engineResult.breakdown)
    ? engineResult.breakdown
    : [];

  return {
    grandTotal,
    materialTotal,
    laborTotal,
    breakdown,
  };
}




