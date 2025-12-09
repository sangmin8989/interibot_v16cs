// 성향 분석 결과를 사용자 친화적인 텍스트로 변환하는 유틸리티

export interface AnalysisPreferences {
  spaceSense?: number
  visualSensitivity?: number
  auditorySensitivity?: number
  cleaningTendency?: number
  organizationLevel?: number
  sleepPattern?: number
  activityLevel?: number
  familyComposition?: number
  healthFactors?: number
  budgetSense?: number
  colorPreference?: number
  lightingPreference?: number
  spacePurpose?: number
  discomfortFactors?: number
  lifestyleRoutine?: number
}

export interface StyleRecommendation {
  style: string
  description: string
}

export interface PriorityItem {
  rank: number
  title: string
  description: string
  source: string
}

export interface ColorPalette {
  colors: string[]
  description: string
}

export interface MaterialRecommendation {
  category: string
  material: string
  brands?: string[]
  reason: string
}

export interface CategoryAnalysis {
  category: string
  icon: string
  items: {
    label: string
    score: number
    description: string
  }[]
}

// 스타일 추천 로직
export function getRecommendedStyle(
  preferences: AnalysisPreferences,
  selectedStyle?: string
): StyleRecommendation {
  const cleaning = preferences.cleaningTendency || 5
  const organization = preferences.organizationLevel || 5
  const colorPref = preferences.colorPreference || 5

  // 선택한 스타일이 있으면 우선 사용
  if (selectedStyle) {
    const styleMap: Record<string, StyleRecommendation> = {
      '미니멀': {
        style: '깔끔한 모던 미니멀',
        description: '깔끔함을 중시하는 당신에게 딱 맞는 스타일입니다',
      },
      '내추럴': {
        style: '아늑한 북유럽 스타일',
        description: '따뜻하고 자연스러운 분위기를 선호하시는군요',
      },
      '모던': {
        style: '세련된 모던 스타일',
        description: '현대적이고 깔끔한 디자인을 추구하시는 분이시네요',
      },
      '인더스트리얼': {
        style: '감각적인 인더스트리얼',
        description: '개성 있고 독특한 분위기를 원하시는군요',
      },
    }
    return styleMap[selectedStyle] || { style: selectedStyle, description: '당신에게 맞는 스타일입니다' }
  }

  // 점수 기반 자동 추천
  if (cleaning >= 8 && organization >= 7 && colorPref <= 4) {
    return {
      style: '깔끔한 모던 미니멀',
      description: '청소와 정리를 중시하는 당신에게 딱 맞는 스타일입니다',
    }
  }

  if (colorPref >= 7 && cleaning >= 6) {
    return {
      style: '아늑한 북유럽 스타일',
      description: '따뜻하고 자연스러운 분위기를 선호하시는군요',
    }
  }

  if (cleaning >= 7 && organization >= 6) {
    return {
      style: '세련된 모던 스타일',
      description: '현대적이고 실용적인 디자인을 추구하시는 분이시네요',
    }
  }

  return {
    style: '밸런스 스타일',
    description: '균형 잡힌 인테리어를 선호하시는군요',
  }
}

// 우선순위 추천 (질문 답변 기반)
export function getPriorities(
  preferences: AnalysisPreferences,
  answers?: Record<string, string>
): PriorityItem[] {
  const priorities: PriorityItem[] = []

  // 수납 우선순위 (Q3 기반)
  if (preferences.organizationLevel && preferences.organizationLevel >= 7) {
    priorities.push({
      rank: 1,
      title: '수납 공간 확보',
      description: '정리정돈을 중시하시므로 충분한 수납 공간이 필요합니다',
      source: 'Q3 답변 기반',
    })
  }

  // 청소 편의성 (Q5 기반)
  if (preferences.cleaningTendency && preferences.cleaningTendency >= 7) {
    priorities.push({
      rank: priorities.length + 1,
      title: '청소 편의성',
      description: '청소를 자주 하시므로 관리가 쉬운 자재가 중요합니다',
      source: 'Q5 답변 기반',
    })
  }

  // 디자인 통일감 (Q2 기반)
  if (preferences.visualSensitivity && preferences.visualSensitivity >= 7) {
    priorities.push({
      rank: priorities.length + 1,
      title: '디자인 통일감',
      description: '시각적 요소에 민감하시므로 일관된 디자인이 필요합니다',
      source: 'Q2 답변 기반',
    })
  }

  // 예산 (Q4 기반)
  if (preferences.budgetSense && preferences.budgetSense >= 7) {
    priorities.push({
      rank: priorities.length + 1,
      title: '예산과 가성비',
      description: '합리적인 가격의 우수한 자재를 선별하겠습니다',
      source: 'Q4 답변 기반',
    })
  }

  return priorities.slice(0, 3) // Top 3만 반환
}

// 색상 팔레트 추천
export function getColorPalette(preferences: AnalysisPreferences): ColorPalette {
  const colorPref = preferences.colorPreference || 5

  if (colorPref <= 3) {
    // 밝은 톤 선호
    return {
      colors: ['#FFFFFF', '#F5F5DC', '#F5DEB3'],
      description: '화이트, 아이보리, 연베이지',
    }
  }

  if (colorPref >= 7) {
    // 쿨톤 선호
    return {
      colors: ['#808080', '#36454F', '#000000'],
      description: '그레이, 차콜, 블랙',
    }
  }

  // 내추럴 톤 (기본)
  return {
    colors: ['#D2B48C', '#DEB887', '#F5DEB3'],
    description: '우드톤, 베이지, 크림',
  }
}

// 카테고리별 분석 텍스트 생성
export function getCategoryAnalysis(preferences: AnalysisPreferences): CategoryAnalysis[] {
  const categories: CategoryAnalysis[] = []

  // 생활 습관
  categories.push({
    category: '생활 습관',
    icon: '📊',
    items: [
      {
        label: '청소 성향',
        score: preferences.cleaningTendency || 5,
        description: getCleaningText(preferences.cleaningTendency || 5),
      },
      {
        label: '정리정돈',
        score: preferences.organizationLevel || 5,
        description: getOrganizationText(preferences.organizationLevel || 5),
      },
    ],
  })

  // 공간 활용
  categories.push({
    category: '공간 활용',
    icon: '🏠',
    items: [
      {
        label: '공간 감각',
        score: preferences.spaceSense || 5,
        description: getSpaceSenseText(preferences.spaceSense || 5),
      },
      {
        label: '동선',
        score: preferences.activityLevel || 5,
        description: getActivityText(preferences.activityLevel || 5),
      },
    ],
  })

  // 감각 민감도
  categories.push({
    category: '감각 민감도',
    icon: '👁️',
    items: [
      {
        label: '시각 민감도',
        score: preferences.visualSensitivity || 5,
        description: getVisualText(preferences.visualSensitivity || 5),
      },
      {
        label: '청각 민감도',
        score: preferences.auditorySensitivity || 5,
        description: getAuditoryText(preferences.auditorySensitivity || 5),
      },
    ],
  })

  // 예산 & 품질
  categories.push({
    category: '예산 & 품질',
    icon: '💰',
    items: [
      {
        label: '예산 감각',
        score: preferences.budgetSense || 5,
        description: getBudgetText(preferences.budgetSense || 5),
      },
    ],
  })

  return categories
}

// 자재 추천
export function getMaterialRecommendations(
  preferences: AnalysisPreferences
): MaterialRecommendation[] {
  const recommendations: MaterialRecommendation[] = []
  const cleaning = preferences.cleaningTendency || 5
  const budget = preferences.budgetSense || 5
  const visual = preferences.visualSensitivity || 5
  const organization = preferences.organizationLevel || 5

  // 바닥
  if (cleaning >= 7 && budget >= 7) {
    recommendations.push({
      category: '바닥',
      material: '강화마루',
      brands: ['LG 하우시스', '한화 L&C'],
      reason: '청소를 자주 하시고 예산을 고려하시는 당신께 최적입니다',
    })
  } else if (cleaning >= 7) {
    recommendations.push({
      category: '바닥',
      material: '포세린 타일',
      brands: ['대림바스', '동양'],
      reason: '청소가 쉽고 내구성이 뛰어납니다',
    })
  } else {
    recommendations.push({
      category: '바닥',
      material: '강화마루',
      brands: ['LG 하우시스'],
      reason: '균형 잡힌 선택입니다',
    })
  }

  // 벽
  if (visual >= 7) {
    recommendations.push({
      category: '벽',
      material: '실크 벽지 + 부분 페인트',
      reason: '깔끔한 스타일 선호 + 밝은 톤 선호',
    })
  } else {
    recommendations.push({
      category: '벽',
      material: '실크 벽지',
      reason: '기본적인 마감으로 충분합니다',
    })
  }

  // 수납
  if (organization >= 7) {
    recommendations.push({
      category: '수납',
      material: '아르젠 맞춤 붙박이장 + 시스템 선반',
      reason: '수납을 최우선으로 고려 + 공간 활용 능력 우수',
    })
  } else {
    recommendations.push({
      category: '수납',
      material: '기본 수납장',
      reason: '적당한 수납 공간이 필요합니다',
    })
  }

  // 조명
  if (visual >= 7) {
    recommendations.push({
      category: '조명',
      material: '매입등 + 간접조명 조합',
      reason: '시각 민감도 높음 + 모던 스타일',
    })
  } else {
    recommendations.push({
      category: '조명',
      material: '기본 조명',
      reason: '기본 조명으로 충분합니다',
    })
  }

  return recommendations
}

// 타입별 별명 결정
function getUserType(preferences: AnalysisPreferences, styleName: string): { type: string; emoji: string } {
  const cleaning = preferences.cleaningTendency || 5
  const organization = preferences.organizationLevel || 5
  const budget = preferences.budgetSense || 5
  const family = preferences.familyComposition || 5
  const spacePurpose = preferences.spacePurpose || 5
  const visual = preferences.visualSensitivity || 5

  // 우선순위에 따라 타입 결정
  if (cleaning >= 8 && organization >= 8) {
    return { type: '깔끔 집사', emoji: '✨' }
  }
  if (cleaning <= 4 && family >= 7) {
    return { type: '여유 라이프', emoji: '🏡' }
  }
  if (budget >= 8 && cleaning >= 7) {
    return { type: '가성비 헌터', emoji: '💰' }
  }
  if (visual >= 8 && budget <= 4) {
    return { type: '퀄리티 러버', emoji: '💎' }
  }
  if (spacePurpose >= 8) {
    return { type: '홈오피스 프로', emoji: '💼' }
  }
  if (family >= 8 && organization >= 7) {
    return { type: '수납 마스터', emoji: '📦' }
  }
  if (family <= 3 && organization <= 4) {
    return { type: '심플 리빙', emoji: '🌿' }
  }
  if (styleName.includes('인더스트리얼') || styleName.includes('개성')) {
    return { type: '나만의 취향', emoji: '🎨' }
  }

  return { type: '밸런스 라이프', emoji: '⚖️' }
}

// 인테리봇의 한마디 생성 (개선된 버전)
export function getInteribotMessage(
  preferences: AnalysisPreferences,
  style: StyleRecommendation
): string {
  const cleaning = preferences.cleaningTendency || 5
  const organization = preferences.organizationLevel || 5
  const budget = preferences.budgetSense || 5
  const family = preferences.familyComposition || 5
  const spacePurpose = preferences.spacePurpose || 5
  const visual = preferences.visualSensitivity || 5
  const colorPref = preferences.colorPreference || 5
  const activity = preferences.activityLevel || 5

  const userType = getUserType(preferences, style.style)
  let message = `분석해보니 당신은 '${userType.type}' 타입이시네요! ${userType.emoji}\n\n`

  // 타입별 메시지 생성
  if (userType.type === '깔끔 집사') {
    message += `청소를 자주 하시는 편이라 (${cleaning}/10점) 먼지가 잘 안 쌓이는 자재가 필수겠어요. `
    message += `미니멀 스타일을 좋아하시니 선반보다는 수납장으로 물건을 숨기는 게 좋을 것 같고요.\n\n`
    
    if (budget >= 8) {
      message += `특히 예산도 꼼꼼히 따지시는 타입 (${budget}/10점)이라 `
      message += `아르젠에서 가성비 끝판왕 자재들로만 골라봤어요. `
      message += `LG 강화마루 + 실크벽지 조합이면 청소도 쉽고 가격도 착해요!\n\n`
    } else {
      message += `청소 편의성과 디자인을 모두 잡으려면 포세린 타일이 딱이에요. `
      message += `물 닦기만 해도 반짝반짝! ✨\n\n`
    }

    if (organization >= 8) {
      message += `아, 그리고 수납은 좀 넉넉하게 잡았어요. `
      message += `'나중에 물건 더 생기면 어쩌지?' 하는 그 마음, 제가 다 알죠. 🙌\n\n`
    }
  } else if (userType.type === '여유 라이프') {
    message += `청소는 주 ${cleaning <= 3 ? '1회' : '2-3회'}면 충분하다고 생각하시고 (${cleaning}/10점), `
    message += `따뜻한 우드톤에 눈이 가시는 걸 보니 `
    message += `딱딱한 모던보다는 포근한 집을 원하시는 것 같아요.\n\n`
    
    if (family >= 7) {
      message += `가족이 많으시니 (부부+자녀) 실용성도 중요하겠죠? `
      message += `그래서 강마루는 튼튼한 걸로, `
      message += `벽지는 오염 쉽게 닦이는 걸로 골라봤어요. `
      message += `애들이 뛰어다녀도 끄떡없는 그런 자재들이요! 😅\n\n`
    }

    message += `아, 수납은 ${family >= 7 ? '아이들 짐 생각해서' : '생활 패턴에 맞춰'} 여유있게 잡았어요. `
    if (family >= 7) {
      message += `장난감, 책, 옷... 계속 늘어나잖아요? 😅\n\n`
    } else {
      message += `편하게 살 수 있게요!\n\n`
    }
  } else if (userType.type === '가성비 헌터') {
    message += `예산을 꼼꼼히 따지시는 타입 (${budget}/10점)이시네요! `
    message += `가격도 착하고 품질도 좋은 자재만 골라봤어요.\n\n`
    
    message += `청소도 자주 하시니까 (${cleaning}/10점) 관리가 쉬운 게 중요하죠? `
    message += `LG 강화마루 + 실크벽지 조합이면 청소도 쉽고 가격도 착해요. `
    message += `가성비 끝판왕이에요! 💰\n\n`

    if (organization >= 7) {
      message += `수납도 넉넉하게 잡았는데, 붙박이장으로 하면 나중에 추가 비용 없어서 더 좋아요!\n\n`
    }
  } else if (userType.type === '퀄리티 러버') {
    message += `디자인과 품질을 중시하시는군요! `
    message += `시각적 요소에 민감하시니까 (${visual}/10점) 색상 통일과 조명 설계에 특별히 신경 썼어요.\n\n`
    
    message += `고급스러운 마감재와 감각적인 조명으로 `
    message += `${style.style} 스타일을 완벽하게 살렸어요. `
    message += `특히 간접조명 + 포인트 조명 조합이면 분위기 끝! 💡\n\n`

    message += `예산은 좀 들지만, 오래 쓸 거 생각하면 투자 가치 충분해요!\n\n`
  } else if (userType.type === '홈오피스 프로') {
    message += `재택근무를 하신다니 작업 공간이 진짜 중요할 텐데, `
    message += `조명은 라인조명으로 감각 살리면서 눈도 안 피곤하게 설계했어요.\n\n`
    
    if (activity >= 7) {
      message += `동선도 효율적으로 잡아서 일할 때 집중력이 잘 올라가게 했어요. `
      message += `일자형 레이아웃이면 움직임도 편하고요!\n\n`
    }

    message += `혼자 사시니까 청소도 본인만 하면 되고, `
    message += `수납도 딱 필요한 만큼만 두는 게 나아요. `
    message += `너무 많으면 오히려 답답해 보이거든요.\n\n`
  } else if (userType.type === '수납 마스터') {
    message += `가족이 많으시니 (부부+자녀) 수납이 진짜 중요하시겠어요! `
    message += `정리정돈도 잘 하시니까 (${organization}/10점) `
    message += `아르젠 맞춤 붙박이장 + 시스템 선반으로 수납 공간을 넉넉하게 잡았어요.\n\n`
    
    message += `장난감, 책, 옷... 계속 늘어나는 게 다 들어갈 수 있게요. `
    message += `아이들도 자기가 정리하기 쉽게 라벨까지 붙여드릴게요! 📦\n\n`

    if (cleaning >= 7) {
      message += `청소도 자주 하시니까 먼지 안 쌓이는 자재로 골랐어요. `
      message += `관리도 편하고요!\n\n`
    }
  } else if (userType.type === '심플 리빙') {
    message += `1인 가구시니까 딱 필요한 만큼만 두는 게 나아요. `
    message += `수납도 최소한만, 공간도 넓게 보이게 설계했어요.\n\n`
    
    message += `${style.style} 스타일이면 깔끔하면서도 개성 있어 보여요. `
    message += `특히 미니멀하게 가면 공간이 훨씬 넓어 보이거든요! 🌿\n\n`

    message += `청소도 본인만 하시니까 관리가 쉬운 자재면 충분해요.\n\n`
  } else if (userType.type === '나만의 취향') {
    message += `인더스트리얼 스타일에 포인트 컬러까지... `
    message += `남들과 똑같은 집은 딱 질색이시죠? 😄\n\n`
    
    if (spacePurpose >= 7) {
      message += `재택근무를 하신다니 작업 공간이 진짜 중요할 텐데, `
      message += `조명은 라인조명으로 감각 살리면서 눈도 안 피곤하게 설계했어요.\n\n`
    }

    message += `혼자 사시니까 청소도 본인만 하면 되고, `
    message += `수납도 딱 필요한 만큼만 두는 게 나아요. `
    message += `너무 많으면 오히려 답답해 보이거든요.\n\n`

    message += `아, 바닥은 대리석 느낌 타일 어때요? `
    message += `인더스트리얼엔 찐이죠! 차갑다 싶으면 러그 하나만 깔면 끝이고요.\n\n`
  } else {
    // 밸런스 라이프 (기본)
    message += `${style.style}을 선호하시는군요! `
    message += `균형 잡힌 인테리어를 원하시는 것 같아요.\n\n`
    
    message += `실용성과 디자인을 모두 고려해서 `
    message += `당신에게 딱 맞는 자재들을 골라봤어요. `
    message += `특히 ${cleaning >= 7 ? '청소가 쉬운' : '내구성이 좋은'} 자재 위주로요!\n\n`

    if (organization >= 7) {
      message += `수납도 적당히 넉넉하게 잡아서 나중에 여유있게 쓸 수 있어요.\n\n`
    }
  }

  // 공통 마무리
  message += `이 분석을 바탕으로 아르젠 설계팀이 당신만의 견적을 딱 맞춰서 뽑아냈습니다!`

  return message
}

// 텍스트 생성 함수들
function getCleaningText(score: number): string {
  if (score >= 8) return '청소를 자주 하시는 편이군요. 먼지가 덜 쌓이는 마감재를 추천합니다'
  if (score >= 5) return '적당히 청소하시는 편이네요. 기본적인 청소 용이 자재면 충분합니다'
  return '청소에 크게 신경 쓰지 않으시는군요. 내구성 좋은 자재를 추천드립니다'
}

function getOrganizationText(score: number): string {
  if (score >= 8) return '정리를 매우 잘 하시는 편이군요. 충분한 수납 공간을 확보하겠습니다'
  if (score >= 5) return '적당한 수납 공간이 필요합니다. 붙박이장과 수납장을 조화롭게 배치하겠습니다'
  return '수납은 최소한만 필요하시는군요. 오픈 수납 위주로 설계하겠습니다'
}

function getSpaceSenseText(score: number): string {
  if (score >= 8) return '공간 활용 능력이 뛰어나십니다. 다목적 공간 설계가 잘 어울립니다'
  if (score >= 5) return '공간 활용에 대한 감각이 있으시네요. 효율적인 공간 배치를 제안드립니다'
  return '공간 활용은 기본적으로만 필요하시는군요. 단순한 레이아웃을 추천드립니다'
}

function getActivityText(score: number): string {
  if (score >= 8) return '활동량이 많으시네요. 효율적인 동선을 선호하시므로 일자형 주방을 추천드립니다'
  if (score >= 5) return '적당한 활동량이시군요. 기본적인 동선 설계면 충분합니다'
  return '활동량이 적으시는군요. 편안한 동선을 우선 고려하겠습니다'
}

function getVisualText(score: number): string {
  if (score >= 8) return '시각적 요소에 민감하십니다. 색상 통일과 조명 설계에 신경 쓰겠습니다'
  if (score >= 5) return '시각적 요소에 대한 관심이 있으시네요. 기본적인 디자인 통일을 유지하겠습니다'
  return '시각적 요소에 크게 신경 쓰지 않으시는군요. 실용성 위주로 설계하겠습니다'
}

function getAuditoryText(score: number): string {
  if (score >= 8) return '소음에 매우 민감하시네요. 방음 설계에 특별히 신경 쓰겠습니다'
  if (score >= 5) return '보통 수준입니다. 기본 방음으로 충분합니다'
  return '소음에 크게 신경 쓰지 않으시는군요. 기본적인 방음만 적용하겠습니다'
}

function getBudgetText(score: number): string {
  if (score >= 8) return '가성비를 중시하시네요. 합리적인 가격의 우수한 자재를 선별하겠습니다'
  if (score >= 5) return '예산을 적절히 고려하시는군요. 균형 잡힌 자재를 추천드립니다'
  return '품질을 우선 고려하시는군요. 고급 자재를 추천드립니다'
}

