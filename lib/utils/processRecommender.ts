import type { PersonalityScores, ApartmentInfo } from '@/types/image-generation'

export type SpaceType = 'living' | 'kitchen' | 'bedroom' | 'bathroom'

const COMMON_SUFFIX = ', realistic architectural photography, high quality, natural lighting'

// 공간별 Before 프롬프트
const BEFORE_PROMPTS: Record<SpaceType, (size: number) => string> = {
  living: (size: number) => 
    `Korean apartment living room, ${size} pyeong, before renovation, standard builder-grade finishes, beige wallpaper, light brown laminate flooring, basic white fluorescent ceiling lights, minimal furniture, slightly outdated interior, natural daylight from large windows, empty space${COMMON_SUFFIX}`,
  
  kitchen: (size: number) => 
    `Korean apartment kitchen, ${size} pyeong, before renovation, old laminate countertop, basic white wall tiles, outdated cabinet doors, fluorescent ceiling lights, worn sink faucet, minimal storage${COMMON_SUFFIX}`,
  
  bedroom: (size: number) => 
    `Korean apartment bedroom, ${size} pyeong, before renovation, old wallpaper, basic laminate flooring, simple closet, basic ceiling light, minimal furniture, dated interior${COMMON_SUFFIX}`,
  
  bathroom: (size: number) => 
    `Korean apartment bathroom, ${size} pyeong, before renovation, old white tiles, basic vanity, standard bathtub, fluorescent mirror light, worn fixtures, basic interior${COMMON_SUFFIX}`
}

// 스타일 선택 함수
function selectStyle(scores: PersonalityScores): string {
  const {
    spacePerception,
    visualSensitivity,
    cleaningHabit,
    organizationSkill,
    colorPreference,
    lightingStyle,
  } = scores

  if (organizationSkill >= 8 && visualSensitivity >= 7) {
    return 'minimal_modern'
  } else if (colorPreference === 'warm' && spacePerception <= 6) {
    return 'natural_wood'
  } else if (organizationSkill >= 8 && colorPreference === 'cool') {
    return 'monotone_chic'
  } else if (visualSensitivity <= 5 && colorPreference !== 'neutral') {
    return 'colorful_maximal'
  } else if (cleaningHabit >= 7 && organizationSkill >= 6) {
    return 'practical_family'
  } else if (spacePerception <= 5 && visualSensitivity >= 7) {
    return 'japandi'
  } else if (spacePerception >= 7 && lightingStyle === 'mood') {
    return 'industrial'
  } else if (colorPreference === 'warm') {
    return 'classic_modern'
  } else {
    return 'modern_luxury'
  }
}

// 공간별 After 키워드
const AFTER_KEYWORDS: Record<SpaceType, Record<string, string>> = {
  living: {
    minimal_modern: 'minimalist modern living room, clean lines, neutral color palette, hidden storage, sleek sofa, minimal decor',
    natural_wood: 'natural wood living room, wooden furniture, plants, warm lighting, cozy atmosphere, organic materials',
    modern_luxury: 'luxury modern living room, marble accents, premium finishes, designer furniture, elegant lighting',
    colorful_maximal: 'colorful eclectic living room, vibrant colors, mixed patterns, art pieces, personality-filled space',
    practical_family: 'family-friendly living room, durable furniture, smart storage, comfortable seating, kid-safe design',
    monotone_chic: 'monochrome living room, black and white palette, sophisticated design, geometric patterns, modern art',
    japandi: 'japandi living room, minimal furniture, natural materials, neutral tones, zen atmosphere, clean aesthetic',
    industrial: 'industrial living room, exposed materials, metal accents, concrete elements, vintage lighting, raw aesthetic',
    classic_modern: 'classic modern living room, timeless furniture, warm wood tones, elegant details, comfortable luxury',
  },
  kitchen: {
    minimal_modern: 'minimalist modern kitchen, sleek cabinets, quartz countertop, hidden appliances, clean lines, under-cabinet lighting',
    natural_wood: 'natural wood kitchen, wooden cabinets, marble countertop, brass fixtures, warm lighting, open shelving',
    modern_luxury: 'luxury modern kitchen, premium appliances, marble island, designer fixtures, wine fridge, professional-grade',
    colorful_maximal: 'colorful eclectic kitchen, vibrant backsplash, mixed cabinet colors, patterned tiles, unique fixtures',
    practical_family: 'family-friendly kitchen, durable surfaces, ample storage, easy-clean materials, functional layout, pantry space',
    monotone_chic: 'monochrome kitchen, black and white design, matte finishes, geometric tiles, minimalist hardware',
    japandi: 'japandi kitchen, minimal cabinets, natural wood tones, white countertops, simple fixtures, zen aesthetic',
    industrial: 'industrial kitchen, exposed shelving, metal accents, concrete countertops, vintage fixtures, open concept',
    classic_modern: 'classic modern kitchen, shaker cabinets, warm wood tones, marble countertop, elegant fixtures, timeless design',
  },
  bedroom: {
    minimal_modern: 'minimalist modern bedroom, platform bed, hidden storage, neutral bedding, minimal decor, clean aesthetic',
    natural_wood: 'natural wood bedroom, wooden bed frame, soft textiles, plants, warm lighting, cozy atmosphere',
    modern_luxury: 'luxury modern bedroom, upholstered headboard, premium bedding, ambient lighting, walk-in closet, elegant design',
    colorful_maximal: 'colorful eclectic bedroom, vibrant textiles, mixed patterns, art wall, personality-filled space, layered lighting',
    practical_family: 'family bedroom, built-in storage, durable furniture, comfortable bedding, organized closet, functional design',
    monotone_chic: 'monochrome bedroom, black and white palette, sophisticated linens, geometric wall art, modern fixtures',
    japandi: 'japandi bedroom, low bed frame, natural materials, neutral tones, minimal decor, peaceful atmosphere',
    industrial: 'industrial bedroom, exposed brick, metal bed frame, concrete accents, vintage lighting, raw textures',
    classic_modern: 'classic modern bedroom, traditional bed frame, warm wood tones, elegant bedding, timeless furniture, comfortable luxury',
  },
  bathroom: {
    minimal_modern: 'minimalist modern bathroom, floating vanity, large mirror, rain shower, white tiles, hidden storage, clean lines',
    natural_wood: 'natural bathroom, wooden vanity, stone tiles, plants, natural light, organic materials, spa-like atmosphere',
    modern_luxury: 'luxury modern bathroom, marble tiles, freestanding tub, rain shower, designer fixtures, ambient lighting',
    colorful_maximal: 'colorful eclectic bathroom, patterned tiles, vibrant accents, unique fixtures, personality-filled design',
    practical_family: 'family bathroom, durable tiles, ample storage, easy-clean surfaces, double vanity, functional layout',
    monotone_chic: 'monochrome bathroom, black and white tiles, matte fixtures, geometric patterns, modern design',
    japandi: 'japandi bathroom, minimal fixtures, natural materials, white tiles, wooden accents, zen atmosphere',
    industrial: 'industrial bathroom, exposed pipes, concrete tiles, metal fixtures, vintage mirror, raw aesthetic',
    classic_modern: 'classic modern bathroom, traditional tiles, warm tones, elegant fixtures, marble accents, timeless design',
  }
}

export function generatePrompts(
  personalityScores: PersonalityScores,
  apartmentInfo: ApartmentInfo,
  spaceType: SpaceType = 'living'
): { beforePrompt: string; afterPrompt: string } {
  const style = selectStyle(personalityScores)
  const size = apartmentInfo.size

  const beforePrompt = BEFORE_PROMPTS[spaceType](size)
  const afterKeywords = AFTER_KEYWORDS[spaceType][style]
  const afterPrompt = `Korean apartment ${spaceType}, ${size} pyeong, after renovation, ${afterKeywords}${COMMON_SUFFIX}`

  console.log(`[PromptGenerator] Space: ${spaceType}, Style: ${style}`)

  return {
    beforePrompt,
    afterPrompt,
  }
}