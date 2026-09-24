import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID, getCachedSheetData } from '@/lib/google';
import { revalidateTag } from 'next/cache';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get('rowIndex');
    if (!rowIndex) return NextResponse.json({ success: false }, { status: 400 });

    const sheets = getGoogleSheets();
    const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId: GOOGLE_SHEET_ID });
    const targetSheet = sheetInfo.data.sheets?.find(s => s.properties?.title === 'pendidikan');
    if (!targetSheet) throw new Error(`Sheet not found`);
    
    const rowIdx = parseInt(rowIndex, 10) - 1;
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_SHEET_ID,
        requestBody: { requests: [{ deleteDimension: { range: { sheetId: targetSheet.properties?.sheetId, dimension: 'ROWS', startIndex: rowIdx, endIndex: rowIdx + 1 } } }] }
    });
    revalidateTag('google-sheets', { expire: 0 });
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ success: false }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sheets = getGoogleSheets();
    
    // Fetch headers first to know column order
    const sRows = await getCachedSheetData('pendidikan!A:Z');
    const sHeaders = sRows[0] || [];
    
    // Construct new row matching header order
    const newRow = sHeaders.map((h: string) => {
      const key = h.toLowerCase();
      return body[key] !== undefined ? body[key] : '';
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'pendidikan!A:Z',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });

    revalidateTag('google-sheets', { expire: 0 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
