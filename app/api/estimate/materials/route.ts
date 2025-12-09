import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getMaterialsByAreas, MaterialType, AREA_MATERIALS } from '@/lib/utils/materialMapper'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 룰에 명시된 자재 브랜드
const MATERIAL_BRANDS: Record<MaterialType, string[]> = {
  wall: ['LG', '신한'],
  floor: ['LX', '한화'],
  tile: ['국산', '이태리'],
  window: ['LG', 'KCC'],
  lighting: ['루미나', '필립스'],
  paint: ['KCC'],
  cabinet: ['아르젠', '한샘'],
  countertop: ['한샘', '아르젠'],
  sink: ['한샘', '아르젠'],
  faucet: ['한샘', '아르젠'],
  mirror: ['아르젠', '한샘'],
  shower: ['한샘', '아르젠'],
}

export async function POST(request: NextRequest) {
  let requestBody: any = {}
  try {
    requestBody = await request.json()
    const { spaceInfo, style, preference, selectedAreas } = requestBody

    // 선택된 공간에 따라 필요한 자재만 필터링
    const areas = selectedAreas || spaceInfo?.areas || []
    const neededMaterials = getMaterialsByAreas(areas as any)
    
    console.log('[자재 추천] 선택된 공간:', areas)
    console.log('[자재 추천] 필요한 자재:', neededMaterials)

    // 필요한 자재만 브랜드 목록 생성
    const availableBrands = neededMaterials
      .map((material) => {
        const brands = MATERIAL_BRANDS[material] || []
        return `- ${material}: ${brands.join(', ')}`
      })
      .join('\n')

    // JSON 스키마 생성 (필요한 자재만)
    const jsonSchema = neededMaterials
      .map((material) => `  "${material}": { "brand": "브랜드명", "price": 0 }`)
      .join(',\n')

    // OpenAI를 사용하여 스타일과 성향에 맞는 자재 브랜드 추천
    const systemPrompt = `당신은 아르젠 인테리봇의 자재 추천 전문가입니다.
고객의 스타일과 성향을 바탕으로 적합한 자재 브랜드를 추천하세요.

사용 가능한 브랜드:
${availableBrands}

JSON 형식으로 반환하세요 (필요한 자재만 포함):
{
${jsonSchema}
}

중요: 
1. 위에 명시된 브랜드만 사용하세요. 임의로 브랜드를 생성하지 마세요.
2. 선택된 공간에 필요한 자재만 포함하세요.
3. 선택되지 않은 공간의 자재는 포함하지 마세요.`

    const userPrompt = `스타일: ${style || '모던'}
선택된 공간: ${areas.join(', ') || '전체'}
필요한 자재: ${neededMaterials.join(', ')}

성향 분석:
${JSON.stringify(preference, null, 2)}

공간 정보:
${JSON.stringify(spaceInfo, null, 2)}

위 정보를 바탕으로 선택된 공간에 필요한 자재 브랜드만 추천해주세요.
선택되지 않은 공간의 자재는 포함하지 마세요.`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')

    // 브랜드 검증 및 기본값 설정 (필요한 자재만)
    const materials: Record<string, { brand: string; price: number }> = {}
    
    for (const materialType of neededMaterials) {
      const brands = MATERIAL_BRANDS[materialType] || []
      const resultMaterial = result[materialType]
      
      materials[materialType] = {
        brand: brands.includes(resultMaterial?.brand)
          ? resultMaterial.brand
          : brands[0] || '기본',
        price: resultMaterial?.price || 0,
      }
    }

    return NextResponse.json({
      success: true,
      materials,
    })
  } catch (error) {
    console.error('자재 견적 오류:', error)
    
    // 오류 발생 시 선택된 공간에 필요한 기본 자재만 제공
    const areas = requestBody?.selectedAreas || requestBody?.spaceInfo?.areas || []
    const neededMaterials = getMaterialsByAreas(areas as any)
    const defaultMaterials: Record<string, { brand: string; price: number }> = {}
    
    for (const materialType of neededMaterials) {
      const brands = MATERIAL_BRANDS[materialType] || []
      defaultMaterials[materialType] = {
        brand: brands[0] || '기본',
        price: 0,
      }
    }
    
    return NextResponse.json({
      success: true,
      materials: defaultMaterials,
    })
  }
}
