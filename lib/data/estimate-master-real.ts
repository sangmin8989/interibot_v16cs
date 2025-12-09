/**
 * 실제 견적서 기반 마스터 데이터
 * 30평 5,960만원 견적 기준
 */

export interface MasterItem {
  항목명: string
  규격?: string
  단위: string
  수량계산?: {
    기준: '평수' | '방개수' | '욕실개수' | '고정'
    계수: number
    최소?: number
    최대?: number
  }
  재료비: {
    basic: number
    standard: number
    argen: number
    premium: number
  }
  노무비: {
    basic: number
    standard: number
    argen: number
    premium: number
  }
  브랜드: {
    basic: string
    standard: string
    argen: string
    premium: string
  }
  조건?: any
  작업정보?: {
    작업인원: number
    작업기간단위: string
    작업기간계산: string
    설명: string
  }
  spaces?: string[]  // 공간별 필터링을 위한 필드 (없거나 빈 배열이면 ["common"]으로 간주)
}

export const realMasterData = {
  categories: {
    // 100: 주방/다용도실 공사
    주방: {
      항목: [
        {
          항목명: '주방가구 시공 (상부장+하부장+상판)',
          규격: '6000*900',
          단위: '식',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 4450000, standard: 5200000, argen: 6300000, premium: 8400000 },  // 상부장+하부장+상판 합계
          노무비: { basic: 1050000, standard: 1200000, argen: 1350000, premium: 1650000 },  // 가구 시공 노무비 통합
          브랜드: { basic: '국산 PET', standard: '한샘 기본', argen: '한샘 키친바흐', premium: '독일 시스템' },
          spaces: ['kitchen']
        },
        {
          항목명: '주방 설비 패키지 (싱크볼+수전)',
          규격: 'SUS304',
          단위: '식',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 230000, standard: 320000, argen: 460000, premium: 700000 },  // 싱크볼+수전
          노무비: { basic: 90000, standard: 110000, argen: 130000, premium: 160000 },  // 설비 설치 노무비
          브랜드: { basic: '국산 SUS304', standard: '국산 프리미엄', argen: '수입 SUS304', premium: '독일 Blanco' },
          spaces: ['kitchen']
        },
        {
          항목명: '후드',
          규격: '900mm',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 200000, standard: 300000, argen: 450000, premium: 700000 },
          노무비: { basic: 0, standard: 0, argen: 0, premium: 0 },  // 자재만
          브랜드: { basic: '국산 후드', standard: '하츠 매입형', argen: '하츠 프리미엄', premium: '독일 Miele' },
          spaces: ['kitchen']
        },
        {
          항목명: '가스레인지',
          규격: '3구',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 250000, standard: 350000, argen: 500000, premium: 800000 },
          노무비: { basic: 0, standard: 0, argen: 0, premium: 0 },  // 자재만
          브랜드: { basic: '국산 3구', standard: '린나이', argen: '린나이 프리미엄', premium: '독일 Miele' },
          spaces: ['kitchen']
        },
        {
          항목명: '식기세척기',
          규격: '빌트인',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 0, standard: 600000, argen: 900000, premium: 1500000 },
          노무비: { basic: 0, standard: 0, argen: 0, premium: 0 },  // 자재만
          브랜드: { basic: '-', standard: 'LG', argen: 'LG 프리미엄', premium: 'Bosch' },
          spaces: ['kitchen']
        },
        {
          항목명: '냉장고장',
          규격: '800*600*2100',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 400000, standard: 550000, argen: 750000, premium: 1200000 },
          노무비: { basic: 0, standard: 0, argen: 0, premium: 0 },  // 주방가구 시공에 포함
          브랜드: { basic: '국산 PET', standard: '한샘', argen: '한샘 프리미엄', premium: '맞춤 제작' },
          spaces: ['kitchen']
        },
        {
          항목명: '키큰장',
          규격: '600*600*2100',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 350000, standard: 480000, argen: 650000, premium: 1000000 },
          노무비: { basic: 0, standard: 0, argen: 0, premium: 0 },  // 주방가구 시공에 포함
          브랜드: { basic: '국산 PET', standard: '한샘', argen: '한샘 프리미엄', premium: '맞춤 제작' },
          spaces: ['kitchen']
        },
        {
          항목명: '주방 벽 타일 시공',
          규격: '300*600 포세린',
          단위: '식',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 100000, standard: 140000, argen: 200000, premium: 325000 },  // 5㎡ 자재비
          노무비: { basic: 125000, standard: 150000, argen: 190000, premium: 250000 },  // 5㎡ 노무비
          브랜드: { basic: 'KCC 기본 포세린', standard: 'LX 하우시스 프리미엄', argen: 'Argen Premium 포세린', premium: 'Marazzi/Emilgroup (이탈리아)' },
          spaces: ['kitchen']
        },
        {
          항목명: '주방 설비 설치',
          규격: '후드·레인지·식세기 연결',
          단위: '식',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 0, standard: 0, argen: 0, premium: 0 },
          노무비: { basic: 350000, standard: 350000, argen: 350000, premium: 350000 },  // 설비 설치 노무비
          브랜드: { basic: '설비 설치', standard: '설비 설치', argen: '설비 설치', premium: '설비 설치' },
          spaces: ['kitchen']
        },
        {
          항목명: '다용도실 상부장',
          규격: '1200*600*600',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 200000, standard: 280000, argen: 380000, premium: 550000 },
          노무비: { basic: 50000, standard: 60000, argen: 80000, premium: 100000 },
          브랜드: { basic: '국산 PET', standard: '한샘', argen: '한샘 프리미엄', premium: '맞춤 제작' },
          spaces: ['utility']
        },
        {
          항목명: '다용도실 하부장',
          규격: '1200*600*800',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 250000, standard: 350000, argen: 480000, premium: 700000 },
          노무비: { basic: 60000, standard: 80000, argen: 100000, premium: 120000 },
          브랜드: { basic: '국산 PET', standard: '한샘', argen: '한샘 프리미엄', premium: '맞춤 제작' },
          spaces: ['utility']
        },
        {
          항목명: '벽타일',
          규격: '300*600',
          단위: '㎡',
          수량계산: { 기준: '고정', 계수: 8 },
          재료비: { basic: 25000, standard: 35000, argen: 50000, premium: 80000 },
          노무비: { basic: 20000, standard: 25000, argen: 30000, premium: 40000 },
          브랜드: { basic: '국산 타일', standard: '국산 프리미엄', argen: '수입 타일', premium: '이탈리아 타일' },
          spaces: ['kitchen']
        },
        {
          항목명: '주방 철거',
          규격: '-',
          단위: '식',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 0, standard: 0, argen: 0, premium: 0 },
          노무비: { basic: 300000, standard: 350000, argen: 400000, premium: 500000 },
          브랜드: { basic: '일반 철거', standard: '전문 철거', argen: '전문 철거팀', premium: '프리미엄 철거' },
          spaces: ['kitchen']
        }
      ]
    },

    // 200: 목공/가구 공사
    목공: {
      항목: [
        {
          항목명: '붙박이장',
          규격: '2400*600*2400',
          단위: 'EA',
          수량계산: { 기준: '방개수', 계수: 1 },
          재료비: { basic: 800000, standard: 1100000, argen: 1500000, premium: 2200000 },
          노무비: { basic: 200000, standard: 250000, argen: 300000, premium: 400000 },
          브랜드: { basic: '국산 PET', standard: 'KCC', argen: 'KCC + Hettich', premium: 'Blum 정품' },
          spaces: ['masterBedroom', 'kidsBedroom']
        },
        {
          항목명: '신발장',
          규격: '1200*400*2100',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 400000, standard: 550000, argen: 750000, premium: 1100000 },
          노무비: { basic: 100000, standard: 120000, argen: 150000, premium: 200000 },
          브랜드: { basic: '국산 PET', standard: 'KCC', argen: 'KCC + Hettich', premium: 'Blum 정품' },
          spaces: ['entrance']
        },
        {
          항목명: 'TV장',
          규격: '2400*400*600',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 500000, standard: 700000, argen: 950000, premium: 1400000 },
          노무비: { basic: 120000, standard: 150000, argen: 180000, premium: 250000 },
          브랜드: { basic: '국산 PET', standard: 'KCC', argen: 'KCC + Hettich', premium: 'Blum 정품' },
          spaces: ['living']
        },
        {
          항목명: '드레스룸',
          규격: '3600*600*2400',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 0.5 },
          재료비: { basic: 1200000, standard: 1650000, argen: 2250000, premium: 3300000 },
          노무비: { basic: 300000, standard: 380000, argen: 450000, premium: 600000 },
          브랜드: { basic: '국산 PET', standard: 'KCC', argen: 'KCC + Hettich', premium: 'Blum 정품' },
          spaces: ['dressRoom']
        },
        {
          항목명: '화장대',
          규격: '1200*500*750',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 350000, standard: 480000, argen: 650000, premium: 950000 },
          노무비: { basic: 80000, standard: 100000, argen: 120000, premium: 150000 },
          브랜드: { basic: '국산 PET', standard: 'KCC', argen: 'KCC + Hettich', premium: 'Blum 정품' },
          spaces: ['masterBedroom']
        },
        {
          항목명: '책상',
          규격: '1800*600*750',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 0.5 },
          재료비: { basic: 300000, standard: 420000, argen: 570000, premium: 850000 },
          노무비: { basic: 70000, standard: 90000, argen: 110000, premium: 140000 },
          브랜드: { basic: '국산 PET', standard: 'KCC', argen: 'KCC + Hettich', premium: 'Blum 정품' },
          spaces: ['kidsBedroom', 'dressRoom']
        },
        {
          항목명: '방문',
          규격: 'ABS 도어',
          단위: 'EA',
          수량계산: { 기준: '방개수', 계수: 1 },
          재료비: { basic: 250000, standard: 350000, argen: 480000, premium: 750000 },
          노무비: { basic: 80000, standard: 100000, argen: 120000, premium: 150000 },
          브랜드: { basic: 'ABS 기본', standard: 'ABS 중급', argen: 'ABS 고급', premium: '원목 도어' },
          spaces: ['masterBedroom', 'kidsBedroom']
        },
        {
          항목명: '중문(슬라이딩)',
          규격: '2400*2100',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 400000, standard: 550000, argen: 750000, premium: 1200000 },
          노무비: { basic: 100000, standard: 120000, argen: 150000, premium: 200000 },
          브랜드: { basic: '국산 PVC', standard: '국산 프리미엄', argen: 'LG 하우시스', premium: '독일 시스템' },
          spaces: ['living']
        },
        {
          항목명: '몰딩',
          규격: '우레탄 몰딩',
          단위: 'm',
          수량계산: { 기준: '평수', 계수: 1.4 },
          재료비: { basic: 8000, standard: 12000, argen: 18000, premium: 28000 },
          노무비: { basic: 5000, standard: 6000, argen: 8000, premium: 10000 },
          브랜드: { basic: '국산 우레탄', standard: '국산 프리미엄', argen: '수입 우레탄', premium: '목재 몰딩' },
          spaces: ['common']
        },
        {
          항목명: '걸레받이',
          규격: '합성수지',
          단위: 'm',
          수량계산: { 기준: '평수', 계수: 1.4 },
          재료비: { basic: 5000, standard: 7000, argen: 10000, premium: 15000 },
          노무비: { basic: 3000, standard: 4000, argen: 5000, premium: 7000 },
          브랜드: { basic: '국산 PVC', standard: '국산 프리미엄', argen: '수입 PVC', premium: '목재' },
          spaces: ['common']
        }
      ]
    },

    // 300: 전기 공사
    전기: {
      항목: [
        {
          항목명: '전기 배선 교체',
          규격: '2.5SQ',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 3.3 },
          재료비: { basic: 8000, standard: 10000, argen: 12000, premium: 15000 },
          노무비: { basic: 12000, standard: 15000, argen: 18000, premium: 22000 },
          브랜드: { basic: '국산 전선', standard: '국산 KS', argen: '국산 KS + ABB', premium: 'ABB 정품' },
          spaces: ['common']
        },
        {
          항목명: '조명기구',
          규격: 'LED 다운라이트',
          단위: 'EA',
          수량계산: { 기준: '평수', 계수: 0.6 },
          재료비: { basic: 30000, standard: 45000, argen: 65000, premium: 100000 },
          노무비: { basic: 15000, standard: 20000, argen: 25000, premium: 30000 },
          브랜드: { basic: '국산 LED', standard: '국산 프리미엄', argen: 'Luxte/IDS', premium: 'Philips Hue' },
          spaces: ['common']
        },
        {
          항목명: '스위치/콘센트',
          규격: '모듈러',
          단위: 'EA',
          수량계산: { 기준: '평수', 계수: 1.2 },
          재료비: { basic: 8000, standard: 12000, argen: 18000, premium: 30000 },
          노무비: { basic: 5000, standard: 7000, argen: 10000, premium: 15000 },
          브랜드: { basic: '국산 기본', standard: '나노 스위치', argen: '고급 모듈러', premium: 'ABB/Schneider' },
          spaces: ['common']
        },
        {
          항목명: '분전반 교체',
          규격: '18회로',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 150000, standard: 200000, argen: 280000, premium: 400000 },
          노무비: { basic: 100000, standard: 120000, argen: 150000, premium: 200000 },
          브랜드: { basic: 'LS산전', standard: 'LS산전 프리미엄', argen: 'ABB', premium: 'Schneider' },
          spaces: ['common']
        },
        {
          항목명: '인덕션 전용회로',
          규격: '6SQ',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 80000, standard: 100000, argen: 130000, premium: 180000 },
          노무비: { basic: 50000, standard: 60000, argen: 80000, premium: 100000 },
          브랜드: { basic: '국산 전선', standard: '국산 KS', argen: '국산 KS 프리미엄', premium: '수입 전선' },
          spaces: ['kitchen']
        }
      ]
    },

    // 400: 욕실 공사
    욕실: {
      항목: [
        {
          항목명: '욕실 철거 + 폐기물 처리',
          규격: '욕실당',
          단위: 'EA',
          수량계산: { 기준: '욕실개수', 계수: 1 },
          재료비: { basic: 150000, standard: 180000, argen: 200000, premium: 250000 },
          노무비: { basic: 300000, standard: 300000, argen: 300000, premium: 300000 },
          브랜드: { basic: '욕실 철거 + 폐기물', standard: '욕실 철거 + 폐기물', argen: '욕실 철거 + 폐기물', premium: '욕실 철거 + 폐기물' },
          조건: { 철거공정없음: true },
          작업정보: {
            작업인원: 2,
            작업기간단위: '일',
            작업기간계산: '욕실개수',
            설명: '2인 1조가 욕실 1개를 1일 동안 철거'
          },
          spaces: ['bathroom']
        },
        {
          항목명: '방수',
          규격: '3회 방수',
          단위: 'EA',
          수량계산: { 기준: '욕실개수', 계수: 1 },
          재료비: { basic: 150000, standard: 200000, argen: 280000, premium: 400000 },
          노무비: { basic: 150000, standard: 180000, argen: 220000, premium: 300000 },
          브랜드: { basic: '국산 방수', standard: '국산 프리미엄', argen: 'KCC 방수', premium: '수입 방수' },
          spaces: ['bathroom']
        },
        {
          항목명: '타일 시공 (2인 1조)',
          규격: '바닥+벽 포세린',
          단위: '식',
          수량계산: { 기준: '욕실개수', 계수: 1 },
          재료비: { basic: 288000, standard: 368000, argen: 512000, premium: 640000 },  // (4+12)㎡ × 단가
          노무비: { basic: 800000, standard: 800000, argen: 800000, premium: 800000 },  // 16㎡÷12㎡=1.33일→2일 × 600,000
          브랜드: { basic: 'BASIC 포세린', standard: 'STANDARD 포세린', argen: 'Argen Premium', premium: 'HIGH-END 수입' },
          작업정보: {
            작업인원: 2,
            작업기간단위: '일',
            작업기간계산: '타일면적',
            설명: '기공 1명(350,000원) + 조공 1명(250,000원) / 1일 시공량 12㎡'
          },
          spaces: ['bathroom']
        },
        {
          항목명: '설비·마감 패키지',
          규격: '변기·세면대·수전·악세서리·실리콘',
          단위: 'EA',
          수량계산: { 기준: '욕실개수', 계수: 1 },
          재료비: { basic: 380000, standard: 625000, argen: 950000, premium: 1130000 },
          노무비: { basic: 350000, standard: 350000, argen: 350000, premium: 350000 },
          브랜드: { basic: 'BASIC 패키지', standard: 'STANDARD 패키지', argen: 'Argen Premium', premium: 'HIGH-END 패키지' },
          spaces: ['bathroom']
        },
        {
          항목명: '욕실 천장',
          규격: '천장 마감재',
          단위: 'EA',
          수량계산: { 기준: '욕실개수', 계수: 1 },
          재료비: { basic: 72000, standard: 100000, argen: 128000, premium: 160000 },  // 4㎡ × 단가
          노무비: { basic: 250000, standard: 250000, argen: 250000, premium: 250000 },
          브랜드: { basic: 'BASIC PVC (LX)', standard: 'STANDARD 알루미늄 (KCC)', argen: 'Argen 방습 프리미엄', premium: 'HIGH-END 수입 알루미늄' },
          spaces: ['bathroom']
        },
        {
          항목명: '샤워부스 강화유리',
          규격: '800*800',
          단위: 'EA',
          수량계산: { 기준: '욕실개수', 계수: 0.5 },
          재료비: { basic: 260000, standard: 310000, argen: 380000, premium: 430000 },
          노무비: { basic: 250000, standard: 250000, argen: 250000, premium: 250000 },
          브랜드: { basic: 'BASIC 8T 투명', standard: 'STANDARD 10T 브론즈', argen: 'Argen Premium 10T', premium: 'HIGH-END 수입 10T' },
          spaces: ['bathroom']
        }
      ]
    },

    // 500: 타일 공사 (욕실 타일은 욕실 공정에 포함됨)
    타일: {
      항목: [
        {
          항목명: '현관 바닥타일',
          규격: '600*600',
          단위: '㎡',
          수량계산: { 기준: '고정', 계수: 3 },
          재료비: { basic: 30000, standard: 42000, argen: 60000, premium: 95000 },
          노무비: { basic: 35000, standard: 40000, argen: 50000, premium: 65000 },
          브랜드: { basic: '국산 타일', standard: '국산 프리미엄', argen: '포세린 수입', premium: '이탈리아 타일' },
          spaces: ['entrance']
        },
        {
          항목명: '발코니 바닥타일',
          규격: '300*300',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 0.2 },
          재료비: { basic: 18000, standard: 25000, argen: 35000, premium: 55000 },
          노무비: { basic: 22000, standard: 28000, argen: 35000, premium: 45000 },
          브랜드: { basic: '국산 타일', standard: '국산 프리미엄', argen: '포세린 수입', premium: '이탈리아 타일' },
          spaces: ['balcony']
        },
        {
          항목명: '줄눈',
          규격: '고급 줄눈',
          단위: '㎡',
          수량계산: { 기준: '욕실개수', 계수: 16 },
          재료비: { basic: 5000, standard: 7000, argen: 10000, premium: 15000 },
          노무비: { basic: 8000, standard: 10000, argen: 13000, premium: 18000 },
          브랜드: { basic: '국산 줄눈', standard: '국산 프리미엄', argen: '수입 줄눈', premium: '독일 줄눈' },
          spaces: ['bathroom', 'entrance', 'balcony']
        }
      ]
    },

    // 600: 도장 공사
    도장: {
      항목: [
        {
          항목명: '천장 도장',
          규격: '수성페인트',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 3.3 },
          재료비: { basic: 3000, standard: 4500, argen: 6500, premium: 10000 },
          노무비: { basic: 5000, standard: 6500, argen: 8500, premium: 12000 },
          브랜드: { basic: '국산 수성', standard: 'KCC', argen: '벤자민무어', premium: 'Farrow&Ball' },
          spaces: ['common']
        },
        {
          항목명: '벽체 도장',
          규격: '수성페인트',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 1.0 },
          재료비: { basic: 3500, standard: 5000, argen: 7000, premium: 11000 },
          노무비: { basic: 5500, standard: 7000, argen: 9000, premium: 13000 },
          브랜드: { basic: '국산 수성', standard: 'KCC', argen: '벤자민무어', premium: 'Farrow&Ball' },
          spaces: ['common']
        },
        {
          항목명: '목재 도장',
          규격: '유성페인트',
          단위: 'm',
          수량계산: { 기준: '평수', 계수: 1.4 },
          재료비: { basic: 5000, standard: 7000, argen: 10000, premium: 15000 },
          노무비: { basic: 8000, standard: 10000, argen: 13000, premium: 18000 },
          브랜드: { basic: '국산 유성', standard: 'KCC', argen: '던에드워드', premium: 'Farrow&Ball' },
          spaces: ['common']
        }
      ]
    },

    // 700: 필름 공사
    필름: {
      항목: [
        {
          항목명: '중문 필름',
          규격: '인테리어 필름',
          단위: '㎡',
          수량계산: { 기준: '고정', 계수: 5 },
          재료비: { basic: 15000, standard: 22000, argen: 32000, premium: 50000 },
          노무비: { basic: 18000, standard: 23000, argen: 30000, premium: 40000 },
          브랜드: { basic: '국산 필름', standard: '국산 프리미엄', argen: '3M 필름', premium: '수입 필름' },
          spaces: ['common']
        },
        {
          항목명: '가구 필름',
          규격: '인테리어 필름',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 0.3 },
          재료비: { basic: 12000, standard: 18000, argen: 26000, premium: 42000 },
          노무비: { basic: 15000, standard: 20000, argen: 26000, premium: 35000 },
          브랜드: { basic: '국산 필름', standard: '국산 프리미엄', argen: '3M 필름', premium: '수입 필름' },
          spaces: ['common']
        }
      ]
    },

    // 800: 샤시/중문 공사
    창호: {
      항목: [
        {
          항목명: '발코니 샤시',
          규격: '3중 유리',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 0.4 },
          재료비: { basic: 180000, standard: 250000, argen: 350000, premium: 550000 },
          노무비: { basic: 70000, standard: 90000, argen: 120000, premium: 170000 },
          브랜드: { basic: '국산 PVC', standard: 'LG 하우시스', argen: 'KCC System', premium: '독일 시스템' },
          spaces: ['balcony']
        },
        {
          항목명: '중문(여닫이)',
          규격: '슬라이딩',
          단위: 'EA',
          수량계산: { 기준: '고정', 계수: 2 },
          재료비: { basic: 350000, standard: 480000, argen: 650000, premium: 1000000 },
          노무비: { basic: 100000, standard: 120000, argen: 150000, premium: 200000 },
          브랜드: { basic: '국산 PVC', standard: 'LG 하우시스', argen: 'LX Z:IN', premium: '독일 시스템' },
          spaces: ['living']
        }
      ]
    },

    // 900: 도배 공사
    도배: {
      항목: [
        {
          항목명: '벽지(실크)',
          규격: '실크벽지',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 2.5 },  // 6.0 → 2.5 (벽면적 계수 수정)
          재료비: { basic: 3500, standard: 5000, argen: 9000, premium: 15000 },  // 시장 기준 단가 적용
          노무비: { basic: 3000, standard: 4000, argen: 6000, premium: 9000 },    // 시장 기준 단가 적용
          브랜드: { basic: 'LG 합지', standard: 'LG 실크', argen: '개나리 프리미엄', premium: '수입 벽지' },
          spaces: ['common']
        },
        {
          항목명: '천장지(합지)',
          규격: '합지',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 1.0 },  // 3.3 → 1.0 (천장면적 계수 수정)
          재료비: { basic: 2500, standard: 3500, argen: 5500, premium: 8500 },    // 시장 기준 단가 적용
          노무비: { basic: 2500, standard: 3500, argen: 5500, premium: 8500 },    // 시장 기준 단가 적용
          브랜드: { basic: 'LG 합지', standard: 'LG 프리미엄', argen: '개나리 합지', premium: '수입 합지' },
          spaces: ['common']
        }
      ]
    },

    // 1000: 기타 공사
    기타: {
      항목: [
        {
          항목명: '철거 및 폐기물',
          규격: '-',
          단위: '식',
          수량계산: { 기준: '평수', 계수: 0.033 },
          재료비: { basic: 0, standard: 0, argen: 0, premium: 0 },
          노무비: { basic: 800000, standard: 950000, argen: 1100000, premium: 1400000 },
          브랜드: { basic: '일반 철거', standard: '전문 철거', argen: '무브팀 전문', premium: '프리미엄 철거' },
          spaces: ['common']
        },
        {
          항목명: '바닥 보양',
          규격: '-',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 3.3 },
          재료비: { basic: 2000, standard: 3000, argen: 4000, premium: 6000 },
          노무비: { basic: 1500, standard: 2000, argen: 2500, premium: 3500 },
          브랜드: { basic: '일반 보양', standard: '프리미엄 보양', argen: '고급 보양', premium: '특수 보양' },
          spaces: ['common']
        },
        {
          항목명: '준공청소',
          규격: '-',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 3.3 },
          재료비: { basic: 3000, standard: 4000, argen: 5500, premium: 8000 },
          노무비: { basic: 5000, standard: 6500, argen: 8500, premium: 12000 },
          브랜드: { basic: '일반 청소', standard: '전문 청소', argen: '프리미엄 청소', premium: '특수 청소' },
          spaces: ['common']
        },
        {
          항목명: '현장관리비',
          규격: '-',
          단위: '식',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 0, standard: 0, argen: 0, premium: 0 },
          노무비: { basic: 1500000, standard: 1800000, argen: 2200000, premium: 3000000 },
          브랜드: { basic: '기본 관리', standard: '전문 관리', argen: '프리미엄 관리', premium: '최고급 관리' },
          spaces: ['common']
        },
        {
          항목명: '소운반',
          규격: '-',
          단위: '식',
          수량계산: { 기준: '고정', 계수: 1 },
          재료비: { basic: 0, standard: 0, argen: 0, premium: 0 },
          노무비: { basic: 300000, standard: 400000, argen: 500000, premium: 700000 },
          브랜드: { basic: '일반 운반', standard: '전문 운반', argen: '프리미엄 운반', premium: '특수 운반' },
          spaces: ['common']
        }
      ]
    },

    // 철거 (별도 분류)
    철거: {
      항목: [
        {
          항목명: '전체 철거 + 폐기물 처리',
          규격: '-',
          단위: '㎡',
          수량계산: { 기준: '평수', 계수: 3.3 },
          재료비: { basic: 0, standard: 0, argen: 0, premium: 0 },
          노무비: { basic: 15000, standard: 18000, argen: 22000, premium: 28000 },
          브랜드: { basic: '일반 철거', standard: '전문 철거', argen: '무브팀 전문', premium: '프리미엄 철거' },
          spaces: ['common']
        },
        {
          항목명: '폐기물 처리비용',
          규격: '-',
          단위: '식',
          수량계산: { 기준: '평수', 계수: 0.033 },
          재료비: { basic: 800000, standard: 950000, argen: 1100000, premium: 1400000 },
          노무비: { basic: 200000, standard: 250000, argen: 300000, premium: 400000 },
          브랜드: { basic: '폐기물 처리비용', standard: '폐기물 처리비용', argen: '폐기물 처리비용', premium: '폐기물 처리비용' },
          spaces: ['common']
        }
      ]
    }
  }
}






