import { NextResponse } from 'next/server';
import { getGoogleDrive, GOOGLE_DRIVE_FOLDER_ID } from '@/lib/google';
import { Readable } from 'stream';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const drive = getGoogleDrive();
    
    // Create a readable stream from the buffer
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

    // Upload ke Google Drive
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
    const rawDriveUrl = driveRes.data.webViewLink as string;

    // Ubah link drive menjadi /preview agar bisa masuk ke dalam iframe (Google memblokir /view di dalam iframe)
    const previewUrl = rawDriveUrl.replace('/view?usp=drivesdk', '/preview').replace('/view', '/preview');

    // Dapatkan host (misalnya localhost:3000)
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    
    // Bungkus link Google Drive dengan halaman custom viewer kita agar ada tombol "Kembali"
    const wrappedUrl = `${protocol}://${host}/view?url=${encodeURIComponent(previewUrl)}`;

    // Beri izin publik agar bisa dilihat oleh siapapun yang memiliki link
    if (fileId) {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        }
      });
    }

    return NextResponse.json({ success: true, url: wrappedUrl, fileId: fileId });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
