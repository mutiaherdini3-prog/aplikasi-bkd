import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID, getFreshSheetData } from '@/lib/google';
import { revalidateTag } from 'next/cache';

// Helper for generating column letters (A, B, ..., Z, AA, AB, ...)
const getColumnName = (n: number) => {
  let ordA = 'A'.charCodeAt(0);
  let ordZ = 'Z'.charCodeAt(0);
  let len = ordZ - ordA + 1;
  let s = '';
  while (n >= 0) {
    s = String.fromCharCode((n % len) + ordA) + s;
    n = Math.floor(n / len) - 1;
  }
  return s;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada data sertifikasi yang dikirim' }, { status: 400 });
    }

    const sheets = getGoogleSheets();

    // 1. Ambil struktur header terkini dari sheet sertifikasi
    const sertRowsBase = await getFreshSheetData('sertifikasi!A:Z');
    const sertRows = [...sertRowsBase];

    let sertHeaders: string[] = [];
    if (sertRows.length > 0) {
      sertHeaders = sertRows[0].map((h: string) => (h || '').toString().trim().toLowerCase().replace(/_/g, ' '));
    }

    const defaultHeaders = [
      'NIP', 'Jenis Sertifikasi', 'Nama Kursus', 'Institusi Penyelenggara',
      'Nomor Sertifikasi', 'Tanggal Sertifikasi', 'Tahun', 'Jumlah JP', 'Link Sertifikat',
      'Jenis Kursus', 'Klasifikasi Kursus', 'Penanda Tangan', 'Biaya Pelatihan'
    ];

    let headersUpdated = false;
    if (sertHeaders.length === 0) {
      sertHeaders = defaultHeaders.map(h => h.toLowerCase());
      sertRows.push(defaultHeaders);
      headersUpdated = true;
    } else {
      const requiredColumns = ['Jenis Kursus', 'Klasifikasi Kursus', 'Penanda Tangan', 'Biaya Pelatihan'];
      for (const col of requiredColumns) {
        if (!sertHeaders.includes(col.toLowerCase())) {
          sertHeaders.push(col.toLowerCase());
          sertRows[0].push(col);
          headersUpdated = true;
        }
      }
    }

    // Update header di Google Sheet jika ada kolom baru
    if (headersUpdated) {
      const endCol = getColumnName(sertHeaders.length - 1);
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `sertifikasi!A1:${endCol}1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [sertRows[0]] }
      });
    }

    // 2. Susun baris baru untuk sheet sertifikasi
    const newSertifikasiRows: any[][] = [];
    const affectedNipsSet = new Set<string>();

    for (const item of items) {
      const nip = (item.nip || '').toString().trim();
      if (!nip) continue; // Lewati jika tidak ada NIP

      affectedNipsSet.add(nip);

      const row = new Array(sertHeaders.length).fill('');
      const setValue = (headerName: string, value: any) => {
        const normalized = headerName.toLowerCase().replace(/_/g, ' ');
        const idx = sertHeaders.indexOf(normalized);
        if (idx !== -1) {
          row[idx] = value !== undefined && value !== null ? value.toString() : '';
        }
      };

      setValue('NIP', nip);
      setValue('Jenis Sertifikasi', item.jenis_sertifikasi || item.jenis || 'Workshop');
      setValue('Nama Kursus', item.nama_kursus || item.nama_kegiatan || item.kursus || '');
      setValue('Institusi Penyelenggara', item.institusi_penyelenggara || item.penyelenggara || 'BKPSDMD');
      setValue('Nomor Sertifikasi', item.nomor_sertifikasi || item.nomor || '-');
      setValue('Tanggal Sertifikasi', item.tanggal_sertifikasi || item.tanggal || '');
      setValue('Tahun', item.tahun || new Date().getFullYear().toString());
      setValue('Jumlah JP', item.jumlah_jp !== undefined ? item.jumlah_jp.toString() : '0');
      setValue('Link Sertifikat', item.link_sertifikat || item.link_drive || item.link || '');
      setValue('Jenis Kursus', item.jenis_kursus || 'Pelatihan non-klasikal lainnya');
      setValue('Klasifikasi Kursus', item.klasifikasi_kursus || 'Non-Klasikal');
      setValue('Penanda Tangan', item.penanda_tangan || item.pejabat || '-');
      setValue('Biaya Pelatihan', item.biaya_pelatihan || item.biaya || 'APBD');

      newSertifikasiRows.push(row);
    }

    if (newSertifikasiRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada baris valid untuk diimpor (NIP tidak boleh kosong)' }, { status: 400 });
    }

    // 3. Append sekaligus semua baris baru ke sheet sertifikasi
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'sertifikasi!A:Z',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: newSertifikasiRows }
    });

    console.log(`✅ Berhasil menambahkan ${newSertifikasiRows.length} baris ke sheet sertifikasi.`);

    // 4. Batch update ke sheet pegawai untuk semua NIP yang terdampak (hanya kolom jumlah jp)
    const updatedSertRows = await getFreshSheetData('sertifikasi!A:Z');
    const updatedPegRows = await getFreshSheetData('pegawai!A:Z');

    if (updatedSertRows && updatedPegRows && updatedSertRows.length > 0 && updatedPegRows.length > 0) {
      const sHeaders = updatedSertRows[0].map((h: string) => (h || '').toString().trim().toLowerCase().replace(/_/g, ' '));
      const nipIdxS = sHeaders.indexOf('nip');
      const jpIdxS = sHeaders.indexOf('jumlah jp');

      // Hitung total JP per NIP
      const totalJpByNip = new Map<string, number>();
      for (let i = 1; i < updatedSertRows.length; i++) {
        const row = updatedSertRows[i];
        const rNip = (row[nipIdxS] || '').toString().trim();
        if (!rNip) continue;
        const currentTotal = totalJpByNip.get(rNip) || 0;
        totalJpByNip.set(rNip, currentTotal + (parseInt(row[jpIdxS] || '0', 10) || 0));
      }

      const pegHeaders = updatedPegRows[0].map((h: string) => (h || '').toString().trim().toLowerCase());
      const pegNipIdx = pegHeaders.indexOf('nip');
      const pegJpIdx = pegHeaders.indexOf('jumlah jp');

      if (pegNipIdx !== -1 && pegJpIdx !== -1) {
        const colLetter = getColumnName(pegJpIdx);
        const batchRequests: { range: string; values: any[][] }[] = [];

        for (const nip of affectedNipsSet) {
          for (let i = 1; i < updatedPegRows.length; i++) {
            if ((updatedPegRows[i][pegNipIdx] || '').toString().trim() === nip) {
              const sheetRowNumber = i + 1;
              const newTotalJp = (totalJpByNip.get(nip) || 0).toString();
              batchRequests.push({
                range: `pegawai!${colLetter}${sheetRowNumber}`,
                values: [[newTotalJp]]
              });
              break;
            }
          }
        }

        if (batchRequests.length > 0) {
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: GOOGLE_SHEET_ID,
            requestBody: {
              valueInputOption: 'USER_ENTERED',
              data: batchRequests
            }
          });
          console.log(`✅ Berhasil memperbarui kolom JP untuk ${batchRequests.length} pegawai.`);
        }
      }
    }

    revalidateTag('google-sheets', { expire: 0 });

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan ${newSertifikasiRows.length} data sertifikasi untuk ${affectedNipsSet.size} pegawai.`,
      count: newSertifikasiRows.length,
      affectedNips: affectedNipsSet.size
    });
  } catch (err: any) {
    console.error('Error in /api/sertifikasi/import:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Terjadi kesalahan server saat mengimpor sertifikasi'
    }, { status: 500 });
  }
}
