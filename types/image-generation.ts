export interface PersonalityScores {
  spacePerception: number      // 1~10
  visualSensitivity: number    // 1~10
  cleaningHabit: number        // 1~10
  organizationSkill: number    // 1~10
  colorPreference: 'warm' | 'cool' | 'neutral'
  lightingStyle: 'natural' | 'mood' | 'bright'
}

export interface ApartmentInfo {
  size: number                 // 평수
  hasBalconyExtension?: boolean
}

export interface ImageGenerationRequest {
  personalityScores: PersonalityScores
  apartmentInfo: ApartmentInfo
}

export interface ImageGenerationResponse {
  success: boolean
  images?: {
    before: string
    after: string
  }
  generationTime?: number
  usedPrompts?: {
    before: string
    after: string
  }
  error?: string
}

export type InteriorStyle = 
  | 'minimal-modern'
  | 'natural-wood'
  | 'modern-luxury'
  | 'colorful-maximal'
  | 'practical-family'
  | 'monotone-chic'
  | 'japandi'
  | 'industrial'
  | 'classic-modern'
