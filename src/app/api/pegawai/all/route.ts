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
    if (reqNip && reqNip !== 'admin') {
      const adminRow = pRows.find((row: any) => row[nipIdx]?.toString().trim() === reqNip.trim());
      if (adminRow) {
        adminRole = roleIdx !== -1 ? (adminRow[roleIdx] || 'pegawai') : 'pegawai';
        adminUnitKerja = adminRow[unitKerjaIdx] || '';
      }
    }

    const result = [];
    for (let i = 1; i < pRows.length; i++) {
      const row = pRows[i];
      if (!row[nipIdx] || row[nipIdx] === 'admin') continue;
      
      const currentUnitKerja = row[unitKerjaIdx] || '';
      if ((adminRole === 'admin_diklat' || adminRole === 'admin') && currentUnitKerja !== adminUnitKerja) continue;

      const statusAktif = statusAktifIdx !== -1 ? (row[statusAktifIdx] || 'Aktif') : 'Aktif';
      
      // Bisa jadi ketua hanya yang masih aktif
      if (statusAktif === 'Tidak Aktif' || statusAktif === 'Mutasi') continue;

      let finalRole = 'pegawai';
      if (roleIdx !== -1 && row[roleIdx] && row[roleIdx].trim() !== '') {
        finalRole = row[roleIdx].trim();
      } else {
        if (isLegacyAdmin(row[namaIdx] || '')) {
          finalRole = 'admin';
        }
      }

      const emailIdx = headers.indexOf('email');

      result.push({
        nip: row[nipIdx]?.toString().trim() || '',
        nama: row[namaIdx] || '',
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
