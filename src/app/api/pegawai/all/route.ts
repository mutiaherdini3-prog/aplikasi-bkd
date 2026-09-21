import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sheets = getGoogleSheets();
    
    // Fetch Pegawai
    const pRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pegawai!A:Z' });
    const pRows = pRes.data.values || [];
    if (pRows.length === 0) return NextResponse.json({ success: true, data: [] });

    const headers = pRows[0].map((h: string) => h.trim().toLowerCase());
    const nipIdx = headers.indexOf('nip');
    const namaIdx = headers.indexOf('nama');
    const jabatanIdx = headers.indexOf('jabatan');
    const statusAktifIdx = headers.indexOf('status aktif');

    if (nipIdx === -1 || namaIdx === -1) {
      return NextResponse.json({ success: false, message: 'Invalid sheet format' }, { status: 500 });
    }

    const result = [];
    for (let i = 1; i < pRows.length; i++) {
      const row = pRows[i];
      if (!row[nipIdx] || row[nipIdx] === 'admin') continue;
      
      const statusAktif = statusAktifIdx !== -1 ? (row[statusAktifIdx] || 'Aktif') : 'Aktif';
      
      // Bisa jadi ketua hanya yang masih aktif
      if (statusAktif === 'Tidak Aktif' || statusAktif === 'Mutasi') continue;

      result.push({
        nip: row[nipIdx]?.toString().trim() || '',
        nama: row[namaIdx] || '',
        jabatan: jabatanIdx !== -1 ? (row[jabatanIdx] || '') : ''
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
