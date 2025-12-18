/**
 * Materials 테이블 상태 확인 API
 * 
 * GET /api/test-materials-status
 * 
 * materials 테이블의 입력 진행 상황을 확인합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    materials: {},
    construction_phases: {},
    personality_traits: {},
    readiness: {},
    errors: [],
  }

  // ============================================================
  // 1. materials 테이블 상태 확인
  // ============================================================
  try {
    // 총 개수
    const { count: totalCount, error: countError } = await supabase
      .from('materials')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      results.materials.exists = false
      results.materials.error = countError.message
      results.errors.push(`materials count: ${countError.message}`)
    } else {
      results.materials.exists = true
      results.materials.totalCount = totalCount || 0

      // 카테고리별 개수
      const { data: categoryData, error: categoryError } = await supabase
        .from('materials')
        .select('category')
      
      if (!categoryError && categoryData) {
        const categoryCounts: Record<string, number> = {}
        categoryData.forEach((item: any) => {
          const cat = item.category || 'unknown'
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
        })
        results.materials.byCategory = categoryCounts
      }

      // 등급별 개수
      const { data: gradeData, error: gradeError } = await supabase
        .from('materials')
        .select('grade')
      
      if (!gradeError && gradeData) {
        const gradeCounts: Record<string, number> = {}
        gradeData.forEach((item: any) => {
          const grade = item.grade || 'unknown'
          gradeCounts[grade] = (gradeCounts[grade] || 0) + 1
        })
        results.materials.byGrade = gradeCounts
      }

      // 샘플 데이터
      const { data: sampleData, error: sampleError } = await supabase
        .from('materials')
        .select('material_id, material_code, product_name, grade, category')
        .limit(5)
      
      if (!sampleError && sampleData) {
        results.materials.sample = sampleData
      }
    }
  } catch (error: any) {
    results.materials.exists = false
    results.materials.error = error.message
    results.errors.push(`materials: ${error.message}`)
  }

  // ============================================================
  // 2. construction_phases 테이블 상태 확인
  // ============================================================
  try {
    const { count: phaseCount, error: phaseError } = await supabase
      .from('construction_phases')
      .select('*', { count: 'exact', head: true })

    if (phaseError) {
      results.construction_phases.exists = false
      results.construction_phases.error = phaseError.message
    } else {
      results.construction_phases.exists = true
      results.construction_phases.totalCount = phaseCount || 0

      // 샘플 데이터
      const { data: phaseSample, error: phaseSampleError } = await supabase
        .from('construction_phases')
        .select('phase_id, phase_name, phase_category')
        .limit(5)
      
      if (!phaseSampleError && phaseSample) {
        results.construction_phases.sample = phaseSample
      }
    }
  } catch (error: any) {
    results.construction_phases.exists = false
    results.construction_phases.error = error.message
  }

  // ============================================================
  // 3. personality_traits 테이블 상태 확인
  // ============================================================
  try {
    const { count: traitCount, error: traitError } = await supabase
      .from('personality_traits')
      .select('*', { count: 'exact', head: true })

    if (traitError) {
      results.personality_traits.exists = false
      results.personality_traits.error = traitError.message
    } else {
      results.personality_traits.exists = true
      results.personality_traits.totalCount = traitCount || 0
    }
  } catch (error: any) {
    results.personality_traits.exists = false
    results.personality_traits.error = error.message
  }

  // ============================================================
  // 4. personality_materials 입력 준비 상태 확인
  // ============================================================
  try {
    const { count: mappingCount, error: mappingError } = await supabase
      .from('personality_materials')
      .select('*', { count: 'exact', head: true })

    results.readiness.personality_materials_count = mappingError ? 0 : (mappingCount || 0)
    
    // 입력 가능 여부 판단
    const canInput = 
      results.materials.exists && 
      results.materials.totalCount > 0 &&
      results.construction_phases.exists &&
      results.construction_phases.totalCount > 0 &&
      results.personality_traits.exists &&
      results.personality_traits.totalCount >= 15

    results.readiness.canInputPersonalityMaterials = canInput
    results.readiness.recommendation = canInput
      ? '✅ personality_materials 데이터 입력 가능'
      : '⏳ materials 또는 construction_phases 데이터 입력 필요'
  } catch (error: any) {
    results.readiness.error = error.message
  }

  // ============================================================
  // 5. 요약
  // ============================================================
  results.summary = {
    materialsReady: results.materials.exists && (results.materials.totalCount || 0) > 0,
    phasesReady: results.construction_phases.exists && (results.construction_phases.totalCount || 0) > 0,
    traitsReady: results.personality_traits.exists && (results.personality_traits.totalCount || 0) >= 15,
    canStartMapping: results.readiness.canInputPersonalityMaterials || false,
  }

  return NextResponse.json(results, {
    status: results.errors.length > 0 ? 200 : 200, // 정보성 에러는 200
  })
}
















