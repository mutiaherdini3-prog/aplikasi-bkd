import { NextResponse } from 'next/server';
import { getCachedSheetData } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reqNip = searchParams.get('nip');

    // Fetch Pegawai
    const pRows = await getCachedSheetData('pegawai!A:Z');
    if (pRows.length === 0) return NextResponse.json({ success: true, data: [] });

    const headers = pRows[0].map((h: string) => h.trim().toLowerCase());
    const nipIdx = headers.indexOf('nip');
    const namaIdx = headers.indexOf('nama');
    const statusIdx = headers.indexOf('status pegawai');
    const pangkatIdx = headers.indexOf('pangkat');
    const jabatanIdx = headers.indexOf('jabatan');
    const unitKerjaIdx = headers.indexOf('unit kerja');
    const roleIdx = headers.indexOf('role');

    // Determine admin's role and unit_kerja
    let adminRole = 'super_admin';
    let adminUnitKerja = '';
    if (reqNip && reqNip !== 'admin') {
      const adminRow = pRows.find((row: any) => row[nipIdx]?.toString().trim() === reqNip.trim());
      if (adminRow) {
        adminRole = roleIdx !== -1 ? (adminRow[roleIdx] || 'pegawai') : 'pegawai';
        adminUnitKerja = adminRow[unitKerjaIdx] || '';
      }
    }

    // Fetch Sertifikasi
    let allSertifikasi: any[] = [];
    try {
      const sRows = await getCachedSheetData('sertifikasi!A:Z');
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

    // Fetch IDP
    let allIdp: any[] = [];
    try {
      const iRows = await getCachedSheetData('idp!A:Z');
      if (iRows.length > 0) {
        const iHeaders = iRows[0].map((h: string) => h.toLowerCase());
        for (let i = 1; i < iRows.length; i++) {
          const row: any = { _rowIndex: i + 1 };
          iHeaders.forEach((h: string, idx: number) => {
            row[h] = iRows[i][idx] || '';
          });
          allIdp.push(row);
        }
      }
    } catch(e) {}

    const result = [];
    for (let i = 1; i < pRows.length; i++) {
      const row = pRows[i];
      if (!row[nipIdx] || row[nipIdx] === 'admin') continue;

      const currentUnitKerja = row[unitKerjaIdx] || '';
      
      // Filter for admin_diklat
      if (adminRole === 'admin_diklat') {
        if (currentUnitKerja !== adminUnitKerja) continue;
      }

      const currentNip = row[nipIdx]?.toString().trim() || '';

      const pData: any = {
        nip: currentNip,
        nama: row[namaIdx] || '',
        status_pegawai: row[statusIdx] || '',
        pangkat: row[pangkatIdx] || '',
        jabatan: row[jabatanIdx] || '',
        unit_kerja: row[unitKerjaIdx] || '',
        sertifikasi: allSertifikasi.filter(s => s.nip?.toString().trim() === currentNip),
        idp: allIdp.filter(idp => idp.nip?.toString().trim() === currentNip)
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
