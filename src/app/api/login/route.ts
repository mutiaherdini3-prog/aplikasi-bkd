import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

export async function POST(request: Request) {
  try {
    const { action, nip, password } = await request.json();
    if (!nip || !password) return NextResponse.json({ success: false }, { status: 400 });

    const sheets = getGoogleSheets();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'pegawai!A:Z' });
    const rows = res.data.values;
    if (!rows || rows.length === 0) return NextResponse.json({ success: false }, { status: 404 });

    const headers = rows[0].map(h => h.toLowerCase());
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
      
      // Defaults for missing columns
      if (!data['role']) data['role'] = (data.nip === 'admin') ? 'super_admin' : 'pegawai';
      if (!data['nip_atasan']) data['nip_atasan'] = '';
      
      return NextResponse.json({ success: true, data });
    }
    
    if (action === 'reset-password') {
      const col = String.fromCharCode(65 + passIdx);
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID, range: `pegawai!${col}${rowIndex + 1}`, valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[password.trim()]] }
      });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false });
  } catch (e: any) { return NextResponse.json({ success: false }, { status: 500 }); }
}
