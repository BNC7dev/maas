/**
 * Yüzde değerlerini formatlar
 * @param value - Yüzde değeri
 * @returns Format edilmiş string (örn: "18,61%")
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(2)}%`;
}

/**
 * Çarpan değerlerini formatlar
 * @param value - Çarpan değeri
 * @returns Format edilmiş string (örn: "1,1861")
 */
export function formatFactor(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toFixed(4);
}

/**
 * Para birimi formatlar (Türk Lirası)
 * @param value - Para değeri
 * @returns Format edilmiş string (örn: "₺ 53.000,00")
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Sayıyı Türkçe formatta formatlar (para birimi olmadan)
 * @param value - Sayı değeri
 * @returns Format edilmiş string (örn: "53.000,00")
 */
export function formatCurrencyShort(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  
  return new Intl.NumberFormat('tr-TR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
