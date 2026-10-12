import { google } from 'googleapis';
import { unstable_cache } from 'next/cache';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

const getAuth = () => {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });
};

export const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;
export const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID!;
export const getGoogleSheets = () => google.sheets({ version: 'v4', auth: getAuth() });

let inMemoryDriveToken: string | undefined = undefined;

export async function getGoogleDrive() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  let refreshToken = inMemoryDriveToken;

  // Selalu prioritaskan token aktif dari database Google Sheets
  if (!refreshToken) {
    try {
      const sheets = getGoogleSheets();
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'profil_web!A:B',
      });
      const rows = res.data.values || [];
      const tokenRow = rows.find((r: any) => r[0]?.trim() === 'google_refresh_token');
      if (tokenRow && tokenRow[1]) {
        refreshToken = tokenRow[1].trim();
        inMemoryDriveToken = refreshToken;
      }
    } catch (sheetErr) {
      console.warn('Gagal membaca token cadangan dari sheet:', sheetErr);
    }
  }

  // Jika di database belum ada, baru gunakan env
  if (!refreshToken) {
    refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  }

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('OAuth2 credentials for Google Drive are not set');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function getFreshSheetData(range: string) {
  const sheets = getGoogleSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range });
  return res.data.values || [];
}

export const getCachedSheetData = unstable_cache(
  async (range: string) => {
    const sheets = getGoogleSheets();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range });
    return res.data.values || [];
  },
  ['google-sheets-data'],
  { tags: ['google-sheets'], revalidate: 10 } // Cache maks 10 detik agar update spreadsheet cepat terlihat
);

export const getColumnName = (n: number) => {
  let ordA = 'A'.charCodeAt(0);
  let ordZ = 'Z'.charCodeAt(0);
  let len = ordZ - ordA + 1;
  let s = "";
  while (n >= 0) {
    s = String.fromCharCode(n % len + ordA) + s;
    n = Math.floor(n / len) - 1;
  }
  return s;
};
