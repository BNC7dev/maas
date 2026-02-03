'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import InputField from '@/components/InputField';
import ShareButton from '@/components/ShareButton';
import {
  parsePercentInput,
  computeCumulative,
  computeInflationDiff,
  computeTotalRaise,
  computeSalary,
} from '@/lib/calculator';
import { formatPercent, formatFactor, formatCurrency } from '@/lib/formatters';
import { getMonthNames } from '@/lib/tcmb';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [monthNames, setMonthNames] = useState<string[]>([]);
  const [months, setMonths] = useState<string[]>(['', '', '', '', '', '']);
  const [oldTis, setOldTis] = useState('');
  const [newTis, setNewTis] = useState('');
  const [currentSalary, setCurrentSalary] = useState('');

  const [cumulativePercent, setCumulativePercent] = useState<number | null>(null);
  const [inflationDiffPercent, setInflationDiffPercent] = useState<number | null>(null);
  const [totalFactor, setTotalFactor] = useState<number | null>(null);
  const [totalPercent, setTotalPercent] = useState<number | null>(null);
  const [newSalaryAmount, setNewSalaryAmount] = useState<number | null>(null);
  const [increaseAmount, setIncreaseAmount] = useState<number | null>(null);

  // TCMB veri çekme state'leri
  const [isLoadingInflation, setIsLoadingInflation] = useState(false);
  const [inflationError, setInflationError] = useState<string | null>(null);
  const [inflationSuccess, setInflationSuccess] = useState<string | null>(null);

  // Toplu Sözleşme veri çekme state'leri
  const [isLoadingTis, setIsLoadingTis] = useState(false);
  const [tisError, setTisError] = useState<string | null>(null);
  const [tisSuccess, setTisSuccess] = useState<string | null>(null);

  // Maaş parse fonksiyonu (Türk formatını destekler: 50.000,00)
  const parseSalaryInput = (input: string): number | null => {
    if (!input || input.trim() === '') return null;
    // Türk formatı: nokta binlik ayraç, virgül ondalık ayraç
    // Önce noktaları kaldır (binlik ayraç), sonra virgülü noktaya çevir
    const normalized = input.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    if (isNaN(parsed) || parsed < 0) return null;
    return parsed;
  };

  // Maaş formatla fonksiyonu (Türk Lirası formatı: 50.000,00)
  const formatSalaryInput = (value: string): string => {
    // Sadece rakam ve virgül/nokta karakterlerini al
    let cleaned = value.replace(/[^\d,]/g, '');

    // Eğer boşsa boş döndür
    if (!cleaned) return '';

    // Virgül varsa, ondalık kısım olarak ayır
    let integerPart = cleaned;
    let decimalPart = '';

    const commaIndex = cleaned.indexOf(',');
    if (commaIndex !== -1) {
      integerPart = cleaned.substring(0, commaIndex);
      decimalPart = cleaned.substring(commaIndex + 1, commaIndex + 3); // Max 2 ondalık
    }

    // Başındaki sıfırları kaldır (tek sıfır hariç)
    integerPart = integerPart.replace(/^0+/, '') || '0';

    // Binlik ayraç ekle (noktalarla)
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Virgül varsa ondalık kısmı ekle
    if (commaIndex !== -1) {
      return formattedInteger + ',' + decimalPart;
    }

    return formattedInteger;
  };

  // Input değişiklik handler'ı
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatSalaryInput(rawValue);
    setCurrentSalary(formatted);
  };

  // Component mount kontrolü
  useEffect(() => {
    setMounted(true);
    setMonthNames(getMonthNames());
  }, []);

  useEffect(() => {
    const parsedMonths = months.map(parsePercentInput);
    const cumResult = computeCumulative(parsedMonths);

    if (cumResult) {
      setCumulativePercent(cumResult.percentage);

      const parsedOldTis = parsePercentInput(oldTis);
      const diffResult = computeInflationDiff(cumResult.factor, parsedOldTis);

      if (diffResult) {
        setInflationDiffPercent(diffResult.percentage);

        const parsedNewTis = parsePercentInput(newTis);
        const raiseResult = computeTotalRaise(diffResult.factor, parsedNewTis);

        if (raiseResult) {
          setTotalFactor(raiseResult.factor);
          setTotalPercent(raiseResult.percentage);

          const parsedSalary = parseSalaryInput(currentSalary);
          const salaryResult = computeSalary(parsedSalary, raiseResult.factor);

          if (salaryResult) {
            setNewSalaryAmount(salaryResult.newSalary);
            setIncreaseAmount(salaryResult.increase);
          } else {
            setNewSalaryAmount(null);
            setIncreaseAmount(null);
          }
        } else {
          setTotalFactor(null);
          setTotalPercent(null);
          setNewSalaryAmount(null);
          setIncreaseAmount(null);
        }
      } else {
        setInflationDiffPercent(null);
        setTotalFactor(null);
        setTotalPercent(null);
        setNewSalaryAmount(null);
        setIncreaseAmount(null);
      }
    } else {
      setCumulativePercent(null);
      setInflationDiffPercent(null);
      setTotalFactor(null);
      setTotalPercent(null);
      setNewSalaryAmount(null);
      setIncreaseAmount(null);
    }
  }, [months, oldTis, newTis, currentSalary]);

  const handleMonthChange = (index: number, value: string) => {
    const newMonths = [...months];
    newMonths[index] = value;
    setMonths(newMonths);
  };

  // TCMB'den enflasyon verilerini çek
  const fetchInflationData = async () => {
    setIsLoadingInflation(true);
    setInflationError(null);
    setInflationSuccess(null);

    try {
      const response = await fetch('/api/fetch-inflation');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Veri çekilemedi');
      }

      if (data.success && data.data) {
        // Verileri input alanlarına doldur
        setMonths(data.data);
        setInflationSuccess(data.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setInflationError(errorMessage);
    } finally {
      setIsLoadingInflation(false);
    }
  };

  // Toplu Sözleşme oranlarını çek
  const fetchTisData = async () => {
    setIsLoadingTis(true);
    setTisError(null);
    setTisSuccess(null);

    try {
      const response = await fetch('/api/fetch-tis');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Toplu Sözleşme verileri çekilemedi');
      }

      if (data.success && data.data) {
        // Toplu Sözleşme verilerini input alanlarına doldur
        setOldTis(data.data.oldTis);
        setNewTis(data.data.newTis);
        setTisSuccess(`${data.message} (${data.data.oldTisLabel} → ${data.data.newTisLabel})`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setTisError(errorMessage);
    } finally {
      setIsLoadingTis(false);
    }
  };

  // Hydration hatasını önlemek için client-side render bekle
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-4 md:py-8 px-3 md:px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Modern Header - Glassmorphism */}
        <header className="mb-6 md:mb-12">
          {/* Gradient border wrapper */}
          <div className="p-[2px] rounded-xl md:rounded-2xl bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 shadow-lg">
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-100 via-gray-100 to-slate-200 rounded-[10px] md:rounded-[14px] p-4 md:p-6">
              {/* Mor/Mavi gradient accent */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent" />

              <div className="relative flex items-center gap-3 md:gap-4">
                {/* Icon container - glassmorphism */}
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg border border-slate-600/30 flex-shrink-0">
                  <svg className="w-6 h-6 md:w-7 md:h-7 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 6h-3V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM9 4h6v2H9V4zm11 15H4V8h16v11z" />
                  </svg>
                </div>

                {/* Title */}
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight">
                  Memur Maaş Zammı Hesaplama
                </h1>
              </div>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
          {/* Sol Kolon - Enflasyon ve Toplu Sözleşme */}
          <div className="space-y-4 md:space-y-6">
            {/* Aylık Enflasyon Kartı */}
            <Card title="Aylık enflasyon verileri" icon={<span className="text-xl">📈</span>}>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  TÜİK tarafından açıklanan aylık oranları giriniz.
                </p>
              </div>

              {/* Başarı mesajı */}
              {inflationSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm text-green-800">{inflationSuccess}</span>
                </div>
              )}

              {/* Hata mesajı */}
              {inflationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <span className="text-red-600">⚠</span>
                  <span className="text-sm text-red-800">{inflationError}</span>
                </div>
              )}
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  {months.map((month, index) => (
                    <InputField
                      key={index}
                      id={`month-${index}`}
                      label={monthNames[index]}
                      value={month}
                      onChange={(value) => handleMonthChange(index, value)}
                      placeholder="örn: 2,50"
                      suffix="%"
                    />
                  ))}
                </div>
              </div>

              {/* TCMB Butonu - Aşağıya taşındı */}
              <button
                onClick={fetchInflationData}
                disabled={isLoadingInflation}
                className="w-full px-4 py-3 bg-success hover:bg-success/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
                title="TCMB'den güncel enflasyon verilerini getir (1 dakikada bir)"
              >
                {isLoadingInflation ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Yüklüyor...
                  </>
                ) : (
                  <>
                    <span>🏦</span>
                    TCMB'den Getir
                  </>
                )}
              </button>

              {cumulativePercent !== null && (
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Toplam kümülatif enflasyon
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPercent(cumulativePercent)}
                  </span>
                </div>
              )}
            </Card>

            {/* Toplu Sözleşme Oranları Kartı */}
            <Card title="Toplu sözleşme oranları" icon={<span className="text-xl">💎</span>}>
              {/* Başarı mesajı */}
              {tisSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm text-green-800">{tisSuccess}</span>
                </div>
              )}

              {/* Hata mesajı */}
              {tisError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <span className="text-red-600">⚠</span>
                  <span className="text-sm text-red-800">{tisError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <InputField
                    id="old-tis"
                    label="Önceki dönem sözleşme"
                    value={oldTis}
                    onChange={setOldTis}
                    placeholder="örn: 5,00"
                    suffix="%"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Mevcut maaşınızın hesaplandığı dönemdeki Toplu Sözleşme oranı.
                  </p>
                </div>
                <div>
                  <InputField
                    id="new-tis"
                    label="Yeni dönem sözleşme"
                    value={newTis}
                    onChange={setNewTis}
                    placeholder="örn: 11,00"
                    suffix="%"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Yeni maaş dönemine uygulanacak Toplu Sözleşme oranı.
                  </p>
                </div>

                {/* Toplu Sözleşme Butonu */}
                <button
                  onClick={fetchTisData}
                  disabled={isLoadingTis}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  title="Toplu Sözleşme oranlarını otomatik doldur"
                >
                  {isLoadingTis ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Yüklüyor...
                    </>
                  ) : (
                    <>
                      <span>💎</span>
                      Toplu Sözleşme Oranlarını Getir
                    </>
                  )}
                </button>
              </div>
            </Card>
          </div>

          {/* Sağ Kolon - Maaş, Hesaplama ve Özet */}
          <div className="space-y-4 md:space-y-6">
            {/* Mevcut Maaş Kartı */}
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 text-white border-0 overflow-hidden">
              <div className="space-y-2 overflow-hidden">
                <label htmlFor="current-salary" className="block text-sm text-gray-300">
                  Mevcut net maaşınız
                </label>
                <div className="relative w-full overflow-hidden">
                  <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-xl md:text-2xl text-gray-400 z-10">
                    ₺
                  </span>
                  <input
                    id="current-salary"
                    type="text"
                    inputMode="decimal"
                    maxLength={18}
                    value={currentSalary}
                    onChange={handleSalaryChange}
                    placeholder="örn: 50.000,00"
                    className="w-full max-w-full min-w-0 pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-2xl md:text-3xl font-bold text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 box-border"
                    aria-label="Mevcut net maaşınız"
                  />
                </div>
              </div>
            </Card>

            {/* Hesaplama Sonuçları Kartı */}
            <Card title="Hesaplama sonuçları" icon={<span className="text-xl">📊</span>}>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Enflasyon farkı</div>
                  <div className="text-xl font-bold text-gray-800">
                    {formatPercent(inflationDiffPercent)}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Artış çarpanı</div>
                  <div className="text-xl font-bold text-gray-800">
                    {formatFactor(totalFactor)}
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-primary/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-success font-semibold mb-1">Oluşan Zam Oranı</div>
                    <div className="text-sm text-gray-500">Kümülatif yüzde</div>
                  </div>
                  <div className="text-3xl font-bold text-success">
                    {formatPercent(totalPercent)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Maaş Detayı Kartı */}
            <Card title="Özet tablo" icon={<span className="text-xl">📋</span>}>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Eski maaş</span>
                  <span className="font-semibold text-gray-800">
                    {currentSalary ? formatCurrency(parseSalaryInput(currentSalary)) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <span className="text-success">▲</span>
                    Artış miktarı
                  </span>
                  <span className="font-semibold text-success">
                    + {formatCurrency(increaseAmount)}
                  </span>
                </div>
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-3 md:p-4 mt-4 overflow-hidden">
                  <div className="text-sm md:text-base text-gray-500 mb-2 font-medium">Yeni zammlı maaş</div>
                  <div className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold break-all ${newSalaryAmount !== null ? 'text-success animate-pulse' : 'text-gray-900'}`}>
                    {newSalaryAmount !== null ? formatCurrency(newSalaryAmount) : '—'}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <footer className="mt-8 md:mt-12 text-center text-sm text-gray-500 space-y-2">
          <p>
            © 2025 dev by{' '}
            <a
              href="https://bnc7.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-red-600 hover:text-red-700 transition-colors"
            >
              BNC7
            </a>
          </p>
          <p className="text-xs text-gray-400">
            Bu araç bilgilendirme amaçlıdır. Resmi hesaplamalar için yetkili kurumlarınıza başvurunuz.
          </p>
        </footer>
      </div>
    </main>
  );
}
