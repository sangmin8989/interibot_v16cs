/**
 * 인테리봇 마스터 데이터 V2 (현실적 단가 적용)
 * 
 * 기준: 30평 아파트 인테리어 총 견적 3,000만원~8,000만원
 * - 도배: 80~150만원
 * - 전기: 80~150만원
 * - 타일(욕실): 150~400만원
 * - 주방: 500~1,500만원
 * - 목공: 300~800만원
 * - 욕실: 300~800만원
 * - 철거: 80~200만원
 * - 기타(관리비, 청소 등): 150~300만원
 */

import type { Grade, KitchenLayout, CountertopMaterial, BathroomStyle } from '@/lib/estimate/types'

// ============================================================
// 주방 형태별 가격 배율
// ============================================================

export const KITCHEN_LAYOUT_MULTIPLIERS: Record<KitchenLayout, number> = {
  '일자': 1.0,        // 기준 (가장 저렴)
  'ㄱ자': 1.15,       // +15% (코너 시공)
  'ㄷ자': 1.35,       // +35% (양쪽 코너)
  '아일랜드': 1.5,    // +50% (아일랜드 추가)
  'ㄱ자+아일랜드': 1.7  // +70% (최고급)
}

// ============================================================
// 상판 재질별 가격 (㎡당)
// ============================================================

export const COUNTERTOP_PRICES: Record<CountertopMaterial, Record<Grade, number>> = {
  '인조대리석': { basic: 150000, standard: 200000, argen: 280000, premium: 400000 },
  '엔지니어드스톤': { basic: 250000, standard: 350000, argen: 480000, premium: 650000 },
  '세라믹': { basic: 350000, standard: 480000, argen: 650000, premium: 900000 },
  '천연대리석': { basic: 500000, standard: 700000, argen: 950000, premium: 1400000 },
  '스테인리스': { basic: 200000, standard: 280000, argen: 380000, premium: 550000 }
}

// ============================================================
// 욕실 스타일별 추가 비용
// ============================================================

export const BATHROOM_STYLE_ADDITIONS: Record<BathroomStyle, Record<Grade, number>> = {
  '모던': { basic: 0, standard: 100000, argen: 200000, premium: 350000 },
  '클래식': { basic: 200000, standard: 350000, argen: 500000, premium: 800000 },
  '미니멀': { basic: 0, standard: 0, argen: 100000, premium: 200000 },
  '내추럴': { basic: 100000, standard: 200000, argen: 350000, premium: 550000 },
  '호텔식': { basic: 500000, standard: 800000, argen: 1200000, premium: 2000000 }
}

// ============================================================
// 마스터 데이터 V2 인터페이스
// ============================================================

export interface MasterItemV2 {
  항목명: string
  규격?: string
  단위: string
  수량계산?: {
    기준: '평수' | '방개수' | '욕실개수' | '고정' | '주방형태' | '상판면적'
    계수: number
    최소?: number
    최대?: number
  }
  재료비: Record<Grade, number>
  노무비: Record<Grade, number>
  브랜드: Record<Grade, string>
  조건?: {
    주방옵션?: Record<string, boolean | string | string[]>
    욕실옵션?: Record<string, boolean | string | string[]>
    목공옵션?: Record<string, boolean | string | string[]>
    전기옵션?: Record<string, boolean | string | string[]>
    도배옵션?: Record<string, boolean | string | string[]>
    타일옵션?: Record<string, boolean | string | string[]>
    필름옵션?: Record<string, boolean | string | string[]>
    창호옵션?: Record<string, boolean | string | string[]>
    철거공정없음?: boolean
  }
  spaces?: string[]
  작업정보?: {
    작업인원: number
    작업기간단위: string
    작업기간계산: string
    설명: string
  }
}

// ============================================================
// 마스터 데이터 V2 - 현실적 단가
// ============================================================

export const masterDataV2 = {
  categories: {
    // ============================================================
    // 주방 공사 (30평 기준: 500~1,500만원)
    // ============================================================
    주방: {
      항목: [
        // 기본 주방가구 (형태에 따라 가격 달라짐)
        {
          항목명: '주방가구 (하부장)',
          규격: '형태별 가변',
          단위: '식',
          수량계산: { 기준: '주방형태', 계수: 1 },
          재료비: { basic: 1800000, standard: 2500000, argen: 3500000, premium: 5000000 },
          노무비: { basic: 400000, standard: 500000, argen: 650000, premium: 800000 },
          브랜드: { basic: '국산 PET', standard: '한샘 베이직', argen: '한샘 키친바흐', premium: '독일 SieMatic' },
          spaces: ['kitchen']
        },
        {
          항목명: '주방가구 (상부장)',
          규격: '형태별 가변',
          단위: '식',
          수량계산: { 기준: '주방형태', 계수: 1 },
          재료비: { basic: 800000, standard: 1100000, argen: 1500000, premium: 2200000 },
          노무비: { basic: 300000, standard: 380000, argen: 450000, premium: 550000 },
          브랜드: { basic: '국산 PET', standard: '한샘 베이직', argen: '한샘 키친바흐', premium: '독일 SieMatic' },
          spaces: ['kitchen']
        },
        // 상판 (재질별 분리)
        {
          항목명: '상판 (인조대리석)',
          규격: '형태별 면적',
          단위: '㎡',
          수량계산: { 기준: '상판면적', 계수: 1 },
          재료비: { basic: 120000, standard: 160000, argen: 220000, premium: 320000 },
          노무비: { basic: 40000, standard: 50000, argen: 65000, premium: 85000 },
          브랜드: { basic: '국산 LG', standard: 'LG 하이막스', argen: '듀폰 코리안', premium: '듀폰 조디악' },
          조건: { 주방옵션: { 상판재질: '인조대리석' } },
          spaces: ['kitchen']
        },
        {
          항목명: '상판 (엔지니어드스톤)',
          규격: '형태별 면적',
          단위: '㎡',
          수량계산: { 기준: '상판면적', 계수: 1 },
          재료비: { basic: 200000, standard: 280000, argen: 400000, premium: 550000 },
          노무비: { basic: 50000, standard: 65000, argen: 85000, premium: 110000 },
          브랜드: { basic: '삼성 라디안스', standard: '캐시미어 화이트', argen: 'Silestone', premium: 'Caesarstone' },
          조건: { 주방옵션: { 상판재질: '엔지니어드스톤' } },
          spaces: ['kitchen']
        },
        {
          항목명: '상판 (세라믹)',
          규격: '형태별 면적',
          단위: '㎡',
          수량계산: { 기준: '상판면적', 계수: 1 },
          재료비: { basic: 300000, standard: 400000, argen: 550000, premium: 750000 },
          노무비: { basic: 70000, standard: 90000, argen: 120000, premium: 150000 },
          브랜드: { basic: '국산 세라믹', standard: 'Dekton', argen: 'Neolith', premium: 'Laminam' },
          조건: { 주방옵션: { 상판재질: '세라믹' } },
          spaces: ['kitchen']
        },
        {
          항목명: '상판 (천연대리석)',
          규격: '형태별 면적',
          단위: '㎡',
          수량계산: { 기준: '상판면적', 계수: 1 },
          재료비: { basic: 400000, standard: 550000, argen: 750000, premium: 1100000 },
          노무비: { basic: 90000, standard: 110000, argen: 150000, premium: 200000 },
          브랜드: { basic: '국산 대리석', standard: '카라라', argen: '칼라카타', premium: '스타투아리오' },
          조건: { 주방옵션: { 상판재질: '천연대리석' } },
          spaces: ['kitchen']
        },
        // 기본 설비
        {
          항목명: '싱크볼+수전',
          규격: 'SUS304',
          단위: '식',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 180000, standard: 260000, argen: 380000, premium: 550000 },
          노무비: { basic: 70000, standard: 90000, argen: 110000, premium: 140000 },
          브랜드: { basic: '국산 SUS304', standard: '국산 프리미엄', argen: 'Franke', premium: 'Blanco' },
          spaces: ['kitchen']
        },
        // 후드 (조건별)
        {
          항목명: '후드 (기본형)',
          규격: '900mm',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 150000, standard: 230000, argen: 350000, premium: 550000 },
          노무비: { basic: 60000, standard: 80000, argen: 100000, premium: 130000 },
          브랜드: { basic: '국산 후드', standard: '하츠', argen: 'Falmec', premium: 'Miele' },
          조건: { 주방옵션: { 설비: { 후드: '기본' } } },
          spaces: ['kitchen']
        },
        {
          항목명: '후드 (매입형)',
          규격: '900mm',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 280000, standard: 400000, argen: 580000, premium: 850000 },
          노무비: { basic: 100000, standard: 130000, argen: 160000, premium: 200000 },
          브랜드: { basic: '국산 매입형', standard: '하츠 매입형', argen: 'Falmec 매입형', premium: 'Miele 매입형' },
          조건: { 주방옵션: { 설비: { 후드: '매입형' } } },
          spaces: ['kitchen']
        },
        // 쿡탑 (조건별)
        {
          항목명: '가스레인지',
          규격: '3구',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 200000, standard: 300000, argen: 450000, premium: 700000 },
          노무비: { basic: 40000, standard: 50000, argen: 60000, premium: 70000 },
          브랜드: { basic: '국산 3구', standard: '린나이', argen: 'Smeg', premium: 'Wolf' },
          조건: { 주방옵션: { 설비: { 쿡탑: '가스레인지' } } },
          spaces: ['kitchen']
        },
        {
          항목명: '인덕션',
          규격: '3구',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 380000, standard: 550000, argen: 800000, premium: 1300000 },
          노무비: { basic: 70000, standard: 90000, argen: 110000, premium: 140000 },
          브랜드: { basic: '쿠쿠', standard: 'LG', argen: 'Miele', premium: 'Gaggenau' },
          조건: { 주방옵션: { 설비: { 쿡탑: '인덕션' } } },
          spaces: ['kitchen']
        },
        // 추가 설비 (조건부)
        {
          항목명: '식기세척기',
          규격: '빌트인',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 500000, standard: 750000, argen: 1100000, premium: 1600000 },
          노무비: { basic: 80000, standard: 100000, argen: 130000, premium: 160000 },
          브랜드: { basic: 'LG', standard: '삼성', argen: 'Bosch', premium: 'Miele' },
          조건: { 주방옵션: { 설비: { 식기세척기: true } } },
          spaces: ['kitchen']
        },
        {
          항목명: '빌트인 오븐',
          규격: '60cm',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 350000, standard: 550000, argen: 850000, premium: 1300000 },
          노무비: { basic: 80000, standard: 100000, argen: 130000, premium: 160000 },
          브랜드: { basic: 'LG', standard: '삼성', argen: 'Smeg', premium: 'Gaggenau' },
          조건: { 주방옵션: { 설비: { 빌트인오븐: true } } },
          spaces: ['kitchen']
        },
        // 추가 가구 (조건부)
        {
          항목명: '냉장고장',
          규격: '키큰장',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 350000, standard: 480000, argen: 680000, premium: 980000 },
          노무비: { basic: 100000, standard: 130000, argen: 160000, premium: 200000 },
          브랜드: { basic: '국산 PET', standard: '한샘', argen: '한샘 프리미엄', premium: '수입 가구' },
          조건: { 주방옵션: { 냉장고장: true } },
          spaces: ['kitchen']
        },
        {
          항목명: '키큰장',
          규격: '2400mm',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 400000, standard: 550000, argen: 780000, premium: 1100000 },
          노무비: { basic: 120000, standard: 150000, argen: 190000, premium: 240000 },
          브랜드: { basic: '국산 PET', standard: '한샘', argen: '한샘 프리미엄', premium: '수입 가구' },
          조건: { 주방옵션: { 키큰장: true } },
          spaces: ['kitchen']
        },
        // 정수기 설치
        {
          항목명: '정수기 설치공간',
          규격: '싱크대 하부',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 80000, standard: 120000, argen: 180000, premium: 280000 },
          노무비: { basic: 50000, standard: 70000, argen: 90000, premium: 120000 },
          브랜드: { basic: '기본 공간', standard: '전용 공간', argen: '프리미엄 공간', premium: '맞춤 제작' },
          조건: { 주방옵션: { 정수기설치: true } },
          spaces: ['kitchen']
        }
      ]
    },

    // ============================================================
    // 욕실 공사 (30평 기준 욕실 2개: 300~800만원)
    // ============================================================
    욕실: {
      항목: [
        // 타일
        {
          항목명: '욕실 바닥타일',
          규격: '300x300',
          단위: '㎡',
          수량계산: { 기준: '욕실개수', 계수: 4 },
          재료비: { basic: 25000, standard: 38000, argen: 55000, premium: 85000 },
          노무비: { basic: 30000, standard: 38000, argen: 48000, premium: 65000 },
          브랜드: { basic: '국산 타일', standard: '동서 타일', argen: '포세린', premium: '이탈리아 타일' },
          spaces: ['bathroom']
        },
        {
          항목명: '욕실 벽타일',
          규격: '300x600',
          단위: '㎡',
          수량계산: { 기준: '욕실개수', 계수: 12 },
          재료비: { basic: 28000, standard: 42000, argen: 60000, premium: 95000 },
          노무비: { basic: 32000, standard: 40000, argen: 52000, premium: 70000 },
          브랜드: { basic: '국산 타일', standard: '동서 타일', argen: '포세린', premium: '이탈리아 타일' },
          spaces: ['bathroom']
        },
        // 위생도기
        {
          항목명: '양변기',
          규격: '벽걸이형',
          단위: 'EA',
          수량계산: { 기준: '욕실개수', 계수: 1 },
          재료비: { basic: 150000, standard: 280000, argen: 450000, premium: 750000 },
          노무비: { basic: 80000, standard: 100000, argen: 130000, premium: 170000 },
          브랜드: { basic: '대림 바스', standard: '아메리칸스탠다드', argen: 'TOTO', premium: 'Duravit' },
          spaces: ['bathroom']
        },
        {
          항목명: '세면대',
          규격: '반다리형',
          단위: 'EA',
          수량계산: { 기준: '욕실개수', 계수: 1 },
          재료비: { basic: 120000, standard: 200000, argen: 350000, premium: 580000 },
          노무비: { basic: 60000, standard: 80000, argen: 100000, premium: 130000 },
          브랜드: { basic: '대림 바스', standard: '아메리칸스탠다드', argen: 'TOTO', premium: 'Duravit' },
          spaces: ['bathroom']
        },
        {
          항목명: '수전세트',
          규격: '세면+샤워',
          단위: '식',
          수량계산: { 기준: '욕실개수', 계수: 1 },
          재료비: { basic: 100000, standard: 180000, argen: 300000, premium: 500000 },
          노무비: { basic: 50000, standard: 70000, argen: 90000, premium: 120000 },
          브랜드: { basic: '대림 바스', standard: 'KCM', argen: 'Grohe', premium: 'Hansgrohe' },
          spaces: ['bathroom']
        },
        // 샤워부스 (조건부)
        {
          항목명: '샤워부스',
          규격: '강화유리',
          단위: 'EA',
          수량계산: { 기준: '욕실개수', 계수: 1 },
          재료비: { basic: 200000, standard: 320000, argen: 480000, premium: 750000 },
          노무비: { basic: 100000, standard: 130000, argen: 170000, premium: 220000 },
          브랜드: { basic: '국산 8T', standard: '국산 10T', argen: '수입 10T', premium: '프레임리스' },
          조건: { 욕실옵션: { 샤워부스: true } },
          spaces: ['bathroom']
        },
        // 비데 (조건부)
        {
          항목명: '비데',
          규격: '일체형',
          단위: 'EA',
          수량계산: { 기준: '욕실개수', 계수: 1 },
          재료비: { basic: 200000, standard: 350000, argen: 550000, premium: 900000 },
          노무비: { basic: 50000, standard: 70000, argen: 90000, premium: 120000 },
          브랜드: { basic: '노비타', standard: '청호', argen: 'TOTO', premium: 'Duravit SensoWash' },
          조건: { 욕실옵션: { 비데: true } },
          spaces: ['bathroom']
        },
        // 기타
        {
          항목명: '욕실 천장',
          규격: 'SMC/알루미늄',
          단위: 'EA',
          수량계산: { 기준: '욕실개수', 계수: 1 },
          재료비: { basic: 60000, standard: 90000, argen: 130000, premium: 200000 },
          노무비: { basic: 80000, standard: 100000, argen: 130000, premium: 170000 },
          브랜드: { basic: 'SMC', standard: '알루미늄', argen: '방습 프리미엄', premium: '수입 알루미늄' },
          spaces: ['bathroom']
        },
        {
          항목명: '욕실 조명',
          규격: 'LED',
          단위: 'EA',
          수량계산: { 기준: '욕실개수', 계수: 2 },
          재료비: { basic: 30000, standard: 50000, argen: 80000, premium: 130000 },
          노무비: { basic: 20000, standard: 30000, argen: 40000, premium: 55000 },
          브랜드: { basic: '국산 LED', standard: '필립스', argen: 'Luxte', premium: 'Philips Hue' },
          spaces: ['bathroom']
        },
        {
          항목명: '욕실 환풍기',
          규격: '천장형',
          단위: 'EA',
          수량계산: { 기준: '욕실개수', 계수: 1 },
          재료비: { basic: 35000, standard: 60000, argen: 100000, premium: 180000 },
          노무비: { basic: 30000, standard: 40000, argen: 55000, premium: 75000 },
          브랜드: { basic: '국산', standard: '한일', argen: 'Panasonic', premium: 'TOTO' },
          spaces: ['bathroom']
        },
        {
          항목명: '욕실문',
          규격: 'ABS',
          단위: 'EA',
          수량계산: { 기준: '욕실개수', 계수: 1 },
          재료비: { basic: 100000, standard: 160000, argen: 240000, premium: 380000 },
          노무비: { basic: 60000, standard: 80000, argen: 100000, premium: 130000 },
          브랜드: { basic: 'ABS 기본', standard: 'ABS 중급', argen: 'ABS 고급', premium: '강화유리' },
          spaces: ['bathroom']
        },
        // 방수
        {
          항목명: '욕실 방수',
          규격: '우레탄',
          단위: '식',
          수량계산: { 기준: '욕실개수', 계수: 1 },
          재료비: { basic: 150000, standard: 220000, argen: 320000, premium: 480000 },
          노무비: { basic: 100000, standard: 130000, argen: 170000, premium: 220000 },
          브랜드: { basic: '국산 우레탄', standard: '프리미엄 우레탄', argen: '수입 우레탄', premium: '독일 우레탄' },
          spaces: ['bathroom']
        },
        // 줄눈 (욕실에 포함)
        {
          항목명: '욕실 줄눈',
          규격: '고급 줄눈',
          단위: '㎡',
          수량계산: { 기준: '욕실개수', 계수: 16 },
          재료비: { basic: 4000, standard: 6000, argen: 9000, premium: 14000 },
          노무비: { basic: 6000, standard: 8000, argen: 11000, premium: 16000 },
          브랜드: { basic: '국산 줄눈', standard: '국산 프리미엄', argen: '수입 줄눈', premium: '독일 줄눈' },
          spaces: ['bathroom']
        }
      ]
    },

    // ============================================================
    // 목공 공사 (30평 기준: 300~800만원)
    // ============================================================
    목공: {
      항목: [
        {
          항목명: '붙박이장',
          규격: '2400*600*2400',
          단위: 'EA',
          수량계산: { 기준: '방개수', 계수: 1 },
          재료비: { basic: 600000, standard: 850000, argen: 1200000, premium: 1800000 },
          노무비: { basic: 180000, standard: 230000, argen: 300000, premium: 400000 },
          브랜드: { basic: '국산 PET', standard: 'KCC', argen: 'KCC + Hettich', premium: 'Blum 정품' },
          spaces: ['masterBedroom', 'kidsBedroom']
        },
        {
          항목명: '신발장',
          규격: '1200*400*2100',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 320000, standard: 450000, argen: 620000, premium: 900000 },
          노무비: { basic: 90000, standard: 110000, argen: 140000, premium: 180000 },
          브랜드: { basic: '국산 PET', standard: 'KCC', argen: 'KCC + Hettich', premium: 'Blum 정품' },
          spaces: ['entrance']
        },
        {
          항목명: '방문',
          규격: 'ABS 도어',
          단위: 'EA',
          수량계산: { 기준: '방개수', 계수: 1 },
          재료비: { basic: 180000, standard: 280000, argen: 400000, premium: 600000 },
          노무비: { basic: 70000, standard: 90000, argen: 110000, premium: 140000 },
          브랜드: { basic: 'ABS 기본', standard: 'ABS 중급', argen: 'ABS 고급', premium: '원목 도어' },
          spaces: ['common']
        },
        {
          항목명: '중문(슬라이딩)',
          규격: '2400*2100',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 350000, standard: 480000, argen: 680000, premium: 1000000 },
          노무비: { basic: 90000, standard: 110000, argen: 140000, premium: 180000 },
          브랜드: { basic: '국산 PVC', standard: '국산 프리미엄', argen: 'LG 하우시스', premium: '독일 시스템' },
          spaces: ['living']
        },
        {
          항목명: '몰딩',
          규격: '우레탄',
          단위: 'm',
          수량계산: { 기준: '평수', 계수: 1.2 },
          재료비: { basic: 6000, standard: 9000, argen: 14000, premium: 22000 },
          노무비: { basic: 4000, standard: 5500, argen: 7500, premium: 10000 },
          브랜드: { basic: '국산 우레탄', standard: '국산 프리미엄', argen: '수입 우레탄', premium: '목재 몰딩' },
          spaces: ['common']
        },
        {
          항목명: '걸레받이',
          규격: '합성수지',
          단위: 'm',
          수량계산: { 기준: '평수', 계수: 1.2 },
          재료비: { basic: 4000, standard: 6000, argen: 9000, premium: 14000 },
          노무비: { basic: 2500, standard: 3500, argen: 5000, premium: 7000 },
          브랜드: { basic: '국산 PVC', standard: '국산 프리미엄', argen: '수입 PVC', premium: '목재' },
          spaces: ['common']
        }
      ]
    },

    // ============================================================
    // 전기 공사 (30평 기준: 80~150만원)
    // ============================================================
    전기: {
      항목: [
        {
          항목명: '전기 배선 교체',
          규격: '2.5SQ',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 1.0 },
          재료비: { basic: 2500, standard: 3500, argen: 4500, premium: 6000 },
          노무비: { basic: 3500, standard: 4500, argen: 5500, premium: 7000 },
          브랜드: { basic: '국산 전선', standard: '국산 KS', argen: '국산 KS 프리미엄', premium: '수입 전선' },
          spaces: ['common']
        },
        {
          항목명: '조명기구',
          규격: 'LED 다운라이트',
          단위: 'EA',
          수량계산: { 기준: '평수', 계수: 0.5 },
          재료비: { basic: 25000, standard: 40000, argen: 60000, premium: 95000 },
          노무비: { basic: 12000, standard: 16000, argen: 22000, premium: 30000 },
          브랜드: { basic: '국산 LED', standard: '국산 프리미엄', argen: 'Luxte/IDS', premium: 'Philips Hue' },
          spaces: ['common']
        },
        {
          항목명: '스위치/콘센트',
          규격: '모듈러',
          단위: 'EA',
          수량계산: { 기준: '평수', 계수: 1.0 },
          재료비: { basic: 6000, standard: 10000, argen: 16000, premium: 28000 },
          노무비: { basic: 4000, standard: 6000, argen: 9000, premium: 13000 },
          브랜드: { basic: '국산 기본', standard: '나노 스위치', argen: '고급 모듈러', premium: 'ABB/Schneider' },
          spaces: ['common']
        },
        {
          항목명: '분전반 교체',
          규격: '18회로',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 120000, standard: 170000, argen: 250000, premium: 380000 },
          노무비: { basic: 80000, standard: 100000, argen: 130000, premium: 170000 },
          브랜드: { basic: 'LS산전', standard: 'LS산전 프리미엄', argen: 'ABB', premium: 'Schneider' },
          spaces: ['common']
        }
      ]
    },

    // ============================================================
    // 도배 공사 (30평 기준: 80~150만원)
    // ============================================================
    도배: {
      항목: [
        {
          항목명: '벽지(실크)',
          규격: '실크벽지',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 2.5 },
          재료비: { basic: 3000, standard: 4500, argen: 8000, premium: 14000 },
          노무비: { basic: 2500, standard: 3500, argen: 5500, premium: 8500 },
          브랜드: { basic: 'LG 합지', standard: 'LG 실크', argen: '개나리 프리미엄', premium: '수입 벽지' },
          spaces: ['common']
        },
        {
          항목명: '천장지(합지)',
          규격: '합지',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 1.0 },
          재료비: { basic: 2200, standard: 3200, argen: 5000, premium: 8000 },
          노무비: { basic: 2200, standard: 3000, argen: 5000, premium: 8000 },
          브랜드: { basic: 'LG 합지', standard: 'LG 프리미엄', argen: '개나리 합지', premium: '수입 합지' },
          spaces: ['common']
        }
      ]
    },

    // ============================================================
    // 타일 공사 (기타 공간)
    // ============================================================
    타일: {
      항목: [
        {
          항목명: '현관 바닥타일',
          규격: '600*600',
          단위: '㎡',
          수량계산: { 기준: '고정', 계수: 3 },
          재료비: { basic: 25000, standard: 38000, argen: 55000, premium: 85000 },
          노무비: { basic: 30000, standard: 38000, argen: 48000, premium: 65000 },
          브랜드: { basic: '국산 타일', standard: '국산 프리미엄', argen: '포세린 수입', premium: '이탈리아 타일' },
          spaces: ['entrance']
        },
        {
          항목명: '발코니 바닥타일',
          규격: '300*300',
          단위: '㎡',
          수량계산: { 기준: '고정', 계수: 5 },
          재료비: { basic: 15000, standard: 22000, argen: 32000, premium: 50000 },
          노무비: { basic: 18000, standard: 24000, argen: 32000, premium: 42000 },
          브랜드: { basic: '국산 타일', standard: '국산 프리미엄', argen: '포세린 수입', premium: '이탈리아 타일' },
          spaces: ['balcony']
        },
        {
          항목명: '현관/발코니 줄눈',
          규격: '고급 줄눈',
          단위: '㎡',
          수량계산: { 기준: '고정', 계수: 8 },
          재료비: { basic: 4000, standard: 6000, argen: 9000, premium: 14000 },
          노무비: { basic: 6000, standard: 8000, argen: 11000, premium: 16000 },
          브랜드: { basic: '국산 줄눈', standard: '국산 프리미엄', argen: '수입 줄눈', premium: '독일 줄눈' },
          spaces: ['entrance', 'balcony']  // 욕실 줄눈은 욕실 공정에 포함
        }
      ]
    },

    // ============================================================
    // 필름 공사
    // ============================================================
    필름: {
      항목: [
        {
          항목명: '중문 필름',
          규격: '인테리어 필름',
          단위: '㎡',
          수량계산: { 기준: '고정', 계수: 5 },
          재료비: { basic: 12000, standard: 18000, argen: 28000, premium: 45000 },
          노무비: { basic: 15000, standard: 20000, argen: 28000, premium: 38000 },
          브랜드: { basic: '국산 필름', standard: '국산 프리미엄', argen: '3M 필름', premium: '수입 필름' },
          spaces: ['common']
        },
        {
          항목명: '가구 필름',
          규격: '인테리어 필름',
          단위: '㎡',
          수량계산: { 기준: '방개수', 계수: 2.5 },
          재료비: { basic: 10000, standard: 15000, argen: 24000, premium: 40000 },
          노무비: { basic: 12000, standard: 17000, argen: 24000, premium: 32000 },
          브랜드: { basic: '국산 필름', standard: '국산 프리미엄', argen: '3M 필름', premium: '수입 필름' },
          spaces: ['common']
        }
      ]
    },

    // ============================================================
    // 기타 공사 (관리비, 청소 등)
    // ============================================================
    기타: {
      항목: [
        {
          항목명: '바닥 보양',
          규격: '-',
          단위: '식',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 150000, standard: 200000, argen: 280000, premium: 400000 },
          노무비: { basic: 100000, standard: 130000, argen: 180000, premium: 250000 },
          브랜드: { basic: '일반 보양', standard: '프리미엄 보양', argen: '고급 보양', premium: '특수 보양' },
          spaces: ['common']
        },
        {
          항목명: '준공청소',
          규격: '-',
          단위: '식',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 100000, standard: 150000, argen: 220000, premium: 350000 },
          노무비: { basic: 150000, standard: 200000, argen: 280000, premium: 400000 },
          브랜드: { basic: '일반 청소', standard: '전문 청소', argen: '프리미엄 청소', premium: '특수 청소' },
          spaces: ['common']
        },
        {
          항목명: '현장관리비',
          규격: '-',
          단위: '식',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 0, standard: 0, argen: 0, premium: 0 },
          노무비: { basic: 300000, standard: 400000, argen: 550000, premium: 800000 },
          브랜드: { basic: '기본 관리', standard: '전문 관리', argen: '프리미엄 관리', premium: '최고급 관리' },
          spaces: ['common']
        },
        {
          항목명: '소운반',
          규격: '-',
          단위: '식',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 0, standard: 0, argen: 0, premium: 0 },
          노무비: { basic: 100000, standard: 150000, argen: 200000, premium: 300000 },
          브랜드: { basic: '일반 운반', standard: '전문 운반', argen: '프리미엄 운반', premium: '특수 운반' },
          spaces: ['common']
        }
      ]
    },

    // ============================================================
    // 철거 (30평 기준: 80~200만원)
    // ============================================================
    철거: {
      항목: [
        {
          항목명: '전체 철거',
          규격: '-',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 3.3 },
          재료비: { basic: 0, standard: 0, argen: 0, premium: 0 },
          노무비: { basic: 8000, standard: 10000, argen: 13000, premium: 18000 },
          브랜드: { basic: '일반 철거', standard: '전문 철거', argen: '무브팀 전문', premium: '프리미엄 철거' },
          spaces: ['common']
        },
        {
          항목명: '폐기물 처리',
          규격: '-',
          단위: '식',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 300000, standard: 400000, argen: 550000, premium: 750000 },
          노무비: { basic: 150000, standard: 200000, argen: 280000, premium: 380000 },
          브랜드: { basic: '일반 처리', standard: '전문 처리', argen: '친환경 처리', premium: '특수 처리' },
          spaces: ['common']
        }
      ]
    }
  }
}
