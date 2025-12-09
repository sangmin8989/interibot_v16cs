'use client'

import { useState } from 'react'
import ReactCompareImage from 'react-compare-image'

interface ImageComparisonProps {
  beforeImage: string
  afterImage: string
  style?: string
}

export default function ImageComparison({ 
  beforeImage, 
  afterImage,
  style 
}: ImageComparisonProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="w-full space-y-4">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          🏠 고객님만의 거실 디자인
        </h2>
        <p className="text-gray-600">
          좌우로 드래그하여 Before/After를 비교해보세요
        </p>
        {style && (
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            스타일: {getStyleLabel(style)}
          </div>
        )}
      </div>

      {/* Image Comparison Slider */}
      <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl border-4 border-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-argen-500 mx-auto"></div>
              <p className="text-gray-600">이미지 로딩 중...</p>
            </div>
          </div>
        )}
        
        <ReactCompareImage
          leftImage={beforeImage}
          rightImage={afterImage}
          leftImageLabel="Before"
          rightImageLabel="After"
          sliderLineColor="#3b82f6"
          sliderLineWidth={4}
          handleSize={50}
          onSliderPositionChange={() => {
            if (isLoading) setIsLoading(false)
          }}
        />
      </div>

      {/* Labels */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-3 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">시공 전</p>
          <p className="text-lg font-bold text-gray-900">Before</p>
        </div>
        <div className="p-3 bg-blue-100 rounded-lg">
          <p className="text-sm text-argen-500">시공 후</p>
          <p className="text-lg font-bold text-blue-900">After</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-argen-50 to-roseSoft/30 border border-argen-200 rounded-xl p-4">
        <p className="text-sm text-gray-700 text-center">
          ✨ 이 이미지는 AI가 고객님의 성향 분석을 바탕으로 생성한 예시입니다.
          <br />
          실제 시공은 전문 디자이너와 상담 후 진행됩니다.
        </p>
      </div>
    </div>
  )
}

// Helper function to convert style ID to Korean label
function getStyleLabel(style: string): string {
  const labels: Record<string, string> = {
    'minimal-modern': '미니멀 모던',
    'natural-wood': '내추럴 우드',
    'modern-luxury': '모던 럭셔리',
    'colorful-maximal': '컬러풀 맥시멀',
    'practical-family': '실용형 패밀리',
    'monotone-chic': '모노톤 시크',
    'japandi': '재팬디',
    'industrial': '인더스트리얼',
    'classic-modern': '클래식 모던',
  }
  return labels[style] || style
}
