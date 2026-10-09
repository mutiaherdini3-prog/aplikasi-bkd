import { NextResponse } from 'next/server';
import { getGoogleDrive, getGoogleSheets, GOOGLE_DRIVE_FOLDER_ID, GOOGLE_SHEET_ID } from '@/lib/google';
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

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';

    let fileUrl = '';
    let fileId = '';
    let driveUploaded = false;

    // 1. Coba upload ke Google Drive terlebih dahulu
    try {
      const drive = getGoogleDrive();
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

      const driveRes = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: GOOGLE_DRIVE_FOLDER_ID ? [GOOGLE_DRIVE_FOLDER_ID] : undefined,
        },
        media: {
          mimeType: file.type || 'application/octet-stream',
          body: stream,
        },
        fields: 'id, webViewLink',
      });

      const dId = driveRes.data.id;
      const rawDriveUrl = driveRes.data.webViewLink as string;

      if (dId && rawDriveUrl) {
        fileId = dId;
        const previewUrl = rawDriveUrl.replace('/view?usp=drivesdk', '/preview').replace('/view', '/preview');
        fileUrl = `${protocol}://${host}/view?url=${encodeURIComponent(previewUrl)}`;

        try {
          await drive.permissions.create({
            fileId: dId,
            requestBody: {
              role: 'reader',
              type: 'anyone',
            },
          });
        } catch (permErr) {
          console.warn('Izin publik Drive dilewati:', permErr);
        }

        driveUploaded = true;
      }
    } catch (driveErr: any) {
      console.warn('Google Drive error (' + (driveErr.message || 'Drive unavailable') + '). Beralih otomatis ke Dokumen Storage Database...');
    }

    // 2. Fallback Otomatis: Jika Google Drive gagal (invalid_grant/quota/token expired),
    // simpan ke Google Sheets dokumen_storage dengan Service Account (100% Permanen & Anti-Kadaluarsa)
    if (!driveUploaded) {
      const sheets = getGoogleSheets();
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const base64Data = buffer.toString('base64');
      const chunkSize = 30000;
      const totalChunks = Math.ceil(base64Data.length / chunkSize);
      const rows = [];
      const now = new Date().toISOString();

      for (let i = 0; i < totalChunks; i++) {
        const chunk = base64Data.substring(i * chunkSize, (i + 1) * chunkSize);
        rows.push([
          docId,
          file.name,
          file.type || 'application/octet-stream',
          now,
          i,
          totalChunks,
          chunk,
        ]);
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'dokumen_storage!A:G',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: rows,
        },
      });

      const cleanFileName = encodeURIComponent(file.name.replace(/\s+/g, '_'));
      const directDocUrl = `${protocol}://${host}/api/dokumen?id=${docId}&name=${cleanFileName}`;
      fileUrl = `${protocol}://${host}/view?url=${encodeURIComponent(directDocUrl)}`;
      fileId = docId;
    }

    return NextResponse.json({ success: true, url: fileUrl, fileId: fileId });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
