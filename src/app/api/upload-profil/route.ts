import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getGoogleDrive, GOOGLE_DRIVE_FOLDER_ID } from '@/lib/google';
import { Readable } from 'stream';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan' }, { status: 400 });
    }

    // Validasi ukuran file (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Ukuran file terlalu besar (maksimal 5MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Bersihkan nama file
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `pimpinan-${Date.now()}-${safeName}`;

    // 1. Simpan secara lokal ke public/uploads/ agar cepat di-load
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const localFilePath = path.join(uploadDir, fileName);
    await fs.promises.writeFile(localFilePath, buffer);

    let finalUrl = `/uploads/${fileName}`;

    // 2. Upload cadangan ke Google Drive jika tersedia
    try {
      const drive = getGoogleDrive();
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const driveRes = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: GOOGLE_DRIVE_FOLDER_ID ? [GOOGLE_DRIVE_FOLDER_ID] : undefined,
        },
        media: {
          mimeType: file.type,
          body: stream,
        },
        fields: 'id, webViewLink'
      });

      const fileId = driveRes.data.id;
      if (fileId) {
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          }
        });
        // Jika di deploy ke platform serverless seperti Vercel di mana public/uploads bersifat ephemeral,
        // kita bisa tetap mengandalkan thumbnail drive atau local url.
        // Tapi thumbnail Google Drive juga bisa disediakan.
      }
    } catch (driveErr) {
      console.warn('Google Drive backup upload failed, using local upload:', driveErr);
    }

    return NextResponse.json({ 
      success: true, 
      url: finalUrl,
      fileName 
    });
  } catch (error: any) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
