import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

export const dynamic = 'force-dynamic';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nip, password, nama, status_pegawai, pangkat, golongan, jenkel, jabatan, unit_kerja, status_aktif, role, nip_atasan } = body;
    
    if (!nip || !nama) return NextResponse.json({ success: false, message: 'NIP and Nama are required' }, { status: 400 });

    const sheets = getGoogleSheets();
    
    const pRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pegawai!A:Z' });
    const pRows = pRes.data.values || [];
    
    let pHeaders = [];
    if (pRows.length > 0) {
      pHeaders = pRows[0].map((h: string) => h.toLowerCase());
    } else {
      pHeaders = ['nip', 'password', 'nama', 'status pegawai', 'pangkat', 'golongan ', 'jankel', 'jabatan', 'unit kerja', 'jumlah jp', 'status aktif'];
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'pegawai!A1:K1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [pHeaders] }
      });
    }

    // Check if NIP already exists
    const nipIdx = pHeaders.indexOf('nip');
    if (nipIdx !== -1) {
      for (let i = 1; i < pRows.length; i++) {
        if (pRows[i][nipIdx]?.trim() === nip.trim()) {
          return NextResponse.json({ success: false, message: 'NIP sudah terdaftar' }, { status: 400 });
        }
      }
    }

    const newRow = new Array(pHeaders.length).fill('');
    
    const setVal = (field: string, val: string) => {
      const idx = pHeaders.indexOf(field);
      if (idx !== -1) newRow[idx] = val || '';
    };

    setVal('nip', nip);
    setVal('password', password || '123456');
    setVal('nama', nama);
    setVal('status pegawai', status_pegawai);
    setVal('pangkat', pangkat);
    setVal('golongan ', golongan);
    setVal('jankel', jenkel);
    setVal('jabatan', jabatan);
    setVal('unit kerja', unit_kerja);
    setVal('jumlah jp', '0');
    
    let statusAktifIdx = pHeaders.indexOf('status aktif');
    if (statusAktifIdx === -1) {
      statusAktifIdx = pHeaders.length;
      pHeaders.push('status aktif');
      // We don't update header row in sheet immediately, but it's fine since append will just add to column K
    }
    newRow[statusAktifIdx] = status_aktif || 'Aktif';

    let roleIdx = pHeaders.indexOf('role');
    if (roleIdx === -1) { roleIdx = pHeaders.length; pHeaders.push('role'); }
    newRow[roleIdx] = role || 'pegawai';

    let nipAtasanIdx = pHeaders.indexOf('nip_atasan');
    if (nipAtasanIdx === -1) { nipAtasanIdx = pHeaders.length; pHeaders.push('nip_atasan'); }
    newRow[nipAtasanIdx] = nip_atasan || '';

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'pegawai!A:Z',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow] }
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nip = searchParams.get('nip');
    if (!nip) return NextResponse.json({ success: false, error: 'Missing NIP' }, { status: 400 });

    const sheets = getGoogleSheets();
    const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId: GOOGLE_SHEET_ID });
    
    // 1. Delete from pegawai sheet
    const pSheet = sheetInfo.data.sheets?.find(s => s.properties?.title === 'pegawai');
    const pRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pegawai!A:Z' });
    const pRows = pRes.data.values || [];
    const pHeaders = pRows[0]?.map((h: string) => h.toLowerCase()) || [];
    const nipIdx = pHeaders.indexOf('nip');
    
    let pRowIndex = -1;
    if (nipIdx !== -1) {
      for (let i = 1; i < pRows.length; i++) {
        if (pRows[i][nipIdx] && pRows[i][nipIdx].toString().trim() === nip.trim()) {
          pRowIndex = i;
          break;
        }
      }
    }
    
    if (pRowIndex !== -1 && pSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_SHEET_ID,
        requestBody: { requests: [{ deleteDimension: { range: { sheetId: pSheet.properties?.sheetId, dimension: 'ROWS', startIndex: pRowIndex, endIndex: pRowIndex + 1 } } }] }
      });
    }

    // 2. We could delete from sertifikasi and pendidikan too, but iterating and finding all rows then deleting them from bottom to top to avoid index shifting is complex.
    // Instead, we clear the rows so they are ignored, which is much safer and simpler.
    // Actually, let's just clear the rows in sertifikasi and pendidikan that match this NIP.
    const clearRelatedRows = async (sheetName: string) => {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: `${sheetName}!A:Z` });
      const rows = res.data.values || [];
      const nipColIdx = rows[0]?.map((h: string) => h.toLowerCase()).indexOf('nip') ?? -1;
      
      if (nipColIdx !== -1) {
        for (let i = rows.length - 1; i >= 1; i--) {
          if (rows[i][nipColIdx] && rows[i][nipColIdx].toString().trim() === nip.trim()) {
             // Clear the row
             await sheets.spreadsheets.values.clear({
               spreadsheetId: GOOGLE_SHEET_ID,
               range: `${sheetName}!A${i + 1}:Z${i + 1}`
             });
          }
        }
      }
    };

    await clearRelatedRows('sertifikasi');
    await clearRelatedRows('pendidikan');

    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nip = searchParams.get('nip');
    const ketuaNip = searchParams.get('ketua_nip');
    
    if (!nip && !ketuaNip) return NextResponse.json({ success: false, message: 'NIP required' }, { status: 400 });

    const sheets = getGoogleSheets();
    
    if (ketuaNip) {
      // Hanya fetch IDP bawahan untuk ketua ini
      let idpBawahan: any[] = [];
      try {
        const iRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'idp!A:Z' });
        const iRows = iRes.data.values || [];
        const iHeaders = iRows[0]?.map(h => h.toLowerCase()) || [];
        const ketuaNipIdx = iHeaders.indexOf('nip_ketua');
        
        if (ketuaNipIdx !== -1) {
          for (let i = 1; i < iRows.length; i++) {
            if (iRows[i][ketuaNipIdx]?.trim() === ketuaNip.trim()) {
              const row: any = { _rowIndex: i + 1 };
              iHeaders.forEach((h, idx) => {
                row[h] = iRows[i][idx] || '';
              });
              idpBawahan.push(row);
            }
          }
        }
        
        // Populate nama pegawai for each IDP
        const pRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pegawai!A:Z' });
        const pRows = pRes.data.values || [];
        const pHeaders = pRows[0]?.map((h: string) => h.toLowerCase()) || [];
        const pNipIdx = pHeaders.indexOf('nip');
        const pNamaIdx = pHeaders.indexOf('nama');
        
        if (pNipIdx !== -1 && pNamaIdx !== -1) {
           const nipToNama: Record<string, string> = {};
           for (let i = 1; i < pRows.length; i++) {
             nipToNama[pRows[i][pNipIdx]] = pRows[i][pNamaIdx];
           }
           idpBawahan = idpBawahan.map(idp => ({
             ...idp,
             nama_pegawai: nipToNama[idp.nip] || 'Unknown'
           }));
        }

        return NextResponse.json({ success: true, data: idpBawahan });
      } catch(e) {
        return NextResponse.json({ success: false, error: 'Failed to fetch IDP bawahan' }, { status: 500 });
      }
    }
    
    if (!nip) return NextResponse.json({ success: false, message: 'NIP required' }, { status: 400 });

    // Pegawai
    let pegawaiData: any = null;
    const pRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pegawai!A:ZZ' });
    const pRows = pRes.data.values || [];
    const pHeaders = pRows[0]?.map(h => h.toLowerCase()) || [];
    const pNipIdx = pHeaders.indexOf('nip');
    const nipAtasanIdx = pHeaders.indexOf('nip_atasan');
    let isAtasan = false;
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
            if (key === 'foto profil') key = 'foto_profil';
            if (key === 'status aktif') key = 'status_aktif';
            pegawaiData[key] = pRows[i][idx] || '';
          });
          if (!pegawaiData.role) pegawaiData.role = (pegawaiData.nip === 'admin') ? 'super_admin' : 'pegawai';
          if (!pegawaiData.nip_atasan) pegawaiData.nip_atasan = '';
        }
        if (nipAtasanIdx !== -1 && pRows[i][nipAtasanIdx]?.trim() === nip.trim()) {
          isAtasan = true;
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

    // IDP
    let idpData: any[] = [];
    try {
      const iRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'idp!A:Z' });
      const iRows = iRes.data.values || [];
      const iHeaders = iRows[0]?.map(h => h.toLowerCase()) || [];
      const iNipIdx = iHeaders.indexOf('nip');
      if (iNipIdx !== -1) {
        for (let i=1; i<iRows.length; i++) {
          const rowNip = iRows[i][iNipIdx];
          if (rowNip && rowNip.toString().trim() === nip.trim()) {
            const row: any = { _rowIndex: i + 1 };
            iHeaders.forEach((h, idx) => {
              row[h] = iRows[i][idx] || '';
            });
            idpData.push(row);
          }
        }
      }
    } catch(e) {}

    return NextResponse.json({ 
      success: true, 
      data: { pegawai: pegawaiData, isAtasan, sertifikasi: sertifikasiData, pendidikan: pendidikanData, idp: idpData } 
    });
  } catch (e: any) { return NextResponse.json({ success: false }, { status: 500 }); }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { nip, nama, status_pegawai, pangkat, golongan, jenkel, jabatan, unit_kerja, status_aktif, role, nip_atasan } = body;
    if (!nip) return NextResponse.json({ success: false }, { status: 400 });

    const sheets = getGoogleSheets();
    
    const pRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pegawai!A:ZZ' });
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
    
    // Status Aktif
    if (status_aktif !== undefined) {
      let statusAktifIdx = pHeaders.indexOf('status aktif');
      if (statusAktifIdx === -1) {
        statusAktifIdx = pHeaders.length;
        pHeaders.push('status aktif');
        pRows[0].push('status aktif');
      }
      while (newRow.length <= statusAktifIdx) newRow.push('');
      newRow[statusAktifIdx] = status_aktif;
    }

    let headersUpdated = false;

    if (role !== undefined) {
      let roleIdx = pHeaders.indexOf('role');
      if (roleIdx === -1) {
        roleIdx = pHeaders.length;
        pHeaders.push('role');
        pRows[0].push('role');
        headersUpdated = true;
      }
      while (newRow.length <= roleIdx) newRow.push('');
      newRow[roleIdx] = role;
    }

    if (nip_atasan !== undefined) {
      let nipAtasanIdx = pHeaders.indexOf('nip_atasan');
      if (nipAtasanIdx === -1) {
        nipAtasanIdx = pHeaders.length;
        pHeaders.push('nip_atasan');
        pRows[0].push('nip_atasan');
        headersUpdated = true;
      }
      while (newRow.length <= nipAtasanIdx) newRow.push('');
      newRow[nipAtasanIdx] = nip_atasan;
    }

    const foto_profil = body.foto_profil;

    if (foto_profil !== undefined) {
      let fotoIdx = pHeaders.indexOf('foto profil');
      if (fotoIdx === -1) {
        fotoIdx = pHeaders.length;
        pHeaders.push('foto profil');
        pRows[0].push('foto profil');
        headersUpdated = true;
      }
      while (newRow.length <= fotoIdx) newRow.push('');
      newRow[fotoIdx] = foto_profil;
    }
    
    while (newRow.length < pHeaders.length) {
      newRow.push('');
    }

    const endColumn = getColumnName(pHeaders.length - 1);
    
    const batchRequests = [
      { range: `pegawai!A${rowIndex}:${endColumn}${rowIndex}`, values: [newRow] }
    ];
    if (headersUpdated) {
      batchRequests.unshift({ range: `pegawai!A1:${endColumn}1`, values: [pRows[0]] });
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: GOOGLE_SHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: batchRequests
      }
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
