'use client'

import { useState, Suspense, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import StepIndicator from '@/components/onboarding/StepIndicator'
import { useSpaceInfoStore, HousingTypeLabel, ApproximateRange, AgeGroups, SpecialConditions } from '@/lib/store/spaceInfoStore'
import { BudgetRange, BUDGET_OPTIONS } from '@/lib/data/budget-options'
import { resetEverything } from '@/lib/utils/resetAllStores'
import AgeRangeSection from '@/components/step1/AgeRangeSection'
import FamilySizeSection from '@/components/step1/FamilySizeSection'
import LifeStyleSection from '@/components/step1/LifeStyleSection'

type HousingType = 'apartment' | 'villa' | 'officetel' | 'house' | 'other'
type Region = 'seoul' | 'gyeonggi' | 'incheon' | 'busan' | 'daegu' | 'gwangju' | 'daejeon' | 'ulsan' | 'sejong' | 'gangwon' | 'chungbuk' | 'chungnam' | 'jeonbuk' | 'jeonnam' | 'gyeongbuk' | 'gyeongnam' | 'jeju'

interface SpaceInfo {
  housingType: HousingType
  region: Region
  size: number // 평수
  roomCount?: number // 방 개수
  bathroomCount?: number // 화장실 개수
}

// 주거형태 옵션 (아이콘 + 설명, 기타 제거)
const HOUSING_TYPES = [
  { 
    key: 'house' as HousingType, 
    label: '단독주택', 
    description: '단독 건물 전체',
    icon: '🏠'
  },
  { 
    key: 'villa' as HousingType, 
    label: '빌라', 
    description: '다세대/빌라',
    icon: '🏘️'
  },
  { 
    key: 'apartment' as HousingType, 
    label: '아파트', 
    description: '복도형/타워형',
    icon: '🏢'
  },
  { 
    key: 'officetel' as HousingType, 
    label: '오피스텔', 
    description: '주방·거실 한 공간',
    icon: '🏬'
  },
]

// HousingType을 HousingTypeLabel로 변환
const housingTypeToLabel = (type: HousingType): HousingTypeLabel => {
  const mapping: Record<HousingType, HousingTypeLabel> = {
    house: '단독주택',
    villa: '빌라',
    apartment: '아파트',
    officetel: '오피스텔',
    other: '기타',
  }
  return mapping[type]
}

// HousingTypeLabel을 HousingType으로 변환
const labelToHousingType = (label: HousingTypeLabel): HousingType => {
  const mapping: Record<HousingTypeLabel, HousingType> = {
    '단독주택': 'house',
    '빌라': 'villa',
    '아파트': 'apartment',
    '오피스텔': 'officetel',
    '기타': 'other',
  }
  return mapping[label]
}

const REGIONS = {
  seoul: '서울',
  gyeonggi: '경기',
  incheon: '인천',
  busan: '부산',
  daegu: '대구',
  gwangju: '광주',
  daejeon: '대전',
  ulsan: '울산',
  sejong: '세종',
  gangwon: '강원',
  chungbuk: '충북',
  chungnam: '충남',
  jeonbuk: '전북',
  jeonnam: '전남',
  gyeongbuk: '경북',
  gyeongnam: '경남',
  jeju: '제주',
}

function SpaceInfoPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') || 'quick'

  // Zustand store
  const { spaceInfo: storedSpaceInfo, updateSpaceInfo, isValid, clearSpaceInfo } = useSpaceInfoStore()

  // 평수 입력 방식 state
  const [sizeInputMode, setSizeInputMode] = useState<'exact' | 'approximate'>('exact')
  const [approximateRange, setApproximateRange] = useState<string>('')
  
  // 방 개수 자동 제안 state
  const [roomCountMode, setRoomCountMode] = useState<'auto' | 'manual' | 'unknown'>('auto')
  
  // 화장실 개수 자동 제안 state
  const [bathroomCountMode, setBathroomCountMode] = useState<'auto' | 'manual' | 'unknown'>('auto')

  // 가족 구성 정보 state (기존 구조 유지 - 호환성)
  const [ageGroups, setAgeGroups] = useState<AgeGroups>({
    baby: 0,
    child: 0,
    teen: 0,
    adult: 0,
    senior: 0,
  })
  const [totalPeople, setTotalPeople] = useState<number>(0)
  const [specialConditions, setSpecialConditions] = useState<SpecialConditions>({
    hasPets: false,
    petTypes: [],
    hasElderly: false,
    hasPregnant: false,
    hasDisabledMember: false,
    hasShiftWorker: false,
  })
  
  // Step1 새 구조 state
  const [ageRanges, setAgeRanges] = useState<string[]>([]) // 다중 선택으로 변경
  const [familySizeRange, setFamilySizeRange] = useState<string | null>(null)
  const [lifestyleTags, setLifestyleTags] = useState<string[]>([])
  const [additionalNotes, setAdditionalNotes] = useState<string>('') // 추가 정보 (자유 입력)
  
  // 예산 state
  const [selectedBudget, setSelectedBudget] = useState<BudgetRange>('unknown')
  const [budgetAmount, setBudgetAmount] = useState<number | undefined>(undefined)
  
  // 거주 목적/기간 state
  const [livingPurpose, setLivingPurpose] = useState<'실거주' | '매도준비' | '임대' | '입력안함'>('입력안함')
  const [livingYears, setLivingYears] = useState<number | undefined>(undefined)

  // 폼 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 유효성 검사 에러 state
  const [errors, setErrors] = useState<{
    housingType?: string
    size?: string
  }>({})

  // 자동 제안 애니메이션 트리거
  const [pulseRoomCount, setPulseRoomCount] = useState(false)
  const [pulseBathroomCount, setPulseBathroomCount] = useState(false)

  // 로컬 state (UI용) - 항상 초기값으로 시작
  const [spaceInfo, setSpaceInfo] = useState<SpaceInfo>({
    housingType: 'apartment', // 항상 초기값
    region: 'seoul',
    size: 0,
    roomCount: 0,
    bathroomCount: 0,
  })

  // 리셋 함수
  const resetAllFields = useCallback(() => {
    // Store 초기화
    clearSpaceInfo()
    
    // 모든 로컬 state도 초기값으로 리셋
    setSpaceInfo({
      housingType: 'apartment', // 항상 초기값으로 리셋
      region: 'seoul',
      size: 0,
      roomCount: 0,
      bathroomCount: 0,
    })
    setSizeInputMode('exact')
    setApproximateRange('')
    setRoomCountMode('auto')
    setBathroomCountMode('auto')
    setAgeGroups({
      baby: 0,
      child: 0,
      teen: 0,
      adult: 0,
      senior: 0,
    })
    setTotalPeople(0)
    setSpecialConditions({
      hasPets: false,
      petTypes: [],
      hasElderly: false,
      hasPregnant: false,
      hasDisabledMember: false,
      hasShiftWorker: false,
    })
    setAgeRanges([])
    setFamilySizeRange(null)
    setLifestyleTags([])
    setAdditionalNotes('') // 추가 정보 리셋
    setSelectedBudget('unknown')
    setBudgetAmount(undefined)
    setLivingPurpose('입력안함')
    setLivingYears(undefined)
    setErrors({})
  }, [clearSpaceInfo])

  // ✅ 페이지 마운트 시 저장된 데이터 로드 (핵심 수정!)
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/space-info/page.tsx:214',message:'useEffect 진입 (데이터 로드)',data:{hasStoredSpaceInfo:!!storedSpaceInfo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // URL 쿼리 파라미터로 리셋 여부 확인
    const shouldReset = searchParams.get('reset') === 'true'
    const shouldClear = searchParams.get('clear') === 'true'
    
    // localStorage 클리어 (개발 환경)
    if (shouldClear && process.env.NODE_ENV === 'development') {
      const storeKeys = [
        'space-info-storage',
        'personality-analysis-storage',
        'scope-selection-storage',
        'process-selection-storage',
      ]
      storeKeys.forEach(key => {
        localStorage.removeItem(key)
        console.log(`✅ ${key} 클리어 완료`)
      })
      console.log('🎉 모든 store 데이터 클리어 완료!')
      // URL에서 clear 파라미터 제거하고 새로고침
      const newUrl = window.location.pathname + (searchParams.get('reset') ? '?reset=true' : '')
      window.history.replaceState({}, '', newUrl)
      window.location.reload()
      return
    }
    
    if (shouldReset) {
      resetAllFields()
      return
    }
    
    // ✅ 저장된 데이터 유효성 확인
    if (storedSpaceInfo) {
      // timestamp 확인 - 1시간 이상 지났으면 초기화 (새 온보딩으로 간주)
      const savedTime = new Date(storedSpaceInfo.timestamp).getTime()
      const currentTime = new Date().getTime()
      const ONE_HOUR = 60 * 60 * 1000
      
      if (currentTime - savedTime > ONE_HOUR) {
        console.log('⏰ 저장된 데이터가 1시간 이상 지남 - 새 온보딩 시작')
        resetAllFields()
        return
      }
      
      console.log('📦 저장된 집 정보 로드:', storedSpaceInfo)
      
      // 주거형태 변환
      const housingType = labelToHousingType(storedSpaceInfo.housingType)
      
      // 평수 로드 (핵심!)
      const loadedPyeong = storedSpaceInfo.pyeong || 0
      
      setSpaceInfo({
        housingType: housingType || 'apartment',
        region: 'seoul', // 기본값
        size: loadedPyeong, // ✅ 저장된 평수 로드
        roomCount: storedSpaceInfo.rooms || 0,
        bathroomCount: storedSpaceInfo.bathrooms || 0,
      })
      
      // 입력 방식 로드
      setSizeInputMode(storedSpaceInfo.inputMethod || 'exact')
      if (storedSpaceInfo.approximateRange) {
        const rangeMap: Record<string, string> = {
          '20평대': '20s',
          '30평대': '30s',
          '40평대': '40s',
          '50평 이상': '50plus',
        }
        setApproximateRange(rangeMap[storedSpaceInfo.approximateRange] || '')
      }
      
      // 기타 정보 로드
      setAgeGroups(storedSpaceInfo.ageGroups || { baby: 0, child: 0, teen: 0, adult: 0, senior: 0 })
      setTotalPeople(storedSpaceInfo.totalPeople || 0)
      setSpecialConditions(storedSpaceInfo.specialConditions || {
        hasPets: false,
        petTypes: [],
        hasElderly: false,
        hasPregnant: false,
        hasDisabledMember: false,
        hasShiftWorker: false,
      })
      setAgeRanges(storedSpaceInfo.ageRanges || [])
      setFamilySizeRange(storedSpaceInfo.familySizeRange || null)
      setLifestyleTags(storedSpaceInfo.lifestyleTags || [])
      setSelectedBudget(storedSpaceInfo.budget || 'unknown')
      setBudgetAmount(storedSpaceInfo.budgetAmount)
      setLivingPurpose(storedSpaceInfo.livingPurpose || '입력안함')
      setLivingYears(storedSpaceInfo.livingYears)
      setAdditionalNotes(storedSpaceInfo.additionalNotes || '') // 추가 정보 로드
      
      console.log('✅ 집 정보 로드 완료 - 평수:', loadedPyeong)
    } else {
      console.log('📝 새로운 집 정보 입력 시작')
    }
  }, [storedSpaceInfo, searchParams, resetAllFields])

  // 평수에 따른 방 개수 자동 제안 함수 (대한민국 아파트 평균)
  const getSuggestedRoomCount = (pyeong: number): number => {
    if (pyeong <= 15) return 1           // 원룸/오피스텔
    if (pyeong >= 16 && pyeong <= 20) return 2   // 소형 (투룸)
    if (pyeong >= 21 && pyeong <= 34) return 3   // 국민평형~중형 (쓰리룸)
    if (pyeong >= 35 && pyeong <= 50) return 4   // 중대형 (포룸)
    if (pyeong >= 51) return 5           // 대형
    return 3 // 기본값
  }

  // 평수에 따른 화장실 개수 자동 제안 함수 (대한민국 아파트 평균)
  const getSuggestedBathroomCount = (pyeong: number): number => {
    if (pyeong <= 20) return 1           // 소형: 화장실 1개
    if (pyeong >= 21 && pyeong <= 50) return 2   // 국민평형~중대형: 화장실 2개
    if (pyeong >= 51) return 3           // 대형: 화장실 3개
    return 2 // 기본값
  }

  // 평수 범위 텍스트 가져오기
  const getPyeongRangeText = (pyeong: number): string => {
    if (pyeong <= 15) return '15평 이하 (원룸)'
    if (pyeong >= 16 && pyeong <= 20) return '16~20평 (소형)'
    if (pyeong >= 21 && pyeong <= 25) return '21~25평 (국민평형)'
    if (pyeong >= 26 && pyeong <= 34) return '26~34평 (중형)'
    if (pyeong >= 35 && pyeong <= 50) return '35~50평 (중대형)'
    if (pyeong >= 51) return '51평 이상 (대형)'
    return ''
  }

  const handleHousingTypeChange = (type: HousingType) => {
    setSpaceInfo(prev => ({ ...prev, housingType: type }))
    // ✅ Store에도 즉시 저장 (주거형태가 리셋되는 문제 방지)
    updateSpaceInfo({
      housingType: housingTypeToLabel(type),
    })
    console.log('🏠 주거형태 변경:', { type, label: housingTypeToLabel(type) })
  }

  const handleRegionChange = (region: Region) => {
    setSpaceInfo({ ...spaceInfo, region })
  }

  const handleSizeChange = (size: number) => {
    // 백스페이스로 지울 때 0도 허용 (size >= 0)
    if (size >= 0 && size <= 500) {
      console.log('📝 [평수 입력 시작]:', { 
        입력값: size, 
        현재모드: sizeInputMode, 
        현재범위: approximateRange,
        현재spaceInfoSize: spaceInfo.size,
        저장된pyeong: storedSpaceInfo?.pyeong,
      });
      
      // ✅ 모든 state 업데이트를 함께 처리
      // 직접 평수를 입력하면 입력 모드를 'exact'로 자동 변경
      if (sizeInputMode === 'approximate' && size > 0) {
        console.log('🔄 [입력 모드 변경] approximate → exact');
        setSizeInputMode('exact');
      }
      
      // ✅ approximateRange가 설정되어 있고, 사용자가 직접 평수를 입력하면 무조건 초기화
      // 차이와 상관없이 직접 입력하면 무조건 초기화 (주석과 일치하도록 수정)
      if (approximateRange && size > 0) {
        console.log('🔄 [approximateRange 초기화] 직접 입력 감지:', { 
          이전범위: approximateRange, 
          입력값: size 
        });
        setApproximateRange('');
      }
      
      // 방 개수와 화장실 개수 자동 제안
      let suggestedRooms = spaceInfo.roomCount || 0
      let suggestedBathrooms = spaceInfo.bathroomCount || 0
      
      if (roomCountMode === 'auto' || roomCountMode === 'unknown') {
        suggestedRooms = getSuggestedRoomCount(size)
        setPulseRoomCount(true)
        setTimeout(() => setPulseRoomCount(false), 600)
      }
      
      if (bathroomCountMode === 'auto' || bathroomCountMode === 'unknown') {
        suggestedBathrooms = getSuggestedBathroomCount(size)
        setPulseBathroomCount(true)
        setTimeout(() => setPulseBathroomCount(false), 600)
      }
      
      // ✅ 한 번에 상태 업데이트 (로컬 state + Zustand store 모두 업데이트)
      setSpaceInfo(prev => ({
        ...prev,
        size,
        roomCount: suggestedRooms,
        bathroomCount: suggestedBathrooms
      }))
      
      // ✅ Zustand store도 함께 업데이트 (올바른 필드명 사용: size → pyeong, roomCount → rooms, bathroomCount → bathrooms)
      // ✅ 주거형태도 함께 저장하여 리셋 방지
      console.log('💾 [Zustand 저장 시작]:', { 
        저장할평수: size,
        현재저장된평수: storedSpaceInfo?.pyeong,
      });
      
      // ✅ 평수를 먼저 명시적으로 저장 (우선순위 최상위)
      // ✅ 직접 평수 입력 시 approximateRange를 undefined로 명시적으로 초기화
      updateSpaceInfo({
        pyeong: size, // ✅ 입력한 평수를 명시적으로 저장
        approximateRange: undefined, // ✅ 직접 입력 시 approximateRange 명시적으로 초기화
        inputMethod: 'exact', // ✅ 입력 방식도 명시
      })
      
      // ✅ 나머지 정보 저장
      updateSpaceInfo({
        housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 현재 주거형태 유지
        pyeong: size, // ✅ 평수 다시 한 번 명시 (중복 저장으로 확실히 보장)
        squareMeter: parseFloat((size * 3.3058).toFixed(2)), // 제곱미터도 함께 계산
        rooms: suggestedRooms, // ✅ roomCount가 아니라 rooms로 저장
        bathrooms: suggestedBathrooms, // ✅ bathroomCount가 아니라 bathrooms로 저장
        approximateRange: undefined, // ✅ 직접 입력 시 approximateRange 명시적으로 초기화 (이중 체크)
        inputMethod: 'exact', // ✅ 입력 방식 명시
      })
      
      // ✅ 저장 확인
      setTimeout(() => {
        const saved = useSpaceInfoStore.getState().spaceInfo;
        console.log('✅ [Zustand 저장 확인]:', { 
          저장한평수: size,
          실제저장된평수: saved?.pyeong,
          일치여부: saved?.pyeong === size ? '✅ 일치' : '❌ 불일치',
        });
        if (saved?.pyeong !== size) {
          console.error('❌ [평수 저장 실패!] 재시도...');
          updateSpaceInfo({ pyeong: size });
        }
      }, 100);
      
      // 입력 시 에러 제거
      if (errors.size) {
        setErrors({ ...errors, size: undefined })
      }
      
      console.log('✅ [평수 업데이트 완료]:', { 
        size, 
        roomCount: suggestedRooms, 
        bathroomCount: suggestedBathrooms,
        입력모드: 'exact',
        approximateRange: '', // 초기화됨
      })
    }
  }

  const handleApproximateRangeSelect = (range: string, pyeong: number) => {
    setApproximateRange(range)
    const suggestedRooms = (roomCountMode === 'auto' || roomCountMode === 'unknown') 
      ? getSuggestedRoomCount(pyeong) 
      : spaceInfo.roomCount
    const suggestedBathrooms = (bathroomCountMode === 'auto' || bathroomCountMode === 'unknown')
      ? getSuggestedBathroomCount(pyeong)
      : spaceInfo.bathroomCount
    
    setSpaceInfo({ 
      ...spaceInfo, 
      size: pyeong, 
      roomCount: suggestedRooms,
      bathroomCount: suggestedBathrooms
    })
    
    // Pulse 효과 트리거
    if (roomCountMode === 'auto' || roomCountMode === 'unknown') {
      setPulseRoomCount(true)
      setTimeout(() => setPulseRoomCount(false), 600)
    }
    if (bathroomCountMode === 'auto' || bathroomCountMode === 'unknown') {
      setPulseBathroomCount(true)
      setTimeout(() => setPulseBathroomCount(false), 600)
    }
    
    // Store 업데이트
    const rangeLabel: ApproximateRange = 
      range === '20s' ? '20평대' :
      range === '30s' ? '30평대' :
      range === '40s' ? '40평대' :
      '50평 이상'
    
    updateSpaceInfo({
      housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
      pyeong,
      squareMeter: parseFloat((pyeong * 3.3058).toFixed(2)),
      inputMethod: 'approximate',
      approximateRange: rangeLabel,
      rooms: suggestedRooms,
      bathrooms: suggestedBathrooms,
      isRoomAuto: roomCountMode === 'auto' || roomCountMode === 'unknown',
      isBathroomAuto: bathroomCountMode === 'auto' || bathroomCountMode === 'unknown',
    })
    
    // 선택 시 에러 제거
    if (errors.size) {
      setErrors({ ...errors, size: undefined })
    }
  }

  const handleRoomCountChange = (count: number) => {
    if (count >= 1 && count <= 10) {
      setSpaceInfo({ ...spaceInfo, roomCount: count })
      setRoomCountMode('manual')
      // Store 업데이트
      updateSpaceInfo({
        housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
        rooms: count,
        isRoomAuto: false,
      })
    }
  }

  // 방 개수 "모르겠어요" 토글 (다시 클릭하면 해제)
  const handleRoomCountUnknown = () => {
    if (roomCountMode === 'unknown') {
      // 이미 "모르겠어요" 상태면 → auto로 전환 (다시 선택 가능)
      setRoomCountMode('auto')
    } else {
      // "모르겠어요" 선택
      setRoomCountMode('unknown')
      const suggestedRooms = getSuggestedRoomCount(spaceInfo.size)
      setSpaceInfo({ ...spaceInfo, roomCount: suggestedRooms })
      updateSpaceInfo({
        housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
        rooms: suggestedRooms,
        isRoomAuto: true,
      })
    }
  }

  const handleBathroomCountChange = (count: number) => {
    if (count >= 1 && count <= 10) {
      setSpaceInfo({ ...spaceInfo, bathroomCount: count })
      setBathroomCountMode('manual')
      // Store 업데이트
      updateSpaceInfo({
        housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
        bathrooms: count,
        isBathroomAuto: false,
      })
    }
  }

  // 화장실 개수 "모르겠어요" 토글 (다시 클릭하면 해제)
  const handleBathroomCountUnknown = () => {
    if (bathroomCountMode === 'unknown') {
      // 이미 "모르겠어요" 상태면 → auto로 전환 (다시 선택 가능)
      setBathroomCountMode('auto')
    } else {
      // "모르겠어요" 선택
      setBathroomCountMode('unknown')
      const suggestedBathrooms = getSuggestedBathroomCount(spaceInfo.size)
      setSpaceInfo({ ...spaceInfo, bathroomCount: suggestedBathrooms })
      updateSpaceInfo({
        housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
        bathrooms: suggestedBathrooms,
        isBathroomAuto: true,
      })
    }
  }

  // 연령대 카드 토글 핸들러
  const handleAgeGroupToggle = (group: keyof AgeGroups) => {
    const isActive = ageGroups[group] > 0
    const newValue = isActive ? 0 : 1 // OFF → ON 시 1명, ON → OFF 시 0명
    
    const newAgeGroups = { ...ageGroups, [group]: newValue }
    setAgeGroups(newAgeGroups)
    
    // 총 인원수 자동 계산
    const total = Object.values(newAgeGroups).reduce((sum, count) => sum + count, 0)
    setTotalPeople(total)
    
    // Store 업데이트
    updateSpaceInfo({
      housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
      ageGroups: newAgeGroups,
      totalPeople: total,
    })
  }

  // 연령대 인원수 변경 핸들러
  const handleAgeGroupChange = (group: keyof AgeGroups, value: number) => {
    const newValue = Math.max(0, value)
    const newAgeGroups = { ...ageGroups, [group]: newValue }
    setAgeGroups(newAgeGroups)
    
    // 숫자가 0이 되면 자동으로 OFF (이미 0이므로 상태는 유지됨)
    // UI에서 isActive = count > 0으로 체크하므로 자동으로 OFF 상태로 표시됨
    
    // 총 인원수 자동 계산
    const total = Object.values(newAgeGroups).reduce((sum, count) => sum + count, 0)
    setTotalPeople(total)
    
    // Store 업데이트
    updateSpaceInfo({
      housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
      ageGroups: newAgeGroups,
      totalPeople: total,
    })
  }

  // 특수 조건 변경 핸들러
  const handleSpecialConditionChange = (key: keyof SpecialConditions, value: boolean | string[]) => {
    const newConditions = { ...specialConditions, [key]: value }
    setSpecialConditions(newConditions)
    
    // Store 업데이트
    updateSpaceInfo({
      housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
      specialConditions: newConditions,
    })
  }

  const handleNext = () => {
    // 중복 제출 방지
    if (isSubmitting) {
      console.log('⏳ 이미 제출 중입니다...')
      return
    }
    
    setIsSubmitting(true)
    
    // 에러 초기화
    const newErrors: { housingType?: string; size?: string } = {}

    // 1. 주거형태 검증
    if (!spaceInfo.housingType) {
      newErrors.housingType = '주거형태를 선택해주세요'
    }

    // ✅ 평수 최종 확인 및 저장 (직접 입력값 절대 우선!)
    // ⚠️ 중요: 사용자가 직접 입력한 평수는 절대 덮어쓰면 안 됨!
    // 1순위: spaceInfo.size (사용자가 직접 입력한 값) - 절대 우선!
    // 2순위: storedSpaceInfo.pyeong (이전에 저장된 값)
    // 3순위: approximateRange (범위 선택만 한 경우)
    
    let finalPyeong = 0;
    
    // ✅ 1순위: spaceInfo.size가 있으면 무조건 사용 (직접 입력값이 최우선!)
    // ⚠️ approximateRange가 있어도 spaceInfo.size가 있으면 spaceInfo.size를 사용!
    if (spaceInfo.size && spaceInfo.size > 0) {
      finalPyeong = Number(spaceInfo.size);
      console.log('✅ [평수 우선순위 1] spaceInfo.size 사용 (직접 입력값 우선!):', {
        입력값: finalPyeong,
        approximateRange: approximateRange || '없음',
        sizeInputMode,
        경고: approximateRange ? '⚠️ approximateRange가 있지만 직접 입력값을 우선 사용합니다!' : '',
      });
      
      // ✅ 직접 입력값이 있으면 approximateRange 초기화 (혹시 모를 충돌 방지)
      if (approximateRange) {
        console.log('🔄 [approximateRange 강제 초기화] 직접 입력값이 있으므로 범위 선택 무시');
        setApproximateRange('');
      }
    }
    // ✅ 2순위: storedSpaceInfo.pyeong 확인 (handleSizeChange에서 저장했을 수 있음)
    else if (storedSpaceInfo?.pyeong && storedSpaceInfo.pyeong > 0) {
      finalPyeong = Number(storedSpaceInfo.pyeong);
      console.log('✅ [평수 우선순위 2] storedSpaceInfo.pyeong 사용:', {
        저장된값: finalPyeong,
        sizeInputMode,
        approximateRange: approximateRange || '없음',
      });
    }
    // ✅ 3순위: approximateRange 사용 (직접 입력값이 없을 때만)
    else if (sizeInputMode === 'approximate' && approximateRange) {
      const rangePyeongMap: Record<string, number> = {
        '20s': 22,
        '30s': 32,
        '40s': 42,
        '50plus': 55,
      };
      finalPyeong = rangePyeongMap[approximateRange] || 0;
      console.log('✅ [평수 우선순위 3] approximateRange 사용 (직접 입력값 없음):', {
        입력모드: sizeInputMode,
        범위: approximateRange,
        추출평수: finalPyeong,
      });
    }
    
    // 최종 검증
    finalPyeong = Number(finalPyeong);
    
    // ✅ 입력한 평수가 있으면 반드시 그대로 사용 (절대 변경 금지)
    if (spaceInfo.size && spaceInfo.size > 0) {
      finalPyeong = Number(spaceInfo.size);
      console.log('✅ [최종 확정] 입력한 평수로 강제 설정:', finalPyeong);
    }
    
    console.log('🔍 [평수 최종 검증]:', {
      spaceInfoSize: spaceInfo.size,
      storedPyeong: storedSpaceInfo?.pyeong,
      sizeInputMode,
      approximateRange: approximateRange || '없음',
      최종평수: finalPyeong,
      isValid: finalPyeong > 0 && !isNaN(finalPyeong),
      경고: spaceInfo.size && spaceInfo.size > 0 && finalPyeong !== spaceInfo.size 
        ? '❌ 직접 입력값과 최종값이 다릅니다! 이는 심각한 오류입니다!' 
        : '✅ 정상',
    });
    
    // ✅ 평수 검증 (finalPyeong 기준으로 검증) - finalPyeong 계산 후에만 검증
    if (!finalPyeong || finalPyeong <= 0 || isNaN(finalPyeong)) {
      if (sizeInputMode === 'approximate' && !approximateRange) {
        newErrors.size = '평수 범위를 선택해주세요. 정확한 평수를 모르시면 "대략만 알아요"에서 범위를 선택하시면 됩니다.'
      } else {
        newErrors.size = '평수를 입력해주세요. 등기부등본이나 네이버 부동산의 전용면적을 확인하시면 정확합니다.'
      }
    } else if (finalPyeong > 500) {
      // 최대값만 제한 (500평 초과는 비현실적)
      newErrors.size = '평수가 너무 큽니다. 500평 이하로 입력해주세요.'
    } else if (finalPyeong % 1 !== 0 && finalPyeong % 0.5 !== 0) {
      // 소수점이 0.5 단위가 아니면 경고 (하지만 허용)
      console.warn('⚠️ 평수가 0.5 단위가 아닙니다:', finalPyeong)
    }

    // 에러가 있으면 표시하고 스크롤 이동
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      console.error('❌ 검증 실패:', newErrors);
      
      // 첫 번째 에러 필드로 스크롤 이동 + 시각적 피드백
      const firstErrorField = Object.keys(newErrors)[0]
      setTimeout(() => {
        const element = document.getElementById(`field-${firstErrorField}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.focus()
          
          // 에러 필드에 진동 효과 (모바일)
          if ('vibrate' in navigator) {
            navigator.vibrate(200)
          }
          
          // 에러 필드에 애니메이션 효과
          element.classList.add('animate-shake')
          setTimeout(() => {
            element.classList.remove('animate-shake')
          }, 500)
        }
      }, 100)
      
      setIsSubmitting(false)
      return
    }

    // 에러 없으면 초기화
    setErrors({})
    console.log('✅ 검증 통과, 다음 단계로 진행');

    // 최종 검증 후 Store에 확정 저장
    const approximateRangeLabel: ApproximateRange | undefined = 
      approximateRange === '20s' ? '20평대' :
      approximateRange === '30s' ? '30평대' :
      approximateRange === '40s' ? '40평대' :
      approximateRange === '50plus' ? '50평 이상' :
      undefined

    // 방 개수와 화장실 개수가 없으면 자동값 사용 (finalPyeong 사용)
    const finalRoomCount = spaceInfo.roomCount || getSuggestedRoomCount(finalPyeong)
    const finalBathroomCount = spaceInfo.bathroomCount || getSuggestedBathroomCount(finalPyeong)

    // ✅ 확정 저장 (기존 값 무시하고 완전히 덮어쓰기)
    // ⚠️ 중요: finalPyeong이 spaceInfo.size와 다르면 경고!
    if (spaceInfo.size && spaceInfo.size > 0 && finalPyeong !== spaceInfo.size) {
      console.error('❌ [심각한 오류] 직접 입력값과 최종값이 다릅니다!', {
        직접입력값: spaceInfo.size,
        최종값: finalPyeong,
        차이: Math.abs(spaceInfo.size - finalPyeong),
        경고: '직접 입력값을 우선 사용합니다!',
      });
      // 직접 입력값을 강제로 사용
      finalPyeong = Number(spaceInfo.size);
    }
    
    const updateData = {
      housingType: housingTypeToLabel(spaceInfo.housingType),
      pyeong: finalPyeong, // ✅ 입력한 평수 그대로 저장 (덮어쓰기)
      squareMeter: parseFloat((finalPyeong * 3.3058).toFixed(2)),
      inputMethod: sizeInputMode,
      // ✅ 직접 입력이면 approximateRange를 undefined로 설정, 범위 선택이면 approximateRangeLabel 사용
      approximateRange: sizeInputMode === 'exact' ? undefined : approximateRangeLabel,
      rooms: finalRoomCount,
      bathrooms: finalBathroomCount,
      isRoomAuto: roomCountMode === 'auto' || roomCountMode === 'unknown',
      isBathroomAuto: bathroomCountMode === 'auto' || bathroomCountMode === 'unknown',
      ageGroups,
      totalPeople,
      specialConditions,
      ageRanges,
      familySizeRange,
      lifestyleTags,
      additionalNotes, // 추가 정보
      budget: selectedBudget,
      budgetAmount,
      livingPurpose,
      livingYears,
    }
    
      console.log('💾 [최종 저장 데이터]:', {
      평수: updateData.pyeong,
      직접입력값: spaceInfo.size,
      저장된값: storedSpaceInfo?.pyeong,
      일치여부: updateData.pyeong === spaceInfo.size ? '✅ 일치' : '⚠️ 확인 필요',
      전체데이터: updateData,
    });
      
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'space-info/page.tsx:806',message:'집 정보 입력 최종 저장',data:{평수:updateData.pyeong,직접입력값:spaceInfo.size,저장된값:storedSpaceInfo?.pyeong,일치여부:updateData.pyeong === spaceInfo.size ? '일치' : '불일치',전체데이터:updateData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      }
      // #endregion
    
    // ✅ 평수를 먼저 확실히 저장 (별도로 한 번 더)
    updateSpaceInfo({ pyeong: finalPyeong })
    
    // ✅ 전체 데이터 저장
    updateSpaceInfo(updateData)
    
    // ✅ 저장 확인 (여러 번 확인, 최대 3회 재시도)
    const checkSaved = (retryCount = 0) => {
      const saved = useSpaceInfoStore.getState().spaceInfo
      console.log(`✅ [저장 확인 ${retryCount === 0 ? '1차' : `${retryCount + 1}차`}]:`, { 
        저장된평수: saved?.pyeong, 
        입력한평수: finalPyeong,
        직접입력값: spaceInfo.size,
        일치여부: saved?.pyeong === finalPyeong ? '✅ 일치' : '❌ 불일치',
      })
      
      if (saved?.pyeong !== finalPyeong) {
        console.error('❌ [평수 저장 실패!]', { 
          저장된값: saved?.pyeong, 
          입력값: finalPyeong,
          직접입력값: spaceInfo.size,
          재시도횟수: retryCount,
        })
        
        // 최대 3회 재시도
        if (retryCount < 3) {
          console.log(`🔄 [재시도 ${retryCount + 1}/3] 평수 강제 저장...`)
          updateSpaceInfo({ pyeong: finalPyeong })
          setTimeout(() => {
            checkSaved(retryCount + 1)
          }, 200)
        } else {
          console.error('❌ [재시도 실패!] localStorage 직접 확인 필요')
          // localStorage 직접 확인
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('space-info-storage')
            console.log('💾 [localStorage 직접 확인]:', stored)
            try {
              const parsed = JSON.parse(stored || '{}')
              console.log('💾 [파싱된 데이터]:', parsed)
              if (parsed.state?.spaceInfo?.pyeong !== finalPyeong) {
                console.error('❌ [localStorage에도 저장 실패!] 수동 수정 필요')
              }
            } catch (e) {
              console.error('❌ [localStorage 파싱 실패]:', e)
            }
          }
        }
      } else {
        console.log('✅ [평수 저장 성공!] 최종 확인:', {
          저장된평수: saved?.pyeong,
          직접입력값: spaceInfo.size,
          최종값: finalPyeong,
        })
      }
    }
    
    setTimeout(() => checkSaved(0), 100)
    setTimeout(() => checkSaved(0), 300)
    setTimeout(() => checkSaved(0), 500)

    // 공간 정보를 쿼리 파라미터로 전달하여 성향 분석 페이지로 이동
    const params = new URLSearchParams({
      mode,
      housingType: spaceInfo.housingType,
      region: spaceInfo.region,
      size: spaceInfo.size.toString(),
      roomCount: finalRoomCount.toString(),
      bathroomCount: finalBathroomCount.toString(),
    })
    
    // 새 플로우: 집정보 → 성향분석 (기본 진입)
    router.push(`/onboarding/personality?${params.toString()}`)
    
    // 제출 완료 후 상태 초기화 (페이지 이동 전까지)
    setTimeout(() => {
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <>
      {/* 상단 진행 단계 표시 (6단계) */}
      <StepIndicator currentStep={1} />

      <main className="flex min-h-screen flex-col items-center p-4 md:p-6 lg:p-8 pt-12 md:pt-16 bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 animate-fadeIn">
        <div className="w-full max-w-[800px]">
          {/* 타이틀 영역 */}
          <div className="text-center mb-4 md:mb-6 relative">
            {/* 초기화 버튼 */}
            {storedSpaceInfo && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('모든 입력 정보를 초기화하고 처음부터 다시 시작하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
                    resetEverything()
                    router.push('/') // ✅ 첫 페이지(홈)로 이동
                  }
                }}
                className="absolute right-2 top-0 text-xs md:text-sm text-gray-500 hover:text-red-600 transition-colors duration-200 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50"
                aria-label="입력 정보 초기화"
              >
                <span>🔄</span>
                <span className="hidden md:inline">새로 시작하기</span>
              </button>
            )}
            
            {/* 메인 타이틀 */}
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 px-2">
              어떤 집을 얼마나 바꾸고 싶으세요?
            </h1>
            
            {/* 서브 타이틀 */}
            <p className="text-sm md:text-base text-gray-700 mt-2 px-2">
              대략만 알려주셔도 인테리봇이 평균값으로 계산합니다
            </p>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault()
              handleNext()
            }}
            aria-label="공간 정보 입력 폼"
            noValidate
          >

          {/* 인테리봇 캐릭터 멘트 */}
          <div className="mb-4 md:mb-6">
            <div className="bg-argen-50 border-2 border-argen-200 rounded-xl md:rounded-2xl p-3 md:p-4 relative">
              {/* 말풍선 꼬리 */}
              <div className="absolute -top-2 left-8 w-4 h-4 bg-argen-50 border-l-2 border-t-2 border-argen-200 transform rotate-45"></div>
              
              <div className="flex items-start gap-3">
                {/* 봇 아이콘 */}
                <div className="flex-shrink-0">
                  <span className="text-3xl">🤖</span>
                </div>
                
                {/* 멘트 텍스트 */}
                <div className="flex-1 pt-1">
                  <p className="text-gray-800 text-sm leading-relaxed">
                    집 크기랑 방 개수 정도만 알려주시면, 나머진 제가 알아서 계산할게요
                  </p>
                </div>
              </div>
            </div>
          </div>

        {/* 주거 정보 카드 */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 p-4 md:p-6 lg:p-8 mb-4 md:mb-6">
          {/* 주거형태 */}
          <fieldset 
            id="field-housingType" 
            className="mb-6 md:mb-8 lg:mb-10 border-0 p-0"
            aria-required="true"
            aria-invalid={!!errors.housingType}
            aria-describedby={errors.housingType ? 'housingType-error' : 'housingType-description'}
          >
            <legend className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-xl md:text-2xl" aria-hidden="true">🏠</span>
              주거형태 <span className="text-red-600" aria-label="필수 항목">*</span>
            </legend>
            <p id="housingType-description" className="text-sm text-gray-700 ml-9 mb-6">
              아파트 구조에 최적화된 추천을 제공합니다
            </p>

            {/* 옵션 버튼들 (4개 - 기타 제거됨) */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 ${errors.housingType ? 'mb-2' : ''}`}>
              {HOUSING_TYPES.map((option) => {
                const isSelected = spaceInfo.housingType === option.key
                const hasError = errors.housingType && !isSelected
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      handleHousingTypeChange(option.key)
                      if (errors.housingType) {
                        setErrors({ ...errors, housingType: undefined })
                      }
                    }}
                    aria-label={`${option.label} 선택${isSelected ? ', 현재 선택됨' : ''}`}
                    aria-pressed={isSelected}
                    className={`
                      relative p-3 md:p-4 rounded-xl border-2 transition-all duration-200 text-center min-h-[90px] flex flex-col items-center justify-center
                      hover:scale-[1.02] active:scale-[0.98] transform
                      ${hasError
                        ? 'border-red-500 bg-red-50 animate-shake'
                        : isSelected
                        ? 'border-argen-500 bg-argen-500 text-white shadow-lg shadow-argen-200'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-argen-300 hover:bg-argen-50 hover:shadow-md'
                      }
                    `}
                  >
                    {/* 체크 아이콘 (선택 시) */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 text-argen-500" strokeWidth={3} />
                        </div>
                      </div>
                    )}

                    {/* 아이콘 */}
                    <span className="text-2xl mb-1">{option.icon}</span>

                    {/* 타입명 */}
                    <div className={`text-sm md:text-base font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {option.label}
                    </div>

                    {/* 설명 */}
                    <div className={`text-xs mt-0.5 ${isSelected ? 'text-argen-100' : 'text-gray-500'}`}>
                      {option.description}
                    </div>
                  </button>
                )
              })}
            </div>
            
            {/* 에러 메시지 */}
            {errors.housingType && (
              <p id="housingType-error" className="text-sm text-red-600 mt-2" role="alert" aria-live="polite">
                {errors.housingType}
              </p>
            )}
          </fieldset>

          {/* 평수 */}
          <fieldset 
            id="field-size" 
            className="mb-6 md:mb-8 lg:mb-10 border-0 p-0"
            aria-required="true"
            aria-invalid={!!errors.size}
            aria-describedby={errors.size ? 'size-error' : 'size-description'}
          >
            <legend className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-xl md:text-2xl" aria-hidden="true">📐</span>
              집 크기 <span className="text-sm md:text-base font-normal text-gray-600">(모르면 대략 선택해도 괜찮아요)</span>
              <span className="text-red-600" aria-label="필수 항목">*</span>
            </legend>
            <p id="size-description" className="text-sm text-gray-700 ml-9 mb-6">
              평수에 따라 적정 예산과 시공 범위가 결정됩니다
            </p>

            {/* 1단계: 입력 방식 선택 */}
            <div 
              className="mb-4 md:mb-6 flex flex-col md:flex-row gap-3 md:gap-4"
              role="radiogroup"
              aria-label="평수 입력 방식 선택"
            >
              <button
                type="button"
                onClick={() => setSizeInputMode('exact')}
                role="radio"
                aria-checked={sizeInputMode === 'exact'}
                aria-label="정확한 평수 알고 있음"
                className={`
                  flex-1 p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-200 text-left min-h-[44px] flex items-center
                  hover:scale-[1.02] active:scale-[0.98] transform hover:brightness-110
                  ${sizeInputMode === 'exact'
                    ? 'border-argen-500 bg-argen-50 text-purple-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-argen-300'
                  }
                `}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${sizeInputMode === 'exact' ? 'border-argen-500' : 'border-gray-300'}
                  `} aria-hidden="true">
                    {sizeInputMode === 'exact' && (
                      <div className="w-3 h-3 rounded-full bg-argen-500"></div>
                    )}
                  </div>
                  <span className="text-sm md:text-base font-semibold">정확한 평수 알고 있음</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSizeInputMode('approximate')}
                role="radio"
                aria-checked={sizeInputMode === 'approximate'}
                aria-label="대략만 알아요"
                className={`
                  flex-1 p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-200 text-left min-h-[44px] flex items-center
                  hover:scale-[1.02] active:scale-[0.98] transform hover:brightness-110
                  ${sizeInputMode === 'approximate'
                    ? 'border-argen-500 bg-argen-50 text-purple-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-argen-300'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${sizeInputMode === 'approximate' ? 'border-argen-500' : 'border-gray-300'}
                  `}>
                    {sizeInputMode === 'approximate' && (
                      <div className="w-3 h-3 rounded-full bg-argen-500"></div>
                    )}
                  </div>
                  <span className="font-semibold">대략만 알아요</span>
                </div>
              </button>
            </div>

            {/* 2단계-A: 정확한 평수 입력 */}
            {sizeInputMode === 'exact' && (
              <div className="animate-slideDown">
                <div className={`bg-white rounded-lg md:rounded-xl border-2 p-4 md:p-6 ${errors.size ? 'border-red-500' : 'border-gray-200'}`}>
                  <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
                    {/* 평 입력 */}
                    <div className="w-full md:flex-1 relative">
                      <label htmlFor="pyeong-input" className="sr-only">
                        평수 입력
                      </label>
                      <input
                        id="pyeong-input"
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="1"
                        max="500"
                        value={spaceInfo.size || ''}
                        onChange={(e) => {
                          const inputValue = e.target.value
                          console.log('🔤 Input onChange:', { inputValue, type: typeof inputValue });
                          
                          // 빈 문자열 처리
                          if (inputValue === '' || inputValue === null || inputValue === undefined) {
                            handleSizeChange(0)
                            return
                          }
                          
                          // 숫자로 변환 (소수점 지원: 25.5평 등)
                          const numValue = parseFloat(inputValue)
                          if (!isNaN(numValue) && numValue >= 0 && numValue <= 500) {
                            handleSizeChange(numValue)
                            
                            // 3자리 입력 시 다음 필드로 자동 이동
                            if (inputValue.length >= 3) {
                              setTimeout(() => {
                                const nextInput = document.getElementById('family-size-input') as HTMLElement
                                if (nextInput) {
                                  nextInput.focus()
                                }
                              }, 100)
                            }
                          }
                          
                          // 입력 시 에러 제거
                          if (errors.size) {
                            setErrors({ ...errors, size: undefined })
                          }
                        }}
                        onKeyDown={(e) => {
                          // 화살표 키로 숫자 조정
                          if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            handleSizeChange(Math.min((spaceInfo.size || 0) + 1, 500))
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            handleSizeChange(Math.max((spaceInfo.size || 0) - 1, 1))
                          }
                          // ✅ Enter 키 또는 최대 자릿수 도달 시 다음 필드로 이동
                          else if (e.key === 'Enter' || (spaceInfo.size && spaceInfo.size.toString().length >= 3 && /^\d$/.test(e.key))) {
                            e.preventDefault()
                            const nextInput = document.getElementById('family-size-input') as HTMLElement
                            if (nextInput) {
                              nextInput.focus()
                            }
                          }
                        }}
                        placeholder="예) 32"
                        aria-label="평수 입력 (단위: 평)"
                        aria-required="true"
                        aria-invalid={!!errors.size}
                        aria-describedby={errors.size ? 'size-error' : 'size-description'}
                        className={`w-full p-3 md:p-4 pr-12 border-2 rounded-lg md:rounded-xl focus:outline-none focus:ring-4 text-lg md:text-2xl font-bold bg-white text-gray-900 transition-all min-h-[44px] ${
                          errors.size
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                            : 'border-gray-300 focus:border-argen-500 focus:ring-argen-100'
                        }`}
                      />
                      <span className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-base md:text-lg text-gray-600 font-semibold pointer-events-none" aria-hidden="true">평</span>
                    </div>

                    {/* = 기호 */}
                    <div className="hidden md:block text-2xl font-bold text-gray-400" aria-hidden="true">=</div>

                    {/* m² 자동 환산 */}
                    <div className="w-full md:flex-1 relative">
                      <label htmlFor="square-meter-display" className="sr-only">
                        제곱미터 자동 환산 결과
                      </label>
                      <input
                        id="square-meter-display"
                        type="text"
                        value={spaceInfo.size ? (spaceInfo.size * 3.3058).toFixed(1) : ''}
                        readOnly
                        placeholder="0.0"
                        aria-label={`제곱미터 자동 환산: ${spaceInfo.size ? (spaceInfo.size * 3.3058).toFixed(1) : '0.0'} 제곱미터`}
                        tabIndex={-1}
                        className="w-full p-3 md:p-4 pr-12 border-2 border-gray-200 rounded-lg md:rounded-xl bg-gray-100 text-lg md:text-2xl font-bold text-gray-600 cursor-not-allowed min-h-[44px]"
                      />
                      <span className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-base md:text-lg text-gray-500 font-semibold pointer-events-none" aria-hidden="true">m²</span>
                    </div>
                  </div>
                </div>

                {/* 툴팁 */}
                <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <span className="text-lg flex-shrink-0">💡</span>
                  <p className="text-sm text-blue-900">
                    등기부등본·네이버 부동산의 '전용면적' 기준으로 입력하면 더 정확해요
                  </p>
                </div>
                
                {/* 에러 메시지 */}
                {errors.size && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg"
                  >
                    <p id="size-error" className="text-sm text-red-700 font-medium" role="alert" aria-live="polite">
                      {errors.size}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      💡 도움이 필요하시면 상단의 "🔄 다시 시작" 버튼을 눌러 처음부터 입력하실 수 있습니다.
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* 2단계-B: 대략 범위 선택 */}
            {sizeInputMode === 'approximate' && (
              <div className="animate-slideDown">
                <div 
                  className={`grid grid-cols-2 gap-2 md:gap-3 ${errors.size ? 'mb-2' : ''}`}
                  role="radiogroup"
                  aria-label="평수 범위 선택"
                >
                  {[
                    { label: '20평대', value: '20s', pyeong: 22 },
                    { label: '30평대', value: '30s', pyeong: 32 },
                    { label: '40평대', value: '40s', pyeong: 42 },
                    { label: '50평 이상', value: '50plus', pyeong: 55 },
                  ].map((option) => {
                    const isSelected = approximateRange === option.value
                    const hasError = errors.size && !isSelected
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleApproximateRangeSelect(option.value, option.pyeong)
                          // 선택 시 에러 제거
                          if (errors.size) {
                            setErrors({ ...errors, size: undefined })
                          }
                        }}
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${option.label} (${option.pyeong}평으로 계산)${isSelected ? ', 현재 선택됨' : ''}`}
                        className={`
                          p-4 md:p-5 rounded-lg md:rounded-xl border-2 transition-all duration-200 min-h-[44px] flex flex-col items-center justify-center
                          hover:scale-[1.02] active:scale-[0.98] transform hover:brightness-110
                          ${hasError
                            ? 'border-red-500 bg-red-50 animate-shake'
                            : isSelected
                            ? 'border-argen-500 bg-argen-500 text-white shadow-lg shadow-argen-200'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-argen-300 hover:bg-argen-50'
                          }
                        `}
                      >
                        <div className="text-lg font-bold">{option.label}</div>
                        <div className={`text-sm mt-1 ${isSelected ? 'text-argen-100' : 'text-gray-600'}`}>
                          ({option.pyeong}평으로 계산)
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* 하단 설명 */}
                <div className="mt-4 text-sm text-gray-600 text-center">
                  정확한 등기면적이 아니어도 됩니다. 인테리봇이 평균값으로 계산합니다
                </div>
              </div>
            )}
            
            {/* 에러 메시지 */}
            {errors.size && (
              <p id="size-error" className="text-sm text-red-600 mt-2" role="alert" aria-live="polite">
                {errors.size}
              </p>
            )}
          </fieldset>

          {/* 방 개수 */}
          <fieldset className="mb-6 md:mb-8 lg:mb-10 border-0 p-0">
            <legend className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-xl md:text-2xl" aria-hidden="true">🚪</span>
              방 개수
            </legend>
            <p id="roomCount-description" className="text-sm text-gray-700 ml-9 mb-6">
              용도별 수납·가구를 추천합니다
            </p>

            {/* 자동 설정 안내 문구 (평수가 입력된 경우만) */}
            {spaceInfo.size >= 15 && roomCountMode !== 'manual' && (
              <div 
                className="mb-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="text-lg flex-shrink-0" aria-hidden="true">✨</span>
                <p className="text-sm text-blue-900">
                  {spaceInfo.size}평 {spaceInfo.housingType === 'apartment' ? '아파트' : '주거'} 기준으로 방 {getSuggestedRoomCount(spaceInfo.size)}개로 설정했어요. 다르면 숫자만 바꿔 주세요
                </p>
              </div>
            )}

            <div className="space-y-3 md:space-y-4">
              {/* 선택 버튼 */}
              <div className={`flex flex-col md:flex-row items-stretch md:items-center gap-3 ${pulseRoomCount ? 'animate-pulse-once' : ''}`}>
                <div className="flex-1 grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((count) => {
                    const isSelected = spaceInfo.roomCount === count && roomCountMode !== 'unknown'
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => handleRoomCountChange(count)}
                        disabled={roomCountMode === 'unknown'}
                        aria-label={`방 ${count}개${isSelected ? ', 현재 선택됨' : ''}`}
                        aria-pressed={isSelected}
                        aria-describedby="roomCount-description"
                        className={`
                          p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-200 min-h-[44px] flex flex-col items-center justify-center
                          ${roomCountMode === 'unknown'
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            : `hover:scale-[1.02] active:scale-[0.98] transform hover:brightness-110 ${
                              isSelected
                                ? 'border-argen-500 bg-argen-500 text-white shadow-lg shadow-argen-200'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-argen-300 hover:bg-argen-50'
                            }`
                          }
                        `}
                      >
                        <div className="text-base md:text-lg font-bold">{count}개</div>
                        {isSelected && (
                          <div className="mt-1" aria-hidden="true">
                            <Check className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* "모르겠어요" 버튼 */}
                <button
                  type="button"
                  onClick={handleRoomCountUnknown}
                  aria-label="방 개수를 모르겠어요, 평수 기준 기본값 사용"
                  className={`
                    px-4 py-3 md:py-4 rounded-lg md:rounded-xl border-2 transition-all duration-200 whitespace-nowrap text-sm font-medium min-h-[44px] flex items-center justify-center
                    hover:scale-[1.02] active:scale-[0.98] transform hover:brightness-110
                    ${roomCountMode === 'unknown'
                      ? 'border-gray-400 bg-gray-100 text-gray-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  모르겠어요
                </button>
              </div>

              {/* "평수 기준 기본값 사용 중" 배지 */}
              {roomCountMode === 'unknown' && (
                <div 
                  className="inline-flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-full px-4 py-2"
                  role="status"
                  aria-live="polite"
                >
                  <span className="text-xs font-medium text-gray-700">
                    평수 기준 기본값 사용 중 (방 {spaceInfo.roomCount}개)
                  </span>
                </div>
              )}
            </div>
          </fieldset>

          {/* 화장실 개수 */}
          <fieldset className="mb-6 border-0 p-0">
            <legend className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-xl md:text-2xl" aria-hidden="true">🚿</span>
              화장실 개수
            </legend>
            <p id="bathroomCount-description" className="text-sm text-gray-700 ml-9 mb-6">
              욕실 개수는 견적에 큰 영향을 미칩니다
            </p>

            {/* 자동 설정 안내 문구 (평수가 입력된 경우만) */}
            {spaceInfo.size >= 15 && bathroomCountMode !== 'manual' && (
              <div 
                className="mb-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="text-lg flex-shrink-0" aria-hidden="true">✨</span>
                <p className="text-sm text-blue-900">
                  {spaceInfo.size}평 {spaceInfo.housingType === 'apartment' ? '아파트' : '주거'} 기준으로 화장실 {getSuggestedBathroomCount(spaceInfo.size)}개로 설정했어요. 다르면 바꿔 주세요
                </p>
              </div>
            )}

            <div className="space-y-3 md:space-y-4">
              {/* 선택 버튼 */}
              <div className={`flex flex-col md:flex-row items-stretch md:items-center gap-3 ${pulseBathroomCount ? 'animate-pulse-once' : ''}`}>
                <div className="flex-1 grid grid-cols-3 gap-2 md:gap-3">
                  {[
                    { count: 1, label: '1개' },
                    { count: 2, label: '2개' },
                    { count: 3, label: '3개 이상' },
                  ].map((option) => {
                    const isSelected = spaceInfo.bathroomCount === option.count && bathroomCountMode !== 'unknown'
                    return (
                      <button
                        key={option.count}
                        type="button"
                        onClick={() => handleBathroomCountChange(option.count)}
                        disabled={bathroomCountMode === 'unknown'}
                        aria-label={`화장실 ${option.label}${isSelected ? ', 현재 선택됨' : ''}`}
                        aria-pressed={isSelected}
                        aria-describedby="bathroomCount-description"
                        className={`
                          p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-200 min-h-[44px] flex flex-col items-center justify-center
                          ${bathroomCountMode === 'unknown'
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            : `hover:scale-[1.02] active:scale-[0.98] transform hover:brightness-110 ${
                              isSelected
                                ? 'border-argen-500 bg-argen-500 text-white shadow-lg shadow-argen-200'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-argen-300 hover:bg-argen-50'
                            }`
                          }
                        `}
                      >
                        <div className="text-base md:text-lg font-bold">{option.label}</div>
                        {isSelected && (
                          <div className="mt-1" aria-hidden="true">
                            <Check className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* "모르겠어요" 버튼 */}
                <button
                  type="button"
                  onClick={handleBathroomCountUnknown}
                  aria-label="화장실 개수를 모르겠어요, 평수 기준 기본값 사용"
                  className={`
                    px-4 py-3 md:py-4 rounded-lg md:rounded-xl border-2 transition-all duration-200 whitespace-nowrap text-sm font-medium min-h-[44px] flex items-center justify-center
                    hover:scale-[1.02] active:scale-[0.98] transform hover:brightness-110
                    ${bathroomCountMode === 'unknown'
                      ? 'border-gray-400 bg-gray-100 text-gray-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  모르겠어요
                </button>
              </div>

              {/* "평수 기준 기본값 사용 중" 배지 */}
              {bathroomCountMode === 'unknown' && (
                <div 
                  className="inline-flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-full px-4 py-2"
                  role="status"
                  aria-live="polite"
                >
                  <span className="text-xs font-medium text-gray-700">
                    평수 기준 기본값 사용 중 (화장실 {spaceInfo.bathroomCount}개)
                  </span>
                </div>
              )}
            </div>
          </fieldset>

          {/* 예산 선택 */}
          <fieldset className="mb-6 md:mb-8 lg:mb-10 border-0 p-0">
            <legend className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-xl md:text-2xl" aria-hidden="true">💰</span>
              예상 예산
            </legend>
            <p className="text-sm text-gray-700 ml-9 mb-6">
              예산에 맞는 등급과 자재를 추천해드립니다. 모르시면 &quot;아직 정하지 않았어요&quot;를 선택하세요
            </p>

            <div className="grid gap-3">
              {BUDGET_OPTIONS.map((option, index) => {
                const isSelected = selectedBudget === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSelectedBudget(option.id)
                      setBudgetAmount(undefined)
                      updateSpaceInfo({ 
                        housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
                        budget: option.id, 
                        budgetAmount: undefined 
                      })
                    }}
                    aria-pressed={isSelected}
                    className={`
                      relative flex items-center gap-4 p-4 rounded-xl border-2 text-left
                      transition-all duration-200 min-h-[44px]
                      hover:scale-[1.01] active:scale-[0.99] transform
                      ${isSelected
                        ? 'border-argen-500 bg-argen-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-argen-300 hover:shadow-sm'
                      }
                    `}
                  >
                    {/* 이모지 */}
                    <span className="text-2xl md:text-3xl">{option.emoji}</span>

                    {/* 텍스트 */}
                    <div className="flex-1">
                      <div className={`font-semibold ${isSelected ? 'text-argen-600' : 'text-gray-800'}`}>
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        {option.description}
                      </div>
                    </div>

                    {/* 선택 표시 */}
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-argen-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* 안내 문구 */}
            <p className="text-xs text-gray-400 text-center mt-4">
              💡 예산은 견적 등급 추천에 참고됩니다. 나중에 변경할 수 있어요
            </p>
          </fieldset>

          {/* 거주 목적 */}
          <fieldset className="mb-6 md:mb-8 lg:mb-10 border-0 p-0">
            <legend className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-xl md:text-2xl" aria-hidden="true">🎯</span>
              인테리어 목적
              <span className="text-sm font-normal text-gray-400 ml-2">(선택사항)</span>
            </legend>
            <p className="text-sm text-gray-700 ml-9 mb-6">
              목적에 맞는 맞춤 설계를 제안해드립니다
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: '입력안함' as const, label: '입력 안함', emoji: '🚫', desc: '건너뛰기' },
                { id: '실거주' as const, label: '실거주', emoji: '🏠', desc: '직접 살 집' },
                { id: '매도준비' as const, label: '매도 준비', emoji: '💰', desc: '팔기 전 리모델링' },
                { id: '임대' as const, label: '임대', emoji: '🔑', desc: '세입자용 인테리어' },
              ].map((option) => {
                const isSelected = livingPurpose === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setLivingPurpose(option.id)
                      updateSpaceInfo({ 
                        housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
                        livingPurpose: option.id 
                      })
                      // 입력 안함 선택 시 거주 기간도 초기화
                      if (option.id === '입력안함') {
                        setLivingYears(undefined)
                        updateSpaceInfo({ 
                          housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
                          livingYears: undefined 
                        })
                      }
                    }}
                    aria-pressed={isSelected}
                    className={`
                      p-4 rounded-xl border-2 text-center transition-all duration-200
                      hover:scale-[1.02] active:scale-[0.98] transform
                      ${isSelected
                        ? option.id === '입력안함'
                          ? 'border-gray-400 bg-gray-50 shadow-md'
                          : 'border-argen-500 bg-argen-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-argen-300'
                      }
                    `}
                  >
                    <span className="text-2xl block mb-2">{option.emoji}</span>
                    <span className={`text-sm font-semibold block ${
                      isSelected 
                        ? option.id === '입력안함' ? 'text-gray-700' : 'text-argen-600' 
                        : 'text-gray-800'
                    }`}>
                      {option.label}
                    </span>
                    <span className="text-xs text-gray-500 block mt-1">{option.desc}</span>
                  </button>
                )
              })}
            </div>

            {/* 개인정보 안내 */}
            <p className="text-xs text-gray-400 text-center mt-4">
              🔒 입력하지 않아도 견적 진행이 가능합니다
            </p>
          </fieldset>

          {/* 예상 거주 기간 (실거주 선택 시에만 표시) */}
          {livingPurpose === '실거주' && (
            <fieldset className="mb-6 md:mb-8 lg:mb-10 border-0 p-0 animate-slideDown">
              <legend className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-xl md:text-2xl" aria-hidden="true">📅</span>
                예상 거주 기간
              </legend>
              <p className="text-sm text-gray-700 ml-9 mb-6">
                거주 기간에 따라 투자 가치가 달라집니다
              </p>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { years: 3, label: '3년 이하', desc: '단기' },
                  { years: 5, label: '5년', desc: '중기' },
                  { years: 10, label: '10년', desc: '장기' },
                  { years: 15, label: '15년+', desc: '정착' },
                ].map((option) => {
                  const isSelected = livingYears === option.years
                  return (
                    <button
                      key={option.years}
                      type="button"
                      onClick={() => {
                        setLivingYears(option.years)
                        updateSpaceInfo({ 
                          housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
                          livingYears: option.years 
                        })
                      }}
                      aria-pressed={isSelected}
                      className={`
                        p-4 rounded-xl border-2 text-center transition-all duration-200
                        hover:scale-[1.02] active:scale-[0.98] transform
                        ${isSelected
                          ? 'border-argen-500 bg-argen-500 text-white shadow-lg shadow-argen-200'
                          : 'border-gray-200 bg-white hover:border-argen-300 text-gray-800'
                        }
                      `}
                    >
                      <span className={`text-lg font-bold block ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {option.label}
                      </span>
                      <span className={`text-xs block mt-1 ${isSelected ? 'text-argen-100' : 'text-gray-500'}`}>
                        {option.desc}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* 거주 기간 설명 */}
              {livingYears && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 {livingYears >= 10 
                      ? '장기 거주 시 고급 자재와 수납 강화가 투자 대비 효과적입니다' 
                      : livingYears >= 5 
                      ? '중기 거주 시 균형 잡힌 자재 선택을 추천합니다'
                      : '단기 거주 시 비용 효율적인 선택을 추천합니다'
                    }
                  </p>
                </div>
              )}
            </fieldset>
          )}

          {/* Step1 새 구조: 연령대 선택 */}
          <AgeRangeSection
            selectedAgeRanges={ageRanges}
            onToggle={(value) => {
              const newRanges = ageRanges.includes(value)
                ? ageRanges.filter(r => r !== value)
                : [...ageRanges, value]
              setAgeRanges(newRanges)
              updateSpaceInfo({ 
                housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
                ageRanges: newRanges 
              })
            }}
          />

          {/* Step1 새 구조: 가족 수 선택 - 직접 입력 */}
          <FamilySizeSection
            selectedFamilySize={familySizeRange}
            initialTotalPeople={totalPeople} // ✅ 실제 인원수 전달 (우선순위 높음)
            onSelect={(value) => {
              setFamilySizeRange(value)
              // familySizeRange와 totalPeople 함께 저장
              updateSpaceInfo({ 
                housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
                familySizeRange: value,
                totalPeople: totalPeople || 0
              })
            }}
            onTotalPeopleChange={(count) => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'space-info/page.tsx:1713',message:'가족 수 변경 시작',data:{count,이전totalPeople:totalPeople,이전familySizeRange:familySizeRange},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              
              // ✅ count가 0이거나 유효하지 않으면 무시
              if (!count || count <= 0 || isNaN(count)) {
                console.warn('⚠️ [가족 수] 유효하지 않은 값:', count);
                return;
              }
              
              // ✅ totalPeople 직접 업데이트
              setTotalPeople(count)
              
              // ✅ familySizeRange 자동 생성 (기존 코드 호환성)
              let range: string | null = null
              if (count === 1) range = '1인'
              else if (count === 2) range = '2인'
              else if (count === 3) range = '3인'  // ✅ 3명은 정확히 '3인'
              else if (count === 4) range = '4인'  // ✅ 4명은 정확히 '4인'
              else if (count >= 5) range = '5인 이상'
              
              setFamilySizeRange(range)
              
              // Store에 함께 저장 (명시적으로 count와 range 저장)
              updateSpaceInfo({ 
                housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
                totalPeople: count, // ✅ 명시적으로 count 저장
                familySizeRange: range // ✅ 명시적으로 range 저장
              })
              
              // ✅ 저장 확인 (즉시 확인)
              setTimeout(() => {
                const saved = useSpaceInfoStore.getState().spaceInfo;
                console.log('✅ [가족 수 저장 확인]:', {
                  입력값: count,
                  입력range: range,
                  저장된totalPeople: saved?.totalPeople,
                  저장된familySizeRange: saved?.familySizeRange,
                  일치여부: saved?.totalPeople === count && saved?.familySizeRange === range ? '✅ 일치' : '❌ 불일치',
                });
                
                // 불일치 시 재시도
                if (saved?.totalPeople !== count || saved?.familySizeRange !== range) {
                  console.error('❌ [가족 수 저장 실패!] 재시도...');
                  updateSpaceInfo({ 
                    totalPeople: count,
                    familySizeRange: range
                  });
                }
              }, 100);
              
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/0dabd650-07da-4349-8c05-322963e8e682',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'space-info/page.tsx:1734',message:'가족 수 저장 완료',data:{count,range,저장된totalPeople:useSpaceInfoStore.getState().spaceInfo?.totalPeople,저장된familySizeRange:useSpaceInfoStore.getState().spaceInfo?.familySizeRange},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              
              console.log('👥 가족 수 업데이트:', { count, range });
            }}
          />

          {/* Step1 새 구조: 생활 특성 */}
          <LifeStyleSection
            selectedTags={lifestyleTags}
            onToggle={(tag) => {
              const newTags = lifestyleTags.includes(tag)
                ? lifestyleTags.filter(t => t !== tag)
                : [...lifestyleTags, tag]
              setLifestyleTags(newTags)
              
              // ✅ lifestyleTags와 specialConditions 동기화
              const newSpecialConditions = { ...specialConditions }
              if (tag === 'hasPets') {
                newSpecialConditions.hasPets = !lifestyleTags.includes(tag)
                setSpecialConditions(newSpecialConditions)
              } else if (tag === 'hasElderly') {
                newSpecialConditions.hasElderly = !lifestyleTags.includes(tag)
                setSpecialConditions(newSpecialConditions)
              }
              
              updateSpaceInfo({ 
                housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
                lifestyleTags: newTags,
                specialConditions: newSpecialConditions // ✅ 동기화된 specialConditions 저장
              })
              
              console.log('🏷️ 생활 특성 업데이트:', { 
                tag, 
                newTags, 
                hasPets: newSpecialConditions.hasPets,
                hasElderly: newSpecialConditions.hasElderly,
              })
            }}
          />

          {/* Step1 새 구조: 추가 정보 (기타) - 옵션 1 */}
          <div className="mb-6 md:mb-8 lg:mb-10">
            <label 
              htmlFor="additional-notes-input"
              className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2"
            >
              <span className="text-xl md:text-2xl" aria-hidden="true">📝</span>
              추가로 알려주고 싶은 내용이 있으신가요?
            </label>
            <p className="text-sm text-gray-600 mb-4 ml-9">
              (예: 2살 아기가 있어요, 강아지가 있어요 등)
            </p>
            
            <textarea
              id="additional-notes-input"
              value={additionalNotes}
              onChange={(e) => {
                setAdditionalNotes(e.target.value)
                updateSpaceInfo({ 
                  housingType: housingTypeToLabel(spaceInfo.housingType), // ✅ 주거형태 유지
                  additionalNotes: e.target.value 
                })
                console.log('📝 추가 정보 입력:', e.target.value)
              }}
              placeholder="자유롭게 입력해주세요..."
              maxLength={500}
              rows={4}
              aria-label="추가 정보 입력"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-argen-500 focus:ring-4 focus:ring-argen-100 resize-none transition-all"
            />
            
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                선택사항이에요. 입력하지 않아도 괜찮아요 ✨
              </p>
              <p className="text-xs text-gray-500">
                {additionalNotes?.length || 0} / 500자
              </p>
            </div>
          </div>
        </div>

        {/* 다음 단계 예고 카드 */}
        <div className="bg-argen-50 rounded-lg shadow-sm p-4 mb-6">
          <h3 className="text-base font-semibold text-gray-700 mb-3">
            다음 단계에서는 이런 걸 선택해요
          </h3>
          
          <ul className="space-y-2 mb-3">
            <li className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">·</span>
              <span>🏠 어떤 공간을 바꾸고 싶은지 선택</span>
            </li>
            <li className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">·</span>
              <span>🤖 AI가 각 공간의 장점/주의점을 분석</span>
            </li>
            <li className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">·</span>
              <span>💰 예상 비용과 추천 공정을 확인</span>
            </li>
          </ul>

          <p className="text-sm text-gray-600">
            공간 선택 후 AI가 맞춤 분석을 해드려요 ✨
          </p>
        </div>

        {/* 안내 문구 */}
        <p className="text-xs text-gray-600 text-center mb-4">
          ※ 이 단계는 대략적인 공사 범위를 잡는 용도입니다. 최종 견적은 현장 실측 후 확정됩니다
        </p>

        {/* 네비게이션 버튼 */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          {/* 이전 버튼 */}
          <button
            type="button"
            onClick={() => router.push('/')}
            aria-label="이전 페이지로 이동"
            className="w-full md:w-[30%] px-4 md:px-6 py-3 md:py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg md:rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium min-h-[44px] flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transform hover:brightness-110"
          >
            ← 이전
          </button>

          {/* 다음 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            aria-label={isSubmitting ? '처리 중입니다...' : '성향 분석하기'}
            className={`w-full md:w-[70%] px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl transition-all duration-200 shadow-lg font-bold relative min-h-[44px] flex items-center justify-center ${
              isSubmitting
                ? 'bg-gray-400 text-white cursor-not-allowed opacity-70'
                : 'bg-argen-500 text-white hover:bg-argen-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transform hover:brightness-110'
            }`}
            style={!isSubmitting ? { backgroundColor: '#CC807A' } : {}}
          >
            <div className="flex flex-col items-center">
              {isSubmitting ? (
                <>
                  <span className="text-sm md:text-base flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    처리 중...
                  </span>
                  <span className="text-xs mt-0.5 md:mt-1 opacity-90">잠시만 기다려주세요</span>
                </>
              ) : (
                <>
                  <span className="text-sm md:text-base">성향 분석하기 →</span>
                  <span className="text-xs mt-0.5 md:mt-1 opacity-90">AI가 맞춤 분석을 해드려요</span>
                </>
              )}
            </div>
          </button>
        </div>
          </form>
      </div>
    </main>
    </>
  )
}

export default function SpaceInfoPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-argen-500 mx-auto mb-4"></div>
          <p className="text-argen-700">로딩 중...</p>
        </div>
      </main>
    }>
      <SpaceInfoPageContent />
    </Suspense>
  )
}
