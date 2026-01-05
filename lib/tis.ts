/**
 * Toplu İş Sözleşmesi (TİS) Zam Oranları Yönetimi
 * 
 * Dönem mantığı TCMB ile aynı:
 * - 1. Dönem (Ocak-Haziran): Önceki yılın 2. dönem (Temmuz-Aralık) verileri
 * - 2. Dönem (Temmuz-Aralık): Aynı yılın 1. dönem (Ocak-Haziran) verileri
 * - Veriler 1 ay gecikmeli açıklanır
 */

export interface TisRate {
  year: number;
  period: 1 | 2; // 1: Ocak-Haziran, 2: Temmuz-Aralık
  rate: number; // Yüzde olarak
}

/**
 * TİS txt dosyasını parse et
 */
export function parseTisData(text: string): TisRate[] {
  const rates: TisRate[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Boş satır veya yorum satırını atla
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Format: 2024/1=15
    const match = trimmed.match(/^(\d{4})\/([12])=(\d+(?:\.\d+)?)$/);
    if (!match) continue;

    const year = parseInt(match[1]);
    const period = parseInt(match[2]) as 1 | 2;
    const rate = parseFloat(match[3]);

    if (!isNaN(year) && !isNaN(rate) && (period === 1 || period === 2)) {
      rates.push({ year, period, rate });
    }
  }

  return rates;
}

/**
 * Dönem bilgisini hesapla (TCMB ile aynı mantık)
 */
export function getTisPeriodInfo() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // Son açıklanan ay (1 ay geriden gelir)
  let lastAnnouncedMonth = currentMonth - 1;
  let lastAnnouncedYear = currentYear;
  
  if (lastAnnouncedMonth === 0) {
    lastAnnouncedMonth = 12;
    lastAnnouncedYear = currentYear - 1;
  }

  // Hangi dönemdeyiz?
  const isFirstPeriod = currentMonth >= 1 && currentMonth <= 6; // Ocak-Haziran
  
  // Eski TİS: Mevcut maaşımızın hesaplandığı dönem (önceki dönem)
  let oldTisYear: number;
  let oldTisPeriod: 1 | 2;
  
  if (isFirstPeriod) {
    // Ocak-Haziran dönemindeyiz → Geçen yılın 2. dönem (Temmuz-Aralık) verisi
    oldTisYear = currentYear - 1;
    oldTisPeriod = 2;
  } else {
    // Temmuz-Aralık dönemindeyiz → Aynı yılın 1. dönem (Ocak-Haziran) verisi
    oldTisYear = currentYear;
    oldTisPeriod = 1;
  }

  // Yeni TİS: Şu anki dönemin TİS'i
  let newTisYear: number;
  let newTisPeriod: 1 | 2;
  
  if (isFirstPeriod) {
    // Şu an 1. dönemdeyiz → Yeni TİS: Aynı yılın 1. dönemi
    newTisYear = currentYear;
    newTisPeriod = 1;
  } else {
    // Şu an 2. dönemdeyiz → Yeni TİS: Aynı yılın 2. dönemi
    newTisYear = currentYear;
    newTisPeriod = 2;
  }

  return {
    currentMonth,
    currentYear,
    lastAnnouncedMonth,
    lastAnnouncedYear,
    isFirstPeriod,
    oldTis: { year: oldTisYear, period: oldTisPeriod },
    newTis: { year: newTisYear, period: newTisPeriod },
  };
}

/**
 * Belirli bir yıl ve dönem için TİS oranını bul
 */
export function findTisRate(rates: TisRate[], year: number, period: 1 | 2): number | null {
  const found = rates.find(r => r.year === year && r.period === period);
  return found ? found.rate : null;
}

/**
 * Mevcut dönem ve yeni dönem TİS oranlarını getir
 */
export function getCurrentTisRates(allRates: TisRate[]): {
  oldTis: number | null;
  newTis: number | null;
  oldTisLabel: string;
  newTisLabel: string;
} {
  const periodInfo = getTisPeriodInfo();
  
  const oldTis = findTisRate(allRates, periodInfo.oldTis.year, periodInfo.oldTis.period);
  const newTis = findTisRate(allRates, periodInfo.newTis.year, periodInfo.newTis.period);

  const oldTisLabel = `${periodInfo.oldTis.year}/${periodInfo.oldTis.period}`;
  const newTisLabel = `${periodInfo.newTis.year}/${periodInfo.newTis.period}`;

  return {
    oldTis,
    newTis,
    oldTisLabel,
    newTisLabel,
  };
}
