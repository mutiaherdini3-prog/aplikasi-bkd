import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

export const dynamic = 'force-dynamic';

export interface ProfilWebData {
  bupati_nama: string;
  bupati_jabatan: string;
  bupati_foto: string;
  wakil_nama: string;
  wakil_jabatan: string;
  wakil_foto: string;
  hero_judul: string;
  hero_subjudul: string;
}

const DEFAULT_PROFIL: ProfilWebData = {
  bupati_nama: 'MARKUS, S.H.',
  bupati_jabatan: 'BUPATI BANGKA BARAT',
  bupati_foto: '/img/bupati1.png',
  wakil_nama: 'H. YUS DERAHMAN',
  wakil_jabatan: 'WAKIL BUPATI BANGKA BARAT',
  wakil_foto: '/img/bupati2.png',
  hero_judul: 'Sistem Informasi Pengembangan Kompetensi',
  hero_subjudul: 'Wadah digital terpadu untuk pencatatan, pemantauan, dan evaluasi pemenuhan kewajiban Jam Pelajaran (JP) bagi seluruh ASN.',
};

const JSON_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'profil_web.json');

function getLocalData(): ProfilWebData {
  try {
    if (fs.existsSync(JSON_FILE_PATH)) {
      const content = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
      return { ...DEFAULT_PROFIL, ...JSON.parse(content) };
    }
  } catch (err) {
    console.error('Error reading local profil_web.json:', err);
  }
  return DEFAULT_PROFIL;
}

function saveLocalData(data: ProfilWebData) {
  try {
    const dir = path.dirname(JSON_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to local profil_web.json:', err);
  }
}

export async function GET() {
  try {
    let data = { ...DEFAULT_PROFIL };
    let hasSheetData = false;

    try {
      const sheets = getGoogleSheets();
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'profil_web!A:B',
      });
      const rows = res.data.values || [];

      if (rows.length > 1) {
        const parsed: Record<string, string> = {};
        for (let i = 1; i < rows.length; i++) {
          const key = rows[i][0]?.trim();
          const val = rows[i][1]?.trim();
          if (key) {
            parsed[key] = val || '';
          }
        }

        data = {
          bupati_nama: parsed.bupati_nama || DEFAULT_PROFIL.bupati_nama,
          bupati_jabatan: parsed.bupati_jabatan || DEFAULT_PROFIL.bupati_jabatan,
          bupati_foto: parsed.bupati_foto || DEFAULT_PROFIL.bupati_foto,
          wakil_nama: parsed.wakil_nama || DEFAULT_PROFIL.wakil_nama,
          wakil_jabatan: parsed.wakil_jabatan || DEFAULT_PROFIL.wakil_jabatan,
          wakil_foto: parsed.wakil_foto || DEFAULT_PROFIL.wakil_foto,
          hero_judul: parsed.hero_judul || DEFAULT_PROFIL.hero_judul,
          hero_subjudul: parsed.hero_subjudul || DEFAULT_PROFIL.hero_subjudul,
        };
        hasSheetData = true;
        saveLocalData(data);
      }
    } catch (sheetErr) {
      console.warn('Could not read from Google Sheets, using local cache:', sheetErr);
    }

    if (!hasSheetData) {
      data = getLocalData();
    }

    return NextResponse.json(
      { success: true, data },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: any) {
    console.error('GET profil-web error:', error);
    return NextResponse.json({ success: true, data: getLocalData() });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const updatedData: ProfilWebData = {
      bupati_nama: (body.bupati_nama ?? DEFAULT_PROFIL.bupati_nama).trim(),
      bupati_jabatan: (body.bupati_jabatan ?? DEFAULT_PROFIL.bupati_jabatan).trim(),
      bupati_foto: (body.bupati_foto ?? DEFAULT_PROFIL.bupati_foto).trim(),
      wakil_nama: (body.wakil_nama ?? DEFAULT_PROFIL.wakil_nama).trim(),
      wakil_jabatan: (body.wakil_jabatan ?? DEFAULT_PROFIL.wakil_jabatan).trim(),
      wakil_foto: (body.wakil_foto ?? DEFAULT_PROFIL.wakil_foto).trim(),
      hero_judul: (body.hero_judul ?? DEFAULT_PROFIL.hero_judul).trim(),
      hero_subjudul: (body.hero_subjudul ?? DEFAULT_PROFIL.hero_subjudul).trim(),
    };

    // 1. Simpan ke local cache JSON (abaikan jika serverless read-only)
    saveLocalData(updatedData);

    // 2. Simpan ke Google Sheets
    try {
      const sheets = getGoogleSheets();

      // Cek apakah sheet profil_web dan foto_chunks sudah ada
      const meta = await sheets.spreadsheets.get({ spreadsheetId: GOOGLE_SHEET_ID });
      const titles = meta.data.sheets?.map(s => s.properties?.title) || [];

      const sheetsToAdd = [];
      if (!titles.includes('profil_web')) sheetsToAdd.push('profil_web');
      if (!titles.includes('foto_chunks')) sheetsToAdd.push('foto_chunks');

      if (sheetsToAdd.length > 0) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: GOOGLE_SHEET_ID,
          requestBody: {
            requests: sheetsToAdd.map(title => ({ addSheet: { properties: { title } } }))
          }
        });
      }

      // 2a. Jika ada gambar Base64, pecah menjadi potongan-potongan (chunks) agar tidak terkena limit 50.000 karakter per sel
      if (updatedData.bupati_foto.startsWith('data:image/') || updatedData.wakil_foto.startsWith('data:image/')) {
        try {
          const chunkRes = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'foto_chunks!A:C',
          });
          let existingRows = chunkRes.data.values || [];
          const CHUNK_SIZE = 30000;

          if (updatedData.bupati_foto.startsWith('data:image/')) {
            existingRows = existingRows.filter(r => r[0] !== 'bupati');
            const strB = updatedData.bupati_foto;
            let idx = 0;
            for (let i = 0; i < strB.length; i += CHUNK_SIZE) {
              existingRows.push(['bupati', String(idx++), strB.substring(i, i + CHUNK_SIZE)]);
            }
            updatedData.bupati_foto = '/api/profil-web/image?target=bupati';
          }

          if (updatedData.wakil_foto.startsWith('data:image/')) {
            existingRows = existingRows.filter(r => r[0] !== 'wakil');
            const strW = updatedData.wakil_foto;
            let idx = 0;
            for (let i = 0; i < strW.length; i += CHUNK_SIZE) {
              existingRows.push(['wakil', String(idx++), strW.substring(i, i + CHUNK_SIZE)]);
            }
            updatedData.wakil_foto = '/api/profil-web/image?target=wakil';
          }

          await sheets.spreadsheets.values.clear({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'foto_chunks!A1:Z500',
          });
          if (existingRows.length > 0) {
            await sheets.spreadsheets.values.update({
              spreadsheetId: GOOGLE_SHEET_ID,
              range: `foto_chunks!A1:C${existingRows.length}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: existingRows },
            });
          }
        } catch (chunkErr) {
          console.error('Error handling foto_chunks:', chunkErr);
        }
      }

      const rowsToWrite = [
        ['key', 'value'],
        ['bupati_nama', updatedData.bupati_nama],
        ['bupati_jabatan', updatedData.bupati_jabatan],
        ['bupati_foto', updatedData.bupati_foto],
        ['wakil_nama', updatedData.wakil_nama],
        ['wakil_jabatan', updatedData.wakil_jabatan],
        ['wakil_foto', updatedData.wakil_foto],
        ['hero_judul', updatedData.hero_judul],
        ['hero_subjudul', updatedData.hero_subjudul],
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'profil_web!A1:B9',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rowsToWrite },
      });
    } catch (sheetErr) {
      console.error('Error saving profil_web to Google Sheets:', sheetErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Profil web berhasil diperbarui!',
      data: updatedData,
    });
  } catch (error: any) {
    console.error('POST profil-web error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
