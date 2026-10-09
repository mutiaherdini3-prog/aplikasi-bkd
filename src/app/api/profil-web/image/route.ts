import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target') || 'bupati'; // 'bupati' | 'wakil'

  const defaultLocalPath = `/img/${target === 'bupati' ? 'bupati1' : 'bupati2'}.png`;

  try {
    const sheets = getGoogleSheets();
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

    if (!photoUrl || photoUrl === defaultLocalPath) {
      return NextResponse.redirect(new URL(defaultLocalPath, request.url));
    }

    // Jika berupa Base64 Data URI
    if (photoUrl.startsWith('data:image/')) {
      const matches = photoUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (matches) {
        const mime = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        return new Response(buffer, {
          headers: {
            'Content-Type': mime,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      }
    }

    // Jika berupa URL eksternal (cloud storage, drive, dll), server Next.js yang mengunduh dan meneruskan bytes gambar
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

    return NextResponse.redirect(new URL(defaultLocalPath, request.url));
  } catch (err) {
    console.error('Image proxy error:', err);
    return NextResponse.redirect(new URL(defaultLocalPath, request.url));
  }
}
