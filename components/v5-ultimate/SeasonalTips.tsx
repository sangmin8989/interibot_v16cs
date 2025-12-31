import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sun, Wind, Snowflake, Leaf } from 'lucide-react'

type Season = 'spring' | 'summer' | 'autumn' | 'winter'

type Tip = {
  title: string
  description: string
  checklist: string[]
  icon: React.ReactNode
  gradient: string
}

const TIPS: Record<Season, Tip> = {
  spring: {
    title: '봄: 환기 + 대청소',
    description: '미세먼지/꽃가루 대비, 창문 단열 점검',
    checklist: [
      '환기 필터 교체, 창문 틈새 청소',
      '커튼/블라인드 세탁, 톤온톤 패브릭 교체',
      '거실·침실 수납 재정비, 불필요한 소품 정리',
    ],
    icon: <Wind className="w-5 h-5 text-[#4AA3A2]" />,
    gradient: 'from-teal-50 via-emerald-50 to-lime-50',
  },
  summer: {
    title: '여름: 냉방 효율 UP',
    description: '햇빛 차단 + 냉방비 절약',
    checklist: [
      '라이트 컬러 커튼/필름으로 햇빛 차단',
      '에어컨 필터 청소, 실외기 통풍 확보',
      '러그/패브릭 교체로 시원한 질감 유지',
    ],
    icon: <Sun className="w-5 h-5 text-[#F59E0B]" />,
    gradient: 'from-amber-50 via-orange-50 to-yellow-50',
  },
  autumn: {
    title: '가을: 조명 + 공기 질',
    description: '일교차 대비, 간접조명으로 분위기 전환',
    checklist: [
      '간접조명/스탠드로 따뜻한 무드 만들기',
      '제습/가습기 필터 점검, 환기 루틴 만들기',
      '우드/패브릭 소품으로 계절감 추가',
    ],
    icon: <Leaf className="w-5 h-5 text-[#B45309]" />,
    gradient: 'from-orange-50 via-amber-50 to-rose-50',
  },
  winter: {
    title: '겨울: 난방 + 단열',
    description: '열손실 줄이고 따뜻한 무드',
    checklist: [
      '창문 틈새 막기(문풍지, 커튼 이중 레이어)',
      '따뜻한 러그/쿠션으로 체감온도 올리기',
      '환기 시 5분 강환기로 결로 방지',
    ],
    icon: <Snowflake className="w-5 h-5 text-[#60A5FA]" />,
    gradient: 'from-slate-50 via-blue-50 to-cyan-50',
  },
}

interface SeasonalTipsProps {
  season?: Season
}

export default function SeasonalTips({ season = guessSeason() }: SeasonalTipsProps) {
  const tip = useMemo(() => TIPS[season], [season])

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-[#9B8C7A]">계절별 인테리어 팁</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1F1F1F]">
            지금 계절에 딱 맞는 홈 케어 체크리스트
          </h1>
          <p className="text-sm text-[#7A6A59]">
            간단한 체크만으로 분위기와 효율을 동시에 챙기세요.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-[#E8E0D5] bg-white shadow-sm overflow-hidden"
        >
          <div className={`h-24 bg-gradient-to-r ${tip.gradient} flex items-center px-6 gap-3`}>
            <div className="p-3 bg-white/70 rounded-xl border border-white/60 shadow-sm">
              {tip.icon}
            </div>
            <div>
              <p className="text-sm text-[#7A6A59] capitalize">{season}</p>
              <p className="text-xl font-semibold text-[#1F1F1F]">{tip.title}</p>
              <p className="text-sm text-[#7A6A59]">{tip.description}</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-[#9B8C7A]">체크리스트</p>
            <div className="space-y-3">
              {tip.checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[#E8E0D5] bg-[#FDFBF7]"
                >
                  <p className="text-[#1F1F1F] text-sm">{item}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#9B8C7A]">
              TIP: 계절 바뀔 때 한 번씩만 체크해도 체감이 확 달라집니다.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function guessSeason(): Season {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}
