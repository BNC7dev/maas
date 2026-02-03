/**
 * Toplu İş Sözleşmesi Zam Oranları Yönetimi
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
 * Toplu Sözleşme txt dosyasını parse et
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

  // Hangi zammı hesaplıyoruz? (Son açıklanan aya göre belirlenir - TCMB ile aynı mantık)
  // Son açıklanan ay Ocak-Haziran (1-6) arasındaysa → Temmuz zammını hesapla
  // Son açıklanan ay Temmuz-Aralık (7-12) arasındaysa → Ocak zammını hesapla
  const isCalculatingJulyRaise = lastAnnouncedMonth >= 1 && lastAnnouncedMonth <= 6;
  const isFirstPeriod = isCalculatingJulyRaise; // Uyumluluk için

  // Toplu Sözleşme: Eski ve Yeni dönem oranlarını belirle
  let oldTisYear: number;
  let oldTisPeriod: 1 | 2;
  let newTisYear: number;
  let newTisPeriod: 1 | 2;

  if (isCalculatingJulyRaise) {
    // Temmuz zammını hesaplıyoruz
    // Eski TİS: Aynı yılın 1. dönemi (Ocak-Haziran için verilen zam)
    // Yeni TİS: Aynı yılın 2. dönemi (Temmuz-Aralık için uygulanacak zam)
    oldTisYear = lastAnnouncedYear;
    oldTisPeriod = 1;
    newTisYear = lastAnnouncedYear;
    newTisPeriod = 2;
  } else {
    // Ocak zammını hesaplıyoruz
    // Eski TİS: Son açıklanan yılın 2. dönemi (Temmuz-Aralık için verilen zam)
    // Yeni TİS: Sonraki yılın 1. dönemi (Ocak-Haziran için uygulanacak zam)
    oldTisYear = lastAnnouncedYear;
    oldTisPeriod = 2;
    newTisYear = lastAnnouncedYear + 1;
    newTisPeriod = 1;
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
 * Belirli bir yıl ve dönem için Toplu Sözleşme oranını bul
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
