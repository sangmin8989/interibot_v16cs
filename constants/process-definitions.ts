import type { ProcessDefinition, ProcessTierOptions } from '@/types/process-options';

/**
 * 인테리봇 공정 정의 (10개)
 * 3단 옵션 구조: 기본/편하게/프리미엄
 */
export const PROCESS_DEFINITIONS: ProcessDefinition[] = [
  // ① 철거 - 선택 공정 자동 연동
  {
    id: 'demolition',
    order: 1,
    name: '철거',
    description: '선택한 공정에 따라 자동으로 철거 범위가 결정됩니다',
    applicableSpaces: ['all'],
    autoDemolition: false,
    tierOptions: {
      basic: [
        { id: 'selective_demolition', name: '선택 범위 철거', description: '선택한 공정 해당 영역 철거' },
        { id: 'waste_disposal', name: '폐기물 처리', description: '철거 폐기물 운반 및 처리' },
        { id: 'protection', name: '보양', description: '시공 부위 외 보호 작업' },
      ],
      comfort: [],
      premium: [],
    },
  },

  // ② 마감 (바닥 + 벽/천장)
  // ✅ 도배/필름은 철거 불필요, 바닥재 교체 시만 철거 필요
  {
    id: 'finish',
    order: 2,
    name: '마감',
    description: '바닥, 벽, 천장 마감 공사',
    applicableSpaces: ['living', 'masterBedroom', 'room1', 'room2', 'room3', 'kitchen', 'entrance', 'dressRoom'],
    autoDemolition: false,  // ✅ 바닥 선택 시에만 철거 (calculator에서 처리)
    tierOptions: {
      basic: [
        { id: 'floor', name: '바닥', description: '마루/타일/장판 중 선택', priceKey: 'floor' },
        { id: 'wall', name: '벽', description: '도장/도배 중 선택', priceKey: 'wall' },
        { id: 'ceiling', name: '천장 도장', priceKey: 'ceiling' },
        { id: 'baseboard', name: '걸레받이 교체', priceKey: 'baseboard' },
        { id: 'molding', name: '몰딩 교체', priceKey: 'molding' },
      ],
      comfort: [
        { id: 'grout_color', name: '줄눈 색상 선택' },
        { id: 'waterproof_floor', name: '물청소 가능 마루' },
        { id: 'stain_coat', name: '오염 방지 코팅' },
        { id: 'wall_tone', name: '벽면 톤 통일' },
      ],
      premium: [
        // extended 항목
        { id: 'large_tile', name: '대판 타일', priceKey: 'large_tile' },
        { id: 'mixed_floor', name: '공간별 바닥재 혼합' },
        { id: 'art_wall', name: '아트월', priceKey: 'art_wall' },
        { id: 'wainscoting', name: '웨인스코팅' },
        { id: 'point_color', name: '포인트 컬러' },
        // reinforced 항목 추가
        { id: 'soundproof', name: '층간소음 완충재', priceKey: 'soundproof' },
        { id: 'crack_repair', name: '균열 보강' },
        { id: 'leveling', name: '정밀 평탄화' },
        { id: 'humidity_primer', name: '고습도 프라이머' },
      ],
    },
  },

  // ③ 조명·전기
  {
    id: 'electric',
    order: 3,
    name: '조명·전기',
    description: '조명 교체 및 전기 공사',
    applicableSpaces: ['living', 'masterBedroom', 'room1', 'room2', 'room3', 'kitchen', 'bathroom', 'entrance'],
    autoDemolition: false,
    tierOptions: {
      basic: [
        { id: 'main_light', name: '메인등 교체', priceKey: 'main_light' },
        { id: 'recessed_light', name: '매립등', priceKey: 'recessed_light' },
        { id: 'indirect_light', name: '간접등', priceKey: 'indirect_light' },
        { id: 'switch_outlet', name: '스위치·콘센트', priceKey: 'switch_outlet' },
        { id: 'induction_circuit', name: '인덕션 회로', priceKey: 'induction_circuit' },
        { id: 'panel_maintenance', name: '분전함 정비', priceKey: 'panel' },
        { id: 'ventilation', name: '환풍기', priceKey: 'ventilation' },
      ],
      comfort: [
        { id: 'color_temp', name: '색온도 선택' },
        { id: 'brightness_profile', name: '밝기 프로파일' },
        { id: 'indirect_switch', name: '간접등 스위치 분리' },
      ],
      premium: [
        // extended 항목
        { id: 'upper_cabinet_led', name: '상부장 LED', priceKey: 'cabinet_led' },
        { id: 'lower_cabinet_led', name: '하부장 LED' },
        { id: 'sensor_light', name: '센서등', priceKey: 'sensor_light' },
        // reinforced 항목 추가
        { id: 'moldless_indirect', name: '무몰딩 간접등' },
        { id: 'breaker_upgrade', name: '누전차단기 업그레이드' },
        { id: 'old_wiring', name: '노후 배선 정리' },
      ],
    },
  },

  // ④ 주방
  // ✅ 싱크대 철거비가 설치비에 포함되어 별도 철거비 없음
  {
    id: 'kitchen',
    order: 4,
    name: '주방',
    description: '주방 가구 및 설비 공사',
    applicableSpaces: ['kitchen', 'utility'],
    autoDemolition: false,  // ✅ 싱크대 설치비에 철거 포함
    subSpaceSelection: false,
    tierOptions: {
      basic: [
        { id: 'upper_lower_cabinet', name: '상·하부장', priceKey: 'kitchen_cabinet' },
        { id: 'countertop', name: '상판', priceKey: 'countertop' },
        { id: 'sink_faucet', name: '싱크볼·수전', priceKey: 'sink' },
        { id: 'hood', name: '후드', priceKey: 'hood' },
        { id: 'wall_tile', name: '벽타일', priceKey: 'kitchen_tile' },
        { id: 'fridge_cabinet', name: '냉장고장', priceKey: 'fridge_cabinet' },
        { id: 'plumbing', name: '배관 이동', priceKey: 'plumbing' },
      ],
      comfort: [
        { id: 'storage_ratio', name: '수납 비율 선택' },
        { id: 'upper_height', name: '상부장 높이 조절' },
        { id: 'drawer_organizer', name: '서랍 정리 키트' },
        { id: 'handle_select', name: '손잡이 선택' },
      ],
      premium: [
        // extended 항목
        { id: 'island', name: '아일랜드 추가', priceKey: 'island' },
        { id: 'tall_cabinet', name: '키큰장', priceKey: 'tall_cabinet' },
        { id: 'dining_integrated', name: '식탁 일체형' },
        // reinforced 항목 추가
        { id: 'heat_resistant', name: '상판 내열 보강' },
        { id: 'hinge_rail_heavy', name: '레일·경첩 하중 보완' },
      ],
    },
  },

  // ⑤ 욕실
  {
    id: 'bathroom',
    order: 5,
    name: '욕실',
    description: '욕실 전체 공사',
    applicableSpaces: ['masterBathroom', 'commonBathroom'],
    autoDemolition: true,
    subSpaceSelection: true,
    tierOptions: {
      basic: [
        { id: 'demolition', name: '철거', priceKey: 'bathroom_demolition' },
        { id: 'waterproof', name: '방수', priceKey: 'waterproof' },
        { id: 'tile', name: '타일', priceKey: 'bathroom_tile' },
        { id: 'toilet_basin', name: '변기·세면기·수전', priceKey: 'sanitary' },
        { id: 'cabinet', name: '욕실장', priceKey: 'bathroom_cabinet' },
        { id: 'zendai', name: '젠다이', priceKey: 'zendai' },
        { id: 'partition', name: '파티션', priceKey: 'partition' },
        { id: 'ventilation', name: '환풍기', priceKey: 'bath_ventilation' },
        { id: 'ceiling', name: '천장', priceKey: 'bath_ceiling' },
        { id: 'silicone', name: '항곰팡이 실리콘' },
        { id: 'drain_slope', name: '배수 경사' },
      ],
      comfort: [
        { id: 'light_brightness', name: '조명 밝기 선택' },
        { id: 'shower_separation', name: '샤워 공간 분리' },
        { id: 'soft_rail_door', name: '소프트레일 도어' },
        { id: 'floor_heating', name: '바닥 난방' },
      ],
      premium: [
        // extended 항목
        { id: 'bidet', name: '비데', priceKey: 'bidet' },
        { id: 'extra_cabinet', name: '추가 수납장' },
        { id: 'bathtub', name: '욕조', priceKey: 'bathtub' },
        { id: 'smart_faucet', name: '스마트 수전' },
        // reinforced 항목 추가
        { id: 'dehumidify_vent', name: '냉온풍 제습 환풍기' },
        { id: 'pipe_replace', name: '배관 교체' },
      ],
    },
  },

  // ⑥ 도어·창호
  // ✅ 탈거만 (파괴 없음) - 별도 철거비 없음
  {
    id: 'door_window',
    order: 6,
    name: '도어·창호',
    description: '방문, 중문, 창호 공사',
    applicableSpaces: ['masterBedroom', 'room1', 'room2', 'room3', 'living', 'entrance', 'balcony'],
    autoDemolition: false,  // ✅ 탈거만 (설치비에 포함)
    tierOptions: {
      basic: [
        { id: 'room_door', name: '방문 교체', priceKey: 'room_door' },
        { id: 'door_frame', name: '문틀·문선', priceKey: 'door_frame' },
        { id: 'handle_hinge', name: '손잡이·경첩', priceKey: 'handle' },
        { id: 'middle_door', name: '중문', priceKey: 'middle_door' },
        { id: 'entrance_film', name: '현관문 필름', priceKey: 'entrance_film' },
        { id: 'door_lock', name: '도어락', priceKey: 'door_lock' },
        { id: 'balcony_window', name: '발코니창', priceKey: 'balcony_window' },
        { id: 'room_window', name: '방창', priceKey: 'room_window' },
      ],
      comfort: [
        { id: 'gap_adjust', name: '하부틈 조정' },
        { id: 'soft_rail', name: '소프트레일' },
        { id: 'auto_lock', name: '자동잠금' },
        { id: 'filter_vent', name: '필터형 환기창' },
        { id: 'screen', name: '방충망' },
      ],
      premium: [
        // extended 항목
        { id: 'upper_fixed', name: '중문 상부 고정창' },
        { id: 'two_tone', name: '투톤 도어' },
        { id: 'folding_door', name: '폴딩도어', priceKey: 'folding_door' },
        { id: 'double_window', name: '이중창', priceKey: 'double_window' },
        // reinforced 항목 추가
        { id: 'insulation_film', name: '단열필름' },
      ],
    },
  },

  // ⑦ 가구
  // ✅ 붙박이장 철거+설치가 공사비에 포함
  {
    id: 'furniture',
    order: 7,
    name: '가구',
    description: '붙박이장, 신발장 등 가구 공사',
    applicableSpaces: ['masterBedroom', 'room1', 'room2', 'room3', 'dressRoom', 'entrance', 'kitchen'],
    autoDemolition: false,  // ✅ 공사비에 철거+설치 포함
    tierOptions: {
      basic: [
        { id: 'builtin_closet', name: '붙박이장', priceKey: 'builtin_closet' },
        { id: 'shoe_cabinet', name: '신발장', priceKey: 'shoe_cabinet' },
        { id: 'pantry', name: '팬트리장', priceKey: 'pantry' },
        { id: 'inner_config', name: '내부 구성', description: '서랍/선반/행거' },
        { id: 'material_select', name: '재질 선택' },
      ],
      comfort: [
        { id: 'inner_led', name: '내부 LED' },
        { id: 'soft_closing', name: '소프트클로징' },
        { id: 'organizer_module', name: '정리 모듈' },
      ],
      premium: [
        // extended 항목
        { id: 'full_wall', name: '벽면 전체형' },
        { id: 'upper_expand', name: '상부장 확대' },
        { id: 'mirror_integrated', name: '전신경 일체형' },
        // reinforced 항목 추가
        { id: 'hinge_rail_heavy', name: '경첩·레일 하중 보완' },
      ],
    },
  },

  // ⑧ 필름
  {
    id: 'film',
    order: 8,
    name: '필름',
    description: '인테리어 필름 시공',
    applicableSpaces: ['all'],
    autoDemolition: false,
    tierOptions: {
      basic: [
        { id: 'selected_area', name: '선택 범위 필름 시공', priceKey: 'film' },
        { id: 'fire_retardant', name: '방염필름' },
      ],
      comfort: [
        { id: 'matte_gloss', name: '무광·유광 선택' },
        { id: 'handle_color', name: '손잡이·경첩 색상 통일' },
      ],
      premium: [
        // extended 항목
        { id: 'sliding_full', name: '슬라이딩도어 전체 필름' },
        { id: 'point_wall', name: '포인트 월 필름' },
        // reinforced 항목 추가
        { id: 'scratch_resistant', name: '내스크래치 필름' },
        { id: 'stain_resistant', name: '내오염 필름' },
      ],
    },
  },

  // ⑨ 베란다
  {
    id: 'balcony',
    order: 9,
    name: '베란다',
    description: '베란다 마감 공사',
    applicableSpaces: ['frontBalcony', 'rearBalcony'],
    autoDemolition: true,
    subSpaceSelection: true,
    tierOptions: {
      basic: [
        { id: 'insulation', name: '단열', priceKey: 'balcony_insulation' },
        { id: 'floor', name: '타일/데크', priceKey: 'balcony_floor' },
        { id: 'folding_door', name: '폴딩도어', priceKey: 'balcony_folding' },
        { id: 'ceiling', name: '천장 도장' },
        { id: 'drain', name: '배수 정리' },
        { id: 'shelf', name: '선반' },
      ],
      comfort: [
        { id: 'cleaning_storage', name: '청소도구 수납' },
        { id: 'indoor_drying', name: '실내 건조대' },
        { id: 'laundry_organizer', name: '세탁용품 정리대' },
      ],
      premium: [
        // extended 항목
        { id: 'wall_cabinet', name: '벽면 수납장' },
        { id: 'workbench', name: '작업대' },
        { id: 'dryer_space', name: '건조기 공간' },
      ],
    },
  },

  // ⑩ 현관
  {
    id: 'entrance',
    order: 10,
    name: '현관',
    description: '현관 마감 공사',
    applicableSpaces: ['entrance'],
    autoDemolition: true,
    tierOptions: {
      basic: [
        { id: 'tile', name: '타일', priceKey: 'entrance_tile' },
        { id: 'shoe_cabinet', name: '신발장', priceKey: 'entrance_shoe' },
        { id: 'wall_finish', name: '벽면 마감' },
        { id: 'middle_door', name: '중문', priceKey: 'entrance_middle' },
        { id: 'door_lock', name: '도어락', priceKey: 'entrance_lock' },
        { id: 'lighting', name: '조명', priceKey: 'entrance_light' },
      ],
      comfort: [
        { id: 'full_mirror', name: '전신경' },
        { id: 'umbrella_storage', name: '우산 수납' },
        { id: 'misc_box', name: '잡동사니 박스' },
      ],
      premium: [
        // extended 항목
        { id: 'upper_cabinet', name: '상부장' },
        { id: 'bench_shoe', name: '벤치형 신발장' },
      ],
    },
  },
];

/**
 * 공정 ID로 정의 찾기
 */
export function getProcessById(id: string): ProcessDefinition | undefined {
  return PROCESS_DEFINITIONS.find(p => p.id === id);
}

/**
 * 공간에 적용 가능한 공정 필터링
 */
export function getProcessesForSpace(spaceId: string): ProcessDefinition[] {
  return PROCESS_DEFINITIONS.filter(p => 
    p.applicableSpaces.includes('all') || p.applicableSpaces.includes(spaceId)
  );
}

/**
 * 철거 자동 연동 대상 공정
 */
export function getDemolitionLinkedProcesses(): ProcessDefinition[] {
  return PROCESS_DEFINITIONS.filter(p => p.autoDemolition === true);
}

/**
 * ============================================
 * 기존 코드 호환용 함수 (점진적 마이그레이션)
 * ============================================
 */

/**
 * 기존 getProcessGroupsForSpace 대체
 * 공간별 적용 가능한 공정 목록 반환
 */
export function getProcessGroupsForSpace(spaceId: string) {
  const processes = getProcessesForSpace(spaceId);
  
  // 기존 ProcessGroup 형식으로 변환
  return processes.map(p => ({
    category: p.id,
    name: p.name,
    type: 'single' as const,
    description: p.description,
    applicableSpaces: p.applicableSpaces,
    options: convertTierOptionsToLegacy(p.tierOptions),
  }));
}

/**
 * 3단 옵션을 기존 옵션 배열 형식으로 변환
 */
function convertTierOptionsToLegacy(tierOptions: ProcessTierOptions) {
  const legacyOptions: Array<{ id: string; name: string; description?: string }> = [];
  
  // 기본 옵션들
  tierOptions.basic.forEach(item => {
    legacyOptions.push({
      id: item.id,
      name: item.name,
      description: item.description,
    });
  });
  
  // "하지않음" 옵션 추가
  legacyOptions.push({
    id: 'none',
    name: '하지 않음',
    description: '이 공정을 진행하지 않습니다',
  });
  
  return legacyOptions;
}

/**
 * 기존 defaultProcessesBySpace 대체
 * 공간별 기본 공정 선택값
 */
export const defaultProcessesBySpace: Record<string, Record<string, string | null>> = {
  living: {
    finish: 'floor',
    electric: 'main_light',
    door_window: 'none',
    furniture: 'none',
    film: 'none',
  },
  kitchen: {
    kitchen: 'upper_lower_cabinet',
    finish: 'wall',
    electric: 'main_light',
  },
  masterBedroom: {
    finish: 'floor',
    electric: 'main_light',
    door_window: 'room_door',
    furniture: 'builtin_closet',
  },
  room1: {
    finish: 'floor',
    electric: 'main_light',
    door_window: 'room_door',
    furniture: 'none',
  },
  room2: {
    finish: 'floor',
    electric: 'main_light',
    door_window: 'room_door',
    furniture: 'none',
  },
  masterBathroom: {
    bathroom: 'demolition',
  },
  commonBathroom: {
    bathroom: 'demolition',
  },
  entrance: {
    entrance: 'tile',
  },
  frontBalcony: {
    balcony: 'insulation',
  },
  rearBalcony: {
    balcony: 'insulation',
  },
  dressRoom: {
    furniture: 'builtin_closet',
    finish: 'floor',
  },
};

/**
 * 선택된 공정에서 철거 연동 공간 계산
 */
export function getDemolitionSpaces(selectedProcesses: Record<string, Record<string, string | null>>): string[] {
  const demolitionSpaces: string[] = [];
  const linkedProcessIds = getDemolitionLinkedProcesses().map(p => p.id);
  
  Object.entries(selectedProcesses).forEach(([spaceId, processes]) => {
    Object.entries(processes).forEach(([processId, value]) => {
      // 철거 연동 대상 공정이고, "하지않음"이 아닌 경우
      if (linkedProcessIds.includes(processId) && value && value !== 'none') {
        if (!demolitionSpaces.includes(spaceId)) {
          demolitionSpaces.push(spaceId);
        }
      }
    });
  });
  
  return demolitionSpaces;
}
