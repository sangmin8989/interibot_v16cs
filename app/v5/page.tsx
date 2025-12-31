'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useV5UltimateStore } from '@/lib/store/v5UltimateStore';
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore';
import { FusionAnalysisResult } from '@/lib/analysis/v5-ultimate/types';
import StyleSelector, { StyleResult } from '@/components/v5-ultimate/StyleSelector';
import ChatOnboarding, { ChatData } from '@/components/v5-ultimate/ChatOnboarding';
import AnalyzingLoader from '@/components/v5-ultimate/AnalyzingLoader';
import DNAResultDisplay from '@/components/v5-ultimate/DNAResultDisplay';
import SpaceInfoForm from '@/components/v5-ultimate/SpaceInfoForm';

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

  const [styleResult, setStyleResult] = useState<StyleResult | null>(null);
  const [chatData, setChatData] = useState<ChatData | null>(null);

  useEffect(() => {
    initSession();
  }, []);

  // 스타일 선택 완료 → 성향분석 1차로 이동
  const handleStyleComplete = (result: StyleResult) => {
    setStyleResult(result);
    // [4] 스타일 추천 완료 → [2] 성향분석 1차로 이동
    setStep('chat'); // chat 단계를 성향분석 1차로 사용
  };

  // 성향분석 1차 완료 (대화 완료)
  const handleChatComplete = async (data: ChatData) => {
    setChatData(data);
    setStep('analyzing');

    try {
      // API 호출 (기존 로직 활용)
      // spaceInfo에서 필요한 정보 추출 (없으면 기본값)
      const housingType = spaceInfo?.housingType || '아파트';
      const pyeong = spaceInfo?.pyeong || 30;
      const selectedGrade = 'STANDARD'; // 기본값 (나중에 사용자 선택으로 변경 가능)

      const response = await fetch('/api/v5/analyze/fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          styleResult,
          chatData: data,
          photoAnalysis: null, // photo 단계 제거
          spaceInfo: {
            housingType,
            pyeong,
            selectedGrade,
          },
        }),
      });

      const result = await response.json();

      if (result.success && result.result) {
        setFusionResult(result.result);
        
        // Decision 결과 처리 (UI 전달 규칙)
        const { extractUIContract } = await import('@/lib/decision/ui-contract');
        const decisionContract = extractUIContract(result.result.decisionEnvelope);
        
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
        
        // [2] 성향분석 1차 완료 → [3] DNA 결과 1차로 이동
        setStep('result');
      } else {
        throw new Error(result.error || '분석 실패');
      }
    } catch (error) {
      console.error('분석 에러:', error);
      // 에러 시 성향분석으로 돌아가기
      setStep('chat');
    }
  };

  // [3] DNA 결과 1차 완료 → [5] 공정 추천으로 이동
  const handleResultNext = async () => {
    if (!fusionResult) return;
    
    // Decision 결과 처리 (BLOCK 차단)
    const { extractUIContract } = await import('@/lib/decision/ui-contract');
    const decisionContract = extractUIContract(fusionResult.decisionEnvelope);
    
    // BLOCK: 다음 단계 완전 차단
    if (decisionContract.decisionBlocked) {
      // UI에서 차단 처리 (스킵 버튼 금지)
      return;
    }
    
    // PASS/WARN: 다음 단계 진행 허용
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
    router.push('/v5/process-select');
  };

  // 집 정보 완료 - 스타일 선택으로 이동
  const handleSpaceInfoComplete = () => {
    setStep('mood');
  };

  // [3] DNA 결과 1차 완료 → [5] 공정 추천으로 이동
  const handleResultComplete = () => {
    if (fusionResult) {
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
    }
    router.push('/v5/process-select');
  };

  // 집 정보에서 뒤로
  const handleSpaceInfoBack = () => {
    setStep('result');
  };

  // 재시작
  const handleRestart = () => {
    reset();
    setStyleResult(null);
    setChatData(null);
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
          {/* Step 1: 스타일 선택 */}
          {currentStep === 'mood' && (
            <motion.div
              key="mood"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
            >
              <StyleSelector onComplete={handleStyleComplete} />
            </motion.div>
          )}

          {/* Step 2: 성향분석 1차 (기존 chat 단계 사용) */}
          {currentStep === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <ChatOnboarding 
                styleResult={styleResult}
                photoAnalysis={null}
                onComplete={handleChatComplete} 
              />
            </motion.div>
          )}

          {/* Step 4: 맥락 로딩 */}
          {currentStep === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnalyzingLoader 
                styleResult={styleResult}
                chatData={chatData}
              />
            </motion.div>
          )}

          {/* Step 4: DNA 결과 1차 (카드 슬라이드) */}
          {currentStep === 'result' && fusionResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <DNAResultDisplay 
                result={fusionResult} 
                onNext={handleResultNext} 
              />
              
              <div className="mt-8 flex flex-col gap-3">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  onClick={handleResultComplete}
                  className="w-full py-4 bg-[#B8956B] text-white font-semibold rounded-2xl 
                             hover:bg-[#A0855B] transition-colors"
                >
                  공정 선택하기
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  onClick={handleRestart}
                  className="w-full py-3 text-[#9B9B9B] hover:text-[#6B6B6B] 
                             transition-colors text-sm"
                >
                  다시 테스트하기
                </motion.button>
              </div>
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




