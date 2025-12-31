export type PreferenceCategory =
  | 'space_sense'
  | 'sensory_sensitivity'
  | 'cleaning_preference'
  | 'organization_habit'
  | 'family_composition'
  | 'health_factors'
  | 'budget_sense'
  | 'color_preference'
  | 'lighting_preference'
  | 'home_purpose'
  | 'discomfort_factors'
  | 'activity_flow'
  | 'life_routine'
  | 'sleep_pattern'
  | 'hobby_lifestyle';

export const PREFERENCE_CATEGORIES = [
  'space_sense',
  'sensory_sensitivity',
  'cleaning_preference',
  'organization_habit',
  'family_composition',
  'health_factors',
  'budget_sense',
  'color_preference',
  'lighting_preference',
  'home_purpose',
  'discomfort_factors',
  'activity_flow',
  'life_routine',
  'sleep_pattern',
  'hobby_lifestyle',
] as const satisfies readonly PreferenceCategory[];

export interface AnswerOption {
  id: string;
  text: string;
  value: string | number;
  icon?: string;
}

export interface Question {
  id: string;
  category: PreferenceCategory;
  mode: 'quick' | 'standard' | 'deep' | 'vibe';
  title: string;
  description?: string;
  type: 'single' | 'multiple' | 'slider' | 'scale';
  options: AnswerOption[];
  required: boolean;
  weight: number;
  maxSelections?: number;
}

