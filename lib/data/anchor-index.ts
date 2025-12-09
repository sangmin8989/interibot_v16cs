import { ANCHOR_APARTMENT_18PY } from './anchor-apartment-18py';
import { ANCHOR_APARTMENT_25PY } from './anchor-apartment-25py';
import { ANCHOR_APARTMENT_32PY } from './anchor-apartment-32py';
import { ANCHOR_APARTMENT_45PY } from './anchor-apartment-45py';
import type { AnchorEstimate } from './anchor-types';

export const APARTMENT_ANCHORS: AnchorEstimate[] = [
  ANCHOR_APARTMENT_18PY,
  ANCHOR_APARTMENT_25PY,
  ANCHOR_APARTMENT_32PY,
  ANCHOR_APARTMENT_45PY,
];

export const ANCHOR_POINTS = [18, 25, 32, 45] as const;

export function getApartmentAnchor(areaPy: number): AnchorEstimate | null {
  return APARTMENT_ANCHORS.find(anchor => anchor.areaPy === areaPy) || null;
}

export function isExactAnchorArea(areaPy: number): boolean {
  return ANCHOR_POINTS.includes(areaPy as any);
}

export function findInterpolationAnchors(
  areaPy: number
): { lower: AnchorEstimate; upper: AnchorEstimate } | null {
  const sorted = [...APARTMENT_ANCHORS].sort((a, b) => a.areaPy - b.areaPy);
  
  for (let i = 0; i < sorted.length - 1; i++) {
    if (areaPy >= sorted[i].areaPy && areaPy <= sorted[i + 1].areaPy) {
      return {
        lower: sorted[i],
        upper: sorted[i + 1]
      };
    }
  }
  
  return null;
}

export const STANDARD_ANCHORS = {};

export { ANCHOR_APARTMENT_18PY, ANCHOR_APARTMENT_25PY, ANCHOR_APARTMENT_32PY, ANCHOR_APARTMENT_45PY };
export * from './anchor-types';
export * from './housing-type-adjustments';
