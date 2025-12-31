'use client';

import { useState } from 'react';
import { Share2, Link2, Check, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { DNATypeInfo } from '@/lib/analysis/v5-ultimate/types';

interface ShareButtonsProps {
  dna: DNATypeInfo;
  matchScore: number;
}

export default function ShareButtons({ dna, matchScore }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/v5` 
    : 'https://interibot.com/v5';

  const shareText = `${dna.emoji} 나의 인테리어 DNA: "${dna.name}"

"${dna.title}"

나도 테스트하기 👉 ${shareUrl}

#인테리봇 #인테리어DNA`;

  const handleKakaoShare = () => {
    if (typeof window !== 'undefined' && (window as any).Kakao?.isInitialized()) {
      (window as any).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `${dna.emoji} 나의 인테리어 DNA: ${dna.name}`,
          description: dna.title,
          imageUrl: `${shareUrl}/og-image.png`,
          link: { webUrl: shareUrl, mobileWebUrl: shareUrl },
        },
        buttons: [{ title: '나도 테스트하기', link: { webUrl: shareUrl, mobileWebUrl: shareUrl } }],
      });
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${dna.emoji} 나의 인테리어 DNA: ${dna.name}`,
          text: dna.title,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="flex justify-center gap-3">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleKakaoShare}
        className="flex items-center gap-2 px-6 py-3.5 bg-[#FEE500] text-[#3C1E1E] 
                   rounded-xl font-semibold transition-all shadow-sm"
      >
        <MessageCircle className="w-5 h-5" />
        카카오톡
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[#E8E4DC]
                   text-[#1F1F1F] font-semibold hover:bg-[#F7F3ED] transition-all"
      >
        <Share2 className="w-5 h-5" />
        공유
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleCopyLink}
        className={`flex items-center gap-2 px-6 py-3.5 rounded-xl border transition-all font-semibold ${
          copied 
            ? 'border-[#B8956B] bg-[#B8956B]/10 text-[#B8956B]' 
            : 'border-[#E8E4DC] text-[#1F1F1F] hover:bg-[#F7F3ED]'
        }`}
      >
        {copied ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
        {copied ? '복사됨!' : '링크'}
      </motion.button>
    </div>
  );
}




