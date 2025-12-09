// 평형별 기본 수량

export interface BaseQuantities {
  demolition: {
    labor: number;
    waste: number;
    cleanup: number;
  };
  furniture: {
    shoeCabinet: number;
    closet: number;
    doors: number;
    molding: number;
    baseboard: number;
  };
  electrical: {
    basicWiring: number;
    induction: number;
    aircon: number;
    lights: number;
    indirectLight: number;
  };
  bathroom: {
    sets: number;
  };
  kitchen: {
    lowerCabinet: number;
    upperCabinet: number;
  };
}

// 25평 기준 기본 수량
export const BASE_QUANTITIES_25PY: BaseQuantities = {
  demolition: {
    labor: 9,
    waste: 2,
    cleanup: 2
  },
  furniture: {
    shoeCabinet: 5,
    closet: 3,
    doors: 4,
    molding: 35,
    baseboard: 35
  },
  electrical: {
    basicWiring: 25,
    induction: 1,
    aircon: 2,
    lights: 12,
    indirectLight: 8
  },
  bathroom: {
    sets: 2
  },
  kitchen: {
    lowerCabinet: 15,
    upperCabinet: 12
  }
};

// 평형별 계수
export const getSizeMultiplier = (pyeong: number): number => {
  if (pyeong <= 15) return 0.6;
  if (pyeong <= 20) return 0.8;
  if (pyeong <= 25) return 1.0;
  if (pyeong <= 30) return 1.2;
  if (pyeong <= 40) return 1.5;
  return 1.8;
};

// 평형별 수량 계산
export const getQuantitiesBySize = (pyeong: number): BaseQuantities => {
  const multiplier = getSizeMultiplier(pyeong);
  const base = BASE_QUANTITIES_25PY;
  
  return {
    demolition: {
      labor: Math.round(base.demolition.labor * multiplier),
      waste: Math.max(1, Math.round(base.demolition.waste * multiplier)),
      cleanup: Math.max(1, Math.round(base.demolition.cleanup * multiplier))
    },
    furniture: {
      shoeCabinet: Math.round(base.furniture.shoeCabinet * multiplier),
      closet: Math.round(base.furniture.closet * multiplier),
      doors: Math.round(base.furniture.doors * multiplier),
      molding: Math.round(base.furniture.molding * multiplier),
      baseboard: Math.round(base.furniture.baseboard * multiplier)
    },
    electrical: {
      basicWiring: Math.round(base.electrical.basicWiring * multiplier),
      induction: 1,
      aircon: Math.max(2, Math.round(base.electrical.aircon * multiplier)),
      lights: Math.round(base.electrical.lights * multiplier),
      indirectLight: Math.round(base.electrical.indirectLight * multiplier)
    },
    bathroom: {
      sets: Math.max(1, Math.round(base.bathroom.sets * multiplier))
    },
    kitchen: {
      lowerCabinet: Math.round(base.kitchen.lowerCabinet * multiplier),
      upperCabinet: Math.round(base.kitchen.upperCabinet * multiplier)
    }
  };
};






