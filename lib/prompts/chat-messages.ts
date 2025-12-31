/**
 * 친근한 챗봇 메시지 템플릿
 * 
 * 작성일: 2025-12-31
 * 목적: 카톡 대화처럼 친근한 챗봇 말투 제공
 */

/**
 * 초기 인사 메시지
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getGreetingMessage(styleResult: any): string {
  const style = styleResult?.style || styleResult?.styleName || styleResult?.selectedStyle;
  if (style) {
    return `안녕하세요! 저는 인테리 🏠\n\n${style} 스타일을 좋아하시는군요! 오늘 어떤 공간 고민이 있으세요?`;
  }
  return `안녕하세요! 저는 인테리 🏠\n\n오늘 어떤 공간 고민이 있으세요?`;
}

/**
 * 답변에 대한 피드백 메시지
 */
export function getFeedbackMessage(answer: string, questionContext?: string): string {
  // 답변 내용에 따른 자연스러운 피드백
  const feedbacks: Record<string, string> = {
    '주방': '주방이 좁으시구나! 😅\n혹시 요리 자주 하시는 편이에요?',
    '욕실': '욕실이 고민이시군요!\n청소가 힘드신가요, 아니면 공간이 좁으신가요?',
    '거실': '거실이 중요하시는군요! 🛋️\n가족들이 함께 모이는 공간이니까 신경 쓰이실 거예요.',
    '침실': '침실은 휴식 공간이니까 중요하죠! 😴\n어떤 게 가장 불편하세요?',
  };

  // 키워드 매칭
  for (const [keyword, feedback] of Object.entries(feedbacks)) {
    if (answer.includes(keyword)) {
      return feedback;
    }
  }

  // 기본 피드백
  return '알겠어요! 더 자세히 알아볼게요.';
}

/**
 * 질문 전 안내 메시지
 */
export function getQuestionIntroMessage(questionIndex: number): string | null {
  if (questionIndex === 0) {
    return '그럼 몇 가지만 물어볼게요!';
  }
  if (questionIndex === 2) {
    return '거의 다 왔어요! 😊';
  }
  return null;
}

/**
 * 완료 축하 메시지
 */
export function getCompletionMessage(): string {
  return '완료되었어요! 🎉\n\n분석 결과를 확인해볼까요?';
}

/**
 * 에러 메시지 (친근한 톤)
 */
export function getErrorMessage(): string {
  return '앗, 잠깐만요! 다시 시도해볼게요. 😅';
}
