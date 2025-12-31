'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ImagePlus, ArrowRight, Camera } from 'lucide-react';
import { useV5UltimateStore } from '@/lib/store/v5UltimateStore';
import { PhotoAnalysisResult } from '@/lib/analysis/v5-ultimate/types';

interface PhotoUploaderProps {
  onComplete: (analysis: PhotoAnalysisResult | null) => void;
}

const LOADING_MESSAGES = [
  '공간을 스캔하고 있어요',
  '스타일을 분석하고 있어요',
  '색감을 추출하고 있어요',
  '패턴을 인식하고 있어요',
  '거의 다 됐어요',
];

export default function PhotoUploader({ onComplete }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setUploadedPhoto, setPhotoAnalysis, setLoading } = useV5UltimateStore();

  const startLoadingMessages = useCallback(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      setLoadingMessageIndex(index);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있어요');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('파일 크기는 20MB 이하로 올려주세요');
      return;
    }

    setError(null);
    
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadedPhoto(url, file);

    setIsAnalyzing(true);
    setLoading(true);
    const stopMessages = startLoadingMessages();

    try {
      const base64 = await fileToBase64(file);
      
      const response = await fetch('/api/v5/analyze/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, imageType: 'current' }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '분석에 실패했어요');
      }

      setPhotoAnalysis(data.analysis);
      onComplete(data.analysis);

    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 문제가 발생했어요');
      setPreviewUrl(null);
    } finally {
      stopMessages();
      setIsAnalyzing(false);
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSkip = () => {
    onComplete(null);
  };

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="text-center mb-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-[#1F1F1F] mb-4"
        >
          현재 공간 사진이 있으신가요?
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-[#6B6B6B]"
        >
          있으면 더 정확한 분석이 가능해요
        </motion.p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {!previewUrl ? (
          <motion.div
            key="uploader"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* 업로드 영역 */}
            <motion.div
              className={`
                relative rounded-3xl p-16 cursor-pointer transition-all duration-300
                border-2 border-dashed bg-white
                ${isDragging 
                  ? 'border-[#B8956B] bg-[#FDFBF7]' 
                  : 'border-[#E8E4DC] hover:border-[#D4B896] hover:bg-[#FDFBF7]'}
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleClick}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex flex-col items-center">
                <motion.div 
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-8
                              ${isDragging ? 'bg-[#B8956B]/10' : 'bg-[#F7F3ED]'}`}
                  animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
                >
                  <Camera className={`w-10 h-10 ${isDragging ? 'text-[#B8956B]' : 'text-[#9B9B9B]'}`} />
                </motion.div>
                
                <p className="text-xl text-[#1F1F1F] font-semibold mb-2">
                  {isDragging ? '여기에 놓으세요' : '사진을 드래그하거나 클릭하세요'}
                </p>
                <p className="text-[#9B9B9B] mb-8">
                  JPG, PNG, WEBP · 최대 20MB
                </p>

                <button
                  type="button"
                  className="flex items-center gap-2 px-8 py-4 bg-[#1F1F1F] text-white 
                             rounded-xl font-semibold hover:bg-[#333] transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  사진 선택
                </button>
              </div>
            </motion.div>

            {/* 건너뛰기 */}
            <motion.button
              onClick={handleSkip}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full py-4 mt-6 text-[#6B6B6B] hover:text-[#1F1F1F] 
                         border-2 border-[#E8E4DC] rounded-xl
                         hover:border-[#B8956B] hover:bg-[#FDFBF7]
                         transition-all font-medium"
            >
              사진 없이 진행하기 →
            </motion.button>

            {/* 팁 */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-12 p-6 rounded-2xl bg-[#F7F3ED]"
            >
              <p className="text-[#6B6B6B] text-center">
                💡 <span className="text-[#1F1F1F] font-medium">거실, 주방, 침실</span> 같이 
                자주 사용하는 공간 사진이 좋아요
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden bg-white shadow-xl">
              <img
                src={previewUrl}
                alt="업로드된 사진"
                className={`w-full aspect-[16/10] object-cover ${isAnalyzing ? 'opacity-50' : ''}`}
              />

              {!isAnalyzing && (
                <button
                  onClick={handleRemove}
                  className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur 
                             rounded-xl shadow-lg hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5 text-[#1F1F1F]" />
                </button>
              )}

              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
                  <motion.div
                    className="w-16 h-16 border-4 border-[#F7F3ED] border-t-[#B8956B] rounded-full mb-6"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <p className="text-xl font-semibold text-[#1F1F1F]">
                    {LOADING_MESSAGES[loadingMessageIndex]}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 
                     text-red-600 text-center"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}




