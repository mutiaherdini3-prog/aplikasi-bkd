import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
    });
  } catch (error: any) {
    console.error('Error in upload-profil route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
