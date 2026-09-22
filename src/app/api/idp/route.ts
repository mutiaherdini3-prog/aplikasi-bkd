import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

export const dynamic = 'force-dynamic';

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
      item.status || 'Menunggu Persetujuan Ketua',
      item.nip_ketua || '',
      item.nama_ketua || ''
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
    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get('rowIndex');
    
    if (!rowIndex) return NextResponse.json({ success: false, message: 'Missing rowIndex parameter' }, { status: 400 });

    const sheets = getGoogleSheets();
    
    // Check if body exists (for full update) or if it's just a status update via query params
    let updateData = null;
    try {
      updateData = await request.json();
    } catch(e) {}

    const status = searchParams.get('status');

    if (updateData && Object.keys(updateData).length > 0) {
      // Full row update
      const { nip, jenis_kompetensi, jenis_pengembangan, jalur_pengembangan, penyelenggara, waktu_pelaksanaan_awal, waktu_pelaksanaan_akhir, jp, anggaran, status: newStatus, nip_ketua, nama_ketua } = updateData;
      
      const newRow = [
        nip || '',
        jenis_kompetensi || '',
        jenis_pengembangan || '',
        jalur_pengembangan || '',
        penyelenggara || '',
        waktu_pelaksanaan_awal || '',
        waktu_pelaksanaan_akhir || '',
        jp || '',
        anggaran || '',
        newStatus || 'Menunggu Persetujuan Ketua',
        nip_ketua || '',
        nama_ketua || ''
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `idp!A${rowIndex}:L${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] }
      });
    } else if (status) {
      // Only status update (J column)
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `idp!J${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[status]] }
      });
    } else {
      return NextResponse.json({ success: false, message: 'No update data provided' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get('rowIndex');
    
    if (!rowIndex) return NextResponse.json({ success: false, error: 'Missing rowIndex' }, { status: 400 });

    const sheets = getGoogleSheets();
    const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId: GOOGLE_SHEET_ID });
    const idpSheet = sheetInfo.data.sheets?.find(s => s.properties?.title === 'idp');
    
    if (idpSheet && idpSheet.properties?.sheetId !== undefined) {
      const idx = parseInt(rowIndex, 10) - 1; // 0-based index for dimension
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_SHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: idpSheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: idx,
                endIndex: idx + 1
              }
            }
          }]
        }
      });
    } else {
      // Fallback: Clear the row if batchUpdate fails or sheetId not found
      await sheets.spreadsheets.values.clear({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `idp!A${rowIndex}:Z${rowIndex}`
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
