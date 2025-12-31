'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Lightbulb, ChevronRight, Loader2 } from 'lucide-react';
import { StyleResult } from './StyleSelector';
import { ChatMessage, PhotoAnalysisResult } from '@/lib/analysis/v5-ultimate/types';
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore';

interface ChatOnboardingProps {
  styleResult: StyleResult | null;
  photoAnalysis: PhotoAnalysisResult | null;
  onComplete: (chatData: ChatData) => void;
}

export interface ChatData {
  answers: Record<string, string>;
  insights: string[];
  messages: ChatMessage[];
}

export default function ChatOnboarding({ styleResult, photoAnalysis, onComplete }: ChatOnboardingProps) {
  const { spaceInfo } = useSpaceInfoStore();
  const [currentQuestion, setCurrentQuestion] = useState<{ question: string; quickReplies: string[] } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentInsight, setCurrentInsight] = useState<string | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentQuestionCode, setCurrentQuestionCode] = useState<string | null>(null);

  // V5 Decision Trace session id (localStorage 고정)
  const getV5SessionId = () => {
    if (typeof window === 'undefined') return null;
    let sid = localStorage.getItem('v5_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('v5_session_id', sid);
    }
    return sid;
  };

  const questionCount = messages.filter(m => m.role === 'user').length;
  const progress = isComplete ? 100 : ((questionCount) / 5) * 100;

  // 초기 질문 생성
  useEffect(() => {
    if (!currentQuestion && !isLoadingQuestion && !isComplete) {
      loadNextQuestion();
    }
  }, []);

  // 다음 질문 로드
  const loadNextQuestion = async (lastAnswer?: string) => {
    setIsLoadingQuestion(true);
    try {
      const sessionId = getV5SessionId();

      const response = await fetch('/api/v5/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId ?? '',
        },
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
          lastAnswer: lastAnswer,
          lastQuestionCode: currentQuestionCode,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '질문 생성 실패');
      }

      if (data.isComplete || !data.question) {
        setIsComplete(true);
        setCurrentQuestion(null);
        // 완료 처리
        onComplete({
          answers,
          insights,
          messages,
        });
        return;
      }

      // AI 질문 추가
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.question,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentQuestion({
        question: data.question,
        quickReplies: data.quickReplies || [],
      });
      
      // question_code 저장 (다음 답변 시 전달용)
      if (data.question_code) {
        setCurrentQuestionCode(data.question_code);
      }
    } catch (error) {
      console.error('질문 생성 에러:', error);
      // Fallback: 기본 질문 사용
      const fallbackQuestion = getFallbackQuestion(questionCount, photoAnalysis);
      if (fallbackQuestion) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: fallbackQuestion.question,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setCurrentQuestion(fallbackQuestion);
      }
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Fallback 질문 (에러 시)
  const getFallbackQuestion = (
    questionIndex: number,
    photoAnalysis: PhotoAnalysisResult | null
  ): { question: string; quickReplies: string[] } | null => {
    if (questionIndex === 0 && !photoAnalysis) {
      return {
        question: "안녕하세요! 먼저 어떤 공간을 가장 바꾸고 싶으세요?",
        quickReplies: ["거실", "주방", "침실", "욕실", "전체 다"]
      };
    }

    const fallbackQuestions = [
      {
        question: "주로 어떤 공간에서 시간을 보내세요?",
        quickReplies: ["거실", "주방", "침실", "서재"]
      },
      {
        question: "혼자 사세요, 아니면 같이 사는 분이 계세요?",
        quickReplies: ["혼자요", "가족이랑", "친구랑", "그때그때 달라요"]
      },
      {
        question: "청소나 정리는 어떤 스타일이세요?",
        quickReplies: ["매일 깔끔하게", "주말에 몰아서", "솔직히 귀찮아요", "로봇청소기가 해요"]
      },
      {
        question: "이번 인테리어에서 꼭 바꾸고 싶은 거 하나만 꼽는다면?",
        quickReplies: ["주방이요", "욕실이요", "수납공간", "전체 분위기"]
      },
      {
        question: "예산은 대충 어느 정도 생각하세요?",
        quickReplies: ["3천만원 이하", "3천~5천", "5천~7천", "7천 이상"]
      }
    ];

    if (questionIndex >= fallbackQuestions.length) {
      return null;
    }

    return fallbackQuestions[questionIndex];
  };

  const handleAnswer = async (answer: string) => {
    if (isTransitioning || !currentQuestion) return;
    setIsTransitioning(true);

    // 답변 저장
    const answerKey = `q${questionCount + 1}`;
    const newAnswers = { ...answers, [answerKey]: answer };
    setAnswers(newAnswers);

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      role: 'user',
      content: answer,
      timestamp: new Date().toISOString(),
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // 간단한 인사이트 생성
    const insight = `💡 ${answer}에 대한 정보를 반영했어요`;
    setCurrentInsight(insight);
    setInsights([...insights, insight]);

    // 1.2초 후 다음 질문
    await new Promise(resolve => setTimeout(resolve, 1200));
    setCurrentInsight(null);
    
    // 질문 전환: null로 초기화 후 새 질문 표시
    setCurrentQuestion(null);
    setIsTransitioning(false);

    // 다음 질문 로드 (답변 전달)
    await loadNextQuestion(answer);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* 프로그레스 바 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#9B9B9B]">
            {questionCount + (currentQuestion ? 1 : 0)} / 5
          </span>
          {styleResult && (
            <span className="text-sm text-[#B8956B] font-medium">
              {styleResult.styleTag}
            </span>
          )}
        </div>
        <div className="h-2 bg-[#F7F3ED] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#B8956B] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoadingQuestion && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#B8956B] animate-spin mb-4" />
          <p className="text-[#6B6B6B]">맞춤 질문을 준비하고 있어요...</p>
        </div>
      )}

      {/* 질문 표시 */}
      <AnimatePresence mode="wait">
        {!isLoadingQuestion && currentQuestion && (
          <motion.div
            key={`question-${questionCount}-${currentQuestion.question}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {/* 질문 */}
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F1F1F] mb-8 text-center">
              {currentQuestion.question}
            </h2>

            {/* 옵션 버튼들 */}
            <div className="space-y-3">
              {currentQuestion.quickReplies.map((option, idx) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleAnswer(option)}
                  disabled={isTransitioning}
                  className={`
                    w-full p-5 rounded-2xl border-2 text-left
                    transition-all duration-200 group
                    ${isTransitioning 
                      ? 'opacity-50 cursor-not-allowed'
                      : 'border-[#E8E4DC] bg-white hover:border-[#B8956B] hover:bg-[#FDFBF7]'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-[#1F1F1F]">
                      {option}
                    </span>
                    <ChevronRight className="w-5 h-5 text-[#9B9B9B] group-hover:text-[#B8956B] 
                                            group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 인사이트 팝업 */}
      <AnimatePresence>
        {currentInsight && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 
                       px-6 py-4 bg-[#1F1F1F] text-white rounded-2xl
                       shadow-2xl max-w-md mx-auto"
          >
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-[#B8956B] flex-shrink-0 mt-0.5" />
              <p className="text-base">{currentInsight.replace('💡 ', '')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}




