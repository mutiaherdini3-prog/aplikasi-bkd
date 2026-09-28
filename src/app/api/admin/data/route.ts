import { NextResponse } from 'next/server';
import { getCachedSheetData } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reqNip = searchParams.get('nip');

    // Fetch Pegawai
    const pRows = await getCachedSheetData('pegawai!A:ZZ');
    if (pRows.length === 0) return NextResponse.json({ success: true, data: [] });

    const ALLOWED_ADMIN_NAMES = [
      "Helwanda", "Muhammad Ali", "Andi Tenri Ajeng", "Abimanyu", "Safrizal",
      "Thanthowi", "Aidin Setiawan Putera", "Indra Cahaya", "Fachriansyah",
      "Drs. Muhammad Soleh", "Miwani", "Aidi", "Farouk Yohansyah", "Novianto",
      "Teni Wahyuni", "Azmal AZ", "Muhammad Sapi'i Rangkuti", "Achmad Nursyandi",
      "Bertha", "Hendra Jaya", "Muhammad Kaidi", "Sarbudiono", "Yudi Hermanto",
      "Dessy Sarilena Oktavia", "Ferdinan T", "Sanudin", "Joko Riswanto",
      "Sri Mulyono Basuki", "Bastomi", "Harfiyan", "Sari Dwi Estari",
      "Mustika Sari", "Ashan", "Rino Rizandi", "Winda", "Novaroly",
      "Des Kurniawan", "Dekky Edward", "Muhammad Putra Kusuma", "Yulista",
      "Amini", "Kamso", "Indra Saputra", "Sholihin", "Halimah", "Isfani",
      "Ema Ratna Gustina", "Kerynna Meithesya", "Heroe Yoewono", "Yuliyen Maizar",
      "Herlina", "Windy Arti Pratiwi", "Nora Ambarsari", "Fitri Milvayanti",
      "Avan Yuandi", "Zahroni", "Maria Fuji Lestari", "Riko Agus Tridoyo",
      "Ety Melyanti", "Ahmad Taufik", "Heriansyah", "Andrie Fitrayadi",
      "Rita Andriani", "Dessy Susanty", "M. Irsal", "Bustanil Arifin", "Waldi",
      "Edi Irawan", "Damhuri", "Meidiar", "M. Akib", "Andriansyah", "Amanda",
      "Imam Wasana Putra", "Thomas Edison Regan", "Ir. Surya Mardiansyah",
      "Heriyandi", "Hafsah", "Uli Nuha", "Meidiyan", "Juswardi",
      "Muhammad Ferhad Irvan", "Erza Fistiawan", "Wiratmo", "Dody Sihono",
      "Imam Dwi Feryanto", "Armizi", "Havita Dwi Anggasari", "Agus Setyadi",
      "Sufidra", "Muhammad Amrullah", "Henry Firsanto", "Sandy Wijaya",
      "Andi Hamzah", "Eka Octawianto", "Amar Sopi", "Hidayat",
      "Undat P. Sihombing", "Anita", "Muhammad Satriansyah", "Mailan",
      "Henky Wibawa", "Diah Sapitri", "Siemens Siloys", "Arni",
      "Agung Ariwibowo", "Aryanto", "Benhard Batubara", "Pebri Harto",
      "dr. Ratnosoppi", "Nurmala Anggraini", "Ns.Muria Idriakasih",
      "Linda Yunita", "A'ad Tirta Fujaka", "Wahyudi Saputra", "Rini Indra Sari",
      "Muhammad Fakhri", "Nurherodiyah", "Rohardi", "Ferri Ardami", "Idwin",
      "Rina Mulyanti", "Bambang Yusdianto", "Zulkarnain", "Sapki Bahresi",
      "Asrin Utiarahman", "Syahrul Effendi", "Jayu Noriska", "Herman Siswadi",
      "Novi Eva Yanti", "Siska Silviana", "dr. Rudi Faizul Badri",
      "Ns. Sri Hartati", "Arsul Sani"
    ];

    const isLegacyAdmin = (nama: string) => {
      if (!nama) return false;
      const normalizedNama = nama.toLowerCase().replace(/[,.\s]/g, '');
      return ALLOWED_ADMIN_NAMES.some(allowed => {
        const normAllowed = allowed.toLowerCase().replace(/[,.\s]/g, '');
        return normalizedNama.includes(normAllowed);
      });
    };

    const headers = pRows[0].map((h: string) => h.trim().toLowerCase());
    const nipIdx = headers.indexOf('nip');
    const namaIdx = headers.indexOf('nama');
    const statusIdx = headers.indexOf('status pegawai');
    const pangkatIdx = headers.indexOf('pangkat');
    const golonganIdx = headers.indexOf('golongan ');
    if (golonganIdx === -1) {
      // In case of typo in sheet
      headers.indexOf('golongan');
    }
    const realGolonganIdx = headers.indexOf('golongan ') !== -1 ? headers.indexOf('golongan ') : headers.indexOf('golongan');
    const jenkelIdx = [headers.indexOf('jankel'), headers.indexOf('jenis kelamin'), headers.indexOf('jenkel')].find(i => i !== -1) ?? -1;
    const statusAktifIdx = headers.indexOf('status aktif');
    const jabatanIdx = headers.indexOf('jabatan');
    const unitKerjaIdx = headers.indexOf('unit kerja');
    let roleIdx = headers.indexOf('role');
    if (roleIdx === -1) roleIdx = headers.indexOf('hak akses');

    // Determine admin's role and unit_kerja
    let adminRole = 'super_admin';
    let adminUnitKerja = '';
    if (reqNip && reqNip !== 'admin') {
      const adminRow = pRows.find((row: any) => row[nipIdx]?.toString().trim() === reqNip.trim());
      if (adminRow) {
        adminRole = roleIdx !== -1 && adminRow[roleIdx] && adminRow[roleIdx].trim() !== '' ? adminRow[roleIdx].trim() : 'pegawai';
        if (adminRole === 'pegawai' && isLegacyAdmin(adminRow[namaIdx] || '')) {
          adminRole = 'admin';
        }
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
      
      // Filter for admin_diklat and admin
      if (adminRole === 'admin_diklat' || adminRole === 'admin') {
        if (currentUnitKerja.trim().toLowerCase() !== adminUnitKerja.trim().toLowerCase()) continue;
      }

      const currentNip = row[nipIdx]?.toString().trim() || '';

      let finalRole = 'pegawai';
      if (roleIdx !== -1 && row[roleIdx] && row[roleIdx].trim() !== '') {
        finalRole = row[roleIdx].trim();
        if (finalRole === 'admin_diklat') finalRole = 'admin';
      } else {
        if (isLegacyAdmin(row[namaIdx] || '')) {
          finalRole = 'admin';
        }
      }

      const pData: any = {
        nip: currentNip,
        nama: row[namaIdx] || '',
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

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
