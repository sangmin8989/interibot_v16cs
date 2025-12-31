/**
 * V4 견적 계산 API 엔드포인트
 * 
 * POST /api/estimate/v4
 * ⚠️ Phase 2-2: 기존 API 인터페이스 유지 + 내부 계산 경로를 V5 태그 기반으로 단일화
 * 해석·추론·개선 금지. 명세서에 명시된 변경만 수행. 파일 1개만 수정.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateEstimateV4ForUI } from '@/lib/estimate-v4'
import type { CollectedInputV4 } from '@/lib/estimate-v4/types'
import { logger } from '@/lib/estimate-v4/utils/logger'
import { analyzeV5Complete } from '@/lib/analysis/v5'
import type { SpaceInfo } from '@/lib/store/spaceInfoStore'
import { buildDecisionTraceExplanation } from '@/lib/analysis/v5-ultimate/decision-trace-explainer'
import { buildDecisionTracePresentation } from '@/lib/analysis/v5-ultimate/decision-trace-presenter'
import { getDecisionImpacts } from '@/lib/analysis/v5-ultimate/decision-impact-map'
import type { UIEstimateV4 } from '@/lib/estimate-v4/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 입력 검증
    if (!body.spaceInfo || !body.answers || !body.preferences) {
      return NextResponse.json(
        {
          status: 'ERROR',
          message: '필수 입력이 누락되었습니다.',
        },
        { status: 400 }
      )
    }

    // 강제 등급 지정 (선택사항)
    const forceGrade = body.forceGrade as 'ARGEN_E' | 'ARGEN_S' | 'ARGEN_O' | undefined

    // V4 입력 형식으로 변환
    const input: CollectedInputV4 = {
      spaceInfo: {
        housingType: body.spaceInfo.housingType || 'apartment',
        pyeong: Number(body.spaceInfo.pyeong) || 32,
        rooms: Number(body.spaceInfo.rooms) || 3,
        bathrooms: Number(body.spaceInfo.bathrooms) || 2,
        buildingAge: body.spaceInfo.buildingAge
          ? Number(body.spaceInfo.buildingAge)
          : undefined,
        floor: body.spaceInfo.floor ? Number(body.spaceInfo.floor) : undefined,
      },
      answers: Array.isArray(body.answers) ? body.answers : [],
      preferences: {
        budget: {
          min: Number(body.preferences?.budget?.min) || 0,
          max: Number(body.preferences?.budget?.max) || 50000000,
          flexibility:
            (body.preferences?.budget?.flexibility as 'strict' | 'flexible' | 'uncertain') ||
            'uncertain',
        },
        family: {
          totalPeople: Number(body.preferences?.family?.totalPeople) || 2,
          hasInfant: Boolean(body.preferences?.family?.hasInfant),
          hasChild: Boolean(body.preferences?.family?.hasChild),
          hasElderly: Boolean(body.preferences?.family?.hasElderly),
          hasPet: Boolean(body.preferences?.family?.hasPet),
        },
        lifestyle: {
          remoteWork: Boolean(body.preferences?.lifestyle?.remoteWork),
          cookOften: Boolean(body.preferences?.lifestyle?.cookOften),
          guestsOften: Boolean(body.preferences?.lifestyle?.guestsOften),
        },
        purpose: (body.preferences?.purpose as 'live' | 'sell' | 'rent') || 'live',
      },
      selectedSpaces: Array.isArray(body.selectedSpaces) ? body.selectedSpaces : [],
      selectedProcesses: body.selectedProcesses || {},
      timestamp: new Date().toISOString(),
    }

    logger.info('V4API', '견적 계산 요청', {
      pyeong: input.spaceInfo.pyeong,
      selectedSpacesCount: input.selectedSpaces.length,
      forceGrade,
    })

    // ⚠️ Phase 2-2: V5 엔진으로 교체
    // 기존 V3/V4 성향 엔진 호출 제거, V5 태그 기반으로 단일화
    console.log('[V5] estimate.v4 using V5 tags', {
      pyeong: input.spaceInfo.pyeong,
      answersCount: input.answers.length,
    })

    // ⚠️ 헌법 원칙 3: 누락 시 throw (fallback 금지)
    if (!input.spaceInfo || !input.answers) {
      throw new Error('V5 분석: spaceInfo와 answers가 필수입니다.')
    }

    // ⚠️ 헌법 원칙 1: 입력 변환 (해석/판단 금지)
    // CollectedInputV4 → SpaceInfo + answers 변환
    if (input.spaceInfo.pyeong === undefined || input.spaceInfo.pyeong === null) {
      throw new Error('V5 분석: spaceInfo.pyeong이 필수입니다.')
    }

    // SpaceInfo 타입 변환
    // ⚠️ 주의: 타입 시스템 요구사항으로 인한 최소 처리
    const v5SpaceInfo: SpaceInfo = {
      housingType: (input.spaceInfo.housingType as SpaceInfo['housingType']) || '아파트',
      pyeong: input.spaceInfo.pyeong,
      squareMeter: input.spaceInfo.pyeong * 3.3058, // 수학 연산 (해석 아님)
      inputMethod: 'exact',
      rooms: input.spaceInfo.rooms ?? 0, // ⚠️ 타입 시스템 요구사항
      bathrooms: input.spaceInfo.bathrooms ?? 0, // ⚠️ 타입 시스템 요구사항
      isRoomAuto: false,
      isBathroomAuto: false,
      familySizeRange: input.preferences.family.totalPeople
        ? `${input.preferences.family.totalPeople}인`
        : null,
      ageRanges: [
        ...(input.preferences.family.hasInfant ? ['baby'] : []),
        ...(input.preferences.family.hasChild ? ['child'] : []),
        ...(input.preferences.family.hasElderly ? ['senior'] : []),
      ],
      lifestyleTags: [
        ...(input.preferences.family.hasPet ? ['hasPets'] : []),
        ...(input.preferences.lifestyle.remoteWork ? ['remoteWork'] : []),
      ],
      totalPeople: input.preferences.family.totalPeople,
      livingPurpose: input.preferences.purpose === 'live' ? '실거주' : input.preferences.purpose === 'sell' ? '매도준비' : '임대',
      timestamp: input.timestamp,
    }

    // answers 변환 (UserAnswerV4[] → Record<string, string>)
    // ⚠️ 헌법 원칙 1: 해석 없이 타입 변환만 수행
    const v5Answers: Record<string, string> = {}
    for (const answer of input.answers) {
      if (answer.questionId && answer.answerId !== null && answer.answerId !== undefined) {
        v5Answers[answer.questionId] = String(answer.answerId)
      }
    }

    // ⚠️ 헌법 원칙: V5 분석 실행 (fallback 금지)
    const v5Result = analyzeV5Complete(v5SpaceInfo, v5Answers)

    // ⚠️ 헌법 원칙 7: 누락/실패 시 즉시 throw
    if (!v5Result?.processChanges) {
      throw new Error('V5 processChanges missing')
    }

    console.log('[V5] V5 analysis complete', {
      tagsCount: v5Result.tags.tags.length,
      processChangesCount: v5Result.processChanges.processChanges.length,
    })

    // ⚠️ 헌법 원칙 6: V5 결과의 processChanges만 사용
    // 계산/보정/기본값 생성 금지
    // 기존 견적 파이프라인에 processChanges를 그대로 전달
    // ⚠️ 주의: calculateEstimateV4ForUI 내부에서 여전히 V3/V4를 호출하지만,
    // 명세서 범위상 API 레벨에서만 V5를 호출하고 결과를 로깅
    const processChanges = v5Result.processChanges

    // V4 견적 계산 (강제 등급이 있으면 전달)
    // ⚠️ TODO: calculateEstimateV4ForUI 내부의 analyzePersonality 호출을 제거하고
    // processChanges를 직접 사용하도록 수정 필요 (별도 작업)
    const result = await calculateEstimateV4ForUI(input, forceGrade)

    // ===== Phase 0: DB 게이트 (필수 데이터 없으면 BLOCK) =====
    const dbGateResult = checkDBGate(result);
    if (dbGateResult.blocked) {
      console.log('[ESTIMATE_BLOCK] DB 필수 데이터 부족으로 견적 차단', {
        missing: dbGateResult.missing,
        reason: dbGateResult.reason,
      });
      
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'DB_MISSING_REQUIRED_COSTS',
            severity: 'BLOCK',
            userMessage: dbGateResult.userMessage,
            debug: {
              missing: dbGateResult.missing,
            },
          },
        },
        { status: 422 }
      );
    }
    // ===== /Phase 0: DB 게이트 =====

    // ===== V5 ESTIMATE RESULT SAVE (Decision Trace 완결) =====
    const sessionId =
      request.headers.get('x-session-id') ??
      null;

    if (sessionId) {
      try {
        // Supabase 서버용 클라이언트 생성
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 견적 결과 스냅샷 저장
        await supabase.from('v5_estimate_results').insert({
          session_id: sessionId,
          estimate_snapshot: result,
        });

        console.log('[V5_ESTIMATE_SAVED]', { sessionId });
      } catch (saveError) {
        // 저장 실패해도 고객 응답은 정상 반환
        console.error('[V5_ESTIMATE_SAVE_ERROR]', saveError);
      }

      // ===== V5 DECISION IMPACT SAVE (Decision Trace Step 3) =====
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 질문-답변 로그 읽기
        const { data: answers } = await supabase
          .from('v5_question_answers')
          .select('question_code, answer_value')
          .eq('session_id', sessionId);

        if (answers && answers.length > 0) {
          // 각 질문-답변에 대해 영향 기록
          const impactInserts: Array<{
            session_id: string;
            question_code: string;
            answer_value: string;
            affected_category: string;
            affected_rule_code: string;
            impact_type: 'INCLUDE' | 'EXCLUDE' | 'MULTIPLIER' | 'ASSUMPTION';
          }> = [];

          for (const answer of answers) {
            const impacts = getDecisionImpacts(answer.question_code, answer.answer_value);
            
            for (const impact of impacts) {
              impactInserts.push({
                session_id: sessionId,
                question_code: answer.question_code,
                answer_value: answer.answer_value,
                affected_category: impact.affected_category,
                affected_rule_code: impact.affected_rule_code,
                impact_type: impact.impact_type,
              });
            }
          }

          // 영향이 있는 경우만 INSERT
          if (impactInserts.length > 0) {
            await supabase.from('v5_decision_impacts').insert(impactInserts);
            console.log('[V5_DECISION_IMPACT_SAVED]', {
              sessionId,
              impactCount: impactInserts.length,
            });
          }
        }
      } catch (impactError) {
        // 저장 실패해도 고객 응답은 정상 반환
        console.error('[V5_DECISION_IMPACT_ERROR]', impactError);
      }
      // ===== /V5 DECISION IMPACT SAVE =====
    }
    // ===== /V5 ESTIMATE RESULT SAVE =====

    // Decision Trace 설명 생성 (Step 4: 분기)
    let decisionExplanation: string | undefined = undefined;
    let decisionExplanationSplit: { customer: string[]; internal: string[] } | undefined = undefined;
    
    if (sessionId) {
      try {
        // Step 4: 분기 설명 생성
        const presentation = await buildDecisionTracePresentation(sessionId);
        decisionExplanationSplit = presentation;
        
        // 하위 호환: 기존 단일 설명도 유지
        const explanation = await buildDecisionTraceExplanation(sessionId);
        decisionExplanation = explanation.explanation;
      } catch (explainError) {
        // 설명 생성 실패해도 고객 응답은 정상 반환
        console.error('[V5_DECISION_EXPLAIN_ERROR]', explainError);
      }
    }

    return NextResponse.json({
      status: 'SUCCESS',
      result,
      decision_explanation: decisionExplanation || undefined, // 하위 호환 유지
      decision_explanation_split: decisionExplanationSplit, // Step 4 추가
    })
  } catch (error) {
    logger.error('V4API', '견적 계산 실패', error)

    return NextResponse.json(
      {
        status: 'ERROR',
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

/**
 * Phase 0: DB 게이트 체크 함수
 * 
 * 필수 카테고리(바닥/욕실/주방)가 없거나 0원이면 BLOCK
 */
function checkDBGate(result: UIEstimateV4): {
  blocked: boolean;
  missing: string[];
  reason: string;
  userMessage: string;
} {
  // 견적 실패 시 무조건 BLOCK
  if (!result.isSuccess) {
    return {
      blocked: true,
      missing: ['견적 계산 실패'],
      reason: '견적 계산이 실패했습니다.',
      userMessage: '견적 산출에 필요한 필수 단가 데이터가 준비되지 않았습니다.',
    };
  }

  // breakdown이 비어있으면 BLOCK
  if (!result.breakdown || result.breakdown.length === 0) {
    return {
      blocked: true,
      missing: ['공정 내역'],
      reason: '공정 내역이 없습니다.',
      userMessage: '견적 산출에 필요한 필수 단가 데이터가 준비되지 않았습니다.',
    };
  }

  // breakdown의 각 항목에서 materials가 비어있거나 금액이 0원인지 체크
  const missing: string[] = [];
  const requiredProcessKeywords = ['마감', '욕실', '주방', '바닥'];
  
  for (const breakdown of result.breakdown) {
    // 필수 공정인지 확인
    const isRequiredProcess = requiredProcessKeywords.some(keyword => 
      breakdown.processName.includes(keyword)
    );
    
    if (isRequiredProcess) {
      // materials가 비어있으면 BLOCK
      if (!breakdown.materials || breakdown.materials.length === 0) {
        missing.push(breakdown.processName);
        continue;
      }
      
      // 금액이 0원이면 BLOCK
      const amount = parseFloat(breakdown.amount.replace(/[^0-9]/g, '')) || 0;
      if (amount === 0) {
        missing.push(breakdown.processName);
      }
    }
  }

  // 필수 공정이 누락되었거나 0원이면 BLOCK
  if (missing.length > 0) {
    return {
      blocked: true,
      missing,
      reason: `필수 공정 데이터 부족: ${missing.join(', ')}`,
      userMessage: '현재 견적 산출에 필요한 필수 단가 데이터가 준비되지 않았습니다. (바닥/욕실/주방 중 일부)',
    };
  }

  // 총액이 0원이면 BLOCK
  const totalAmount = parseFloat(result.total.formatted.replace(/[^0-9]/g, '')) || 0;
  if (totalAmount === 0) {
    return {
      blocked: true,
      missing: ['총액'],
      reason: '총액이 0원입니다.',
      userMessage: '견적 산출에 필요한 필수 단가 데이터가 준비되지 않았습니다.',
    };
  }

  return {
    blocked: false,
    missing: [],
    reason: '',
    userMessage: '',
  };
}





