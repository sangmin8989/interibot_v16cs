'use client';

import { useRouter } from 'next/navigation';
import RealityConditionForm from '@/components/reality/RealityConditionForm';

export default function RealityPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4">
      <RealityConditionForm
        onComplete={() => router.push('/space-select')}
        onBack={() => router.back()}
      />
    </div>
  );
}
