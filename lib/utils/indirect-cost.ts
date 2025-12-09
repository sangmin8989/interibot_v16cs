/**
 * Indirect cost calculation utility
 */

import type { CategoryCost } from '@/lib/data/anchor-types';

export const INDIRECT_COST_RATES = {
  insuranceRate: 0.0457,
  overheadRate: 0.03,
  managementRate: 0.05,
};

export interface IndirectCostResult {
  insurance: number;
  overhead: number;
  management: number;
  total: number;
}

export interface CostSummary {
  directCost: number;
  materialCost: number;
  laborCost: number;
  expenseCost: number;
}

export function calculateIndirectCost(
  directCost: number,
  laborCost: number
): IndirectCostResult {
  const insurance = Math.round(laborCost * INDIRECT_COST_RATES.insuranceRate);
  const overhead = Math.round(directCost * INDIRECT_COST_RATES.overheadRate);
  const management = Math.round(directCost * INDIRECT_COST_RATES.managementRate);
  const total = insurance + overhead + management;
  
  return {
    insurance,
    overhead,
    management,
    total
  };
}

export function summarizeCategoryCosts(
  categories: { [key: string]: CategoryCost }
): CostSummary {
  let materialCost = 0;
  let laborCost = 0;
  let expenseCost = 0;
  
  for (const category of Object.values(categories)) {
    materialCost += category.material;
    laborCost += category.labor;
    expenseCost += category.expense;
  }
  
  const directCost = materialCost + laborCost + expenseCost;
  
  return {
    directCost,
    materialCost,
    laborCost,
    expenseCost
  };
}

export function calculateTotalCost(
  directCost: number,
  indirectCost: number,
  roundToManwon: boolean = true
): number {
  const total = directCost + indirectCost;
  
  if (roundToManwon) {
    return Math.floor(total / 10000) * 10000;
  }
  
  return total;
}
