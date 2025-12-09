/**
 * 인테리봇 견적 타입 정의 (V2 확장)
 * 
 * 변경사항:
 * - 주방 옵션 세분화 (형태, 상판, 설비 등)
 * - 욕실 옵션 세분화 (스타일, 설비, 타일 등)
 * - 목공 옵션 세분화 (가구 종류, 맞춤 옵션)
 * - 전기 옵션 세분화 (조명 타입, 스마트홈)
 * - 도배 옵션 세분화 (벽지 종류, 천장)
 * - 타일 옵션 세분화 (사이즈, 패턴)
 */

// ============================================================
// 기본 타입
// ============================================================

export type Grade = 'basic' | 'standard' | 'argen' | 'premium'

// ============================================================
// 주방 옵션 (세분화)
// ============================================================

/** 주방 형태 */
export type KitchenLayout = '일자' | 'ㄱ자' | 'ㄷ자' | '아일랜드' | 'ㄱ자+아일랜드'

/** 상판 재질 */
export type CountertopMaterial = '인조대리석' | '엔지니어드스톤' | '세라믹' | '천연대리석' | '스테인리스'

/** 주방 설비 */
export interface KitchenAppliances {
  후드?: '기본' | '매입형' | '천장매입' | '아일랜드형'
  쿡탑?: '가스레인지' | '인덕션' | '하이브리드'
  식기세척기?: boolean
  빌트인오븐?: boolean
  빌트인정수기?: boolean
}

export interface KitchenOptions {
  // 주방 형태 (가격에 큰 영향)
  형태?: KitchenLayout
  
  // 상판 재질
  상판재질?: CountertopMaterial
  
  // 추가 수납장
  냉장고장?: boolean
  키큰장?: boolean
  아일랜드장?: boolean
  팬트리?: boolean
  
  // 다용도실 연동
  다용도실?: boolean
  다용도실상부장?: boolean
  다용도실하부장?: boolean
  
  // 설비
  설비?: KitchenAppliances
  
  // 특수 옵션
  상부장LED?: boolean
  하부장LED?: boolean
  소프트클로징?: boolean
  
  // 정수기 설치 공간
  정수기설치?: boolean
  정수기타입?: '빌트인(싱크대하부)' | '언더싱크' | '별도공간(키큰장내)' | '냉온정수기공간'
  정수기배관?: boolean
}

// ============================================================
// 욕실 옵션 (세분화)
// ============================================================

/** 욕실 스타일 */
export type BathroomStyle = '모던' | '클래식' | '미니멀' | '내추럴' | '호텔식'

/** 타일 사이즈 */
export type TileSize = '소형(300x300)' | '중형(600x600)' | '대형(800x800)' | '대판(1200x600)'

/** 욕실 설비 등급 */
export type SanitaryGrade = '기본' | '중급' | '고급' | '프리미엄'

export interface BathroomOptions {
  // 스타일
  스타일?: BathroomStyle
  
  // 타일
  바닥타일사이즈?: TileSize
  벽타일사이즈?: TileSize
  포인트타일?: boolean
  
  // 위생도기
  양변기등급?: SanitaryGrade
  세면대등급?: SanitaryGrade
  욕조?: boolean
  욕조타입?: '일반' | '반신욕' | '자쿠지'
  샤워부스?: boolean
  샤워부스타입?: '일반' | '레인샤워' | '월풀'
  
  // 설비
  비데?: boolean
  비데등급?: '기본' | '고급' | '프리미엄'
  수전업그레이드?: boolean
  수전타입?: '일반' | '터치' | '센서'
  
  // 수납/마감
  욕실장타입?: '벽걸이' | '하부장' | '키큰장'
  젠다이?: boolean
  파티션?: boolean
  
  // 특수
  바닥난방?: boolean
  환풍기등급?: '기본' | '제습형' | '냉온풍'
}

// ============================================================
// 목공 옵션 (세분화)
// ============================================================

/** 가구 재질 */
export type FurnitureMaterial = 'PET' | 'UV' | '원목무늬' | '원목'

/** 가구 크기 */
export type ClosetSize = '2400' | '3000' | '3600' | '벽면전체'

export interface WoodworkOptions {
  // 선택 가구
  선택가구?: string[]
  
  // 붙박이장 옵션
  붙박이장재질?: FurnitureMaterial
  붙박이장크기?: ClosetSize
  붙박이장내부구성?: ('선반' | '서랍' | '행거' | '바지걸이' | '넥타이걸이')[]
  
  // 신발장 옵션
  신발장크기?: '소형' | '중형' | '대형' | '벽면전체'
  신발장벤치?: boolean
  신발장거울?: boolean
  
  // 문/중문
  방문교체?: boolean
  방문재질?: 'ABS' | '원목도어' | '유리도어'
  중문타입?: '슬라이딩' | '폴딩' | '여닫이'
  중문크기?: '2400' | '2700' | '3000'
  
  // 몰딩/걸레받이
  몰딩?: '우레탄' | '목재' | '디자인몰딩'
  걸레받이?: 'PVC' | '목재' | '알루미늄'
  
  // 맞춤제작
  맞춤제작?: boolean
  하드웨어등급?: '기본' | 'Hettich' | 'Blum'
}

// ============================================================
// 전기 옵션 (세분화)
// ============================================================

/** 조명 타입 */
export type LightingType = '다운라이트' | '간접조명' | '라인조명' | '펜던트' | '스팟조명'

export interface ElectricOptions {
  // 조명
  조명타입?: LightingType[]
  조명개수?: number
  디밍가능?: boolean
  색온도조절?: boolean
  
  // 스위치/콘센트
  스위치등급?: '기본' | '모듈러' | '터치' | '스마트'
  콘센트추가?: number
  USB콘센트?: boolean
  
  // 분전반
  분전반교체?: boolean
  회로증설?: boolean
  
  // 특수
  인덕션회로?: boolean
  에어컨전용회로?: boolean
  EV충전콘센트?: boolean
  
  // 스마트홈
  스마트홈?: boolean
  스마트조명?: boolean
  스마트스위치?: boolean
}

// ============================================================
// 도배 옵션 (세분화)
// ============================================================

/** 벽지 종류 */
export type WallpaperType = '합지' | '실크' | '수입벽지' | '친환경' | '페인트'

export interface WallpaperOptions {
  // 벽지
  벽지종류?: WallpaperType
  포인트벽지?: boolean
  포인트위치?: string[]
  
  // 천장
  천장종류?: '합지' | '실크' | '페인트' | '우물천장'
  우물천장?: boolean
  
  // 특수
  곰팡이방지?: boolean
  방음벽지?: boolean
}

// ============================================================
// 타일 옵션 (세분화)
// ============================================================

export interface TileOptions {
  // 현관
  현관타일사이즈?: TileSize
  현관패턴?: '일반' | '헤링본' | '다이아몬드'
  
  // 발코니
  발코니타일?: boolean
  발코니타일사이즈?: TileSize
  
  // 줄눈
  줄눈색상?: '화이트' | '그레이' | '블랙' | '골드'
  에폭시줄눈?: boolean
}

// ============================================================
// 필름 옵션 (세분화)
// ============================================================

export interface FilmOptions {
  // 시공 범위
  시공범위?: ('문' | '가구' | '중문' | '싱크대' | '창틀')[]
  
  // 필름 종류
  필름등급?: '일반' | '프리미엄' | '3M' | '수입'
  무광유광?: '무광' | '유광' | '반광'
  
  // 특수
  방염필름?: boolean
  내스크래치?: boolean
}

// ============================================================
// 창호 옵션 (세분화)
// ============================================================

export interface WindowOptions {
  // 창호 교체
  발코니창교체?: boolean
  방창교체?: boolean
  이중창?: boolean
  
  // 방충망
  방충망?: boolean
  미세먼지망?: boolean
  
  // 단열
  단열필름?: boolean
  블라인드내장?: boolean
}

// ============================================================
// 성향 (확장)
// ============================================================

export interface TraitPreference {
  // 기존 성향
  요리빈도?: 1 | 2 | 3 | 4 | 5
  정리정돈?: 1 | 2 | 3 | 4 | 5
  청소성향?: 1 | 2 | 3 | 4 | 5
  조명취향?: 1 | 2 | 3 | 4 | 5
  예산감각?: 1 | 2 | 3 | 4 | 5
  
  // 확장 성향
  디자인선호?: '모던' | '클래식' | '미니멀' | '내추럴' | '럭셔리'
  색상선호?: '화이트' | '그레이' | '우드' | '다크' | '컬러풀'
  수납중요도?: 1 | 2 | 3 | 4 | 5
  청결중요도?: 1 | 2 | 3 | 4 | 5
  기술선호도?: 1 | 2 | 3 | 4 | 5  // 스마트홈 관련
  
  [key: string]: unknown
}

// ============================================================
// 견적 입력 (통합)
// ============================================================

export interface EstimateInput {
  // 기본 정보
  평수: number
  방개수: number
  욕실개수: number
  현재상태?: '신축' | '구축아파트'
  층수?: number
  
  // 세분화된 옵션
  주방옵션?: KitchenOptions
  욕실옵션?: BathroomOptions
  목공옵션?: WoodworkOptions
  전기옵션?: ElectricOptions
  도배옵션?: WallpaperOptions
  타일옵션?: TileOptions
  필름옵션?: FilmOptions
  창호옵션?: WindowOptions
  
  // 성향
  성향?: TraitPreference
  
  // 공정 선택
  selectedProcesses?: string[]
  selectedSpaces?: string[]
  tierSelections?: Record<string, { enabled: boolean; tier: string }>
}

// ============================================================
// 견적 결과
// ============================================================

export interface LineItem {
  공정: string
  항목: string
  브랜드?: string
  규격: string
  단위: string
  수량: number
  재료비: number
  노무비: number
  합계: number
  작업정보?: {
    작업인원: number
    작업기간: number
    작업기간단위: string
    설명: string
  }
}

export interface GradeResult {
  세부내역: LineItem[]
  재료비: number
  노무비: number
  직접공사비: number
  간접공사비: {
    산재고용보험: number
    공과잡비: number
    현장관리및감리: number
    합계: number
  }
  총액: number
  범위견적: {
    min: number
    max: number
  }
}

export interface EstimateResult {
  basic: GradeResult
  standard: GradeResult
  argen: GradeResult
  premium: GradeResult
  recommended: Grade
  selected_processes: string[]
}
