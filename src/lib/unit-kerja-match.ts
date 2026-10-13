/**
 * Fuzzy Unit Kerja Matching Utility
 * 
 * Handles mismatches between unit_kerja values in the sheet (e.g., "BKPSDMD")
 * and the standardized full names (e.g., "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Daerah").
 * 
 * Uses word-based matching to compare unit_kerja strings.
 */

// Common abbreviation expansions
const ABBREVIATION_MAP: Record<string, string> = {
  'BKPSDMD': 'BADAN KEPEGAWAIAN PENGEMBANGAN SUMBER DAYA MANUSIA DAERAH',
  'BKPSDM': 'BADAN KEPEGAWAIAN PENGEMBANGAN SUMBER DAYA MANUSIA',
  'BPKAD': 'BADAN PENGELOLAAN KEUANGAN ASET DAERAH',
  'BAPPEDA': 'BADAN PERENCANAAN PEMBANGUNAN DAERAH',
  'BAPENDA': 'BADAN PENGELOLAAN PAJAK RETRIBUSI DAERAH',
  'BPBD': 'BADAN PENANGGULANGAN BENCANA DAERAH',
  'KESBANGPOL': 'KESATUAN BANGSA POLITIK',
  'DISHUB': 'DINAS PERHUBUNGAN',
  'DISKOMINFO': 'DINAS KOMUNIKASI INFORMATIKA',
  'DISBUDPAR': 'DINAS KEBUDAYAAN PARIWISATA',
  'DISDIK': 'DINAS PENDIDIKAN',
  'DINKES': 'DINAS KESEHATAN',
  'DPUPR': 'DINAS PEKERJAAN UMUM PENATAAN RUANG',
  'DLH': 'DINAS LINGKUNGAN HIDUP',
  'DPMPTSP': 'DINAS PENANAMAN MODAL PELAYANAN SATU PINTU',
  'DISDUKCAPIL': 'DINAS KEPENDUDUKAN PENCATATAN SIPIL',
  'SATPOL PP': 'SATUAN POLISI PAMONG PRAJA',
  'SETDA': 'SEKRETARIAT DAERAH',
  'SETWAN': 'SEKRETARIAT DPRD',
  'SDM': 'SUMBER DAYA MANUSIA',
};

/**
 * Normalize and extract significant words from a unit_kerja string
 */
export function getUnitKerjaWords(s: string): string[] {
  if (!s) return [];
  
  let cleaned = s.toUpperCase()
    .replace(/&/g, ' DAN ')
    .replace(/SDM/g, ' SUMBER DAYA MANUSIA ')
    .replace(/MUNTOK/g, ' MENTOK ')
    .replace(/ - PEMERINTAH.*/g, '')
    .replace(/KABUPATEN BANGKA BARAT/g, '')
    .replace(/KAB\. BANGKA BARAT/g, '')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .trim();
  
  // Expand known abbreviations
  const upperOriginal = s.toUpperCase().trim();
  for (const [abbr, expansion] of Object.entries(ABBREVIATION_MAP)) {
    if (upperOriginal === abbr || upperOriginal.includes(abbr)) {
      cleaned += ' ' + expansion;
    }
  }
  
  return Array.from(new Set(cleaned.split(/\s+/).filter(w => w !== 'DAN' && w.length > 2)));
}

/**
 * Calculate match score between two arrays of words
 * Returns a value between 0 and 1 (1 = perfect match)
 */
export function wordMatchScore(w1: string[], w2: string[]): number {
  if (w1.length === 0 || w2.length === 0) return 0;
  const common = w1.filter(w => w2.includes(w)).length;
  return common / Math.min(w1.length, w2.length);
}

/**
 * Check if two unit_kerja strings match (exact or fuzzy)
 * @returns true if they match with score >= 0.6
 */
export function isUnitKerjaMatch(unitKerja1: string, unitKerja2: string): boolean {
  if (!unitKerja1 || !unitKerja2) return false;
  
  // Try exact match first (case-insensitive)
  if (unitKerja1.trim().toLowerCase() === unitKerja2.trim().toLowerCase()) {
    return true;
  }
  
  // Fuzzy word-based matching
  const w1 = getUnitKerjaWords(unitKerja1);
  const w2 = getUnitKerjaWords(unitKerja2);
  const score = wordMatchScore(w1, w2);
  
  return score >= 0.6;
}
