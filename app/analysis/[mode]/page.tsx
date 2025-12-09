import { notFound } from 'next/navigation';

import AnalysisPage from '@/components/analysis/AnalysisPage';
import { AnalysisMode } from '@/lib/analysis/types';

interface AnalysisModePageProps {
  params: {
    mode: string;
  };
}

const SUPPORTED_MODES: AnalysisMode[] = ['quick', 'vibe', 'standard', 'deep'];

export default function AnalysisModePage({ params }: AnalysisModePageProps) {
  const modeParam = params.mode.toLowerCase() as AnalysisMode;

  if (!SUPPORTED_MODES.includes(modeParam)) {
    notFound();
  }

  return <AnalysisPage mode={modeParam} />;
}


