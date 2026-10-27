import { NextResponse } from 'next/server';
import { batchGetCachedSheets } from '@/lib/google';
import { isUnitKerjaMatch, isPetinggiOrAdmin } from '@/lib/unit-kerja-match';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reqNip = searchParams.get('nip');

    // Fetch Pegawai, Sertifikasi, and IDP simultaneously
    const sheetData = await batchGetCachedSheets([
      'pegawai!A:ZZ',
      'sertifikasi!A:Z',
      'idp!A:Z'
    ]);

    const pRows = sheetData['pegawai!A:ZZ'] || [];
    if (pRows.length === 0) return NextResponse.json({ success: true, data: [] });

    const headers = pRows[0].map((h: string) => h.trim().toLowerCase());
    const nipIdx = headers.indexOf('nip');
    const namaIdx = headers.indexOf('nama');
    const statusIdx = headers.indexOf('status pegawai');
    const pangkatIdx = headers.indexOf('pangkat');
    const golonganIdx = headers.indexOf('golongan ');
    if (golonganIdx === -1) {
      headers.indexOf('golongan');
    }
    const realGolonganIdx = headers.indexOf('golongan ') !== -1 ? headers.indexOf('golongan ') : headers.indexOf('golongan');
    const jenkelIdx = [headers.indexOf('jankel'), headers.indexOf('jenis kelamin'), headers.indexOf('jenkel')].find(i => i !== -1) ?? -1;
    const statusAktifIdx = headers.indexOf('status aktif');
    const jabatanIdx = headers.indexOf('jabatan');
    const unitKerjaIdx = headers.indexOf('unit kerja');
    let roleIdx = headers.indexOf('role');
    if (roleIdx === -1) roleIdx = headers.indexOf('hak akses');

    // Wajib ada reqNip agar tidak terjadi tumpang tindih data saat refresh kilat
    if (!reqNip || typeof reqNip !== 'string' || reqNip.trim() === '') {
      return NextResponse.json({ success: false, error: 'Unauthorized: NIP tidak valid' }, { status: 401 });
    }

    // Determine admin's role and unit_kerja
    let adminRole = reqNip === 'admin' ? 'super_admin' : 'pegawai';
    let adminUnitKerja = '';
    if (reqNip !== 'admin') {
      const adminRow = pRows.find((row: any) => row[nipIdx]?.toString().trim() === reqNip.trim());
      if (adminRow) {
        adminRole = roleIdx !== -1 && adminRow[roleIdx] && adminRow[roleIdx].trim() !== '' ? adminRow[roleIdx].trim() : 'pegawai';
        if (adminRole === 'pegawai' && isPetinggiOrAdmin(adminRow[namaIdx] || '', jabatanIdx !== -1 ? adminRow[jabatanIdx] : '')) {
          adminRole = 'admin';
        }
        adminUnitKerja = adminRow[unitKerjaIdx] || '';
      }
    }

    // Validasi hak akses (Super Admin, Admin Diklat BKPSDMD, atau Admin/Atasan OPD)
    if (adminRole !== 'super_admin' && adminRole !== 'admin_diklat' && adminRole !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: Hak akses tidak mencukupi' }, { status: 403 });
    }

    // Process Sertifikasi
    let allSertifikasi: any[] = [];
    const sRows = sheetData['sertifikasi!A:Z'] || [];
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

    // Process IDP
    let allIdp: any[] = [];
    const iRows = sheetData['idp!A:Z'] || [];
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

    const result = [];
    for (let i = 1; i < pRows.length; i++) {
      const row = pRows[i];
      if (!row[nipIdx] || row[nipIdx] === 'admin') continue;

      const currentUnitKerja = row[unitKerjaIdx] || '';

      // Filter for admin_diklat and admin (fuzzy matching for abbreviations like BKPSDMD)
      if (adminRole === 'admin_diklat' || adminRole === 'admin') {
        if (!isUnitKerjaMatch(currentUnitKerja, adminUnitKerja)) continue;
      }

      const currentNip = row[nipIdx]?.toString().trim() || '';

      let finalRole = 'pegawai';
      if (roleIdx !== -1 && row[roleIdx] && row[roleIdx].trim() !== '') {
        finalRole = row[roleIdx].trim();
        if (finalRole === 'admin_diklat') finalRole = 'admin';
      } else {
        if (isPetinggiOrAdmin(row[namaIdx] || '', jabatanIdx !== -1 ? row[jabatanIdx] : '')) {
          finalRole = 'admin';
        }
      }

      const emailIdx = headers.indexOf('email');

      const pData: any = {
        nip: currentNip,
        nama: row[namaIdx] || '',
        email: emailIdx !== -1 ? (row[emailIdx] || '') : '',
        status_pegawai: row[statusIdx] || '',
        pangkat: row[pangkatIdx] || '',
        golongan: realGolonganIdx !== -1 ? (row[realGolonganIdx] || '') : '',
        jenkel: jenkelIdx !== -1 ? (row[jenkelIdx] || '') : '',
        status_aktif: statusAktifIdx !== -1 ? (row[statusAktifIdx] || 'Aktif') : 'Aktif',
        jabatan: row[jabatanIdx] || '',
        unit_kerja: row[unitKerjaIdx] || '',
        sertifikasi: allSertifikasi.filter(s => s.nip?.toString().trim() === currentNip),
        idp: allIdp.filter(idp => idp.nip?.toString().trim() === currentNip),
        role: finalRole
      };

      // Hitung JP dinamis dari sertifikasi aktual
      pData.jp = pData.sertifikasi.reduce((sum: number, s: any) => sum + (Number(s.jumlah_jp) || 0), 0);

      result.push(pData);
    }

    return NextResponse.json({ success: true, data: result }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
