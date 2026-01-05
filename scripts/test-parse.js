// Parse fonksiyonunu test et

async function testParse() {
  const url = 'https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Istatistikler/Enflasyon+Verileri/Tuketici+Fiyatlari';
  
  console.log('TCMB sayfası çekiliyor...\n');
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  const html = await response.text();
  
  // Parse fonksiyonunu kopyala - GÜNCEL
  function parseTCMBData(html) {
    const data = [];
    
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;

    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const rowContent = rowMatch[1];
      
      const dateMatch = rowContent.match(/(\d{1,2})-(\d{4})/);
      if (!dateMatch) continue;
      
      const month = parseInt(dateMatch[1]);
      const year = parseInt(dateMatch[2]);
      
      // Aynı satırda tüm <td> hücrelerini bul ve içeriğini çıkar
      const cellRegex = /<td[^>]*>([^<]+)<\/td>/g;
      const cells = [];
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
  
  const allData = parseTCMBData(html);
  console.log(`Toplam ${allData.length} veri bulundu\n`);
  
  // İlk 10 veriyi göster
  console.log('İlk 10 veri:');
  allData.slice(0, 10).forEach(d => {
    console.log(`  ${d.month}/${d.year}: %${d.rate}`);
  });
  
  // 2025 Temmuz-Aralık verilerini bul
  console.log('\n2025 Temmuz-Aralık verileri:');
  const period = allData.filter(d => d.year === 2025 && d.month >= 7 && d.month <= 12);
  period.forEach(d => {
    console.log(`  ${d.month}/${d.year}: %${d.rate}`);
  });
}

testParse().catch(console.error);
