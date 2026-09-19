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
    const sRes = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'sertifikasi!A:Z', valueRenderOption: 'FORMULA' });
    console.log("SERTIFIKASI ROWS:");
    console.log(sRes.data.values);

    const pRes = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'pendidikan!A:Z', valueRenderOption: 'FORMULA' });
    console.log("PENDIDIKAN ROWS:");
    console.log(pRes.data.values);
  } catch(e) {
    console.error(e);
  }
}
main();
