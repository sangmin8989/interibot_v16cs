import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { generatePrompts } from '@/lib/utils/processRecommender'
import type { SpaceType } from '@/lib/utils/processRecommender'
import { getImageModel, IMAGE_MODELS } from '@/lib/config/ai-models'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 공정별 프롬프트 생성 함수
type ProcessType = '철거' | '주방' | '욕실' | '타일' | '목공' | '전기' | '도배' | '필름'

function generateProcessPrompts(processType: ProcessType, apartmentSize: number) {
  const sizeDesc = apartmentSize <= 20 ? '소형 아파트' : apartmentSize <= 35 ? '중형 아파트' : '대형 아파트'
  
  const processPrompts: Record<ProcessType, { before: string; after: string }> = {
    '철거': {
      before: `Professional architectural photo of ${sizeDesc} interior before demolition, showing old wallpaper peeling off, outdated flooring, old ceiling tiles, Korean apartment living room, realistic natural lighting, high resolution`,
      after: `Professional architectural photo of ${sizeDesc} interior after demolition, clean concrete walls exposed, empty room ready for renovation, Korean apartment living room, bright natural lighting, high resolution`
    },
    '주방': {
      before: `Professional architectural photo of old Korean apartment kitchen, outdated cabinets, old countertop, worn sink and faucet, ${sizeDesc}, realistic natural lighting, high resolution`,
      after: `Professional architectural photo of modern renovated Korean apartment kitchen, sleek white cabinets, marble countertop, modern sink with elegant faucet, ${sizeDesc}, bright natural lighting, high resolution, minimalist design`
    },
    '욕실': {
      before: `Professional architectural photo of old Korean apartment bathroom, outdated tiles, old bathtub or shower, worn toilet and sink, ${sizeDesc}, realistic fluorescent lighting, high resolution`,
      after: `Professional architectural photo of modern renovated Korean apartment bathroom, elegant tiles, modern walk-in shower with glass door, contemporary toilet and vanity, ${sizeDesc}, warm LED lighting, high resolution, spa-like atmosphere`
    },
    '타일': {
      before: `Professional architectural photo of Korean apartment floor with old worn tiles, cracked and discolored ceramic tiles, ${sizeDesc} living space, realistic natural lighting, high resolution`,
      after: `Professional architectural photo of Korean apartment floor with new premium porcelain tiles, elegant gray marble pattern, ${sizeDesc} living space, bright natural lighting, high resolution, modern finish`
    },
    '목공': {
      before: `Professional architectural photo of Korean apartment with basic walls and no built-in furniture, empty corners, ${sizeDesc} living room, realistic natural lighting, high resolution`,
      after: `Professional architectural photo of Korean apartment with custom built-in furniture, elegant wall panels, integrated shelving system, ${sizeDesc} living room, warm ambient lighting, high resolution, modern wood finish`
    },
    '전기': {
      before: `Professional architectural photo of Korean apartment ceiling with old fluorescent lights, exposed wiring, outdated light switches, ${sizeDesc}, harsh lighting, high resolution`,
      after: `Professional architectural photo of Korean apartment ceiling with modern LED recessed lights, elegant track lighting, smart switches, ${sizeDesc}, warm ambient lighting, high resolution, sophisticated atmosphere`
    },
    '도배': {
      before: `Professional architectural photo of Korean apartment walls with old yellowed wallpaper, peeling edges, water stains, ${sizeDesc} living room, realistic natural lighting, high resolution`,
      after: `Professional architectural photo of Korean apartment walls with fresh modern wallpaper, subtle elegant pattern, clean finish, ${sizeDesc} living room, bright natural lighting, high resolution, contemporary style`
    },
    '필름': {
      before: `Professional architectural photo of Korean apartment with old wooden doors and window frames, scratched and faded surfaces, ${sizeDesc}, realistic natural lighting, high resolution`,
      after: `Professional architectural photo of Korean apartment with doors and windows wrapped in premium interior film, sleek white and wood grain finish, ${sizeDesc}, bright natural lighting, high resolution, modern clean look`
    }
  }
  
  return processPrompts[processType]
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    const { personalityScores, apartmentInfo, spaceType = 'living', processType } = await request.json()

    if (!personalityScores || !apartmentInfo) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    let beforePrompt: string
    let afterPrompt: string
    let generationType: string

    // 공정별 이미지 생성
    if (processType) {
      const validProcessTypes: ProcessType[] = ['철거', '주방', '욕실', '타일', '목공', '전기', '도배', '필름']
      if (!validProcessTypes.includes(processType as ProcessType)) {
        return NextResponse.json(
          { success: false, error: 'Invalid process type' },
          { status: 400 }
        )
      }
      
      console.log(`[공정: ${processType}] Generating images...`)
      
      const prompts = generateProcessPrompts(processType as ProcessType, apartmentInfo.size || 32)
      beforePrompt = prompts.before
      afterPrompt = prompts.after
      generationType = `process:${processType}`
    } 
    // 공간별 이미지 생성
    else {
      const validSpaceTypes: SpaceType[] = ['living', 'kitchen', 'bedroom', 'bathroom']
      if (!validSpaceTypes.includes(spaceType as SpaceType)) {
        return NextResponse.json(
          { success: false, error: 'Invalid space type' },
          { status: 400 }
        )
      }

      console.log(`[${spaceType}] Generating images...`)

      const prompts = generatePrompts(
        personalityScores,
        apartmentInfo,
        spaceType as SpaceType
      )
      beforePrompt = prompts.beforePrompt
      afterPrompt = prompts.afterPrompt
      generationType = `space:${spaceType}`
    }

    console.log(`[${generationType}] Before prompt:`, beforePrompt.substring(0, 100) + '...')
    console.log(`[${generationType}] After prompt:`, afterPrompt.substring(0, 100) + '...')

    const beforeImage = await openai.images.generate({
      model: 'dall-e-3',
      prompt: beforePrompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
      style: 'natural',
    })

    if (!beforeImage.data?.[0]?.url) {
      throw new Error('Failed to generate Before image')
    }

    const afterImage = await openai.images.generate({
      model: 'dall-e-3',
      prompt: afterPrompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
      style: 'natural',
    })

    if (!afterImage.data?.[0]?.url) {
      throw new Error('Failed to generate After image')
    }

    const endTime = Date.now()
    const generationTime = Math.round((endTime - startTime) / 1000)

    return NextResponse.json({
      success: true,
      images: {
        before: beforeImage.data[0].url,
        after: afterImage.data[0].url,
      },
      generationType,
      generationTime,
      usedPrompts: {
        before: beforePrompt,
        after: afterPrompt,
      },
    })
  } catch (error: any) {
    console.error('[Image Generation] Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate room images: ${error.message}`,
      },
      { status: 500 }
    )
  }
}