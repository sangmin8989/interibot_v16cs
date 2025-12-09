'use client';

import { useState } from 'react';

interface ZodiacModalProps {
  isOpen: boolean;
  onClose: () => void;
  onZodiacSelect: (zodiacValue: string) => void;
}

const getZodiacFromDate = (month: number, day: number): string => {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'aquarius';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'pisces';
  return '';
};

const zodiacInfo: Record<string, { name: string; icon: string; period: string }> = {
  aries: { name: '양자리', icon: '♈', period: '3/21 ~ 4/19' },
  taurus: { name: '황소자리', icon: '♉', period: '4/20 ~ 5/20' },
  gemini: { name: '쌍둥이자리', icon: '♊', period: '5/21 ~ 6/20' },
  cancer: { name: '게자리', icon: '♋', period: '6/21 ~ 7/22' },
  leo: { name: '사자자리', icon: '♌', period: '7/23 ~ 8/22' },
  virgo: { name: '처녀자리', icon: '♍', period: '8/23 ~ 9/22' },
  libra: { name: '천칭자리', icon: '♎', period: '9/23 ~ 10/22' },
  scorpio: { name: '전갈자리', icon: '♏', period: '10/23 ~ 11/21' },
  sagittarius: { name: '사수자리', icon: '♐', period: '11/22 ~ 12/21' },
  capricorn: { name: '염소자리', icon: '♑', period: '12/22 ~ 1/19' },
  aquarius: { name: '물병자리', icon: '♒', period: '1/20 ~ 2/18' },
  pisces: { name: '물고기자리', icon: '♓', period: '2/19 ~ 3/20' },
};

export default function ZodiacModal({ isOpen, onClose, onZodiacSelect }: ZodiacModalProps) {
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const resetForm = () => {
    setMonth('');
    setDay('');
    setResult(null);
  };

  const handleCalculate = () => {
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    if (!m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
      alert('올바른 날짜를 입력해주세요');
      return;
    }

    const zodiac = getZodiacFromDate(m, d);
    setResult(zodiac);
  };

  const handleConfirm = () => {
    if (result) {
      onZodiacSelect(result);
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="animate-fadeIn fixed inset-0 z-40 bg-black bg-opacity-50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="animate-slideUp w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">🎂 생일로 별자리 찾기</h3>
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="text-2xl text-gray-400 transition hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {!result ? (
            <div>
              <p className="mb-4 text-gray-600">생일을 입력하면 별자리를 자동으로 찾아드려요</p>

              <div className="mb-6 flex gap-3">
                <div className="flex-1">
                  <label className="mb-2 block text-sm font-medium text-gray-700">월</label>
                  <input
                    type="number"
                    placeholder="1-12"
                    value={month}
                    onChange={(event) => setMonth(event.target.value)}
                    min="1"
                    max="12"
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-center text-lg font-medium focus:border-argen-500 focus:outline-none"
                  />
                </div>

                <div className="flex-1">
                  <label className="mb-2 block text-sm font-medium text-gray-700">일</label>
                  <input
                    type="number"
                    placeholder="1-31"
                    value={day}
                    onChange={(event) => setDay(event.target.value)}
                    min="1"
                    max="31"
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-center text-lg font-medium focus:border-argen-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCalculate}
                className="w-full rounded-xl bg-argen-500 py-3 text-lg font-bold text-white transition-all hover:bg-argen-600"
              >
                별자리 확인하기
              </button>
            </div>
          ) : (
            <div className="animate-fadeIn text-center">
              <div className="mb-6">
                <div className="mb-4 text-8xl">{zodiacInfo[result].icon}</div>
                <h4 className="mb-2 text-3xl font-bold text-gray-900">{zodiacInfo[result].name}</h4>
                <p className="text-gray-600">{zodiacInfo[result].period}</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-xl bg-gray-200 py-3 font-medium text-gray-700 transition hover:bg-gray-300"
                >
                  다시 입력
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 rounded-xl bg-argen-500 py-3 font-bold text-white transition hover:bg-argen-600"
                >
                  이 별자리로 선택
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}














