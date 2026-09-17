import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nip = searchParams.get('nip');
    if (!nip) return NextResponse.json({ success: false }, { status: 400 });

    const sheets = getGoogleSheets();
    
    // Pegawai
    let pegawaiData = null;
    const pRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pegawai!A:Z' });
    const pRows = pRes.data.values || [];
    const pHeaders = pRows[0]?.map(h => h.toLowerCase()) || [];
    const pNipIdx = pHeaders.indexOf('nip');
    if (pNipIdx !== -1) {
      for (let i=1; i<pRows.length; i++) {
        if (pRows[i][pNipIdx]?.trim() === nip.trim()) {
          pegawaiData = {};
          pHeaders.forEach((h, idx) => pegawaiData[h] = pRows[i][idx] || '');
          break;
        }
      }
    }

    // Sertifikasi
    let sertifikasiData: any[] = [];
    try {
      const sRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'sertifikasi!A:Z' });
      const sRows = sRes.data.values || [];
      const sHeaders = sRows[0]?.map(h => h.toLowerCase()) || [];
      const sNipIdx = sHeaders.indexOf('nip');
      if (sNipIdx !== -1) {
        for (let i=1; i<sRows.length; i++) {
          if (sRows[i][sNipIdx]?.trim() === nip.trim()) {
            const row: any = { _rowIndex: i + 1 };
            sHeaders.forEach((h, idx) => row[h] = sRows[i][idx] || '');
            if (row.jumlah_jp) row.jumlah_jp = Number(row.jumlah_jp);
            sertifikasiData.push(row);
          }
        }
      }
    } catch(e) {}

    // Pendidikan
    let pendidikanData: any[] = [];
    try {
      const eRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pendidikan!A:Z' });
      const eRows = eRes.data.values || [];
      const eHeaders = eRows[0]?.map(h => h.toLowerCase()) || [];
      const eNipIdx = eHeaders.indexOf('nip');
      if (eNipIdx !== -1) {
        for (let i=1; i<eRows.length; i++) {
          if (eRows[i][eNipIdx]?.trim() === nip.trim()) {
            const row: any = { _rowIndex: i + 1 };
            eHeaders.forEach((h, idx) => row[h] = eRows[i][idx] || '');
            pendidikanData.push(row);
          }
        }
      }
    } catch(e) {}

    return NextResponse.json({ success: true, data: { pegawai: pegawaiData, sertifikasi: sertifikasiData, pendidikan: pendidikanData }});
  } catch (e: any) { return NextResponse.json({ success: false }, { status: 500 }); }
}
