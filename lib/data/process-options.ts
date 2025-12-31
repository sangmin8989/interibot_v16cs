/**
 * 인테리봇 V5 공정 옵션 SSOT (Single Source of Truth)
 * 
 * ⚠️ 절대 규칙: 공정 정의는 오직 이 파일에서만 관리합니다.
 * 다른 파일에서 공정 배열을 재정의하거나 하드코딩하는 것은 금지됩니다.
 * 
 * @see Phase 1 최종 보완 지시문
 * @see 통합 명세서 제2장 2.1 SSOT 원칙
 */

export const PROCESS_OPTIONS = [
  { id: 'KITCHEN', label: '주방', hasDetailPage: true, hasOptions: true, maxSelectable: 1, order: 10 },
  { id: 'BATH', label: '욕실', hasDetailPage: true, hasOptions: true, maxSelectable: 3, order: 20 },
  { id: 'FLOOR', label: '바닥재', hasDetailPage: true, hasOptions: true, maxSelectable: 1, order: 30 },
  { id: 'TILE', label: '타일', hasDetailPage: true, hasOptions: true, maxSelectable: 1, order: 40 },
  { id: 'WALLPAPER', label: '도배', hasDetailPage: true, hasOptions: true, maxSelectable: 1, order: 50 },
  { id: 'FURNITURE', label: '가구', hasDetailPage: true, hasOptions: true, maxSelectable: 1, order: 60 },
  { id: 'WINDOW', label: '샤시', hasDetailPage: true, hasOptions: true, maxSelectable: 1, order: 70 },
  { id: 'DOOR', label: '중문', hasDetailPage: true, hasOptions: true, maxSelectable: 1, order: 80 },
  { id: 'PAINT', label: '도장', hasDetailPage: true, hasOptions: false, maxSelectable: 1, order: 90 },
  { id: 'ELECTRIC', label: '전기', hasDetailPage: true, hasOptions: true, maxSelectable: 1, order: 100 },
  { id: 'FILM', label: '필름', hasDetailPage: true, hasOptions: true, maxSelectable: 1, order: 110 },
  { id: 'DEMOLITION', label: '철거', hasDetailPage: true, hasOptions: false, maxSelectable: 1, order: 0 },
] as const;

export type ProcessOption = (typeof PROCESS_OPTIONS)[number];
export type ProcessId = ProcessOption['id'];

export const PROCESS_BY_ID: Record<ProcessId, ProcessOption> = Object.fromEntries(
  PROCESS_OPTIONS.map(p => [p.id, p])
) as Record<ProcessId, ProcessOption>;

export function isProcessId(x: unknown): x is ProcessId {
  return typeof x === 'string' && Object.prototype.hasOwnProperty.call(PROCESS_BY_ID, x);
}

/**
 * 하위호환: "예전 한글 코드"를 영문 ProcessId로 정규화
 * - 이 매핑은 SSOT 내부에만 존재 (외부 파일로 복사 금지)
 * - label은 바뀔 수 있으므로, "예전 저장값"을 확실히 살리려면 명시 맵이 안전합니다.
 */
const KO_TO_ID: Record<string, ProcessId> = {
  '주방': 'KITCHEN',
  '욕실': 'BATH',
  '바닥재': 'FLOOR',
  '타일': 'TILE',
  '도배': 'WALLPAPER',
  '가구': 'FURNITURE',
  '샤시': 'WINDOW',
  '중문': 'DOOR',
  '도장': 'PAINT',
  '전기': 'ELECTRIC',
  '필름': 'FILM',
  '철거': 'DEMOLITION',
  // 추가 변형 (혹시 있을 수 있는 변형들)
  '목공': 'FURNITURE', // 예전에 목공으로 불렀을 수 있음
};

/**
 * 반대로 표시용 한글 라벨 필요하면 SSOT에서 제공
 */
export const ID_TO_KO: Record<ProcessId, string> = Object.fromEntries(
  PROCESS_OPTIONS.map(p => [p.id, p.label])
) as Record<ProcessId, string>;

/**
 * 공정 ID 정규화 함수
 * - 영문 ProcessId면 그대로 반환
 * - 한글 코드면 영문으로 변환
 * - 유효하지 않으면 undefined 반환
 */
export function normalizeProcessId(input: unknown): ProcessId | undefined {
  if (isProcessId(input)) return input;
  if (typeof input !== 'string') return undefined;

  const trimmed = input.trim();
  if (isProcessId(trimmed)) return trimmed;

  const mapped = KO_TO_ID[trimmed];
  return mapped ?? undefined;
}

/**
 * 배열/CSV 등에서 공통으로 쓰는 정규화 도우미
 * - 배열, CSV 문자열, 단일 값 모두 처리
 * - 중복 제거 + 순서 유지
 */
export function normalizeProcessIds(inputs: unknown): ProcessId[] {
  const arr: unknown[] =
    Array.isArray(inputs) ? inputs :
    typeof inputs === 'string' ? inputs.split(',').map(s => s.trim()) :
    [];

  const out: ProcessId[] = [];
  for (const x of arr) {
    const id = normalizeProcessId(x);
    if (!id) continue;
    if (!out.includes(id)) out.push(id); // 중복 제거 + 순서 유지
  }
  return out;
}

/**
 * 공정 ID로 공정 옵션 찾기
 */
export function getProcessOption(id: ProcessId): ProcessOption {
  return PROCESS_BY_ID[id];
}

/**
 * 세부 옵션이 있는 공정만 필터링
 */
export function getProcessesWithOptions(): ProcessOption[] {
  return PROCESS_OPTIONS.filter(p => p.hasOptions);
}

/**
 * 공정 ID 배열로 공정 옵션 배열 찾기
 */
export function getProcessOptions(ids: ProcessId[]): ProcessOption[] {
  return ids
    .map(id => getProcessOption(id))
    .filter((p): p is ProcessOption => p !== undefined);
}

/**
 * 공정 ID를 한글 라벨로 변환
 */
export function getProcessLabel(id: ProcessId): string {
  return getProcessOption(id)?.label || id;
}
