import type { AnchorEstimate, CategoryCost } from '@/lib/data/anchor-types';
import { calculateIndirectCost, calculateTotalCost } from './indirect-cost';

export type GradeType = 'Basic' | 'Standard' | 'argen' | 'Premium';

export const GRADE_MULTIPLIERS: Record<GradeType, { material: number; description: string }> = {
  Basic: {
    material: 0.75,
    description: 'Budget materials'
  },
  Standard: {
    material: 1.00,
    description: 'Standard materials'
  },
  argen: {
    material: 1.15,
    description: 'Argen custom premium'
  },
  Premium: {
    material: 1.40,
    description: 'High-end materials'
  }
};

export function getGradeMultiplier(grade: GradeType): number {
  const multiplier = GRADE_MULTIPLIERS[grade];
  return multiplier ? multiplier.material : 1.0;
}

export function applyGradeToCategory(
  category: CategoryCost,
  grade: GradeType
): CategoryCost {
  const multiplier = getGradeMultiplier(grade);
  
  const material = Math.round(category.material * multiplier);
  
  const labor = category.labor;
  const expense = category.expense;
  
  const total = material + labor + expense;
  
  return {
    name: category.name,
    total,
    material,
    labor,
    expense
  };
}

export function applyGradeToEstimate(
  estimate: AnchorEstimate,
  grade: GradeType
): AnchorEstimate {
  const updatedCategories: { [key: string]: CategoryCost } = {};
  let totalMaterialCost = 0;
  let totalLaborCost = 0;
  let totalExpenseCost = 0;
  
  for (const [key, category] of Object.entries(estimate.categories)) {
    const updated = applyGradeToCategory(category, grade);
    updatedCategories[key] = updated;
    
    totalMaterialCost += updated.material;
    totalLaborCost += updated.labor;
    totalExpenseCost += updated.expense;
  }
  
  const materialCost = totalMaterialCost;
  const laborCost = totalLaborCost;
  const directCost = materialCost + laborCost + totalExpenseCost;
  
  const indirectCostResult = calculateIndirectCost(directCost, laborCost);
  
  const totalCost = calculateTotalCost(directCost, indirectCostResult.total, true);
  
  return {
    areaPy: estimate.areaPy,
    housingType: estimate.housingType,
    grade,
    totalCost,
    directCost,
    materialCost,
    laborCost,
    indirectCost: indirectCostResult,
    categories: updatedCategories
  };
}
