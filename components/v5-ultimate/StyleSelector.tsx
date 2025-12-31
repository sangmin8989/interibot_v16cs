'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface StyleSelectorProps {
  onComplete: (selectedStyle: StyleResult) => void;
}

export interface StyleResult {
  styleId: string;
  styleName: string;
  styleTag: string;
  colorPalette: string[];
  description: string;
}

const STYLE_OPTIONS = [
  {
    id: 'warm-wood',
    image: '/moods/warm-wood.jpg',
    fallbackGradient: 'from-amber-50 via-orange-50 to-yellow-50',
    fallbackEmoji: '🪵',
    name: '따뜻한 우드톤',
    styleTag: '내추럴 모던',
    colors: ['#D4A574', '#C4956A', '#B8860B', '#8B7355'],
    description: '원목의 따스함이 느껴지는 공간',
    keywords: ['원목', '자작나무', '월넛', '오크'],
  },
  {
    id: 'clean-white',
    image: '/moods/clean-white.jpg',
    fallbackGradient: 'from-gray-50 via-slate-50 to-zinc-50',
    fallbackEmoji: '🤍',
    name: '깔끔한 화이트',
    styleTag: '미니멀 모던',
    colors: ['#FFFFFF', '#F5F5F5', '#E5E5E5', '#D4D4D4'],
    description: '군더더기 없이 정돈된 공간',
    keywords: ['화이트', '그레이', '심플', '정돈'],
  },
  {
    id: 'cozy-living',
    image: '/moods/cozy-living.jpg',
    fallbackGradient: 'from-stone-100 via-amber-50 to-orange-50',
    fallbackEmoji: '🛋️',
    name: '포근한 거실',
    styleTag: '코지 내추럴',
    colors: ['#D2B48C', '#C4A77D', '#BDB76B', '#A0926D'],
    description: '가족이 모이는 따뜻한 공간',
    keywords: ['패브릭', '러그', '쿠션', '조명'],
  },
  {
    id: 'modern-kitchen',
    image: '/moods/modern-kitchen.jpg',
    fallbackGradient: 'from-slate-100 via-gray-100 to-stone-100',
    fallbackEmoji: '🍳',
    name: '모던 주방',
    styleTag: '모던 심플',
    colors: ['#696969', '#808080', '#A9A9A9', '#C0C0C0'],
    description: '요리가 즐거워지는 세련된 공간',
    keywords: ['아일랜드', '빌트인', '상판', '수납'],
  },
];

export default function StyleSelector({ onComplete }: StyleSelectorProps) {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultStyle, setResultStyle] = useState<typeof STYLE_OPTIONS[0] | null>(null);

  const handleSelect = async (style: typeof STYLE_OPTIONS[0]) => {
    setSelectedStyle(style.id);
    setIsAnalyzing(true);

    // 0.8초 분석 애니메이션
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsAnalyzing(false);
    setResultStyle(style);
    setShowResult(true);

    // 1.5초 후 다음 단계로
    setTimeout(() => {
      onComplete({
        styleId: style.id,
        styleName: style.name,
        styleTag: style.styleTag,
        colorPalette: style.colors,
        description: style.description,
      });
    }, 1500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div
            key="selector"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* 헤더 */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-[#1F1F1F] mb-4">
                어떤 스타일이 끌리세요?
              </h1>
              <p className="text-lg text-[#6B6B6B]">
                직감적으로 하나만 골라보세요
              </p>
            </motion.div>

            {/* 스타일 그리드 */}
            <div className="grid grid-cols-2 gap-4">
              {STYLE_OPTIONS.map((style, idx) => (
                <motion.button
                  key={style.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleSelect(style)}
                  disabled={isAnalyzing}
                  className={`
                    relative aspect-[4/3] rounded-2xl overflow-hidden
                    transition-all duration-300 group
                    border-2
                    ${selectedStyle === style.id 
                      ? 'border-[#B8956B] scale-[0.98]' 
                      : 'border-[#E8E4DC] hover:border-[#D4B896] hover:scale-[1.02]'
                    }
                    ${isAnalyzing && selectedStyle !== style.id ? 'opacity-40' : ''}
                  `}
                >
                  {/* 배경 그라데이션 */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${style.fallbackGradient}`}>
                    {/* 패턴 오버레이 (한국 감성) */}
                    <div className="absolute inset-0 opacity-10"
                         style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
                    />
                  </div>

                  {/* 중앙 이모지 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl opacity-60">{style.fallbackEmoji}</span>
                  </div>

                  {/* 컬러 팔레트 (우상단) */}
                  <div className="absolute top-3 right-3 flex gap-1">
                    {style.colors.slice(0, 4).map((color, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* 텍스트 (하단) */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/95 to-white/0">
                    <h3 className="text-lg font-bold text-[#1F1F1F] mb-0.5">
                      {style.name}
                    </h3>
                    <p className="text-[#6B6B6B] text-sm">
                      {style.description}
                    </p>
                  </div>

                  {/* 선택 체크 */}
                  {selectedStyle === style.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 left-3 w-8 h-8 bg-[#B8956B] rounded-full 
                                 flex items-center justify-center shadow-lg"
                    >
                      {isAnalyzing ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkles className="w-4 h-4 text-white" />
                        </motion.div>
                      ) : (
                        <span className="text-white text-sm font-bold">✓</span>
                      )}
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* 분석 중 메시지 */}
            {isAnalyzing && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mt-8 text-[#B8956B] font-medium"
              >
                취향을 분석하고 있어요...
              </motion.p>
            )}
          </motion.div>
        ) : (
          /* 결과 화면 */
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-10"
          >
            {/* 스타일 태그 */}
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-6 py-3 
                             bg-[#B8956B] text-white rounded-full text-lg font-bold">
                <Sparkles className="w-5 h-5" />
                {resultStyle?.styleTag}
              </span>
            </motion.div>

            {/* 컬러 팔레트 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center gap-3 mb-6"
            >
              {resultStyle?.colors.map((color, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="w-12 h-12 rounded-2xl shadow-lg"
                  style={{ backgroundColor: color }}
                />
              ))}
            </motion.div>

            {/* 설명 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-[#1F1F1F] font-medium mb-2"
            >
              {resultStyle?.name}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-[#6B6B6B]"
            >
              {resultStyle?.id === 'warm-wood' && '따뜻한 원목 느낌을 좋아하시는군요!'}
              {resultStyle?.id === 'clean-white' && '깔끔하게 정돈된 공간을 선호하시네요!'}
              {resultStyle?.id === 'cozy-living' && '가족과 함께하는 포근한 공간이 좋으시군요!'}
              {resultStyle?.id === 'modern-kitchen' && '요리를 즐기시는 멋진 취향이시네요!'}
              {!resultStyle?.id && `${resultStyle?.description}을 선호하시는군요!`}
            </motion.p>

            {/* 로딩 인디케이터 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8"
            >
              <div className="w-32 h-1 bg-[#E8E4DC] rounded-full mx-auto overflow-hidden">
                <motion.div
                  className="h-full bg-[#B8956B] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'linear' }}
                />
              </div>
              <p className="text-sm text-[#9B9B9B] mt-3">
                더 자세히 알아볼게요
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


