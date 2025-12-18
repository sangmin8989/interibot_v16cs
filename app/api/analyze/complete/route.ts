/**
 * 인테리봇 종합 AI 분석 API
 * V3 엔진 사용 (InterventionEngine 포함)
 * 고객의 모든 정보를 종합해서 맞춤 분석 결과 제공
 */

import { NextRequest, NextResponse } from 'next/server'
import { V3Engine } from '@/lib/analysis/engine-v3'
import { V3EngineInput, V3AnalysisResult, BudgetRange, RecommendedProcess, Risk } from '@/lib/analysis/engine-v3/types'
import { SpaceInfo, VibeInput } from '@/lib/analysis/types'
import { aggregateChoiceVariables } from '@/lib/analysis/utils/choice-variables'

// 요청 타입 정의
interface CompleteAnalysisRequest {
  // 1단계: 집 정보
  spaceInfo: {
    housingType: string
    pyeong: number
    rooms: number
    bathrooms: number
    budget?: string
    budgetAmount?: number
    familySizeRange?: string
    ageRanges?: string[]
    lifestyleTags?: string[]
    // ✅ 추가된 필드들
    livingPurpose?: '실거주' | '매도준비' | '임대' | '입력안함' // 거주 목적
    livingYears?: number // 예상 거주 기간
    totalPeople?: number // 가족 인원수
    additionalNotes?: string // ✅ 추가 정보 (자유 입력)
    specialConditions?: {
      hasPets?: boolean
      petTypes?: string[]
      hasElderly?: boolean
      hasPregnant?: boolean
      hasDisabledMember?: boolean
      hasShiftWorker?: boolean
    }
  }
  
  // 2단계: 선택된 공간
  selectedSpaces: string[]
  
  // 3단계: 선택된 공정
  selectedProcesses: Record<string, any>
  
  // 3-1단계: 공정별 등급 선택 (새로운 구조)
  tierSelections?: Record<string, { enabled: boolean; tier: string }>
  
  // 4단계: 세부 옵션
  detailOptions: {
    주방옵션?: any
    욕실옵션?: any
    거실옵션?: any
    안방옵션?: any
    방옵션?: any
    현관옵션?: any
    발코니옵션?: any
  }
  
  // 5단계: 성향분석 결과 (추가)
  personality?: {
    mode?: string  // quick, standard, deep, vibe
    answers?: Record<string, string>  // 질문ID -> 답변
    vibeData?: {
      mbti?: string
      bloodType?: string
      birthdate?: string
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CompleteAnalysisRequest = await request.json()
    
    console.log('📊 인테리봇 종합 분석 시작 (V3 엔진):', {
      집정보: body.spaceInfo,
      선택공간: body.selectedSpaces,
      선택공정: Object.keys(body.selectedProcesses || {}),
      세부옵션: Object.keys(body.detailOptions || {}),
      성향분석: body.personality ? '있음' : '없음',
    })

    let analysisResult

    try {
      // ✅ Integration Step: 질문 답변으로 choiceVariables 계산 (한 번만)
      const answers = body.personality?.answers || {}
      const choiceVariables = Object.keys(answers).length > 0 
        ? aggregateChoiceVariables(answers)
        : undefined

      console.log('📊 선택권 변수 계산:', choiceVariables ? {
        optionCount: choiceVariables.optionCount,
        lockStrength: choiceVariables.lockStrength,
        defaultPlan: choiceVariables.defaultPlan
      } : '답변 없음')

      // V3 엔진 입력 변환
      const v3Input: V3EngineInput = {
        answers,
        spaceInfo: convertSpaceInfo(body.spaceInfo),
        selectedSpaces: body.selectedSpaces || [],
        selectedProcesses: body.selectedProcesses ? Object.keys(body.selectedProcesses) : [],
        budget: convertBudget(body.spaceInfo?.budget),
        vibeInput: body.personality?.vibeData ? {
          mbti: body.personality.vibeData.mbti,
          bloodType: body.personality.vibeData.bloodType,
          zodiac: body.personality.vibeData.birthdate ? undefined : undefined
        } : undefined,
        // ✅ Integration Step: choiceVariables 전달
        choiceVariables
      }

      console.log('🚀 V3 엔진 실행 시작')
      
      // V3 엔진 실행
      const v3Engine = new V3Engine()
      const v3Result = await v3Engine.analyze(v3Input)

      console.log('✅ V3 엔진 완료:', {
        공정개수: v3Result.processResult.recommendedProcesses.length,
        리스크개수: v3Result.riskResult.risks.length,
        시나리오개수: v3Result.scenarioResult.scenarios.length,
        실행시간: v3Result.executionTime?.total || 0
      })

      // V3 결과를 기존 응답 형식으로 변환
      analysisResult = convertV3ResultToLegacyFormat(v3Result, body)

      console.log('✅ 분석 결과 변환 완료')
    } catch (v3Error: any) {
      console.warn('⚠️ V3 엔진 분석 실패, 기본 분석 사용:', v3Error.message)
      console.error('V3 엔진 오류 상세:', v3Error)
      // V3 실패 시 기본 분석 사용
      analysisResult = createDefaultAnalysis(body)
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      inputSummary: {
        평수: body.spaceInfo.pyeong,
        주거형태: body.spaceInfo.housingType,
        선택공간수: body.selectedSpaces.length,
        예산: body.spaceInfo.budget || '미정',
      }
    })

  } catch (error: any) {
    console.error('❌ AI 분석 오류:', error)
    
    // 어떤 오류든 기본 분석으로 응답
    try {
      const body = await request.clone().json()
      const defaultAnalysis = createDefaultAnalysis(body)
      
      return NextResponse.json({
        success: true,
        analysis: defaultAnalysis,
        inputSummary: {
          평수: body.spaceInfo?.pyeong || 30,
          주거형태: body.spaceInfo?.housingType || '아파트',
          선택공간수: body.selectedSpaces?.length || 0,
          예산: body.spaceInfo?.budget || '미정',
        },
        fallback: true  // 기본 분석 사용 표시
      })
    } catch {
      // 최후의 수단: 에러 응답
      return NextResponse.json(
        { success: false, error: '분석 데이터를 처리할 수 없습니다.' },
        { status: 400 }
      )
    }
  }
}

// ============================================================
// V3 엔진 변환 함수들
// ============================================================

/**
 * CompleteAnalysisRequest의 spaceInfo를 V3 엔진의 SpaceInfo로 변환
 */
function convertSpaceInfo(spaceInfo: CompleteAnalysisRequest['spaceInfo']): SpaceInfo {
  return {
    housingType: spaceInfo.housingType,
    pyeong: spaceInfo.pyeong,
    squareMeter: spaceInfo.pyeong ? spaceInfo.pyeong * 3.3 : undefined,
    rooms: spaceInfo.rooms,
    bathrooms: spaceInfo.bathrooms,
    // 추가 필드들
    familySizeRange: spaceInfo.familySizeRange,
    ageRanges: spaceInfo.ageRanges,
    lifestyleTags: spaceInfo.lifestyleTags,
    totalPeople: spaceInfo.totalPeople,
    livingPurpose: spaceInfo.livingPurpose,
    livingYears: spaceInfo.livingYears,
    additionalNotes: spaceInfo.additionalNotes,
  }
}

/**
 * 예산 문자열을 BudgetRange로 변환
 */
function convertBudget(budget?: string): BudgetRange {
  if (!budget) return 'medium'
  if (budget === 'low' || budget.includes('1000') || budget.includes('2000')) return 'low'
  if (budget === 'high' || budget === 'premium' || budget.includes('6000')) return 'premium'
  return 'medium'
}

/**
 * V3 엔진 결과를 기존 응답 형식으로 변환
 */
function convertV3ResultToLegacyFormat(v3Result: V3AnalysisResult, body: CompleteAnalysisRequest) {
  const { processResult, riskResult, scenarioResult, explanationResult } = v3Result
  const { spaceInfo, selectedSpaces, detailOptions, personality } = body
  
  // 공정 분석 - InterventionEngine이 축소한 공정 사용
  const spaceAnalysis = processResult.recommendedProcesses.map((proc: RecommendedProcess) => {
    // 공간별로 그룹화
    const spaceName = proc.category || '기타'
    
    return {
      space: spaceName,
      recommendation: proc.reason || `${proc.label}이 필요합니다. AI가 선택 범위를 정리했습니다.`,
      tips: proc.priority === 'essential' 
        ? ['이 공정은 필수입니다. 후회 가능성이 낮은 기준으로 정리했습니다.']
        : ['이 공정은 권장됩니다.'],
      estimatedImpact: proc.priority === 'essential' 
        ? '필수 공정입니다. 이 조건에서는 이 선택이 안전합니다.'
        : '권장 공정입니다.'
    }
  })

  // 공간별로 그룹화 (중복 제거)
  interface SpaceAnalysisItem {
    space: string
    recommendation: string
    tips: string[]
    estimatedImpact: string
  }
  
  const spaceMap = new Map<string, SpaceAnalysisItem>()
  spaceAnalysis.forEach((item: SpaceAnalysisItem) => {
    if (!spaceMap.has(item.space)) {
      spaceMap.set(item.space, {
        space: item.space,
        recommendation: item.recommendation,
        tips: item.tips,
        estimatedImpact: item.estimatedImpact
      })
    } else {
      const existing = spaceMap.get(item.space)!
      existing.recommendation += ` ${item.recommendation}`
    }
  })
  const groupedSpaceAnalysis = Array.from(spaceMap.values())

  // 경고사항
  const warnings = [
    ...riskResult.risks.map((r: Risk) => r.description || r.title),
    // InterventionEngine 경고는 processResult에 반영되어 있음
  ]

  // 설명에서 요약 추출
  const summary = explanationResult?.summary || 
    `${spaceInfo.pyeong}평 ${spaceInfo.housingType}의 ${selectedSpaces.length}개 공간을 분석했습니다. AI가 선택 범위를 정리했습니다.`

  // 고객 프로필
  const customerProfile = {
    lifestyle: explanationResult?.traitInterpretation || 
      `${processResult.adjustedIndicators?.수납중요도 >= 60 ? '수납을 중시하는' : ''} ${processResult.adjustedIndicators?.동선중요도 >= 60 ? '동선을 중시하는' : ''} 고객님`,
    priorities: processResult.prioritySpaces?.slice(0, 3).map((s) => s.label) || 
      processResult.recommendedProcesses.slice(0, 3).map((p) => p.label),
    style: scenarioResult?.scenarios?.[0]?.category || '모던 내추럴'
  }

  // 집값 점수 계산
  const homeValueScore = {
    score: Math.min(5, Math.max(1, Math.round(
      3 + (processResult.recommendedProcesses.length * 0.3) + 
      (processResult.recommendedProcesses.filter((p) => p.priority === 'essential').length * 0.5)
    ))),
    reason: processResult.recommendedProcesses.length >= 3
      ? '주요 공정들이 정리되었습니다. 장기적으로 투자 가치가 있습니다.'
      : '기본적인 공정들이 정리되었습니다.',
    investmentValue: '적절한 투자입니다.'
  }

  // 생활 점수
  const lifestyleScores = {
    storage: processResult.adjustedIndicators?.수납중요도 || 60,
    cleaning: processResult.adjustedIndicators?.관리민감도 || 60,
    flow: processResult.adjustedIndicators?.동선중요도 || 60,
    comment: processResult.adjustedIndicators?.수납중요도 >= 70 
      ? '수납공간이 크게 개선됩니다!'
      : processResult.adjustedIndicators?.동선중요도 >= 70
      ? '생활 동선이 획기적으로 개선됩니다!'
      : '전반적인 생활 품질이 향상됩니다.'
  }

  // 예산 조언
  const budgetAdvice = {
    grade: processResult.gradeRecommendation || 'standard',
    reason: `고객님의 성향을 고려하여 ${processResult.gradeRecommendation || 'standard'} 등급이 적합합니다.`,
    savingTips: [
      '비수기(3-4월, 9-10월) 시공 시 인건비 10-15% 절감 가능',
      '조명/스위치는 직접 구매 후 설치만 의뢰하면 30% 절약',
      '타일 줄눈은 회색 계열로 하면 코팅 비용 절감 + 관리 편함'
    ]
  }

  // 다음 단계
  const nextSteps = [
    '견적서에서 브랜드별 가격 비교해보기',
    '시공 일정 및 임시 거처 계획 세우기',
    '자재 샘플 직접 확인 추천'
  ]

  return {
    summary,
    customerProfile,
    homeValueScore,
    lifestyleScores,
    spaceAnalysis: groupedSpaceAnalysis.length > 0 ? groupedSpaceAnalysis : spaceAnalysis,
    budgetAdvice,
    warnings: warnings.length > 0 ? warnings : ['시공 전 현장 실측 필수'],
    nextSteps
  }
}

// 분석 프롬프트 생성 (더 이상 사용하지 않지만 호환성을 위해 유지)
function buildAnalysisPrompt(data: CompleteAnalysisRequest): string {
  const { spaceInfo, selectedSpaces, selectedProcesses, tierSelections, detailOptions, personality } = data
  
  // ✅ 거주 목적 텍스트 변환
  const livingPurposeText = spaceInfo.livingPurpose && spaceInfo.livingPurpose !== '입력안함' 
    ? spaceInfo.livingPurpose 
    : null
  
  // ✅ 특수 조건 텍스트 생성
  const specialConditionsTexts: string[] = []
  if (spaceInfo.specialConditions) {
    if (spaceInfo.specialConditions.hasPets) {
      specialConditionsTexts.push(`반려동물 있음${spaceInfo.specialConditions.petTypes?.length ? ` (${spaceInfo.specialConditions.petTypes.join(', ')})` : ''}`)
    }
    if (spaceInfo.specialConditions.hasElderly) specialConditionsTexts.push('고령자 동거')
    if (spaceInfo.specialConditions.hasPregnant) specialConditionsTexts.push('임산부 있음')
    if (spaceInfo.specialConditions.hasDisabledMember) specialConditionsTexts.push('거동불편자 있음')
    if (spaceInfo.specialConditions.hasShiftWorker) specialConditionsTexts.push('교대근무자 있음')
  }

  let prompt = `## 고객 인테리어 정보 분석 요청

### 1. 집 기본 정보
- 주거형태: ${spaceInfo.housingType}
- 평수: ${spaceInfo.pyeong}평
- 방 개수: ${spaceInfo.rooms}개
- 화장실 개수: ${spaceInfo.bathrooms}개
- 예산: ${spaceInfo.budget || '미정'}${spaceInfo.budgetAmount ? ` (${spaceInfo.budgetAmount}만원)` : ''}
- 가족 규모: ${spaceInfo.familySizeRange || '미입력'}${spaceInfo.totalPeople ? ` (${spaceInfo.totalPeople}명)` : ''}
`

  // ✅ 거주 목적 추가
  if (livingPurposeText) {
    prompt += `- 거주 목적: ${livingPurposeText}\n`
    if (spaceInfo.livingYears) {
      prompt += `- 예상 거주 기간: ${spaceInfo.livingYears}년\n`
    }
  }

  if (spaceInfo.ageRanges && spaceInfo.ageRanges.length > 0) {
    prompt += `- 가족 연령대: ${spaceInfo.ageRanges.join(', ')}\n`
  }
  
  if (spaceInfo.lifestyleTags && spaceInfo.lifestyleTags.length > 0) {
    prompt += `- 생활 특성: ${spaceInfo.lifestyleTags.join(', ')}\n`
  }
  
  // ✅ 특수 조건 추가
  if (specialConditionsTexts.length > 0) {
    prompt += `- 특수 고려사항: ${specialConditionsTexts.join(', ')}\n`
  }

  // ✅ 추가 정보(additionalNotes) 추가
  if (spaceInfo.additionalNotes && spaceInfo.additionalNotes.trim()) {
    prompt += `- 추가 정보: ${spaceInfo.additionalNotes.trim()}\n`
  }

  prompt += `
### 2. 선택한 공간 (${selectedSpaces.length}개)
${selectedSpaces.map(s => `- ${s}`).join('\n')}

### 3. 선택한 공정
`
  
  // 공정 정보 추가
  if (selectedProcesses && Object.keys(selectedProcesses).length > 0) {
    for (const [space, processes] of Object.entries(selectedProcesses)) {
      prompt += `\n[${space}]\n`
      if (typeof processes === 'object') {
        for (const [category, value] of Object.entries(processes as Record<string, any>)) {
          if (value) {
            prompt += `  - ${category}: ${value}\n`
          }
        }
      }
    }
  } else {
    prompt += '(선택된 공정 정보 없음)\n'
  }

  prompt += `
### 4. 세부 옵션
`

  // 세부 옵션 정보 추가
  if (detailOptions) {
    if (detailOptions.주방옵션) {
      const k = detailOptions.주방옵션
      prompt += `\n[주방]
  - 형태: ${k.형태 || '미선택'}
  - 상판재질: ${k.상판재질 || '미선택'}
  - 설비: 후드(${k.설비?.후드 ? 'O' : 'X'}), 쿡탑(${k.설비?.쿡탑 ? 'O' : 'X'}), 식기세척기(${k.설비?.식기세척기 ? 'O' : 'X'})
  - 냉장고장: ${k.냉장고장 ? 'O' : 'X'}, 키큰장: ${k.키큰장 ? 'O' : 'X'}
`
    }
    
    if (detailOptions.욕실옵션) {
      const b = detailOptions.욕실옵션
      prompt += `\n[욕실]
  - 스타일: ${b.스타일 || '미선택'}
  - 타일사이즈: ${b.타일사이즈 || '미선택'}
  - 샤워부스: ${b.샤워부스 ? 'O' : 'X'}, 비데: ${b.비데 ? 'O' : 'X'}
`
    }

    if (detailOptions.거실옵션) {
      const l = detailOptions.거실옵션
      prompt += `\n[거실]
  - 벽지종류: ${l.벽지종류 || '미선택'}
  - 바닥재: ${l.바닥재 || '미선택'}
  - 아트월: ${l.아트월 ? 'O' : 'X'}
`
    }

    if (detailOptions.현관옵션) {
      const e = detailOptions.현관옵션
      prompt += `\n[현관]
  - 타일패턴: ${e.타일패턴 || '미선택'}
  - 중문: ${e.중문 ? 'O' : 'X'}, 신발장: ${e.신발장 ? 'O' : 'X'}
`
    }
  }

  // ✅ 공정 선택 정보 추가 (tierSelections)
  if (tierSelections && Object.keys(tierSelections).length > 0) {
    const enabledProcesses = Object.entries(tierSelections)
      .filter(([_, sel]) => sel.enabled)
      .map(([id, sel]) => `${id} (${sel.tier})`)
    
    if (enabledProcesses.length > 0) {
      prompt += `
### 선택된 공정 (등급)
${enabledProcesses.map(p => `- ${p}`).join('\n')}
`
    }
  }

  // ✅ 성향분석 결과 추가 (강화된 버전)
  if (personality) {
    const modeNames: Record<string, string> = {
      'quick': '빠르게 (4문항)',
      'standard': '기본으로 (10문항)',
      'deep': '상세하게 (20문항)',
      'vibe': '나답게 (MBTI+혈액형+7문항)'
    }
    
    prompt += `
### 5. 🎯 고객 성향 분석 결과 (매우 중요 - 반드시 분석에 반영!)
- 분석 모드: ${modeNames[personality.mode || ''] || personality.mode || '미선택'}
`
    
    // ✅ 질문 답변을 상세하게 추가
    if (personality.answers && Object.keys(personality.answers).length > 0) {
      prompt += '\n**[성향 질문 답변 - 각 답변의 의미를 깊이 해석해주세요!]**\n'
      
      // 질문별 상세 라벨 및 해석 힌트
      const answerDetails: Record<string, { label: string; hint: string }> = {
        // Quick 모드 (4문항)
        'quick_first_scene': { 
          label: '🚪 퇴근 후 원하는 첫 장면',
          hint: '→ 이 답변이 고객의 핵심 니즈입니다!'
        },
        'quick_photo_space': { 
          label: '📸 사진 찍고 싶은 공간',
          hint: '→ 가장 투자하고 싶은 공간입니다'
        },
        'quick_no_compromise': { 
          label: '⚡ 절대 타협 안 할 것',
          hint: '→ 최우선 투자 영역! 반드시 반영하세요'
        },
        'quick_atmosphere': { 
          label: '🏠 원하는 집 분위기',
          hint: '→ 전체 스타일 방향을 결정합니다'
        },
        // Standard 모드 추가 (6문항)
        'standard_main_space': { 
          label: '⏰ 가장 오래 머무는 공간',
          hint: '→ 이 공간에 가장 신경 써야 합니다'
        },
        'standard_daily_discomfort': { 
          label: '😤 매일 불편한 점',
          hint: '→ 반드시 해결해야 할 문제입니다'
        },
        'standard_cleaning_style': { 
          label: '🧹 청소 스타일',
          hint: '→ 마감재/수납 선택의 핵심 기준'
        },
        'standard_family_time': { 
          label: '👨‍👩‍👧 가족 모이는 시간/장소',
          hint: '→ 가족 공간 설계의 핵심'
        },
        'standard_budget_priority': { 
          label: '💰 예산 우선순위',
          hint: '→ 예산 배분 방향을 결정합니다'
        },
        'standard_compliment': { 
          label: '🌟 듣고 싶은 칭찬',
          hint: '→ 고객이 궁극적으로 원하는 결과'
        },
        // Deep 모드 추가 (10문항)
        'deep_morning_routine': {
          label: '🌅 아침 루틴',
          hint: '→ 동선 설계에 반영'
        },
        'deep_weekend_activity': {
          label: '🛋️ 주말 집에서 하는 활동',
          hint: '→ 공간 활용 방향'
        },
        'deep_guest_frequency': {
          label: '🚶 손님 초대 빈도',
          hint: '→ 거실/주방 공개성 결정'
        },
        'deep_storage_stress': {
          label: '📦 수납 스트레스 원인',
          hint: '→ 수납 솔루션 결정'
        },
        'deep_color_preference': {
          label: '🎨 선호 색상 톤',
          hint: '→ 전체 컬러 팔레트'
        },
        'deep_lighting_mood': {
          label: '💡 조명 분위기 선호',
          hint: '→ 조명 플랜 방향'
        },
        'deep_noise_sensitivity': {
          label: '🔇 소음 민감도',
          hint: '→ 방음/구조 고려'
        },
        'deep_tech_preference': {
          label: '📱 스마트홈 관심도',
          hint: '→ IoT 설비 계획'
        },
        'deep_nature_element': {
          label: '🌿 자연 요소 선호',
          hint: '→ 식물/자연광/우드 톤'
        },
        'deep_final_wish': {
          label: '✨ 인테리어 후 기대',
          hint: '→ 최종 목표!'
        },
        // Vibe 모드 질문 (7문항)
        'vibe_energy_source': {
          label: '⚡ 에너지 충전 방식',
          hint: '→ 공간의 기본 성격'
        },
        'vibe_decision_style': {
          label: '🤔 결정 스타일',
          hint: '→ 설계 과정 참여도'
        },
        'vibe_ideal_day': {
          label: '☀️ 이상적인 하루',
          hint: '→ 공간 활용 패턴'
        },
        'vibe_stress_relief': {
          label: '😌 스트레스 해소법',
          hint: '→ 힐링 공간 필요성'
        },
        'vibe_priority_value': {
          label: '💎 가장 중요한 가치',
          hint: '→ 인테리어 핵심 방향'
        },
        'vibe_social_style': {
          label: '👥 사교 스타일',
          hint: '→ 오픈/프라이빗 공간 비율'
        },
        'vibe_change_attitude': {
          label: '🔄 변화에 대한 태도',
          hint: '→ 유연한 공간 vs 고정 구조'
        },
      }
      
      for (const [qId, answer] of Object.entries(personality.answers)) {
        const detail = answerDetails[qId] || { label: qId, hint: '' }
        prompt += `\n${detail.label}\n  → 고객 선택: "${answer}"\n  ${detail.hint}\n`
      }
    }
    
    // ✅ Vibe 데이터 상세 추가
    if (personality.vibeData) {
      const { mbti, bloodType, birthdate } = personality.vibeData
      if (mbti || bloodType || birthdate) {
        prompt += '\n**[나답게 모드 - MBTI/혈액형 분석 (반드시 조합하여 해석!)]**\n'
        if (mbti) {
          prompt += `\n🧬 MBTI: ${mbti}\n`
          prompt += `  - ${mbti[0] === 'I' ? 'I(내향): 개인 공간 중시, 조용한 환경' : 'E(외향): 오픈 구조, 활기찬 분위기'}\n`
          prompt += `  - ${mbti[1] === 'N' ? 'N(직관): 분위기/감성 중시, 독특한 디자인' : 'S(감각): 실용성/기능 중시'}\n`
          prompt += `  - ${mbti[2] === 'T' ? 'T(사고): 효율/동선 중시, ROI 고려' : 'F(감정): 편안함/감성 중시'}\n`
          prompt += `  - ${mbti[3] === 'J' ? 'J(판단): 체계적 수납, 정돈된 공간' : 'P(인식): 유연한 공간, 다용도'}\n`
        }
        if (bloodType) {
          const bloodDesc: Record<string, string> = {
            'A': '꼼꼼함 → 마감 디테일 중요, 줄눈/코너 처리 민감',
            'B': '창의적 → 독특한 포인트, 남들과 다른 디자인',
            'O': '실용적 → 기능성 우선, 가성비 중시, 관리 편의',
            'AB': '개성적 → 자기만의 스타일, 트렌드보다 취향'
          }
          prompt += `\n🩸 혈액형: ${bloodType}형\n`
          prompt += `  - ${bloodDesc[bloodType] || ''}\n`
        }
        if (mbti && bloodType) {
          prompt += `\n⭐ MBTI + 혈액형 조합 해석:\n`
          prompt += `  → "${mbti} + ${bloodType}형" 조합의 특성을 고려하여 분석하세요!\n`
        }
        if (birthdate) {
          prompt += `\n📅 생년월일: ${birthdate}\n`
        }
      }
    }
  }

  prompt += `

## 🎯 분석 지시사항 (V3.1 설계서 기준)

위 정보를 바탕으로 **고객이 "와, 어떻게 나를 이렇게 잘 알지?!"라고 감탄하는** 분석을 해주세요.

### V3.1 설계서 핵심 원칙
> 입력(Input)에서 바로 공정(Action)으로 뛰지 말 것.
> 반드시 **Trait → Needs → Resolution → Action**의 단계적 사고를 거친다.

분석 구조:
1. **Trait 분석**: 고객의 질문 답변에서 성향 축(안전 민감도, 수납 필요도, 정리 스트레스 등)을 파악
2. **Needs 도출**: Trait과 집 상태를 기반으로 해결 과제(안전성 강화, 수납 강화, 동선 최적화 등) 정의
3. **Resolution**: Needs 간 충돌 해결 및 우선순위 조정
4. **Action**: Needs → 공정/옵션 매핑 및 정리 이유 설명 (추천이 아닌 정리)

설명 구조 (V3.1 설계서 기준):
1. **고객 상황 요약**: "30대 3인 가족, 25평 아파트에 거주 중이시고, 영유아가 있어 안전과 수납이 동시에 중요한 상황입니다."
2. **Needs 분석**: "질문 답변을 바탕으로 '안전성 강화'와 '수납 강화' Needs가 강하게 나타났습니다."
3. **조정 내용(Resolution)**: "짐은 많지만 집은 가볍게 보이길 원하셔서, 눈에 보이지 않는 히든 수납 위주로 설계했습니다."
4. **공정 정리 이유**: "욕실은 미끄럼 위험이 커서 미끄럼 방지 타일과 안전 손잡이를 필수로 정리했고, 거실에는 벽면 전체를 수납으로 쓰되 문선과 색을 맞춰 시각적으로 깔끔하게 처리했습니다."

설명 톤: 과장 없이, **진단→결론** 구조로.
- ❌ "~하실 수 있습니다" (불확실한 표현)
- ✅ "~이 필요합니다" / "~이 더 좋습니다" (전문가 어조)

### ⚠️ 필수 체크리스트
1. ✅ 고객이 선택한 성향 답변을 최소 3개 이상 언급했는가?
2. ✅ "힐링 분위기를 선택하셨네요" 처럼 고객 선택을 구체적으로 언급했는가?
3. ✅ MBTI/혈액형이 있다면 조합하여 해석했는가?
4. ✅ 가족 구성(아이/반려동물/고령자 등)을 반영했는가?
5. ✅ 평범한 일반론이 아닌, 이 고객에게만 해당되는 맞춤 분석인가?

### 💬 말투 예시
❌ "주방은 효율적인 동선이 중요합니다"
✅ "요리하면서 거실 TV 보시는 거 좋아하실 것 같은데요! ㄱ자형이면 고개만 돌려도 거실이 보여요"

❌ "편안한 분위기를 원하시는군요"  
✅ "'힐링' 분위기를 선택하셨네요. 퇴근하고 현관문 열자마자 '아, 집이다' 하고 어깨 힘이 풀리는 그 느낌이시죠? 완전 공감해요!"

JSON 형식으로 응답해주세요.`

  return prompt
}

// 공정별 예상 예산 범위 (만원, 30평 기준)
const PROCESS_BUDGET_RANGES: Record<string, { min: number; max: number; label: string }> = {
  '주방': { min: 400, max: 1200, label: '주방' },
  '욕실': { min: 300, max: 900, label: '욕실' },
  '거실': { min: 200, max: 600, label: '거실' },
  '안방': { min: 150, max: 400, label: '안방' },
  '방': { min: 100, max: 300, label: '방' },
  '현관': { min: 100, max: 300, label: '현관' },
  '발코니': { min: 150, max: 400, label: '발코니' },
}

// 선택된 공간에 따른 예산 범위 계산
function calculateBudgetRange(selectedSpaces: string[], pyeong: number): { min: number; max: number } {
  const pyeongFactor = pyeong / 30 // 30평 기준 대비 비율
  
  let totalMin = 0
  let totalMax = 0
  
  selectedSpaces.forEach(space => {
    // 공간명 매핑
    let key = space
    if (space === '주방' || space.includes('주방') || space.includes('kitchen')) key = '주방'
    else if (space === '욕실' || space.includes('욕실') || space.includes('bathroom')) key = '욕실'
    else if (space === '거실' || space.includes('거실') || space.includes('living')) key = '거실'
    else if (space.includes('안방') || space.includes('master')) key = '안방'
    else if (space.includes('방') || space.includes('room')) key = '방'
    else if (space === '현관' || space.includes('현관') || space.includes('entrance')) key = '현관'
    else if (space === '발코니' || space.includes('발코니') || space.includes('balcony')) key = '발코니'
    
    const range = PROCESS_BUDGET_RANGES[key]
    if (range) {
      totalMin += Math.round(range.min * pyeongFactor)
      totalMax += Math.round(range.max * pyeongFactor)
    }
  })
  
  // 기본 최소값 설정
  if (totalMin === 0) {
    totalMin = 200
    totalMax = 500
  }
  
  return { min: totalMin, max: totalMax }
}

// 기본 분석 결과 생성 (AI 응답 파싱 실패 시) - 정밀 버전
function createDefaultAnalysis(data: CompleteAnalysisRequest) {
  const { spaceInfo, selectedSpaces, detailOptions, personality, tierSelections } = data
  const pyeong = spaceInfo?.pyeong || 30
  
  // 선택 공정 기반 예산 범위 계산
  const budgetRange = calculateBudgetRange(selectedSpaces, pyeong)
  
  // ✅ MBTI 기반 성향 분석
  const mbti = personality?.vibeData?.mbti || ''
  const bloodType = personality?.vibeData?.bloodType || ''
  
  // MBTI 특성 매핑
  const mbtiTraits: Record<string, { style: string; priority: string; description: string }> = {
    'ISTJ': { style: '클래식 모던', priority: '체계적인 수납', description: '정돈되고 기능적인 공간을 중시하시는' },
    'ISFJ': { style: '내추럴 워밍', priority: '가족 중심 편안함', description: '따뜻하고 아늑한 분위기를 선호하시는' },
    'INFJ': { style: '미니멀 젠', priority: '조용한 개인 공간', description: '고요하고 영감을 주는 공간을 원하시는' },
    'INTJ': { style: '모던 미니멀', priority: '효율적 동선', description: '합리적이고 효율적인 공간을 추구하시는' },
    'ISTP': { style: '인더스트리얼', priority: '실용적 기능', description: '실용적이고 손쉬운 관리를 원하시는' },
    'ISFP': { style: '보헤미안 내추럴', priority: '감성적 분위기', description: '자유롭고 예술적인 공간을 꿈꾸시는' },
    'INFP': { style: '드리미 내추럴', priority: '힐링 공간', description: '감성적이고 치유되는 공간을 원하시는' },
    'INTP': { style: '스칸디나비안', priority: '집중 환경', description: '깔끔하고 사색하기 좋은 공간을 선호하시는' },
    'ESTP': { style: '모던 럭셔리', priority: '트렌디함', description: '활기차고 세련된 공간을 원하시는' },
    'ESFP': { style: '팝 모던', priority: '즐거운 분위기', description: '밝고 활기찬 분위기를 좋아하시는' },
    'ENFP': { style: '에클레틱', priority: '개성 표현', description: '창의적이고 유니크한 공간을 원하시는' },
    'ENTP': { style: '컨템포러리', priority: '변화 가능성', description: '트렌디하고 유연한 공간을 선호하시는' },
    'ESTJ': { style: '클래식 모던', priority: '정돈된 공간', description: '깔끔하고 체계적인 공간을 중시하시는' },
    'ESFJ': { style: '코지 패밀리', priority: '가족 화합', description: '따뜻한 가족 공간을 꿈꾸시는' },
    'ENFJ': { style: '엘레강스', priority: '손님 환대', description: '품격 있고 환영하는 분위기를 원하시는' },
    'ENTJ': { style: '럭셔리 모던', priority: '성공 표현', description: '세련되고 성취감을 주는 공간을 원하시는' },
  }
  
  // 기본값 설정
  let style = '모던 내추럴'
  let lifestyle = '편안하면서도 세련된 공간을 원하시는 고객님'
  const priorities: string[] = []
  
  // MBTI가 있으면 적용
  if (mbti && mbtiTraits[mbti]) {
    const trait = mbtiTraits[mbti]
    style = trait.style
    lifestyle = `${trait.description} 고객님`
    priorities.push(trait.priority)
  }
  
  // 혈액형 특성 추가
  if (bloodType) {
    const bloodTraits: Record<string, string> = {
      'A': '꼼꼼한 마감 품질',
      'B': '독특한 포인트 연출',
      'O': '실용적인 동선',
      'AB': '개성 있는 디자인'
    }
    if (bloodTraits[bloodType]) {
      priorities.push(bloodTraits[bloodType])
    }
  }
  
  // ✅ 성향분석 답변 심층 해석
  if (personality?.answers) {
    const answers = personality.answers
    
    // 퇴근 후 첫 장면 - 라이프스타일 핵심
    const firstScene = answers['quick_first_scene']
    if (firstScene) {
      const sceneMap: Record<string, { lifestyle: string; priority: string }> = {
        'cozy_lighting': { lifestyle: '하루의 피로를 따뜻한 조명과 함께 녹이고 싶으신', priority: '분위기 조명' },
        'clean_space': { lifestyle: '깨끗하게 정돈된 공간에서 마음의 여유를 찾으시는', priority: '정돈된 수납' },
        'family_gathering': { lifestyle: '가족과 함께하는 시간이 가장 소중하신', priority: '가족 공간' },
        'personal_hobby': { lifestyle: '자신만의 취미 시간을 소중히 여기시는', priority: '개인 공간' },
        'cooking': { lifestyle: '요리하며 일상의 스트레스를 푸시는', priority: '주방 기능성' },
      }
      if (sceneMap[firstScene]) {
        lifestyle = `${sceneMap[firstScene].lifestyle} 고객님`
        if (!priorities.includes(sceneMap[firstScene].priority)) {
          priorities.unshift(sceneMap[firstScene].priority)
        }
      }
    }
    
    // 절대 타협 안 할 것 - 최우선 순위
    const noCompromise = answers['quick_no_compromise']
    if (noCompromise) {
      const compromiseMap: Record<string, string> = {
        'natural_light': '자연광이 가득한 공간',
        'lighting': '분위기 연출 조명',
        'storage': '넉넉한 수납공간',
        'finish_quality': '프리미엄 마감재',
        'flow': '효율적인 생활 동선',
        'soundproof': '조용한 프라이버시'
      }
      if (compromiseMap[noCompromise] && !priorities.includes(compromiseMap[noCompromise])) {
        priorities.unshift(compromiseMap[noCompromise])
      }
    }
    
    // 원하는 집 분위기 - 스타일 결정
    const atmosphere = answers['quick_atmosphere']
    if (atmosphere) {
      const atmMap: Record<string, string> = {
        'healing': '힐링 내추럴',
        'focus': '미니멀 모던',
        'family': '웜 패밀리',
        'leisure': '호텔 라운지',
        'success': '럭셔리 모던',
        'unique': '에클레틱 모던'
      }
      if (atmMap[atmosphere]) {
        style = atmMap[atmosphere]
      }
    }
  }
  
  // 가족 구성에 따른 추가 분석
  const lifestyleTags = spaceInfo?.lifestyleTags || []
  
  if (lifestyleTags.includes('kids')) {
    lifestyle = `아이와 함께 성장하는 공간을 꿈꾸시는, ${lifestyle}`
    priorities.push('아이 안전')
    priorities.push('청소 용이성')
    if (style === '모던 내추럴') style = '패밀리 내추럴'
  }
  
  if (lifestyleTags.includes('pets')) {
    lifestyle = `반려동물과 행복한 일상을 보내시는, ${lifestyle}`
    priorities.push('스크래치 방지')
    priorities.push('청소 용이한 마감')
  }
  
  if (lifestyleTags.includes('wfh')) {
    priorities.push('홈오피스 공간')
    priorities.push('집중 환경')
  }
  
  // 기본 우선순위 채우기
  if (priorities.length < 3) {
    const defaultPriorities = ['깔끔한 마감', '효율적 수납', '편안한 분위기']
    for (const p of defaultPriorities) {
      if (priorities.length >= 3) break
      if (!priorities.includes(p)) priorities.push(p)
    }
  }
  
  // ✅ 예산에 따른 등급 추천 (더 상세한 이유)
  let recommendedGrade = 'argen'
  let budgetReason = ''
  
  if (spaceInfo?.budget === 'low' || spaceInfo?.budget === 'range_1000_2000') {
    recommendedGrade = 'basic'
    budgetReason = `${pyeong}평 기준 예상 ${budgetRange.min}~${budgetRange.max}만원대입니다. 실속형은 가성비 좋은 국산 브랜드로 구성하여 품질 대비 합리적인 가격을 실현합니다. 특히 눈에 잘 띄지 않는 부분은 실속형으로, 매일 만지는 손잡이나 수전 같은 부분만 업그레이드하면 만족도가 높아요.`
  } else if (spaceInfo?.budget === 'high' || spaceInfo?.budget === 'premium' || spaceInfo?.budget === 'range_6000_plus') {
    recommendedGrade = 'premium'
    budgetReason = `프리미엄을 선택하시면 수입 브랜드와 최고급 마감재로 품격 있는 공간을 완성할 수 있습니다. 특히 주방 상판(카이저스톤), 욕실 도기(듀라빗) 같은 핵심 아이템에서 확실한 차이를 느끼실 수 있어요.`
  } else if (spaceInfo?.budget === 'range_3000_4000' || spaceInfo?.budget === 'range_4000_5000') {
    recommendedGrade = 'argen'
    budgetReason = `고객님의 "${priorities[0]}" 우선순위를 고려하면, 아르젠 등급이 가장 적합합니다. 아르젠은 핵심 품목(싱크대, 붙박이장)을 맞춤 제작하고, LX지인/동화 같은 국내 프리미엄 브랜드로 구성하여 가성비와 품질을 모두 잡습니다.`
  } else {
    recommendedGrade = 'standard'
    budgetReason = `표준형은 검증된 브랜드의 기본 라인업으로 구성됩니다. 대부분의 고객님들이 만족하시는 등급이며, 필요한 부분만 선택적으로 업그레이드하시면 됩니다.`
  }
  
  // ✅ 공간별 정밀 분석
  const detailedSpaceAnalysis = selectedSpaces.map(space => {
    // 주방 분석
    if (space === '주방' || space.includes('주방') || space.includes('kitchen')) {
      const kitchenType = detailOptions?.주방옵션?.형태 || 'ㄱ자'
      return {
        space: '주방',
        recommendation: `${kitchenType}형 주방으로 효율적인 동선을 구성합니다. ${lifestyleTags.includes('cooking') ? '요리를 좋아하시니 작업대 공간을 넉넉하게 확보하고, 상판은 열에 강한 엔지니어드스톤을 추천드려요.' : '실용적인 동선으로 최소한의 움직임으로 요리할 수 있도록 설계합니다.'}`,
        tips: [
          '싱크볼 위치는 창가 근처가 환기에 유리해요',
          '상부장 아래 LED 조명 설치하면 조리 시 그림자 없이 편해요'
        ],
        estimatedImpact: '요리 시간 단축 및 주방 스트레스 감소'
      }
    }
    
    // 욕실 분석
    if (space === '욕실' || space.includes('욕실') || space.includes('bathroom')) {
      const bathroomStyle = detailOptions?.욕실옵션?.스타일 || '모던'
      return {
        space: '욕실',
        recommendation: `${bathroomStyle} 스타일의 호텔급 욕실을 구성합니다. ${lifestyleTags.includes('kids') ? '아이가 있으시니 미끄럼 방지 타일과 둥근 모서리 세면대를 추천드려요.' : '매일 사용하는 공간인 만큼 관리 편의성과 분위기 모두 잡아드릴게요.'}`,
        tips: [
          '변기 뒤 벽면 타일은 어두운 색으로 하면 오염이 덜 보여요',
          '환풍기는 온풍 기능 있는 제품으로 겨울에도 따뜻해요'
        ],
        estimatedImpact: '아침 루틴 시간 단축 및 청소 부담 감소'
      }
    }
    
    // 거실 분석
    if (space === '거실' || space.includes('거실') || space.includes('living')) {
      return {
        space: '거실',
        recommendation: `가족이 모이는 중심 공간으로, 넓은 동선과 충분한 수납을 고려하여 설계합니다. ${mbti?.includes('I') ? '조용히 휴식하기 좋은 아늑한 코너를 만들어드릴게요.' : '가족이 함께 모여 대화하기 좋은 열린 구조로 설계합니다.'}`,
        tips: [
          'LED 간접조명(3000K 색온도)으로 따뜻한 분위기 연출',
          '수납형 TV장으로 리모컨/소품 정리'
        ],
        estimatedImpact: '퇴근 후 바로 릴랙스되는 힐링 공간'
      }
    }
    
    // 안방
    if (space === '안방' || space.includes('안방') || space.includes('master')) {
      return {
        space: '안방',
        recommendation: `편안한 수면을 위한 차분한 색감으로 구성합니다. ${mbti?.includes('I') ? '완벽한 프라이버시와 고요함을 위해 방음 및 암막 커튼을 고려해보세요.' : '부부가 함께 휴식하기 좋은 로맨틱한 분위기를 연출합니다.'}`,
        tips: [
          '붙박이장은 슬라이딩보다 여닫이가 수납력이 20% 높아요',
          '침대 헤드 뒤 간접조명으로 독서등 대체 가능'
        ],
        estimatedImpact: '수면의 질 향상 및 아침 기상 컨디션 개선'
      }
    }
    
    // 현관
    if (space === '현관' || space.includes('현관') || space.includes('entrance')) {
      return {
        space: '현관',
        recommendation: '집의 첫인상을 결정하는 공간으로, 신발장과 조명에 집중 투자합니다.',
        tips: [
          '센서등 설치로 양손에 짐 들고 들어와도 편리해요',
          '현관 타일은 포세린이 청소 쉽고 오래가요'
        ],
        estimatedImpact: '외출/귀가 시 기분 좋은 첫 순간'
      }
    }
    
    // 발코니
    if (space === '발코니' || space.includes('발코니') || space.includes('balcony')) {
      return {
        space: '발코니',
        recommendation: '다용도 공간으로 활용할 수 있도록 설계합니다. 확장형이라면 단열에 특히 신경 써야 해요.',
        tips: [
          '창호는 로이유리+아르곤가스 충진으로 단열 극대화',
          '빨래 건조대 위치는 직사광선 피하는 곳으로'
        ],
        estimatedImpact: '겨울 난방비 절감 및 다용도 공간 확보'
      }
    }
    
    // 기본
    return {
      space,
      recommendation: `${space} 공간을 선택하신 옵션에 맞게 최적화합니다.`,
      tips: ['현장 실측 후 맞춤 설계', '자재 샘플 직접 확인 추천'],
      estimatedImpact: '생활 편의성 향상'
    }
  })
  
  // ✅ 구체적인 절약 팁
  const savingTips = [
    '비수기(3-4월, 9-10월) 시공 시 인건비 10-15% 절감 가능',
    '조명/스위치는 직접 구매 후 설치만 의뢰하면 30% 절약',
    '타일 줄눈은 회색 계열로 하면 코팅 비용 절감 + 관리 편함'
  ]
  
  if (pyeong >= 35) {
    savingTips.push(`${pyeong}평 이상은 자재 대량 구매 협상으로 추가 할인 가능`)
  }
  
  // ✅ 실질적인 주의사항
  const warnings = [
    `시공 기간 약 ${Math.ceil(pyeong / 8) + 2}주 예상 - 임시 거처 미리 알아보세요`,
    '계약서에 추가 공사 시 단가 기준 명시해달라고 요청하세요'
  ]
  
  if (selectedSpaces.some(s => s.includes('욕실') || s.includes('bathroom'))) {
    warnings.push('욕실 방수는 바닥+벽 30cm까지 필수, 반드시 테스트 확인하세요')
  }
  
  if (selectedSpaces.some(s => s.includes('주방') || s.includes('kitchen'))) {
    warnings.push('싱크대 상판 시공 후 10일간은 무거운 것 올려놓지 마세요')
  }
  
  // ✅ 바이브 모드일 때만 MBTI/혈액형 표시
  const isVibeMode = personality?.mode === 'vibe'
  const personalityTag = isVibeMode && (mbti || bloodType) 
    ? ` (${mbti ? mbti + ' ' : ''}${bloodType ? bloodType + '형' : ''})`
    : ''
  
  // ✅ 집값 방어 점수 계산
  const calculateHomeValueScore = () => {
    let score = 3 // 기본 3점
    
    // 공간 수에 따른 가산
    if (selectedSpaces.length >= 3) score += 0.5
    
    // 주방/욕실 포함 시 가산 (매도 시 가장 중요)
    const hasKitchen = selectedSpaces.some(s => s.includes('주방') || s.includes('kitchen'))
    const hasBathroom = selectedSpaces.some(s => s.includes('욕실') || s.includes('bathroom'))
    if (hasKitchen) score += 0.5
    if (hasBathroom) score += 0.5
    
    // 프리미엄/아르젠 등급 시 가산
    if (recommendedGrade === 'premium') score += 0.5
    if (recommendedGrade === 'argen') score += 0.3
    
    return Math.min(5, Math.max(1, Math.round(score)))
  }
  
  const homeValueScore = calculateHomeValueScore()
  const monthlyEquivalent = Math.round(budgetRange.max / 120) // 10년 기준
  
  // ✅ 생활 개선 점수 계산
  const calculateLifestyleScores = () => {
    let storage = 60, cleaning = 60, flow = 60
    
    // 공간별 점수 조정
    if (selectedSpaces.some(s => s.includes('주방'))) {
      storage += 15
      cleaning += 10
      flow += 10
    }
    if (selectedSpaces.some(s => s.includes('욕실'))) {
      cleaning += 15
      storage += 5
    }
    if (selectedSpaces.some(s => s.includes('드레스룸') || s.includes('수납'))) {
      storage += 20
    }
    if (selectedSpaces.some(s => s.includes('거실'))) {
      flow += 15
      cleaning += 5
    }
    if (selectedSpaces.some(s => s.includes('현관'))) {
      flow += 10
      storage += 10
    }
    
    return {
      storage: Math.min(100, storage),
      cleaning: Math.min(100, cleaning),
      flow: Math.min(100, flow),
      comment: storage >= 80 ? '수납공간이 크게 개선됩니다!' :
               cleaning >= 80 ? '청소가 훨씬 편해집니다!' :
               flow >= 80 ? '생활 동선이 획기적으로 개선됩니다!' :
               '전반적인 생활 품질이 향상됩니다.'
    }
  }
  
  const lifestyleScores = calculateLifestyleScores()
  
  // ✅ 선택한 공간에 맞는 요약 문구 생성
  const spaceNames = selectedSpaces.map(s => {
    if (s.includes('kitchen') || s === '주방') return '주방'
    if (s.includes('bathroom') || s === '욕실') return '욕실'
    if (s.includes('living') || s === '거실') return '거실'
    if (s.includes('master') || s === '안방') return '안방'
    if (s.includes('room') || s.includes('방')) return '방'
    if (s.includes('entrance') || s === '현관') return '현관'
    if (s.includes('balcony') || s === '발코니') return '발코니'
    return s
  })
  const uniqueSpaceNames = [...new Set(spaceNames)]
  const spaceListText = uniqueSpaceNames.slice(0, 3).join(', ') + (uniqueSpaceNames.length > 3 ? ` 외 ${uniqueSpaceNames.length - 3}개` : '')
  
  // ✅ 최종 결과
  return {
    summary: `${pyeong}평 ${spaceInfo?.housingType || '아파트'}의 **${spaceListText}** 공간 리모델링을 분석했습니다. ${lifestyle}${personalityTag}`,
    customerProfile: {
      lifestyle,
      priorities: priorities.slice(0, 3),
      style
    },
    homeValueScore: {
      score: homeValueScore,
      reason: homeValueScore >= 4 
        ? '주방/욕실 전면 교체는 매도 시 가장 큰 가치 상승 요인입니다. 장기적으로 훌륭한 투자입니다!'
        : homeValueScore >= 3
        ? '선택하신 공간들은 집값 유지에 도움이 됩니다. 적절한 투자입니다.'
        : '기본적인 보수로 실용성 중심의 인테리어입니다.',
      investmentValue: `10년 거주 시 월 비용 환산 약 ${monthlyEquivalent}만원으로 ${monthlyEquivalent <= 20 ? '매우 합리적' : monthlyEquivalent <= 30 ? '적절한' : '투자 가치 있는'} 수준입니다.`
    },
    lifestyleScores,
    spaceAnalysis: detailedSpaceAnalysis,
    budgetAdvice: {
      grade: recommendedGrade,
      reason: budgetReason,
      savingTips
    },
    warnings,
    nextSteps: [
      '견적서에서 브랜드별 가격 비교해보기',
      '아르젠 쇼룸 방문하여 실제 마감재 질감 확인',
      '시공 일정 및 임시 거처 계획 세우기'
    ]
  }
}

