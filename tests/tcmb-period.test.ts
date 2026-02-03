import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCurrentPeriodInfo, getMonthNames } from '@/lib/tcmb';

describe('TCMB Dönem Mantığı - Son Açıklanan Aya Göre', () => {
  beforeEach(() => {
    // Mock zamanı sıfırla
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Şubat 2026 - Ocak 2026 verisi açıklandı → Temmuz zammını hesapla', () => {
    it('Ocak-Haziran 2026 verilerini göstermeli', () => {
      // 3 Şubat 2026 - Son açıklanan ay: Ocak 2026
      vi.setSystemTime(new Date(2026, 1, 3));

      const info = getCurrentPeriodInfo();

      expect(info.currentMonth).toBe(2); // Şubat
      expect(info.currentYear).toBe(2026);
      expect(info.lastAnnouncedMonth).toBe(1); // Ocak verisi açıklandı
      expect(info.lastAnnouncedYear).toBe(2026);
      expect(info.isFirstPeriod).toBe(true); // Temmuz zammı hesaplanıyor
      expect(info.periodMonths).toEqual([1, 2, 3, 4, 5, 6]); // Ocak-Haziran
      expect(info.dataYear).toBe(2026);
      expect(info.availableMonths).toEqual([1]); // Sadece Ocak mevcut
      expect(info.unavailableMonths).toEqual([2, 3, 4, 5, 6]);
    });

    it('Ay isimlerini TEMMUZ/OCAK formatında göstermeli', () => {
      vi.setSystemTime(new Date(2026, 1, 3));

      const monthNames = getMonthNames();

      expect(monthNames).toEqual([
        'TEMMUZ/OCAK',
        'AĞUSTOS/ŞUBAT',
        'EYLÜL/MART',
        'EKİM/NİSAN',
        'KASIM/MAYIS',
        'ARALIK/HAZİRAN',
      ]);
    });
  });

  describe('Ocak 2026 - Aralık 2025 verisi açıklandı → Ocak zammını hesapla', () => {
    it('Temmuz-Aralık 2025 verilerini göstermeli', () => {
      // 5 Ocak 2026 - Son açıklanan ay: Aralık 2025
      vi.setSystemTime(new Date(2026, 0, 5));

      const info = getCurrentPeriodInfo();

      expect(info.currentMonth).toBe(1); // Ocak
      expect(info.currentYear).toBe(2026);
      expect(info.lastAnnouncedMonth).toBe(12); // Aralık verisi açıklandı
      expect(info.lastAnnouncedYear).toBe(2025);
      expect(info.isFirstPeriod).toBe(false); // Ocak zammı hesaplanıyor (isSecondPeriod)
      expect(info.isSecondPeriod).toBe(true);
      expect(info.periodMonths).toEqual([7, 8, 9, 10, 11, 12]); // Temmuz-Aralık
      expect(info.dataYear).toBe(2025);
      expect(info.availableMonths).toEqual([7, 8, 9, 10, 11, 12]); // Tüm aylar mevcut
      expect(info.unavailableMonths).toEqual([]);
    });

    it('Ay isimlerini OCAK/TEMMUZ formatında göstermeli', () => {
      vi.setSystemTime(new Date(2026, 0, 5));

      const monthNames = getMonthNames();

      expect(monthNames).toEqual([
        'OCAK/TEMMUZ',
        'ŞUBAT/AĞUSTOS',
        'MART/EYLÜL',
        'NİSAN/EKİM',
        'MAYIS/KASIM',
        'HAZİRAN/ARALIK',
      ]);
    });
  });

  describe('Temmuz 2026 - Haziran 2026 verisi açıklandı → Temmuz zammını hesapla', () => {
    it('Hala Ocak-Haziran 2026 verilerini göstermeli (tüm veriler mevcut)', () => {
      // 5 Temmuz 2026 - Son açıklanan ay: Haziran 2026
      vi.setSystemTime(new Date(2026, 6, 5));

      const info = getCurrentPeriodInfo();

      expect(info.currentMonth).toBe(7); // Temmuz
      expect(info.lastAnnouncedMonth).toBe(6); // Haziran verisi açıklandı
      expect(info.lastAnnouncedYear).toBe(2026);
      expect(info.isFirstPeriod).toBe(true); // Hala Temmuz zammı (Haziran 1-6 arasında)
      expect(info.periodMonths).toEqual([1, 2, 3, 4, 5, 6]); // Ocak-Haziran 2026
      expect(info.dataYear).toBe(2026);
      expect(info.availableMonths).toEqual([1, 2, 3, 4, 5, 6]); // Tüm aylar mevcut
    });
  });

  describe('Ağustos 2026 - Temmuz 2026 verisi açıklandı → Ocak 2027 zammını hesapla', () => {
    it('Temmuz-Aralık 2026 verilerini göstermeli', () => {
      // 5 Ağustos 2026 - Son açıklanan ay: Temmuz 2026
      vi.setSystemTime(new Date(2026, 7, 5));

      const info = getCurrentPeriodInfo();

      expect(info.currentMonth).toBe(8); // Ağustos
      expect(info.lastAnnouncedMonth).toBe(7); // Temmuz verisi açıklandı
      expect(info.lastAnnouncedYear).toBe(2026);
      expect(info.isSecondPeriod).toBe(true); // Ocak zammı hesaplanıyor
      expect(info.periodMonths).toEqual([7, 8, 9, 10, 11, 12]); // Temmuz-Aralık
      expect(info.dataYear).toBe(2026);
      expect(info.availableMonths).toEqual([7]); // Sadece Temmuz mevcut
      expect(info.unavailableMonths).toEqual([8, 9, 10, 11, 12]);
    });
  });

  describe('Aralık 2026 - Kasım 2026 verisi açıklandı → Ocak 2027 zammını hesapla', () => {
    it('Temmuz-Aralık 2026 verilerini göstermeli (5 ay mevcut)', () => {
      // 15 Aralık 2026 - Son açıklanan ay: Kasım 2026
      vi.setSystemTime(new Date(2026, 11, 15));

      const info = getCurrentPeriodInfo();

      expect(info.currentMonth).toBe(12); // Aralık
      expect(info.lastAnnouncedMonth).toBe(11); // Kasım verisi açıklandı
      expect(info.isSecondPeriod).toBe(true);
      expect(info.periodMonths).toEqual([7, 8, 9, 10, 11, 12]);
      expect(info.dataYear).toBe(2026);
      expect(info.availableMonths).toEqual([7, 8, 9, 10, 11]); // Temmuz-Kasım mevcut
      expect(info.unavailableMonths).toEqual([12]); // Aralık henüz açıklanmadı
    });
  });

  describe('Yıl Geçişi: Ocak 2027', () => {
    it('Aralık 2026 verisi açıklandığında Ocak 2027 zammı hesaplanmalı', () => {
      // 5 Ocak 2027 - Son açıklanan ay: Aralık 2026
      vi.setSystemTime(new Date(2027, 0, 5));

      const info = getCurrentPeriodInfo();

      expect(info.currentMonth).toBe(1);
      expect(info.currentYear).toBe(2027);
      expect(info.lastAnnouncedMonth).toBe(12);
      expect(info.lastAnnouncedYear).toBe(2026);
      expect(info.isSecondPeriod).toBe(true); // Ocak zammı
      expect(info.periodMonths).toEqual([7, 8, 9, 10, 11, 12]);
      expect(info.dataYear).toBe(2026);
      expect(info.availableMonths).toEqual([7, 8, 9, 10, 11, 12]);
    });
  });
});
