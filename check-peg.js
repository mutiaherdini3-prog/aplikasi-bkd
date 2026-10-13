const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function main() {
  const envText = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  let sheetId, email, privateKey;
  envText.split('\n').forEach(line => {
    if (line.startsWith('GOOGLE_SHEET_ID=')) sheetId = line.split('=')[1].replace(/"/g, '').trim();
    if (line.startsWith('GOOGLE_CLIENT_EMAIL=')) email = line.split('=')[1].replace(/"/g, '').trim();
    if (line.startsWith('GOOGLE_PRIVATE_KEY=')) privateKey = line.substring(line.indexOf('=') + 1).replace(/"/g, '').replace(/\\n/g, '\n').trim();
  });

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Fetch pegawai sheet
  const pRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'pegawai!A:ZZ'
  });

  const rows = pRes.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data in pegawai sheet');
    return;
  }

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const nipIdx = headers.indexOf('nip');
  const namaIdx = headers.indexOf('nama');
  const unitKerjaIdx = headers.indexOf('unit kerja');
  const roleIdx = headers.indexOf('role') !== -1 ? headers.indexOf('role') : headers.indexOf('hak akses');

  console.log('=== HEADERS ===');
  console.log(headers.map((h, i) => `[${i}] ${h}`).join('\n'));
  console.log(`\nnipIdx=${nipIdx}, namaIdx=${namaIdx}, unitKerjaIdx=${unitKerjaIdx}, roleIdx=${roleIdx}`);

  // Search for Media Nusantara and Yuli Prihantini
  const searchNames = ['media', 'yuli', 'prihantini', 'nusantara'];
  
  console.log('\n=== SEARCHING FOR SPECIFIC EMPLOYEES ===');
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const nama = (row[namaIdx] || '').toString().toLowerCase();
    if (searchNames.some(s => nama.includes(s))) {
      console.log(`\nRow ${i + 1}:`);
      console.log(`  NIP: "${row[nipIdx] || ''}"`);
      console.log(`  Nama: "${row[namaIdx] || ''}"`);
      console.log(`  Unit Kerja: "${row[unitKerjaIdx] || ''}" (col ${unitKerjaIdx})`);
      console.log(`  Role: "${roleIdx !== -1 ? (row[roleIdx] || '') : 'N/A'}"`);
      console.log(`  Raw row length: ${row.length}`);
      // Print all columns with values
      console.log(`  All columns:`);
      row.forEach((val, idx) => {
        if (val && val.toString().trim() !== '') {
          console.log(`    [${idx}] ${headers[idx] || 'col_'+idx}: "${val}"`);
        }
      });
    }
  }

  // Also find the admin who logs into BKPSDMD - find any row with bkpsdmd or similar
  console.log('\n=== ALL UNIQUE UNIT_KERJA VALUES ===');
  const uniqueUK = new Set();
  for (let i = 1; i < rows.length; i++) {
    const uk = (rows[i][unitKerjaIdx] || '').toString().trim();
    if (uk) uniqueUK.add(uk);
  }
  const sorted = [...uniqueUK].sort();
  sorted.forEach(uk => console.log(`  "${uk}"`));
  
  // Find BKPSDMD-related entries
  console.log('\n=== BKPSDMD RELATED EMPLOYEES ===');
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const uk = (row[unitKerjaIdx] || '').toString().toLowerCase();
    if (uk.includes('bkpsdm') || uk.includes('kepegawaian') || uk.includes('sumber daya manusia')) {
      console.log(`  Row ${i+1}: NIP="${row[nipIdx]}", Nama="${row[namaIdx]}", UK="${row[unitKerjaIdx]}", Role="${roleIdx !== -1 ? (row[roleIdx] || '') : ''}"`);
    }
  }
}

main().catch(console.error);
