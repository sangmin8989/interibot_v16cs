'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { FusionAnalysisResult } from '@/lib/analysis/v5-ultimate/types';
import ShareButtons from './ShareButtons';
import { getValueSummary } from '@/lib/analysis/v5-ultimate/valueCalculator';
import SixIndexDashboard from './SixIndexDashboard';

interface DNAResultDisplayProps {
  result: FusionAnalysisResult;
  onNext: () => void;
}

export default function DNAResultDisplay({ result, onNext }: DNAResultDisplayProps) {
  // fullReport가 있으면 6대 지수 대시보드 표시
  if (result.fullReport) {
    return <SixIndexDashboard report={result.fullReport} onNext={onNext} />;
  }

  // fullReport 없으면 기존 동물 캐릭터 표시
  const [currentCard, setCurrentCard] = useState(0);
  const [direction, setDirection] = useState(0);
  
  const dna = result.dnaType;
  
  // 카드 데이터
  const cards = [
    {
      id: 'main',
      type: 'main',
      title: 'DNA 결과',
    },
    {
      id: 'traits',
      type: 'traits',
      title: '성향 분석',
    },
    {
      id: 'style',
      type: 'style',
      title: '추천 스타일',
    },
    {
      id: 'tips',
      type: 'tips',
      title: '맞춤 팁',
    },
    {
      id: 'value',
      type: 'value',
      title: '투자 가치',
    },
  ];

  // 투자 가치 점수 (기본값 또는 result에서 가져오기)
  const homeValueIndex = result.valueScores?.homeValueIndex || 65;
  const lifeQualityScore = result.valueScores?.lifeQualityScore || 70;

  const nextCard = () => {
    if (currentCard < cards.length - 1) {
      setDirection(1);
      setCurrentCard(currentCard + 1);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setDirection(-1);
      setCurrentCard(currentCard - 1);
    }
  };

  const traits = [
    { name: '공간효율', score: result.traitScores.spaceEfficiency },
    { name: '정리력', score: result.traitScores.cleaningSensitivity },
    { name: '스타일', score: result.traitScores.styleCommitment },
    { name: '실용성', score: 100 - result.traitScores.budgetFlexibility },
  ];

  const styleNames: Record<string, string> = {
    modern: '모던', natural: '내추럴', minimal: '미니멀',
    classic: '클래식', scandinavian: '북유럽', vintage: '빈티지',
    industrial: '인더스트리얼', cozy: '코지'
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* 카드 인디케이터 */}
      <div className="flex justify-center gap-2 mb-6">
        {cards.map((card, idx) => (
          <button
            key={card.id}
            onClick={() => {
              setDirection(idx > currentCard ? 1 : -1);
              setCurrentCard(idx);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentCard 
                ? 'w-8 bg-[#B8956B]' 
                : 'w-2 bg-[#E8E4DC]'
            }`}
          />
        ))}
      </div>

      {/* 카드 컨테이너 */}
      <div className="relative h-[500px] overflow-hidden">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentCard}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            {/* 카드 1: 메인 결과 */}
            {cards[currentCard].type === 'main' && (
              <div className="h-full flex flex-col items-center justify-center 
                            bg-white rounded-3xl border border-[#E8E4DC] p-8 shadow-lg">
                <motion.span 
                  className="text-8xl mb-6"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {dna.emoji}
                </motion.span>
                
                <h1 className="text-4xl font-bold text-[#1F1F1F] mb-2">
                  {dna.name}
                </h1>
                
                <p className="text-xl text-[#B8956B] mb-6">
                  "{dna.title}"
                </p>
                
                <p className="text-[#6B6B6B] text-center leading-relaxed max-w-sm">
                  {dna.description}
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {dna.traits.slice(0, 3).map((trait, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-[#F7F3ED] rounded-full text-[#1F1F1F] font-medium"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 카드 2: 성향 분석 */}
            {cards[currentCard].type === 'traits' && (
              <div className="h-full flex flex-col 
                            bg-white rounded-3xl border border-[#E8E4DC] p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-[#1F1F1F] mb-8 text-center">
                  성향 분석 결과
                </h2>
                
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  {traits.map((trait, idx) => (
                    <motion.div 
                      key={trait.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="flex justify-between mb-2">
                        <span className="text-[#1F1F1F] font-medium">{trait.name}</span>
                        <span className="text-[#B8956B] font-bold">{trait.score}%</span>
                      </div>
                      <div className="h-3 bg-[#F7F3ED] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#B8956B] to-[#D4B896] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${trait.score}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + idx * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <p className="text-center text-[#9B9B9B] text-sm mt-6">
                  상위 {Math.floor(Math.random() * 15) + 5}%의 특별한 조합이에요
                </p>
              </div>
            )}

            {/* 카드 3: 추천 스타일 */}
            {cards[currentCard].type === 'style' && (
              <div className="h-full flex flex-col 
                            bg-white rounded-3xl border border-[#E8E4DC] p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-[#1F1F1F] mb-6 text-center">
                  추천 스타일
                </h2>
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {dna.recommendedStyles.slice(0, 4).map((style, idx) => (
                      <motion.div
                        key={style}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="aspect-square rounded-2xl bg-[#F7F3ED] 
                                   flex items-center justify-center p-4"
                      >
                        <span className="text-lg font-semibold text-[#1F1F1F]">
                          {styleNames[style] || style}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <p className="text-center text-[#6B6B6B]">
                    이 스타일들이 당신의 라이프스타일과 잘 맞아요
                  </p>
                </div>
              </div>
            )}

            {/* 카드 4: 맞춤 팁 */}
            {cards[currentCard].type === 'tips' && (
              <div className="h-full flex flex-col 
                            bg-white rounded-3xl border border-[#E8E4DC] p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-[#1F1F1F] mb-6 text-center">
                  맞춤 팁
                </h2>
                
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  {result.hiddenNeeds.slice(0, 3).map((need, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.15 }}
                      className="p-4 bg-[#F7F3ED] rounded-xl"
                    >
                      <p className="text-[#1F1F1F]">
                        💡 {need.suggestion}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* 공유 버튼 */}
                <div className="mt-6">
                  <ShareButtons dna={dna} matchScore={result.dnaMatchScore} />
                </div>
              </div>
            )}

            {/* 카드 5: 투자 가치 */}
            {cards[currentCard].type === 'value' && (
              <div className="h-full flex flex-col 
                            bg-white rounded-3xl border border-[#E8E4DC] p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-[#1F1F1F] mb-2 text-center">
                  투자 가치 분석
                </h2>
                <p className="text-[#9B9B9B] text-sm text-center mb-8">
                  예상 인테리어 기준
                </p>
                
                <div className="flex-1 flex flex-col justify-center space-y-8">
                  {/* 집값 방어지수 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🏠</span>
                        <span className="text-lg font-semibold text-[#1F1F1F]">집값 방어지수</span>
                      </div>
                      <span className="text-2xl font-bold text-[#B8956B]">
                        {homeValueIndex}점
                      </span>
                    </div>
                    <div className="h-4 bg-[#F7F3ED] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#B8956B] to-[#D4B896] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${homeValueIndex}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                    </div>
                    <p className="text-sm text-[#6B6B6B] mt-2">
                      {homeValueIndex >= 80 
                        ? '매도 시 인테리어 가치가 충분히 반영될 거예요' 
                        : homeValueIndex >= 60
                        ? '적정 수준의 투자 가치가 예상돼요'
                        : '개인 만족 중심의 인테리어예요'}
                    </p>
                  </div>

                  {/* 생활개선 점수 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">✨</span>
                        <span className="text-lg font-semibold text-[#1F1F1F]">생활개선 점수</span>
                      </div>
                      <span className="text-2xl font-bold text-[#B8956B]">
                        {lifeQualityScore}점
                      </span>
                    </div>
                    <div className="h-4 bg-[#F7F3ED] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#6B8E7B] to-[#A7C4A0] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${lifeQualityScore}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                    <p className="text-sm text-[#6B6B6B] mt-2">
                      {lifeQualityScore >= 85 
                        ? '일상이 확 달라지는 변화를 느끼실 거예요' 
                        : lifeQualityScore >= 70
                        ? '생활 편의성이 눈에 띄게 개선돼요'
                        : '기본적인 생활 개선이 예상돼요'}
                    </p>
                  </div>
                </div>

                {/* 하단 종합 메시지 */}
                <div className="mt-8 p-4 bg-[#F7F3ED] rounded-xl text-center">
                  <p className="text-[#1F1F1F] font-medium">
                    {getValueSummary(homeValueIndex, lifeQualityScore)}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 좌우 네비게이션 */}
        {currentCard > 0 && (
          <button
            onClick={prevCard}
            className="absolute left-2 top-1/2 -translate-y-1/2 
                       w-10 h-10 bg-white rounded-full shadow-lg
                       flex items-center justify-center
                       hover:bg-[#F7F3ED] transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
        )}
        
        {currentCard < cards.length - 1 && (
          <button
            onClick={nextCard}
            className="absolute right-2 top-1/2 -translate-y-1/2 
                       w-10 h-10 bg-white rounded-full shadow-lg
                       flex items-center justify-center
                       hover:bg-[#F7F3ED] transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-[#1F1F1F]" />
          </button>
        )}
      </div>

      {/* 스와이프 힌트 */}
      <p className="text-center text-[#9B9B9B] text-sm mt-4">
        ← 스와이프하여 더 보기 →
      </p>

      {/* CTA 버튼 (마지막 카드에서만) */}
      {currentCard === cards.length - 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <button
            onClick={onNext}
            className="w-full py-5 bg-[#1F1F1F] text-white font-bold text-xl 
                       rounded-2xl hover:bg-[#333] transition-all
                       flex items-center justify-center gap-3
                       shadow-xl"
          >
            맞춤 견적 받기
            <ArrowRight className="w-6 h-6" />
          </button>
        </motion.div>
      )}
    </div>
  );
}




