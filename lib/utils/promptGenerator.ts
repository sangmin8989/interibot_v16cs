import { PersonalityScores, ApartmentInfo, InteriorStyle } from '@/types/image-generation'

// Before prompt (common for all)
export function generateBeforePrompt(apartmentInfo: ApartmentInfo): string {
  const { size } = apartmentInfo
  const sqm = Math.round(size * 3.3)
  
  return `Korean apartment living room, ${size} pyeong (approximately ${sqm}㎡), before renovation, 
standard builder-grade finishes, beige wallpaper, laminate flooring, 
basic fluorescent ceiling lights, minimal furniture, 
slightly outdated feel, natural daylight from large windows, 
realistic photo, wide angle view from entrance, 
architectural photography style, --ar 16:9 --v 6.0`
}

// Style selection algorithm
export function selectInteriorStyle(scores: PersonalityScores): InteriorStyle {
  const { organizationSkill, visualSensitivity, colorPreference, spacePerception, lightingStyle } = scores
  
  // Minimal Modern: high organization + high visual sensitivity
  if (organizationSkill >= 8 && visualSensitivity >= 7) {
    return 'minimal-modern'
  }
  
  // Modern Luxury: high organization + cool colors
  if (organizationSkill >= 7 && colorPreference === 'cool') {
    return 'modern-luxury'
  }
  
  // Japandi: low space + high visual sensitivity
  if (spacePerception <= 5 && visualSensitivity >= 7) {
    return 'japandi'
  }
  
  // Industrial: high space + mood lighting
  if (spacePerception >= 7 && lightingStyle === 'mood') {
    return 'industrial'
  }
  
  // Colorful Maximal: low visual sensitivity
  if (visualSensitivity <= 5) {
    return 'colorful-maximal'
  }
  
  // Monotone Chic: cool colors + high organization
  if (colorPreference === 'cool' && organizationSkill >= 6) {
    return 'monotone-chic'
  }
  
  // Natural Wood: warm colors (default fallback)
  if (colorPreference === 'warm') {
    return 'natural-wood'
  }
  
  // Default fallback
  return 'natural-wood'
}

// After prompt templates
const STYLE_PROMPTS: Record<InteriorStyle, (size: number) => string> = {
  'minimal-modern': (size: number) => `Korean apartment living room, ${size} pyeong, after renovation, 
minimalist modern style, clean lines, hidden storage solutions,
pure white walls, light gray laminate flooring, recessed LED ceiling lights,
minimal furniture with sleek design, large sectional sofa in neutral beige,
floor-to-ceiling windows with sheer white curtains, natural daylight,
few decorative items, harmonious color palette,
realistic interior design photo, wide angle from entrance,
architectural photography, professional lighting, --ar 16:9 --v 6.0`,

  'natural-wood': (size: number) => `Korean apartment living room, ${size} pyeong, after renovation,
natural Scandinavian style, warm wood tones throughout,
light oak laminate flooring, white walls with wood accent wall,
warm beige fabric sofa, natural wood coffee table and TV stand,
pendant lights with warm LED, sheer linen curtains,
indoor plants in corners, cozy layered rug,
warm natural lighting, comfortable lived-in feeling,
realistic interior photo, wide angle view, soft natural light, --ar 16:9 --v 6.0`,

  'modern-luxury': (size: number) => `Korean apartment living room, ${size} pyeong, after renovation,
modern luxury style, premium materials, marble accent wall,
herringbone engineered wood flooring in dark walnut,
large L-shaped leather sofa in charcoal gray,
designer pendant lights, indirect LED cove lighting,
built-in TV wall with hidden storage, high-end appliances,
floor-to-ceiling windows with motorized blinds,
few but expensive decor items, sophisticated color scheme,
professional interior design photo, dramatic lighting, --ar 16:9 --v 6.0`,

  'colorful-maximal': (size: number) => `Korean apartment living room, ${size} pyeong, after renovation,
eclectic maximalist style, bold color combinations,
feature wall in deep teal or terracotta, mixed pattern textiles,
colorful velvet sofa, gallery wall with various artworks,
mixed metal pendant lights in brass and black,
layered rugs, decorative shelves with books and objects,
plants in colorful pots, warm mood lighting,
vibrant but harmonious, lived-in comfortable feel,
realistic interior photo, natural and artificial lighting mix, --ar 16:9 --v 6.0`,

  'practical-family': (size: number) => `Korean apartment living room, ${size} pyeong, after renovation,
family-friendly practical design, durable easy-clean materials,
vinyl flooring in wood-look pattern, washable paint on walls,
stain-resistant fabric sofa in dark neutral color,
ample closed storage cabinets, child-safe rounded furniture corners,
bright recessed ceiling lights for visibility, easy-access toy storage,
wipeable coffee table, minimal fabric decor, organized practical layout,
realistic family home interior, bright even lighting, --ar 16:9 --v 6.0`,

  'monotone-chic': (size: number) => `Korean apartment living room, ${size} pyeong, after renovation,
monochrome chic style, black white and gray palette only,
light gray walls, white ceiling, dark gray laminate flooring,
black metal frame furniture, white leather sofa, gray textiles,
geometric patterns in cushions and rug, chrome light fixtures,
minimal decor in black and white, clean straight lines throughout,
indirect white LED lighting, modern sophisticated atmosphere,
professional interior photo, high contrast lighting, --ar 16:9 --v 6.0`,

  'japandi': (size: number) => `Korean apartment living room, ${size} pyeong, after renovation,
Japandi style fusion of Japanese and Scandinavian design,
light wood flooring, white walls with natural wood slat accent,
low-profile furniture, neutral linen sofa, round wood coffee table,
paper pendant lights, tatami-inspired area rug, minimal decor,
indoor plants, natural materials throughout, uncluttered surfaces,
soft diffused natural lighting through rice paper style curtains,
zen peaceful atmosphere, realistic interior, soft even lighting, --ar 16:9 --v 6.0`,

  'industrial': (size: number) => `Korean apartment living room, ${size} pyeong, after renovation,
industrial modern style, exposed elements, concrete-look wall,
dark stained wood flooring, metal and wood furniture mix,
leather sofa in cognac brown, metal frame coffee table,
Edison bulb pendant lights, track lighting on ceiling,
open metal shelving, visible pipes as design element,
brick wallpaper accent wall, raw materials aesthetic,
warm mood lighting with shadows, edgy urban atmosphere,
realistic loft-style interior photo, dramatic lighting, --ar 16:9 --v 6.0`,

  'classic-modern': (size: number) => `Korean apartment living room, ${size} pyeong, after renovation,
classic modern transitional style, elegant timeless design,
medium tone wood flooring, soft cream walls, white trim moldings,
tufted fabric sofa in warm taupe, traditional coffee table,
classic chandelier with modern twist, table lamps with fabric shades,
crown molding on ceiling, wainscoting on walls, traditional rug,
balanced mix of classic and contemporary elements,
warm inviting atmosphere, realistic interior, soft even lighting, --ar 16:9 --v 6.0`,
}

// Generate after prompt based on style
export function generateAfterPrompt(
  style: InteriorStyle,
  apartmentInfo: ApartmentInfo
): string {
  const promptGenerator = STYLE_PROMPTS[style]
  return promptGenerator(apartmentInfo.size)
}

// Main function to generate both prompts
export function generatePrompts(
  personalityScores: PersonalityScores,
  apartmentInfo: ApartmentInfo
): { before: string; after: string; style: InteriorStyle } {
  const style = selectInteriorStyle(personalityScores)
  const beforePrompt = generateBeforePrompt(apartmentInfo)
  const afterPrompt = generateAfterPrompt(style, apartmentInfo)
  
  return {
    before: beforePrompt,
    after: afterPrompt,
    style
  }
}
