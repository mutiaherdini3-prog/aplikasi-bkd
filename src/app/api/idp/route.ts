import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nip = searchParams.get('nip');
    if (!nip) return NextResponse.json({ success: false, message: 'Missing NIP' }, { status: 400 });

    const idpData = await request.json();
    if (!Array.isArray(idpData) || idpData.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
    }

    const sheets = getGoogleSheets();
    const rows = idpData.map((item: any) => [
      nip,
      item.jenis_kompetensi || '',
      item.jenis_pengembangan || '',
      item.jalur_pengembangan || '',
      item.penyelenggara || '',
      item.waktu_pelaksanaan_awal || '',
      item.waktu_pelaksanaan_akhir || '',
      item.jp || '',
      item.anggaran || '',
      item.status || 'Menunggu Persetujuan'
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'idp!A:Z',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Digunakan oleh admin untuk approve/reject
    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get('rowIndex');
    const status = searchParams.get('status');

    if (!rowIndex || !status) return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });

    const sheets = getGoogleSheets();
    
    // Status is the 10th column (J)
    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `idp!J${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[status]] }
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
