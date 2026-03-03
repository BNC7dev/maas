/**
 * TCMB Enflasyon Veri Çekme ve Dönem Hesaplama Mantığı
 */

export interface InflationData {
  month: number; // 1-12
  year: number;
  rate: number; // Aylık % değişim
}

/**
 * Hangi dönemdeyiz ve hangi ayların verisi mevcut?
 * 1. Dönem (Ocak-Haziran): Son 6 ay = Temmuz-Aralık (geçen yıl)
 * 2. Dönem (Temmuz-Aralık): Son 6 ay = Ocak-Haziran (aynı yıl)
 * Not: Enflasyon verileri 1 ay gecikmeli açıklanır
 */
export function getCurrentPeriodInfo() {
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

  // Hangi zammı hesaplıyoruz? (Son açıklanan aya göre belirlenir)
  // Son açıklanan ay Ocak-Haziran (1-6) arasındaysa → Temmuz zammını hesapla (Ocak-Haziran verileri)
  // Son açıklanan ay Temmuz-Aralık (7-12) arasındaysa → Ocak zammını hesapla (Temmuz-Aralık verileri)
  const isCalculatingJulyRaise = lastAnnouncedMonth >= 1 && lastAnnouncedMonth <= 6;
  const isCalculatingJanuaryRaise = lastAnnouncedMonth >= 7 && lastAnnouncedMonth <= 12;

  // Eski isimleri koruyoruz uyumluluk için
  const isFirstPeriod = isCalculatingJulyRaise; // Temmuz zammı için Ocak-Haziran verileri
  const isSecondPeriod = isCalculatingJanuaryRaise; // Ocak zammı için Temmuz-Aralık verileri

  // Dönem aylarını belirle
  let periodMonths: number[];
  let periodStartMonth: number;
  let dataYear: number;

  if (isCalculatingJulyRaise) {
    // Temmuz zammını hesaplıyoruz → Ocak-Haziran verileri (son açıklanan ayın yılı)
    periodMonths = [1, 2, 3, 4, 5, 6];
    periodStartMonth = 1;
    dataYear = lastAnnouncedYear;
  } else {
    // Ocak zammını hesaplıyoruz → Temmuz-Aralık verileri (son açıklanan ayın yılı)
    periodMonths = [7, 8, 9, 10, 11, 12];
    periodStartMonth = 7;
    dataYear = lastAnnouncedYear;
  }

  // Hangi ayların verisi açıklandı?
  const availableMonths: number[] = [];
  const unavailableMonths: number[] = [];

  for (const month of periodMonths) {
    // Veri yılı ve ayına göre kontrol et
    if (dataYear < lastAnnouncedYear ||
      (dataYear === lastAnnouncedYear && month <= lastAnnouncedMonth)) {
      availableMonths.push(month);
    } else {
      unavailableMonths.push(month);
    }
  }

  return {
    currentMonth,
    currentYear,
    lastAnnouncedMonth,
    lastAnnouncedYear,
    isFirstPeriod,
    isSecondPeriod,
    periodMonths,
    periodStartMonth,
    availableMonths,
    unavailableMonths,
    dataYear,
  };
}

/**
 * TCMB web sayfasından enflasyon verilerini parse et
 */
export function parseTCMBData(html: string): InflationData[] {
  const data: InflationData[] = [];

  // TCMB'nin HTML formatı:
  // <td>MM-YYYY</td>
  // <td>YY.YY</td>  (Yıllık)
  // <td>A.AA</td>   (Aylık - bunu alıyoruz)

  // Önce tüm <tr> satırlarını bul
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowContent = rowMatch[1];

    // Tarih formatını bul: MM-YYYY
    const dateMatch = rowContent.match(/(\d{1,2})-(\d{4})/);
    if (!dateMatch) continue;

    const month = parseInt(dateMatch[1]);
    const year = parseInt(dateMatch[2]);

    // Aynı satırda tüm <td> hücrelerini bul ve içeriğini çıkar
    const cellRegex = /<td[^>]*>([^<]+)<\/td>/g;
    const cells: string[] = [];
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      cells.push(cellMatch[1].trim());
    }

    if (cells.length < 3) continue;

    // 3. hücre aylık değişimi içerir (index 2)
    const monthlyRate = cells[2];
    const rateStr = monthlyRate.replace(',', '.');
    const rate = parseFloat(rateStr);

    if (!isNaN(month) && !isNaN(year) && !isNaN(rate) && month >= 1 && month <= 12) {
      data.push({ month, year, rate });
    }
  }

  return data;
}

/**
 * Dönem için gerekli 6 aylık enflasyon verilerini getir
 */
export function getPeriodInflationData(allData: InflationData[]): string[] {
  const periodInfo = getCurrentPeriodInfo();
  const result: string[] = ['', '', '', '', '', ''];

  // Verileri doldur
  periodInfo.periodMonths.forEach((month, index) => {
    const monthData = allData.find(
      d => d.month === month && d.year === periodInfo.dataYear
    );

    if (monthData) {
      result[index] = monthData.rate.toString().replace('.', ',');
    } else if (periodInfo.unavailableMonths.includes(month)) {
      // Henüz açıklanmamış → 0 yaz (nötr, hesaplamayı etkilemez)
      result[index] = '0';
    }
  });

  return result;
}

/**
 * Ay isimlerini döndür (sabit format - hesaplanan zamma göre)
 * Temmuz zammı hesaplanıyor (Ocak-Haziran verileri): TEMMUZ/OCAK, AĞUSTOS/ŞUBAT, ... (hedef ay / veri ayı)
 * Ocak zammı hesaplanıyor (Temmuz-Aralık verileri): OCAK/TEMMUZ, ŞUBAT/AĞUSTOS, ... (hedef ay / veri ayı)
 */
export function getMonthNames(): string[] {
  const periodInfo = getCurrentPeriodInfo();

  // isFirstPeriod = Temmuz zammı hesaplanıyor (Ocak-Haziran verileri)
  if (periodInfo.isFirstPeriod) {
    // Temmuz zammı için Ocak-Haziran verileri kullanılıyor
    return [
      'TEMMUZ/OCAK',
      'AĞUSTOS/ŞUBAT',
      'EYLÜL/MART',
      'EKİM/NİSAN',
      'KASIM/MAYIS',
      'ARALIK/HAZİRAN',
    ];
  } else {
    // Ocak zammı için Temmuz-Aralık verileri kullanılıyor
    return [
      'OCAK/TEMMUZ',
      'ŞUBAT/AĞUSTOS',
      'MART/EYLÜL',
      'NİSAN/EKİM',
      'MAYIS/KASIM',
      'HAZİRAN/ARALIK',
    ];
  }
}

