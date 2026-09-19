const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Mengambil input argument
const CLIENT_ID = process.argv[2];
const CLIENT_SECRET = process.argv[3];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.log('Cara Penggunaan: node setup-drive-auth.js <CLIENT_ID> <CLIENT_SECRET>');
  process.exit(1);
}

const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent' // Memaksa agar selalu mendapatkan refresh token
});

console.log('====================================================');
console.log('Kunjungi URL di bawah ini di browser Anda:');
console.log('----------------------------------------------------');
console.log(authUrl);
console.log('----------------------------------------------------');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Masukkan kode otorisasi dari halaman tersebut: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n====================================================');
    console.log('BERHASIL! Simpan kode Refresh Token ini baik-baik:');
    console.log('----------------------------------------------------');
    console.log('GOOGLE_REFRESH_TOKEN="' + tokens.refresh_token + '"');
    console.log('----------------------------------------------------');
    
    // Auto-update .env.local
    const envPath = path.join(__dirname, '.env.local');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    envContent += `\n# OAUTH2 CREDENTIALS FOR DRIVE\n`;
    envContent += `GOOGLE_CLIENT_ID="${CLIENT_ID}"\n`;
    envContent += `GOOGLE_CLIENT_SECRET="${CLIENT_SECRET}"\n`;
    envContent += `GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"\n`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ File .env.local berhasil diupdate otomatis!');
    
  } catch (error) {
    console.error('Error mendapatkan token:', error.message);
  }
  rl.close();
});
