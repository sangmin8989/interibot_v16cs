'use client'

/**
 * 인테리봇 AI 종합 분석 페이지 (B안: 스토리텔링 스타일)
 * 고객의 모든 정보를 스토리 형식으로 분석하여 제공
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import StepIndicator from '@/components/onboarding/StepIndicator'
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore'
import { useScopeStore } from '@/lib/store/scopeStore'
import { useProcessStore } from '@/lib/store/processStore'
import { usePersonalityStore } from '@/lib/store/personalityStore'
import { 
  Sparkles, CheckCircle2, AlertTriangle, 
  ArrowRight, ArrowLeft, Home, Target, Lightbulb,
  Heart, Wallet, Clock, Star, Quote, ChevronRight
} from 'lucide-react'

// 세부옵션 localStorage 키
const DETAIL_OPTIONS_KEY = 'interibot_detail_options'

// 분석 단계
type AnalysisStage = 'collecting' | 'analyzing' | 'complete' | 'error'

// 분석 결과 타입
interface AnalysisResult {
  summary: string
  customerProfile: {
    lifestyle: string
    priorities: string[]
    style: string
  }
  homeValueScore?: {
    score: number
    reason: string
    investmentValue: string
  }
  lifestyleScores?: {
    storage: number
    cleaning: number
    flow: number
    comment: string
  }
  spaceAnalysis: {
    space: string
    recommendation: string
    tips: string[]
    estimatedImpact: string
  }[]
  budgetAdvice: {
    grade: string
    reason: string
    savingTips: string[]
  }
  warnings: string[]
  nextSteps: string[]
}

export default function AIRecommendationPage() {
  const router = useRouter()
  
  // 스토어에서 데이터 가져오기
  const { spaceInfo } = useSpaceInfoStore()
  const { selectedSpaces } = useScopeStore()
  const { selectedProcessesBySpace, tierSelections } = useProcessStore()
  const personalityAnalysis = usePersonalityStore((state) => state.analysis)
  const vibeData = usePersonalityStore((state) => state.vibeData)
  
  // 상태
  const [stage, setStage] = useState<AnalysisStage>('collecting')
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('데이터 수집 중...')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detailOptions, setDetailOptions] = useState<any>(null)

  // 세부옵션 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(DETAIL_OPTIONS_KEY)
      if (saved) {
        setDetailOptions(JSON.parse(saved))
      }
    }
  }, [])

  // 분석 실행
  useEffect(() => {
    if (stage !== 'collecting') return
    
    const runAnalysis = async () => {
      setProgress(10)
      setProgressText('고객 정보 수집 중...')
      await delay(400)
      
      if (!spaceInfo) {
        setError('집 정보가 없습니다. 처음부터 다시 진행해주세요.')
        setStage('error')
        return
      }
      
      setProgress(25)
      setProgressText('선택 공간 확인 중...')
      await delay(400)
      
      const selectedSpaceIds = selectedSpaces
        .filter(s => s.isSelected)
        .map(s => s.name)
      
      if (selectedSpaceIds.length === 0) {
        setError('선택된 공간이 없습니다. 공간 선택부터 다시 진행해주세요.')
        setStage('error')
        return
      }
      
      setProgress(40)
      setProgressText('성향 분석 중...')
      await delay(400)
      
      setStage('analyzing')
      setProgress(55)
      setProgressText('🤖 AI가 당신만의 이야기를 만들고 있어요...')
      await delay(600)
      
      try {
        setProgress(70)
        setProgressText('맞춤 스타일 매칭 중...')
        await delay(400)
        
        const personalityAnswers: Record<string, string> = {}
        if (personalityAnalysis?.answers) {
          personalityAnalysis.answers.forEach(a => {
            personalityAnswers[a.questionId] = a.answer
          })
        }
        
        const response = await fetch('/api/analyze/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spaceInfo: {
              housingType: spaceInfo.housingType,
              pyeong: spaceInfo.pyeong,
              rooms: spaceInfo.rooms,
              bathrooms: spaceInfo.bathrooms,
              budget: spaceInfo.budget,
              budgetAmount: spaceInfo.budgetAmount,
              familySizeRange: spaceInfo.familySizeRange,
              ageRanges: spaceInfo.ageRanges,
              lifestyleTags: spaceInfo.lifestyleTags,
              // ✅ 추가된 필드들
              livingPurpose: spaceInfo.livingPurpose, // 거주 목적 (실거주/매도준비/임대)
              livingYears: spaceInfo.livingYears, // 예상 거주 기간
              totalPeople: spaceInfo.totalPeople, // 가족 인원수
              specialConditions: spaceInfo.specialConditions, // 특수 조건 (반려동물, 고령자 등)
            },
            selectedSpaces: selectedSpaceIds,
            selectedProcesses: selectedProcessesBySpace,
            tierSelections: tierSelections,
            detailOptions: detailOptions || {},
            personality: {
              mode: personalityAnalysis?.mode,
              answers: personalityAnswers,
              vibeData: vibeData || null,
            },
          }),
        })
        
        setProgress(85)
        setProgressText('스토리 완성 중...')
        await delay(400)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '분석 중 오류가 발생했습니다.')
        }
        
        const data = await response.json()
        
        setProgress(100)
        setProgressText('완료!')
        await delay(300)
        
        setAnalysisResult(data.analysis)
        setStage('complete')
        
      } catch (err: any) {
        console.error('AI 분석 오류:', err)
        setError(err.message || '분석 중 오류가 발생했습니다.')
        setStage('error')
      }
    }
    
    runAnalysis()
  }, [stage, spaceInfo, selectedSpaces, selectedProcessesBySpace, tierSelections, detailOptions, personalityAnalysis, vibeData])

  const handleNext = () => {
    router.push('/onboarding/estimate')
  }

  const handleBack = () => {
    router.push('/onboarding/detail-options')
  }

  const handleRetry = () => {
    setError(null)
    setStage('collecting')
    setProgress(0)
  }

  // ✅ 영어 → 한글 변환 매핑
  const KOREAN_LABELS: Record<string, string> = {
    // 스타일
    'family': '패밀리',
    'healing': '힐링 내추럴',
    'modern': '모던 미니멀',
    'luxury': '럭셔리',
    'natural': '내추럴',
    'minimal': '미니멀',
    'scandinavian': '북유럽',
    'industrial': '인더스트리얼',
    'hotel': '호텔 라운지',
    'cozy': '코지 워밍',
    'classic': '클래식',
    // 우선순위/포인트
    'lighting': '분위기 조명',
    'finish_quality': '마감 품질',
    'flow': '생활 동선',
    'storage': '수납 공간',
    'natural_light': '자연광',
    'soundproof': '방음/프라이버시',
    'cleaning': '청소 용이성',
    'safety': '안전성',
    'durability': '내구성',
    // 공간
    'kitchen': '주방',
    'bathroom': '욕실',
    'living': '거실',
    'bedroom': '침실',
    'masterBedroom': '안방',
    'room': '방',
    'entrance': '현관',
    'balcony': '발코니',
    'dressRoom': '수납/드레스룸',
  }
  
  // 한글 변환 함수
  const toKorean = (text: string): string => {
    if (!text) return text
    // 이미 한글이면 그대로 반환
    if (/[가-힣]/.test(text)) return text
    // 매핑에서 찾기
    const lower = text.toLowerCase()
    return KOREAN_LABELS[lower] || KOREAN_LABELS[text] || text
  }

  // 스타일 이모지 매핑
  const getStyleEmoji = (style: string): string => {
    const s = style.toLowerCase()
    if (s.includes('힐링') || s.includes('내추럴') || s.includes('healing') || s.includes('natural')) return '🌿'
    if (s.includes('모던') || s.includes('미니멀') || s.includes('modern') || s.includes('minimal')) return '⬜'
    if (s.includes('럭셔리') || s.includes('호텔') || s.includes('luxury') || s.includes('hotel')) return '✨'
    if (s.includes('패밀리') || s.includes('가족') || s.includes('family')) return '👨‍👩‍👧'
    if (s.includes('북유럽') || s.includes('스칸디') || s.includes('scandinavian')) return '🪵'
    if (s.includes('인더스트리얼') || s.includes('industrial')) return '🏭'
    return '🏠'
  }

  // 등급 이모지 매핑
  const getGradeInfo = (grade: string) => {
    const gradeMap: Record<string, { emoji: string; name: string; color: string }> = {
      'basic': { emoji: '💰', name: '실속형', color: 'text-gray-700' },
      'standard': { emoji: '⭐', name: '표준형', color: 'text-blue-600' },
      'argen': { emoji: '🏆', name: '아르젠', color: 'text-argen-500' },
      'premium': { emoji: '💎', name: '프리미엄', color: 'text-amber-600' },
    }
    return gradeMap[grade] || gradeMap['argen']
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-argen-50/30">
      <StepIndicator currentStep={5} />
      
      <main className="max-w-3xl mx-auto px-4 py-8 pb-32">
        <AnimatePresence mode="wait">
          {/* 분석 중 화면 */}
          {(stage === 'collecting' || stage === 'analyzing') && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              {/* 분석 애니메이션 */}
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-28 h-28 mx-auto mb-8 bg-gradient-to-br from-argen-500 to-argen-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-300/50"
              >
                <Sparkles className="w-14 h-14 text-white" />
              </motion.div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                인테리봇이 분석 중입니다
              </h1>
              <p className="text-gray-500 mb-8 text-lg">{progressText}</p>
              
              {/* 프로그레스 바 */}
              <div className="max-w-sm mx-auto mb-10">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-argen-500 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">{progress}%</p>
              </div>
              
              {/* 수집 정보 카드 */}
              <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-100 max-w-sm mx-auto">
                <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">분석 중인 정보</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Home className="w-5 h-5 text-argen-500" />
                    <span>{spaceInfo?.pyeong || 0}평 {spaceInfo?.housingType || ''}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Target className="w-5 h-5 text-argen-500" />
                    <span>공간 {selectedSpaces.filter(s => s.isSelected).length}개 선택</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Heart className="w-5 h-5 text-argen-500" />
                    <span>성향 분석 {personalityAnalysis?.mode ? '완료' : '기본'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 에러 화면 */}
          {stage === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">분석 중 문제가 발생했습니다</h1>
              <p className="text-gray-500 mb-8">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  이전 단계로
                </button>
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-argen-500 text-white rounded-xl hover:bg-argen-600"
                >
                  다시 시도
                </button>
              </div>
            </motion.div>
          )}

          {/* 분석 완료 화면 - B안 스토리텔링 */}
          {stage === 'complete' && analysisResult && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 완료 헤더 */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  🎉 AI 분석 완료!
                </h1>
                <p className="text-gray-500">
                  {spaceInfo?.pyeong}평 {spaceInfo?.housingType}의 {selectedSpaces.filter(s => s.isSelected).length}개 공간을 분석했습니다
                </p>
              </div>

              {/* 📖 스토리 카드 - 고객 이야기 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-argen-500 via-argen-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl"
              >
                <div className="flex items-center gap-2 mb-4 text-purple-200">
                  <Quote className="w-5 h-5" />
                  <span className="text-sm font-medium">고객님을 위한 인테리어 이야기</span>
                </div>
                
                <p className="text-lg leading-relaxed mb-6 text-white/95">
                  {analysisResult.customerProfile.lifestyle}
                </p>
                
                {/* 추천 스타일 */}
                <div className="bg-white/15 backdrop-blur rounded-2xl p-4">
                  <p className="text-purple-200 text-sm mb-2">추천 스타일</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getStyleEmoji(analysisResult.customerProfile.style)}</span>
                    <span className="text-2xl font-bold">{toKorean(analysisResult.customerProfile.style)}</span>
                  </div>
                </div>
              </motion.div>

              {/* 🏡 집값 방어 점수 + 생활 개선 점수 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* 집값 방어 점수 */}
                {analysisResult.homeValueScore && (
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        🏡 집값 방어 점수
                      </h3>
                      <div className="text-xl text-yellow-500">
                        {'★'.repeat(analysisResult.homeValueScore.score)}
                        {'☆'.repeat(5 - analysisResult.homeValueScore.score)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{analysisResult.homeValueScore.reason}</p>
                    <p className="text-xs text-emerald-700 bg-emerald-100 rounded-lg px-3 py-2">
                      💰 {analysisResult.homeValueScore.investmentValue}
                    </p>
                  </div>
                )}
                
                {/* 생활 개선 점수 */}
                {analysisResult.lifestyleScores && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      📈 생활 개선 점수
                    </h3>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-12">수납</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${analysisResult.lifestyleScores.storage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-blue-600 w-8">{analysisResult.lifestyleScores.storage}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-12">청소</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${analysisResult.lifestyleScores.cleaning}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-green-600 w-8">{analysisResult.lifestyleScores.cleaning}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-12">동선</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-argen-500 rounded-full transition-all"
                            style={{ width: `${analysisResult.lifestyleScores.flow}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-argen-500 w-8">{analysisResult.lifestyleScores.flow}</span>
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2">
                      ✨ {analysisResult.lifestyleScores.comment}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* 🎯 핵심 포인트 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-argen-500" />
                  이런 포인트에 집중할게요
                </h2>
                
                <div className="space-y-3">
                  {analysisResult.customerProfile.priorities.map((priority, i) => (
                    <div 
                      key={i}
                      className="flex items-center gap-3 p-3 bg-argen-50 rounded-xl"
                    >
                      <div className="w-8 h-8 bg-argen-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </div>
                      <span className="text-gray-800 font-medium">{toKorean(priority)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* 🏠 공간별 맞춤 추천 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  공간별 맞춤 추천
                </h2>
                
                <div className="space-y-4">
                  {analysisResult.spaceAnalysis.slice(0, 3).map((space, i) => (
                    <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold">
                          {toKorean(space.space).charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">{toKorean(space.space)}</h3>
                          <p className="text-gray-600 text-sm mb-2">{space.recommendation}</p>
                          <div className="flex flex-wrap gap-2">
                            {space.tips.slice(0, 2).map((tip, j) => (
                              <span 
                                key={j}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg"
                              >
                                <Lightbulb className="w-3 h-3" />
                                {tip.length > 25 ? tip.substring(0, 25) + '...' : tip}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* 💰 추천 등급 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-600" />
                  추천 등급
                </h2>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">{getGradeInfo(analysisResult.budgetAdvice.grade).emoji}</div>
                  <div>
                    <p className={`text-2xl font-bold ${getGradeInfo(analysisResult.budgetAdvice.grade).color}`}>
                      {getGradeInfo(analysisResult.budgetAdvice.grade).name}
                    </p>
                    <p className="text-sm text-gray-500">가성비와 품질, 두 마리 토끼를 잡으세요</p>
                  </div>
                </div>
                
                <p className="text-gray-700 text-sm bg-white/60 rounded-xl p-4">
                  {analysisResult.budgetAdvice.reason.length > 150 
                    ? analysisResult.budgetAdvice.reason.substring(0, 150) + '...'
                    : analysisResult.budgetAdvice.reason}
                </p>
              </motion.div>

              {/* ⚠️ 주의사항 */}
              {analysisResult.warnings.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-red-50 rounded-2xl p-5 border border-red-100"
                >
                  <h2 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    꼭 확인하세요
                  </h2>
                  <ul className="space-y-2">
                    {analysisResult.warnings.slice(0, 2).map((warning, i) => (
                      <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* ⏭️ 다음 단계 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gray-50 rounded-2xl p-5 border border-gray-200"
              >
                <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  다음 단계
                </h2>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.nextSteps.map((step, i) => (
                    <span 
                      key={i}
                      className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-white text-gray-700 rounded-full border border-gray-200"
                    >
                      <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      {step.length > 20 ? step.substring(0, 20) + '...' : step}
                    </span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 하단 네비게이션 */}
      {stage === 'complete' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                이전
              </button>
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-argen-500 to-argen-600 text-white rounded-xl hover:from-argen-600 hover:to-indigo-700 transition-all font-bold shadow-lg"
              >
                <Star className="w-5 h-5" />
                견적 확인하기
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 지연 함수
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
