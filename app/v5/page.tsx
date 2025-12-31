'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useV5UltimateStore } from '@/lib/store/v5UltimateStore';
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore';
import { FusionAnalysisResult } from '@/lib/analysis/v5-ultimate/types';
import AnalyzingLoader from '@/components/v5-ultimate/AnalyzingLoader';
import SpaceInfoForm from '@/components/v5-ultimate/SpaceInfoForm';
import QuickDiagnosis, { QuickDiagnosisResult } from '@/components/v5-ultimate/QuickDiagnosis';

type StoredData<T> = {
  schemaVersion: '5.0'
  createdAt: string
  data: T
}

export default function V5UltimatePage() {
  const router = useRouter();
  const { 
    currentStep, 
    setStep, 
    initSession, 
    fusionResult,
    setFusionResult,
    reset 
  } = useV5UltimateStore();

  const { spaceInfo } = useSpaceInfoStore();

  const [styleResult, setStyleResult] = useState<any>(null);

  useEffect(() => {
    initSession();
  }, []);

  // 집 정보 완료 → 바로 분석으로 이동 (챗 단계 스킵)
  const handleSpaceInfoSubmit = async () => {
    setStep('analyzing');
    try {
      const housingType = spaceInfo?.housingType || '아파트';
      const pyeong = spaceInfo?.pyeong || 30;
      const selectedGrade = 'STANDARD'; // 기본값 (나중에 사용자 선택으로 변경 가능)

      const requestBody = { 
        styleResult,
        chatData: null,
        photoAnalysis: null, // photo 단계 제거
        spaceInfo: {
          housingType,
          pyeong,
          selectedGrade,
        },
      };

      console.log('[분석 요청]', requestBody);

      const response = await fetch('/api/v5/analyze/fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[분석 API 에러]', response.status, errorText);
        throw new Error(`API 에러 (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('[분석 응답]', result);

      // 응답 구조 검증
      if (!result || typeof result !== 'object') {
        throw new Error('잘못된 응답 형식');
      }

      if (result.success && result.result) {
        // result.result 구조 검증
        const fusionResult = result.result;
        if (!fusionResult.dnaType || !fusionResult.traitScores) {
          console.error('[분석 응답 구조 에러]', fusionResult);
          throw new Error('분석 결과 구조가 올바르지 않습니다');
        }

        console.log('[분석 결과 검증 완료]', {
          hasDnaType: !!fusionResult.dnaType,
          hasTraitScores: !!fusionResult.traitScores,
          dnaType: fusionResult.dnaType?.type,
        });

        setFusionResult(fusionResult);
        
        // Decision 결과 처리 (UI 전달 규칙) - 안전하게 처리
        try {
          const { extractUIContract } = await import('@/lib/decision/ui-contract');
          const decisionContract = extractUIContract(fusionResult.decisionEnvelope);
          
          // PASS: 다음 단계 정상 진행
          // WARN: 다음 단계 진행 허용, 대안 카드 표시
          // BLOCK: 다음 단계 완전 차단, 대안 카드 필수 표시
          if (decisionContract.decisionBlocked) {
            // BLOCK: 차단 (UI에서 처리)
            console.log('[Decision] BLOCK:', decisionContract);
          } else if (decisionContract.decisionResult === 'WARN') {
            // WARN: 경고 (UI에서 처리)
            console.log('[Decision] WARN:', decisionContract);
          }
          // PASS: 정상 진행
        } catch (error) {
          console.warn('[Decision 처리 에러]', error);
          // Decision 처리 실패해도 계속 진행
        }
        
        // [2] 성향분석 완료 → 바로 공정 선택으로 이동 (DNA 결과 페이지 스킵)
        // 결과는 localStorage에 저장하고 바로 공정 선택 페이지로 이동
        const dnaResult1: StoredData<typeof fusionResult> = {
          schemaVersion: '5.0',
          createdAt: new Date().toISOString(),
          data: fusionResult,
        };
        const spaceInfoData: StoredData<typeof spaceInfo> = {
          schemaVersion: '5.0',
          createdAt: new Date().toISOString(),
          data: spaceInfo,
        };
        localStorage.setItem('v5DnaResult1', JSON.stringify(dnaResult1));
        localStorage.setItem('v5SpaceInfo', JSON.stringify(spaceInfoData));
        
        // 바로 공정 선택 페이지로 이동
        router.push('/v5/process-select');
      } else {
        const errorMessage = result.error || result.message || '분석 실패';
        console.error('[분석 실패]', errorMessage, result);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('분석 에러:', error);
      console.error('에러 상세:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // 에러 시 집 정보 입력으로 돌아가기
      setStep('spaceInfo');
      // 사용자에게 알림 (선택사항)
      alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 집 정보 완료 - 바로 분석으로 이동
  const handleSpaceInfoComplete = () => {
    handleSpaceInfoSubmit();
  };

  // 3초 진단 완료 → 집 정보 입력으로 이동
  const handleQuickDiagnosisComplete = (result: QuickDiagnosisResult) => {
    // 스타일별 기본 색상 팔레트 매핑
    const styleColorMap: Record<string, string[]> = {
      '미니멀 모던': ['#F5F5F5', '#E0E0E0', '#9E9E9E', '#616161'],
      '내추럴 모던': ['#D4A574', '#C4956A', '#B8860B', '#8B7355'],
      '코지 내추럴': ['#E8D5B7', '#D4C4A0', '#C9A882', '#B8956B'],
      '모던 심플': ['#E8E8E8', '#D0D0D0', '#A0A0A0', '#707070'],
      '럭셔리 클래식': ['#2C2C2C', '#4A4A4A', '#6B6B6B', '#8B8B8B'],
      '스칸디 내추럴': ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784'],
      '빈티지 모던': ['#5D4037', '#6D4C41', '#8D6E63', '#A1887F'],
      '클래식': ['#FFE082', '#FFD54F', '#FFC107', '#FFB300'],
      '미니멀': ['#FAFAFA', '#F5F5F5', '#EEEEEE', '#E0E0E0'],
      '패밀리 코지': ['#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726'],
    };

    // 스타일 결과 저장 (나중에 분석에 활용)
    setStyleResult({
      styleTag: result.styleTag,
      styleName: result.styleName,
      confidence: result.confidence,
      colorPalette: styleColorMap[result.styleTag] || ['#B8956B', '#D4B896', '#E8E4DC', '#F7F3ED'], // 기본 색상
    });
    setStep('spaceInfo');
  };

  // 집 정보에서 뒤로 → 3초 진단으로
  const handleSpaceInfoBack = () => {
    setStep('quickDiagnosis');
  };

  // 재시작
  const handleRestart = () => {
    reset();
    setStyleResult(null);
    initSession();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* 상단 그라데이션 */}
      <div className="absolute top-0 left-0 right-0 h-[400px] 
                      bg-gradient-to-b from-[#F7F3ED] to-transparent 
                      pointer-events-none" />
      
      <div className="relative max-w-3xl mx-auto px-6 min-h-screen 
                      flex flex-col justify-center py-16">
        <AnimatePresence mode="wait">
          {/* 3초 진단 (첫 화면) */}
          {currentStep === 'quickDiagnosis' && (
            <motion.div
              key="quickDiagnosis"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <QuickDiagnosis onComplete={handleQuickDiagnosisComplete} />
            </motion.div>
          )}

          {/* 분석 단계 */}
          {currentStep === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnalyzingLoader 
                styleResult={styleResult}
                chatData={null}
              />
            </motion.div>
          )}

          {/* Step 1: 집 정보 */}
          {currentStep === 'spaceInfo' && (
            <motion.div
              key="spaceInfo"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <SpaceInfoForm 
                onComplete={handleSpaceInfoComplete}
                onBack={handleSpaceInfoBack}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}




