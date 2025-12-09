// 품목 마스터 데이터 (우선 주요 품목 40개만 작성, 나중에 확장)

export interface ItemMasterData {
  itemId: number;
  processCode: number;
  processName: string;
  itemCode: string;
  itemName: string;
  spec?: string;
  unit: string;
  basicPrice: number;
  standardPrice: number;
  premiumPrice: number;
  isArgen: boolean;
  displayOrder: number;
}

export const ITEM_MASTER: ItemMasterData[] = [
  // 100 철거/가설공사 (6개)
  {
    itemId: 101,
    processCode: 100,
    processName: '철거/가설공사',
    itemCode: '101',
    itemName: '철거공사(전체)',
    spec: '3인 3일',
    unit: '인',
    basicPrice: 200000,
    standardPrice: 250000,
    premiumPrice: 300000,
    isArgen: false,
    displayOrder: 1
  },
  {
    itemId: 102,
    processCode: 100,
    processName: '철거/가설공사',
    itemCode: '102',
    itemName: '폐기물처리',
    spec: '2톤 차량',
    unit: '대',
    basicPrice: 400000,
    standardPrice: 550000,
    premiumPrice: 700000,
    isArgen: false,
    displayOrder: 2
  },
  {
    itemId: 103,
    processCode: 100,
    processName: '철거/가설공사',
    itemCode: '103',
    itemName: '소운반비',
    spec: '현장 내부',
    unit: '식',
    basicPrice: 120000,
    standardPrice: 150000,
    premiumPrice: 180000,
    isArgen: false,
    displayOrder: 3
  },
  {
    itemId: 104,
    processCode: 100,
    processName: '철거/가설공사',
    itemCode: '104',
    itemName: '양생/보양',
    spec: '공간 전체',
    unit: '식',
    basicPrice: 150000,
    standardPrice: 200000,
    premiumPrice: 250000,
    isArgen: false,
    displayOrder: 4
  },
  {
    itemId: 105,
    processCode: 100,
    processName: '철거/가설공사',
    itemCode: '105',
    itemName: '현장 정리정돈',
    spec: '일일 청소',
    unit: '인',
    basicPrice: 130000,
    standardPrice: 170000,
    premiumPrice: 200000,
    isArgen: false,
    displayOrder: 5
  },
  {
    itemId: 106,
    processCode: 100,
    processName: '철거/가설공사',
    itemCode: '106',
    itemName: '입주청소',
    spec: '전문 청소',
    unit: 'py',
    basicPrice: 16000,
    standardPrice: 20000,
    premiumPrice: 25000,
    isArgen: false,
    displayOrder: 6
  },

  // 200 목공사/가구공사 (10개)
  {
    itemId: 201,
    processCode: 200,
    processName: '목공사/가구공사',
    itemCode: '201',
    itemName: '신발장',
    spec: '400문 짝형',
    unit: '짝',
    basicPrice: 55000,
    standardPrice: 75000,
    premiumPrice: 95000,
    isArgen: true,
    displayOrder: 1
  },
  {
    itemId: 202,
    processCode: 200,
    processName: '목공사/가구공사',
    itemCode: '202',
    itemName: '붙박이장',
    spec: '2400H 슬라이딩',
    unit: 'm',
    basicPrice: 380000,
    standardPrice: 480000,
    premiumPrice: 620000,
    isArgen: true,
    displayOrder: 2
  },
  {
    itemId: 203,
    processCode: 200,
    processName: '목공사/가구공사',
    itemCode: '203',
    itemName: '수납장',
    spec: '400문 짝형',
    unit: '짝',
    basicPrice: 55000,
    standardPrice: 75000,
    premiumPrice: 95000,
    isArgen: true,
    displayOrder: 3
  },
  {
    itemId: 204,
    processCode: 200,
    processName: '목공사/가구공사',
    itemCode: '204',
    itemName: '도어세트',
    spec: '영림/ABS',
    unit: '개소',
    basicPrice: 350000,
    standardPrice: 450000,
    premiumPrice: 580000,
    isArgen: false,
    displayOrder: 4
  },
  {
    itemId: 205,
    processCode: 200,
    processName: '목공사/가구공사',
    itemCode: '205',
    itemName: '아이방 책상+수납',
    spec: '일체형 1800W',
    unit: '식',
    basicPrice: 760000,
    standardPrice: 950000,
    premiumPrice: 1200000,
    isArgen: true,
    displayOrder: 5
  },
  {
    itemId: 206,
    processCode: 200,
    processName: '목공사/가구공사',
    itemCode: '206',
    itemName: '화장대',
    spec: 'PET무광/거울',
    unit: '개소',
    basicPrice: 650000,
    standardPrice: 850000,
    premiumPrice: 1100000,
    isArgen: true,
    displayOrder: 6
  },
  {
    itemId: 207,
    processCode: 200,
    processName: '목공사/가구공사',
    itemCode: '207',
    itemName: '천정몰딩',
    spec: '마이너스 중백',
    unit: 'm',
    basicPrice: 4500,
    standardPrice: 6000,
    premiumPrice: 7500,
    isArgen: false,
    displayOrder: 7
  },
  {
    itemId: 208,
    processCode: 200,
    processName: '목공사/가구공사',
    itemCode: '208',
    itemName: '걸레받이',
    spec: '8전 평몰딩',
    unit: 'm',
    basicPrice: 3500,
    standardPrice: 4500,
    premiumPrice: 5500,
    isArgen: false,
    displayOrder: 8
  },
  {
    itemId: 209,
    processCode: 200,
    processName: '목공사/가구공사',
    itemCode: '209',
    itemName: '팬트리 수납장',
    spec: '다용도실 전체',
    unit: '식',
    basicPrice: 960000,
    standardPrice: 1200000,
    premiumPrice: 1560000,
    isArgen: true,
    displayOrder: 9
  },
  {
    itemId: 210,
    processCode: 200,
    processName: '목공사/가구공사',
    itemCode: '210',
    itemName: '목공 인건비',
    spec: '기공',
    unit: '인',
    basicPrice: 300000,
    standardPrice: 380000,
    premiumPrice: 450000,
    isArgen: false,
    displayOrder: 10
  },

  // 300 전기/통신공사 (6개)
  {
    itemId: 301,
    processCode: 300,
    processName: '전기/통신공사',
    itemCode: '301',
    itemName: '기본배선',
    spec: '전열/전등/스위치',
    unit: 'py',
    basicPrice: 25000,
    standardPrice: 30000,
    premiumPrice: 38000,
    isArgen: false,
    displayOrder: 1
  },
  {
    itemId: 302,
    processCode: 300,
    processName: '전기/통신공사',
    itemCode: '302',
    itemName: '인덕션 전용',
    spec: '차단기/4sq',
    unit: '식',
    basicPrice: 90000,
    standardPrice: 120000,
    premiumPrice: 150000,
    isArgen: false,
    displayOrder: 2
  },
  {
    itemId: 303,
    processCode: 300,
    processName: '전기/통신공사',
    itemCode: '303',
    itemName: '에어컨 전용',
    spec: '차단기/2.5sq',
    unit: '식',
    basicPrice: 80000,
    standardPrice: 100000,
    premiumPrice: 130000,
    isArgen: false,
    displayOrder: 3
  },
  {
    itemId: 304,
    processCode: 300,
    processName: '전기/통신공사',
    itemCode: '304',
    itemName: '매입등',
    spec: 'LED 15W',
    unit: 'ea',
    basicPrice: 35000,
    standardPrice: 45000,
    premiumPrice: 60000,
    isArgen: false,
    displayOrder: 4
  },
  {
    itemId: 305,
    processCode: 300,
    processName: '전기/통신공사',
    itemCode: '305',
    itemName: '간접조명',
    spec: 'LED 바',
    unit: 'm',
    basicPrice: 25000,
    standardPrice: 32000,
    premiumPrice: 42000,
    isArgen: false,
    displayOrder: 5
  },
  {
    itemId: 306,
    processCode: 300,
    processName: '전기/통신공사',
    itemCode: '306',
    itemName: '전기 인건비',
    spec: '기공',
    unit: '인',
    basicPrice: 240000,
    standardPrice: 300000,
    premiumPrice: 360000,
    isArgen: false,
    displayOrder: 6
  },

  // 400 욕실/수전공사 (6개)
  {
    itemId: 401,
    processCode: 400,
    processName: '욕실/수전공사',
    itemCode: '401',
    itemName: '방수공사',
    spec: '3차 책임방수',
    unit: '식',
    basicPrice: 380000,
    standardPrice: 450000,
    premiumPrice: 550000,
    isArgen: false,
    displayOrder: 1
  },
  {
    itemId: 402,
    processCode: 400,
    processName: '욕실/수전공사',
    itemCode: '402',
    itemName: '비데일체형 양변기',
    spec: '이누스/IW991',
    unit: 'ea',
    basicPrice: 520000,
    standardPrice: 650000,
    premiumPrice: 820000,
    isArgen: false,
    displayOrder: 2
  },
  {
    itemId: 403,
    processCode: 400,
    processName: '욕실/수전공사',
    itemCode: '403',
    itemName: '세면기',
    spec: '이누스/다리형',
    unit: 'ea',
    basicPrice: 260000,
    standardPrice: 320000,
    premiumPrice: 400000,
    isArgen: false,
    displayOrder: 3
  },
  {
    itemId: 404,
    processCode: 400,
    processName: '욕실/수전공사',
    itemCode: '404',
    itemName: '레인샤워수전',
    spec: '니켈무광',
    unit: 'ea',
    basicPrice: 120000,
    standardPrice: 153000,
    premiumPrice: 195000,
    isArgen: false,
    displayOrder: 4
  },
  {
    itemId: 405,
    processCode: 400,
    processName: '욕실/수전공사',
    itemCode: '405',
    itemName: '샤워파티션',
    spec: '730/유리',
    unit: 'ea',
    basicPrice: 135000,
    standardPrice: 169000,
    premiumPrice: 210000,
    isArgen: false,
    displayOrder: 5
  },
  {
    itemId: 406,
    processCode: 400,
    processName: '욕실/수전공사',
    itemCode: '406',
    itemName: '욕실 인건비',
    spec: '기공',
    unit: '인',
    basicPrice: 200000,
    standardPrice: 250000,
    premiumPrice: 300000,
    isArgen: false,
    displayOrder: 6
  },

  // 1000 주방가구/싱크대 (6개)
  {
    itemId: 1001,
    processCode: 1000,
    processName: '주방가구/싱크대',
    itemCode: '1001',
    itemName: '싱크대 하부장',
    spec: '6000W×650D',
    unit: '자',
    basicPrice: 88000,
    standardPrice: 110000,
    premiumPrice: 140000,
    isArgen: true,
    displayOrder: 1
  },
  {
    itemId: 1002,
    processCode: 1000,
    processName: '주방가구/싱크대',
    itemCode: '1002',
    itemName: '싱크대 상부장',
    spec: '6000W×750H',
    unit: '자',
    basicPrice: 64000,
    standardPrice: 80000,
    premiumPrice: 102000,
    isArgen: true,
    displayOrder: 2
  },
  {
    itemId: 1003,
    processCode: 1000,
    processName: '주방가구/싱크대',
    itemCode: '1003',
    itemName: '냉장고장',
    spec: '2100×2300×800',
    unit: '식',
    basicPrice: 680000,
    standardPrice: 850000,
    premiumPrice: 1100000,
    isArgen: true,
    displayOrder: 3
  },
  {
    itemId: 1004,
    processCode: 1000,
    processName: '주방가구/싱크대',
    itemCode: '1004',
    itemName: '대리석 상판',
    spec: '8100×700',
    unit: '식',
    basicPrice: 1090000,
    standardPrice: 1364000,
    premiumPrice: 1750000,
    isArgen: false,
    displayOrder: 4
  },
  {
    itemId: 1005,
    processCode: 1000,
    processName: '주방가구/싱크대',
    itemCode: '1005',
    itemName: '사각싱크볼',
    spec: '백조/860',
    unit: 'ea',
    basicPrice: 304000,
    standardPrice: 380000,
    premiumPrice: 490000,
    isArgen: false,
    displayOrder: 5
  },
  {
    itemId: 1006,
    processCode: 1000,
    processName: '주방가구/싱크대',
    itemCode: '1006',
    itemName: '주방 인건비',
    spec: '기공',
    unit: '인',
    basicPrice: 208000,
    standardPrice: 260000,
    premiumPrice: 330000,
    isArgen: false,
    displayOrder: 6
  }
];

// 유틸 함수
export const getItemsByProcess = (processCode: number): ItemMasterData[] => {
  return ITEM_MASTER.filter(item => item.processCode === processCode);
};

export const getItemByCode = (itemCode: string): ItemMasterData | undefined => {
  return ITEM_MASTER.find(item => item.itemCode === itemCode);
};

export const getItemById = (itemId: number): ItemMasterData | undefined => {
  return ITEM_MASTER.find(item => item.itemId === itemId);
};






