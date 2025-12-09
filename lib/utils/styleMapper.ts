/**
 * 스타일 옵션 → 이미지 프롬프트 매핑
 * 고객 언어 기반 선택지를 DALL·E 3 프롬프트로 변환
 */

export interface StyleMapping {
  keywords: string[]
  tone: string
  materials: string[]
  lighting: string
  layout: string
}

/**
 * 공통 기본 프롬프트 (항상 포함)
 */
export const BASE_PROMPT = [
  'realistic korean apartment interior',
  'practical and buildable design',
  'clean lines, natural materials',
  'ceiling height 2.3m~2.4m',
  'no exaggerated decoration',
  'soft natural lighting',
  'HD quality',
].join(', ')

/**
 * 스타일 옵션 → 이미지 프롬프트 키워드 매핑
 */
const STYLE_MAPPINGS: Record<string, StyleMapping> = {
  // 거실
  '따뜻하고 편안하게 쉬는 거실': {
    keywords: ['warm beige tone', 'soft indirect lighting', 'cozy layout', 'comfortable seating'],
    tone: 'warm beige',
    materials: ['warm wood', 'soft textiles'],
    lighting: 'soft indirect',
    layout: 'cozy',
  },
  '넓어 보이고 답답하지 않은 거실': {
    keywords: ['open layout', 'light colors', 'minimal furniture', 'spacious feeling'],
    tone: 'light neutral',
    materials: ['light wood', 'white walls'],
    lighting: 'bright natural',
    layout: 'open',
  },
  '깔끔하게 정리되는 심플한 거실': {
    keywords: ['minimal design', 'organized storage', 'clean lines', 'simple furniture'],
    tone: 'neutral',
    materials: ['sleek surfaces', 'hidden storage'],
    lighting: 'even natural',
    layout: 'minimal',
  },
  'TV 보기에 좋은 안정적인 거실': {
    keywords: ['TV wall focus', 'comfortable viewing distance', 'balanced layout', 'stable furniture'],
    tone: 'neutral warm',
    materials: ['wood TV stand', 'comfortable sofa'],
    lighting: 'adjustable',
    layout: 'TV centered',
  },
  '아이 있어도 지저분해 보이지 않는 거실': {
    keywords: ['hidden storage', 'easy to clean', 'durable materials', 'organized spaces'],
    tone: 'warm neutral',
    materials: ['stain-resistant', 'easy-clean surfaces'],
    lighting: 'bright practical',
    layout: 'functional',
  },

  // 주방
  '정리 잘 되는 실용적인 주방': {
    keywords: ['organized storage layout', 'bright counters', 'functional lines', 'efficient cabinets'],
    tone: 'light practical',
    materials: ['white cabinets', 'practical surfaces'],
    lighting: 'bright task',
    layout: 'efficient',
  },
  '밝고 넓어 보이는 화이트 주방': {
    keywords: ['white cabinets', 'bright lighting', 'open feeling', 'light colors'],
    tone: 'bright white',
    materials: ['white surfaces', 'light tiles'],
    lighting: 'very bright',
    layout: 'open',
  },
  '우드 느낌이 편안한 주방': {
    keywords: ['warm wood cabinets', 'natural materials', 'cozy kitchen', 'warm tone'],
    tone: 'warm wood',
    materials: ['wood cabinets', 'natural stone'],
    lighting: 'warm natural',
    layout: 'cozy',
  },
  '요리하기 좋은 동선 중심 주방': {
    keywords: ['efficient workflow', 'triangle layout', 'functional zones', 'practical design'],
    tone: 'neutral practical',
    materials: ['durable surfaces', 'functional cabinets'],
    lighting: 'task focused',
    layout: 'workflow optimized',
  },
  '조명과 상판 질감이 멋진 고급스러운 주방': {
    keywords: ['premium countertop', 'elegant lighting', 'luxury materials', 'sophisticated design'],
    tone: 'sophisticated',
    materials: ['premium stone', 'elegant fixtures'],
    lighting: 'dramatic elegant',
    layout: 'premium',
  },

  // 욕실
  '관리 쉬운 밝고 깨끗한 욕실': {
    keywords: ['easy to clean', 'bright white', 'simple fixtures', 'practical design'],
    tone: 'bright clean',
    materials: ['white tiles', 'easy-clean surfaces'],
    lighting: 'bright even',
    layout: 'simple',
  },
  '좁아도 넓어 보이는 산뜻한 욕실': {
    keywords: ['light tile tone', 'bright lighting', 'simple fixtures', 'spacious feeling'],
    tone: 'light fresh',
    materials: ['light tiles', 'minimal fixtures'],
    lighting: 'very bright',
    layout: 'open feeling',
  },
  '조명으로 분위기 살아나는 욕실': {
    keywords: ['mood lighting', 'warm ambiance', 'elegant fixtures', 'atmospheric design'],
    tone: 'warm elegant',
    materials: ['quality tiles', 'elegant fixtures'],
    lighting: 'mood warm',
    layout: 'atmospheric',
  },
  '따뜻한 톤으로 편안한 욕실': {
    keywords: ['warm beige tone', 'cozy atmosphere', 'comfortable space', 'warm colors'],
    tone: 'warm beige',
    materials: ['warm tiles', 'soft textures'],
    lighting: 'warm soft',
    layout: 'cozy',
  },
  '매일 쓰기 편한 실용 욕실': {
    keywords: ['functional design', 'easy access', 'practical storage', 'user-friendly'],
    tone: 'neutral practical',
    materials: ['durable tiles', 'practical fixtures'],
    lighting: 'bright practical',
    layout: 'functional',
  },

  // 침실
  '잠이 잘 오는 차분한 침실': {
    keywords: ['calm muted colors', 'warm lamps', 'minimal furniture', 'peaceful atmosphere'],
    tone: 'calm muted',
    materials: ['soft textiles', 'warm wood'],
    lighting: 'soft warm',
    layout: 'peaceful',
  },
  '따뜻한 분위기의 아늑한 침실': {
    keywords: ['warm cozy atmosphere', 'soft lighting', 'comfortable bed', 'intimate space'],
    tone: 'warm cozy',
    materials: ['warm textiles', 'soft surfaces'],
    lighting: 'warm intimate',
    layout: 'cozy',
  },
  '정리 쉬운 심플한 침실': {
    keywords: ['minimal design', 'organized storage', 'clean lines', 'simple furniture'],
    tone: 'neutral clean',
    materials: ['sleek surfaces', 'hidden storage'],
    lighting: 'even natural',
    layout: 'minimal',
  },
  '편안한 색감의 안정적인 침실': {
    keywords: ['stable colors', 'comfortable atmosphere', 'balanced design', 'relaxing space'],
    tone: 'stable neutral',
    materials: ['comfortable textiles', 'balanced colors'],
    lighting: 'soft balanced',
    layout: 'stable',
  },
  '조명만으로 감성 살아나는 침실': {
    keywords: ['atmospheric lighting', 'mood design', 'elegant fixtures', 'sophisticated ambiance'],
    tone: 'elegant',
    materials: ['quality textiles', 'elegant details'],
    lighting: 'dramatic mood',
    layout: 'atmospheric',
  },

  // 아이방
  '밝고 기분 좋아지는 아이방': {
    keywords: ['bright cheerful colors', 'happy atmosphere', 'playful design', 'energetic space'],
    tone: 'bright cheerful',
    materials: ['colorful elements', 'fun textures'],
    lighting: 'bright cheerful',
    layout: 'playful',
  },
  '정리·수납이 편한 아이방': {
    keywords: ['organized storage', 'easy access', 'functional design', 'practical layout'],
    tone: 'neutral practical',
    materials: ['durable storage', 'practical surfaces'],
    lighting: 'bright practical',
    layout: 'organized',
  },
  '공부와 휴식이 모두 가능한 아이방': {
    keywords: ['multi-functional space', 'study area', 'rest area', 'balanced design'],
    tone: 'balanced',
    materials: ['functional furniture', 'comfortable elements'],
    lighting: 'flexible',
    layout: 'multi-functional',
  },
  '안전하고 안정감 있는 아이방': {
    keywords: ['safe design', 'stable furniture', 'soft edges', 'secure space'],
    tone: 'warm safe',
    materials: ['safe materials', 'soft surfaces'],
    lighting: 'warm safe',
    layout: 'secure',
  },
  '컬러 포인트가 귀여운 아이방': {
    keywords: ['colorful accents', 'playful design', 'cute details', 'fun atmosphere'],
    tone: 'playful colorful',
    materials: ['colorful elements', 'fun textures'],
    lighting: 'bright playful',
    layout: 'playful',
  },

  // 서재/작업실
  '집중 잘 되는 조용한 작업 공간': {
    keywords: ['quiet atmosphere', 'focused design', 'minimal distractions', 'calm space'],
    tone: 'calm neutral',
    materials: ['quiet materials', 'focused surfaces'],
    lighting: 'focused task',
    layout: 'focused',
  },
  '깔끔하게 정리되는 실용 서재': {
    keywords: ['organized storage', 'clean design', 'functional layout', 'practical space'],
    tone: 'neutral clean',
    materials: ['sleek storage', 'clean surfaces'],
    lighting: 'bright even',
    layout: 'organized',
  },
  '차분한 컬러의 안정적인 공간': {
    keywords: ['stable colors', 'calm atmosphere', 'balanced design', 'peaceful space'],
    tone: 'stable calm',
    materials: ['balanced materials', 'stable surfaces'],
    lighting: 'soft balanced',
    layout: 'stable',
  },
  'PC·장비 사용하기 좋은 구조': {
    keywords: ['functional setup', 'equipment-friendly', 'practical design', 'efficient layout'],
    tone: 'neutral practical',
    materials: ['durable surfaces', 'functional furniture'],
    lighting: 'task focused',
    layout: 'equipment optimized',
  },
  '정리 쉬운 효율 서재': {
    keywords: ['efficient storage', 'easy organization', 'practical design', 'functional space'],
    tone: 'neutral efficient',
    materials: ['efficient storage', 'practical surfaces'],
    lighting: 'bright practical',
    layout: 'efficient',
  },

  // 드레스룸
  '정리 잘 되는 깔끔한 드레스룸': {
    keywords: ['organized storage', 'clean design', 'efficient layout', 'practical space'],
    tone: 'neutral clean',
    materials: ['sleek storage', 'clean surfaces'],
    lighting: 'bright even',
    layout: 'organized',
  },
  '옷 색이 잘 보이는 화사한 드레스룸': {
    keywords: ['bright lighting', 'color-friendly', 'vibrant atmosphere', 'cheerful space'],
    tone: 'bright vibrant',
    materials: ['bright surfaces', 'colorful elements'],
    lighting: 'very bright',
    layout: 'colorful',
  },
  '동선 편한 실용 드레스룸': {
    keywords: ['efficient workflow', 'easy access', 'functional design', 'practical layout'],
    tone: 'neutral practical',
    materials: ['functional storage', 'practical surfaces'],
    lighting: 'bright practical',
    layout: 'workflow optimized',
  },
  '거울·조명으로 분위기 살린 드레스룸': {
    keywords: ['elegant mirrors', 'mood lighting', 'sophisticated design', 'atmospheric space'],
    tone: 'elegant',
    materials: ['quality mirrors', 'elegant fixtures'],
    lighting: 'dramatic mood',
    layout: 'atmospheric',
  },
  '공간 활용 최대화 드레스룸': {
    keywords: ['maximized storage', 'efficient use', 'compact design', 'space-saving'],
    tone: 'neutral efficient',
    materials: ['efficient storage', 'space-saving solutions'],
    lighting: 'bright efficient',
    layout: 'maximized',
  },

  // 베란다
  '식물 키우기 좋은 따뜻한 베란다': {
    keywords: ['natural wood', 'sunlight-friendly space', 'warm tone', 'plant-friendly'],
    tone: 'warm natural',
    materials: ['natural wood', 'plant-friendly surfaces'],
    lighting: 'natural sunlight',
    layout: 'plant-friendly',
  },
  '채광 잘 들어오는 밝은 공간': {
    keywords: ['bright natural light', 'open feeling', 'light colors', 'sunny space'],
    tone: 'bright light',
    materials: ['light surfaces', 'bright materials'],
    lighting: 'very bright natural',
    layout: 'open bright',
  },
  '조용히 쉬는 작은 휴식 공간': {
    keywords: ['cozy retreat', 'peaceful atmosphere', 'comfortable seating', 'quiet space'],
    tone: 'warm peaceful',
    materials: ['comfortable textiles', 'soft surfaces'],
    lighting: 'soft warm',
    layout: 'cozy',
  },
  '전망이 잘 보이는 베란다': {
    keywords: ['open view', 'clear windows', 'spacious feeling', 'view-focused'],
    tone: 'neutral open',
    materials: ['clear glass', 'open design'],
    lighting: 'natural bright',
    layout: 'view optimized',
  },
  '수납·정리 쉬운 실용 베란다': {
    keywords: ['organized storage', 'practical design', 'functional layout', 'efficient space'],
    tone: 'neutral practical',
    materials: ['practical storage', 'functional surfaces'],
    lighting: 'bright practical',
    layout: 'organized',
  },

  // 다용도실
  '세탁 동선이 편한 구조': {
    keywords: ['efficient workflow', 'functional zones', 'practical design', 'workflow optimized'],
    tone: 'neutral practical',
    materials: ['durable surfaces', 'functional layout'],
    lighting: 'bright task',
    layout: 'workflow optimized',
  },
  '정리·수납이 쉬운 실용 공간': {
    keywords: ['organized storage', 'easy access', 'practical design', 'functional space'],
    tone: 'neutral practical',
    materials: ['efficient storage', 'practical surfaces'],
    lighting: 'bright practical',
    layout: 'organized',
  },
  '건조기·세탁기 배치 적절': {
    keywords: ['optimal appliance placement', 'functional layout', 'practical design', 'efficient setup'],
    tone: 'neutral practical',
    materials: ['durable surfaces', 'functional appliances'],
    lighting: 'bright practical',
    layout: 'appliance optimized',
  },
  '습기 관리 쉬운 구조': {
    keywords: ['moisture-resistant', 'ventilation-friendly', 'practical design', 'durable materials'],
    tone: 'neutral practical',
    materials: ['moisture-resistant', 'ventilation-friendly'],
    lighting: 'bright practical',
    layout: 'ventilation optimized',
  },
  '잡동사니 숨기기 좋은 수납': {
    keywords: ['hidden storage', 'organized space', 'clean design', 'efficient storage'],
    tone: 'neutral clean',
    materials: ['hidden storage', 'clean surfaces'],
    lighting: 'bright even',
    layout: 'organized',
  },

  // 현관
  '첫인상이 깔끔한 밝은 현관': {
    keywords: ['bright welcoming', 'clean design', 'first impression', 'spacious feeling'],
    tone: 'bright clean',
    materials: ['light surfaces', 'clean materials'],
    lighting: 'bright welcoming',
    layout: 'open clean',
  },
  '신발·짐 정리 쉬운 구조': {
    keywords: ['organized storage', 'easy access', 'practical design', 'functional layout'],
    tone: 'neutral practical',
    materials: ['efficient storage', 'practical surfaces'],
    lighting: 'bright practical',
    layout: 'organized',
  },
  '따뜻한 색감의 안정적인 현관': {
    keywords: ['warm tone', 'stable atmosphere', 'welcoming space', 'comfortable feeling'],
    tone: 'warm stable',
    materials: ['warm surfaces', 'comfortable textures'],
    lighting: 'warm welcoming',
    layout: 'stable',
  },
  '간접조명으로 넓어 보이는 현관': {
    keywords: ['indirect lighting', 'spacious feeling', 'elegant design', 'atmospheric space'],
    tone: 'elegant',
    materials: ['quality surfaces', 'elegant fixtures'],
    lighting: 'indirect atmospheric',
    layout: 'spacious',
  },
  '수납이 편리한 실용 현관': {
    keywords: ['convenient storage', 'practical design', 'functional layout', 'efficient space'],
    tone: 'neutral practical',
    materials: ['practical storage', 'functional surfaces'],
    lighting: 'bright practical',
    layout: 'organized',
  },

  // 창고/수납
  '자잘한 물건 정리 쉬운 공간': {
    keywords: ['organized storage', 'small items', 'efficient layout', 'practical design'],
    tone: 'neutral practical',
    materials: ['efficient storage', 'practical surfaces'],
    lighting: 'bright practical',
    layout: 'organized',
  },
  '박스·시즌용품 보관 편함': {
    keywords: ['large item storage', 'seasonal items', 'efficient layout', 'practical space'],
    tone: 'neutral practical',
    materials: ['durable storage', 'practical surfaces'],
    lighting: 'bright practical',
    layout: 'storage optimized',
  },
  '빠르게 찾기 쉬운 정리 시스템': {
    keywords: ['organized system', 'easy access', 'efficient layout', 'practical design'],
    tone: 'neutral efficient',
    materials: ['organized storage', 'efficient surfaces'],
    lighting: 'bright practical',
    layout: 'systematic',
  },
  '넓게 쓰는 실용 수납': {
    keywords: ['spacious storage', 'practical design', 'functional layout', 'efficient space'],
    tone: 'neutral practical',
    materials: ['durable storage', 'practical surfaces'],
    lighting: 'bright practical',
    layout: 'spacious',
  },
  '숨겨지는 클린한 수납': {
    keywords: ['hidden storage', 'clean design', 'minimal appearance', 'organized space'],
    tone: 'neutral clean',
    materials: ['hidden storage', 'clean surfaces'],
    lighting: 'bright even',
    layout: 'minimal',
  },

  // 전체 리모델링
  '톤·질감 조화로운 전체 인테리어': {
    keywords: ['harmonious tones', 'coordinated textures', 'unified design', 'balanced atmosphere'],
    tone: 'harmonious',
    materials: ['coordinated materials', 'unified textures'],
    lighting: 'balanced natural',
    layout: 'harmonious',
  },
  '밝고 넓어 보이는 전체 리뉴얼': {
    keywords: ['bright open feeling', 'spacious design', 'light colors', 'open layout'],
    tone: 'bright open',
    materials: ['light materials', 'bright surfaces'],
    lighting: 'very bright natural',
    layout: 'open spacious',
  },
  '따뜻하고 안정감 있는 분위기': {
    keywords: ['warm stable atmosphere', 'comfortable feeling', 'balanced design', 'cozy space'],
    tone: 'warm stable',
    materials: ['warm materials', 'comfortable textures'],
    lighting: 'warm balanced',
    layout: 'stable',
  },
  '불필요한 요소 제거한 미니멀 구성': {
    keywords: ['minimal design', 'clean lines', 'essential only', 'simple composition'],
    tone: 'neutral minimal',
    materials: ['sleek surfaces', 'minimal elements'],
    lighting: 'even natural',
    layout: 'minimal',
  },
  '조명·바닥·벽이 깔끔한 전체 구성': {
    keywords: ['clean lighting', 'quality flooring', 'smooth walls', 'unified design'],
    tone: 'neutral clean',
    materials: ['quality materials', 'clean surfaces'],
    lighting: 'clean even',
    layout: 'unified',
  },
}

/**
 * 스타일 옵션을 이미지 프롬프트로 변환
 * @param option 선택된 스타일 옵션 텍스트
 * @param spaceType 공간 타입 (living, kitchen, bathroom 등)
 * @returns DALL·E 3 프롬프트 문자열
 */
export function mapStyleToPrompt(option: string, spaceType: string): string {
  const mapping = STYLE_MAPPINGS[option]
  
  if (!mapping) {
    // 매핑이 없으면 기본 스타일 사용
    return `${BASE_PROMPT}, ${spaceType} space, neutral design`
  }

  // 키워드 조합
  const keywords = [
    ...mapping.keywords,
    mapping.tone,
    ...mapping.materials,
    mapping.lighting,
    mapping.layout,
  ].join(', ')

  return `${BASE_PROMPT}, ${spaceType} space, ${keywords}`
}

/**
 * "잘 모르겠어요" 옵션인지 확인
 */
export function isUnknownOption(option: string): boolean {
  return option.includes('잘 모르겠어요') || option.includes('추천해 주세요')
}





