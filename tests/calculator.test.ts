import { describe, it, expect } from 'vitest';
import {
  parsePercentInput,
  computeCumulative,
  computeInflationDiff,
  computeTotalRaise,
  computeSalary,
} from '../lib/calculator';

describe('parsePercentInput', () => {
  it('virgüllü sayıyı parse eder', () => {
    expect(parsePercentInput('2,06')).toBe(2.06);
  });

  it('noktalı sayıyı parse eder', () => {
    expect(parsePercentInput('2.06')).toBe(2.06);
  });

  it('tam sayıyı parse eder', () => {
    expect(parsePercentInput('2')).toBe(2);
  });

  it('boş string için null döner', () => {
    expect(parsePercentInput('')).toBeNull();
    expect(parsePercentInput(null)).toBeNull();
    expect(parsePercentInput(undefined)).toBeNull();
    expect(parsePercentInput('   ')).toBeNull();
  });

  it('negatif sayı için null döner', () => {
    expect(parsePercentInput('-5')).toBeNull();
    expect(parsePercentInput('-2.06')).toBeNull();
  });

  it('999\'dan büyük değer için null döner', () => {
    expect(parsePercentInput('1000')).toBeNull();
    expect(parsePercentInput('1500')).toBeNull();
  });

  it('geçersiz input için null döner', () => {
    expect(parsePercentInput('abc')).toBeNull();
  });
});

describe('computeCumulative', () => {
  it('örnek veriler için doğru kümülatif hesaplar', () => {
    const months = [2.06, 2.04, 3.23, 2.55, 0.87, 0.89];
    const result = computeCumulative(months);
    
    expect(result).not.toBeNull();
    expect(result!.percentage).toBeCloseTo(12.20, 1);
    expect(result!.factor).toBeCloseTo(1.1220, 4);
  });

  it('tek ay için doğru hesaplar', () => {
    const result = computeCumulative([2.06]);
    expect(result).not.toBeNull();
    expect(result!.percentage).toBeCloseTo(2.06, 2);
    expect(result!.factor).toBeCloseTo(1.0206, 4);
  });

  it('null değerleri filtreler', () => {
    const months = [2.06, null, 3.23, null, 0.87, 0.89];
    const result = computeCumulative(months);
    
    expect(result).not.toBeNull();
    expect(result!.factor).toBeGreaterThan(1);
  });

  it('tüm değerler null ise null döner', () => {
    const months = [null, null, null];
    const result = computeCumulative(months);
    
    expect(result).toBeNull();
  });

  it('boş array için null döner', () => {
    const result = computeCumulative([]);
    expect(result).toBeNull();
  });
});

describe('computeInflationDiff', () => {
  it('örnek veriler için doğru fark hesaplar', () => {
    const cumFactor = 1.1220;
    const oldTis = 5;
    const result = computeInflationDiff(cumFactor, oldTis);
    
    expect(result).not.toBeNull();
    expect(result!.percentage).toBeCloseTo(6.85, 1);
    expect(result!.factor).toBeCloseTo(1.0686, 3);
  });

  it('oldTis 0 ise çarpan değişmez', () => {
    const cumFactor = 1.1220;
    const oldTis = 0;
    const result = computeInflationDiff(cumFactor, oldTis);
    
    expect(result).not.toBeNull();
    expect(result!.factor).toBeCloseTo(cumFactor, 4);
  });

  it('oldTis null ise null döner', () => {
    const result = computeInflationDiff(1.1220, null);
    expect(result).toBeNull();
  });
});

describe('computeTotalRaise', () => {
  it('örnek veriler için doğru toplam zam hesaplar', () => {
    const diffFactor = 1.0686;
    const newTis = 11;
    const result = computeTotalRaise(diffFactor, newTis);
    
    expect(result).not.toBeNull();
    expect(result!.percentage).toBeCloseTo(18.61, 1);
    expect(result!.factor).toBeCloseTo(1.1861, 4);
  });

  it('newTis 0 ise çarpan değişmez', () => {
    const diffFactor = 1.0686;
    const newTis = 0;
    const result = computeTotalRaise(diffFactor, newTis);
    
    expect(result).not.toBeNull();
    expect(result!.factor).toBeCloseTo(diffFactor, 4);
  });

  it('newTis null ise null döner', () => {
    const result = computeTotalRaise(1.0686, null);
    expect(result).toBeNull();
  });
});

describe('computeSalary', () => {
  it('örnek veriler için doğru maaş hesaplar', () => {
    const currentSalary = 53000;
    const totalFactor = 1.18613131; // Daha kesin değer
    const result = computeSalary(currentSalary, totalFactor);
    
    expect(result).not.toBeNull();
    expect(result!.newSalary).toBeCloseTo(62864.96, 0);
    expect(result!.increase).toBeCloseTo(9864.96, 0);
    expect(result!.currentSalary).toBe(53000);
  });

  it('maaş null ise null döner', () => {
    const result = computeSalary(null, 1.1861);
    expect(result).toBeNull();
  });

  it('maaş 0 veya negatif ise null döner', () => {
    expect(computeSalary(0, 1.1861)).toBeNull();
    expect(computeSalary(-1000, 1.1861)).toBeNull();
  });

  it('çarpan 1 ise maaş değişmez', () => {
    const currentSalary = 50000;
    const result = computeSalary(currentSalary, 1);
    
    expect(result).not.toBeNull();
    expect(result!.newSalary).toBe(currentSalary);
    expect(result!.increase).toBe(0);
  });
});

describe('Tam entegrasyon testi', () => {
  it('kullanıcının verdiği örnek verileri doğru hesaplar', () => {
    // Girdi
    const monthlyRates = ['2,06', '2,04', '3,23', '2,55', '0,87', '0,89'];
    const oldTisStr = '5';
    const newTisStr = '11';
    const currentSalary = 53000; // Doğrudan sayı olarak

    // Parse
    const parsedMonths = monthlyRates.map(parsePercentInput);
    const oldTis = parsePercentInput(oldTisStr);
    const newTis = parsePercentInput(newTisStr);

    // Hesaplamalar
    const cumResult = computeCumulative(parsedMonths);
    expect(cumResult).not.toBeNull();
    expect(cumResult!.percentage).toBeCloseTo(12.20, 1);

    const diffResult = computeInflationDiff(cumResult!.factor, oldTis);
    expect(diffResult).not.toBeNull();
    expect(diffResult!.percentage).toBeCloseTo(6.85, 1);

    const raiseResult = computeTotalRaise(diffResult!.factor, newTis);
    expect(raiseResult).not.toBeNull();
    expect(raiseResult!.factor).toBeCloseTo(1.1861, 4);
    expect(raiseResult!.percentage).toBeCloseTo(18.61, 1);

    const salaryResult = computeSalary(currentSalary, raiseResult!.factor);
    expect(salaryResult).not.toBeNull();
    expect(salaryResult!.newSalary).toBeCloseTo(62861.87, 0);
    expect(salaryResult!.increase).toBeCloseTo(9861.87, 0);
  });
});
