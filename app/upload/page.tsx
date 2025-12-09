'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('파일을 선택해주세요.')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // 파일을 base64로 변환
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string

        try {
          // Vision API로 이미지 분석
          const response = await fetch('/api/analyze/vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: base64String }),
          })

          const data = await response.json()

          if (!data.success) {
            throw new Error(data.error || '이미지 분석에 실패했습니다.')
          }

          // 분석 결과를 성향 점수로 변환
          const visionAnalysis = data.analysis || {}
          
          // Vision 분석 결과를 성향 점수로 매핑
          const preferences = {
            spaceSense: visionAnalysis.spaceFeeling === '넓음' ? 8 : visionAnalysis.spaceFeeling === '보통' ? 6 : 4,
            visualSensitivity: 7, // 사진 분석 기반
            auditorySensitivity: 5, // 기본값
            cleaningTendency: visionAnalysis.storageShortage ? 4 : 6,
            organizationLevel: visionAnalysis.organizationLevel || 6,
            sleepPattern: 5, // 기본값
            activityLevel: 6, // 기본값
            familyComposition: 5, // 기본값
            healthFactors: 5, // 기본값
            budgetSense: 6, // 기본값
            colorPreference: visionAnalysis.moodTone === '화이트' ? 8 : visionAnalysis.moodTone === '우드' ? 7 : 6,
            lightingPreference: visionAnalysis.lightingColorTemp === '3000K' ? 8 : visionAnalysis.lightingColorTemp === '4000K' ? 7 : 6,
            spacePurpose: 6, // 기본값
            discomfortFactors: visionAnalysis.storageShortage ? 7 : 5,
            lifestyleRoutine: 6, // 기본값
          }

          // 분석 결과를 sessionStorage에 저장
          const analysisId = `vision_${Date.now()}`
          const analysisData = {
            summary: visionAnalysis.summary || '사진 분석 결과를 바탕으로 인테리어 추천을 제공합니다.',
            preferences,
            recommendedStyle: visionAnalysis.style || '모던',
            recommendedColors: visionAnalysis.colors || ['화이트', '그레이'],
            visionAnalysis: visionAnalysis,
            uploadedImage: base64String,
          }

          sessionStorage.setItem(`analysis_${analysisId}`, JSON.stringify(analysisData))

          // 결과 페이지로 이동
          router.push(`/result?mode=vision&analysisId=${analysisId}`)
        } catch (error: any) {
          console.error('이미지 분석 오류:', error)
          setError(error.message || '이미지 분석 중 오류가 발생했습니다.')
          setIsAnalyzing(false)
        }
      }
      reader.readAsDataURL(selectedFile)
    } catch (error: any) {
      console.error('파일 처리 오류:', error)
      setError('파일 처리 중 오류가 발생했습니다.')
      setIsAnalyzing(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateAndSetFile = (file: File) => {
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.')
      return false
    }

    // 파일 크기 확인 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.')
      return false
    }

    setSelectedFile(file)
    setError(null)

    // 미리보기 생성
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
    return true
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            사진 업로드로 분석
          </h1>
          <p className="text-gray-600">
            인테리어 사진을 업로드하면 AI가 자동으로 분석해드립니다
          </p>
        </div>

        {/* 업로드 영역 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-argen-500 bg-argen-100'
                  : 'border-gray-300 hover:border-argen-500 hover:bg-argen-50'
              }`}
            >
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                사진을 업로드하세요
              </h3>
              <p className="text-gray-600 mb-4">
                클릭하거나 드래그하여 파일을 선택하세요
              </p>
              <p className="text-sm text-gray-500">
                지원 형식: JPG, PNG, WEBP (최대 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* 미리보기 */}
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="업로드된 이미지"
                  className="w-full rounded-lg shadow-lg max-h-96 object-contain bg-gray-100"
                />
                <button
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                  title="파일 제거"
                >
                  ✕
                </button>
              </div>

              {/* 파일 정보 */}
              {selectedFile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">파일명:</span> {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">크기:</span>{' '}
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* 분석 버튼 */}
        {previewUrl && (
          <div className="flex justify-between gap-4">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              취소
            </button>
            <button
              onClick={handleUpload}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-argen-500 text-white rounded-lg hover:bg-argen-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>분석 중...</span>
                </>
              ) : (
                '분석 시작'
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

