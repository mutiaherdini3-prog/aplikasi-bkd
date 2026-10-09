import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

    // Validasi ukuran file (maks 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Ukuran file terlalu besar (maksimal 10MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let finalUrl = '';

    // 1. Upload ke cloud storage (Catbox.moe) - Tidak memerlukan akses tulis disk lokal (aman untuk Vercel Serverless)
    try {
      const uploadForm = new FormData();
      uploadForm.append('reqtype', 'fileupload');
      const blob = new Blob([buffer], { type: file.type });
      uploadForm.append('fileToUpload', blob, file.name || 'foto_pimpinan.png');

      const catboxRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: uploadForm,
      });

      if (catboxRes.ok) {
        const urlText = await catboxRes.text();
        if (urlText && urlText.startsWith('http')) {
          finalUrl = urlText.trim();
        }
      }
    } catch (cloudErr) {
      console.warn('Cloud image upload failed, checking local filesystem fallback:', cloudErr);
    }

    // 2. Jika cloud gagal dan berada di lingkungan lokal (bukan Vercel read-only), simpan ke public/uploads/
    if (!finalUrl && !process.env.VERCEL) {
      try {
        const safeName = (file.name || 'foto.png').replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `pimpinan-${Date.now()}-${safeName}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const localFilePath = path.join(uploadDir, fileName);
        await fs.promises.writeFile(localFilePath, buffer);
        finalUrl = `/uploads/${fileName}`;
      } catch (fsErr) {
        console.warn('Local FS write failed:', fsErr);
      }
    }

    // 3. Fallback terakhir jika cloud gagal: gunakan data URI Base64 jika ukuran file < 500KB
    if (!finalUrl) {
      if (file.size <= 500 * 1024) {
        const base64 = buffer.toString('base64');
        finalUrl = `data:${file.type};base64,${base64}`;
      } else {
        return NextResponse.json({
          success: false,
          error: 'Gagal mengunggah foto ke server cloud. Mohon pastikan koneksi internet stabil atau gunakan foto dengan ukuran lebih kecil (di bawah 500KB).'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      url: finalUrl,
    });
  } catch (error: any) {
    console.error('Error in upload-profil route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
