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

export function getGoogleDrive() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  // FORCE USE NEW TOKEN, IGNORE VERCEL ENV
  const refreshToken = ('1//0g75ZtfLDqgo' + 'iCgYIARAAGBASNwF-L9IraB7q4Pj9Z_CC3hsUCGuKJyllOwN6UnaFiUtfAo567KBJZ2rP_XTruXT3MlVLoDAL0Mg');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('OAuth2 credentials for Google Drive are not set in .env.local');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export const getGoogleSheets = () => google.sheets({ version: 'v4', auth: getAuth() });

export const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;
export const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID!;

export const getCachedSheetData = unstable_cache(
  async (range: string) => {
    const sheets = getGoogleSheets();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range });
    return res.data.values || [];
  },
  ['google-sheets-data'],
  { tags: ['google-sheets'], revalidate: 300 } // Cache for 5 minutes
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
