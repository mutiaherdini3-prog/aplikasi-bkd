import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

export async function GET() {
  try {
    const sheets = getGoogleSheets();
    
    // Fetch Pegawai
    const pRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pegawai!A:Z' });
    const pRows = pRes.data.values || [];
    if (pRows.length === 0) return NextResponse.json({ success: true, data: [] });

    // Fetch Sertifikasi
    let allSertifikasi: any[] = [];
    try {
      const sRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'sertifikasi!A:Z' });
      const sRows = sRes.data.values || [];
      if (sRows.length > 0) {
        const sHeaders = sRows[0].map((h: string) => h.toLowerCase());
        for (let i = 1; i < sRows.length; i++) {
          const row: any = {};
          sHeaders.forEach((h: string, idx: number) => {
            row[h] = sRows[i][idx] || '';
          });
          if (row.jumlah_jp) row.jumlah_jp = Number(row.jumlah_jp);
          allSertifikasi.push(row);
        }
      }
    } catch(e) {}

    const headers = pRows[0].map((h: string) => h.trim().toLowerCase());
    const nipIdx = headers.indexOf('nip');
    const namaIdx = headers.indexOf('nama');
    const statusIdx = headers.indexOf('status pegawai');
    const pangkatIdx = headers.indexOf('pangkat');
    const jabatanIdx = headers.indexOf('jabatan');
    const unitKerjaIdx = headers.indexOf('unit kerja');

    const result = [];
    for (let i = 1; i < pRows.length; i++) {
      const row = pRows[i];
      if (!row[nipIdx] || row[nipIdx] === 'admin') continue;

      const currentNip = row[nipIdx]?.toString().trim() || '';

      const pData: any = {
        nip: currentNip,
        nama: row[namaIdx] || '',
        status_pegawai: row[statusIdx] || '',
        pangkat: row[pangkatIdx] || '',
        jabatan: row[jabatanIdx] || '',
        unit_kerja: row[unitKerjaIdx] || '',
        sertifikasi: allSertifikasi.filter(s => s.nip?.toString().trim() === currentNip)
      };

      // Hitung JP dinamis dari sertifikasi aktual
      pData.jp = pData.sertifikasi.reduce((sum: number, s: any) => sum + (Number(s.jumlah_jp) || 0), 0);

      result.push(pData);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
