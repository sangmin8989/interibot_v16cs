'use client';

import { useState } from 'react';

import { Question } from '@/lib/analysis/questions';

import ZodiacModal from './ZodiacModal';

interface QuestionCardProps {
  question: Question;
  onAnswer: (value: unknown) => void;
  selectedValue?: unknown;
  isOptional?: boolean;
}

export default function QuestionCard({
  question,
  onAnswer,
  selectedValue,
  isOptional = false,
}: QuestionCardProps) {
  const [showZodiacModal, setShowZodiacModal] = useState(false);

  const handleSelect = (optionValue: string | number) => {
    if (question.type === 'multiple') {
      const current = Array.isArray(selectedValue) ? selectedValue : [];
      const maxSelections = question.maxSelections || 999;

      if (current.includes(optionValue)) {
        onAnswer(current.filter((value) => value !== optionValue));
      } else if (current.length < maxSelections) {
        onAnswer([...current, optionValue]);
      }
      return;
    }

    onAnswer(optionValue);
  };

  const isSelected = (optionValue: string | number) => {
    if (question.type === 'multiple') {
      const current = Array.isArray(selectedValue) ? selectedValue : [];
      return current.includes(optionValue);
    }

    return selectedValue === optionValue;
  };

  const selectedArray = Array.isArray(selectedValue) ? selectedValue : [];

  return (
    <>
      <div className="animate-fadeIn mb-6 rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">{question.title}</h2>
          {question.description && (
            <p className="text-sm text-gray-600">
              {question.description}
              {isOptional && <span className="ml-2 text-argen-500">(선택사항)</span>}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {question.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                isSelected(option.value)
                  ? 'scale-105 border-argen-500 bg-argen-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {option.icon && <span className="text-3xl">{option.icon}</span>}
              <span className="font-medium text-gray-900">{option.text}</span>
            </button>
          ))}
        </div>

        {question.id === 'vibe_zodiac' && (
          <button
            type="button"
            onClick={() => setShowZodiacModal(true)}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-argen-500 to-argen-500 py-3 px-4 font-bold text-white shadow-lg transition hover:from-argen-600 hover:to-argen-600"
          >
            🎂 생일로 별자리 찾기
          </button>
        )}

        {question.type === 'multiple' && question.maxSelections && (
          <p className="mt-4 text-center text-xs text-gray-500">
            최대 {question.maxSelections}개 선택 가능
            {selectedArray.length > 0 && (
              <> ({selectedArray.length}/{question.maxSelections})</>
            )}
          </p>
        )}
      </div>

      <ZodiacModal
        isOpen={showZodiacModal}
        onClose={() => setShowZodiacModal(false)}
        onZodiacSelect={(zodiac) => {
          onAnswer(zodiac);
          setShowZodiacModal(false);
        }}
      />
    </>
  );
}


