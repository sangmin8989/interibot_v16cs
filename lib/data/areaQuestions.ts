// 공정별 세부 질문 데이터

export interface AreaOption {
  id: string
  text: string
  icon?: string
  description?: string
}

export interface AreaQuestion {
  id: string
  title: string
  description?: string
  type: 'single' | 'multiple'
  options: AreaOption[]
  maxSelections?: number
}

// 공정별 질문 매핑
export const AREA_QUESTIONS: Record<string, AreaQuestion[]> = {
  // 거실
  living: [
    {
      id: 'living_style',
      title: '거실 스타일 선호도',
      description: '원하시는 거실 분위기를 선택해주세요',
      type: 'single',
      options: [
        { id: 'modern', text: '모던/미니멀', icon: '🏢', description: '깔끔하고 심플한 디자인' },
        { id: 'classic', text: '클래식/엔틱', icon: '🏛️', description: '고급스럽고 우아한 분위기' },
        { id: 'scandinavian', text: '북유럽/스칸디', icon: '🌲', description: '밝고 자연스러운 느낌' },
        { id: 'industrial', text: '인더스트리얼', icon: '🏭', description: '빈티지하고 개성있는 스타일' },
      ],
    },
    {
      id: 'living_tv',
      title: 'TV 벽면 구성',
      description: 'TV 설치 방식을 선택해주세요',
      type: 'single',
      options: [
        { id: 'tv_stand', text: 'TV 거치대', description: '벽걸이형 TV' },
        { id: 'tv_cabinet', text: 'TV 장식장', description: '수납형 TV장' },
        { id: 'builtin', text: '빌트인', description: '벽면 매립형' },
        { id: 'none', text: '없음', description: 'TV 미설치' },
      ],
    },
    {
      id: 'living_storage',
      title: '거실 수납 필요',
      description: '필요한 수납 공간을 모두 선택해주세요 (복수선택)',
      type: 'multiple',
      maxSelections: 5,
      options: [
        { id: 'wall_cabinet', text: '벽면 수납장' },
        { id: 'bookshelf', text: '책장/선반' },
        { id: 'sideboard', text: '사이드보드' },
        { id: 'display', text: '디스플레이장' },
        { id: 'none', text: '필요없음' },
      ],
    },
  ],

  // 주방
  kitchen: [
    {
      id: 'kitchen_layout',
      title: '주방 레이아웃',
      description: '선호하는 주방 구조를 선택해주세요',
      type: 'single',
      options: [
        { id: 'straight', text: '일자형', icon: '━', description: '한쪽 벽면 배치' },
        { id: 'l_shape', text: 'ㄱ자형', icon: '┗', description: '모서리 활용형' },
        { id: 'u_shape', text: 'ㄷ자형', icon: '⊐', description: '삼면 배치형' },
        { id: 'island', text: '아일랜드형', icon: '⊞', description: '중앙 조리대 포함' },
      ],
    },
    {
      id: 'kitchen_appliances',
      title: '주방 가전/설비',
      description: '설치하고 싶은 항목을 모두 선택해주세요 (복수선택)',
      type: 'multiple',
      maxSelections: 8,
      options: [
        { id: 'dishwasher', text: '식기세척기', icon: '🍽️' },
        { id: 'oven', text: '오븐/전자레인지', icon: '🔥' },
        { id: 'induction', text: '인덕션', icon: '⚡' },
        { id: 'hood', text: '후드/레인지후드', icon: '💨' },
        { id: 'water_purifier', text: '정수기', icon: '💧' },
        { id: 'food_disposer', text: '음식물처리기', icon: '♻️' },
        { id: 'wine_cooler', text: '와인쿨러', icon: '🍷' },
        { id: 'pantry', text: '팬트리/식품보관실', icon: '📦' },
      ],
    },
    {
      id: 'kitchen_countertop',
      title: '상판 재질 선호도',
      type: 'single',
      options: [
        { id: 'quartz', text: '엔지니어드스톤', description: '내구성 우수, 관리 편함' },
        { id: 'marble', text: '천연대리석', description: '고급스러운 느낌' },
        { id: 'granite', text: '화강암', description: '튼튼하고 열에 강함' },
        { id: 'stainless', text: '스테인리스', description: '위생적이고 현대적' },
      ],
    },
  ],

  // 욕실
  bathroom: [
    {
      id: 'bathroom_style',
      title: '욕실 스타일',
      type: 'single',
      options: [
        { id: 'modern', text: '모던', description: '깔끔한 직선 디자인' },
        { id: 'luxury', text: '럭셔리', description: '고급 호텔 스타일' },
        { id: 'natural', text: '내추럴', description: '자연스러운 분위기' },
        { id: 'simple', text: '심플', description: '실용적이고 단순함' },
      ],
    },
    {
      id: 'bathroom_bathtub',
      title: '욕조 설치',
      type: 'single',
      options: [
        { id: 'bathtub', text: '욕조 필요', icon: '🛁', description: '욕조 설치' },
        { id: 'shower_booth', text: '샤워부스', icon: '🚿', description: '샤워만 가능' },
        { id: 'both', text: '욕조+샤워부스', description: '분리형 욕실' },
        { id: 'none', text: '기존 유지', description: '변경 없음' },
      ],
    },
    {
      id: 'bathroom_features',
      title: '욕실 추가 기능',
      description: '원하는 기능을 모두 선택해주세요 (복수선택)',
      type: 'multiple',
      maxSelections: 6,
      options: [
        { id: 'bidet', text: '비데', icon: '🚽' },
        { id: 'double_sink', text: '투볼 세면대', icon: '🚰' },
        { id: 'storage', text: '수납장', icon: '📦' },
        { id: 'dryer', text: '건조대/빨래건조기', icon: '🌀' },
        { id: 'heated_floor', text: '바닥난방', icon: '🔥' },
        { id: 'ventilation', text: '환기시스템', icon: '💨' },
      ],
    },
  ],

  // 침실
  bedroom: [
    {
      id: 'bedroom_closet',
      title: '침실 수납',
      type: 'single',
      options: [
        { id: 'builtin', text: '붙박이장', icon: '🚪', description: '벽면 수납장' },
        { id: 'walk_in', text: '드레스룸', icon: '👔', description: '별도 옷방' },
        { id: 'wardrobe', text: '독립 옷장', description: '가구형 옷장' },
        { id: 'none', text: '필요없음', description: '기존 가구 활용' },
      ],
    },
    {
      id: 'bedroom_lighting',
      title: '침실 조명',
      description: '원하는 조명을 모두 선택해주세요 (복수선택)',
      type: 'multiple',
      maxSelections: 5,
      options: [
        { id: 'ceiling', text: '메인 조명', description: '천장 등' },
        { id: 'indirect', text: '간접 조명', description: '분위기 조명' },
        { id: 'bedside', text: '침대 독서등', description: '스탠드/벽등' },
        { id: 'mood', text: '무드등', description: '은은한 조명' },
        { id: 'smart', text: '스마트 조명', description: '조도/색온도 조절' },
      ],
    },
    {
      id: 'bedroom_floor',
      title: '침실 바닥재',
      type: 'single',
      options: [
        { id: 'wood', text: '원목 마루', description: '따뜻한 느낌' },
        { id: 'laminate', text: '강화마루', description: '실용적이고 관리 쉬움' },
        { id: 'vinyl', text: '강마루/PVC', description: '저렴하고 다양한 디자인' },
        { id: 'carpet', text: '카펫/타일카펫', description: '부드러운 촉감' },
      ],
    },
  ],

  // 아이방
  kidsroom: [
    {
      id: 'kids_age',
      title: '자녀 연령대',
      type: 'single',
      options: [
        { id: 'infant', text: '영유아 (0-5세)', icon: '👶' },
        { id: 'elementary', text: '초등학생 (6-12세)', icon: '🧒' },
        { id: 'teenager', text: '청소년 (13-18세)', icon: '👦' },
        { id: 'multi', text: '여러 연령대', icon: '👨‍👩‍👧‍👦' },
      ],
    },
    {
      id: 'kids_furniture',
      title: '아이방 가구',
      description: '필요한 가구를 모두 선택해주세요 (복수선택)',
      type: 'multiple',
      maxSelections: 6,
      options: [
        { id: 'bed', text: '침대', icon: '🛏️' },
        { id: 'desk', text: '책상', icon: '📚' },
        { id: 'bookshelf', text: '책장', icon: '📖' },
        { id: 'wardrobe', text: '옷장', icon: '👔' },
        { id: 'toy_storage', text: '장난감 수납', icon: '🧸' },
        { id: 'play_area', text: '놀이 공간', icon: '🎮' },
      ],
    },
    {
      id: 'kids_safety',
      title: '안전 기능',
      description: '필요한 안전 기능을 선택해주세요 (복수선택)',
      type: 'multiple',
      maxSelections: 5,
      options: [
        { id: 'corner_guard', text: '모서리 보호대' },
        { id: 'soft_floor', text: '충격 흡수 바닥재' },
        { id: 'window_lock', text: '창문 안전장치' },
        { id: 'outlet_cover', text: '콘센트 안전커버' },
        { id: 'air_purifier', text: '공기청정기/환기' },
      ],
    },
  ],

  // 서재/작업실
  study: [
    {
      id: 'study_purpose',
      title: '공간 주 용도',
      type: 'single',
      options: [
        { id: 'work', text: '재택근무', icon: '💼' },
        { id: 'hobby', text: '취미/창작', icon: '🎨' },
        { id: 'reading', text: '독서/학습', icon: '📚' },
        { id: 'multi', text: '다목적', icon: '🔄' },
      ],
    },
    {
      id: 'study_furniture',
      title: '서재 가구',
      description: '필요한 가구를 모두 선택해주세요 (복수선택)',
      type: 'multiple',
      maxSelections: 6,
      options: [
        { id: 'desk', text: '책상/작업대', icon: '🖥️' },
        { id: 'bookshelf', text: '책장/선반', icon: '📚' },
        { id: 'chair', text: '인체공학 의자', icon: '🪑' },
        { id: 'storage', text: '수납장/서랍', icon: '📦' },
        { id: 'display', text: '디스플레이 선반', icon: '🏆' },
        { id: 'sofa', text: '독서용 소파', icon: '🛋️' },
      ],
    },
  ],

  // 드레스룸
  dressing: [
    {
      id: 'dressing_size',
      title: '드레스룸 규모',
      type: 'single',
      options: [
        { id: 'small', text: '소형 (2평 미만)', description: '기본 수납' },
        { id: 'medium', text: '중형 (2-4평)', description: '여유있는 수납' },
        { id: 'large', text: '대형 (4평 이상)', description: '럭셔리 드레스룸' },
      ],
    },
    {
      id: 'dressing_features',
      title: '드레스룸 구성',
      description: '원하는 기능을 모두 선택해주세요 (복수선택)',
      type: 'multiple',
      maxSelections: 8,
      options: [
        { id: 'hanging', text: '행거 수납', icon: '👔' },
        { id: 'drawer', text: '서랍형 수납', icon: '📦' },
        { id: 'shoe_rack', text: '신발장', icon: '👟' },
        { id: 'accessories', text: '액세서리 수납', icon: '💍' },
        { id: 'mirror', text: '전신거울', icon: '🪞' },
        { id: 'island', text: '아일랜드 서랍', icon: '🏝️' },
        { id: 'lighting', text: '조명 시스템', icon: '💡' },
        { id: 'safe', text: '금고/귀중품 보관', icon: '🔐' },
      ],
    },
  ],

  // 베란다
  veranda: [
    {
      id: 'veranda_purpose',
      title: '베란다 용도',
      type: 'single',
      options: [
        { id: 'laundry', text: '빨래/세탁', icon: '👕' },
        { id: 'storage', text: '수납/창고', icon: '📦' },
        { id: 'garden', text: '정원/식물', icon: '🌿' },
        { id: 'rest', text: '휴식/카페', icon: '☕' },
      ],
    },
    {
      id: 'veranda_features',
      title: '베란다 기능',
      description: '필요한 기능을 모두 선택해주세요 (복수선택)',
      type: 'multiple',
      maxSelections: 5,
      options: [
        { id: 'window', text: '창호 교체', icon: '🪟' },
        { id: 'floor', text: '바닥 마감', icon: '🔲' },
        { id: 'storage_closet', text: '수납장 설치', icon: '🗄️' },
        { id: 'sink', text: '간이 싱크대', icon: '🚰' },
        { id: 'lighting', text: '조명/콘센트', icon: '💡' },
      ],
    },
  ],

  // 다용도실
  laundry: [
    {
      id: 'laundry_appliances',
      title: '세탁실 가전',
      description: '설치할 가전을 모두 선택해주세요 (복수선택)',
      type: 'multiple',
      maxSelections: 5,
      options: [
        { id: 'washer', text: '세탁기', icon: '🌀' },
        { id: 'dryer', text: '건조기', icon: '🔥' },
        { id: 'washer_dryer', text: '세탁건조기', icon: '♻️' },
        { id: 'sink', text: '세탁 싱크대', icon: '🚰' },
        { id: 'storage', text: '수납장', icon: '📦' },
      ],
    },
    {
      id: 'laundry_features',
      title: '추가 기능',
      type: 'multiple',
      maxSelections: 4,
      options: [
        { id: 'drying_rack', text: '실내 건조대' },
        { id: 'ironing', text: '다림질 공간' },
        { id: 'pet_shower', text: '반려동물 샤워 공간' },
        { id: 'cleaning', text: '청소도구 보관' },
      ],
    },
  ],

  // 현관
  entrance: [
    {
      id: 'entrance_storage',
      title: '현관 수납',
      type: 'single',
      options: [
        { id: 'shoe_closet', text: '신발장', icon: '👟', description: '기본 신발 수납' },
        { id: 'builtin', text: '붙박이장', icon: '🚪', description: '벽면 수납장' },
        { id: 'walk_in', text: '드레스룸 연결', icon: '🚶', description: '현관 → 드레스룸' },
        { id: 'minimal', text: '최소 수납', description: '간단한 선반만' },
      ],
    },
    {
      id: 'entrance_features',
      title: '현관 기능',
      description: '필요한 기능을 모두 선택해주세요 (복수선택)',
      type: 'multiple',
      maxSelections: 5,
      options: [
        { id: 'mirror', text: '전신거울', icon: '🪞' },
        { id: 'bench', text: '신발 착용 의자', icon: '🪑' },
        { id: 'hanger', text: '외투 걸이', icon: '🧥' },
        { id: 'lighting', text: '센서 조명', icon: '💡' },
        { id: 'air_purifier', text: '공기청정/탈취', icon: '💨' },
      ],
    },
  ],

  // 전체 리모델링
  fullhome: [
    {
      id: 'fullhome_priority',
      title: '리모델링 우선순위',
      description: '가장 중요한 공간 순서를 선택해주세요 (복수선택)',
      type: 'multiple',
      maxSelections: 3,
      options: [
        { id: 'kitchen', text: '주방', icon: '🍳' },
        { id: 'bathroom', text: '욕실', icon: '🚿' },
        { id: 'living', text: '거실', icon: '🛋️' },
        { id: 'bedroom', text: '침실', icon: '🛏️' },
        { id: 'storage', text: '수납공간', icon: '📦' },
      ],
    },
    {
      id: 'fullhome_style',
      title: '전체 인테리어 스타일',
      type: 'single',
      options: [
        { id: 'modern', text: '모던', description: '깔끔하고 현대적인' },
        { id: 'scandinavian', text: '북유럽/내추럴', description: '밝고 자연스러운' },
        { id: 'classic', text: '클래식/럭셔리', description: '고급스럽고 우아한' },
        { id: 'industrial', text: '인더스트리얼', description: '빈티지하고 개성있는' },
        { id: 'mixed', text: '믹스매치', description: '공간마다 다른 스타일' },
      ],
    },
    {
      id: 'fullhome_special',
      title: '특별히 신경쓰고 싶은 부분',
      description: '중요하게 생각하는 항목을 모두 선택해주세요 (복수선택)',
      type: 'multiple',
      maxSelections: 5,
      options: [
        { id: 'storage', text: '수납 공간 최대화', icon: '📦' },
        { id: 'lighting', text: '조명 시스템', icon: '💡' },
        { id: 'smart_home', text: '스마트홈 시스템', icon: '🏠' },
        { id: 'eco', text: '친환경 자재', icon: '♻️' },
        { id: 'energy', text: '에너지 효율', icon: '⚡' },
      ],
    },
  ],
}

// 영역명 한글 매핑
export const AREA_LABELS: Record<string, string> = {
  living: '거실',
  kitchen: '주방',
  bathroom: '욕실',
  bedroom: '침실',
  kidsroom: '아이방',
  study: '서재/작업실',
  dressing: '드레스룸',
  veranda: '베란다',
  laundry: '다용도실',
  entrance: '현관',
  storage: '창고/수납',
  fullhome: '전체 리모델링',
}

// 영역별 질문 가져오기
export function getQuestionsForArea(areaKey: string): AreaQuestion[] {
  return AREA_QUESTIONS[areaKey] || []
}

