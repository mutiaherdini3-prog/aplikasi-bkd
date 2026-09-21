import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

async function updatePegawaiSertifikasi(nip: string, sheets: any) {
  // 1. Ambil semua sertifikasi untuk NIP ini dari sheet sertifikasi
  const sertRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'sertifikasi!A:Z' });
  const sertRows = sertRes.data.values || [];
  if (sertRows.length === 0) return;
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

  // 2. Fetch pegawai sheet
  const pegRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pegawai!A:ZZ' });
  const pegRows = pegRes.data.values || [];
  if (pegRows.length === 0) return;
  
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
      }
      while (currentRow.length <= hIdx) currentRow.push('');
      currentRow[hIdx] = map.value;
    }
  }

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
  
  const maxColName = getColumnName(pegHeaders.length - 1);
  await sheets.spreadsheets.values.update({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: `pegawai!A1:${maxColName}1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [pegRows[0]] }
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: `pegawai!A${pegRowIndex}:${maxColName}${pegRowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [currentRow] }
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

    // Get NIP before deleting
    const headerRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'sertifikasi!1:1' });
    const headers = headerRes.data.values?.[0]?.map((h:string)=>h.trim().toLowerCase().replace(/_/g, ' ')) || [];
    const nipIdx = headers.indexOf('nip');
    
    const rowRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: `sertifikasi!A${rowIdx + 1}:Z${rowIdx + 1}` });
    const deletedRow = rowRes.data.values?.[0];
    const nip = (deletedRow && nipIdx !== -1) ? deletedRow[nipIdx] : null;

    // Delete row
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_SHEET_ID,
        requestBody: { requests: [{ deleteDimension: { range: { sheetId: targetSheet.properties?.sheetId, dimension: 'ROWS', startIndex: rowIdx, endIndex: rowIdx + 1 } } }] }
    });

    // Resync
    if (nip) {
        await updatePegawaiSertifikasi(nip, sheets);
    }

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
    
    // 1. Fetch & update sertifikasi headers
    const sertRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'sertifikasi!1:1' });
    const sertRows = sertRes.data.values || [];
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

    if (headersUpdated) {
      const endCol = String.fromCharCode(65 + sertHeaders.length - 1);
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `sertifikasi!A1:${endCol}1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [sertRows[0]] }
      });
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

    // 3. Append to sertifikasi sheet
    if (sertifikasiRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'sertifikasi!A:Z',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: sertifikasiRows }
      });
      
      // 4. Completely resync Pegawai horizontal columns
      await updatePegawaiSertifikasi(nip, sheets);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
