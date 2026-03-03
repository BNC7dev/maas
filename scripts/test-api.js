// API test
async function testAPI() {
  console.log('API test ediliyor...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/fetch-inflation');
    console.log('Status:', response.status);
    console.log('Headers:', [...response.headers.entries()]);
    
    const text = await response.text();
    console.log('\nResponse text uzunluğu:', text.length);
    console.log('İlk 500 karakter:', text.substring(0, 500));
    
    try {
      const data = JSON.parse(text);
      console.log('\nJSON parse başarılı!');
      console.log('Data:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('\nJSON parse hatası:', e.message);
    }
  } catch (error) {
    console.error('Hata:', error);
  }
}

testAPI();
