import { NextRequest, NextResponse } from 'next/server';
import { parseTCMBData, getPeriodInflationData } from '@/lib/tcmb';

// Rate limiting için basit bir cache
const lastRequestTime = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 1000; // 1 dakika

export async function GET(request: NextRequest) {
  try {
    // Rate limiting kontrolü
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const lastTime = lastRequestTime.get(clientIp) || 0;

    if (now - lastTime < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - lastTime)) / 1000);
      return NextResponse.json(
        { 
          error: 'Rate limit aşıldı',
          message: `Lütfen ${remainingSeconds} saniye sonra tekrar deneyin.`,
          remainingSeconds 
        },
        { status: 429 }
      );
    }

    // TCMB sayfasından veri çek
    const tcmbUrl = 'https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Istatistikler/Enflasyon+Verileri/Tuketici+Fiyatlari';
    
    const response = await fetch(tcmbUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('TCMB sayfasına erişilemedi');
    }

    const html = await response.text();

    // HTML'den verileri parse et
    const allData = parseTCMBData(html);

    if (allData.length === 0) {
      throw new Error('Veri parse edilemedi');
    }

    // Dönem için gerekli 6 aylık veriyi al
    const periodData = getPeriodInflationData(allData);

    // Rate limiting cache'i güncelle
    lastRequestTime.set(clientIp, now);

    return NextResponse.json({
      success: true,
      data: periodData,
      message: 'Enflasyon verileri başarıyla alındı',
    });

  } catch (error) {
    console.error('TCMB veri çekme hatası:', error);
    return NextResponse.json(
      { 
        error: 'Veri çekme hatası',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}