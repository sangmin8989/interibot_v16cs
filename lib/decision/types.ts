// lib/decision/types.ts

export type RiskCategory = 'ASSET' | 'MAINTENANCE' | 'DEFECT'
export type DecisionResultType = 'PASS' | 'WARN' | 'BLOCK'

export type ResidencePlan = 'short' | 'mid' | 'long'
export type HousingType = 'apartment' | 'villa' | 'officetel' | 'house' | 'other'
export type BudgetLevel = 'low' | 'mid' | 'high'

export interface DecisionContext {
  space: {
    housingType: HousingType
    pyeong: number
    rooms: number
    bathrooms: number
    residencePlan: ResidencePlan
  }
  household: {
    hasKids: boolean
    hasPets: boolean
  }
  personality: {
    maintenanceSensitive: boolean
    budgetSensitive: boolean
    riskAverse: boolean
  }
  budget: {
    level: BudgetLevel
  }
}

export interface RiskFactor {
  category: RiskCategory
  weight: number
  reason: string
}

export interface DecisionAlternative {
  optionType: string
  reason: string
}

export interface DecisionResult {
  result: DecisionResultType
  riskCategory: RiskCategory[]
  reasons: string[]
  consequences: string[]
  alternatives?: DecisionAlternative[]
}

export type DecisionTarget = 'KITCHEN_COUNTERTOP'

export interface KitchenCountertopOption {
  material: 'PET_GLOSS' | 'QUARTZ' | 'PORCELAIN'
}
