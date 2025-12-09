import type { AnchorEstimate, CategoryCost } from '@/lib/data/anchor-types';
import { calculateIndirectCost, calculateTotalCost } from './indirect-cost';

export enum ScalingType {
  AREA_BASED = 'AREA_BASED',
  QUANTITY_BASED = 'QUANTITY_BASED',
  STEP_JUMP = 'STEP_JUMP'
}

export const CATEGORY_SCALING_MAP: Record<string, ScalingType> = {
  '주방/다용도실 공사': ScalingType.STEP_JUMP,
  '목공사/가구공사': ScalingType.STEP_JUMP,
  '전기공사': ScalingType.AREA_BASED,
  '욕실 공사': ScalingType.QUANTITY_BASED,
  '욕실자재': ScalingType.QUANTITY_BASED,
  '타일공사': ScalingType.AREA_BASED,
  '도장공사': ScalingType.AREA_BASED,
  '필름공사': ScalingType.AREA_BASED,
  '샤시/중문공사': ScalingType.QUANTITY_BASED,
  '창호공사': ScalingType.QUANTITY_BASED,
  '도배공사': ScalingType.AREA_BASED,
  '기타공사': ScalingType.AREA_BASED,
  '철거공사': ScalingType.AREA_BASED,
  '설비/단열': ScalingType.AREA_BASED,
  '바닥공사': ScalingType.AREA_BASED,
  '가구공사': ScalingType.STEP_JUMP,
  '목공사': ScalingType.STEP_JUMP
};

export const MIN_PYEONG = 10;
export const MAX_PYEONG = 100;
export const ANCHOR_POINTS = [25, 32, 45] as const;

export function getScalingType(categoryName: string): ScalingType {
  return CATEGORY_SCALING_MAP[categoryName] || ScalingType.AREA_BASED;
}

export function findBoundingAnchors(
  targetPy: number,
  anchors: AnchorEstimate[]
): { lower: AnchorEstimate; upper: AnchorEstimate; ratio: number } | null {
  const sorted = [...anchors].sort((a, b) => a.areaPy - b.areaPy);
  
  const exactMatch = sorted.find(a => a.areaPy === targetPy);
  if (exactMatch) {
    return {
      lower: exactMatch,
      upper: exactMatch,
      ratio: 0
    };
  }
  
  for (let i = 0; i < sorted.length - 1; i++) {
    if (targetPy >= sorted[i].areaPy && targetPy <= sorted[i + 1].areaPy) {
      const lower = sorted[i];
      const upper = sorted[i + 1];
      const ratio = (targetPy - lower.areaPy) / (upper.areaPy - lower.areaPy);
      
      return {
        lower,
        upper,
        ratio
      };
    }
  }
  
  return null;
}

export function interpolateCategoryCost(
  lowerCost: CategoryCost,
  upperCost: CategoryCost,
  ratio: number,
  scalingType: ScalingType,
  targetPy: number,
  lowerPy: number,
  upperPy: number
): CategoryCost {
  switch (scalingType) {
    case ScalingType.AREA_BASED: {
      const total = lowerCost.total + (upperCost.total - lowerCost.total) * ratio;
      const material = lowerCost.material + (upperCost.material - lowerCost.material) * ratio;
      const labor = lowerCost.labor + (upperCost.labor - lowerCost.labor) * ratio;
      const expense = lowerCost.expense + (upperCost.expense - lowerCost.expense) * ratio;
      
      return {
        name: lowerCost.name,
        total: Math.round(total),
        material: Math.round(material),
        labor: Math.round(labor),
        expense: Math.round(expense)
      };
    }
    
    case ScalingType.QUANTITY_BASED: {
      return {
        name: lowerCost.name,
        total: Math.round((lowerCost.total + upperCost.total) / 2),
        material: Math.round((lowerCost.material + upperCost.material) / 2),
        labor: Math.round((lowerCost.labor + upperCost.labor) / 2),
        expense: Math.round((lowerCost.expense + upperCost.expense) / 2)
      };
    }
    
    case ScalingType.STEP_JUMP: {
      const useLower = ratio < 0.5;
      return useLower ? { ...lowerCost } : { ...upperCost };
    }
    
    default:
      const total = lowerCost.total + (upperCost.total - lowerCost.total) * ratio;
      const material = lowerCost.material + (upperCost.material - lowerCost.material) * ratio;
      const labor = lowerCost.labor + (upperCost.labor - lowerCost.labor) * ratio;
      const expense = lowerCost.expense + (upperCost.expense - lowerCost.expense) * ratio;
      
      return {
        name: lowerCost.name,
        total: Math.round(total),
        material: Math.round(material),
        labor: Math.round(labor),
        expense: Math.round(expense)
      };
  }
}

export function scaleByArea(
  targetPy: number,
  anchors: AnchorEstimate[]
): AnchorEstimate {
  let clampedPy = Math.max(MIN_PYEONG, Math.min(MAX_PYEONG, targetPy));
  
  const sortedAnchors = [...anchors].sort((a, b) => a.areaPy - b.areaPy);
  const minAnchor = sortedAnchors[0];
  const maxAnchor = sortedAnchors[sortedAnchors.length - 1];
  
  let resultCategories: { [key: string]: CategoryCost } = {};
  let directCost = 0;
  let materialCost = 0;
  let laborCost = 0;
  
  if (clampedPy < minAnchor.areaPy) {
    const scaleRatio = clampedPy / minAnchor.areaPy;
    
    for (const [key, category] of Object.entries(minAnchor.categories)) {
      const scaled: CategoryCost = {
        name: category.name,
        total: Math.round(category.total * scaleRatio),
        material: Math.round(category.material * scaleRatio),
        labor: Math.round(category.labor * scaleRatio),
        expense: Math.round(category.expense * scaleRatio)
      };
      
      resultCategories[key] = scaled;
      directCost += scaled.total;
      materialCost += scaled.material;
      laborCost += scaled.labor;
    }
  } else if (clampedPy > maxAnchor.areaPy) {
    const scaleRatio = clampedPy / maxAnchor.areaPy;
    
    for (const [key, category] of Object.entries(maxAnchor.categories)) {
      const scaled: CategoryCost = {
        name: category.name,
        total: Math.round(category.total * scaleRatio),
        material: Math.round(category.material * scaleRatio),
        labor: Math.round(category.labor * scaleRatio),
        expense: Math.round(category.expense * scaleRatio)
      };
      
      resultCategories[key] = scaled;
      directCost += scaled.total;
      materialCost += scaled.material;
      laborCost += scaled.labor;
    }
  } else {
    const bounding = findBoundingAnchors(clampedPy, sortedAnchors);
    
    if (!bounding) {
      resultCategories = { ...minAnchor.categories };
      directCost = minAnchor.directCost;
      materialCost = minAnchor.materialCost;
      laborCost = minAnchor.laborCost;
    } else {
      const { lower, upper, ratio } = bounding;
      
      const allCategoryKeys = new Set([
        ...Object.keys(lower.categories),
        ...Object.keys(upper.categories)
      ]);
      
      for (const key of allCategoryKeys) {
        const lowerCategory = lower.categories[key];
        const upperCategory = upper.categories[key];
        
        if (!lowerCategory || !upperCategory) {
          const category = lowerCategory || upperCategory;
          if (category) {
            resultCategories[key] = { ...category };
            directCost += category.total;
            materialCost += category.material;
            laborCost += category.labor;
          }
          continue;
        }
        
        const scalingType = getScalingType(lowerCategory.name);
        
        const interpolated = interpolateCategoryCost(
          lowerCategory,
          upperCategory,
          ratio,
          scalingType,
          clampedPy,
          lower.areaPy,
          upper.areaPy
        );
        
        resultCategories[key] = interpolated;
        directCost += interpolated.total;
        materialCost += interpolated.material;
        laborCost += interpolated.labor;
      }
    }
  }
  
  const indirectCostResult = calculateIndirectCost(directCost, laborCost);
  
  const totalCost = calculateTotalCost(directCost, indirectCostResult.total, true);
  
  return {
    areaPy: clampedPy,
    housingType: sortedAnchors[0]?.housingType || 'apartment',
    grade: sortedAnchors[0]?.grade || 'Standard',
    totalCost,
    directCost,
    materialCost,
    laborCost,
    indirectCost: indirectCostResult,
    categories: resultCategories
  };
}
