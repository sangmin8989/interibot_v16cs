/**
 * V3 설명 엔진 (ExplanationEngine)
 * 
 * AI를 사용하여 분석 결과를 자연어로 서술합니다.
 * ✅ 핵심 원칙: AI는 "새로운 판단 없이 서술만" 담당
 * 
 * 처리 흐름:
 * 1. 말투 유형 결정
 * 2. 시스템 프롬프트 생성 (역할 + 원칙 + 말투)
 * 3. 유저 프롬프트 생성 (모든 엔진 결과 요약)
 * 4. OpenAI API 호출
 * 5. 결과 파싱 및 구조화
 */

import OpenAI from 'openai'
import {
  ExplanationEngineInput,
  ExplanationEngineResult,
  ToneType
} from '../types'

// OpenAI 클라이언트는 지연 초기화 (API 키가 없을 때도 모듈 로드 가능)
let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI | null {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

export class ExplanationEngine {
  /**
   * 설명 생성 메인 함수
   */
  async analyze(input: ExplanationEngineInput): Promise<ExplanationEngineResult> {
    console.log(`💬 [ExplanationEngine] 설명 생성 시작 (${input.toneType} 말투)`)
    const startTime = Date.now()

    // OpenAI 클라이언트 가져오기
    const client = getOpenAIClient()
    
    // API 키 없으면 기본 텍스트 반환
    if (!client) {
      console.warn('⚠️ [ExplanationEngine] OpenAI API 키 없음, 기본 설명 반환')
      return this.getFallbackExplanation(input)
    }

    try {
      // 1. 프롬프트 생성
      const systemPrompt = this.buildSystemPrompt(input.toneType)
      const userPrompt = this.buildUserPrompt(input)

      // 2. OpenAI 호출
      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })

      const content = completion.choices[0].message.content || ''

      // 3. 결과 파싱
      const result = this.parseContent(content)

      const executionTime = Date.now() - startTime
      console.log(`✅ [ExplanationEngine] 설명 생성 완료 (${executionTime}ms)`)

      return result
    } catch (error) {
      console.error('❌ [ExplanationEngine] 설명 생성 오류:', error)
      return this.getFallbackExplanation(input)
    }
  }

  /**
   * 시스템 프롬프트 생성
   */
  private buildSystemPrompt(toneType: ToneType): string {
    const toneGuide = this.getToneGuide(toneType)

    return `당신은 15년 차 인테리어 컨설턴트입니다.
실제 현장 경험이 풍부한 실무자로서, 숫자와 감정을 동시에 보는 사람입니다.
고객을 위로하고 설득하는 조언자 역할을 합니다.

## 반드시 지켜야 할 원칙 (통합 설계서 기준)
1. 인테리봇 AI는 추천하지 않는다. 선택 구조를 정리하고, 후회 가능성을 낮춘다.
2. 무조건 "공감 → 이유 → 효과 → 대안" 순서로 말한다
3. "이렇게 하세요"가 아니라 "이 조건에서는 이 선택이 안전합니다"는 방식
4. 고객이 후회할 만한 선택은 부드럽지만 분명하게 경고한다
5. 예산이 낮다고 해서 고객을 깎아내리지 않는다. "지금 상황에서 가장 효과적인 선택"을 제안한다
6. ✅ 핵심: 새로운 판단을 하지 않는다. 제공된 분석 결과만을 바탕으로 설명한다.

## 절대 금지 문장
- ❌ "이걸 추천합니다"
- ❌ "이게 좋습니다"
- ❌ "가장 인기입니다"
- ❌ "강추합니다"

## 사용 문장 (표준)
- ✅ "이 조건에서는 이 선택이 안전합니다"
- ✅ "이 단계에서는 선택을 줄이는 것이 합리적입니다"
- ✅ "후회 가능성이 낮은 기준으로 정리했습니다"
- ✅ "지금 고민하시는 부분은 결과 차이가 크지 않습니다"
- ✅ "AI가 선택 범위를 정리했습니다"
- ✅ "이 집 조건에서는 이 범위가 안전합니다"

## 말투 유형
당신의 말투는 ${toneType}입니다.
${toneGuide}

## 출력 구조
다음 6개 섹션으로 답변하세요:

1. **시작 인사 + 공감** (1문단)
2. **성향 해석** (1-2문단, 12개 성향 지표 기반)
3. **공정 추천 이유** (2-3문단, 우선 공간/공정 설명)
4. **리스크 설명** (1-2문단, 발견된 리스크와 해결안)
5. **생활 시나리오** (1-2개 시나리오를 스토리로 설명)
6. **마무리** (예산 조정 제안 + 다음 단계)

각 섹션을 명확히 구분하여 작성하세요.`
  }

  /**
   * 유저 프롬프트 생성
   */
  private buildUserPrompt(input: ExplanationEngineInput): string {
    const { traitResult, processResult, riskResult, scenarioResult } = input

    const sections: string[] = []

    // 1. 성향 지표
    sections.push(`## 고객 성향 지표 (12개, 0-100점)`)
    for (const [key, value] of Object.entries(traitResult.indicators)) {
      sections.push(`- ${key}: ${value}점`)
    }
    sections.push(`\n키워드: ${traitResult.keywords.join(', ')}`)
    sections.push(`우선 문제 영역: ${traitResult.priorityAreas.join(', ')}`)
    sections.push(`생활 루틴 유형: ${traitResult.lifestyleType}`)

    // 2. 우선 공간
    sections.push(`\n## 우선 투자 공간 (우선순위 순)`)
    processResult.prioritySpaces.forEach(space => {
      sections.push(`${space.priority}순위: ${space.label} (${space.score}점) - ${space.reason}`)
    })

    // 3. 정리된 공정 (통합 설계서: 추천이 아닌 정리)
    sections.push(`\n## AI가 정리한 공정`)
    const essential = processResult.recommendedProcesses.filter(p => p.priority === 'essential')
    const recommended = processResult.recommendedProcesses.filter(p => p.priority === 'recommended')
    
    if (essential.length > 0) {
      sections.push(`### 필수 공정 (기본 진행 항목)`)
      essential.forEach(p => sections.push(`- ${p.label}: ${p.reason}`))
    }
    if (recommended.length > 0) {
      sections.push(`### 정리된 공정 (선택 범위 축소)`)
      recommended.forEach(p => sections.push(`- ${p.label}: ${p.reason}`))
    }

    // 4. 예산 등급
    sections.push(`\n예산 등급 추천: ${processResult.gradeRecommendation}`)

    // 5. 리스크
    sections.push(`\n## 리스크 (${riskResult.risks.length}개 발견)`)
    riskResult.risks.forEach((risk, index) => {
      sections.push(`${index + 1}. [${risk.level}] ${risk.title}`)
      sections.push(`   - ${risk.description}`)
      sections.push(`   - 영향: ${risk.impact}`)
      sections.push(`   - 해결: ${risk.solution1}`)
    })

    // 6. 생활 시나리오
    sections.push(`\n## 생활 시나리오 (${scenarioResult.scenarios.length}개 매칭)`)
    scenarioResult.scenarios.forEach((scenario, index) => {
      sections.push(`${index + 1}. ${scenario.title} (${scenario.category})`)
      sections.push(`   - 현재: ${scenario.current}`)
      sections.push(`   - 개선 후: ${scenario.futureWith}`)
    })

    sections.push(`\n---\n위 정보를 바탕으로, 고객에게 ${input.toneType} 말투로 설명해주세요.`)

    return sections.join('\n')
  }

  /**
   * 말투 가이드
   */
  private getToneGuide(toneType: ToneType): string {
    const guides: Record<ToneType, string> = {
      empathetic: `공감형 말투:
- "고객님이 왜 이런 선택을 고민하고 계신지 충분히 이해됩니다."
- "요즘 같은 상황에서는 누구나 비슷한 고민을 하세요."
- 고객의 감정을 먼저 읽고, 공감하는 표현을 자주 사용하세요.`,

      logical: `논리형 말투:
- "지금 상황을 데이터와 생활 패턴 기준으로 정리해보면 이렇습니다."
- "이 선택이 합리적인 이유는 세 가지로 정리할 수 있습니다."
- 숫자, 근거, 논리적 흐름을 명확히 제시하세요.`,

      direct: `직설형 말투:
- "결론부터 말씀드리겠습니다."
- "이 부분은 솔직히 지금 구조로는 비추입니다. 이유는 다음과 같습니다."
- 단도직입적이지만 무례하지 않게, 핵심만 빠르게 전달하세요.`,

      warm: `정감형 말투:
- "가족과 함께 생활하시는 공간이라 더 신경 쓰이실 것 같습니다."
- "아이(또는 부모님)를 생각하신다면 이 부분은 꼭 챙기시는 게 좋습니다."
- 따뜻하고 친근한 표현을 사용하되, 전문성을 유지하세요.`
    }

    return guides[toneType] || guides.empathetic
  }

  /**
   * 응답 파싱
   */
  private parseContent(content: string): ExplanationEngineResult {
    // 간단한 섹션 분리 (개선 가능)
    const sections = content.split('\n\n')

    return {
      summary: sections[0] || '고객님의 성향을 분석했습니다.',
      traitInterpretation: sections[1] || '',
      processRecommendation: sections[2] || '',
      riskExplanation: sections[3] || '',
      lifestyleStory: sections[4] || '',
      conclusion: sections[5] || '궁금하신 점이 있으시면 언제든 문의하세요.'
    }
  }

  /**
   * Fallback 설명 (API 실패 시)
   */
  private getFallbackExplanation(input: ExplanationEngineInput): ExplanationEngineResult {
    const { traitResult, processResult, riskResult, scenarioResult } = input

    const topIndicators = Object.entries(traitResult.indicators)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, value]) => `${key}(${value}점)`)
      .join(', ')

    return {
      summary: `고객님의 성향을 분석한 결과, ${topIndicators}가 높게 나타났습니다.`,
      traitInterpretation: `고객님은 ${traitResult.keywords.join(', ')} 특성을 가지고 계십니다. 특히 ${traitResult.priorityAreas[0]}에 대한 관심이 높으신 것으로 보입니다.`,
      processRecommendation: `이 집 조건에서는 ${processResult.prioritySpaces[0]?.label} 공간이 우선적으로 정리되었습니다. ${processResult.gradeRecommendation} 등급으로 진행하시면 안전합니다.`,
      riskExplanation: riskResult.risks.length > 0
        ? `주의하실 점은 ${riskResult.risks[0].title}입니다. ${riskResult.risks[0].solution1}`
        : '특별한 리스크는 발견되지 않았습니다.',
      lifestyleStory: scenarioResult.scenarios.length > 0
        ? `${scenarioResult.scenarios[0].title}: ${scenarioResult.scenarios[0].futureWith}`
        : '고객님의 라이프스타일에 맞는 공간이 완성될 것입니다.',
      conclusion: '상담 예약을 통해 더 자세한 견적과 플랜을 받아보세요.'
    }
  }
}

/**
 * 싱글톤 인스턴스
 */
export const explanationEngine = new ExplanationEngine()



























