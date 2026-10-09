import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target') || 'bupati'; // 'bupati' | 'wakil'

  const defaultLocalPath = `/img/${target === 'bupati' ? 'bupati1' : 'bupati2'}.png`;

  try {
    const sheets = getGoogleSheets();

    // 1. Cek apakah ada foto tersimpan dalam format chunk di sheet 'foto_chunks'
    try {
      const chunkRes = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'foto_chunks!A:C',
      });
      const rows = chunkRes.data.values || [];
      const matchingRows = rows
        .filter(r => r[0] === target)
        .sort((a, b) => Number(a[1]) - Number(b[1]));

      if (matchingRows.length > 0) {
        const fullDataUri = matchingRows.map(r => r[2] || '').join('');
        if (fullDataUri.startsWith('data:image/')) {
          const mimeMatch = fullDataUri.match(/^data:([^;]+);base64,/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/png';
          const base64Data = fullDataUri.replace(/^data:[^;]+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');

          return new Response(buffer, {
            headers: {
              'Content-Type': mime,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          });
        }
      }
    } catch (chunkErr) {
      console.warn('Error reading foto_chunks:', chunkErr);
    }

    // 2. Cek apakah ada URL tersimpan di sheet 'profil_web'
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'profil_web!A:B',
      });
      const rows = res.data.values || [];
      let photoUrl = '';

      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0]?.trim() === `${target}_foto`) {
          photoUrl = rows[i][1]?.trim();
          break;
        }
      }

      if (photoUrl && photoUrl !== defaultLocalPath && !photoUrl.includes('/api/profil-web/image')) {
        if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
          const imgRes = await fetch(photoUrl);
          if (imgRes.ok) {
            const contentType = imgRes.headers.get('content-type') || 'image/png';
            const arrayBuf = await imgRes.arrayBuffer();
            return new Response(Buffer.from(arrayBuf), {
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              },
            });
          }
        }
      }
    } catch (sheetErr) {
      console.warn('Error reading profil_web:', sheetErr);
    }

    // 3. Fallback: arahkan ke foto bawaan lokal
    return NextResponse.redirect(new URL(defaultLocalPath, request.url));
  } catch (err) {
    console.error('Image proxy error:', err);
    return NextResponse.redirect(new URL(defaultLocalPath, request.url));
  }
}
