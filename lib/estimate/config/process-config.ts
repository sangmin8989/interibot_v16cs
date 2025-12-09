/**
 * 🔧 인테리봇 공정 설정 파일
 * 
 * ============================================================
 * 📌 이 파일만 수정하면 전체 시스템에 자동 반영됩니다!
 * ============================================================
 * 
 * 추가 방법:
 * 1. 새 공정 추가: PROCESS_CONFIG에 새 항목 추가
 * 2. 새 옵션 추가: 해당 공정의 options에 추가
 * 3. 가격 추가: PRICE_CONFIG에서 해당 공정 가격 추가
 * 
 * 수정 후 자동 적용:
 * - 타입 자동 생성
 * - 견적 계산 자동 반영
 * - UI 옵션 자동 표시 (연동 시)
 */

// ============================================================
// 공정 설정 (PROCESS_CONFIG)
// ============================================================

export const PROCESS_CONFIG = {
  // ============================================================
  // 1. 주방 공정
  // ============================================================
  주방: {
    code: '100',
    name: '주방',
    description: '주방 가구 및 설비 공사',
    spaces: ['kitchen', 'utility'],
    
    // 옵션 정의
    options: {
      형태: {
        type: 'select',
        label: '주방 형태',
        values: ['일자', 'ㄱ자', 'ㄷ자', '아일랜드', 'ㄱ자+아일랜드'] as const,
        default: '일자',
        priceMultiplier: { '일자': 1.0, 'ㄱ자': 1.15, 'ㄷ자': 1.35, '아일랜드': 1.5, 'ㄱ자+아일랜드': 1.7 }
      },
      상판재질: {
        type: 'select',
        label: '상판 재질',
        values: ['인조대리석', '엔지니어드스톤', '세라믹', '천연대리석', '스테인리스'] as const,
        default: '엔지니어드스톤'
      },
      냉장고장: { type: 'boolean', label: '냉장고장', default: false },
      키큰장: { type: 'boolean', label: '키큰장', default: false },
      아일랜드장: { type: 'boolean', label: '아일랜드장', default: false },
      팬트리: { type: 'boolean', label: '팬트리', default: false },
      다용도실상부장: { type: 'boolean', label: '다용도실 상부장', default: false },
      다용도실하부장: { type: 'boolean', label: '다용도실 하부장', default: false },
      상부장LED: { type: 'boolean', label: '상부장 LED', default: false },
      하부장LED: { type: 'boolean', label: '하부장 LED', default: false },
      
      // 정수기 옵션 (신규)
      정수기설치: { type: 'boolean', label: '정수기 설치 공간', default: false },
      정수기타입: {
        type: 'select',
        label: '정수기 타입',
        values: ['빌트인(싱크대하부)', '언더싱크', '별도공간(키큰장내)', '냉온정수기공간'] as const,
        default: '빌트인(싱크대하부)',
        dependsOn: { 정수기설치: true }
      },
      정수기배관: { 
        type: 'boolean', 
        label: '정수기 전용 배관', 
        default: false,
        dependsOn: { 정수기설치: true }
      },
      
      // 설비 (중첩 옵션)
      설비: {
        type: 'group',
        label: '주방 설비',
        children: {
          후드: {
            type: 'select',
            label: '후드',
            values: ['기본', '매입형', '천장매입', '아일랜드형'] as const,
            default: '기본'
          },
          쿡탑: {
            type: 'select',
            label: '쿡탑',
            values: ['가스레인지', '인덕션', '하이브리드'] as const,
            default: '가스레인지'
          },
          식기세척기: { type: 'boolean', label: '식기세척기', default: false },
          빌트인오븐: { type: 'boolean', label: '빌트인 오븐', default: false },
          빌트인정수기: { type: 'boolean', label: '빌트인 정수기', default: false },
        }
      }
    }
  },

  // ============================================================
  // 2. 욕실 공정
  // ============================================================
  욕실: {
    code: '400',
    name: '욕실',
    description: '욕실 시설 및 수전 공사',
    spaces: ['bathroom'],
    
    options: {
      스타일: {
        type: 'select',
        label: '욕실 스타일',
        values: ['모던', '클래식', '미니멀', '내추럴', '호텔식'] as const,
        default: '모던'
      },
      벽타일사이즈: {
        type: 'select',
        label: '벽 타일 사이즈',
        values: ['소형(300x300)', '중형(600x600)', '대형(800x800)', '대판(1200x600)'] as const,
        default: '중형(600x600)'
      },
      바닥타일사이즈: {
        type: 'select',
        label: '바닥 타일 사이즈',
        values: ['소형(300x300)', '중형(600x600)'] as const,
        default: '소형(300x300)'
      },
      양변기등급: {
        type: 'select',
        label: '양변기 등급',
        values: ['기본', '중급', '고급', '프리미엄'] as const,
        default: '기본'
      },
      세면대등급: {
        type: 'select',
        label: '세면대 등급',
        values: ['기본', '중급', '고급'] as const,
        default: '기본'
      },
      욕조: { type: 'boolean', label: '욕조', default: false },
      욕조타입: {
        type: 'select',
        label: '욕조 타입',
        values: ['일반', '반신욕', '자쿠지'] as const,
        default: '일반',
        dependsOn: { 욕조: true }  // 욕조 선택 시에만 표시
      },
      샤워부스: { type: 'boolean', label: '샤워부스', default: true },
      샤워부스타입: {
        type: 'select',
        label: '샤워부스 타입',
        values: ['일반', '레인샤워', '월풀'] as const,
        default: '일반',
        dependsOn: { 샤워부스: true }
      },
      비데: { type: 'boolean', label: '비데', default: true },
      비데등급: {
        type: 'select',
        label: '비데 등급',
        values: ['기본', '고급', '프리미엄'] as const,
        default: '기본',
        dependsOn: { 비데: true }
      },
      욕실장타입: {
        type: 'select',
        label: '욕실장 타입',
        values: ['벽걸이', '하부장', '키큰장'] as const,
        default: '벽걸이'
      },
      젠다이: { type: 'boolean', label: '젠다이', default: false },
      파티션: { type: 'boolean', label: '파티션', default: true },
      바닥난방: { type: 'boolean', label: '바닥난방', default: false },
      환풍기등급: {
        type: 'select',
        label: '환풍기 등급',
        values: ['기본', '제습형', '냉온풍'] as const,
        default: '기본'
      }
    }
  },

  // ============================================================
  // 3. 목공 공정
  // ============================================================
  목공: {
    code: '200',
    name: '목공',
    description: '목공사 및 가구 제작',
    spaces: ['common'],
    
    options: {
      붙박이장재질: {
        type: 'select',
        label: '붙박이장 재질',
        values: ['PET', 'UV', '원목무늬', '원목'] as const,
        default: 'PET'
      },
      붙박이장크기: {
        type: 'select',
        label: '붙박이장 크기',
        values: ['2400', '3000', '3600', '벽면전체'] as const,
        default: '2400'
      },
      방문교체: { type: 'boolean', label: '방문 교체', default: true },
      방문재질: {
        type: 'select',
        label: '방문 재질',
        values: ['ABS', '원목도어', '유리도어'] as const,
        default: 'ABS',
        dependsOn: { 방문교체: true }
      },
      중문타입: {
        type: 'select',
        label: '중문 타입',
        values: ['슬라이딩', '폴딩', '여닫이', '없음'] as const,
        default: '슬라이딩'
      },
      몰딩: {
        type: 'select',
        label: '몰딩',
        values: ['우레탄', '목재', '디자인몰딩', '없음'] as const,
        default: '우레탄'
      },
      걸레받이: {
        type: 'select',
        label: '걸레받이',
        values: ['PVC', '목재', '알루미늄'] as const,
        default: 'PVC'
      },
      맞춤제작: { type: 'boolean', label: '맞춤 제작', default: false },
      하드웨어등급: {
        type: 'select',
        label: '하드웨어 등급',
        values: ['기본', 'Hettich', 'Blum'] as const,
        default: '기본'
      }
    }
  },

  // ============================================================
  // 4. 전기 공정
  // ============================================================
  전기: {
    code: '300',
    name: '전기',
    description: '전기 및 조명 공사',
    spaces: ['common'],
    
    options: {
      조명타입: {
        type: 'multiselect',
        label: '조명 타입',
        values: ['다운라이트', '간접조명', '라인조명', '펜던트', '스팟조명'] as const,
        default: ['다운라이트']
      },
      디밍가능: { type: 'boolean', label: '디밍(밝기조절)', default: false },
      색온도조절: { type: 'boolean', label: '색온도 조절', default: false },
      스위치등급: {
        type: 'select',
        label: '스위치 등급',
        values: ['기본', '모듈러', '터치', '스마트'] as const,
        default: '기본'
      },
      USB콘센트: { type: 'boolean', label: 'USB 콘센트', default: false },
      분전반교체: { type: 'boolean', label: '분전반 교체', default: true },
      인덕션회로: { type: 'boolean', label: '인덕션 전용회로', default: false },
      에어컨전용회로: { type: 'boolean', label: '에어컨 전용회로', default: false },
      스마트홈: { type: 'boolean', label: '스마트홈', default: false }
    }
  },

  // ============================================================
  // 5. 도배 공정
  // ============================================================
  도배: {
    code: '900',
    name: '도배',
    description: '도배 및 벽지 공사',
    spaces: ['common'],
    
    options: {
      벽지종류: {
        type: 'select',
        label: '벽지 종류',
        values: ['합지', '실크', '수입벽지', '친환경', '페인트'] as const,
        default: '실크'
      },
      천장종류: {
        type: 'select',
        label: '천장 종류',
        values: ['합지', '실크', '페인트', '우물천장'] as const,
        default: '합지'
      },
      포인트벽지: { type: 'boolean', label: '포인트 벽지', default: false },
      곰팡이방지: { type: 'boolean', label: '곰팡이 방지', default: false },
      방음벽지: { type: 'boolean', label: '방음 벽지', default: false }
    }
  },

  // ============================================================
  // 6. 타일 공정
  // ============================================================
  타일: {
    code: '500',
    name: '타일',
    description: '타일 및 석재 공사',
    spaces: ['entrance', 'balcony'],
    
    options: {
      현관타일사이즈: {
        type: 'select',
        label: '현관 타일 사이즈',
        values: ['소형(300x300)', '중형(600x600)', '대형(800x800)', '대판(1200x600)'] as const,
        default: '중형(600x600)'
      },
      현관패턴: {
        type: 'select',
        label: '현관 타일 패턴',
        values: ['일반', '헤링본', '다이아몬드'] as const,
        default: '일반'
      },
      발코니타일: { type: 'boolean', label: '발코니 타일', default: true },
      발코니타일사이즈: {
        type: 'select',
        label: '발코니 타일 사이즈',
        values: ['소형(300x300)', '중형(600x600)'] as const,
        default: '소형(300x300)',
        dependsOn: { 발코니타일: true }
      },
      줄눈색상: {
        type: 'select',
        label: '줄눈 색상',
        values: ['화이트', '그레이', '블랙', '골드'] as const,
        default: '화이트'
      },
      에폭시줄눈: { type: 'boolean', label: '에폭시 줄눈', default: false }
    }
  },

  // ============================================================
  // 7. 필름 공정
  // ============================================================
  필름: {
    code: '700',
    name: '필름',
    description: '인테리어 필름 시공',
    spaces: ['common'],
    
    options: {
      시공범위: {
        type: 'multiselect',
        label: '시공 범위',
        values: ['문', '가구', '중문', '싱크대', '창틀'] as const,
        default: ['문', '가구']
      },
      필름등급: {
        type: 'select',
        label: '필름 등급',
        values: ['일반', '프리미엄', '3M', '수입'] as const,
        default: '일반'
      },
      무광유광: {
        type: 'select',
        label: '마감',
        values: ['무광', '유광', '반광'] as const,
        default: '무광'
      },
      방염필름: { type: 'boolean', label: '방염 필름', default: false },
      내스크래치: { type: 'boolean', label: '내스크래치', default: false }
    }
  },

  // ============================================================
  // 8. 창호 공정
  // ============================================================
  창호: {
    code: '800',
    name: '창호',
    description: '창호 공사',
    spaces: ['living', 'balcony'],
    
    options: {
      발코니창교체: { type: 'boolean', label: '발코니창 교체', default: false },
      방창교체: { type: 'boolean', label: '방창 교체', default: false },
      이중창: { type: 'boolean', label: '이중창', default: false },
      방충망: { type: 'boolean', label: '방충망', default: true },
      미세먼지망: { type: 'boolean', label: '미세먼지망', default: false },
      단열필름: { type: 'boolean', label: '단열필름', default: false },
      블라인드내장: { type: 'boolean', label: '블라인드 내장', default: false }
    }
  },

  // ============================================================
  // 9. 철거 공정
  // ============================================================
  철거: {
    code: '1000',
    name: '철거',
    description: '철거 및 폐기물 처리',
    spaces: ['common'],
    
    options: {
      철거범위: {
        type: 'select',
        label: '철거 범위',
        values: ['선택범위', '전체철거'] as const,
        default: '선택범위'
      }
    }
  },

  // ============================================================
  // 10. 기타 공정
  // ============================================================
  기타: {
    code: '999',
    name: '기타',
    description: '기타 공사 및 마감',
    spaces: ['common'],
    
    options: {
      준공청소: { type: 'boolean', label: '준공청소', default: true },
      바닥보양: { type: 'boolean', label: '바닥 보양', default: true }
    }
  }
} as const

// ============================================================
// 타입 자동 생성
// ============================================================

export type ProcessName = keyof typeof PROCESS_CONFIG
export type ProcessCode = typeof PROCESS_CONFIG[ProcessName]['code']

// 공정별 옵션 타입 추출
export type ProcessOptions<T extends ProcessName> = {
  [K in keyof typeof PROCESS_CONFIG[T]['options']]?: 
    typeof PROCESS_CONFIG[T]['options'][K] extends { values: readonly (infer V)[] }
      ? V
      : typeof PROCESS_CONFIG[T]['options'][K] extends { type: 'boolean' }
        ? boolean
        : typeof PROCESS_CONFIG[T]['options'][K] extends { type: 'multiselect', values: readonly (infer V)[] }
          ? V[]
          : unknown
}

// ============================================================
// 헬퍼 함수
// ============================================================

/** 공정 이름으로 설정 가져오기 */
export function getProcessConfig(name: ProcessName) {
  return PROCESS_CONFIG[name]
}

/** 공정 코드로 이름 가져오기 */
export function getProcessNameByCode(code: string): ProcessName | null {
  for (const [name, config] of Object.entries(PROCESS_CONFIG)) {
    if (config.code === code) return name as ProcessName
  }
  return null
}

/** 모든 공정 이름 목록 */
export function getAllProcessNames(): ProcessName[] {
  return Object.keys(PROCESS_CONFIG) as ProcessName[]
}

/** 특정 공간에 해당하는 공정 목록 */
export function getProcessesForSpace(space: string): ProcessName[] {
  return Object.entries(PROCESS_CONFIG)
    .filter(([_, config]) => {
      const spaces = config.spaces as readonly string[]
      return spaces.includes(space) || spaces.includes('common')
    })
    .map(([name]) => name as ProcessName)
}

/** 옵션 기본값 가져오기 */
export function getDefaultOptions<T extends ProcessName>(processName: T): ProcessOptions<T> {
  const config = PROCESS_CONFIG[processName]
  const defaults: Record<string, unknown> = {}
  
  for (const [key, option] of Object.entries(config.options)) {
    if ('default' in option) {
      defaults[key] = option.default
    }
  }
  
  return defaults as ProcessOptions<T>
}

/** 옵션 라벨 가져오기 (UI용) */
export function getOptionLabel(processName: ProcessName, optionKey: string): string {
  const config = PROCESS_CONFIG[processName]
  const option = (config.options as Record<string, { label?: string }>)[optionKey]
  return option?.label || optionKey
}

/** 옵션 값 목록 가져오기 (UI용) */
export function getOptionValues(processName: ProcessName, optionKey: string): readonly string[] {
  const config = PROCESS_CONFIG[processName]
  const option = (config.options as Record<string, { values?: readonly string[] }>)[optionKey]
  return option?.values || []
}

