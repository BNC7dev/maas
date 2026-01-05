import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCurrentPeriodInfo, getMonthNames } from '@/lib/tcmb';

describe('TCMB Dönem Mantığı - 2 Dönem Sistemi', () => {
  beforeEach(() => {
    // Mock zamanı sıfırla
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Ocak 2026 - 1. Dönem (Ocak-Haziran)', () => {
    it('Son 6 ay: Temmuz-Aralık 2025 verilerini göstermeli', () => {
      // 5 Ocak 2026
      vi.setSystemTime(new Date(2026, 0, 5));

      const info = getCurrentPeriodInfo();

      expect(info.currentMonth).toBe(1); // Ocak
      expect(info.currentYear).toBe(2026);
      expect(info.lastAnnouncedMonth).toBe(12); // Aralık verisi açıklandı
      expect(info.lastAnnouncedYear).toBe(2025);
      expect(info.isFirstPeriod).toBe(true);
      expect(info.periodMonths).toEqual([7, 8, 9, 10, 11, 12]); // Temmuz-Aralık
      expect(info.dataYear).toBe(2025); // Geçen yıl
      expect(info.availableMonths).toEqual([7, 8, 9, 10, 11, 12]); // Tüm aylar mevcut
      expect(info.unavailableMonths).toEqual([]);
    });

    it('Ay isimlerini doğru göstermeli - OCAK/TEMMUZ formatı', () => {
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

  describe('Şubat 2026 - 1. Dönem (Ocak-Haziran)', () => {
    it('Hala Temmuz-Aralık 2025 verilerini göstermeli', () => {
      // 15 Şubat 2026
      vi.setSystemTime(new Date(2026, 1, 15));

      const info = getCurrentPeriodInfo();

      expect(info.currentMonth).toBe(2); // Şubat
      expect(info.lastAnnouncedMonth).toBe(1); // Ocak verisi yeni açıklandı
      expect(info.lastAnnouncedYear).toBe(2026);
      expect(info.isFirstPeriod).toBe(true);
      expect(info.periodMonths).toEqual([7, 8, 9, 10, 11, 12]); // Hala Temmuz-Aralık 2025
      expect(info.dataYear).toBe(2025);
      expect(info.availableMonths).toEqual([7, 8, 9, 10, 11, 12]); // Tüm aylar mevcut
    });
  });

  describe('Temmuz 2026 - 2. Dönem (Temmuz-Aralık)', () => {
    it('Son 6 ay: Ocak-Haziran 2026 - Henüz hiçbir veri yok', () => {
      // 5 Temmuz 2026
      vi.setSystemTime(new Date(2026, 6, 5));

      const info = getCurrentPeriodInfo();

      expect(info.currentMonth).toBe(7); // Temmuz
      expect(info.lastAnnouncedMonth).toBe(6); // Haziran verisi açıklandı
      expect(info.isSecondPeriod).toBe(true);
      expect(info.periodMonths).toEqual([1, 2, 3, 4, 5, 6]); // Ocak-Haziran 2026
      expect(info.dataYear).toBe(2026); // Aynı yıl
      expect(info.availableMonths).toEqual([1, 2, 3, 4, 5, 6]); // Tüm aylar açıklandı
      expect(info.unavailableMonths).toEqual([]);
    });

    it('Ay isimlerini doğru göstermeli - TEMMUZ/OCAK formatı', () => {
      vi.setSystemTime(new Date(2026, 6, 5));

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

  describe('Ağustos 2026 - 2. Dönem (Temmuz-Aralık)', () => {
    it('Ocak-Haziran 2026 tüm aylar mevcut', () => {
      // 15 Ağustos 2026
      vi.setSystemTime(new Date(2026, 7, 15));

      const info = getCurrentPeriodInfo();

      expect(info.currentMonth).toBe(8); // Ağustos
      expect(info.lastAnnouncedMonth).toBe(7); // Temmuz verisi açıklandı
      expect(info.isSecondPeriod).toBe(true);
      expect(info.periodMonths).toEqual([1, 2, 3, 4, 5, 6]);
      expect(info.dataYear).toBe(2026);
      expect(info.availableMonths).toEqual([1, 2, 3, 4, 5, 6]); // Tüm aylar mevcut
      expect(info.unavailableMonths).toEqual([]);
    });
  });

  describe('Eylül 2026 - 2. Dönem Ortası Senaryo', () => {
    it('Örnek: Eylül ayında ikinci döneme geçmişiz, sadece 2 aylık veri var', () => {
      // 15 Eylül 2026 - Kullanıcının örneği
      vi.setSystemTime(new Date(2026, 8, 15));

      const info = getCurrentPeriodInfo();

      expect(info.currentMonth).toBe(9); // Eylül
      expect(info.lastAnnouncedMonth).toBe(8); // Ağustos verisi açıklandı
      expect(info.isSecondPeriod).toBe(true);
      expect(info.periodMonths).toEqual([1, 2, 3, 4, 5, 6]); // Hala Ocak-Haziran 2026
      expect(info.dataYear).toBe(2026);
      // Tüm Ocak-Haziran verileri zaten açıklanmış (Ağustos > Haziran)
      expect(info.availableMonths).toEqual([1, 2, 3, 4, 5, 6]);
      expect(info.unavailableMonths).toEqual([]);
    });
  });
});
