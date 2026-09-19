const fs = require('fs');
const path = require('path');

async function testUpload() {
  const formData = new FormData();
  
  // Buat file dumi
  const dummyText = 'Ini adalah file sertifikat percobaan.';
  const blob = new Blob([dummyText], { type: 'text/plain' });
  formData.append('file', blob, 'sertifikat-test.txt');

  try {
    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    console.log('Upload Result:', data);
  } catch(e) {
    console.error('Error:', e);
  }
}
testUpload();
