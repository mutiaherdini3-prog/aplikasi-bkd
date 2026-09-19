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
    const sRes = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'sertifikasi!A:Z' });
    const sRows = sRes.data.values || [];
    if (sRows.length > 0) {
      const headers = sRows[0].map(h => h.toLowerCase());
      const linkIdx = headers.indexOf('link_sertifikat');
      if (linkIdx !== -1) {
        for (let i = 1; i < sRows.length; i++) {
          let link = sRows[i][linkIdx];
          if (link && !link.includes('/view?url=')) {
            // Jika link adalah relative /uploads
            if (link.startsWith('/uploads')) {
              link = `http://localhost:3000${link}`;
            }
            if (link.startsWith('http')) {
               const newLink = `http://localhost:3000/view?url=${encodeURIComponent(link)}`;
               // Update cell in google sheets
               const cellRange = `sertifikasi!${String.fromCharCode(65 + linkIdx)}${i + 1}`;
               await sheets.spreadsheets.values.update({
                 spreadsheetId: sheetId,
                 range: cellRange,
                 valueInputOption: 'USER_ENTERED',
                 requestBody: {
                   values: [[newLink]]
                 }
               });
               console.log(`Updated cell ${cellRange} to ${newLink}`);
            }
          }
        }
      }
    }
  } catch(e) {
    console.error(e);
  }
}
main();
