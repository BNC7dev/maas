import { NextResponse } from 'next/server';
import { parseTisData, getCurrentTisRates } from '@/lib/tis';

export async function GET() {
  try {
    // TİS dosyasını oku
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/toplusozlesmezamoranlari.txt`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('TİS dosyası okunamadı');
    }

    const text = await response.text();
    
    // Verileri parse et
    const allRates = parseTisData(text);

    if (allRates.length === 0) {
      throw new Error('TİS verileri parse edilemedi');
    }

    // Mevcut dönem için uygun TİS oranlarını al
    const { oldTis, newTis, oldTisLabel, newTisLabel } = getCurrentTisRates(allRates);

    if (oldTis === null || newTis === null) {
      throw new Error('İlgili dönem için TİS verisi bulunamadı');
    }

    return NextResponse.json({
      success: true,
      data: {
        oldTis: oldTis.toString().replace('.', ','),
        newTis: newTis.toString().replace('.', ','),
        oldTisLabel,
        newTisLabel,
      },
      message: 'TİS oranları başarıyla alındı',
    });

  } catch (error) {
    console.error('TİS veri çekme hatası:', error);
    return NextResponse.json(
      { 
        error: 'TİS veri çekme hatası',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}
