import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nip = searchParams.get('nip');
    if (!nip) return NextResponse.json({ success: false }, { status: 400 });

    const sheets = getGoogleSheets();
    
    // Pegawai
    let pegawaiData = null;
    const pRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pegawai!A:Z' });
    const pRows = pRes.data.values || [];
    const pHeaders = pRows[0]?.map(h => h.toLowerCase()) || [];
    const pNipIdx = pHeaders.indexOf('nip');
    if (pNipIdx !== -1) {
      for (let i=1; i<pRows.length; i++) {
        if (pRows[i][pNipIdx]?.trim() === nip.trim()) {
          pegawaiData = {};
          pHeaders.forEach((h, idx) => {
            let key = h;
            if (key === 'status pegawai') key = 'status_pegawai';
            if (key === 'jankel') key = 'jenkel';
            if (key === 'unit kerja') key = 'unit_kerja';
            if (key === 'golongan ') key = 'golongan';
            pegawaiData[key] = pRows[i][idx] || '';
          });
          break;
        }
      }
    }

    // Sertifikasi
    let sertifikasiData: any[] = [];
    try {
      const sRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'sertifikasi!A:Z' });
      const sRows = sRes.data.values || [];
      const sHeaders = sRows[0]?.map(h => h.toLowerCase()) || [];
      const sNipIdx = sHeaders.indexOf('nip');
      if (sNipIdx !== -1) {
        for (let i=1; i<sRows.length; i++) {
          const rowNip = sRows[i][sNipIdx];
          if (rowNip && rowNip.toString().trim() === nip.trim()) {
            const row: any = { _rowIndex: i + 1 };
            sHeaders.forEach((h, idx) => {
              row[h] = sRows[i][idx] || '';
            });
            if (row.jumlah_jp) row.jumlah_jp = Number(row.jumlah_jp);
            sertifikasiData.push(row);
          }
        }
      }
    } catch(e) {}

    // Pendidikan
    let pendidikanData: any[] = [];
    try {
      const eRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pendidikan!A:Z' });
      const eRows = eRes.data.values || [];
      const eHeaders = eRows[0]?.map(h => h.toLowerCase()) || [];
      const eNipIdx = eHeaders.indexOf('nip');
      if (eNipIdx !== -1) {
        for (let i=1; i<eRows.length; i++) {
          const rowNip = eRows[i][eNipIdx];
          if (rowNip && rowNip.toString().trim() === nip.trim()) {
            const row: any = { _rowIndex: i + 1 };
            eHeaders.forEach((h, idx) => {
              row[h] = eRows[i][idx] || '';
            });
            pendidikanData.push(row);
          }
        }
      }
    } catch(e) {}

    return NextResponse.json({ success: true, data: { pegawai: pegawaiData, sertifikasi: sertifikasiData, pendidikan: pendidikanData }});
  } catch (e: any) { return NextResponse.json({ success: false }, { status: 500 }); }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { nip, nama, status_pegawai, pangkat, golongan, jenkel, jabatan, unit_kerja } = body;
    if (!nip) return NextResponse.json({ success: false }, { status: 400 });

    const sheets = getGoogleSheets();
    
    const pRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pegawai!A:Z' });
    const pRows = pRes.data.values || [];
    if (pRows.length === 0) return NextResponse.json({ success: false, message: 'Sheet empty' }, { status: 404 });
    
    const pHeaders = pRows[0].map((h: string) => h.toLowerCase());
    const pNipIdx = pHeaders.indexOf('nip');
    if (pNipIdx === -1) return NextResponse.json({ success: false, message: 'No NIP column' }, { status: 500 });
    
    let rowIndex = -1;
    for (let i=1; i<pRows.length; i++) {
      if (pRows[i][pNipIdx]?.trim() === nip.trim()) {
        rowIndex = i + 1; // 1-based for A1 notation
        break;
      }
    }
    
    if (rowIndex === -1) {
      return NextResponse.json({ success: false, message: 'Pegawai not found' }, { status: 404 });
    }

    const currentRow = pRows[rowIndex - 1];
    const newRow = [...currentRow];
    
    const updateField = (field: string, value: string) => {
      if (value === undefined) return;
      const idx = pHeaders.indexOf(field);
      if (idx !== -1) {
        newRow[idx] = value;
      }
    };
    
    updateField('nama', nama);
    updateField('status pegawai', status_pegawai);
    updateField('pangkat', pangkat);
    updateField('golongan ', golongan);
    updateField('jankel', jenkel);
    updateField('jabatan', jabatan);
    updateField('unit kerja', unit_kerja);
    
    while (newRow.length < pHeaders.length) {
      newRow.push('');
    }

    const endColumn = String.fromCharCode(65 + pHeaders.length - 1);
    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `pegawai!A${rowIndex}:${endColumn}${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
