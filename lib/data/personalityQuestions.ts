// 백엔드 분석 엔진과 통합된 질문 시스템
// lib/analysis/questions/ 와 동일한 ID 체계 사용

export type AnalysisMode = 'quick' | 'standard' | 'deep' | 'vibe'

// Phase 2: 답변 상태 타입 정의
export type AnswerState = 'NORMAL' | 'UNKNOWN' | 'EXPERT_ASSUMPTION'

// Phase 2: 답변 데이터 구조
export interface QuestionAnswer {
  questionId: string
  answerState: AnswerState
  answerValue?: string  // NORMAL일 때만 존재
}

// Phase 3: 색상 파렛트 타입 정의 (구조만 설계, 실행은 OFF)
export type ColorPaletteStatus = 'KEEP' | 'TONE_ADJUST' | 'UNKNOWN'
export type ToneShift = 'WARM' | 'NEUTRAL' | 'COOL'

export interface ColorPalette {
  id: string
  mainColor: string  // 범주형 명칭 (예: "웜 화이트")
  subColor: string   // 범주형 명칭 (예: "뉴트럴 그레이")
  pointColor?: string // 범주형 명칭 (선택, 예: "소프트 우드톤")
}

export interface ColorPaletteState {
  status: ColorPaletteStatus
  paletteId?: string  // KEEP 또는 TONE_ADJUST일 때
  toneShift?: ToneShift  // TONE_ADJUST일 때만
}

export interface QuestionOption {
  id: string
  text: string
  value: string
  icon?: string
  isAuto?: boolean // AI 대신 선택 옵션
}

// Phase 0: 질문 통제 스키마 (V5 업그레이드)
export type QuestionImpactType = 'PRICE' | 'PROCESS' | 'OPTION' | 'NONE'

export interface Question {
  id: string  // 문자열 ID (백엔드와 동일)
  text: string
  options: QuestionOption[]
  // Phase 0: 질문 통제용 메타데이터 (선택적 필드 - 기존 코드 호환성 유지)
  questionId?: string  // 질문 고유 식별자 (id와 동일하거나 별도 관리)
  referencedFields?: string[]  // 이 질문이 참조하는 고객 입력 필드 목록
  impactType?: QuestionImpactType  // 견적 금액/공정 수/옵션 분기 영향도
  allowIfMissingOnly?: boolean  // 참조 필드가 비어 있을 때만 질문 허용 여부
}

export interface ModeConfig {
  id: AnalysisMode
  name: string
  icon: string
  questionCount: number
  estimatedTime: string
  questions: Question[]
}

// ========================================
// 빠르게 모드 (4문항) - lib/analysis/questions/quick.ts와 동기화
// ========================================
const quickQuestions: Question[] = [
  {
    id: 'quick_first_scene',
    text: '퇴근해서 현관을 열었을 때, 제일 먼저 보이고 싶은 장면은 무엇인가요?',
    options: [
      { id: 'hotel_hallway', text: '호텔 복도처럼 깔끔하게 정리된 현관과 복도', value: 'hotel_hallway', icon: '🏨' },
      { id: 'warm_kitchen', text: '따뜻한 조명 아래 식탁과 주방이 보이는 장면', value: 'warm_kitchen', icon: '🍳' },
      { id: 'cozy_living', text: '큰 소파와 TV가 있는 편안한 거실', value: 'cozy_living', icon: '🛋️' },
      { id: 'family_space', text: '아이·반려동물이 편하게 지내는 아늑한 공간', value: 'family_space', icon: '🐕' },
      { id: 'aesthetic_decor', text: '포인트 소품과 액자로 꾸며진 감성 있는 연출', value: 'aesthetic_decor', icon: '🖼️' },
      { id: 'ai_choice', text: '잘 모르겠어요. 이 선택은 인테리봇이 대신 골라줘요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'quick_photo_space',
    text: '집에서 "사진 찍어 올리고 싶은 공간"을 하나 만든다면 어디인가요?',
    options: [
      { id: 'living_room', text: '거실', value: 'living_room', icon: '🛋️' },
      { id: 'kitchen', text: '주방·식탁', value: 'kitchen', icon: '🍽️' },
      { id: 'bedroom', text: '침실', value: 'bedroom', icon: '🛏️' },
      { id: 'bathroom', text: '욕실', value: 'bathroom', icon: '🛁' },
      { id: 'workspace', text: '작업방·서재·취미공간', value: 'workspace', icon: '📚' },
      { id: 'ai_choice', text: '지금은 감이 안 와요. 이 항목은 인테리봇에 맡길게요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'quick_no_compromise',
    text: '인테리어에서 절대 타협하고 싶지 않은 한 가지는 무엇인가요?',
    options: [
      { id: 'natural_light', text: '채광(햇빛, 창 방향 등)', value: 'natural_light', icon: '☀️' },
      { id: 'lighting', text: '조명 분위기(색온도, 직부등/간접등 등)', value: 'lighting', icon: '💡' },
      { id: 'storage', text: '수납력(수납장, 붙박이장, 팬트리 등)', value: 'storage', icon: '📦' },
      { id: 'finish_quality', text: '마감 퀄리티(도장, 타일, 몰딩, 줄눈 등)', value: 'finish_quality', icon: '✨' },
      { id: 'flow', text: '동선(움직이기 편한 구조, 동작 동선)', value: 'flow', icon: '🚶' },
      { id: 'ai_choice', text: '판단이 어렵네요. 인테리봇 AI가 나중에 보완합니다', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'quick_atmosphere',
    text: '앞으로 집의 전체 분위기를 한 단어로 바꿀 수 있다면, 어떤 느낌이 가장 가깝나요?',
    options: [
      { id: 'healing', text: '힐링(쉼, 회복)', value: 'healing', icon: '🌿' },
      { id: 'focus', text: '집중(일·공부·창작)', value: 'focus', icon: '🎯' },
      { id: 'family', text: '가족(함께 모이는 공간)', value: 'family', icon: '👨‍👩‍👧‍👦' },
      { id: 'leisure', text: '여유(라운지, 호텔 같은 느낌)', value: 'leisure', icon: '🏖️' },
      { id: 'success', text: '성공·재도약(업그레이드, 자기계발, 상징성)', value: 'success', icon: '🚀' },
      { id: 'ai_choice', text: '그냥 느낌대로 가고 싶어요. 인테리봇이 분위기에 맞게 잡아줘요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
]

// ========================================
// 기본으로 모드 (10문항) - lib/analysis/questions/standard.ts와 동기화
// ========================================
const standardQuestions: Question[] = [
  ...quickQuestions, // Q1~Q4
  {
    id: 'standard_main_space',
    text: '집에서 하루 중 가장 오래 머무는 공간은 어디인가요?',
    options: [
      { id: 'living_room', text: '거실', value: 'living_room', icon: '🛋️' },
      { id: 'kitchen', text: '주방·식탁', value: 'kitchen', icon: '🍽️' },
      { id: 'bedroom', text: '침실', value: 'bedroom', icon: '🛏️' },
      { id: 'workspace', text: '작업방·서재', value: 'workspace', icon: '📚' },
      { id: 'kids_room', text: '아이방·놀이방', value: 'kids_room', icon: '🧸' },
      { id: 'ai_choice', text: '별도 선호는 없습니다. AI 추천을 따르겠습니다', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'standard_daily_discomfort',
    text: '현재 집에서 "매일 불편하지만 참고 넘어가는 것"에 가장 가까운 것은 무엇인가요?',
    options: [
      { id: 'storage', text: '수납공간 부족 (물건 정리가 안 됨)', value: 'storage', icon: '📦' },
      { id: 'flow', text: '동선이 불편함 (돌아다니기, 요리, 세탁 등)', value: 'flow', icon: '🚶' },
      { id: 'lighting', text: '조명·채광이 답답함 또는 눈부심', value: 'lighting', icon: '💡' },
      { id: 'materials', text: '마감재·색감이 마음에 안 듦', value: 'materials', icon: '🎨' },
      { id: 'layout', text: '가구 배치가 어색하고 공간이 좁게 느껴짐', value: 'layout', icon: '📐' },
      { id: 'ai_choice', text: '하나만 고르기 애매합니다. 이 부분은 AI가 대신 정합니다', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'standard_cleaning_style',
    text: '청소와 정리에 대한 본인 스타일에 가장 가까운 것은?',
    options: [
      { id: 'frequent_messy', text: '자주 치우지만 금방 다시 어지러워짐', value: 'frequent_messy', icon: '🔄' },
      { id: 'batch_clean', text: '주말이나 특정 날에 몰아서 정리', value: 'batch_clean', icon: '📅' },
      { id: 'only_when_bad', text: '눈에 너무 거슬릴 때만 치움', value: 'only_when_bad', icon: '👀' },
      { id: 'system_needed', text: '정리 시스템만 잘 만들어주면 유지할 자신 있음', value: 'system_needed', icon: '✅' },
      { id: 'hide_all', text: '정리·수납은 최대한 단순했으면 좋겠음(수납장에 다 숨기기)', value: 'hide_all', icon: '🚪' },
      { id: 'ai_choice', text: '헷갈리는 편이에요. 이 부분은 인테리봇에 맡길게요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'standard_family_time',
    text: '가족이 한자리에 가장 자주 모이는 시간대와 장소는 언제, 어디인가요?',
    options: [
      { id: 'weekday_living', text: '평일 저녁, 거실', value: 'weekday_living', icon: '🌙' },
      { id: 'weekday_kitchen', text: '평일 저녁, 주방·식탁', value: 'weekday_kitchen', icon: '🍽️' },
      { id: 'weekend_living', text: '주말 오후, 거실', value: 'weekend_living', icon: '☀️' },
      { id: 'weekend_kitchen', text: '주말, 주방·식탁', value: 'weekend_kitchen', icon: '🥘' },
      { id: 'separate', text: '거의 각자 방을 쓰고 함께 모이는 시간이 적음', value: 'separate', icon: '🚪' },
      { id: 'ai_choice', text: '딱 집어서 말하긴 어려워요. 이 부분은 인테리봇이 패턴을 잡아줘요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'standard_budget_priority',
    text: '예산을 생각할 때 가장 우선순위를 두고 싶은 부분은 어디인가요?',
    options: [
      { id: 'structure', text: '구조·동선 변경(벽체, 문, 가벽 등)', value: 'structure', icon: '🏗️' },
      { id: 'materials', text: '마감재·자재(바닥, 벽, 타일, 위생도기 등)', value: 'materials', icon: '🧱' },
      { id: 'storage', text: '가구·수납(붙박이장, 제작가구 등)', value: 'storage', icon: '🧺' },
      { id: 'lighting', text: '조명·색감·분위기 연출', value: 'lighting', icon: '💡' },
      { id: 'balance', text: '전체 밸런스(특정 한 곳보다 전반적인 균형)', value: 'balance', icon: '⚖️' },
      { id: 'ai_choice', text: '예산 배분이 어렵네요. 인테리봇 AI가 나중에 보완합니다.', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'standard_compliment',
    text: '인테리어가 끝난 후, 지인들에게 가장 듣고 싶은 말은 무엇인가요?',
    options: [
      { id: 'comfortable', text: '"되게 편해 보인다, 살기 좋겠다"', value: 'comfortable', icon: '😌' },
      { id: 'luxurious', text: '"호텔 같아, 진짜 고급스럽다"', value: 'luxurious', icon: '✨' },
      { id: 'suits_you', text: '"와, 진짜 너 같다. 너랑 잘 어울린다"', value: 'suits_you', icon: '👍' },
      { id: 'detailed', text: '"센스 미쳤다, 디테일이 다르네"', value: 'detailed', icon: '🎨' },
      { id: 'worth_it', text: '"생각보다 비용 잘 쓴 것 같다, 돈 안 아깝겠다"', value: 'worth_it', icon: '💰' },
      { id: 'ai_choice', text: '어떤 말이든 괜찮아요. 해석은 인테리봇 AI가 알아서 합니다', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
]

// ========================================
// 깊게 모드 (18문항) - lib/analysis/questions/deep.ts와 동기화
// ========================================
const deepQuestions: Question[] = [
  ...standardQuestions, // Q1~Q10
  {
    id: 'deep_sleep_brightness',
    text: '잠잘 때 방의 밝기에 대한 선호는?',
    options: [
      { id: 'complete_dark', text: '완전 암막(빛 거의 없음)', value: 'complete_dark', icon: '🌑' },
      { id: 'dim_light', text: '아주 은은한 불빛만', value: 'dim_light', icon: '🕯️' },
      { id: 'no_curtain', text: '커튼 안 쳐도 상관없음', value: 'no_curtain', icon: '🪟' },
      { id: 'mood_light', text: '간접조명·무드등 켜진 상태', value: 'mood_light', icon: '💡' },
      { id: 'varies', text: '상황에 따라 다르게', value: 'varies', icon: '🔄' },
      { id: 'ai_choice', text: '잘 모르겠어요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'deep_sleep_disturbance',
    text: '수면에 가장 방해가 되는 요소는?',
    options: [
      { id: 'noise', text: '소음(위·아래층, 도로 등)', value: 'noise', icon: '🔊' },
      { id: 'light', text: '빛(창문, 가로등 등)', value: 'light', icon: '💡' },
      { id: 'temperature', text: '온도(덥거나 추움)', value: 'temperature', icon: '🌡️' },
      { id: 'air', text: '공기(건조, 냄새, 답답함)', value: 'air', icon: '💨' },
      { id: 'bed', text: '침대·베개 등 물리적 불편', value: 'bed', icon: '🛏️' },
      { id: 'ai_choice', text: '정하기 어려워요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'deep_morning_first_10min',
    text: '아침 일어난 후 첫 10분을 가장 편하게 보내고 싶은 공간은?',
    options: [
      { id: 'bed', text: '침대 머리맡(침실)', value: 'bed', icon: '🛏️' },
      { id: 'dressing', text: '화장대·드레스룸', value: 'dressing', icon: '👗' },
      { id: 'kitchen', text: '주방·식탁', value: 'kitchen', icon: '🍳' },
      { id: 'sofa', text: '거실 소파', value: 'sofa', icon: '🛋️' },
      { id: 'bathroom', text: '욕실(샤워, 세면)', value: 'bathroom', icon: '🚿' },
      { id: 'ai_choice', text: '상상이 안 돼요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'deep_physical_constraint',
    text: '몸 상태 때문에 피하고 싶은 동작·자세는?',
    options: [
      { id: 'floor_sitting', text: '너무 낮은 좌식(바닥 앉기)', value: 'floor_sitting', icon: '🧘' },
      { id: 'squatting', text: '자주 쪼그려 앉기', value: 'squatting', icon: '🦵' },
      { id: 'reaching_high', text: '높은 곳 팔 들기', value: 'reaching_high', icon: '🙋' },
      { id: 'stairs', text: '계단·단 차이 오르내리기', value: 'stairs', icon: '🪜' },
      { id: 'none', text: '특별히 피할 동작 없음', value: 'none', icon: '✅' },
      { id: 'ai_choice', text: '판단 어려워요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'deep_organization_style',
    text: '정리·수납에 대한 본인 스타일은?',
    options: [
      { id: 'minimalist', text: '물건 줄이는 미니멀리스트', value: 'minimalist', icon: '⚪' },
      { id: 'categorizer', text: '카테고리별 정리 선호', value: 'categorizer', icon: '📦' },
      { id: 'hide_all', text: '수납장에 깔끔히 숨기기', value: 'hide_all', icon: '🚪' },
      { id: 'messy_now', text: '지금 어질러져있고 바꾸고 싶음', value: 'messy_now', icon: '🌪️' },
      { id: 'family_influenced', text: '가족 습관에 영향 많이 받음', value: 'family_influenced', icon: '👨‍👩‍👧' },
      { id: 'ai_choice', text: '설명 어려워요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'deep_cooking_stress',
    text: '요리할 때 가장 스트레스 받는 요소는?',
    options: [
      { id: 'small_space', text: '조리 공간·작업대 부족', value: 'small_space', icon: '📐' },
      { id: 'storage', text: '수납 부족으로 불편', value: 'storage', icon: '📦' },
      { id: 'ventilation', text: '환기(냄새, 연기)', value: 'ventilation', icon: '💨' },
      { id: 'flow', text: '설거지·정리 동선 비효율', value: 'flow', icon: '🚶' },
      { id: 'crowded', text: '여러 사람 동시 사용 어려움', value: 'crowded', icon: '👥' },
      { id: 'ai_choice', text: '설명 힘들어요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'deep_smell_concern',
    text: '집 안에서 냄새가 가장 신경 쓰이는 곳은?',
    options: [
      { id: 'entrance', text: '현관(신발장 등)', value: 'entrance', icon: '👞' },
      { id: 'kitchen', text: '주방(요리, 쓰레기)', value: 'kitchen', icon: '🗑️' },
      { id: 'bathroom', text: '욕실(배수, 곰팡이)', value: 'bathroom', icon: '🚿' },
      { id: 'closet', text: '옷방·드레스룸', value: 'closet', icon: '👗' },
      { id: 'living_air', text: '거실·전체 공기', value: 'living_air', icon: '💨' },
      { id: 'ai_choice', text: '떠오르지 않아요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'deep_lighting_change',
    text: '현재 조명 사용 상태와 바꾸고 싶은 방향은?',
    options: [
      { id: 'want_indirect', text: '전체등만 있음 → 간접조명 추가', value: 'want_indirect', icon: '💡' },
      { id: 'want_brighter', text: '어두움 → 더 밝게', value: 'want_brighter', icon: '☀️' },
      { id: 'want_warmer', text: '너무 밝고 차가움 → 따뜻하게', value: 'want_warmer', icon: '🔥' },
      { id: 'already_good', text: '이미 간접조명 씀 → 더 체계적으로', value: 'already_good', icon: '✨' },
      { id: 'basic_only', text: '조명은 기본만', value: 'basic_only', icon: '⚪' },
      { id: 'ai_choice', text: '조명 계획 어려워요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
]

// ========================================
// 분위기로 모드 (7문항) - lib/analysis/questions/vibe.ts와 동기화
// ========================================
const vibeQuestions: Question[] = [
  {
    id: 'vibe_weekend_alone',
    text: '주말 오후, 아무 방해 없이 혼자 있을 수 있다면 집에서 가장 하고 싶은 것은?',
    options: [
      { id: 'streaming', text: '넷플릭스·유튜브 정주행', value: 'streaming', icon: '📺' },
      { id: 'music_chill', text: '음악 켜놓고 멍 때리기', value: 'music_chill', icon: '🎵' },
      { id: 'study_plan', text: '책·노트·정리·계획', value: 'study_plan', icon: '📚' },
      { id: 'cooking', text: '요리·베이킹·커피', value: 'cooking', icon: '🍳' },
      { id: 'party', text: '친구 불러 홈파티', value: 'party', icon: '🎉' },
      { id: 'ai_choice', text: '그때그때 달라요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'vibe_cafe_seat',
    text: '카페에 갔을 때 가장 자주 선택하는 자리는?',
    options: [
      { id: 'window', text: '창가 자리', value: 'window', icon: '🪟' },
      { id: 'corner', text: '벽 쪽 구석', value: 'corner', icon: '🏠' },
      { id: 'center', text: '중앙 큰 테이블', value: 'center', icon: '🪑' },
      { id: 'bar', text: '바(Bar) 좌석', value: 'bar', icon: '🍷' },
      { id: 'terrace', text: '야외 테라스', value: 'terrace', icon: '🌳' },
      { id: 'ai_choice', text: '딱 정해진 자리 없어요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'vibe_sns_interior',
    text: 'SNS에서 더 자주 저장하는 인테리어 이미지는?',
    options: [
      { id: 'white_minimal', text: '하얗고 깨끗한 미니멀', value: 'white_minimal', icon: '⚪' },
      { id: 'nordic_natural', text: '우드와 식물 북유럽', value: 'nordic_natural', icon: '🌿' },
      { id: 'bold_color', text: '강한 컬러 포인트', value: 'bold_color', icon: '🎨' },
      { id: 'hotel_luxury', text: '호텔·라운지 럭셔리', value: 'hotel_luxury', icon: '✨' },
      { id: 'industrial', text: '공장형·러프', value: 'industrial', icon: '🏭' },
      { id: 'ai_choice', text: '스크랩이 잡다해요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'vibe_travel_style',
    text: '지금 당장 떠나고 싶은 여행 스타일은?',
    options: [
      { id: 'city', text: '서울·뉴욕 대도시', value: 'city', icon: '🏙️' },
      { id: 'nature', text: '산·바다·숲', value: 'nature', icon: '🏞️' },
      { id: 'town', text: '조용한 소도시', value: 'town', icon: '🏘️' },
      { id: 'resort', text: '리조트·호캉스', value: 'resort', icon: '🏖️' },
      { id: 'culture', text: '카페·미술관·편집숍', value: 'culture', icon: '☕' },
      { id: 'ai_choice', text: '정하지 못하겠어요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'vibe_home_relationship',
    text: '집이 사람이라면, 당신과의 관계는 어떤 느낌이면 좋겠나요?',
    options: [
      { id: 'best_friend', text: '편한 찐친', value: 'best_friend', icon: '🤝' },
      { id: 'supporter', text: '든든한 동료', value: 'supporter', icon: '💪' },
      { id: 'trainer', text: '성장시키는 트레이너', value: 'trainer', icon: '🏋️' },
      { id: 'lover', text: '특별하게 만드는 연인', value: 'lover', icon: '💕' },
      { id: 'coach', text: '다시 시작하게 하는 코치', value: 'coach', icon: '🎯' },
      { id: 'ai_choice', text: '한 가지로 정의 못해요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  {
    id: 'vibe_movie_genre',
    text: '집 전체 분위기를 영화 장르로 고르자면?',
    options: [
      { id: 'healing_drama', text: '힐링 드라마', value: 'healing_drama', icon: '🌸' },
      { id: 'romcom', text: '로맨틱 코미디', value: 'romcom', icon: '💝' },
      { id: 'growth', text: '차분한 성장 영화', value: 'growth', icon: '🌱' },
      { id: 'noir', text: '스타일리시 느와르', value: 'noir', icon: '🕶️' },
      { id: 'documentary', text: '현실감 있는 일상', value: 'documentary', icon: '📹' },
      { id: 'ai_choice', text: '장르로 설명 어려워요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
  // 7번째 질문 (vibe 모드 전용)
  {
    id: 'vibe_interior_priority',
    text: '이번 인테리어에서 가장 기대하는 변화는?',
    options: [
      { id: 'mood_change', text: '전체 분위기·무드 변화', value: 'mood_change', icon: '🎨' },
      { id: 'functionality', text: '수납·동선 등 실용성 개선', value: 'functionality', icon: '📦' },
      { id: 'relaxation', text: '휴식·힐링 공간 확보', value: 'relaxation', icon: '🧘' },
      { id: 'work_space', text: '재택·작업 환경 개선', value: 'work_space', icon: '💻' },
      { id: 'family_life', text: '가족과 함께하는 시간 증가', value: 'family_life', icon: '👨‍👩‍👧' },
      { id: 'ai_choice', text: '딱 하나만 고르기 어려워요', value: 'ai_choice', icon: '🤖', isAuto: true },
    ],
  },
]

// ========================================
// 모드 설정
// ========================================
export const modeConfigs: ModeConfig[] = [
  {
    id: 'quick',
    name: '⚡ 빠르게',
    icon: '⚡',
    questionCount: 4,
    estimatedTime: '약 1분',
    questions: quickQuestions,
  },
  {
    id: 'standard',
    name: '📊 기본으로',
    icon: '📊',
    questionCount: 10,
    estimatedTime: '약 3분',
    questions: standardQuestions,
  },
  {
    id: 'deep',
    name: '🎯 깊게',
    icon: '🎯',
    questionCount: 18,
    estimatedTime: '약 5분',
    questions: deepQuestions,
  },
  {
    id: 'vibe',
    name: '🎨 분위기로',
    icon: '🎨',
    questionCount: 7,
    estimatedTime: '약 2분',
    questions: vibeQuestions,
  },
]

export function getModeConfig(mode: AnalysisMode): ModeConfig {
  const config = modeConfigs.find((m) => m.id === mode)
  if (!config) {
    throw new Error(`Invalid mode: ${mode}`)
  }
  return config
}
