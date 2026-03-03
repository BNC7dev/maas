import { NextResponse } from 'next/server';
import { parseTisData, getCurrentTisRates } from '@/lib/tis';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    // Toplu Sözleşme dosyasını direkt dosya sisteminden oku
    const filePath = join(process.cwd(), 'public', 'toplusozlesmezamoranlari.txt');
    const text = await readFile(filePath, 'utf-8');
    
    // Verileri parse et
    const allRates = parseTisData(text);

    if (allRates.length === 0) {
      throw new Error('Toplu Sözleşme verileri parse edilemedi');
    }

    // Mevcut dönem için uygun Toplu Sözleşme oranlarını al
    const { oldTis, newTis, oldTisLabel, newTisLabel } = getCurrentTisRates(allRates);

    if (oldTis === null || newTis === null) {
      throw new Error('İlgili dönem için Toplu Sözleşme verisi bulunamadı');
    }

    return NextResponse.json({
      success: true,
      data: {
        oldTis: oldTis.toString().replace('.', ','),
        newTis: newTis.toString().replace('.', ','),
        oldTisLabel,
        newTisLabel,
      },
      message: 'Toplu Sözleşme oranları başarıyla alındı',
    });

  } catch (error) {
    console.error('Toplu Sözleşme veri çekme hatası:', error);
    return NextResponse.json(
      { 
        error: 'Toplu Sözleşme veri çekme hatası',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}
