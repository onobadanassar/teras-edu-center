// ===== اختبار المزامنة مباشرة =====
(async function testSync() {
  try {
    const testData = {
      test: 'Hello from console!',
      time: new Date().toISOString()
    };
    
    const url = 'https://api.github.com/repos/onobadanassar/teras-edu-center/contents/test.json';
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'token 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',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: 'اختبار المزامنة',
        content: btoa(unescape(encodeURIComponent(JSON.stringify(testData, null, 2))))
      })
    });
    
    if (response.ok) {
      console.log('✅ نجح الاختبار! شوف ملف test.json في مستودعك');
    } else {
      const error = await response.json();
      console.error('❌ فشل الاختبار:', error);
    }
  } catch(e) {
    console.error('❌ خطأ:', e);
  }
})();
