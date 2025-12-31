'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatData } from './ChatOnboarding';
import { StyleResult } from './StyleSelector';

interface AnalyzingLoaderProps {
  styleResult: StyleResult | null;
  chatData: ChatData | null;
}

export default function AnalyzingLoader({ styleResult, chatData }: AnalyzingLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  // 맥락 기반 메시지 생성
  const getContextMessages = (): string[] => {
    const messages: string[] = [];

    // 스타일 관련
    if (styleResult) {
      messages.push(`${styleResult.styleTag} 스타일에 맞는 자재를 찾고 있어요`);
    }

    // 답변 기반 메시지
    if (chatData?.answers) {
      if (chatData.answers.space === '주방') {
        messages.push('요리를 즐기시니까 주방 동선을 분석 중이에요');
      }
      if (chatData.answers.space === '거실') {
        messages.push('거실 중심 생활에 맞는 배치를 구상 중이에요');
      }
      if (chatData.answers.family?.includes('반려동물')) {
        messages.push('반려동물 친화적인 자재를 선별하고 있어요');
      }
      if (chatData.answers.cleaning === '로봇청소기에 맡겨요') {
        messages.push('로봇청소기 동선을 고려한 가구 배치 중이에요');
      }
      if (chatData.answers.priority === '예쁜 디자인') {
        messages.push('감각적인 포인트 요소를 찾고 있어요');
      }
      if (chatData.answers.priority === '실용적인 수납') {
        messages.push('수납 공간을 최대화할 방법을 계산 중이에요');
      }
    }

    // 기본 메시지
    messages.push('당신만의 인테리어 DNA를 조합하고 있어요');
    messages.push('최적의 추천을 준비하고 있어요');
    messages.push('거의 다 됐어요!');

    return messages;
  };

  const messages = getContextMessages();

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="text-center py-20">
      {/* 로딩 애니메이션 */}
      <div className="relative w-32 h-32 mx-auto mb-10">
        {/* 바깥 링 */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-[#F7F3ED]"
        />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-[#B8956B] border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* 가운데 링 */}
        <motion.div
          className="absolute inset-4 rounded-full border-4 border-[#E8E4DC]"
        />
        <motion.div
          className="absolute inset-4 rounded-full border-4 border-[#D4B896] border-b-transparent"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* 중앙 이모지 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            className="text-4xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🧬
          </motion.span>
        </div>
      </div>

      {/* 컬러 팔레트 (스타일 선택한 경우) */}
      {styleResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center gap-2 mb-8"
        >
          {styleResult.colorPalette.map((color, i) => (
            <motion.div
              key={i}
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: color }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      )}

      {/* 맥락 메시지 */}
      <AnimatePresence mode="wait">
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-xl text-[#1F1F1F] font-medium"
        >
          {messages[messageIndex]}
        </motion.p>
      </AnimatePresence>

      {/* 수집된 인사이트 미리보기 */}
      {chatData?.insights && chatData.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 max-w-md mx-auto"
        >
          <p className="text-sm text-[#9B9B9B] mb-3">분석에 반영된 내용</p>
          <div className="flex flex-wrap justify-center gap-2">
            {chatData.insights.slice(0, 3).map((insight, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-[#F7F3ED] rounded-full text-sm text-[#6B6B6B]"
              >
                {insight.replace('💡 ', '').split('!')[0]}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}




