'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import StepIndicator from '@/components/onboarding/StepIndicator'
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore'
import { usePersonalityStore } from '@/lib/store/personalityStore'
import { useProcessStore } from '@/lib/store/processStore'
import { useScopeStore } from '@/lib/store/scopeStore'
import { applyTagsToEstimate } from '@/lib/analysis/v5/tag-estimate-connector'
import { PROCESS_DEFINITIONS } from '@/constants/process-definitions'
import { SPACE_NAMES } from '@/constants/spaces'
import SixIndexDashboard from '@/components/v5-ultimate/SixIndexDashboard'
import type { FusionAnalysisResult } from '@/lib/analysis/v5-ultimate/types'
import type { ReportResult } from '@/lib/analysis/report'

// 공정별 Before/After 이미지 생성 타입
type ProcessImageType = '철거' | '주방' | '욕실' | '타일' | '목공' | '전기' | '도배' | '필름'

// ✅ V4 견적 엔진 사용
import type { UIEstimateV4 } from '@/lib/estimate-v4/types'
import type { V4EstimateRequest, V4EstimateResult as V4EstimateResultType } from '@/lib/estimate-v4/types/v4-estimate-types'
import type { SpaceId, ProcessCategory } from '@/types/spaceProcess'

// V4 등급 타입 (3등급)
type GradeKeyV4 = 'argen_e' | 'argen_s' | 'argen_o'

// V4 등급 정보
const V4_GRADE_INFO: Record<GradeKeyV4, {
  icon: string
  title: string
  color: string
  bgColor: string
  description: string
}> = {
  argen_e: {
    icon: '💎',
    title: 'ARGEN A',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: '합리적인 가성비'
  },
  argen_s: {
    icon: '⭐',
    title: 'ARGEN S',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    description: '균형 잡힌 품질과 가격'
  },
  argen_o: {
    icon: '👑',
    title: 'ARGEN O',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    description: '프리미엄 맞춤형'
  }
}

// V4 견적 결과 (로컬 타입 - UIEstimateV4와 recommendedGrade를 함께 저장)
interface V4EstimateResultLocal {
  estimate: UIEstimateV4
  recommendedGrade: GradeKeyV4
}

// 세부옵션 localStorage 키
const DETAIL_OPTIONS_KEY = 'interibot_detail_options'

// 공정별 아이콘
const PROCESS_ICONS: Record<string, string> = {
  demolition: '🔨',
  finish: '🎨',
  electric: '💡',
  kitchen: '🍳',
  bathroom: '🚿',
  door_window: '🚪',
  furniture: '🪑',
  film: '🎞️',
  balcony: '🌿',
  entrance: '🏠',
  // 공간별 공정 카테고리
  wall_finish: '🖼️',
  floor_finish: '🏠',
  door_finish: '🚪',
  electric_lighting: '💡',
  kitchen_core: '🍳',
  kitchen_countertop: '🔲',
  bathroom_core: '🚿',
  entrance_core: '🏠',
  balcony_core: '🌿',
  options: '⚙️',
}

// 공정 이름 (한글)
const PROCESS_NAMES: Record<string, string> = {
  demolition: '철거',
  finish: '마감',
  electric: '조명·전기',
  kitchen: '주방',
  bathroom: '욕실',
  door_window: '도어·창호',
  furniture: '가구',
  film: '필름',
  balcony: '베란다',
  entrance: '현관',
  // 공간별 공정 카테고리
  wall_finish: '벽면 마감',
  floor_finish: '바닥 마감',
  door_finish: '문/문틀',
  electric_lighting: '조명/전기',
  kitchen_core: '주방 코어',
  kitchen_countertop: '주방 상판',
  bathroom_core: '욕실 코어',
  entrance_core: '현관 코어',
  balcony_core: '발코니 코어',
  options: '추가 옵션',
}

// 옵션 티어 이름
const TIER_NAMES: Record<string, string> = {
  basic: '기본형',
  comfort: '편하게',
  premium: '프리미엄',
}

// ✅ 공간 표시 순서 (상세견적 탭에서 일관된 순서 보장)
const SPACE_DISPLAY_ORDER = [
  'common',
  'living',
  'kitchen',
  'subKitchen',
  'bathroom',
  'masterBathroom',
  'commonBathroom',
  'storage',
  'window',
  'lighting',
  'balcony',
  'entrance'
] as const

// 공정 옵션 값 → 한글 이름 변환
const PROCESS_OPTION_NAMES: Record<string, string> = {
  // 벽면 마감
  wallpaper: '도배',
  painting: '도장',
  none: '하지 않음',
  // 바닥 마감
  laminate: '강화마루',
  wood: '원목마루',
  ondol: '온돌마루',
  tile: '타일',
  vinyl: '장판',
  // 문/문틀
  replace: '교체',
  film: '필름시공',
  // 조명/전기
  led: 'LED 조명',
  downlight: '다운라이트',
  indirect: '간접조명',
  all: '전체 조명',
  // 주방
  full: '풀시공',
  partial: '부분시공',
  sink_only: '싱크대만',
  // 욕실
  full_remodel: '전체 리모델링',
  partial_remodel: '부분 리모델링',
  // 옵션 (배열)
  builtin_closet: '붙박이장',
  shoe_cabinet: '신발장',
  aircon: '에어컨 배관',
}

function EstimatePageContent() {
  const router = useRouter()
  const { spaceInfo } = useSpaceInfoStore()
  const { analysis: personalityAnalysis } = usePersonalityStore()
  // ✅ 공정별 선택 데이터
  const { selectedProcessesBySpace } = useProcessStore()
  const { selectedSpaces } = useScopeStore()
  
  const [v4Estimate, setV4Estimate] = useState<V4EstimateResultLocal | null>(null)
  const [isCalculating, setIsCalculating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<GradeKeyV4 | null>(null)
  const [estimatesByGrade, setEstimatesByGrade] = useState<Record<GradeKeyV4, UIEstimateV4 | null>>({
    argen_e: null,
    argen_s: null,
    argen_o: null,
  })
  const [calculatingGrade, setCalculatingGrade] = useState<GradeKeyV4 | null>(null)
  const [baseInputData, setBaseInputData] = useState<any>(null) // 초기 계산 데이터 저장
  const [activeTab, setActiveTab] = useState<'summary' | 'detail'>('summary')
  const [detailOptions, setDetailOptions] = useState<any>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Phase 1: Decision Trace 설명 (고객용)
  const [decisionExplanation, setDecisionExplanation] = useState<string[]>([])
  
  // ✅ 6대 지수 리포트 (V5 분석 결과에서 가져오기)
  const [sixIndexReport, setSixIndexReport] = useState<ReportResult | null>(null)
  
  // ✅ 계산된 고객 정보 상태 (UI에서 사용)
  const [calculatedPy, setCalculatedPy] = useState<number>(34)
  const [calculatedRoomCount, setCalculatedRoomCount] = useState<number>(3)
  const [calculatedBathroomCount, setCalculatedBathroomCount] = useState<number>(2)
  
  // 공정별 Before/After 이미지 상태
  const [processImages, setProcessImages] = useState<Record<ProcessImageType, { before: string; after: string } | null>>({
    '철거': null,
    '주방': null,
    '욕실': null,
    '타일': null,
    '목공': null,
    '전기': null,
    '도배': null,
    '필름': null,
  })
  const [generatingProcess, setGeneratingProcess] = useState<ProcessImageType | null>(null)
  
  // 공정별 라벨 정보
  const processImageLabels: Record<ProcessImageType, { name: string; emoji: string; gradient: string }> = {
    '철거': { name: '철거', emoji: '🔨', gradient: 'from-gray-600 via-gray-700 to-gray-800' },
    '주방': { name: '주방', emoji: '🍳', gradient: 'from-orange-500 via-red-500 to-pink-600' },
    '욕실': { name: '욕실', emoji: '🚿', gradient: 'from-cyan-500 via-blue-500 to-indigo-600' },
    '타일': { name: '타일', emoji: '🧱', gradient: 'from-amber-500 via-orange-500 to-red-500' },
    '목공': { name: '목공', emoji: '🪵', gradient: 'from-yellow-600 via-amber-600 to-orange-600' },
    '전기': { name: '전기', emoji: '⚡', gradient: 'from-yellow-400 via-yellow-500 to-orange-500' },
    '도배': { name: '도배', emoji: '🎨', gradient: 'from-pink-400 via-purple-400 to-indigo-400' },
    '필름': { name: '필름', emoji: '✨', gradient: 'from-emerald-400 via-teal-500 to-cyan-500' },
  }
  
  // 공정별 Before/After 이미지 생성 함수
  const handleGenerateProcessImages = async (processType: ProcessImageType) => {
    if (generatingProcess) return

    setGeneratingProcess(processType)
    try {
      const py = spaceInfo?.pyeong || 32
      
      const personalityScores = {
        spacePerception: 5,
        visualSensitivity: 5,
        cleaningHabit: 5,
        organizationSkill: 5,
        colorPreference: 'neutral' as const,
        lightingStyle: 'natural' as const,
      }

      const apartmentInfo = {
        size: py,
        hasBalconyExtension: false,
      }

      console.log(`[공정: ${processType}] Generating images...`)

      const response = await fetch('/api/generate-room-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalityScores,
          apartmentInfo,
          processType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate images')
      }

      const data = await response.json()
      
      if (data.success && data.images) {
        setProcessImages(prev => ({
          ...prev,
          [processType]: data.images
        }))
        console.log(`[공정: ${processType}] Images generated successfully`)
      } else {
        throw new Error('Failed to generate images')
      }
    } catch (error: any) {
      console.error(`[공정: ${processType}] Generation error:`, error)
      alert(`${processType} 공정 이미지 생성 중 오류가 발생했습니다.\n${error.message || '다시 시도해주세요.'}`)
    } finally {
      setGeneratingProcess(null)
    }
  }
  
  // ✅ Hydration 완료 대기 (zustand persist)
  useEffect(() => {
    // localStorage에서 직접 데이터 확인
    const checkHydration = () => {
      if (typeof window !== 'undefined') {
        const scopeData = localStorage.getItem('scope-selection-storage')
        const processData = localStorage.getItem('process-selection-storage')
        console.log('🔄 Hydration 체크:', { scopeData: !!scopeData, processData: !!processData })
        setIsHydrated(true)
      }
    }
    
    // 약간의 딜레이 후 hydration 완료 체크
    const timer = setTimeout(checkHydration, 100)
    return () => clearTimeout(timer)
  }, [])
  
  // ✅ 디버그: Store 데이터 확인 (평수 포함)
  useEffect(() => {
    if (!isHydrated) return
    
    console.log('=== 🔍 견적 페이지 Store 데이터 확인 ===')
    console.log('📏 spaceInfoStore.spaceInfo:', spaceInfo)
    console.log('📏 저장된 평수:', spaceInfo?.pyeong)
    console.log('📍 scopeStore.selectedSpaces:', selectedSpaces)
    console.log('📍 선택된 공간:', selectedSpaces.filter(s => s.isSelected).map(s => ({ id: s.id, name: s.name })))
    console.log('📍 processStore.selectedProcessesBySpace:', selectedProcessesBySpace)
    console.log('==========================================')
  }, [selectedSpaces, selectedProcessesBySpace, isHydrated, spaceInfo])
  
  // ✅ 세부옵션 로드 (주방, 욕실 등)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(DETAIL_OPTIONS_KEY)
      if (saved) {
        setDetailOptions(JSON.parse(saved))
        console.log('📦 세부옵션 로드:', JSON.parse(saved))
      }
    }
  }, [])

  // ✅ 6대 지수 리포트 로드 (V5 분석 결과에서)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('v5DnaResult1')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed?.data?.fullReport) {
            setSixIndexReport(parsed.data.fullReport)
            console.log('📊 6대 지수 리포트 로드 완료')
          }
        }
      } catch (error) {
        console.warn('6대 지수 리포트 로드 실패:', error)
      }
    }
  }, [])

  // ✅ 선택된 공간 목록 (필터링)
  const selectedSpaceList = selectedSpaces.filter(s => s.isSelected)
  
  // ✅ 선택된 공간 ID 목록
  const selectedSpaceIdList = selectedSpaces
    .filter(s => s.isSelected)
    .map(s => s.id)
  
  // ✅ 선택된 공정 목록 추출 (선택된 공간에 해당하는 공정만!)
  const extractSelectedProcesses = () => {
    const processList: Array<{
      spaceId: string;
      spaceName: string;
      category: string;
      categoryName: string;
      value: string | string[];
      valueName: string;
      icon: string;
    }> = []
    
    // ✅ 핵심: 선택된 공간에 해당하는 공정만 추출!
    if (selectedProcessesBySpace && Object.keys(selectedProcessesBySpace).length > 0) {
      Object.entries(selectedProcessesBySpace).forEach(([spaceId, selections]) => {
        // ✅ 선택된 공간이 아니면 건너뛰기
        if (!selectedSpaceIdList.includes(spaceId as any)) return
        if (!selections) return
        
        const spaceName = SPACE_NAMES[spaceId] || spaceId
        
        Object.entries(selections).forEach(([category, value]) => {
          if (value && value !== 'none' && value !== null) {
            const categoryName = PROCESS_NAMES[category] || category
            const icon = PROCESS_ICONS[category] || '📦'
            
            // 값 변환
            let valueName = ''
            if (Array.isArray(value)) {
              valueName = value.map(v => PROCESS_OPTION_NAMES[v] || v).join(', ')
            } else {
              valueName = PROCESS_OPTION_NAMES[value] || value
            }
            
            processList.push({
              spaceId,
              spaceName,
              category,
              categoryName,
              value: value,
              valueName,
              icon,
            })
          }
        })
      })
    }
    
    return processList
  }
  
  const selectedProcessList = extractSelectedProcesses()
  
  // ✅ 선택된 공정 목록 (공간 기반만 사용)
  const useSpaceBasedProcesses = selectedProcessList.length > 0


  // 견적 계산 (hydration 완료 후)
  useEffect(() => {
    // ✅ Hydration이 완료될 때까지 대기
    if (!isHydrated) {
      console.log('⏳ Hydration 대기 중...')
      return
    }
    
    const calculate = async () => {
      if (!spaceInfo) {
        setError('공간 정보가 없습니다. 집 정보를 먼저 입력해주세요.')
        setIsCalculating(false)
        return
      }
      
      // ✅ 고객 정보 유효성 검사 강화
      const hasValidPyeong = spaceInfo.pyeong > 0 || spaceInfo.approximateRange
      if (!hasValidPyeong) {
        console.warn('⚠️ 평수 정보가 부족합니다:', spaceInfo)
        // 경고는 하되 계산은 진행 (기본값 사용)
      }

      try {
        setIsCalculating(true)
        setError(null)

        // 🔍 디버깅: scopeStore.selectedSpaces 확인 (API 호출 전)
        console.log('🔍 [1] scopeStore.selectedSpaces:', JSON.stringify(selectedSpaces, null, 2))
        console.log('🔍 [2] 필터링 결과:', selectedSpaces.filter(s => s.isSelected))

        // ✅ 헌법: 고객이 직접 입력한 평수는 절대 변경하지 않음
        // inputMethod가 'exact'이면 고객이 직접 입력한 평수
        const isCustomerInput = spaceInfo.inputMethod === 'exact' && spaceInfo.pyeong > 0
        
        let py: number
        
        if (isCustomerInput) {
          // 🔒 헌법: 고객 입력 평수는 절대 변경 금지
          py = spaceInfo.pyeong
          console.log('🔒 헌법: 고객이 직접 입력한 평수 사용 (절대 변경 금지):', py)
        } else if (spaceInfo.pyeong > 0) {
          // 평수가 있지만 exact가 아닌 경우도 사용 (하지만 exact가 우선)
          py = spaceInfo.pyeong
          console.log('📏 저장된 평수 사용:', py)
        } else if (spaceInfo.approximateRange) {
          // 정확한 평수가 없으면 approximateRange에서 대표값 추출
          const approximateToActual: Record<string, number> = {
            '20평대': 25,
            '30평대': 34, 
            '40평대': 42,
            '50평 이상': 55
          }
          py = approximateToActual[spaceInfo.approximateRange] || 34
          console.log(`📏 대략 평형 "${spaceInfo.approximateRange}"을 ${py}평으로 변환`)
        } else {
          // 여전히 평수가 없으면 최종 기본값 사용
          py = 34
          console.warn('⚠️ 평수 정보가 없어 기본값 34평을 사용합니다.')
        }
        
        console.log('📏 최종 평수 확인:', { 
          입력된평수: spaceInfo.pyeong,
          대략평형: spaceInfo.approximateRange,
          최종사용평수: py,
          입력방식: spaceInfo.inputMethod,
          고객직접입력여부: isCustomerInput,
          전체spaceInfo: spaceInfo 
        })
        
        // 🔒 헌법: 고객 입력 평수 검증 (절대 변경 금지)
        if (isCustomerInput && py !== spaceInfo.pyeong) {
          console.error('🚨 헌법 위반: 고객 입력 평수가 변경되었습니다!', {
            원본평수: spaceInfo.pyeong,
            변경된평수: py,
          })
          // 강제로 원본 평수로 복원
          py = spaceInfo.pyeong
          console.log('✅ 원본 평수로 복원:', py)
        }
        
        // ✅ 방/욕실 개수 결정 로직 개선
        let roomCount = spaceInfo?.rooms || 0
        let bathroomCount = spaceInfo?.bathrooms || 0
        
        // 방/욕실 개수가 0이면 평수 기반으로 추정
        if (roomCount <= 0) {
          if (py <= 20) roomCount = 2      // 20평 이하: 방 2개
          else if (py <= 30) roomCount = 3 // 30평 이하: 방 3개  
          else if (py <= 40) roomCount = 4 // 40평 이하: 방 4개
          else roomCount = 5               // 40평 초과: 방 5개
          console.log(`📏 평수 ${py}평 기준으로 방 개수를 ${roomCount}개로 추정`)
        }
        
        if (bathroomCount <= 0) {
          if (py <= 25) bathroomCount = 1      // 25평 이하: 욕실 1개
          else if (py <= 45) bathroomCount = 2 // 45평 이하: 욕실 2개
          else bathroomCount = 3               // 45평 초과: 욕실 3개
          console.log(`📏 평수 ${py}평 기준으로 욕실 개수를 ${bathroomCount}개로 추정`)
        }
        
        console.log('🏠 최종 구조 정보:', { py, roomCount, bathroomCount })
        
        // ✅ 상태에 저장 (UI에서 사용)
        setCalculatedPy(py)
        setCalculatedRoomCount(roomCount)
        setCalculatedBathroomCount(bathroomCount)

        // 선택된 공간을 V3 형식으로 변환
        const selectedSpaceIds = selectedSpaces
          .filter(space => space.isSelected)
          .map(space => space.id)
        
        console.log('🔍 선택된 공간 확인:', {
          selectedSpacesCount: selectedSpaces.length,
          selectedSpaceIdsCount: selectedSpaceIds.length,
          selectedSpaceIds,
          selectedSpaces: selectedSpaces.map(s => ({ id: s.id, name: s.name, isSelected: s.isSelected })),
        })
        
        // SpaceId를 V4 형식으로 변환
        const mapSpaceIdToV4 = (spaceId: SpaceId): string | null => {
          switch (spaceId) {
            case 'living': return 'living'
            case 'kitchen': return 'kitchen'
            case 'bathroom': return 'bathroom'
            case 'entrance': return 'entrance'
            case 'balcony': return 'balcony'
            case 'masterBedroom':
            case 'room1':
            case 'room2':
            case 'room3':
            case 'room4':
            case 'room5':
              return 'bedroom'
            case 'dressRoom':
              return 'storage'
            default:
              return null
          }
        }
        
        // 중복 제거된 V4 선택 공간
        let v4SelectedSpacesFromIds = [
          ...new Set(
            selectedSpaceIds
              .map(mapSpaceIdToV4)
              .filter((s): s is string => s !== null)
          )
        ]
        
        // ✅ 폴백: 선택된 공간이 없으면 필수 공간 자동 선택
        if (v4SelectedSpacesFromIds.length === 0) {
          console.warn('⚠️ 선택된 공간이 없음 - 필수 공간 자동 선택')
          
          // 필수 공간 이름 목록
          const essentialSpaceNames = ['거실', '주방', '침실', '욕실']
          
          // 필수 공간에 해당하는 공간 찾기
          const essentialSpaceIds = selectedSpaces
            .filter(s => essentialSpaceNames.some(name => s.name.includes(name)))
            .map(s => s.id)
          
          // V4 형식으로 변환
          v4SelectedSpacesFromIds = [
            ...new Set(
              essentialSpaceIds
                .map(mapSpaceIdToV4)
                .filter((s): s is string => s !== null)
            )
          ]
          
          // 그래도 없으면 모든 공간 선택
          if (v4SelectedSpacesFromIds.length === 0) {
            console.warn('⚠️ 필수 공간도 없음 - 모든 공간 자동 선택')
            v4SelectedSpacesFromIds = [
              ...new Set(
                selectedSpaces
                  .map(s => mapSpaceIdToV4(s.id))
                  .filter((s): s is string => s !== null)
              )
            ]
          }
          
          console.log('✅ 자동 선택된 공간:', v4SelectedSpacesFromIds)
          
          // 사용자 알림 (경고 메시지로 표시)
          const autoSelectedNames = selectedSpaces
            .filter(s => v4SelectedSpacesFromIds.some(v4 => mapSpaceIdToV4(s.id) === v4))
            .map(s => s.name)
          
          console.warn(`⚠️ 공간을 선택하지 않아서 기본 공간(${autoSelectedNames.join(', ')})으로 계산했습니다.`)
        } else {
          console.log('✅ V4 선택 공간:', v4SelectedSpacesFromIds)
        }
        
        // ✅ 핵심 수정: 선택된 공간에 해당하는 공정만 필터링
        // selectedSpaceIds에 포함된 공간의 공정만 사용
        const filteredProcessesBySpace: Record<string, Record<string, string | string[] | null>> = {}
        if (selectedProcessesBySpace && selectedSpaceIds.length > 0) {
          selectedSpaceIds.forEach(spaceId => {
            if (selectedProcessesBySpace[spaceId]) {
              filteredProcessesBySpace[spaceId] = selectedProcessesBySpace[spaceId]
            }
          })
          console.log('🔍 선택된 공간의 공정만 필터링:', Object.keys(filteredProcessesBySpace))
        }
        
        // ✅ V5 태그 결과 적용 (있는 경우) - 공정 필터링 후
        const v5AnalysisResult = usePersonalityStore.getState().analysis?.v5Result
        if (v5AnalysisResult && v5AnalysisResult.processChanges) {
          console.log('🎯 V5 태그 결과 적용:', {
            tags: v5AnalysisResult.tags.tags,
            processChanges: v5AnalysisResult.processChanges.processChanges.length,
          })
          
          // V5 태그 기반 공정 자동 선택
          applyTagsToEstimate(
            v5AnalysisResult.processChanges,
            selectedSpaceIds as any
          )
          
          // processStore 업데이트 후 다시 가져오기
          const updatedProcesses = useProcessStore.getState().selectedProcessesBySpace
          // filteredProcessesBySpace에 V5 결과 반영
          for (const [spaceId, selections] of Object.entries(updatedProcesses)) {
            if (selectedSpaceIds.includes(spaceId as SpaceId)) {
              filteredProcessesBySpace[spaceId] = selections
            }
          }
          console.log('✅ V5 태그 기반 공정 적용 완료')
        }
        
        // ✅ 1차: filteredProcessesBySpace에서 공정 추출 (선택된 공간만!) - V5 결과 반영 후
        let enabledProcessIds: string[] = []
        
        if (Object.keys(filteredProcessesBySpace).length > 0) {
          const processesFromSelections: string[] = []
          Object.entries(filteredProcessesBySpace).forEach(([spaceId, selections]) => {
            if (!selections) return
            Object.entries(selections).forEach(([category, value]) => {
              if (value && value !== 'none') {
                // 카테고리 → 공정 ID 매핑
                if (category === 'kitchen_core' || category === 'kitchen_countertop') {
                  processesFromSelections.push('kitchen')
                }
                if (category === 'bathroom_core') {
                  processesFromSelections.push('bathroom')
                }
                if (category === 'wall_finish' || category === 'floor_finish') {
                  processesFromSelections.push('finish')
                }
                if (category === 'door_finish') {
                  processesFromSelections.push('door_window')
                }
                if (category === 'electric_lighting') {
                  processesFromSelections.push('electric')
                }
                if (category === 'entrance_core') {
                  processesFromSelections.push('entrance')
                }
                if (category === 'balcony_core') {
                  processesFromSelections.push('balcony')
                }
                if (category === 'options') {
                  const opts = Array.isArray(value) ? value : [value]
                  if (opts.some(o => o.includes('closet') || o.includes('furniture') || o === 'builtin_closet')) {
                    processesFromSelections.push('furniture')
                  }
                  if (opts.some(o => o.includes('film'))) {
                    processesFromSelections.push('film')
                  }
                }
              }
            })
          })
          if (processesFromSelections.length > 0) {
            enabledProcessIds = [...new Set(processesFromSelections)]
            console.log('🔄 B안: 선택된 공간의 공정만 추출:', enabledProcessIds)
          }
        }
        
        console.log('🏠 선택된 공간:', selectedSpaceIds)
        console.log('📦 세부옵션:', detailOptions)

        // ✅ V4 API 호출 준비
        // 1. 성향 분석 답변 변환
        const answers = personalityAnalysis?.answers.map(a => ({
          questionId: a.questionId,
          answerId: a.answer,  // answer를 answerId로 사용
          value: a.answer,
        })) || []

        // 2. 선택된 공간 ID 목록 (V4 형식) - 이미 변환됨
        const v4SelectedSpaces = v4SelectedSpacesFromIds

        // 3. 선택된 공정 변환 (공간별)
        const v4SelectedProcesses: Record<string, string[]> = {}
        Object.entries(filteredProcessesBySpace).forEach(([spaceId, selections]) => {
          const v4SpaceId = v4SelectedSpaces.find(s => s === spaceId) || spaceId
          const processIds: string[] = []
          
          Object.entries(selections).forEach(([category, value]) => {
            if (value && value !== 'none') {
              // 카테고리 → V4 공정 ID 매핑
              if (category === 'kitchen_core') processIds.push('kitchen_core')
              if (category === 'bathroom_core') processIds.push('bathroom_waterproof')
              if (category === 'wall_finish') processIds.push('wallpaper')
              if (category === 'floor_finish') processIds.push('flooring')
              if (category === 'electric_lighting') processIds.push('lighting')
              if (category === 'entrance_core') processIds.push('storage_system')
            }
          })
          
          if (processIds.length > 0) {
            v4SelectedProcesses[v4SpaceId] = processIds
          }
        })

        // 4. 선호 설정 (기본값)
        const hasKitchen = v4SelectedSpaces.includes('kitchen')
        const preferences = {
          budget: {
            min: 0,
            max: 50000000,
            flexibility: 'flexible' as const,
          },
          family: {
            totalPeople: roomCount + bathroomCount,
            hasInfant: false,
            hasChild: false,
            hasElderly: false,
            hasPet: false,
          },
          lifestyle: {
            remoteWork: false,
            cookOften: hasKitchen,
            guestsOften: false,
          },
          purpose: 'live' as const,
        }

        // ✅ V4 API 요청 데이터 구성 (V4EstimateRequest 타입 사용)
        const requestBody: V4EstimateRequest = {
          spaceInfo: {
            housingType: (spaceInfo.housingType as 'apartment' | 'villa' | 'house' | 'officetel') || 'apartment',
            pyeong: py,
            rooms: roomCount,
            bathrooms: bathroomCount,
            buildingAge: (spaceInfo as any).buildingAge,
          },
          preferences,
          selectedSpaces: v4SelectedSpaces,
          selectedProcesses: v4SelectedProcesses,
          answers,
          timestamp: new Date().toISOString(),
        }

        // 5. V4 API 호출
        console.log('📊 V4 견적 계산 시작:', requestBody)

        const response = await fetch('/api/estimate/v4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })

        const apiResult = await response.json()

        // ===== Phase 0: BLOCK 처리 (DB 게이트) =====
        if (apiResult.ok === false && apiResult.error?.severity === 'BLOCK') {
          console.log('[ESTIMATE_BLOCK] 프론트: BLOCK 응답 수신, 결과 화면 차단', apiResult.error);
          setError(apiResult.error.userMessage || '견적 산출에 필요한 필수 단가 데이터가 준비되지 않았습니다.');
          setIsCalculating(false);
          return; // 결과 화면 렌더링 중단
        }
        // ===== /Phase 0: BLOCK 처리 =====

        if (!response.ok) {
          const errorData = apiResult;
          console.error('❌ API 에러:', errorData)
          throw new Error(errorData.error?.userMessage || errorData.message || `API 에러: ${response.status}`)
        }
        
        if (apiResult.status !== 'SUCCESS') {
          throw new Error(apiResult.message || 'V4 견적 계산 실패')
        }

        // ✅ API 응답에서 result 추출 (UIEstimateV4 타입)
        const v4Result: UIEstimateV4 = apiResult.result

        // Phase 1: Decision Trace 설명 저장 (고객용만)
        if (apiResult.decision_explanation_split?.customer) {
          setDecisionExplanation(apiResult.decision_explanation_split.customer);
        } else if (apiResult.decision_explanation) {
          // 하위 호환: 기존 단일 설명도 지원
          setDecisionExplanation([apiResult.decision_explanation]);
        }

        console.log('✅ V4 견적 결과:', {
          isSuccess: v4Result.isSuccess,
          grade: v4Result.grade,
          gradeName: v4Result.gradeName,
          total: v4Result.total.formatted,
          breakdownCount: v4Result.breakdown.length,
          breakdown: v4Result.breakdown.map(b => ({
            processName: b.processName,
            amount: b.amount,
            percentage: b.percentage,
            materialsCount: b.materials?.length || 0,
            materials: b.materials?.map(m => ({ name: m.name, quantity: m.quantity, totalPrice: m.totalPrice })) || [],
            hasLabor: !!b.labor,
            labor: b.labor ? { type: b.labor.type, amount: b.labor.amount } : null,
          })),
        })
        
        // ✅ isSuccess 체크
        if (!v4Result.isSuccess) {
          console.error('❌ 견적 계산 실패:', v4Result.errorMessage)
          throw new Error(v4Result.errorMessage || '견적 계산에 실패했습니다.')
        }
        
        // ✅ breakdown 검증
        if (!v4Result.breakdown || v4Result.breakdown.length === 0) {
          console.error('❌ breakdown이 비어있음:', {
            selectedSpaces: v4SelectedSpaces,
            selectedProcesses: v4SelectedProcesses,
            v4Result,
          })
          throw new Error('견적 계산 결과가 비어있습니다. 공간과 평수를 확인해주세요.')
        } else {
          console.log('✅ Breakdown 상세:', v4Result.breakdown)
        }
        
        // ✅ 성공 로그
        console.log('🎉 견적 계산 완료:', {
          등급: v4Result.gradeName,
          총액: v4Result.total.formatted,
          평당: v4Result.total.perPyeong,
          공정수: v4Result.breakdown.length,
          성향점수: v4Result.personalityMatch.score,
          경고수: v4Result.warnings.length,
        })

        // V4 결과 저장
        const recommendedGrade: GradeKeyV4 = 
          v4Result.grade === 'ARGEN_E' ? 'argen_e' :
          v4Result.grade === 'ARGEN_S' ? 'argen_s' :
          'argen_o'

        // 초기 계산 데이터 저장 (등급 변경 시 재사용)
        const baseData = {
          spaceInfo: {
            housingType: (spaceInfo.housingType as 'apartment' | 'villa' | 'house' | 'officetel') || 'apartment',
            pyeong: py,
            rooms: roomCount,
            bathrooms: bathroomCount,
            buildingAge: (spaceInfo as any).buildingAge,
            floor: (spaceInfo as any).floor,
          },
          answers,
          preferences,
          selectedSpaces: v4SelectedSpaces,
          selectedProcesses: v4SelectedProcesses,
        }
        setBaseInputData(baseData)

        // 추천 등급의 견적 저장
        const newEstimatesByGrade: Record<GradeKeyV4, UIEstimateV4 | null> = {
          argen_e: null,
          argen_s: null,
          argen_o: null,
        }
        newEstimatesByGrade[recommendedGrade] = v4Result
        setEstimatesByGrade(newEstimatesByGrade)

        setV4Estimate({
          estimate: v4Result,
          recommendedGrade,
        })

        // 추천 등급 자동 선택
        setSelectedGrade(recommendedGrade)

      } catch (err) {
        console.error('❌ 견적 계산 에러:', err)
        setError(err instanceof Error ? err.message : '견적 계산 중 오류가 발생했습니다.')
      } finally {
        setIsCalculating(false)
      }
    }

    calculate()
  }, [spaceInfo, selectedSpaces, detailOptions, selectedProcessesBySpace, isHydrated, personalityAnalysis])

  // 금액 포맷팅 (만원 단위)
  const formatPrice = (price: number): string => {
    return Math.floor(price / 10000).toLocaleString('ko-KR')
  }

  // 금액 포맷팅 (원 단위)
  const formatWon = (amount: number): string => {
    return amount.toLocaleString('ko-KR') + '원'
  }

  // 선택된 등급의 견적 (V4)
  // 선택된 등급의 견적이 있으면 사용, 없으면 추천 등급 견적 사용
  const currentEstimate = selectedGrade && estimatesByGrade[selectedGrade] 
    ? estimatesByGrade[selectedGrade] 
    : v4Estimate?.estimate || null

  // 등급 선택 핸들러 (해당 등급으로 재계산)
  const handleGradeSelect = useCallback(async (grade: GradeKeyV4) => {
    console.log('🔍 handleGradeSelect 호출:', grade)
    
    // 이미 계산된 등급이면 바로 표시
    if (estimatesByGrade[grade]) {
      console.log('✅ 이미 계산된 등급, 바로 표시:', grade)
      setSelectedGrade(grade)
      return
    }

    // 계산 중이면 무시
    if (calculatingGrade) {
      console.log('⏳ 다른 등급 계산 중, 무시:', calculatingGrade)
      return
    }

    // baseInputData가 없으면 초기 계산 대기
    if (!baseInputData) {
      console.log('⏳ baseInputData 없음, 등급만 선택:', grade)
      setSelectedGrade(grade)
      return
    }

    try {
      console.log('🚀 등급 견적 계산 시작:', grade)
      setCalculatingGrade(grade)
      setIsCalculating(true)

      // 선택된 등급으로 API 호출
      const gradeCode: 'ARGEN_E' | 'ARGEN_S' | 'ARGEN_O' = 
        grade === 'argen_e' ? 'ARGEN_E' :
        grade === 'argen_s' ? 'ARGEN_S' :
        'ARGEN_O'
      
      const response = await fetch('/api/estimate/v4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...baseInputData,
          forceGrade: gradeCode,
        }),
      })

      const apiResult = await response.json()

      // ===== Phase 0: BLOCK 처리 (DB 게이트) =====
      if (apiResult.ok === false && apiResult.error?.severity === 'BLOCK') {
        console.log('[ESTIMATE_BLOCK] 프론트: BLOCK 응답 수신 (등급별), 결과 화면 차단', apiResult.error);
        setError(apiResult.error.userMessage || '견적 산출에 필요한 필수 단가 데이터가 준비되지 않았습니다.');
        setIsCalculating(false);
        setCalculatingGrade(null);
        return; // 결과 화면 렌더링 중단
      }
      // ===== /Phase 0: BLOCK 처리 =====

      if (!response.ok) {
        const errorData = apiResult;
        throw new Error(errorData.error?.userMessage || errorData.message || 'V4 견적 계산 실패')
      }
      
      if (apiResult.status !== 'SUCCESS') {
        throw new Error(apiResult.message || 'V4 견적 계산 실패')
      }

      const v4Result: UIEstimateV4 = apiResult.result

      // Phase 1: Decision Trace 설명 저장 (고객용만)
      if (apiResult.decision_explanation_split?.customer) {
        setDecisionExplanation(apiResult.decision_explanation_split.customer);
      } else if (apiResult.decision_explanation) {
        // 하위 호환: 기존 단일 설명도 지원
        setDecisionExplanation([apiResult.decision_explanation]);
      }

      // 해당 등급의 견적 저장
      setEstimatesByGrade(prev => ({
        ...prev,
        [grade]: v4Result,
      }))

      // 선택된 등급 업데이트
      setSelectedGrade(grade)

      console.log(`✅ ${grade} 등급 견적 계산 완료:`, v4Result.total.formatted)
    } catch (err) {
      console.error(`❌ ${grade} 등급 견적 계산 에러:`, err)
      setError(err instanceof Error ? err.message : '견적 계산 중 오류가 발생했습니다.')
    } finally {
      setIsCalculating(false)
      setCalculatingGrade(null)
    }
  }, [estimatesByGrade, calculatingGrade, baseInputData])

  return (
    <>
      <StepIndicator currentStep={6} />

      <main className="flex min-h-screen flex-col items-center p-4 md:p-6 lg:p-8 pt-12 md:pt-16 bg-gradient-to-br from-white via-argen-50/30 to-pink-50/40 animate-fadeIn">
        <div className="w-full max-w-[1000px]">
          {/* 헤더 */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              🏠 최종 견적서
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">
              2025년 아르젠 표준 단가 기준 | V4 엔진
            </p>
          </div>

          {/* ========================================== */}
          {/* ✅ 고객 선택 요약 (공간 + 공정 + 옵션) */}
          {/* ========================================== */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              📋 고객 선택 요약
            </h2>
            
            {/* ⚠️ 데이터 없음 경고 */}
            {selectedSpaceList.length === 0 && selectedProcessList.length === 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-bold text-yellow-800 mb-1">공간/공정 선택 데이터가 없습니다</p>
                    <p className="text-sm text-yellow-700 mb-3">
                      이전 단계에서 공간과 공정을 선택하지 않으면 <strong>전체 시공 기준</strong>으로 견적이 계산됩니다.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => router.push('/onboarding/scope')}
                        className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                      >
                        공간 선택하기
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push('/onboarding/process')}
                        className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                      >
                        공정 선택하기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 1. 기본 정보 */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                🏠 기본 정보
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">주거형태</p>
                  <p className="font-bold text-gray-900">{spaceInfo?.housingType || '아파트'}</p>
                </div>
                <div className="bg-argen-50 rounded-xl p-3 text-center relative">
                  <p className="text-xs text-gray-500 mb-1">평수</p>
                  <p className="font-bold text-argen-600">
                    {calculatedPy}평
                    {spaceInfo?.inputMethod === 'approximate' && spaceInfo?.approximateRange && (
                      <span className="text-xs text-gray-500 ml-1">({spaceInfo.approximateRange})</span>
                    )}
                  </p>
                  {/* ✅ 평수 출처 정보 표시 */}
                  <p className="text-[9px] text-gray-400 mt-1">
                    {(spaceInfo?.pyeong ?? 0) > 0 
                      ? `직접입력: ${spaceInfo?.pyeong}평`
                      : spaceInfo?.approximateRange 
                        ? `${spaceInfo.approximateRange} → ${calculatedPy}평`
                        : `기본값: ${calculatedPy}평`
                    }
                  </p>
                  {/* ✅ 평수가 이상하면 경고 표시 */}
                  {calculatedPy < 15 && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => router.push('/space-info')}
                        className="text-[10px] px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                      >
                        평수 수정하기
                      </button>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">방 개수</p>
                  <p className="font-bold text-gray-900">{calculatedRoomCount}개</p>
                  {spaceInfo?.rooms !== calculatedRoomCount && (
                    <p className="text-[9px] text-gray-400 mt-1">
                      {(spaceInfo?.rooms ?? 0) > 0 ? `입력: ${spaceInfo?.rooms}개` : `평수기준 추정`}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">욕실</p>
                  <p className="font-bold text-gray-900">{calculatedBathroomCount}개</p>
                  {spaceInfo?.bathrooms !== calculatedBathroomCount && (
                    <p className="text-[9px] text-gray-400 mt-1">
                      {(spaceInfo?.bathrooms ?? 0) > 0 ? `입력: ${spaceInfo?.bathrooms}개` : `평수기준 추정`}
                    </p>
                  )}
                </div>
              </div>
              {/* ✅ 평수 확인 안내 개선 */}
              {(() => {
                // 평수 불일치 상황 감지
                const hasDirectInput = (spaceInfo?.pyeong ?? 0) > 0
                const hasApproximateOnly = !hasDirectInput && spaceInfo?.approximateRange
                const isUsingFallback = calculatedPy === 34 && !hasDirectInput && !hasApproximateOnly
                
                if (hasApproximateOnly) {
                  return (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        ℹ️ <strong>"{spaceInfo.approximateRange}"</strong> 선택으로 <strong>{calculatedPy}평</strong>을 기준으로 계산됩니다.
                        <br/>더 정확한 견적을 원하시면 정확한 평수를 입력해주세요.
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push('/space-info')}
                        className="mt-2 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        정확한 평수 입력하기
                      </button>
                    </div>
                  )
                }
                
                if (isUsingFallback) {
                  return (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-800">
                        ⚠️ 평수 정보가 없어 <strong>기본값 {calculatedPy}평</strong>으로 계산됩니다.
                        <br/>정확한 견적을 위해 집 정보를 입력해주세요.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            localStorage.removeItem('space-info-storage')
                            console.log('🗑️ localStorage 초기화 완료')
                          }
                          router.push('/space-info?reset=true')
                        }}
                        className="mt-2 text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        집 정보 입력하기
                      </button>
                    </div>
                  )
                }
                
                return null
              })()}
            </div>

            {/* 2. 선택한 공간 */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                🏡 선택한 공간 
                <span className="text-xs font-normal text-argen-500 bg-purple-100 px-2 py-0.5 rounded-full">
                  {selectedSpaceList.length}개
                </span>
              </h3>
              {selectedSpaceList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedSpaceList.map((space) => (
                    <span
                      key={space.id}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-argen-600 text-white rounded-full text-sm font-medium shadow-md"
                    >
                      {SPACE_NAMES[space.id] || space.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-orange-600 font-medium">⚠️ 선택된 공간이 없습니다 → 전체 시공 기준</p>
                  <button
                    type="button"
                    onClick={() => router.push('/onboarding/scope')}
                    className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                  >
                    공간 선택하기
                  </button>
                </div>
              )}
            </div>

            {/* 3. 선택한 공정 */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                🔧 선택한 공정 
                <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  {selectedProcessList.length}개
                </span>
              </h3>
              
              {/* B안: 공간별 공정 선택 (selectedProcessesBySpace) */}
              {useSpaceBasedProcesses && (
                <div className="space-y-4">
                  {/* 공간별로 그룹화 */}
                  {(() => {
                    const groupedBySpace: Record<string, typeof selectedProcessList> = {}
                    selectedProcessList.forEach(item => {
                      if (!groupedBySpace[item.spaceId]) {
                        groupedBySpace[item.spaceId] = []
                      }
                      groupedBySpace[item.spaceId].push(item)
                    })
                    
                    return Object.entries(groupedBySpace).map(([spaceId, processes]) => (
                      <div key={spaceId} className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🏠</span>
                          <span className="font-bold text-gray-900">{SPACE_NAMES[spaceId] || spaceId}</span>
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                            {processes.length}개 공정
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {processes.map((process, idx) => (
                            <div
                              key={`${process.spaceId}-${process.category}-${idx}`}
                              className="bg-white border border-green-300 rounded-lg px-3 py-2 text-sm"
                            >
                              <span className="mr-1">{process.icon}</span>
                              <span className="font-medium text-gray-900">{process.categoryName}</span>
                              <span className="text-gray-500 mx-1">:</span>
                              <span className="text-green-700">{process.valueName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}
              
              {/* 공정 선택 목록 (공간 기반만) */}
              {selectedProcessList.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {selectedProcessList.map((process, idx) => (
                    <div
                      key={`${process.spaceId}-${process.category}-${idx}`}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 text-center"
                    >
                      <span className="text-2xl">{process.icon}</span>
                      <p className="font-bold text-gray-900 text-sm mt-1">{process.categoryName}</p>
                      <p className="text-xs text-green-600 mt-0.5">{process.valueName}</p>
                    </div>
                  ))}
                </div>
              )}
              
            </div>

            {/* 4. 세부 옵션 (주방/욕실) - ✅ 선택한 공간에 해당하는 옵션만 표시 */}
            {(() => {
              // ✅ 선택한 공간 ID 목록
              const selectedSpaceIds = selectedSpaces
                .filter(s => s.isSelected)
                .map(s => s.id)
              
              // ✅ 주방이 선택되었는지 확인
              const hasKitchen = selectedSpaceIds.includes('kitchen')
              // ✅ 욕실이 선택되었는지 확인
              const hasBathroom = selectedSpaceIds.includes('bathroom') || 
                                 selectedSpaceIds.some(id => id.includes('bathroom') || id.includes('욕실'))
              
              // ✅ 선택한 공간에 해당하는 옵션만 필터링
              const showKitchenOptions = hasKitchen && detailOptions?.주방옵션
              const showBathroomOptions = hasBathroom && detailOptions?.욕실옵션
              
              // 둘 다 없으면 표시하지 않음
              if (!showKitchenOptions && !showBathroomOptions) {
                return null
              }
              
              return (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    ⚙️ 세부 옵션
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* 주방 옵션 - ✅ 주방이 선택되었을 때만 표시 */}
                    {showKitchenOptions && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">🍳</span>
                        <span className="font-bold text-orange-800">주방 옵션</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {detailOptions.주방옵션.형태 && (
                          <span className="px-3 py-1 bg-white border border-orange-300 text-orange-700 rounded-full text-xs font-medium">
                            {detailOptions.주방옵션.형태}형
                          </span>
                        )}
                        {detailOptions.주방옵션.냉장고장 && (
                          <span className="px-3 py-1 bg-white border border-orange-300 text-orange-700 rounded-full text-xs font-medium">
                            냉장고장
                          </span>
                        )}
                        {detailOptions.주방옵션.키큰장 && (
                          <span className="px-3 py-1 bg-white border border-orange-300 text-orange-700 rounded-full text-xs font-medium">
                            키큰장
                          </span>
                        )}
                        {detailOptions.주방옵션.아일랜드장 && (
                          <span className="px-3 py-1 bg-white border border-orange-300 text-orange-700 rounded-full text-xs font-medium">
                            아일랜드장
                          </span>
                        )}
                        {detailOptions.주방옵션.다용도실 && (
                          <span className="px-3 py-1 bg-white border border-orange-300 text-orange-700 rounded-full text-xs font-medium">
                            다용도실
                          </span>
                        )}
                      </div>
                    </div>
                    )}

                    {/* 욕실 옵션 - ✅ 욕실이 선택되었을 때만 표시 */}
                    {showBathroomOptions && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">🚿</span>
                        <span className="font-bold text-blue-800">욕실 옵션</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {detailOptions.욕실옵션.스타일 && (
                          <span className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-xs font-medium">
                            {detailOptions.욕실옵션.스타일} 스타일
                          </span>
                        )}
                        {detailOptions.욕실옵션.욕조 && (
                          <span className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-xs font-medium">
                            욕조
                          </span>
                        )}
                        {detailOptions.욕실옵션.샤워부스 && (
                          <span className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-xs font-medium">
                            샤워부스
                          </span>
                        )}
                        {detailOptions.욕실옵션.비데 && (
                          <span className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-xs font-medium">
                            비데
                          </span>
                        )}
                        {detailOptions.욕실옵션.수전업그레이드 && (
                          <span className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-xs font-medium">
                            수전 업그레이드
                          </span>
                        )}
                      </div>
                    </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* 로딩 상태 */}
          {isCalculating && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-argen-500 mx-auto mb-4"></div>
                <p className="text-gray-700 font-medium mb-2">견적 계산 중...</p>
                <p className="text-sm text-gray-500">2025년 아르젠 표준 단가로 계산합니다</p>
              </div>
            </div>
          )}

          {/* 에러 상태 */}
          {error && !isCalculating && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
              <div className="text-center">
                <p className="text-red-600 font-semibold mb-2">⚠️ 오류 발생</p>
                <p className="text-sm text-red-700 mb-4">{error}</p>
                <button
                  type="button"
                  onClick={() => router.push('/onboarding/space-info')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  집 정보 입력하기
                </button>
              </div>
            </div>
          )}

          {/* V4 실패 상태 */}
          {v4Estimate && !v4Estimate.estimate.isSuccess && !isCalculating && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
              <div className="text-center">
                <p className="text-red-600 font-semibold mb-2">⚠️ 견적 계산 실패</p>
                <p className="text-sm text-red-700 mb-4">
                  {v4Estimate.estimate.errorMessage || '알 수 없는 오류가 발생했습니다.'}
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/onboarding/scope')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  공사 범위 다시 선택하기
                </button>
              </div>
            </div>
          )}

          {/* breakdown이 비어있을 때 안내 (성공했지만 공정이 없음) */}
          {v4Estimate && 
           v4Estimate.estimate.isSuccess && 
           v4Estimate.estimate.breakdown.length === 0 && 
           !isCalculating && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-6">
              <div className="text-center">
                <p className="text-yellow-800 font-semibold mb-2">
                  ⚠️ 견적을 계산할 수 없습니다
                </p>
                <p className="text-sm text-yellow-700 mb-4">
                  선택된 공간이나 공정이 없습니다. 공사 범위를 다시 선택해주세요.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/onboarding/scope')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  공사 범위 선택하기
                </button>
              </div>
            </div>
          )}

          {/* V4 3등급 카드 */}
          {v4Estimate && !isCalculating && currentEstimate && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
                {(['argen_e', 'argen_s', 'argen_o'] as GradeKeyV4[]).map((grade) => {
                  const info = V4_GRADE_INFO[grade]
                  const isSelected = selectedGrade === grade
                  
                  // 선택된 등급의 견적이 있으면 표시
                  const gradeEstimate = estimatesByGrade[grade]
                  const isCalculatingThisGrade = calculatingGrade === grade
                  const displayAmount = gradeEstimate
                    ? gradeEstimate.total.formatted
                    : isCalculatingThisGrade
                    ? '계산 중...'
                    : '견적 확인하기'

                  return (
                    <button
                      key={grade}
                      onClick={() => handleGradeSelect(grade)}
                      disabled={calculatingGrade === grade}
                      className={`relative p-5 md:p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-argen-500 bg-argen-50 shadow-lg scale-[1.02]'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >

                      {/* 등급 아이콘 & 이름 */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-3xl">{info.icon}</span>
                        <div>
                          <span className={`font-bold text-lg ${isSelected ? 'text-argen-600' : 'text-gray-900'}`}>
                            {info.title}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">{info.description}</p>
                        </div>
                      </div>

                      {/* 금액 */}
                      <div className="mb-2">
                        {gradeEstimate ? (
                          <p className={`text-2xl md:text-3xl font-bold ${isSelected ? 'text-argen-600' : 'text-gray-900'}`}>
                            {displayAmount}
                          </p>
                        ) : isCalculatingThisGrade ? (
                          <p className="text-lg text-gray-400">계산 중...</p>
                        ) : (
                          <p className="text-lg text-gray-400">견적 확인하기</p>
                        )}
                      </div>

                      {/* 평당 단가 */}
                      {gradeEstimate && gradeEstimate.total.perPyeong && (
                        <p className="text-xs text-gray-500">
                          {gradeEstimate.total.perPyeong}
                        </p>
                      )}

                      {/* 선택 표시 */}
                      {isSelected && (
                        <div className="absolute bottom-3 right-3 w-6 h-6 bg-argen-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              
              {/* 성향 분석 반영 여부 표시 (버그 4 개선) */}
              {currentEstimate.hasPersonalityData && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="text-sm text-purple-800 font-medium">
                    ✨ {currentEstimate.personalityBasedMessage}
                  </p>
                  {currentEstimate.personalityMatch.highlights.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {currentEstimate.personalityMatch.highlights.map((highlight, idx) => (
                        <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {highlight}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* 선택된 등급 상세 (V4) */}
              {currentEstimate && selectedGrade && currentEstimate.isSuccess && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
                  {/* 탭 헤더 */}
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                        activeTab === 'summary'
                          ? 'text-argen-600 border-b-2 border-argen-500 bg-argen-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      📊 견적 요약
                    </button>
                    <button
                      onClick={() => setActiveTab('detail')}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                        activeTab === 'detail'
                          ? 'text-argen-600 border-b-2 border-argen-500 bg-argen-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      📋 공정별 상세
                    </button>
                  </div>

                  {/* 탭 컨텐츠 */}
                  <div className="p-4 md:p-6">
                    {activeTab === 'summary' ? (
                      /* 견적 요약 (V4) */
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <span className="text-3xl">{V4_GRADE_INFO[selectedGrade].icon}</span>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {currentEstimate.gradeName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {V4_GRADE_INFO[selectedGrade].description}
                            </p>
                          </div>
                        </div>

                        {/* 총액 표시 */}
                        <div className="bg-gradient-to-br from-purple-50 to-argen-50 rounded-xl p-6 mb-6 border-2 border-purple-200">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-2">총 견적</p>
                            <p className="text-4xl font-bold text-argen-600 mb-2">
                              {currentEstimate.total.formatted}
                            </p>
                            <p className="text-sm text-gray-500">
                              {currentEstimate.total.perPyeong}
                            </p>
                          </div>
                        </div>

                        {/* 6대 지수 분석 리포트 (V5 분석 결과) */}
                        {sixIndexReport && (
                          <div className="mb-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <SixIndexDashboard 
                              report={sixIndexReport} 
                              onNext={() => {
                                // 리포트에서 공정 선택 버튼 클릭 시 상세 탭으로 이동
                                setActiveTab('detail');
                                setTimeout(() => {
                                  const detailSection = document.querySelector('[data-tab-section="detail"]');
                                  if (detailSection) {
                                    detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                }, 100);
                              }}
                              showCTA={false} // 견적 페이지에서는 CTA 버튼 숨김
                            />
                          </div>
                        )}

                        {/* 경고 메시지 */}
                        {currentEstimate.warnings.length > 0 && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                            {currentEstimate.warnings.map((warning, idx) => (
                              <p key={idx} className="text-sm text-yellow-800 mb-1">
                                ⚠️ {warning}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Phase 1: Decision Trace 설명 (고객용만 표시) */}
                        {decisionExplanation.length > 0 && (
                          <div className="bg-blue-50 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xl">📋</span>
                              <span className="font-bold text-gray-900">견적 산출 기준</span>
                            </div>
                            <div className="space-y-2">
                              {decisionExplanation.map((line, idx) => (
                                <p key={idx} className="text-sm text-gray-700">
                                  {line}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Phase 1: 점수/집값 방어도 노출 금지 (제거됨) */}
                        {/* 기존 성향 매칭도 점수 표시 제거 - Phase 1 규칙 준수 */}
                      </div>
                    ) : (
                      /* 공정별 상세 (V4) */
                      <div className="space-y-4">
                        {currentEstimate.breakdown.length > 0 ? (
                          currentEstimate.breakdown.map((block, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                                <span className="font-bold text-gray-900">{block.processName}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-500">{block.percentage}%</span>
                                  <span className="font-bold text-argen-600 text-lg">{block.amount}</span>
                                </div>
                              </div>
                              
                              <div className="p-4">
                                {/* 자재 내역 */}
                                {block.materials.length > 0 && (
                                  <div className="mb-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">자재</h4>
                                    <div className="space-y-2">
                                      {block.materials.map((material, mIdx) => (
                                        <div key={mIdx} className="flex justify-between items-center text-sm">
                                          <div className="flex-1">
                                            <span className="text-gray-900">{material.name}</span>
                                            <span className="text-gray-500 ml-2">({material.quantity})</span>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-gray-600">{material.unitPrice}</span>
                                            <span className="text-gray-400 mx-1">×</span>
                                            <span className="font-medium text-gray-900">{material.totalPrice}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* 노무 내역 */}
                                {block.labor && (
                                  <div className="pt-3 border-t border-gray-100">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">노무</h4>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-900">{block.labor.type}</span>
                                      <span className="font-medium text-gray-900">{block.labor.amount}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-gray-600 mb-2">⚠️ 표시할 상세 견적이 없습니다</p>
                            <p className="text-sm text-gray-500">
                              선택한 공간과 공정에 대한 견적이 계산되지 않았습니다.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 🔧 공정별 AI Before/After 이미지 생성 */}
              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl shadow-xl p-6 md:p-8 border-2 border-amber-200 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">🔧</span>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                      공정별 AI Before/After
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">각 공정별로 시공 전/후 이미지를 생성합니다 (약 30~40초 소요)</p>
                  </div>
                </div>

                {/* 공정별 독립 버튼 8개 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(Object.keys(processImageLabels) as ProcessImageType[]).map((process) => (
                    <div key={process} className={`bg-gradient-to-br ${processImageLabels[process].gradient} rounded-xl p-4 text-white`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{processImageLabels[process].emoji}</span>
                        <h3 className="text-base font-bold">{processImageLabels[process].name}</h3>
                      </div>
                      
                      {!processImages[process] ? (
                        <button
                          onClick={() => handleGenerateProcessImages(process)}
                          disabled={generatingProcess !== null}
                          className={`
                            w-full px-3 py-2 rounded-lg font-semibold text-sm
                            transition-all duration-300
                            flex items-center justify-center gap-1
                            ${generatingProcess === process
                              ? 'bg-white/30 text-white/70 cursor-not-allowed'
                              : generatingProcess !== null
                                ? 'bg-white/20 text-white/50 cursor-not-allowed'
                                : 'bg-white text-gray-900 hover:bg-white/90'
                            }
                          `}
                        >
                          {generatingProcess === process ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                              <span>생성 중</span>
                            </>
                          ) : (
                            <span>✨ 생성</span>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <p className="text-xs mb-1 text-white/80">Before</p>
                              <img 
                                src={processImages[process]!.before} 
                                alt={`${process} Before`}
                                className="w-full rounded-md shadow-sm"
                              />
                            </div>
                            <div>
                              <p className="text-xs mb-1 text-white/80">After</p>
                              <img 
                                src={processImages[process]!.after} 
                                alt={`${process} After`}
                                className="w-full rounded-md shadow-sm"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleGenerateProcessImages(process)}
                            disabled={generatingProcess !== null}
                            className="w-full px-2 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md font-medium text-xs transition-all disabled:opacity-50"
                          >
                            🔄 다시
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500 text-center mt-4">
                  💡 이 이미지는 AI가 생성한 참고용 이미지입니다. 실제 시공 결과와 다를 수 있습니다.
                </p>
              </div>

              {/* 하단 안내 */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6 text-center">
                <p className="text-sm text-gray-600 mb-1">
                  ※ 실제 견적은 현장 실측 후 확정됩니다
                </p>
                <p className="text-sm text-gray-600">
                  아르젠 전문가가 정확한 상담을 도와드립니다
                </p>
              </div>
            </>
          )}

          {/* 네비게이션 버튼 */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => router.push('/onboarding/process')}
              className="w-full md:w-[30%] px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
            >
              ← 공정 선택
            </button>
            <button
              type="button"
              onClick={() => {
                window.open('https://www.argen-studio.com/index#yeonragceo', '_blank')
              }}
              className="w-full md:w-[70%] px-6 py-4 bg-gradient-to-r from-argen-500 to-argen-600 text-white rounded-xl hover:from-argen-600 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl font-bold"
            >
              🏆 아르젠 전문가 상담 신청 →
            </button>
          </div>
        </div>
      </main>
    </>
  )
}

export default function EstimatePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-pink-50/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-argen-500 mx-auto mb-4"></div>
          <p className="text-gray-700">로딩 중...</p>
        </div>
      </main>
    }>
      <EstimatePageContent />
    </Suspense>
  )
}
