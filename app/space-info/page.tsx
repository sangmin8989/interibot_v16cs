'use client'

import { useState, Suspense, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import StepIndicator from '@/components/onboarding/StepIndicator'
import { useSpaceInfoStore, HousingTypeLabel, ApproximateRange, AgeGroups, SpecialConditions } from '@/lib/store/spaceInfoStore'
import { BudgetRange, BUDGET_OPTIONS } from '@/lib/data/budget-options'
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
  
  // 예산 state
  const [selectedBudget, setSelectedBudget] = useState<BudgetRange>('unknown')
  const [budgetAmount, setBudgetAmount] = useState<number | undefined>(undefined)
  
  // 거주 목적/기간 state
  const [livingPurpose, setLivingPurpose] = useState<'실거주' | '매도준비' | '임대' | '입력안함'>('입력안함')
  const [livingYears, setLivingYears] = useState<number | undefined>(undefined)

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
    setSelectedBudget('unknown')
    setBudgetAmount(undefined)
    setLivingPurpose('입력안함')
    setLivingYears(undefined)
    setErrors({})
  }, [clearSpaceInfo])

  // ✅ 페이지 마운트 시 저장된 데이터 로드 (핵심 수정!)
  useEffect(() => {
    // URL 쿼리 파라미터로 리셋 여부 확인
    const shouldReset = searchParams.get('reset') === 'true'
    
    if (shouldReset) {
      resetAllFields()
      return
    }
    
    // ✅ 저장된 데이터가 있으면 로컬 state에 로드
    if (storedSpaceInfo) {
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
      
      console.log('✅ 집 정보 로드 완료 - 평수:', loadedPyeong)
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
    // Store 업데이트는 제출 시에만 하도록 변경 (리셋 문제 방지)
  }

  const handleRegionChange = (region: Region) => {
    setSpaceInfo({ ...spaceInfo, region })
  }

  const handleSizeChange = (size: number) => {
    // 백스페이스로 지울 때 0도 허용 (size >= 0)
    if (size >= 0 && size <= 500) {
      // ✅ 한 번만 상태 업데이트 (입력 중단 방지)
      let suggestedRooms = spaceInfo.roomCount || 0
      let suggestedBathrooms = spaceInfo.bathroomCount || 0
      
      // 평수 변경 시 자동으로 방 개수 제안 (auto 모드일 때만)
      if (roomCountMode === 'auto' || roomCountMode === 'unknown') {
        suggestedRooms = getSuggestedRoomCount(size)
        // Pulse 효과 트리거
        setPulseRoomCount(true)
        setTimeout(() => setPulseRoomCount(false), 600)
      }
      
      // 평수 변경 시 자동으로 화장실 개수 제안 (auto 모드일 때만)
      if (bathroomCountMode === 'auto' || bathroomCountMode === 'unknown') {
        suggestedBathrooms = getSuggestedBathroomCount(size)
        // Pulse 효과 트리거
        setPulseBathroomCount(true)
        setTimeout(() => setPulseBathroomCount(false), 600)
      }
      
      // ✅ 한 번만 상태 업데이트 (입력 중단 방지)
      setSpaceInfo(prev => ({
        ...prev,
        size,
        roomCount: suggestedRooms,
        bathroomCount: suggestedBathrooms
      }))
      
      // 입력 시 에러 제거
      if (errors.size) {
        setErrors({ ...errors, size: undefined })
      }
      
      console.log('📝 평수 입력:', { 입력값: size, 방개수: suggestedRooms, 화장실개수: suggestedBathrooms })
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
      specialConditions: newConditions,
    })
  }

  const handleNext = () => {
    // 에러 초기화
    const newErrors: { housingType?: string; size?: string } = {}

    // 1. 주거형태 검증
    if (!spaceInfo.housingType) {
      newErrors.housingType = '주거형태를 선택해주세요'
    }

    // 2. 평수 검증
    if (spaceInfo.size <= 0) {
      newErrors.size = '평수를 입력해주세요'
    } else if (sizeInputMode === 'approximate' && !approximateRange) {
      newErrors.size = '평수 범위를 선택해주세요'
    }

    // 에러가 있으면 표시하고 스크롤 이동
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      
      // 첫 번째 에러 필드로 스크롤 이동
      const firstErrorField = Object.keys(newErrors)[0]
      setTimeout(() => {
        const element = document.getElementById(`field-${firstErrorField}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.focus()
        }
      }, 100)
      
      return
    }

    // 에러 없으면 초기화
    setErrors({})

    // 방 개수와 화장실 개수가 없으면 자동값 사용
    const finalRoomCount = spaceInfo.roomCount || getSuggestedRoomCount(spaceInfo.size)
    const finalBathroomCount = spaceInfo.bathroomCount || getSuggestedBathroomCount(spaceInfo.size)

    // 최종 검증 후 Store에 확정 저장
    const approximateRangeLabel: ApproximateRange | undefined = 
      approximateRange === '20s' ? '20평대' :
      approximateRange === '30s' ? '30평대' :
      approximateRange === '40s' ? '40평대' :
      approximateRange === '50plus' ? '50평 이상' :
      undefined

    // ✅ 평수 최종 확인 및 저장 (핵심!)
    const finalPyeong = Number(spaceInfo.size) // ✅ 숫자로 확실히 변환
    console.log('💾 집 정보 최종 저장:', { 
      입력한평수: finalPyeong, 
      입력방식: sizeInputMode,
      범위: approximateRangeLabel,
      현재저장된평수: storedSpaceInfo?.pyeong,
      spaceInfoSize: spaceInfo.size
    })
    
    // ✅ 평수 검증
    if (!finalPyeong || finalPyeong <= 0 || isNaN(finalPyeong)) {
      setErrors({ ...errors, size: '평수를 올바르게 입력해주세요' })
      return
    }

    // ✅ 확정 저장 (기존 값 무시하고 완전히 덮어쓰기)
    const updateData = {
      housingType: housingTypeToLabel(spaceInfo.housingType),
      pyeong: finalPyeong, // ✅ 입력한 평수 그대로 저장 (덮어쓰기)
      squareMeter: parseFloat((finalPyeong * 3.3058).toFixed(2)),
      inputMethod: sizeInputMode,
      approximateRange: approximateRangeLabel,
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
      budget: selectedBudget,
      budgetAmount,
      livingPurpose,
      livingYears,
    }
    
    console.log('💾 저장할 데이터:', updateData)
    
    // ✅ 평수를 먼저 확실히 저장 (별도로 한 번 더)
    updateSpaceInfo({ pyeong: finalPyeong })
    
    // ✅ 전체 데이터 저장
    updateSpaceInfo(updateData)
    
    // ✅ 저장 확인 (여러 번 확인)
    const checkSaved = () => {
      const saved = useSpaceInfoStore.getState().spaceInfo
      console.log('✅ 저장 확인:', { 저장된평수: saved?.pyeong, 입력한평수: finalPyeong })
      if (saved?.pyeong !== finalPyeong) {
        console.error('❌ 평수 저장 실패!', { 저장된값: saved?.pyeong, 입력값: finalPyeong })
        // 재시도 (강제로 덮어쓰기)
        updateSpaceInfo({ pyeong: finalPyeong })
        setTimeout(() => {
          const retrySaved = useSpaceInfoStore.getState().spaceInfo
          console.log('🔄 재시도 후 저장 확인:', { 저장된평수: retrySaved?.pyeong, 입력한평수: finalPyeong })
          if (retrySaved?.pyeong !== finalPyeong) {
            console.error('❌ 재시도 실패! localStorage 직접 확인 필요')
            // localStorage 직접 확인
            if (typeof window !== 'undefined') {
              const stored = localStorage.getItem('space-info-storage')
              console.log('💾 localStorage 직접 확인:', stored)
            }
          }
        }, 200)
      } else {
        console.log('✅ 평수 저장 성공!')
      }
    }
    
    setTimeout(checkSaved, 100)
    setTimeout(checkSaved, 300)
    setTimeout(checkSaved, 500)

    // 공간 정보를 쿼리 파라미터로 전달하여 성향 분석 페이지로 이동
    const params = new URLSearchParams({
      mode,
      housingType: spaceInfo.housingType,
      region: spaceInfo.region,
      size: spaceInfo.size.toString(),
      roomCount: finalRoomCount.toString(),
      bathroomCount: finalBathroomCount.toString(),
    })
    
    // 새 플로우: 집정보 → 공간선택 → AI장단점 → 성향분석
    router.push(`/onboarding/scope?${params.toString()}`)
  }

  return (
    <>
      {/* 상단 진행 단계 표시 (6단계) */}
      <StepIndicator currentStep={1} />

      <main className="flex min-h-screen flex-col items-center p-4 md:p-6 lg:p-8 pt-12 md:pt-16 bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 animate-fadeIn">
        <div className="w-full max-w-[800px]">
          {/* 타이틀 영역 */}
          <div className="text-center mb-4 md:mb-6">
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
                        min="1"
                        max="500"
                        value={spaceInfo.size || ''}
                        onChange={(e) => {
                          const inputValue = e.target.value
                          // ✅ 빈 문자열 처리 개선 (입력 중단 방지)
                          if (inputValue === '' || inputValue === null || inputValue === undefined) {
                            handleSizeChange(0)
                          } else {
                            const numValue = parseInt(inputValue, 10)
                            if (!isNaN(numValue)) {
                              handleSizeChange(numValue)
                              
                              // ✅ 자동 포커스 이동: 3자리 입력 시 다음 필드로 이동
                              if (inputValue.length >= 3) {
                                setTimeout(() => {
                                  const nextInput = document.getElementById('family-size-input') as HTMLElement
                                  if (nextInput) {
                                    nextInput.focus()
                                  }
                                }, 100)
                              }
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
                  <p id="size-error" className="text-sm text-red-600 mt-2" role="alert" aria-live="polite">
                    {errors.size}
                  </p>
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
                      updateSpaceInfo({ budget: option.id, budgetAmount: undefined })
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
                      updateSpaceInfo({ livingPurpose: option.id })
                      // 입력 안함 선택 시 거주 기간도 초기화
                      if (option.id === '입력안함') {
                        setLivingYears(undefined)
                        updateSpaceInfo({ livingYears: undefined })
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
                        updateSpaceInfo({ livingYears: option.years })
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
              updateSpaceInfo({ ageRanges: newRanges })
            }}
          />

          {/* Step1 새 구조: 가족 수 선택 - 직접 입력 */}
          <FamilySizeSection
            selectedFamilySize={familySizeRange}
            onSelect={(value) => {
              setFamilySizeRange(value)
              // familySizeRange와 totalPeople 함께 저장
              updateSpaceInfo({ 
                familySizeRange: value,
                totalPeople: totalPeople || 0
              })
            }}
            onTotalPeopleChange={(count) => {
              // ✅ totalPeople 직접 업데이트
              setTotalPeople(count)
              
              // ✅ familySizeRange 자동 생성 (기존 코드 호환성)
              let range: string | null = null
              if (count === 1) range = '1인'
              else if (count === 2) range = '2인'
              else if (count >= 3 && count <= 4) range = '3~4인'
              else if (count >= 5) range = '5인 이상'
              
              setFamilySizeRange(range)
              
              // Store에 함께 저장
              updateSpaceInfo({ 
                totalPeople: count,
                familySizeRange: range
              })
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
              updateSpaceInfo({ lifestyleTags: newTags })
            }}
          />
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
            aria-label="공간 선택하기"
            className="w-full md:w-[70%] px-4 md:px-6 py-3 md:py-4 bg-argen-500 text-white rounded-lg md:rounded-xl hover:bg-argen-600 transition-all duration-200 shadow-lg hover:shadow-xl font-bold relative min-h-[44px] flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transform hover:brightness-110"
            style={{ backgroundColor: '#CC807A' }}
          >
            <div className="flex flex-col items-center">
              <span className="text-sm md:text-base">공간 선택하기 →</span>
              <span className="text-xs mt-0.5 md:mt-1 opacity-90">AI가 맞춤 분석을 해드려요</span>
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
