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

    const drive = getGoogleDrive();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null); 

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

    const response = await drive.files.create({
      requestBody: { name: fileName, parents: [GOOGLE_DRIVE_FOLDER_ID] },
      media: { mimeType: file.type || 'application/octet-stream', body: stream },
      fields: 'id, webViewLink, webContentLink',
    });

    try {
      await drive.permissions.create({
        fileId: response.data.id as string,
        requestBody: { role: 'reader', type: 'anyone' },
      });
    } catch (e) {
      console.warn('Set perm error', e);
    }

    return NextResponse.json({ success: true, url: response.data.webViewLink, fileId: response.data.id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
