/**
 * Yüzde input'larını parse eder (virgül, nokta, sayı formatları)
 * @param input - Kullanıcı girişi (örn: "2,06" veya "2.06" veya "2" veya "-1,5")
 * @returns Parse edilmiş sayı veya null
 */
export function parsePercentInput(input: string | null | undefined): number | null {
  if (!input || input.trim() === '') return null;

  // Virgülü noktaya çevir
  const normalized = input.replace(',', '.');
  const parsed = parseFloat(normalized);

  // Geçersiz veya çok büyük/küçük değerleri reddet (negatif enflasyon olabilir)
  if (isNaN(parsed)) return null;
  if (parsed < -100) return null; // %-100'den küçük olamaz
  if (parsed > 999) return null;

  return parsed;
}

export interface CumulativeResult {
  factor: number;
  percentage: number;
}

/**
 * Kümülatif enflasyon çarpanını hesaplar
 * cumFactor = Π (1 + month/100)
 * @param monthlyRates - Aylık enflasyon oranları array'i
 * @returns Kümülatif çarpan ve yüzde değeri veya null
 */
export function computeCumulative(monthlyRates: (number | null)[]): CumulativeResult | null {
  const validRates = monthlyRates.filter((r): r is number => r !== null);

  if (validRates.length === 0) {
    return null;
  }

  let factor = 1;
  for (const rate of validRates) {
    factor *= (1 + rate / 100);
  }

  const percentage = (factor - 1) * 100;

  return { factor, percentage };
}

export interface InflationDiffResult {
  factor: number;
  percentage: number;
}

/**
 * Hesaptan düşme (enflasyon farkı) hesaplar
 * diffFactor = cumFactor / (1 + oldTis/100)
 * @param cumulativeFactor - Kümülatif enflasyon çarpanı
 * @param oldTisRate - Önceki toplu sözleşme oranı
 * @returns Fark çarpanı ve yüzdesi veya null
 */
export function computeInflationDiff(
  cumulativeFactor: number,
  oldTisRate: number | null
): InflationDiffResult | null {
  if (oldTisRate === null) return null;

  const diffFactor = cumulativeFactor / (1 + oldTisRate / 100);
  const diffPercentage = (diffFactor - 1) * 100;

  return { factor: diffFactor, percentage: diffPercentage };
}

export interface TotalRaiseResult {
  factor: number;
  percentage: number;
}

/**
 * Toplam zam hesaplar (kümülatif birleşim)
 * totalFactor = diffFactor * (1 + newTis/100)
 * @param diffFactor - Enflasyon farkı çarpanı
 * @param newTisRate - Yeni toplu sözleşme oranı
 * @returns Toplam çarpan ve yüzde veya null
 */
export function computeTotalRaise(
  diffFactor: number,
  newTisRate: number | null
): TotalRaiseResult | null {
  if (newTisRate === null) return null;

  const totalFactor = diffFactor * (1 + newTisRate / 100);
  const totalPercentage = (totalFactor - 1) * 100;

  return { factor: totalFactor, percentage: totalPercentage };
}

export interface SalaryResult {
  currentSalary: number;
  newSalary: number;
  increase: number;
}

/**
 * Maaş hesaplamalarını yapar
 * @param currentSalary - Mevcut maaş
 * @param totalFactor - Toplam artış çarpanı
 * @returns Maaş detayları veya null
 */
export function computeSalary(
  currentSalary: number | null,
  totalFactor: number
): SalaryResult | null {
  if (currentSalary === null || currentSalary <= 0) return null;

  const newSalary = currentSalary * totalFactor;
  const increase = newSalary - currentSalary;

  return {
    currentSalary,
    newSalary,
    increase,
  };
}
