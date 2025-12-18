/**
 * V3.1 Core Edition - Needs Layer 타입 정의
 */

// ============ Core Needs (6개) ============

export type NeedsId =
  | 'safety'        // 안전성 강화
  | 'storage'       // 수납 강화
  | 'flow'          // 동선 최적화
  | 'durability'    // 내구성 강화
  | 'maintenance'   // 청소/관리 편의성
  | 'brightness';   // 채광·밝기 향상

export type NeedsLevel = 'low' | 'mid' | 'high';

export type NeedsCategory = 'safety' | 'lifestyle' | 'aesthetic';

export type NeedsSource = 'explicit' | 'inferred';

// ============ Needs 정의 ============

export interface NeedDefinition {
  id: NeedsId;
  name: string;
  description: string;
  category: NeedsCategory;
}

export interface NeedScore {
  /** Needs ID */
  id: NeedsId;
  /** 강도 */
  level: NeedsLevel;
  /** 카테고리 */
  category: NeedsCategory;
  /** 출처 (명시적 / 추론) */
  source: NeedsSource;
  /** 계산 근거 (디버그용) */
  reasons: string[];
}

export interface NeedsResult {
  /** Needs 점수 목록 */
  needs: NeedScore[];
  /** 계산 시점 */
  timestamp: string;
  /** 디버그 정보 */
  debug?: {
    inputSnapshot: any;
    appliedRules: string[];
  };
}




















