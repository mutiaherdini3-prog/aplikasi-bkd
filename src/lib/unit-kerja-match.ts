/**
 * Fuzzy Unit Kerja Matching Utility & Master Options
 * 
 * Menangani pencocokan unit kerja antara data Google Sheet,
 * input pengguna, dan nama resmi instansi di Kab. Bangka Barat.
 */

// Master Daftar Pilihan Resmi Unit Kerja di Kab. Bangka Barat (284 Unit)
// Master Daftar Pilihan Resmi Unit Kerja di Kab. Bangka Barat (232 Unit)
export const UNIT_KERJA_OPTIONS: string[] = [
  "ASISTEN ADMINISTRASI UMUM",
  "ASISTEN PEMERINTAHAN DAN KESEJAHTERAAN RAKYAT",
  "ASISTEN PEREKONOMIAN DAN PEMBANGUNAN",
  "BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER DAYA MANUSIA DAERAH",
  "BADAN KESATUAN BANGSA DAN POLITIK",
  "BADAN PENANGGULANGAN BENCANA DAERAH",
  "BADAN PENGELOLAAN KEUANGAN DAN ASET DAERAH",
  "BADAN PENGELOLAAN PAJAK DAN RETRIBUSI DAERAH",
  "BADAN PERENCANAAN PEMBANGUNAN, RISET DAN INOVASI DAERAH",
  "BAGIAN HUKUM",
  "BAGIAN KESEJAHTERAAN RAKYAT",
  "BAGIAN ORGANISASI",
  "BAGIAN PENGADAAN BARANG DAN JASA",
  "BAGIAN PEREKONOMIAN DAN PEMBANGUNAN",
  "BAGIAN TATA PEMERINTAHAN",
  "BAGIAN UMUM, PERLENGKAPAN DAN PROTOKOL",
  "DINAS KEBUDAYAAN DAN PARIWISATA",
  "DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL",
  "DINAS KESEHATAN",
  "DINAS KETAHANAN PANGAN DAN PERTANIAN",
  "DINAS KOMUNIKASI DAN INFORMATIKA",
  "DINAS KOPERASI, USAHA KECIL MENENGAH DAN PERDAGANGAN",
  "DINAS LINGKUNGAN HIDUP",
  "DINAS PEKERJAAN UMUM DAN PENATAAN RUANG",
  "DINAS PEMBERDAYAAN PEREMPUAN DAN PERLINDUNGAN ANAK, PENGENDALIAN PENDUDUK DAN KELUARGA BERENCANA",
  "DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU",
  "DINAS PENDIDIKAN, KEPEMUDAAN DAN OLAHRAGA",
  "DINAS PERHUBUNGAN, PERUMAHAN DAN KAWASAN PERMUKIMAN",
  "DINAS PERIKANAN",
  "DINAS PERINDUSTRIAN DAN TENAGA KERJA",
  "DINAS PERPUSTAKAAN DAN KEARSIPAN",
  "DINAS SOSIAL, PEMBERDAYAAN MASYARAKAT DAN DESA",
  "INSPEKTORAT",
  "KECAMATAN JEBUS",
  "KECAMATAN KELAPA",
  "KECAMATAN MENTOK",
  "KECAMATAN PARITTIGA",
  "KECAMATAN SIMPANG TERITIP",
  "KECAMATAN TEMPILANG",
  "KELURAHAN KELAPA",
  "KELURAHAN KERANGGAN",
  "KELURAHAN MENJELANG",
  "KELURAHAN SUNGAI BARU",
  "KELURAHAN SUNGAI DAENG",
  "KELURAHAN TANJUNG",
  "PUSKESMAS JEBUS",
  "PUSKESMAS KELAPA",
  "PUSKESMAS KUNDI",
  "PUSKESMAS MENTOK",
  "PUSKESMAS PUPUT",
  "PUSKESMAS SEKAR BIRU",
  "PUSKESMAS SIMPANG TERITIP",
  "PUSKESMAS TEMPILANG",
  "SATUAN POLISI PAMONG PRAJA DAN PEMADAM KEBAKARAN",
  "SD NEGERI 1 JEBUS",
  "SD NEGERI 1 KELAPA",
  "SD NEGERI 1 MENTOK",
  "SD NEGERI 1 PARITTIGA",
  "SD NEGERI 1 SIMPANG TERITIP",
  "SD NEGERI 1 TEMPILANG",
  "SD NEGERI 10 JEBUS",
  "SD NEGERI 10 KELAPA",
  "SD NEGERI 10 MENTOK",
  "SD NEGERI 10 PARITTIGA",
  "SD NEGERI 10 SIMPANG TERITIP",
  "SD NEGERI 10 TEMPILANG",
  "SD NEGERI 11 JEBUS",
  "SD NEGERI 11 KELAPA",
  "SD NEGERI 11 MENTOK",
  "SD NEGERI 11 PARITTIGA",
  "SD NEGERI 11 SIMPANG TERITIP",
  "SD NEGERI 11 TEMPILANG",
  "SD NEGERI 12 JEBUS",
  "SD NEGERI 12 KELAPA",
  "SD NEGERI 12 MENTOK",
  "SD NEGERI 12 PARITTIGA",
  "SD NEGERI 12 SIMPANG TERITIP",
  "SD NEGERI 12 TEMPILANG",
  "SD NEGERI 13 JEBUS",
  "SD NEGERI 13 KELAPA",
  "SD NEGERI 13 MENTOK",
  "SD NEGERI 13 PARITTIGA",
  "SD NEGERI 13 SIMPANG TERITIP",
  "SD NEGERI 13 TEMPILANG",
  "SD NEGERI 14 JEBUS",
  "SD NEGERI 14 KELAPA",
  "SD NEGERI 14 MENTOK",
  "SD NEGERI 14 PARITTIGA",
  "SD NEGERI 14 SIMPANG TERITIP",
  "SD NEGERI 14 TEMPILANG",
  "SD NEGERI 15 JEBUS",
  "SD NEGERI 15 KELAPA",
  "SD NEGERI 15 MENTOK",
  "SD NEGERI 15 PARITTIGA",
  "SD NEGERI 15 SIMPANG TERITIP",
  "SD NEGERI 15 TEMPILANG",
  "SD NEGERI 16 JEBUS",
  "SD NEGERI 16 KELAPA",
  "SD NEGERI 16 MENTOK",
  "SD NEGERI 16 PARITTIGA",
  "SD NEGERI 16 SIMPANG TERITIP",
  "SD NEGERI 16 TEMPILANG",
  "SD NEGERI 17 JEBUS",
  "SD NEGERI 17 KELAPA",
  "SD NEGERI 17 MENTOK",
  "SD NEGERI 17 PARITTIGA",
  "SD NEGERI 17 SIMPANG TERITIP",
  "SD NEGERI 17 TEMPILANG",
  "SD NEGERI 18 KELAPA",
  "SD NEGERI 18 MENTOK",
  "SD NEGERI 18 PARITTIGA",
  "SD NEGERI 18 SIMPANG TERITIP",
  "SD NEGERI 18 TEMPILANG",
  "SD NEGERI 19 KELAPA",
  "SD NEGERI 19 MENTOK",
  "SD NEGERI 19 PARITTIGA",
  "SD NEGERI 19 SIMPANG TERITIP",
  "SD NEGERI 19 TEMPILANG",
  "SD NEGERI 2 JEBUS",
  "SD NEGERI 2 KELAPA",
  "SD NEGERI 2 MENTOK",
  "SD NEGERI 2 PARITTIGA",
  "SD NEGERI 2 SIMPANG TERITIP",
  "SD NEGERI 2 TEMPILANG",
  "SD NEGERI 20 KELAPA",
  "SD NEGERI 20 MENTOK",
  "SD NEGERI 20 TEMPILANG",
  "SD NEGERI 21 KELAPA",
  "SD NEGERI 21 MENTOK",
  "SD NEGERI 21 TEMPILANG",
  "SD NEGERI 22 KELAPA",
  "SD NEGERI 22 MENTOK",
  "SD NEGERI 22 TEMPILANG",
  "SD NEGERI 23 KELAPA",
  "SD NEGERI 23 MENTOK",
  "SD NEGERI 24 KELAPA",
  "SD NEGERI 24 MENTOK",
  "SD NEGERI 26 KELAPA",
  "SD NEGERI 27 KELAPA",
  "SD NEGERI 3 JEBUS",
  "SD NEGERI 3 KELAPA",
  "SD NEGERI 3 MENTOK",
  "SD NEGERI 3 PARITTIGA",
  "SD NEGERI 3 SIMPANG TERITIP",
  "SD NEGERI 3 TEMPILANG",
  "SD NEGERI 4 JEBUS",
  "SD NEGERI 4 KELAPA",
  "SD NEGERI 4 MENTOK",
  "SD NEGERI 4 PARITTIGA",
  "SD NEGERI 4 SIMPANG TERITIP",
  "SD NEGERI 4 TEMPILANG",
  "SD NEGERI 5 JEBUS",
  "SD NEGERI 5 KELAPA",
  "SD NEGERI 5 MENTOK",
  "SD NEGERI 5 PARITTIGA",
  "SD NEGERI 5 SIMPANG TERITIP",
  "SD NEGERI 5 TEMPILANG",
  "SD NEGERI 6 JEBUS",
  "SD NEGERI 6 KELAPA",
  "SD NEGERI 6 MENTOK",
  "SD NEGERI 6 PARITTIGA",
  "SD NEGERI 6 SIMPANG TERITIP",
  "SD NEGERI 6 TEMPILANG",
  "SD NEGERI 7 JEBUS",
  "SD NEGERI 7 KELAPA",
  "SD NEGERI 7 MENTOK",
  "SD NEGERI 7 PARITTIGA",
  "SD NEGERI 7 SIMPANG TERITIP",
  "SD NEGERI 7 TEMPILANG",
  "SD NEGERI 8 JEBUS",
  "SD NEGERI 8 KELAPA",
  "SD NEGERI 8 MENTOK",
  "SD NEGERI 8 PARITTIGA",
  "SD NEGERI 8 SIMPANG TERITIP",
  "SD NEGERI 8 TEMPILANG",
  "SD NEGERI 9 JEBUS",
  "SD NEGERI 9 KELAPA",
  "SD NEGERI 9 MENTOK",
  "SD NEGERI 9 PARITTIGA",
  "SD NEGERI 9 SIMPANG TERITIP",
  "SD NEGERI 9 TEMPILANG",
  "SEKRETARIAT DPRD",
  "SMP NEGERI 1 JEBUS",
  "SMP NEGERI 1 KELAPA",
  "SMP NEGERI 1 MENTOK",
  "SMP NEGERI 1 PARITTIGA",
  "SMP NEGERI 1 SIMPANG TERITIP",
  "SMP NEGERI 1 TEMPILANG",
  "SMP NEGERI 2 JEBUS",
  "SMP NEGERI 2 KELAPA",
  "SMP NEGERI 2 MENTOK",
  "SMP NEGERI 2 PARITTIGA",
  "SMP NEGERI 2 SIMPANG TERITIP",
  "SMP NEGERI 2 TEMPILANG",
  "SMP NEGERI 3 JEBUS",
  "SMP NEGERI 3 KELAPA",
  "SMP NEGERI 3 MENTOK",
  "SMP NEGERI 3 PARITTIGA",
  "SMP NEGERI 3 PARITTIGA SATU ATAP",
  "SMP NEGERI 3 SIMPANG TERITIP",
  "SMP NEGERI 3 TEMPILANG",
  "SMP NEGERI 4 KELAPA",
  "SMP NEGERI 4 MENTOK",
  "SMP NEGERI 4 PARITTIGA",
  "SMP NEGERI 4 SIMPANG TERITIP",
  "SMP NEGERI 4 TEMPILANG",
  "SMP NEGERI 5 KELAPA",
  "SMP NEGERI 5 MENTOK",
  "SMP NEGERI 5 SIMPANG TERITIP",
  "SMP NEGERI 6 MENTOK",
  "SMP NEGERI 6 MENTOK SATU ATAP",
  "SMP NEGERI 6 SIMPANG TERITIP",
  "STAF AHLI BUPATI BIDANG EKONOMI DAN PEMBANGUNAN",
  "STAF AHLI BUPATI BIDANG HUKUM, POLITIK DAN PEMERINTAHAN",
  "STAF AHLI BUPATI BIDANG KEMASYARAKATAN DAN SUMBER DAYA MANUSIA",
  "TK NEGERI PEMBINA JEBUS",
  "TK NEGERI PEMBINA KELAPA",
  "TK NEGERI PEMBINA MENTOK",
  "TK NEGERI PEMBINA PARITTIGA",
  "TK NEGERI PEMBINA SIMPANG TERITIP",
  "TK NEGERI PEMBINA TEMPILANG",
  "TK NEGERI SATU ATAP SD NEGERI 14 MENTOK",
  "TK NEGERI SATU ATAP SD NEGERI 4 KELAPA",
  "TK NEGERI SATU ATAP SD NEGERI 4 SIMPANG TERITIP",
  "TK NEGERI SATU ATAP SD NEGERI 5 SIMPANG TERITIP",
  "TK NEGERI SATU ATAP SD NEGERI 8 SIMPANG TERITIP",
  "TK NEGERI SEJIRAN SETASON",
  "TK SATU ATAP SD NEGERI 11 KELAPA",
  "TK SATU ATAP SD NEGERI 11 PARITTIGA",
  "TK SATU ATAP SD NEGERI 18 MENTOK",
  "TK SATU ATAP SD NEGERI 7 PARITTIGA",
  "UPT RSUD SEJIRAN SETASON"
];

// Pemetaan Singkatan Umum
const ABBREVIATION_MAP: Record<string, string> = {
  "BKPSDMD": "BADAN KEPEGAWAIAN PENGEMBANGAN SUMBER DAYA MANUSIA DAERAH",
  "BKPSDM": "BADAN KEPEGAWAIAN PENGEMBANGAN SUMBER DAYA MANUSIA",
  "BPKAD": "BADAN PENGELOLAAN KEUANGAN ASET DAERAH",
  "BAPPEDA": "BADAN PERENCANAAN PEMBANGUNAN DAERAH",
  "BAPPERIDA": "BADAN PERENCANAAN PEMBANGUNAN RISET INOVASI DAERAH",
  "BAPENDA": "BADAN PENGELOLAAN PAJAK RETRIBUSI DAERAH",
  "BPBD": "BADAN PENANGGULANGAN BENCANA DAERAH",
  "KESBANGPOL": "KESATUAN BANGSA POLITIK",
  "DISHUB": "DINAS PERHUBUNGAN",
  "DISKOMINFO": "DINAS KOMUNIKASI INFORMATIKA",
  "DISBUDPAR": "DINAS KEBUDAYAAN PARIWISATA",
  "DISDIK": "DINAS PENDIDIKAN",
  "DISDIKPORA": "DINAS PENDIDIKAN KEPEMUDAAN OLAHRAGA",
  "DINKES": "DINAS KESEHATAN",
  "DPUPR": "DINAS PEKERJAAN UMUM PENATAAN RUANG",
  "DLH": "DINAS LINGKUNGAN HIDUP",
  "DPMPTSP": "DINAS PENANAMAN MODAL PELAYANAN SATU PINTU",
  "DISDUKCAPIL": "DINAS KEPENDUDUKAN PENCATATAN SIPIL",
  "SATPOL PP": "SATUAN POLISI PAMONG PRAJA",
  "SETDA": "SEKRETARIAT DAERAH",
  "SETWAN": "SEKRETARIAT DPRD",
  "SDM": "SUMBER DAYA MANUSIA",
  "DINSOS": "DINAS SOSIAL PEMBERDAYAAN MASYARAKAT DESA",
  "DINSOSPMD": "DINAS SOSIAL PEMBERDAYAAN MASYARAKAT DESA",
  "DISPERINDAG": "DINAS KOPERASI USAHA KECIL MENENGAH PERDAGANGAN",
  "DISPERINDAGKOP": "DINAS KOPERASI USAHA KECIL MENENGAH PERDAGANGAN",
  "DKUP": "DINAS KOPERASI USAHA KECIL MENENGAH PERDAGANGAN",
  "DKPP": "DINAS KETAHANAN PANGAN PERTANIAN",
  "DP2KBP3A": "DINAS PEMBERDAYAAN PEREMPUAN PERLINDUNGAN ANAK PENGENDALIAN PENDUDUK KELUARGA BERENCANA",
  "DISPUSIP": "DINAS PERPUSTAKAAN KEARSIPAN",
  "DISNAKER": "DINAS PERINDUSTRIAN TENAGA KERJA",
  "DISKAN": "DINAS PERIKANAN",
};

export const ALLOWED_ADMIN_NAMES = [
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

/**
 * Mendeteksi apakah pegawai merupakan pimpinan/petinggi OPD atau terdaftar di admin list
 */
export function isPetinggiOrAdmin(nama?: string, jabatan?: string): boolean {
  if (!nama && !jabatan) return false;

  // 1. Cek daftar admin legacy
  if (nama) {
    const normalizedNama = nama.toLowerCase().replace(/[,.\s]/g, '');
    const inAllowed = ALLOWED_ADMIN_NAMES.some(allowed => {
      const normAllowed = allowed.toLowerCase().replace(/[,.\s]/g, '');
      return normalizedNama.includes(normAllowed);
    });
    if (inAllowed) return true;
  }

  // 2. Cek jabatan kepemimpinan (petinggi di setiap OPD)
  if (jabatan) {
    const j = jabatan.toLowerCase().trim();
    if (
      j.startsWith('kepala ') ||
      j.startsWith('kasubbag ') ||
      j.startsWith('kasi ') ||
      j.startsWith('camat') ||
      j.startsWith('sekretaris camat') ||
      j.startsWith('lurah') ||
      j.startsWith('sekretaris lurah') ||
      j.startsWith('asisten ') ||
      j.startsWith('staf ahli ') ||
      j.startsWith('inspektur') ||
      j.startsWith('direktur') ||
      j.includes('sekretaris daerah') ||
      j.includes('sekretaris dprd') ||
      j.includes('sekretaris dinas') ||
      j.includes('sekretaris badan') ||
      j.includes('sekretaris inspektorat') ||
      j.includes('kepala dinas') ||
      j.includes('kepala badan') ||
      j.includes('kepala bagian') ||
      j.includes('kepala bidang') ||
      j.includes('kepala sekolah') ||
      j.includes('kepala puskesmas') ||
      j.includes('kepala upt') ||
      j.includes('kepala uptd')
    ) {
      // Kecualikan jabatan fungsional pelaksana non-pimpinan
      if (
        j.startsWith('asisten apoteker') ||
        j.startsWith('asisten keperawatan') ||
        j.startsWith('asisten teknisi')
      ) {
        return false;
      }
      return true;
    }
  }

  return false;
}

export const isLegacyAdmin = isPetinggiOrAdmin;


/**
 * Normalisasi dan ekstraksi kata-kata signifikan dari string unit_kerja
 */
export function getUnitKerjaWords(s: string): string[] {
  if (!s) return [];
  
  let cleaned = s.toUpperCase()
    .replace(/\s*-\s*(PEMERINTAH|DINAS|SEKRETARIAT|KECAMATAN).*/g, "")
    .replace(/&/g, " DAN ")
    .replace(/\bSDM\b/g, " SUMBER DAYA MANUSIA ")
    .replace(/\bMUNTOK\b/g, " MENTOK ")
    .replace(/\bSDN\b/g, " SD NEGERI ")
    .replace(/\bSMPN\b/g, " SMP NEGERI ")
    .replace(/\bTKN\b/g, " TK NEGERI ")
    .replace(/\bPARIT\s*TIGA\b/g, " PARITTIGA ")
    .replace(/\b(UPT\s+)?(RUMAH SAKIT UMUM DAERAH|RSUD)\b/g, " RSUD ")
    .replace(/\b0+(\d+)\b/g, "$1") // Hapus leading zero (01 -> 1)
    .replace(/KABUPATEN BANGKA BARAT/g, "")
    .replace(/KAB\. BANGKA BARAT/g, "")
    .replace(/[^A-Z0-9\s]/g, " ")
    .trim();
  
  // Perluasan singkatan jika ada
  const upperOriginal = s.toUpperCase().trim();
  for (const [abbr, expansion] of Object.entries(ABBREVIATION_MAP)) {
    if (upperOriginal === abbr || upperOriginal.includes(abbr)) {
      cleaned += " " + expansion;
    }
  }
  
  return Array.from(new Set(
    cleaned.split(/\s+/).filter(w => w !== "DAN" && (w.length > 2 || w === "SD" || w === "TK" || /^\d+$/.test(w)))
  ));
}

/**
 * Menghitung skor kecocokan antara dua array kata
 * Mengembalikan nilai antara 0 dan 1 (1 = kecocokan sempurna)
 */
export function wordMatchScore(w1: string[], w2: string[]): number {
  if (w1.length === 0 || w2.length === 0) return 0;
  const common = w1.filter(w => w2.includes(w)).length;
  return common / Math.min(w1.length, w2.length);
}

/**
 * Mengecek apakah dua string unit_kerja cocok (exact atau fuzzy)
 */
export function isUnitKerjaMatch(unitKerja1: string, unitKerja2: string): boolean {
  if (!unitKerja1 || !unitKerja2) return false;
  
  // Exact match (case-insensitive)
  if (unitKerja1.trim().toLowerCase() === unitKerja2.trim().toLowerCase()) {
    return true;
  }
  
  // Fuzzy word-based matching
  const w1 = getUnitKerjaWords(unitKerja1);
  const w2 = getUnitKerjaWords(unitKerja2);
  const score = wordMatchScore(w1, w2);
  
  return score >= 0.65;
}

/**
 * Mencari nama unit kerja terbaik dari opsi resmi
 */
export function findBestUnitKerjaMatch(input: string): string | null {
  if (!input) return null;
  const inWords = getUnitKerjaWords(input);
  let bestScore = 0;
  let bestMatch: string | null = null;
  
  for (const opt of UNIT_KERJA_OPTIONS) {
    const optWords = getUnitKerjaWords(opt);
    const score = wordMatchScore(inWords, optWords);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = opt;
    }
  }
  
  return bestScore >= 0.65 ? bestMatch : null;
}
