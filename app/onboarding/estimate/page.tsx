'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StepIndicator from '@/components/onboarding/StepIndicator'
import { useSpaceInfoStore } from '@/lib/store/spaceInfoStore'
import { usePersonalityStore } from '@/lib/store/personalityStore'
import { useProcessStore } from '@/lib/store/processStore'
import { useScopeStore } from '@/lib/store/scopeStore'
import { PROCESS_DEFINITIONS } from '@/constants/process-definitions'
import { SPACE_NAMES } from '@/constants/spaces'

// 공정별 Before/After 이미지 생성 타입
type ProcessImageType = '철거' | '주방' | '욕실' | '타일' | '목공' | '전기' | '도배' | '필름'

// ✅ V3 계산기 사용 (새로운 아르젠 단가 시스템)
import { 
  calculateFullEstimateV3, 
  type FullEstimateV3,
  type EstimateInputV3,
  type SelectedSpace as V3SelectedSpace,
} from '@/lib/estimate/calculator-v3'
import { 
  Grade, 
  formatWon, 
  GRADES 
} from '@/lib/data/pricing-v3'
import type { SpaceId, ProcessCategory } from '@/types/spaceProcess'

// 등급 타입 (소문자)
type GradeKey = 'basic' | 'standard' | 'argen' | 'premium';

// 등급 매핑
const GRADE_MAP: Record<GradeKey, Grade> = {
  basic: 'BASIC',
  standard: 'STANDARD',
  argen: 'ARGEN',
  premium: 'PREMIUM'
};

// 4등급 견적 결과
interface AllGradesEstimate {
  basic: FullEstimateV3;
  standard: FullEstimateV3;
  argen: FullEstimateV3;
  premium: FullEstimateV3;
  recommended: GradeKey;
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
  const { selectedProcessesBySpace, tierSelections } = useProcessStore()
  const { selectedSpaces } = useScopeStore()
  
  const [estimates, setEstimates] = useState<AllGradesEstimate | null>(null)
  const [isCalculating, setIsCalculating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<GradeKey | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'detail'>('summary')
  const [detailOptions, setDetailOptions] = useState<any>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  
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
    console.log('📍 processStore.tierSelections:', tierSelections)
    
    // ✅ localStorage 직접 확인
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('space-info-storage')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          console.log('💾 localStorage 직접 확인:', parsed?.state?.spaceInfo?.pyeong)
        } catch (e) {
          console.error('❌ localStorage 파싱 실패:', e)
        }
      }
    }
    
    console.log('==========================================')
  }, [selectedSpaces, selectedProcessesBySpace, tierSelections, isHydrated, spaceInfo])
  
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
  
  // ✅ 선택된 공정 목록 (tierSelections에서 enabled된 것만 - A안 호환)
  const enabledProcessList = Object.entries(tierSelections || {})
    .filter(([_, selection]) => selection && selection.enabled)
    .map(([processId, selection]) => ({
      id: processId,
      name: PROCESS_NAMES[processId] || processId,
      icon: PROCESS_ICONS[processId] || '📦',
      tier: selection.tier,
      tierName: TIER_NAMES[selection.tier] || selection.tier,
    }))
  
  // ✅ 어떤 데이터가 있는지 확인
  const useSpaceBasedProcesses = selectedProcessList.length > 0
  const useTierBasedProcesses = enabledProcessList.length > 0 && !useSpaceBasedProcesses

  // 등급별 정보
  const gradeInfo: Record<GradeKey, { icon: string; title: string; color: string; bgColor: string; description: string }> = {
    basic: { icon: '💰', title: '실속형', color: 'text-gray-700', bgColor: 'bg-gray-100', description: '가격 대비 실용성 중심' },
    standard: { icon: '⭐', title: '표준형', color: 'text-blue-700', bgColor: 'bg-blue-100', description: '품질과 가격의 균형' },
    argen: { icon: '🏆', title: '아르젠', color: 'text-argen-600', bgColor: 'bg-purple-100', description: '맞춤 제작 프리미엄' },
    premium: { icon: '💎', title: '프리미엄', color: 'text-amber-700', bgColor: 'bg-amber-100', description: '최고급 브랜드 자재' }
  }

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

        // ✅ 평수 결정 로직 개선 - approximateRange도 고려
        let py = spaceInfo.pyeong || 0
        
        // 정확한 평수가 없으면 approximateRange에서 대표값 추출
        if (py <= 0 && spaceInfo.approximateRange) {
          const approximateToActual: Record<string, number> = {
            '20평대': 25,
            '30평대': 34, 
            '40평대': 42,
            '50평 이상': 55
          }
          py = approximateToActual[spaceInfo.approximateRange] || 34
          console.log(`📏 대략 평형 "${spaceInfo.approximateRange}"을 ${py}평으로 변환`)
        }
        
        // 여전히 평수가 없으면 최종 기본값 사용
        if (py <= 0) {
          py = 34
          console.warn('⚠️ 평수 정보가 없어 기본값 34평을 사용합니다.')
        }
        
        console.log('📏 최종 평수 확인:', { 
          입력된평수: spaceInfo.pyeong,
          대략평형: spaceInfo.approximateRange,
          최종사용평수: py,
          입력방식: spaceInfo.inputMethod,
          전체spaceInfo: spaceInfo 
        })
        
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
        
        // SpaceId를 V3SelectedSpace로 매핑
        const mapSpaceIdToV3 = (spaceId: SpaceId): V3SelectedSpace | null => {
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
              return 'room'
            case 'dressRoom':
              return 'storage'
            default:
              return null
          }
        }
        
        // 중복 제거된 V3 선택 공간
        const v3SelectedSpaces: V3SelectedSpace[] = [
          ...new Set(
            selectedSpaceIds
              .map(mapSpaceIdToV3)
              .filter((s): s is V3SelectedSpace => s !== null)
          )
        ]
        
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
        
        // ✅ 1차: filteredProcessesBySpace에서 공정 추출 (선택된 공간만!)
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
        
        // ✅ 2차: tierSelections에서 공정 추출 (A안 - B안 없을 때)
        if (enabledProcessIds.length === 0) {
          enabledProcessIds = Object.entries(tierSelections || {})
            .filter(([_, selection]) => selection && selection.enabled)
            .map(([processId]) => processId)
          if (enabledProcessIds.length > 0) {
            console.log('🔄 A안: tierSelections에서 공정 추출:', enabledProcessIds)
          }
        }
        
        console.log('🏠 선택된 공간:', selectedSpaceIds)
        console.log('🔧 최종 공정:', enabledProcessIds)
        console.log('📦 세부옵션:', detailOptions)

        // ✅ 3차: 공정 없으면 선택된 공간 기준으로 공정 추론
        let finalProcessIds = enabledProcessIds
        if (finalProcessIds.length === 0 && v3SelectedSpaces.length > 0) {
          const inferredProcesses: string[] = []
          if (v3SelectedSpaces.includes('kitchen')) inferredProcesses.push('kitchen')
          if (v3SelectedSpaces.includes('bathroom')) inferredProcesses.push('bathroom')
          if (v3SelectedSpaces.includes('living') || v3SelectedSpaces.includes('room')) {
            inferredProcesses.push('finish')
          }
          if (v3SelectedSpaces.includes('entrance')) inferredProcesses.push('entrance')
          if (v3SelectedSpaces.includes('balcony')) inferredProcesses.push('balcony')
          if (v3SelectedSpaces.includes('storage')) inferredProcesses.push('furniture')
          finalProcessIds = [...new Set(inferredProcesses)]
          console.log('🔄 공간 기반 공정 추론:', finalProcessIds)
        }

        // ✅ 옵션 설정
        const includeKitchen = finalProcessIds.includes('kitchen')
        const includeBathroom = finalProcessIds.includes('bathroom')
        const includeFinish = finalProcessIds.includes('finish')
        const includeElectric = finalProcessIds.includes('electric')
        const includeDoorWindow = finalProcessIds.includes('door_window')
        const includeFurniture = finalProcessIds.includes('furniture')

        // 기본 입력 옵션
        // ✅ 핵심: filteredProcessesBySpace 사용 (선택된 공간의 공정만!)
        const baseInput: Omit<EstimateInputV3, 'grade'> = {
          py,
          bathroomCount, // ✅ 개선된 욕실 개수 전달
          selectedSpaces: v3SelectedSpaces.length > 0 ? v3SelectedSpaces : undefined,
          enabledProcessIds: finalProcessIds.length > 0 ? finalProcessIds : undefined,
          detailOptions: detailOptions || undefined,
          processSelections: Object.keys(filteredProcessesBySpace).length > 0 ? filteredProcessesBySpace : undefined, // ✅ 선택된 공간의 공정만!
          isExtended: false,
          closetType: includeFurniture ? 'SWING' : 'SWING',
          includeFoldingDoor: includeDoorWindow,
          includeBidet: detailOptions?.욕실옵션?.비데 || false,
          includeBathtub: detailOptions?.욕실옵션?.욕조 || false,
          includeDoorlock: includeDoorWindow,
          includeLighting: includeElectric
        }

        console.log('📊 V3 견적 계산 시작:', baseInput)
        
        // ✅ 고객 정보 최종 확인
        console.log('👤 고객 정보 최종 확인:', {
          원본평수: spaceInfo.pyeong,
          대략평형: spaceInfo.approximateRange,
          계산평수: py,
          원본방개수: spaceInfo.rooms,
          계산방개수: roomCount,
          원본욕실개수: spaceInfo.bathrooms,
          계산욕실개수: bathroomCount,
          입력방식: spaceInfo.inputMethod
        })

        // ✅ 4등급 모두 계산 (비동기 함수이므로 await 필요)
        const basicEstimate = await calculateFullEstimateV3({ ...baseInput, grade: 'BASIC' })
        const standardEstimate = await calculateFullEstimateV3({ ...baseInput, grade: 'STANDARD' })
        const argenEstimate = await calculateFullEstimateV3({ ...baseInput, grade: 'ARGEN' })
        const premiumEstimate = await calculateFullEstimateV3({ ...baseInput, grade: 'PREMIUM' })

        // ✅ 안전 체크: summary가 없을 수 있으므로 옵셔널 체이닝 사용
        console.log('✅ V3 견적 결과:', {
          평수: py,
          basic: formatWon(basicEstimate?.summary?.grandTotal || 0),
          standard: formatWon(standardEstimate?.summary?.grandTotal || 0),
          argen: formatWon(argenEstimate?.summary?.grandTotal || 0),
          premium: formatWon(premiumEstimate?.summary?.grandTotal || 0),
          평당단가_아르젠: `${Math.round((argenEstimate?.summary?.grandTotal || 0) / py / 10000)}만원`
        })

        setEstimates({
          basic: basicEstimate,
          standard: standardEstimate,
          argen: argenEstimate,
          premium: premiumEstimate,
          recommended: 'argen'
        })

        // 아르젠 자동 선택
        setSelectedGrade('argen')

      } catch (err) {
        console.error('❌ 견적 계산 에러:', err)
        setError(err instanceof Error ? err.message : '견적 계산 중 오류가 발생했습니다.')
      } finally {
        setIsCalculating(false)
      }
    }

    calculate()
  }, [spaceInfo, selectedSpaces, tierSelections, detailOptions, selectedProcessesBySpace, isHydrated])

  // 금액 포맷팅 (만원 단위)
  const formatPrice = (price: number): string => {
    return Math.floor(price / 10000).toLocaleString('ko-KR')
  }

  // 선택된 등급의 견적
  const currentEstimate = selectedGrade && estimates ? estimates[selectedGrade] : null

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
              2025년 아르젠 표준 단가 기준 | 4등급 체계
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
            {selectedSpaceList.length === 0 && selectedProcessList.length === 0 && enabledProcessList.length === 0 && (
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
                  {useSpaceBasedProcesses ? selectedProcessList.length : enabledProcessList.length}개
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
              
              {/* A안: 티어 기반 공정 선택 (tierSelections) */}
              {useTierBasedProcesses && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {enabledProcessList.map((process) => (
                    <div
                      key={process.id}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 text-center"
                    >
                      <span className="text-2xl">{process.icon}</span>
                      <p className="font-bold text-gray-900 text-sm mt-1">{process.name}</p>
                      <p className="text-xs text-green-600 mt-0.5">{process.tierName}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 공정 선택 없음 */}
              {!useSpaceBasedProcesses && !useTierBasedProcesses && (
                <p className="text-sm text-gray-500 italic bg-gray-50 rounded-lg p-3">
                  선택된 공정이 없습니다. 선택한 공간을 기준으로 자동 적용됩니다.
                </p>
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

          {/* 4등급 카드 */}
          {estimates && !isCalculating && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                {(['basic', 'standard', 'argen', 'premium'] as GradeKey[]).map((grade) => {
                  const estimate = estimates[grade]
                  const info = gradeInfo[grade]
                  const isSelected = selectedGrade === grade
                  const isRecommended = estimates.recommended === grade

                  return (
                    <button
                      key={grade}
                      onClick={() => setSelectedGrade(grade)}
                      className={`relative p-4 md:p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-argen-500 bg-argen-50 shadow-lg scale-[1.02]'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {/* 추천 배지 */}
                      {isRecommended && (
                        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-argen-500 text-white text-xs font-bold rounded-full">
                          추천
                        </div>
                      )}

                      {/* 등급 아이콘 & 이름 */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{info.icon}</span>
                        <span className={`font-bold ${isSelected ? 'text-argen-600' : 'text-gray-900'}`}>
                          {info.title}
                        </span>
                      </div>

                      {/* 금액 */}
                      <div className="mb-2">
                        <p className={`text-xl md:text-2xl font-bold ${isSelected ? 'text-argen-600' : 'text-gray-900'}`}>
                          {formatPrice(estimate?.summary?.grandTotal || 0)}
                          <span className="text-sm font-normal text-gray-500 ml-1">만원</span>
                        </p>
                      </div>

                      {/* 평당 단가 - ✅ 안전 체크 추가 */}
                      <p className="text-xs text-gray-500">
                        평당 약 {formatPrice(estimate?.summary?.pricePerPy || 0)}만원
                      </p>

                      {/* 선택 표시 */}
                      {isSelected && (
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-argen-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              
              {/* 선택된 등급 상세 */}
              {currentEstimate && selectedGrade && (
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
                      /* 견적 요약 */
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <span className="text-3xl">{gradeInfo[selectedGrade].icon}</span>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {gradeInfo[selectedGrade].title} 등급
                            </h3>
                            <p className="text-sm text-gray-500">
                              {GRADES[GRADE_MAP[selectedGrade]].description}
                            </p>
                          </div>
                        </div>

                        {/* 금액 요약 */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">자재비</span>
                              <span className="font-medium">{formatWon(currentEstimate?.summary?.materialTotal || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">노무비</span>
                              <span className="font-medium">{formatWon(currentEstimate?.summary?.laborTotal || 0)}</span>
                            </div>
                            <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
                              <span className="text-gray-600">순공사비</span>
                              <span className="font-medium">{formatWon(currentEstimate?.summary?.netTotal || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">부가세 (10%)</span>
                              <span className="font-medium">{formatWon(currentEstimate?.summary?.vat || 0)}</span>
                            </div>
                            <div className="border-t-2 border-purple-300 pt-3 flex justify-between items-center">
                              <span className="text-lg font-bold text-gray-900">총 견적</span>
                              <span className="text-xl font-bold text-argen-600">
                                {formatWon(currentEstimate?.summary?.grandTotal || 0)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 공사 기간 */}
                        <div className="bg-blue-50 rounded-xl p-4 mb-6">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">📅</span>
                            <span className="font-bold text-gray-900">예상 공사 기간</span>
                          </div>
                          <p className="text-blue-700 font-medium">{currentEstimate?.duration?.typical || '-'}</p>
                        </div>

                        {/* 아르젠 특장점 */}
                        {currentEstimate?.argenFeatures && (
                          <div className="bg-argen-50 rounded-xl p-4">
                            <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                              <span>🏆</span> 아르젠 등급 특장점
                            </h4>
                            
                            <div className="mb-4">
                              <p className="text-sm font-medium text-argen-600 mb-2">🔧 아르젠 제작 품목</p>
                              <ul className="space-y-1">
                                {currentEstimate.argenFeatures.made.map((item, i) => (
                                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-argen-500">•</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-argen-600 mb-2">⭐ 아르젠 추천 자재</p>
                              <ul className="space-y-1">
                                {currentEstimate.argenFeatures.recommended.map((item, i) => (
                                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-argen-500">•</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* 공정별 상세 - 선택된 공간만 표시 */
                      <div className="space-y-4">
                        {/* ✅ 디버깅 정보 (개발 모드) */}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                            <p className="font-bold mb-2">🔍 상세견적 디버깅 정보</p>
                            <div className="space-y-1">
                              {Object.entries(currentEstimate?.spaces || {}).map(([key, space]) => {
                                const willDisplay = space && 
                                                  space.items && 
                                                  space.items.length > 0 && 
                                                  (space.subtotal > 0 || key === 'common') &&
                                                  !space.spaceName?.includes('(미선택)');
                                return (
                                  <div key={key} className={`p-2 rounded ${willDisplay ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <span className="font-medium">{key}:</span>{' '}
                                    <span>공간명={space?.spaceName || '없음'}, </span>
                                    <span>항목수={space?.items?.length || 0}, </span>
                                    <span>소계={formatWon(space?.subtotal || 0)}, </span>
                                    <span className={willDisplay ? 'text-green-700 font-bold' : 'text-red-700'}>
                                      {willDisplay ? '✅ 표시됨' : '❌ 제외됨'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* ✅ 공간 표시 순서 정의 (일관된 순서 보장) */}
                        {(() => {
                          return SPACE_DISPLAY_ORDER
                            .filter(key => {
                              const space = currentEstimate?.spaces[key as keyof typeof currentEstimate.spaces];
                              // ✅ 개선된 필터링 로직
                              if (!space) return false;
                              if (space.spaceName && space.spaceName.includes('(미선택)')) return false;
                              if (!space.items || space.items.length === 0) {
                                // common 공간은 항목이 없어도 표시하지 않음 (철거/보양이 없을 수 있음)
                                return false;
                              }
                              // common은 소계가 0이어도 표시 (항목이 있으면)
                              if (space.subtotal === 0 && key !== 'common') return false;
                              return true;
                            })
                            .map(key => {
                              const space = currentEstimate?.spaces[key as keyof typeof currentEstimate.spaces];
                              if (!space) return null;
                              
                              return (
                                <div key={key} className="border border-gray-200 rounded-xl overflow-hidden">
                                  <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                                    <span className="font-bold text-gray-900">{space.spaceName}</span>
                                    <span className="font-bold text-argen-600">{formatWon(space.subtotal)}</span>
                                  </div>
                                  <div className="p-4">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-gray-500 text-xs">
                                          <th className="text-left pb-2">항목</th>
                                          <th className="text-right pb-2">자재비</th>
                                          <th className="text-right pb-2">노무비</th>
                                          <th className="text-right pb-2">합계</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {space.items.map((item, i) => (
                                          <tr key={i} className="border-t border-gray-100">
                                            <td className="py-2">
                                              <div className="font-medium text-gray-900">{item.name}</div>
                                              {item.quantity && (
                                                <div className="text-xs text-gray-500">{item.quantity}</div>
                                              )}
                                              {item.note && (
                                                <div className="text-xs text-argen-500">{item.note}</div>
                                              )}
                                            </td>
                                            <td className="py-2 text-right text-gray-600">
                                              {item.materialCost > 0 ? formatWon(item.materialCost) : '-'}
                                            </td>
                                            <td className="py-2 text-right text-gray-600">
                                              {item.laborCost > 0 ? formatWon(item.laborCost) : '-'}
                                            </td>
                                            <td className="py-2 text-right font-medium text-gray-900">
                                              {formatWon(item.totalCost)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            });
                        })()}
                        
                        {/* ✅ 표시된 공간이 없을 때 안내 */}
                        {(() => {
                          const hasAnySpace = (SPACE_DISPLAY_ORDER as readonly string[]).some(key => {
                            const space = currentEstimate?.spaces[key as keyof typeof currentEstimate.spaces];
                            return space && 
                                   space.items && 
                                   space.items.length > 0 && 
                                   (space.subtotal > 0 || key === 'common') &&
                                   !space.spaceName?.includes('(미선택)');
                          });
                          
                          if (!hasAnySpace) {
                            return (
                              <div className="p-6 text-center bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-gray-600 mb-2">⚠️ 표시할 상세 견적이 없습니다</p>
                                <p className="text-sm text-gray-500">
                                  선택한 공간과 공정에 대한 견적이 계산되지 않았습니다.
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
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
