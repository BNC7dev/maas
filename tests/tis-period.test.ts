import { describe, it, expect, vi } from 'vitest';
import { parseTisData, getTisPeriodInfo, findTisRate, getCurrentTisRates } from '../lib/tis';

describe('TİS Data Parsing', () => {
  it('should parse TİS data correctly from text', () => {
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

describe('TİS Period Logic', () => {
  it('should correctly determine period for January (first period)', () => {
    vi.setSystemTime(new Date('2026-01-15'));
    
    const info = getTisPeriodInfo();
    
    expect(info.isFirstPeriod).toBe(true);
    expect(info.currentMonth).toBe(1);
    expect(info.currentYear).toBe(2026);
    
    // Ocak ayındayız → Geçen yılın 2. dönemi (2025/2)
    expect(info.oldTis.year).toBe(2025);
    expect(info.oldTis.period).toBe(2);
    
    // Yeni dönem: Şu anki dönem 2026/1
    expect(info.newTis.year).toBe(2026);
    expect(info.newTis.period).toBe(1);
    
    vi.useRealTimers();
  });

  it('should correctly determine period for June (first period)', () => {
    vi.setSystemTime(new Date('2026-06-15'));
    
    const info = getTisPeriodInfo();
    
    expect(info.isFirstPeriod).toBe(true);
    expect(info.oldTis.year).toBe(2025);
    expect(info.oldTis.period).toBe(2);
    expect(info.newTis.year).toBe(2026);
    expect(info.newTis.period).toBe(1);
    
    vi.useRealTimers();
  });

  it('should correctly determine period for July (second period)', () => {
    vi.setSystemTime(new Date('2026-07-15'));
    
    const info = getTisPeriodInfo();
    
    expect(info.isFirstPeriod).toBe(false);
    expect(info.currentMonth).toBe(7);
    
    // Temmuz ayındayız → Aynı yılın 1. dönemi (2026/1)
    expect(info.oldTis.year).toBe(2026);
    expect(info.oldTis.period).toBe(1);
    
    // Yeni dönem: Şu anki dönem 2026/2
    expect(info.newTis.year).toBe(2026);
    expect(info.newTis.period).toBe(2);
    
    vi.useRealTimers();
  });

  it('should correctly determine period for December (second period)', () => {
    vi.setSystemTime(new Date('2026-12-31'));
    
    const info = getTisPeriodInfo();
    
    expect(info.isFirstPeriod).toBe(false);
    expect(info.oldTis.year).toBe(2026);
    expect(info.oldTis.period).toBe(1);
    expect(info.newTis.year).toBe(2026);
    expect(info.newTis.period).toBe(2);
    
    vi.useRealTimers();
  });
});

describe('TİS Rate Finding', () => {
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

describe('Get Current TİS Rates', () => {
  const allRates = [
    { year: 2024, period: 1 as const, rate: 15 },
    { year: 2024, period: 2 as const, rate: 10 },
    { year: 2025, period: 1 as const, rate: 6 },
    { year: 2025, period: 2 as const, rate: 5 },
    { year: 2026, period: 1 as const, rate: 11 },
    { year: 2026, period: 2 as const, rate: 7 },
    { year: 2027, period: 1 as const, rate: 5 },
  ];

  it('should return correct rates for January 2026 (first period)', () => {
    vi.setSystemTime(new Date('2026-01-15'));
    
    const result = getCurrentTisRates(allRates);
    
    // Ocak 2026 → Eski TİS: 2025/2, Yeni TİS: 2026/1
    expect(result.oldTis).toBe(5);  // 2025/2
    expect(result.newTis).toBe(11); // 2026/1
    expect(result.oldTisLabel).toBe('2025/2');
    expect(result.newTisLabel).toBe('2026/1');
    
    vi.useRealTimers();
  });

  it('should return correct rates for July 2026 (second period)', () => {
    vi.setSystemTime(new Date('2026-07-15'));
    
    const result = getCurrentTisRates(allRates);
    
    // Temmuz 2026 → Eski TİS: 2026/1, Yeni TİS: 2026/2
    expect(result.oldTis).toBe(11); // 2026/1
    expect(result.newTis).toBe(7);  // 2026/2
    expect(result.oldTisLabel).toBe('2026/1');
    expect(result.newTisLabel).toBe('2026/2');
    
    vi.useRealTimers();
  });

  it('should return null if rates not found', () => {
    vi.setSystemTime(new Date('2030-01-15'));
    
    const result = getCurrentTisRates(allRates);
    
    expect(result.oldTis).toBe(null);
    expect(result.newTis).toBe(null);
    
    vi.useRealTimers();
  });
});
