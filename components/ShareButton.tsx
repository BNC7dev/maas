'use client';

import React, { useState } from 'react';

interface ShareButtonProps {
  data: {
    months: string[];
    oldTis: string;
    newTis: string;
    totalPercent: number | null;
    newSalary: number | null;
    increase: number | null;
  };
}

export default function ShareButton({ data }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const generateShareText = () => {
    const monthsText = data.months
      .filter(m => m)
      .map((m, i) => `${i + 1}. ay: ${m}%`)
      .join(', ');
    
    return `🧮 Maaş Zammı Hesaplama Sonuçları

📈 Aylık Enflasyon: ${monthsText}
💎 TİS Oranları: Önceki ${data.oldTis}%, Yeni ${data.newTis}%
📊 Toplam Artış: ${data.totalPercent?.toFixed(2) || '—'}%
💰 Yeni Maaş: ₺${data.newSalary?.toFixed(2) || '—'}
📈 Artış Miktarı: ₺${data.increase?.toFixed(2) || '—'}

Hesapla: https://maas-zammi.app`;
  };

  const handleShare = async () => {
    const shareText = generateShareText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Maaş Zammı Hesaplama',
          text: shareText,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        alert('Kopyalama başarısız oldu');
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95"
      aria-label="Sonuçları paylaş"
    >
      <span className="text-xl">📤</span>
      <span>{copied ? 'Kopyalandı!' : 'Sonuçları paylaş'}</span>
    </button>
  );
}
