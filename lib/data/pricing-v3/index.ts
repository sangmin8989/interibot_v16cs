/**
 * 인테리봇 견적 시스템 V3 - 통합 내보내기
 * 
 * 4등급 체계: BASIC / STANDARD / ARGEN / PREMIUM
 * 아르젠 컨셉: Standard 가격 + Premium 품질
 * 
 * 🔧 아르젠 제작: 싱크대, 붙박이장, 수납장, 욕실장
 * ⭐ 아르젠 추천: 도배, 바닥, 필름, 샷시, 도어, 타일
 */

// ============================================================
// 1. 타입 및 상수
// ============================================================
export {
  // 타입
  type Grade,
  type SizeRange,
  type PriceUnit,
  type ArgenType,
  type ProcessCategory,
  type GradeInfo,
  type ArgenConcept,
  type SizeRangeInfo,
  type BrandInfo,
  type GradeBrands,
  type GradePrices,
  type BasePriceItem,
  type SizeQuantities,
  type WallpaperLabor,
  
  // 상수
  GRADES,
  ARGEN_MADE,
  ARGEN_RECOMMENDED,
  ARGEN_PROCESS_TYPE,
  SIZE_RANGES,
  SIZE_QUANTITIES,
  PROCESS_CATEGORIES,
  WALLPAPER_LABOR,
  
  // 유틸리티 함수
  getSizeRange,
  formatPrice,
  formatWon,
  formatManWon,
  calculateVAT,
  priceWithVAT
} from './types';

// ============================================================
// 2. 노무비
// ============================================================
export {
  type LaborProcessId,
  type LaborInfo,
  type TotalLaborCost,
  type ConstructionPeriod,
  
  LABOR_PRICES,
  WALLPAPER_DAYS,
  FILM_DAYS,
  TILE_DAYS,
  CARPENTRY_DAYS,
  PLUMBING_DAYS,
  
  calculateDemolitionLabor,
  calculateCarpentryLabor,
  calculateTileLabor,
  calculateWallpaperLabor,
  calculateFlooringLabor,
  calculateFilmLabor,
  calculatePlumbingLabor,
  getKitchenInstallLabor,
  getKitchenRemoveLabor,
  calculateCleaningLabor,
  calculateTotalLabor,
  calculateConstructionPeriod
} from './labor';

// ============================================================
// 3. 도배
// ============================================================
export {
  type WallpaperEstimate,
  
  WALLPAPER_BRANDS,
  WALLPAPER_PRICES,
  WALLPAPER_COST_BY_SIZE,
  WALLPAPER_TYPES,
  
  calculateWallpaperEstimate,
  getWallpaperRecommendation,
  getBrandFeature
} from './wallpaper';

// ============================================================
// 4. 바닥재
// ============================================================
export {
  type FlooringEstimate,
  
  FLOORING_BRANDS,
  FLOORING_MATERIAL_PRICES,
  FLOORING_LABOR_PRICE,
  FLOORING_COST_BY_SIZE,
  FLOORING_TYPES,
  FLOORING_DAILY_OUTPUT,
  
  calculateFlooringEstimate,
  getFlooringRecommendation,
  getFlooringType
} from './flooring';

// ============================================================
// 5. 필름
// ============================================================
export {
  type FilmEstimate,
  
  FILM_BRANDS,
  FILM_MATERIAL_PRICES,
  FILM_LABOR_PRICE_PER_TEAM,
  FILM_COST_BY_SIZE,
  FILM_TYPES,
  FILM_APPLICATION_AREAS,
  FILM_DAILY_OUTPUT,
  
  calculateFilmEstimate,
  getFilmRecommendation
} from './film';

// ============================================================
// 6. 몰딩
// ============================================================
export {
  type MoldingEstimate,
  
  MOLDING_BRANDS,
  MOLDING_PRICES,
  MOLDING_COST_BY_SIZE,
  MOLDING_TYPES,
  BASEBOARD_TYPES,
  
  calculateMoldingEstimate,
  getMoldingRecommendation,
  getMoldingType
} from './molding';

// ============================================================
// 7. 싱크대 (아르젠 제작)
// ============================================================
export {
  type KitchenSpec,
  type KitchenEstimate,
  
  KITCHEN_SPECS,
  KITCHEN_MATERIAL_PRICES,
  KITCHEN_INSTALL_LABOR,
  KITCHEN_REMOVE_LABOR,
  KITCHEN_COST_BY_SIZE,
  KITCHEN_LAYOUTS,
  KITCHEN_COMPONENTS,
  ARGEN_KITCHEN_FEATURES,
  KITCHEN_DAILY_OUTPUT,
  
  calculateKitchenEstimate,
  getKitchenRecommendation
} from './kitchen';

// ============================================================
// 8. 붙박이장/수납장 (아르젠 제작)
// ============================================================
export {
  type FurnitureSpec,
  type ClosetType,
  type FurnitureEstimate,
  
  FURNITURE_SPECS,
  CLOSET_PRICES,
  SHOERACK_PRICES,
  FURNITURE_COST_BY_SIZE,
  CLOSET_TYPES,
  STORAGE_TYPES,
  ARGEN_FURNITURE_FEATURES,
  FURNITURE_LABOR_NOTE,
  
  calculateFurnitureEstimate,
  getFurnitureRecommendation
} from './furniture';

// ============================================================
// 9. 샷시
// ============================================================
export {
  type WindowSpec,
  type WindowEstimate,
  
  WINDOW_BRANDS,
  WINDOW_SPECS,
  WINDOW_PACKAGE_PRICES,
  GLASS_TYPES,
  FRAME_TYPES,
  WINDOW_INSULATION_COMPARE,
  WINDOW_PACKAGE_INCLUDES,
  WINDOW_DAILY_OUTPUT,
  
  calculateWindowEstimate,
  getWindowRecommendation
} from './window';

// ============================================================
// 10. 방문/중문/폴딩도어
// ============================================================
export {
  type DoorEstimate,
  
  DOOR_BRANDS,
  DOOR_PRICES,
  MIDDLE_DOOR_BRANDS,
  MIDDLE_DOOR_PRICES,
  FOLDING_DOOR_BRANDS,
  FOLDING_DOOR_PRICES,
  DOOR_COST_BY_SIZE,
  FOLDING_DOOR_COUNT_BY_SIZE,
  FOLDING_DOOR_COST_BY_SIZE,
  DOOR_TYPES,
  MIDDLE_DOOR_TYPES,
  DOOR_LABOR_NOTE,
  
  calculateDoorEstimate,
  getDoorRecommendation,
  getMiddleDoorRecommendation
} from './door';

// ============================================================
// 11. 도어락
// ============================================================
export {
  type DoorlockType,
  type DoorlockInfo,
  type DoorlockEstimate,
  
  DOORLOCK_OPTIONS,
  DOORLOCK_PRICES,
  DOORLOCK_COMPARISON,
  DOORLOCK_FEATURES,
  DOORLOCK_INSTALL_NOTE,
  ARGEN_RECOMMENDED_DOORLOCK,
  
  calculateDoorlockEstimate,
  getDoorlockByBrand,
  getDoorlockRecommendation
} from './doorlock';

// ============================================================
// 12. 타일
// ============================================================
export {
  type TileLocation,
  type TileEstimate,
  
  TILE_BRANDS,
  TILE_MATERIAL_PRICES,
  TILE_LABOR_PRICE_PER_TEAM,
  TILE_AREA_BY_LOCATION,
  TILE_COST_BY_SIZE,
  TILE_TYPES,
  TILE_INSTALLATION_TYPES,
  TILE_DAILY_OUTPUT,
  
  calculateTileEstimate,
  getTileRecommendation
} from './tile';

// ============================================================
// 13. 욕실 (위생도기/욕실장/액세서리)
// ============================================================
export {
  type BidetType,
  type BathtubType,
  type BathroomSetEstimate,
  
  TOILET_OPTIONS,
  BASIN_OPTIONS,
  FAUCET_OPTIONS,
  BATHROOM_CABINET_OPTIONS,
  ACCESSORY_OPTIONS,
  BIDET_OPTIONS,
  BATHTUB_OPTIONS,
  BATHROOM_COST_BY_SIZE,
  BATHROOM_LABOR_NOTE,
  ARGEN_BATHROOM_CABINET_FEATURES,
  
  calculateBathroomSetEstimate,
  getBathroomRecommendation
} from './bathroom';

// ============================================================
// 14. 조명/스위치/콘센트
// ============================================================
export {
  type DownlightGrade,
  type SwitchGrade,
  type LightingEstimate,
  
  DOWNLIGHT_OPTIONS,
  INDIRECT_LIGHT_OPTIONS,
  SWITCH_OPTIONS,
  LIGHTING_COST_BY_SIZE,
  LIGHTING_GRADE_COMPARISON_30PY,
  LIGHTING_PLACEMENT_GUIDE,
  LIGHTING_LABOR_NOTE,
  
  calculateLightingEstimate,
  getDownlightRecommendation,
  getSwitchRecommendation
} from './lighting';

// ============================================================
// 15. 보양재
// ============================================================
export {
  type ProtectionType,
  type ProtectionItem,
  type ProtectionEstimate,
  
  PROTECTION_ITEMS,
  PROTECTION_QUANTITY_BY_SIZE,
  PROTECTION_COST_BY_SIZE,
  PROTECTION_INSTALLATION_ORDER,
  PROTECTION_NOTES,
  MANAGEMENT_OFFICE_CHECKLIST,
  
  calculateProtectionEstimate
} from './protection';

// ============================================================
// 16. 공통 항목 (철거/청소)
// ============================================================
export {
  type CommonEstimate,
  
  DEMOLITION_PRICE_PER_PY,
  DEMOLITION_INFO,
  DEMOLITION_COST_BY_SIZE,
  CLEANING_PRICE_PER_PY,
  CLEANING_INFO,
  CLEANING_COST_BY_SIZE,
  CONSTRUCTION_DEPOSIT,
  OTHER_COMMON_COSTS,
  COMMON_COST_BY_SIZE,
  CONSTRUCTION_PHASES,
  CONSTRUCTION_DURATION_BY_SIZE,
  
  calculateDemolitionCost,
  calculateCleaningCost,
  calculateCommonEstimate
} from './common';



