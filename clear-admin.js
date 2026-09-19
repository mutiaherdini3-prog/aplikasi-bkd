const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function clearAdmin() {
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
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'pegawai!A:Z' });
    const rows = res.data.values || [];
    const nipIdx = rows[0].findIndex(h => h.toLowerCase() === 'nip');
    let adminRowIdx = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][nipIdx] === 'admin') {
        adminRowIdx = i + 1;
        break;
      }
    }

    if (adminRowIdx !== -1) {
      // Clear all cells except NIP (col A) and Password (col B)
      // Assuming NIP is col A and Password is col B based on init-db.js
      const emptyRow = ["admin", "admin123", "", "", "", "", "", "", "", "0"];
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `pegawai!A${adminRowIdx}:J${adminRowIdx}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [emptyRow] }
      });
      console.log("Admin row cleared!");
    } else {
      console.log("Admin not found.");
    }
  } catch (err) {
    console.error("Error clearing admin:", err.message);
  }
}

clearAdmin();
