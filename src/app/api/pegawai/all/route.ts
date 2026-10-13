import { NextResponse } from 'next/server';
import { getCachedSheetData } from '@/lib/google';
import { isUnitKerjaMatch, isPetinggiOrAdmin } from '@/lib/unit-kerja-match';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reqNip = searchParams.get('nip');
    const isAll = searchParams.get('all') === 'true';

    // Fetch Pegawai
    const pRows = await getCachedSheetData('pegawai!A:ZZ');
    if (pRows.length === 0) return NextResponse.json({ success: true, data: [] });

    const headers = pRows[0].map((h: string) => h.trim().toLowerCase());
    const nipIdx = headers.indexOf('nip');
    const namaIdx = headers.indexOf('nama');
    const jabatanIdx = headers.indexOf('jabatan');
    const statusAktifIdx = headers.indexOf('status aktif');
    const unitKerjaIdx = headers.indexOf('unit kerja');
    let roleIdx = headers.indexOf('role');
    if (roleIdx === -1) roleIdx = headers.indexOf('hak akses');

    if (nipIdx === -1 || namaIdx === -1) {
      return NextResponse.json({ success: false, message: 'Invalid sheet format' }, { status: 500 });
    }

    // Determine admin's role and unit_kerja
    let adminRole = 'super_admin';
    let adminUnitKerja = '';
    if (!isAll && reqNip && reqNip !== 'admin') {
      const adminRow = pRows.find((row: any) => row[nipIdx]?.toString().trim() === reqNip.trim());
      if (adminRow) {
        adminRole = roleIdx !== -1 && adminRow[roleIdx] && adminRow[roleIdx].trim() !== '' ? adminRow[roleIdx].trim() : 'pegawai';
        if (adminRole === 'pegawai' && isPetinggiOrAdmin(adminRow[namaIdx] || '', jabatanIdx !== -1 ? adminRow[jabatanIdx] : '')) {
          adminRole = 'admin';
        }
        adminUnitKerja = adminRow[unitKerjaIdx] || '';
      }
    }

    const statusPegawaiIdx = headers.indexOf('status pegawai');
    const golonganIdx = headers.indexOf('golongan');
    const emailIdx = headers.indexOf('email');

    const result = [];
    for (let i = 1; i < pRows.length; i++) {
      const row = pRows[i];
      if (!row[nipIdx] || row[nipIdx] === 'admin') continue;
      
      const currentUnitKerja = row[unitKerjaIdx] || '';
      if (!isAll && (adminRole === 'admin_diklat' || adminRole === 'admin') && !isUnitKerjaMatch(currentUnitKerja, adminUnitKerja)) continue;

      const statusAktif = statusAktifIdx !== -1 ? (row[statusAktifIdx] || 'Aktif') : 'Aktif';
      
      // Bisa jadi ketua hanya yang masih aktif
      if (statusAktif === 'Tidak Aktif' || statusAktif === 'Mutasi') continue;

      let finalRole = 'pegawai';
      if (roleIdx !== -1 && row[roleIdx] && row[roleIdx].trim() !== '') {
        finalRole = row[roleIdx].trim();
      } else {
        if (isPetinggiOrAdmin(row[namaIdx] || '', jabatanIdx !== -1 ? row[jabatanIdx] : '')) {
          finalRole = 'admin';
        }
      }

      result.push({
        nip: row[nipIdx]?.toString().trim() || '',
        nama: row[namaIdx] || '',
        status_pegawai: statusPegawaiIdx !== -1 ? (row[statusPegawaiIdx] || '') : '',
        golongan: golonganIdx !== -1 ? (row[golonganIdx] || '') : '',
        jabatan: jabatanIdx !== -1 ? (row[jabatanIdx] || '') : '',
        unit_kerja: currentUnitKerja,
        role: finalRole,
        email: emailIdx !== -1 ? (row[emailIdx] || '') : ''
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
