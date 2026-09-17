import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

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
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ success: false }, { status: 500 }); }
}
