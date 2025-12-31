/**
 * V3.1 Core Edition - Resolution Layer 타입 정의
 */

import { NeedsId, NeedsLevel } from './needs';

// ============ Resolution (Needs 충돌 해결) ============

export interface ResolvedNeed {
  /** Needs ID */
  id: NeedsId;
  /** 최종 강도 */
  finalLevel: NeedsLevel;
  /** 우선순위 (낮을수록 우선) */
  priority: number;
  /** 해결/조정 노트 */
  resolutionNote?: string;
}

export interface ResolutionResult {
  /** 해결된 Needs 목록 */
  resolved: ResolvedNeed[];
  /** 충돌 기록 */
  conflicts?: {
    description: string;
    resolution: string;
  }[];
  /** 처리 시점 */
  timestamp: string;
}




























