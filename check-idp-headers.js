const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function main() {
  const envText = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  let sheetId, email, privateKey;
  envText.split('\n').forEach(line => {
    if (line.startsWith('GOOGLE_SHEET_ID=')) sheetId = line.split('=')[1].replace(/\"/g, '').trim();
    if (line.startsWith('GOOGLE_CLIENT_EMAIL=')) email = line.split('=')[1].replace(/\"/g, '').trim();
    if (line.startsWith('GOOGLE_PRIVATE_KEY=')) privateKey = line.substring(line.indexOf('=') + 1).replace(/\"/g, '').replace(/\\n/g, '\n').trim();
  });

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const pRes = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'idp!A1:Z1' });
  console.log('IDP HEADERS', pRes.data.values[0]);
}
main();
