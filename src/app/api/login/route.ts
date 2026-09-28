import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID, getCachedSheetData } from '@/lib/google';
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  try {
    const { action, nip, password } = await request.json();
    if (!nip || !password) return NextResponse.json({ success: false }, { status: 400 });

    const sheets = getGoogleSheets();
    const rows = await getCachedSheetData('pegawai!A:ZZ');
    if (!rows || rows.length === 0) return NextResponse.json({ success: false }, { status: 404 });

    const headers = rows[0].map((h: string) => h.toLowerCase().trim());
    const nipIdx = headers.indexOf('nip');
    const passIdx = headers.indexOf('password');

    let rowIndex = -1;
    let row = null;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][nipIdx]?.trim() === nip.trim()) { rowIndex = i; row = rows[i]; break; }
    }

    if (!row) return NextResponse.json({ success: false, error: 'NIP not found' }, { status: 404 });

    if (action === 'login') {
      if (row[passIdx]?.trim() !== password.trim()) return NextResponse.json({ success: false, error: 'Wrong password' }, { status: 401 });
      const data: any = {};
      headers.forEach((h, i) => data[h] = row[i] || '');
      
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

      // Also support 'hak akses' column
      if (!data['role'] && data['hak akses']) {
        data['role'] = data['hak akses'];
      }

      // Defaults for missing columns
      if (!data['role']) {
        if (data.nip === 'admin') data['role'] = 'super_admin';
        else if (isLegacyAdmin(data.nama || '')) data['role'] = 'admin';
        else data['role'] = 'pegawai';
      }
      if (data['role'] === 'admin_diklat') {
        data['role'] = 'admin';
      }
      if (!data['nip_atasan']) data['nip_atasan'] = '';
      
      return NextResponse.json({ success: true, data });
    }
    
    if (action === 'reset-password') {
      const col = String.fromCharCode(65 + passIdx);
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID, range: `pegawai!${col}${rowIndex + 1}`, valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[password.trim()]] }
      });
      revalidateTag('google-sheets', { expire: 0 });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false });
  } catch (e: any) { return NextResponse.json({ success: false }, { status: 500 }); }
}
