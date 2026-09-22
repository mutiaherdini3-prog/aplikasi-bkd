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

  try {
    const pRes = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'pegawai!A1:AZ1' });
    let headers = pRes.data.values[0] || [];
    let updated = false;

    if (!headers.includes('role')) {
      headers.push('role');
      updated = true;
    }
    if (!headers.includes('nip_atasan')) {
      headers.push('nip_atasan');
      updated = true;
    }

    if (updated) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'pegawai!A1:AZ1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] }
      });
      console.log('Berhasil menambahkan kolom "role" dan "nip_atasan" ke database!');
    } else {
      console.log('Kolom sudah ada, tidak ada yang diubah.');
    }
  } catch(e) {
    console.error('Error:', e.message);
  }
}
main();
