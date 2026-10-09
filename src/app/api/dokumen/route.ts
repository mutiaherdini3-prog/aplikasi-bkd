import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Dokumen ID tidak ditemukan', { status: 400 });
    }

    const sheets = getGoogleSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'dokumen_storage!A2:G',
    });

    const rows = res.data.values || [];
    const matchingRows = rows.filter((r) => r[0] === id);

    if (matchingRows.length === 0) {
      return new NextResponse('Dokumen tidak ditemukan di database', { status: 404 });
    }

    // Sort by chunk_index
    matchingRows.sort((a, b) => parseInt(a[4] || '0') - parseInt(b[4] || '0'));

    const fileName = matchingRows[0][1] || 'dokumen';
    const mimeType = matchingRows[0][2] || 'application/octet-stream';
    const fullBase64 = matchingRows.map((r) => r[6] || '').join('');

    const buffer = Buffer.from(fullBase64, 'base64');

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error fetching dokumen:', error);
    return new NextResponse('Terjadi kesalahan saat memuat dokumen: ' + error.message, { status: 500 });
  }
}
