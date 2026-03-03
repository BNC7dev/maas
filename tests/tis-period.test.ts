import { describe, it, expect, vi } from 'vitest';
import { parseTisData, getTisPeriodInfo, findTisRate, getCurrentTisRates } from '../lib/tis';

describe('Toplu Sözleşme Data Parsing', () => {
  it('should parse Toplu Sözleşme data correctly from text', () => {
    const text = `# Comment
2024/1=15
2024/2=10
2025/1=6
2025/2=5`;

    const result = parseTisData(text);

    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ year: 2024, period: 1, rate: 15 });
    expect(result[1]).toEqual({ year: 2024, period: 2, rate: 10 });
    expect(result[2]).toEqual({ year: 2025, period: 1, rate: 6 });
    expect(result[3]).toEqual({ year: 2025, period: 2, rate: 5 });
  });

  it('should handle decimal rates', () => {
    const text = '2026/1=11.5\n2026/2=7.25';
    const result = parseTisData(text);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ year: 2026, period: 1, rate: 11.5 });
    expect(result[1]).toEqual({ year: 2026, period: 2, rate: 7.25 });
  });

  it('should ignore invalid lines', () => {
    const text = `2024/1=15
invalid line
2024/3=10
2024/2=10`;

    const result = parseTisData(text);

    expect(result).toHaveLength(2); // Only valid lines
    expect(result[0].year).toBe(2024);
    expect(result[1].year).toBe(2024);
  });

  it('should handle empty input', () => {
    const result = parseTisData('');
    expect(result).toHaveLength(0);
  });
});

describe('Toplu Sözleşme Period Logic - Son Açıklanan Aya Göre', () => {
  it('Şubat 2026 - Ocak verisi açıklandı → Temmuz zammı hesaplanıyor', () => {
    vi.setSystemTime(new Date('2026-02-03'));

    const info = getTisPeriodInfo();

    expect(info.isFirstPeriod).toBe(true); // Temmuz zammı
    expect(info.lastAnnouncedMonth).toBe(1); // Ocak
    expect(info.lastAnnouncedYear).toBe(2026);

    // Temmuz zammı için: Eski TİS = 2026/1, Yeni TİS = 2026/2
    expect(info.oldTis.year).toBe(2026);
    expect(info.oldTis.period).toBe(1);
    expect(info.newTis.year).toBe(2026);
    expect(info.newTis.period).toBe(2);

    vi.useRealTimers();
  });

  it('Ocak 2026 - Aralık verisi açıklandı → Ocak zammı hesaplanıyor', () => {
    vi.setSystemTime(new Date('2026-01-05'));

    const info = getTisPeriodInfo();

    expect(info.isFirstPeriod).toBe(false); // Ocak zammı
    expect(info.lastAnnouncedMonth).toBe(12); // Aralık
    expect(info.lastAnnouncedYear).toBe(2025);

    // Ocak zammı için: Eski TİS = 2025/2, Yeni TİS = 2026/1
    expect(info.oldTis.year).toBe(2025);
    expect(info.oldTis.period).toBe(2);
    expect(info.newTis.year).toBe(2026);
    expect(info.newTis.period).toBe(1);

    vi.useRealTimers();
  });

  it('Temmuz 2026 - Haziran verisi açıklandı → Temmuz zammı hesaplanıyor', () => {
    vi.setSystemTime(new Date('2026-07-15'));

    const info = getTisPeriodInfo();

    expect(info.isFirstPeriod).toBe(true); // Hala Temmuz zammı (Haziran 1-6 arasında)
    expect(info.lastAnnouncedMonth).toBe(6);

    // Temmuz zammı için: Eski TİS = 2026/1, Yeni TİS = 2026/2
    expect(info.oldTis.year).toBe(2026);
    expect(info.oldTis.period).toBe(1);
    expect(info.newTis.year).toBe(2026);
    expect(info.newTis.period).toBe(2);

    vi.useRealTimers();
  });

  it('Ağustos 2026 - Temmuz verisi açıklandı → Ocak 2027 zammı hesaplanıyor', () => {
    vi.setSystemTime(new Date('2026-08-15'));

    const info = getTisPeriodInfo();

    expect(info.isFirstPeriod).toBe(false); // Ocak zammı
    expect(info.lastAnnouncedMonth).toBe(7); // Temmuz

    // Ocak 2027 zammı için: Eski TİS = 2026/2, Yeni TİS = 2027/1
    expect(info.oldTis.year).toBe(2026);
    expect(info.oldTis.period).toBe(2);
    expect(info.newTis.year).toBe(2027);
    expect(info.newTis.period).toBe(1);

    vi.useRealTimers();
  });

  it('Aralık 2026 - Kasım verisi açıklandı → Ocak 2027 zammı hesaplanıyor', () => {
    vi.setSystemTime(new Date('2026-12-31'));

    const info = getTisPeriodInfo();

    expect(info.isFirstPeriod).toBe(false);
    expect(info.lastAnnouncedMonth).toBe(11); // Kasım

    // Ocak 2027 zammı için: Eski TİS = 2026/2, Yeni TİS = 2027/1
    expect(info.oldTis.year).toBe(2026);
    expect(info.oldTis.period).toBe(2);
    expect(info.newTis.year).toBe(2027);
    expect(info.newTis.period).toBe(1);

    vi.useRealTimers();
  });
});

describe('Toplu Sözleşme Rate Finding', () => {
  const sampleRates = [
    { year: 2024, period: 1 as const, rate: 15 },
    { year: 2024, period: 2 as const, rate: 10 },
    { year: 2025, period: 1 as const, rate: 6 },
    { year: 2025, period: 2 as const, rate: 5 },
  ];

  it('should find correct rate for given year and period', () => {
    expect(findTisRate(sampleRates, 2024, 1)).toBe(15);
    expect(findTisRate(sampleRates, 2024, 2)).toBe(10);
    expect(findTisRate(sampleRates, 2025, 1)).toBe(6);
    expect(findTisRate(sampleRates, 2025, 2)).toBe(5);
  });

  it('should return null for non-existent rate', () => {
    expect(findTisRate(sampleRates, 2026, 1)).toBe(null);
    expect(findTisRate(sampleRates, 2023, 2)).toBe(null);
  });
});

describe('Get Current Toplu Sözleşme Rates - Son Açıklanan Aya Göre', () => {
  const allRates = [
    { year: 2024, period: 1 as const, rate: 15 },
    { year: 2024, period: 2 as const, rate: 10 },
    { year: 2025, period: 1 as const, rate: 6 },
    { year: 2025, period: 2 as const, rate: 5 },
    { year: 2026, period: 1 as const, rate: 11 },
    { year: 2026, period: 2 as const, rate: 7 },
    { year: 2027, period: 1 as const, rate: 5 },
  ];

  it('Şubat 2026 - Ocak verisi açıklandı → 2026/1 → 2026/2', () => {
    vi.setSystemTime(new Date('2026-02-03'));

    const result = getCurrentTisRates(allRates);

    // Temmuz 2026 zammı için: Eski = 2026/1 (%11), Yeni = 2026/2 (%7)
    expect(result.oldTis).toBe(11);  // 2026/1
    expect(result.newTis).toBe(7);   // 2026/2
    expect(result.oldTisLabel).toBe('2026/1');
    expect(result.newTisLabel).toBe('2026/2');

    vi.useRealTimers();
  });

  it('Ocak 2026 - Aralık verisi açıklandı → 2025/2 → 2026/1', () => {
    vi.setSystemTime(new Date('2026-01-05'));

    const result = getCurrentTisRates(allRates);

    // Ocak 2026 zammı için: Eski = 2025/2 (%5), Yeni = 2026/1 (%11)
    expect(result.oldTis).toBe(5);   // 2025/2
    expect(result.newTis).toBe(11);  // 2026/1
    expect(result.oldTisLabel).toBe('2025/2');
    expect(result.newTisLabel).toBe('2026/1');

    vi.useRealTimers();
  });

  it('Ağustos 2026 - Temmuz verisi açıklandı → 2026/2 → 2027/1', () => {
    vi.setSystemTime(new Date('2026-08-15'));

    const result = getCurrentTisRates(allRates);

    // Ocak 2027 zammı için: Eski = 2026/2 (%7), Yeni = 2027/1 (%5)
    expect(result.oldTis).toBe(7);   // 2026/2
    expect(result.newTis).toBe(5);   // 2027/1
    expect(result.oldTisLabel).toBe('2026/2');
    expect(result.newTisLabel).toBe('2027/1');

    vi.useRealTimers();
  });

  it('should return null if rates not found', () => {
    vi.setSystemTime(new Date('2030-02-15'));

    const result = getCurrentTisRates(allRates);

    expect(result.oldTis).toBe(null);
    expect(result.newTis).toBe(null);

    vi.useRealTimers();
  });
});
