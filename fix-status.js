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
  
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'idp!A:Z' });
  const rows = res.data.values || [];
  
  for(let i=1; i<rows.length; i++) {
    const statusCol = 9; // J is index 9
    if(rows[i][statusCol] === 'Menunggu Persetujuan') {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `idp!J${i+1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['Menunggu Persetujuan Ketua']] }
      });
      console.log('Fixed row ' + (i+1));
    }
  }
}
main().catch(console.error);
