import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Pastikan folder public/uploads/sertifikat ada
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'sertifikat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Nama file unik
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const path = join(uploadDir, fileName);
    
    await writeFile(path, buffer);

    // URL lokal yang bisa diakses di frontend
    const localUrl = `/uploads/sertifikat/${fileName}`;

    return NextResponse.json({ success: true, url: localUrl });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
