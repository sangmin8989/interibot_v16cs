# V5 구현 참고 자료

> **작성 일시**: 2025-01-21  
> **목적**: V5 로직 구현을 위한 정확한 코드 및 구조 정보

---

## 1️⃣ generateQuestion() 실제 전체 코드

**파일**: `lib/analysis/v5-ultimate/question-engine.ts`

```typescript
export async function generateQuestion(
  messages: ChatMessage[],
  photoAnalysis: PhotoAnalysisResult | null,
  styleResult?: { styleTag?: string; keywords?: string[] } | null,
  spaceInfo?: {
    housingType?: string;
    pyeong?: number;
    rooms?: number;
    bathrooms?: number;
  } | null
): Promise<{ question: string; quickReplies: string[] } | null> {
  const userMessages = messages.filter(m => m.role === 'user');
  
  // 5개 질문 완료 체크
  if (userMessages.length >= 5) {
    return null;
  }
  
  // 첫 질문은 고정 질문 세트로 봉인 (AI 호출 없음)
  if (userMessages.length === 0) {
    return getFixedFirstQuestions();
  }
  
  // 누락된 정보 파악 (실제 데이터 기반)
  const missingInfo = analyzeMissingInfo(messages, photoAnalysis, spaceInfo, styleResult);
  const missingInfoText = formatMissingInfo(missingInfo);
  
  // 모든 정보 수집 완료
  if (missingInfoText === '모든 정보 수집 완료') {
    return null;
  }
  
  // 대화 내용 요약
  const conversationSummary = messages
    .map(m => `${m.role === 'user' ? '고객' : '상담사'}: ${m.content}`)
    .join('\n');
  
  // user 프롬프트: 현재 상황과 대화 내역 전달
  const userPrompt = `[고객 집 정보]
${spaceInfo ? `
- 주거형태: ${spaceInfo.housingType || '미입력'}
- 평수: ${spaceInfo.pyeong || '미입력'}평
- 방: ${spaceInfo.rooms || '미입력'}개
- 화장실: ${spaceInfo.bathrooms || '미입력'}개
` : '집 정보 미입력'}

${styleResult?.styleTag ? `[선택한 스타일]: ${styleResult.styleTag}` : ''}

[대화 내역]
${conversationSummary || '아직 대화 시작 전 - 첫 질문 생성해주세요'}

${photoAnalysis ? `[사진 분석 결과]\n공간: ${photoAnalysis.spaceType}` : ''}

질문 수: ${userMessages.length}/5
다음 질문을 자연스럽게 생성해주세요.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: TONE_LOCKED_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7, // 첫 질문 제외한 나머지 질문에 적용 (다양성 확보)
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('질문 생성 실패');
    }

    // JSON 파싱
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON 파싱 실패');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.question || !Array.isArray(parsed.quickReplies)) {
      throw new Error('질문 형식 오류');
    }

    return {
      question: parsed.question,
      quickReplies: parsed.quickReplies
    };

  } catch (error) {
    console.error('질문 엔진 에러:', error);
    // Fallback: 기본 질문 템플릿 사용 (첫 질문 제외)
    if (userMessages.length === 0) {
      // 첫 질문은 이미 고정 질문으로 처리되었으므로 여기 도달하지 않아야 함
      // 안전장치: 고정 질문 반환
      return getFixedFirstQuestions();
    }
    return getFallbackQuestion(userMessages.length, photoAnalysis);
  }
}
```

---

## 2️⃣ generateQuestion()의 최종 return shape

**실제 사용하는 형태**:

```typescript
return {
  question: string;
  quickReplies: string[];
}
```

**또는 null** (질문 완료 시):

```typescript
return null;
```

**타입 정의**:
```typescript
Promise<{ question: string; quickReplies: string[] } | null>
```

**확인 위치**: 
- `lib/analysis/v5-ultimate/question-engine.ts:173`
- `app/api/v5/generate-question/route.ts:36-53`

---

## 3️⃣ OpenAI 질문 생성 부분 코드

**위치**: `lib/analysis/v5-ultimate/question-engine.ts:219-234`

**실제 코드 블록**:

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: TONE_LOCKED_SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: userPrompt
    }
  ],
  max_tokens: 300,
  temperature: 0.7, // 첫 질문 제외한 나머지 질문에 적용 (다양성 확보)
});
```

**사용하는 OpenAI 클라이언트**:
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

**위치**: `lib/analysis/v5-ultimate/question-engine.ts:8-13`

**주의사항**:
- `callAIWithLimit` 같은 wrapper 함수를 사용하지 않음
- 직접 `openai.chat.completions.create()` 호출
- 에러 발생 시 `getFallbackQuestion()` 사용

---

## 4️⃣ 현재 질문 흐름에서 쓰는 핵심 변수명

| 개념 | 실제 변수명 | 타입 | 위치 |
|------|------------|------|------|
| 누적 메시지 | `messages` | `ChatMessage[]` | 함수 파라미터 |
| 사용자 메시지만 필터링 | `userMessages` | `ChatMessage[]` | 함수 내부 (`messages.filter(m => m.role === 'user')`) |
| 사진 분석 | `photoAnalysis` | `PhotoAnalysisResult \| null` | 함수 파라미터 |
| 스타일 결과 | `styleResult` | `{ styleTag?: string; keywords?: string[] } \| null` | 함수 파라미터 |
| 공간 정보 | `spaceInfo` | `{ housingType?: string; pyeong?: number; rooms?: number; bathrooms?: number; } \| null` | 함수 파라미터 |
| 대화 요약 | `conversationSummary` | `string` | 함수 내부 |
| 누락 정보 | `missingInfo` | `MissingInfo` | 함수 내부 |
| 누락 정보 텍스트 | `missingInfoText` | `string` | 함수 내부 |
| 사용자 프롬프트 | `userPrompt` | `string` | 함수 내부 |

**함수 시그니처**:
```typescript
export async function generateQuestion(
  messages: ChatMessage[],                    // ← 누적 메시지
  photoAnalysis: PhotoAnalysisResult | null, // ← 사진 분석
  styleResult?: { styleTag?: string; keywords?: string[] } | null, // ← 스타일 결과
  spaceInfo?: {                              // ← 공간 정보
    housingType?: string;
    pyeong?: number;
    rooms?: number;
    bathrooms?: number;
  } | null
): Promise<{ question: string; quickReplies: string[] } | null>
```

---

## 5️⃣ 질문 생성이 호출되는 위치

### 호출 경로

```
app/api/v5/generate-question/route.ts (POST)
  └─> generateQuestion(chatMessages, photoAnalysis, styleResult, spaceInfo)
      └─> lib/analysis/v5-ultimate/question-engine.ts
```

### 실제 호출 코드

**파일**: `app/api/v5/generate-question/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      messages, 
      photoAnalysis,
      styleResult,
      spaceInfo
    }: { 
      messages: ChatMessage[]; 
      photoAnalysis: PhotoAnalysisResult | null;
      styleResult?: { styleTag?: string; keywords?: string[] } | null;
      spaceInfo?: {
        housingType?: string;
        pyeong?: number;
        rooms?: number;
        bathrooms?: number;
      } | null;
    } = body;

    // messages가 없거나 빈 배열이면 초기 질문 생성
    const chatMessages = messages || [];

    // 질문 엔진 호출 (spaceInfo 전달)
    const result = await generateQuestion(chatMessages, photoAnalysis, styleResult, spaceInfo);

    if (!result) {
      // 모든 질문 완료
      return NextResponse.json({
        success: true,
        question: null,
        quickReplies: [],
        isComplete: true
      });
    }

    return NextResponse.json({
      success: true,
      question: result.question,
      quickReplies: result.quickReplies,
      isComplete: false
    });

  } catch (error) {
    console.error('질문 생성 에러:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 에러'
    }, { status: 500 });
  }
}
```

### 프론트엔드 호출 위치

**파일**: `components/v5-ultimate/ChatOnboarding.tsx`

```typescript
const response = await fetch('/api/v5/generate-question', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages,
    photoAnalysis,
    styleResult,
    spaceInfo: spaceInfo ? {
      housingType: spaceInfo.housingType,
      pyeong: spaceInfo.pyeong,
      rooms: spaceInfo.rooms,
      bathrooms: spaceInfo.bathrooms,
    } : null,
  }),
});
```

### 재귀/재호출 설계 시 주의사항

1. **무한루프 방지**:
   - `generateQuestion` 내부에서 자기 자신을 호출하지 않음
   - API route에서만 호출됨
   - 재귀 호출 시 `forceReplan` 같은 플래그 필요

2. **호출 체인**:
   ```
   ChatOnboarding.tsx
     └─> POST /api/v5/generate-question
         └─> generateQuestion()
   ```
   - 다른 엔진을 거치지 않음
   - API route에서 바로 호출

3. **재호출 가능 위치**:
   - `generateQuestion` 함수 내부 (V5 로직 추가 시)
   - API route 내부 (에러 처리 시)

---

## 📌 추가 참고 정보

### 타입 정의 위치

**파일**: `lib/analysis/v5-ultimate/types.ts`

```typescript
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PhotoAnalysisResult {
  spaceType: SpaceType;
  detectedStyle: StyleType;
  colorPalette: string[];
  organizationScore: number;
  furnitureDensity: FurnitureDensity;
  lightingType: LightingType;
  inferredTags: AllTags[];
  hiddenNeeds: string[];
  lifestyleHints: string[];
  confidence: number;
}
```

### Fallback 질문 함수

**위치**: `lib/analysis/v5-ultimate/question-engine.ts:275-312`

```typescript
function getFallbackQuestion(
  questionIndex: number,
  photoAnalysis: PhotoAnalysisResult | null
): { question: string; quickReplies: string[] } | null
```

---

## ✅ 검증 체크리스트

- [x] `generateQuestion()` 전체 코드 확인
- [x] Return shape 확인: `{ question: string; quickReplies: string[] } | null`
- [x] OpenAI 호출 위치 확인: `openai.chat.completions.create()` 직접 호출
- [x] 핵심 변수명 확인: `messages`, `photoAnalysis`, `styleResult`, `spaceInfo`
- [x] 호출 위치 확인: `app/api/v5/generate-question/route.ts` → `generateQuestion()`

---

**문서 끝**


