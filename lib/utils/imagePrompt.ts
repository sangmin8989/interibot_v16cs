/**
 * 인테리어 이미지 프롬프트 빌더
 * 한국 아파트 기준 현실적인 인테리어 이미지 생성용
 */

export type SpaceType = 'living' | 'kitchen' | 'bathroom'

export interface StyleProfile {
  mainStyleKor: string // 메인 스타일 (예: "모던&미니멀", "북유럽", "내추럴 우드")
  mainColor: string // 메인 컬러
  subColor: string // 서브 컬러
  floorKor: string // 바닥 재질 (예: "밝은 톤 강마루", "대형 포세린 타일")
  pointKor?: string // 포인트 요소 (거실용: TV 포인트월 등)
  // kitchen 전용
  layoutType?: string // 주방 레이아웃 (예: "일자형", "ㄱ자형", "ㄷ자형", "아일랜드형")
  upperColor?: string // 상부장 컬러
  lowerColor?: string // 하부장 컬러
  counterMaterial?: string // 상판 재질 (예: "화이트 인조대리석", "라이트 그레이 엔지니어드 스톤")
  tileColor?: string // 벽 타일 컬러
  // bathroom 전용
  bathStyle?: string // 욕실 스타일 (예: "호텔라이크", "모던", "북유럽")
  floorColor?: string // 바닥 타일 컬러
  tone?: string // 전체 분위기 톤 (예: "따뜻한 베이지톤", "차분한 그레이톤")
}

/**
 * 공통 한국 아파트 현실 규칙 (모든 프롬프트에 포함)
 */
const BASE_PROMPT = `
realistic korean apartment interior,
2.3m~2.4m ceiling,
practical and buildable,
human-eye-level, 24-35mm lens,
quality: hd,
style: natural,
no exaggerated decoration,
no huge european windows,
no palace feeling`.trim()

/**
 * 거실 프롬프트 빌드
 */
function buildLivingRoomPrompt(p: StyleProfile): string {
  return `
대한민국 25~34평 아파트 거실.
스타일: ${p.mainStyleKor}
메인 컬러: ${p.mainColor}, 서브 컬러: ${p.subColor}
바닥: ${p.floorKor}
${p.pointKor ? `TV 포인트월: ${p.pointKor}` : ''}
벽: 화이트 실크벽지 또는 라이트 그레이 도장
천장: 2.3~2.4m, 간접조명 라인 + 매입등
창호: 한국 아파트 비율, 과한 통창/통유리는 배제
가구: 미니멀 소파 + 슬림 TV장 + 러그

${BASE_PROMPT}
realistic korean apartment living room,
no exaggerated decoration,
no huge windows,
hd, natural
  `.trim()
}

/**
 * 주방 프롬프트 빌드
 */
function buildKitchenPrompt(p: StyleProfile): string {
  return `
대한민국 아파트 ${p.layoutType || '일자형'} 주방.
스타일: ${p.mainStyleKor}
상부장: ${p.upperColor || '화이트'}
하부장: ${p.lowerColor || '그레이'}
상판: ${p.counterMaterial || '화이트 인조대리석'}
벽 타일: ${p.tileColor || '라이트 그레이'}, 줄눈은 얇게 표현
바닥: ${p.floorKor}
가전: 빌트인 위주(인덕션, 후드, 빌트인 냉장고 등 자연스럽게 배치)
조명: 상부 간접조명 + 매입등, 과한 샹들리에 금지

${BASE_PROMPT}
realistic korean apartment kitchen,
practical and buildable design,
no unrealistic giant windows,
hd, natural
  `.trim()
}

/**
 * 욕실 프롬프트 빌드
 */
function buildBathroomPrompt(p: StyleProfile): string {
  return `
대한민국 아파트 메인 욕실.
스타일: ${p.bathStyle || '모던'}
바닥: 미끄럼 방지 포세린 타일 ${p.floorColor || '라이트 그레이'}
벽: 상부 밝은 톤 타일 + 하부 중간 톤 타일, 줄눈 선이 과도하게 강조되지 않게
세면대: 일자 카운터형 세면대 + 하부 수납장
거울장: 긴 일자형 거울장 + 상부 간접조명
샤워부스: 투명 유리 파티션(프레임은 블랙 또는 스테인리스 정도)
전체 분위기 톤: ${p.tone || '차분한 그레이톤'}
천장: 약 2.3m

${BASE_PROMPT}
realistic korean apartment bathroom,
no bathtub island,
no luxury hotel lobby feeling,
hd, natural
  `.trim()
}

/**
 * 인테리어 이미지 프롬프트 빌더
 * @param space 공간 타입 (living/kitchen/bathroom)
 * @param profile 스타일 프로필
 * @returns 최종 프롬프트 문자열
 */
export function buildImagePrompt(
  space: SpaceType,
  profile: StyleProfile
): string {
  switch (space) {
    case 'living':
      return buildLivingRoomPrompt(profile)
    case 'kitchen':
      return buildKitchenPrompt(profile)
    case 'bathroom':
      return buildBathroomPrompt(profile)
    default:
      return BASE_PROMPT
  }
}

/**
 * 스타일 분석 결과에서 StyleProfile 추출 (헬퍼 함수)
 * @param style 스타일 문자열 (예: "모던", "북유럽")
 * @param colors 색상 배열
 * @param preferences 성향 분석 결과
 * @param space 공간 타입
 * @returns StyleProfile 객체
 */
export function extractStyleProfile(
  style: string,
  colors: string[],
  preferences: any,
  space: SpaceType
): StyleProfile {
  const mainColor = colors?.[0] || '화이트'
  const subColor = colors?.[1] || '라이트 그레이'

  // 기본 프로필
  const profile: StyleProfile = {
    mainStyleKor: style || '모던&미니멀',
    mainColor,
    subColor,
    floorKor: '밝은 톤 강마루',
  }

  // 공간별 추가 정보
  if (space === 'living') {
    profile.pointKor = '템바보드'
  } else if (space === 'kitchen') {
    profile.layoutType = '일자형'
    profile.upperColor = mainColor
    profile.lowerColor = subColor
    profile.counterMaterial = '화이트 인조대리석'
    profile.tileColor = '라이트 그레이'
  } else if (space === 'bathroom') {
    profile.bathStyle = style || '모던'
    profile.floorColor = '라이트 그레이'
    profile.tone = '차분한 그레이톤'
  }

  return profile
}





