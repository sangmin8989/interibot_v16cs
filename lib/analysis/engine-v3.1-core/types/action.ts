/**
 * V3.1 Core Edition - Action Layer 타입 정의
 */

import { NeedsId } from './needs';

// ============ Action (공정/옵션) ============

export interface ProcessRecommendation {
  /** 공정 ID */
  processId: string;
  /** 공정 이름 */
  processName: string;
  /** 연결된 Needs */
  relatedNeeds: NeedsId[];
  /** 우선순위 */
  priority: 'must' | 'recommended' | 'optional';
  /** 추천 이유 */
  reason: string;
}

export interface OptionRecommendation {
  /** 옵션 ID */
  optionId: string;
  /** 옵션 이름 */
  optionName: string;
  /** 연결된 Needs */
  relatedNeeds: NeedsId[];
  /** 추천 등급 */
  grade?: 'basic' | 'standard' | 'premium';
  /** 설명 */
  description?: string;
}

export interface ExplanationSegment {
  /** 설명 순서 */
  order: number;
  /** 제목 */
  title: string;
  /** 내용 */
  content: string;
  /** 관련 Needs */
  relatedNeeds?: NeedsId[];
}

export interface ActionResult {
  /** 추천 공정 목록 */
  processes: ProcessRecommendation[];
  /** 추천 옵션 목록 */
  options: OptionRecommendation[];
  /** 설명 (인과 구조) */
  explanation: ExplanationSegment[];
  /** 생성 시점 */
  timestamp: string;
}




















