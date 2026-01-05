// TCMB sayfasını fetch edip HTML yapısını incele
// Node.js 18+ built-in fetch kullanıyoruz

async function testTCMBFetch() {
  const url = 'https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Istatistikler/Enflasyon+Verileri/Tuketici+Fiyatlari';
  
  console.log('TCMB sayfası çekiliyor...\n');
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  const html = await response.text();
  
  console.log('HTML uzunluğu:', html.length);
  console.log('\n--- Tarih formatlarını arıyorum (XX-YYYY) ---');
  
  // Farklı pattern'ler dene
  const patterns = [
    /(\d{2})-(\d{4})[^|]*\|[^|]*\|[^|]*\|\s*([\d.,-]+)/g,
    /(\d{2})-(\d{4})[^\d]+([\d.,-]+)/g,
    /(\d{2})-(\d{4}).*?([\d]+[.,][\d]+)/g,
    /(\d{2})\.(\d{4})/g,
    /(\d{1,2})-(\d{4})/g,
  ];
  
  patterns.forEach((pattern, index) => {
    const matches = [...html.matchAll(pattern)];
    console.log(`\nPattern ${index + 1}: ${pattern}`);
    console.log(`Bulunan eşleşme sayısı: ${matches.length}`);
    if (matches.length > 0) {
      console.log('İlk 3 eşleşme:');
      matches.slice(0, 3).forEach(m => {
        console.log(`  - ${m[0]}`);
      });
    }
  });

  // HTML içinde tablo yapısını ara
  console.log('\n--- Tablo içeriği arıyorum ---');
  const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (tableMatch) {
    const tableContent = tableMatch[1];
    console.log('Tablo bulundu, uzunluk:', tableContent.length);
    
    // İlk birkaç satırı göster
    const rows = tableContent.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    if (rows) {
      console.log(`\nToplam satır sayısı: ${rows.length}`);
      console.log('\nİlk 3 satır:');
      rows.slice(0, 3).forEach((row, i) => {
        console.log(`\nSatır ${i + 1}:`);
        console.log(row.substring(0, 200) + '...');
      });
    }
  } else {
    console.log('Tablo elementi bulunamadı');
    
    // Enflasyon kelimesini ara
    const inflationMatches = html.match(/enflasyon|inflation|tüketici|tuketici/gi);
    if (inflationMatches) {
      console.log(`\n"Enflasyon" kelimesi ${inflationMatches.length} kez geçiyor`);
    }
  }
}

testTCMBFetch().catch(console.error);
