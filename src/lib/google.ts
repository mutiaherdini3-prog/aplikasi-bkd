import { google } from 'googleapis';

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

export const getGoogleDrive = () => google.drive({ version: 'v3', auth: getAuth() });

export const getGoogleSheets = () => google.sheets({ version: 'v4', auth: getAuth() });

export const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;
export const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID!;
