/**
 * 3단 옵션 구조
 */
type OptionTier = 'basic' | 'comfort' | 'premium';

/**
 * 개별 옵션 항목
 */
interface ProcessOptionItem {
  id: string;           // 항목 ID (예: 'wallpaper', 'paint')
  name: string;         // 한글명 (예: '도배', '도장')
  description?: string; // 설명
  priceKey?: string;    // estimate-master-real.ts의 항목 연결 키
}

/**
 * 3단계 옵션 구조
 */
interface ProcessTierOptions {
  basic: ProcessOptionItem[];       // 필요한 만큼
  comfort: ProcessOptionItem[];     // 생활 편하게
  premium: ProcessOptionItem[];     // 아쉬움 없이
}

/**
 * 공정 정의
 */
interface ProcessDefinition {
  id: string;                        // 공정 ID (예: 'demolition', 'finish')
  order: number;                     // 순서 (1~10)
  name: string;                      // 한글명
  description: string;               // 설명
  applicableSpaces: string[];        // 적용 가능 공간
  tierOptions: ProcessTierOptions;   // 4단 옵션
  autoDemolition?: boolean;          // 철거 자동 연동 여부
  subSpaceSelection?: boolean;       // 하위 공간 선택 필요 여부 (욕실: 안방/공용)
}

/**
 * 고객 선택 결과
 */
interface ProcessSelection {
  processId: string;
  selectedSpaces: string[];          // 선택한 공간들
  selectedTier: OptionTier;          // 선택한 등급
  additionalOptions?: string[];      // 추가 선택 항목 (해당 등급 이상 항목 중)
}

export type { 
  OptionTier, 
  ProcessOptionItem, 
  ProcessTierOptions, 
  ProcessDefinition, 
  ProcessSelection 
};
