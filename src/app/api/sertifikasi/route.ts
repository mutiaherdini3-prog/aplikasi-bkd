import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID, getCachedSheetData } from '@/lib/google';
import { revalidateTag } from 'next/cache';

// Helper for generating column letters (A, B, ..., Z, AA, AB, ...)
const getColumnName = (n: number) => {
  let ordA = 'A'.charCodeAt(0);
  let ordZ = 'Z'.charCodeAt(0);
  let len = ordZ - ordA + 1;
  let s = "";
  while (n >= 0) {
    s = String.fromCharCode(n % len + ordA) + s;
    n = Math.floor(n / len) - 1;
  }
  return s;
};

async function updatePegawaiSertifikasi(nip: string, sheets: any, preSertRows: any[] | null = null, prePegRows: any[] | null = null) {
  // 1. Get sertifikasi data
  let sertRows = preSertRows;
  if (!sertRows) {
    sertRows = await getCachedSheetData('sertifikasi!A:Z');
  }
  if (!sertRows || sertRows.length === 0) return;
  const sertHeaders = sertRows[0].map((h: string) => h.trim().toLowerCase().replace(/_/g, ' '));
  
  const nipIdx = sertHeaders.indexOf('nip');
  const jpIdxSert = sertHeaders.indexOf('jumlah jp');
  const namaSertIdx = sertHeaders.indexOf('nama kursus') !== -1 ? sertHeaders.indexOf('nama kursus') : sertHeaders.indexOf('jenis sertifikasi');
  const linkSertIdx = sertHeaders.indexOf('link sertifikat');
  const jenisKursusIdx = sertHeaders.indexOf('jenis kursus');
  const klasifikasiIdx = sertHeaders.indexOf('klasifikasi kursus');
  const penandaTanganIdx = sertHeaders.indexOf('penanda tangan') !== -1 ? sertHeaders.indexOf('penanda tangan') : sertHeaders.indexOf('pejabat');
  const biayaIdx = sertHeaders.indexOf('biaya pelatihan');

  const userCerts = [];
  let totalJp = 0;

  for (let i = 1; i < sertRows.length; i++) {
    if (sertRows[i][nipIdx]?.trim() === nip.trim()) {
      userCerts.push(sertRows[i]);
      totalJp += parseInt(sertRows[i][jpIdxSert] || '0');
    }
  }

  // 2. Get pegawai data
  let pegRows = prePegRows;
  if (!pegRows) {
    pegRows = await getCachedSheetData('pegawai!A:ZZ');
  }
  if (!pegRows || pegRows.length === 0) return;
  
  const pegHeaders = pegRows[0].map((h: string) => h.trim().toLowerCase());
  const pegNipIdx = pegHeaders.indexOf('nip');
  const pegJpIdx = pegHeaders.indexOf('jumlah jp');

  let pegRowIndex = -1;
  for (let i = 1; i < pegRows.length; i++) {
    if (pegRows[i][pegNipIdx]?.trim() === nip.trim()) {
      pegRowIndex = i + 1; // 1-based index
      break;
    }
  }

  if (pegRowIndex === -1) return; // NIP not found
  const currentRow = [...pegRows[pegRowIndex - 1]];

  // 3. Update JP
  if (pegJpIdx !== -1) currentRow[pegJpIdx] = totalJp.toString();

  // 4. Update horizontal columns
  let maxCertIdxInHeaders = 0;
  pegHeaders.forEach((h: string) => {
    const match = h.match(/nama sertifikat (\d+)/i);
    if (match) {
      const idx = parseInt(match[1]);
      if (idx > maxCertIdxInHeaders) maxCertIdxInHeaders = idx;
    }
  });

  const maxCertsToProcess = Math.max(userCerts.length, maxCertIdxInHeaders);
  let headersChanged = false;

  for (let certIdx = 1; certIdx <= maxCertsToProcess; certIdx++) {
    const cert = userCerts[certIdx - 1];

    const mappings = [
      { header: `Nama Sertifikat ${certIdx}`, value: cert ? (cert[namaSertIdx] || '-') : '-' },
      { header: `Link Sertifikat ${certIdx}`, value: cert ? (cert[linkSertIdx] || '-') : '-' },
      { header: `Jenis Kursus ${certIdx}`, value: cert ? (cert[jenisKursusIdx] || '-') : '-' },
      { header: `Klasifikasi Kursus ${certIdx}`, value: cert ? (cert[klasifikasiIdx] || '-') : '-' },
      { header: `Penanda Tangan ${certIdx}`, value: cert ? (cert[penandaTanganIdx] || '-') : '-' },
      { header: `Biaya Pelatihan ${certIdx}`, value: cert ? (cert[biayaIdx] || '-') : '-' },
    ];

    for (const map of mappings) {
      let hIdx = pegHeaders.indexOf(map.header.toLowerCase());
      if (hIdx === -1) {
        if (!cert) continue; 
        hIdx = pegHeaders.length;
        pegHeaders.push(map.header.toLowerCase());
        pegRows[0].push(map.header);
        headersChanged = true;
      }
      while (currentRow.length <= hIdx) currentRow.push('');
      currentRow[hIdx] = map.value;
    }
  }
  
  const maxColName = getColumnName(pegHeaders.length - 1);
  
  const batchRequests = [
    { range: `pegawai!A${pegRowIndex}:${maxColName}${pegRowIndex}`, values: [currentRow] }
  ];
  
  if (headersChanged) {
    batchRequests.unshift({ range: `pegawai!A1:${maxColName}1`, values: [pegRows[0]] });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: GOOGLE_SHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: batchRequests
    }
  });
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get('rowIndex');
    if (!rowIndex) return NextResponse.json({ success: false, error: 'Missing rowIndex' }, { status: 400 });

    const sheets = getGoogleSheets();
    const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId: GOOGLE_SHEET_ID });
    const targetSheet = sheetInfo.data.sheets?.find(s => s.properties?.title === 'sertifikasi');
    if (!targetSheet) throw new Error(`Sheet not found`);
    
    const rowIdx = parseInt(rowIndex, 10) - 1;

    // We can fetch the deleted row AND pegawai in parallel to save time, but it's okay for DELETE to be slightly slower.
    const allSertRows = await getCachedSheetData('sertifikasi!A:Z');
    const headers = allSertRows[0]?.map((h:string)=>h.trim().toLowerCase().replace(/_/g, ' ')) || [];
    const nipIdx = headers.indexOf('nip');
    const deletedRow = allSertRows[rowIdx];
    const nip = (deletedRow && nipIdx !== -1) ? deletedRow[nipIdx] : null;

    // Delete row
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_SHEET_ID,
        requestBody: { requests: [{ deleteDimension: { range: { sheetId: targetSheet.properties?.sheetId, dimension: 'ROWS', startIndex: rowIdx, endIndex: rowIdx + 1 } } }] }
    });

    // Resync (fetch all fresh since we just deleted a dimension)
    if (nip) {
        await updatePegawaiSertifikasi(nip, sheets);
    }

    revalidateTag('google-sheets', { expire: 0 });
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const { nip, kegiatans } = await request.json();
    if (!nip || !kegiatans || !Array.isArray(kegiatans)) {
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });
    }

    const sheets = getGoogleSheets();
    
    // 1. Fetch sertifikasi and pegawai in parallel to save huge amounts of time
    // But since they are cached, we can just call them
    const sertRowsBase = await getCachedSheetData('sertifikasi!A:Z');
    const pegRowsBase = await getCachedSheetData('pegawai!A:ZZ');
    
    // Create shallow copies so we can mutate them locally
    const sertRows = [...sertRowsBase];
    const pegRows = [...pegRowsBase];
    
    let sertHeaders: string[] = [];
    if (sertRows.length > 0) {
      sertHeaders = sertRows[0].map((h: string) => h.trim().toLowerCase().replace(/_/g, ' '));
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

    // 2. Format row array based on sertifikasi headers
    const sertifikasiRows = kegiatans.map((k: any) => {
      const row = new Array(sertHeaders.length).fill('');
      const setValue = (headerName: string, value: any) => {
        const normalizedHeaderName = headerName.toLowerCase().replace(/_/g, ' ');
        const idx = sertHeaders.indexOf(normalizedHeaderName);
        if (idx !== -1) row[idx] = value;
      };

      setValue('NIP', nip);
      setValue('Jenis Sertifikasi', k.jenis_sertifikasi || '');
      setValue('Nama Kursus', k.nama_kursus || '');
      setValue('Institusi Penyelenggara', k.institusi_penyelenggara || '');
      setValue('Nomor Sertifikasi', k.nomor_sertifikasi || '');
      setValue('Tanggal Sertifikasi', k.tanggal_sertifikasi || '');
      setValue('Tahun', k.tahun || '');
      setValue('Jumlah JP', k.jumlah_jp || '0');
      setValue('Link Sertifikat', k.link_sertifikat || '');
      setValue('Jenis Kursus', k.jenis_kursus || '');
      setValue('Klasifikasi Kursus', k.klasifikasi_kursus || '');
      setValue('Penanda Tangan', k.pejabat || '');
      setValue('Biaya Pelatihan', k.biaya || '');

      return row;
    });

    // 3. Update headers, Append new rows, and Sync Pegawai in PARALLEL
    const promises = [];
    
    if (headersUpdated) {
      const endCol = getColumnName(sertHeaders.length - 1);
      promises.push(sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `sertifikasi!A1:${endCol}1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [sertRows[0]] }
      }));
    }

    if (sertifikasiRows.length > 0) {
      promises.push(sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'sertifikasi!A:Z',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: sertifikasiRows }
      }));
      
      // Inject the new rows into our local array before syncing so it counts the new JP
      sertifikasiRows.forEach(row => sertRows.push(row));
      promises.push(updatePegawaiSertifikasi(nip, sheets, sertRows, pegRows));
    }

    await Promise.all(promises);

    revalidateTag('google-sheets', { expire: 0 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
