import { Question } from './types';
import { quickQuestions } from './quick';
import { vibeQuestions } from './vibe';
import { standardQuestions } from './standard';
import { deepQuestions } from './deep';

type AnalysisMode = 'quick' | 'standard' | 'deep' | 'vibe';

const QUESTION_COLLECTIONS: Record<AnalysisMode, Question[]> = {
  quick: quickQuestions,
  standard: standardQuestions,
  deep: deepQuestions,
  vibe: vibeQuestions,
};

export const questionMap: Record<string, Question> = {};

[...quickQuestions, ...standardQuestions, ...deepQuestions, ...vibeQuestions].forEach((question) => {
  questionMap[question.id] = question;
});

export const getQuestionsByMode = (rawMode: string): Question[] => {
  try {
    const mode = decodeURIComponent(String(rawMode || ''))
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, '');

    if (mode in QUESTION_COLLECTIONS) {
      const questions = QUESTION_COLLECTIONS[mode as AnalysisMode];
      if (Array.isArray(questions) && questions.length > 0) {
        return questions;
      }
      console.warn(`모드 "${mode}"의 질문이 비어있습니다.`);
    } else {
      console.warn(`지원하지 않는 모드: "${mode}". 기본 모드(quick)를 사용합니다.`);
    }

    return quickQuestions;
  } catch (error) {
    console.error('질문 로딩 오류:', error);
    return quickQuestions;
  }
};

export * from './types';
export { quickQuestions, standardQuestions, deepQuestions, vibeQuestions };

