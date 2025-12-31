/**
 * 인테리봇 공정 정의 호환 레이어
 * 
 * ⚠️ 이 파일은 SSOT(lib/data/process-options.ts)의 re-export만 수행합니다.
 * 공정 정의는 SSOT에서만 관리하며, 이 파일은 하위 호환성을 위한 레이어입니다.
 * 
 * @see Phase 1 최종 보완 지시문 4.1
 */

export { 
  PROCESS_OPTIONS as PROCESS_DEFINITIONS, 
  PROCESS_BY_ID, 
  isProcessId, 
  getProcessOption,
  normalizeProcessId,
  normalizeProcessIds,
  getProcessLabel,
  getProcessesWithOptions,
  getProcessOptions,
} from '@/lib/data/process-options';

export type { ProcessId, ProcessOption } from '@/lib/data/process-options';

// 하위 호환성: 기존 견적/온보딩 시스템에서 사용하는 defaultProcessesBySpace
// 이는 constants/processes.ts에서 re-export합니다.
export { defaultProcessesBySpace } from '@/constants/processes';
