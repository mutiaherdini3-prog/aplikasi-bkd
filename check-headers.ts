import { getGoogleSheets } from './src/lib/google.ts';
import fs from 'fs';

async function main() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  let sheetId = '';
  for (const line of envFile.split('\n')) {
    if (line.startsWith('GOOGLE_SHEET_ID=')) {
      sheetId = line.split('=')[1].trim();
    }
  }
  
  process.env.GOOGLE_SHEET_ID = sheetId;

  const sheets = getGoogleSheets();
  const pRes = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'pegawai!A1:Z1' });
  console.log('HEADERS:', pRes.data.values[0]);
}

main().catch(console.error);
