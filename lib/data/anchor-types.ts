export interface AnchorEstimate {
  areaPy: number;
  housingType: string;
  grade: string;
  totalCost: number;
  directCost: number;
  materialCost: number;
  laborCost: number;
  indirectCost: {
    insurance: number;
    overhead: number;
    management: number;
    total: number;
  };
  categories: {
    [key: string]: CategoryCost;
  };
}

export interface CategoryCost {
  name: string;
  total: number;
  material: number;
  labor: number;
  expense: number;
}

export interface HousingTypeAdjustment {
  base: number;
  description: string;
  note: string;
  categoryAdjustments?: {
    [category: string]: number | 'add';
  };
}
