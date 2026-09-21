import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

export async function POST(request: Request) {
  try {
    const { nip, kegiatans } = await request.json();
    if (!nip || !kegiatans || !Array.isArray(kegiatans)) {
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });
    }

    const sheets = getGoogleSheets();
    
    // Get headers and rows from pegawai sheet
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pegawai!A:ZZ' });
    const rows = res.data.values || [];
    if (rows.length === 0) return NextResponse.json({ success: false, error: 'Sheet empty' }, { status: 404 });

    const headers = rows[0].map((h: string) => h.trim().toLowerCase());
    const nipIdx = headers.indexOf('nip');
    const jpIdx = headers.indexOf('jumlah jp');
    
    if (nipIdx === -1) return NextResponse.json({ success: false, error: 'Kolom NIP tidak ditemukan' }, { status: 500 });

    // Find the row for this NIP
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][nipIdx]?.trim() === nip.trim()) {
        rowIndex = i + 1; // 1-based index for A1 notation
        break;
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json({ success: false, error: 'NIP tidak ditemukan' }, { status: 404 });
    }

    const currentRow = [...rows[rowIndex - 1]];
    
    // Add JP
    let totalJp = 0;
    if (jpIdx !== -1 && currentRow[jpIdx]) {
      totalJp = parseInt(currentRow[jpIdx]) || 0;
    }
    kegiatans.forEach((k: any) => {
      totalJp += parseInt(k.jumlah_jp || '0');
    });
    if (jpIdx !== -1) currentRow[jpIdx] = totalJp.toString();

    // Start filling certificates horizontally starting from the first empty "nama sertifikat X"
    let certIdx = 1;
    while (true) {
      const namaSertIdx = headers.indexOf(`nama sertifikat ${certIdx}`);
      if (namaSertIdx !== -1 && currentRow[namaSertIdx]) {
        certIdx++; // This slot is taken, find the next one
      } else {
        break; // Found an empty slot or a column that doesn't exist yet
      }
    }

    // Now append new kegiatans
    for (const k of kegiatans) {
      const namaSertStr = `nama sertifikat ${certIdx}`;
      const linkSertStr = `link sertifikat ${certIdx}`;
      
      let nIdx = headers.indexOf(namaSertStr);
      let lIdx = headers.indexOf(linkSertStr);
      
      // If column doesn't exist in headers, we need to create it!
      if (nIdx === -1) {
        nIdx = headers.length;
        headers.push(namaSertStr);
        rows[0].push(`Nama Sertifikat ${certIdx}`);
      }
      if (lIdx === -1) {
        lIdx = headers.length;
        headers.push(linkSertStr);
        rows[0].push(`Link Sertifikat ${certIdx}`);
      }
      
      // Fill the cells
      while (currentRow.length <= Math.max(nIdx, lIdx)) currentRow.push('');
      currentRow[nIdx] = k.nama_kursus || k.jenis_sertifikasi || '-';
      currentRow[lIdx] = k.link_sertifikat || '-';
      
      certIdx++;
    }

    // Update the headers row in case we added new columns
    const endColumnHeader = String.fromCharCode(65 + headers.length - 1);
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
    const maxColName = getColumnName(headers.length - 1);

    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `pegawai!A1:${maxColName}1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rows[0]] }
    });

    // Update the specific employee row
    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `pegawai!A${rowIndex}:${maxColName}${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [currentRow] }
    });

    // INSERT INTO SERTIFIKASI SHEET!
    const sertRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'sertifikasi!A:Z' });
    const sertRows = sertRes.data.values || [];
    let sertHeaders: string[] = [];
    if (sertRows.length > 0) {
      sertHeaders = sertRows[0].map((h: string) => h.trim().toLowerCase());
    }

    // Default headers if sheet is completely empty
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
      // Ensure new columns exist
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

    const sertifikasiRows = kegiatans.map((k: any) => {
      const row = new Array(sertHeaders.length).fill('');
      const setValue = (headerName: string, value: any) => {
        const idx = sertHeaders.indexOf(headerName.toLowerCase());
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

    if (sertifikasiRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'sertifikasi!A:Z',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: sertifikasiRows }
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
