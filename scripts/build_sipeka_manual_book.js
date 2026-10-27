const fs = require('fs');
const path = require('path');
const {
  Document,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  Packer,
  HeadingLevel
} = require('docx');

function getDimensions(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      return { width, height };
    }
  } catch (e) {}
  return { width: 1200, height: 750 };
}

function calculateImageDimensions(filePath) {
  const { width, height } = getDimensions(filePath);
  const ratio = height / width;

  let targetWidth = 460;
  let targetHeight = Math.round(targetWidth * ratio);

  // Jika gambar sangat tinggi (portrait), batas maksimal tinggi adalah 380 pt
  if (targetHeight > 380) {
    targetHeight = 380;
    targetWidth = Math.round(targetHeight / ratio);
  }

  return { width: targetWidth, height: targetHeight };
}

function createHeading(text, level = 1) {
  const size = level === 1 ? 32 : (level === 2 ? 28 : 24); // half-points: 16pt, 14pt, 12pt
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 300, after: 140 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        font: 'Times New Roman',
        size: size,
        color: '1E3A8A'
      })
    ]
  });
}

function createParagraph(text, isBold = false) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFY,
    spacing: { before: 80, after: 120, line: 276 }, // 1.15 line spacing
    children: [
      new TextRun({
        text: text,
        bold: isBold,
        font: 'Times New Roman',
        size: 24 // 12pt
      })
    ]
  });
}

function createImageCaption(captionText) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 140 },
    children: [
      new TextRun({
        text: captionText,
        bold: true,
        italics: true,
        font: 'Times New Roman',
        size: 22, // 11pt
        color: '334155'
      })
    ]
  });
}

function createCodeBlockTitle(titleText) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 160, after: 60 },
    children: [
      new TextRun({
        text: '💻 ' + titleText,
        bold: true,
        font: 'Times New Roman',
        size: 22, // 11pt
        color: '0F172A'
      })
    ]
  });
}

function createCodeTable(codeText) {
  const lines = codeText.trim().split('\n');
  const paragraphs = lines.map(line => {
    return new Paragraph({
      spacing: { before: 20, after: 20, line: 220 },
      children: [
        new TextRun({
          text: line,
          font: 'Consolas',
          size: 17, // 8.5pt
          color: '1E293B'
        })
      ]
    });
  });

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: paragraphs,
            shading: {
              type: ShadingType.CLEAR,
              fill: 'F8FAFC'
            },
            margins: {
              top: 140,
              bottom: 140,
              left: 180,
              right: 180
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              left: { style: BorderStyle.SINGLE, size: 12, color: '2563EB' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
            }
          })
        ]
      })
    ]
  });
}

async function buildDocument() {
  const imgDir = path.resolve('/Users/mutiaherdiniicloud.com/Downloads/bkd/bkd-app/docs/manual-book/sipeka/gambar');

  // Daftar lengkap 27 item sesuai susunan asli SIPEKA.docx
  const sections = [
    // ==========================================
    // ROLE: PEGAWAI
    // ==========================================
    {
      roleTitle: 'BAGIAN I: PANDUAN PENGGUNA - PEGAWAI ASN',
      isNewRole: true,
      num: 1,
      imageFile: 'image3.png',
      caption: 'Gambar 1. Halaman Login Sistem Informasi Pengembangan Kompetensi (SIPJP-BABAR)',
      explanation: 'Halaman Login merupakan pintu masuk utama bagi seluruh Pegawai Aparatur Sipil Negara (ASN) dan Administrator Pemerintah Kabupaten Bangka Barat. Pada halaman ini, pengguna memasukkan Nomor Induk Pegawai (NIP) dan kata sandi yang telah terdaftar. Sistem secara otomatis memvalidasi kredensial pengguna, memeriksa status keaktifan akun, dan mendeteksi hak akses (role) pengguna—apakah Pegawai biasa, Admin/Atasan OPD, Admin BKPSDMD, atau Super Admin—sebelum diarahkan ke dashboard kerja masing-masing.',
      codeTitle: 'Source Code Terkait: Logika Autentikasi & Routing Berdasarkan Hak Akses (src/app/login/page.tsx)',
      code: `// Handler Autentikasi Pengguna & Penentuan Dashboard Sesuai Role
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nip, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      setError(data.message || 'NIP atau kata sandi tidak valid!');
      return;
    }

    // Simpan session pengguna di sessionStorage
    sessionStorage.setItem('sipjp_user', JSON.stringify(data.user));

    // Arahkan ke dashboard yang sesuai dengan hak akses pengguna
    if (data.user.role === 'super_admin' || data.user.role === 'admin_bkpsdmd') {
      router.push('/admin');
    } else if (data.user.role === 'admin' || data.user.role === 'atasan_opd') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  } catch (err: any) {
    setError('Gagal menghubungi server database. Silakan coba lagi.');
  } finally {
    setIsLoading(false);
  }
};`
    },
    {
      num: 2,
      imageFile: 'image14.png',
      caption: 'Gambar 2. Tampilan Dashboard Pegawai ASN dengan Banner Pengingat Kepatuhan JP',
      explanation: 'Halaman Dashboard Pegawai menampilkan rangkuman data kepegawaian, navigasi layanan pengembangan kompetensi, serta sistem pengingat otomatis pemenuhan Jam Pelajaran (JP) tahunan. Sesuai ketentuan pengembangan kompetensi ASN, standar minimal per tahun adalah 20 JP bagi PNS dan 24 JP bagi PPPK/P3K. Pada bagian atas dashboard, sistem menyajikan spanduk pengingat cerdas bergradien lembut (kuning untuk status Belum Memenuhi disertai informasi sisa kekurangan JP dan tombol cepat "Tambah Pelatihan", atau hijau untuk status Memenuhi). Jika ASN belum melengkapi email resmi, spanduk biru notifikasi juga ditampilkan. Pada kartu profil kepegawaian, disematkan lencana status keaktifan ASN dan status kepatuhan JP terpadu pada baris Total Jam Pelajaran.',
      codeTitle: 'Source Code Terkait: Kalkulasi Target Jam Pelajaran, Logika Pengingat & Render Banner (src/app/dashboard/page.tsx)',
      code: `// 1. Kalkulasi Akumulasi Jam Pelajaran (JP) dari Seluruh Sertifikasi Tersimpan
let sum = 0;
result.data.sertifikasi.forEach((s: any) => sum += (s.jumlah_jp || 0));
setTotalJP(sum);

// 2. Logika Penentuan Target Jam Pelajaran: PNS minimal 20 JP, PPPK/P3K minimal 24 JP
const statusPegawaiStr = (pegawai?.status_pegawai || '').toUpperCase();
const isPPPK = statusPegawaiStr.includes('P3K') || statusPegawaiStr.includes('PPPK');
const targetJP = isPPPK ? 24 : 20;
const statusLabel = isPPPK ? 'P3K' : 'PNS';
const isMemenuhiJP = totalJP >= targetJP;
const persentaseJP = Math.min(100, Math.round((totalJP / targetJP) * 100));
const sisaJP = Math.max(0, targetJP - totalJP);
const statusKepatuhanText = \`\${statusLabel} \${targetJP} JP (\${isMemenuhiJP ? 'Memenuhi' : 'Belum Memenuhi'})\`;

return (
  <div className="container mt-4">
    {/* Banner Pengingat Email Jika Belum Dilengkapi */}
    {pegawai && (!pegawai.email || pegawai.email.trim() === '') && (
      <div className="alert border-0 shadow-sm d-flex flex-wrap align-items-center justify-content-between p-3 mb-4 rounded-3" 
           style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)', borderLeft: '5px solid #0284c7' }}>
        <div className="d-flex align-items-center mb-2 mb-md-0">
          <i className="bi bi-envelope-exclamation-fill text-primary fs-3 me-3"></i>
          <div>
            <strong className="text-dark d-block">Alamat Email Belum Dilengkapi</strong>
            <small className="text-secondary">Silakan lengkapi email Anda.</small>
          </div>
        </div>
        <a href="/edit-profil" className="btn btn-primary btn-sm px-3 fw-bold rounded-pill text-nowrap shadow-sm">
          <i className="bi bi-pencil-square me-1"></i> Isi Email di Profil
        </a>
      </div>
    )}

    {/* Banner Pengingat Pemenuhan Jam Pelajaran (JP) */}
    <div 
      className="alert border-0 shadow-sm d-flex flex-wrap align-items-center justify-content-between p-3 mb-4 rounded-3" 
      style={{ 
        background: isMemenuhiJP 
          ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' 
          : 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', 
        borderLeft: \`5px solid \${isMemenuhiJP ? '#16a34a' : '#ca8a04'}\` 
      }}
    >
      <div className="d-flex align-items-center mb-2 mb-md-0">
        <i className={\`bi \${isMemenuhiJP ? 'bi-patch-check-fill text-success' : 'bi-bell-fill text-warning'} fs-3 me-3\`}></i>
        <div>
          <strong className="text-dark d-block">
            {isMemenuhiJP ? 'Standar Jam Pelajaran Terpenuhi' : 'Pengingat Pemenuhan Jam Pelajaran (JP)'}:{' '}
            <span className={isMemenuhiJP ? 'text-success' : 'text-warning-emphasis'}>
              {statusKepatuhanText}
            </span>
          </strong>
          <small className="text-secondary">
            {isMemenuhiJP 
              ? \`Target minimal \${statusLabel} (\${targetJP} JP per tahun) telah tercapai. Total capaian Anda saat ini: \${totalJP} JP.\`
              : \`Total saat ini: \${totalJP} JP. Anda masih membutuhkan \${sisaJP} JP lagi untuk memenuhi standar minimal \${statusLabel} (\${targetJP} JP per tahun).\`}
          </small>
        </div>
      </div>
      {!isMemenuhiJP && (
        <a href="/sertifikasi" className="btn btn-warning btn-sm px-3 fw-bold rounded-pill text-nowrap shadow-sm">
          <i className="bi bi-plus-circle me-1"></i> Tambah Pelatihan
        </a>
      )}
    </div>

    {/* Baris Total Jam Pelajaran (JP) dan Lencana Kepatuhan */}
    <div className="col-sm-6">
      <div className="info-label">Total Jam Pelajaran (JP)</div>
      <div className="d-flex align-items-center gap-2 mt-1">
        <div className="info-value mb-0" style={{ color: '#0284c7', fontWeight: 'bold' }}>
          {totalJP} JP
        </div>
        <span 
          className={\`badge rounded-pill fw-normal px-2 py-1 \${isMemenuhiJP ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'}\`}
          style={{ fontSize: '0.78rem' }}
        >
          {statusKepatuhanText}
        </span>
      </div>
    </div>
  </div>
);`
    },
    {
      num: 3,
      imageFile: 'image10.png',
      caption: 'Gambar 3. Formulir Lengkapi Profil Kepegawaian & Unggah Foto ASN',
      explanation: 'Formulir Lengkapi Profil Kepegawaian (`/edit-profil`) digunakan oleh ASN untuk memutakhirkan biodata resmi kepegawaian. Form ini mencakup unggah foto profil (mendukung file gambar beresolusi tinggi), Nama Lengkap beserta Gelar Akademik, Email Notifikasi aktif (untuk menerima status persetujuan IDP), Status Kepegawaian (PNS atau PPPK), Golongan/Pangkat yang menyesuaikan secara dinamis, Jenis Kelamin, Jabatan fungsional/struktural, dan Satuan Unit Kerja di lingkungan Pemkab Bangka Barat.',
      codeTitle: 'Source Code Terkait: Pembaruan Profil & Opsi Golongan Dinamis (src/app/edit-profil/page.tsx)',
      code: `// Sinkronisasi Opsi Golongan Sesuai Pilihan Status Pegawai (PNS vs PPPK)
const getGolonganOptions = () => {
  if (formData.status_pegawai === 'PNS') {
    return [
      "I/a - Juru Muda", "I/b - Juru Muda Tk. I", "I/c - Juru", "I/d - Juru Tk. I",
      "II/a - Pengatur Muda", "II/b - Pengatur Muda Tk. I", "II/c - Pengatur", "II/d - Pengatur Tk. I",
      "III/a - Penata Muda", "III/b - Penata Muda Tk. I", "III/c - Penata", "III/d - Penata Tk. I",
      "IV/a - Pembina", "IV/b - Pembina Tk. I", "IV/c - Pembina Utama Muda", "IV/d - Pembina Utama Madya", "IV/e - Pembina Utama"
    ];
  } else if (formData.status_pegawai === 'PPPK') {
    return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII"]
      .map(g => \`Golongan \${g}\`);
  }
  return [];
};

// Handler Simpan Data Pemutakhiran Profil Pegawai
const handleSaveProfile = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
    const res = await fetch('/api/pegawai', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const result = await res.json();
    if (result.success) {
      alert('Profil kepegawaian berhasil diperbarui!');
      router.push('/dashboard');
    }
  } finally {
    setIsSubmitting(false);
  }
};`
    },
    {
      num: 4,
      imageFile: 'image9.png',
      caption: 'Gambar 4. Formulir Input Riwayat Sertifikasi - Langkah 1 (Masukan Data)',
      explanation: 'Formulir Riwayat Sertifikasi menggunakan alur wizard 3 langkah terstruktur. Pada Langkah 1 (Masukan Data), pegawai mengisikan rincian pelatihan atau kursus pengembangan kompetensi yang telah diikuti, meliputi Jenis Sertifikasi, Jenis Kursus, Nama Kursus/Diklat, Klasifikasi Kursus, Nomor Sertifikat Resmi, Institusi Penyelenggara (seperti BKPSDMD, Kemendagri, BKN, LAN), Tanggal Mulai dan Berakhir, Tahun Pelaksanaan, Durasi Jam Pelajaran (JP), Pejabat Penandatangan, dan Tipe Biaya (Gratis/Berbayar). Pengguna juga dapat menekan tombol "+ Tambah Pelatihan Lainnya" untuk mendaftarkan beberapa sertifikat sekaligus.',
      codeTitle: 'Source Code Terkait: Validasi Input Pelatihan Langkah 1 (src/app/sertifikasi/page.tsx)',
      code: `// Validasi Kelengkapan Kolom Wajib Pada Formulir Langkah 1
const validateStep1 = () => {
  for (const k of kegiatans) {
    if (
      !k.jenis_sertifikasi ||
      !k.jenis_kursus ||
      !k.nama_kursus ||
      !k.klasifikasi_kursus ||
      !k.institusi_penyelenggara ||
      !k.nomor_sertifikasi ||
      !k.tanggal_mulai ||
      !k.tanggal_akhir ||
      !k.tahun ||
      !k.jumlah_jp ||
      !k.pejabat ||
      (k.biaya_tipe !== 'Gratis' && !k.biaya_nominal)
    ) {
      alert('Mohon lengkapi semua kolom bertanda bintang (*) di Langkah 1!');
      return false;
    }
  }
  return true;
};

const handleNext = (targetStep: number) => {
  if (targetStep === 2 && !validateStep1()) return;
  if (targetStep === 3 && !validateStep2()) return;
  setStep(targetStep);
};`
    },
    {
      num: 5,
      imageFile: 'image13.png',
      caption: 'Gambar 5. Formulir Input Riwayat Sertifikasi - Langkah 2 (Upload Dokumen)',
      explanation: 'Pada Langkah 2 (Upload Dokumen Sertifikat), pegawai mengunggah berkas sertifikat asli sebagai bukti autentik pemenuhan jam pelajaran. Sistem mendukung format dokumen PDF, Microsoft Word (.doc, .docx), serta berkas gambar (JPG, JPEG, PNG) dengan batas kapasitas maksimal hingga 5 MB per berkas. Saat file dipilih, sistem secara otomatis melakukan pra-unggah (pre-upload) di latar belakang menuju Cloud Storage (Google Drive API / Database Storage) dan menyediakan pratinjau dokumen langsung.',
      codeTitle: 'Source Code Terkait: Unggah Berkas Multi-Format & Penyimpanan Dokumen (src/app/sertifikasi/page.tsx)',
      code: `// Handler Pemilihan & Pra-Unggah Berkas Sertifikat (Mendukung PDF, Word, & Gambar)
const handleFileChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert(\`File \${file.name} terlalu besar! Ukuran maksimal berkas adalah 5MB.\`);
      e.target.value = '';
      return;
    }

    handleChange(id, 'file', file);
    handleChange(id, 'isUploading', true);

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setKegiatans(prev => prev.map(k => k.id === id ? { ...k, uploadedUrl: data.url, isUploading: false } : k));
        } else {
          setKegiatans(prev => prev.map(k => k.id === id ? { ...k, isUploading: false, uploadError: data.error } : k));
        }
      })
      .catch(err => {
        setKegiatans(prev => prev.map(k => k.id === id ? { ...k, isUploading: false, uploadError: err.message } : k));
      });
  }
};`
    },
    {
      num: 6,
      imageFile: 'image11.png',
      caption: 'Gambar 6. Formulir Input Riwayat Sertifikasi - Langkah 3 (Ringkasan & Simpan Final)',
      explanation: 'Pada Langkah 3 (Ringkasan), sistem menampilkan tabel ikhtisar seluruh kegiatan sertifikasi yang telah diinput beserta durasi JP dan tautan berkas dokumen pendukung. Pegawai diwajibkan mencentang kotak pernyataan kebenaran data: "Saya menyatakan data yang diisi benar dan dapat dipertanggungjawabkan". Setelah mencentang pernyataan tersebut, tombol "Simpan Final" akan aktif dan mengirimkan data secara permanen ke database Google Sheets/Cloud Storage, lalu mengarahkan pegawai kembali ke dashboard.',
      codeTitle: 'Source Code Terkait: Finalisasi Penyimpanan Sertifikasi ke Spreadsheet (src/app/sertifikasi/page.tsx)',
      code: `// Finalisasi & Penyimpanan Batch Kegiatan Sertifikasi ke Sistem Database
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!agree) {
    alert("Anda harus menyetujui pernyataan keabsahan data terlebih dahulu!");
    return;
  }

  setIsSubmitting(true);
  try {
    const insertRes = await fetch('/api/sertifikasi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nip: pegawai.nip,
        kegiatans: processedKegiatans
      })
    });

    if (insertRes.ok) {
      alert("✅ Seluruh data sertifikat berhasil disimpan ke database!");
      router.push('/dashboard');
    }
  } finally {
    setIsSubmitting(false);
  }
};`
    },
    {
      num: 7,
      imageFile: 'image12.png',
      caption: 'Gambar 7. Formulir Input Riwayat Pendidikan Formal Pegawai',
      explanation: 'Formulir Input Riwayat Pendidikan (`/pendidikan`) berfungsi untuk mencatatkan kualifikasi pendidikan formal terakhir yang ditempuh oleh ASN, mulai dari jenjang D3, D4/S1, S2, hingga S3. Pegawai mengisikan Tingkat Pendidikan dan Program Studi/Jurusan sesuai dengan ijazah asli yang sah. Data pendidikan ini terintegrasi langsung dengan profil kepegawaian untuk perhitungan kualifikasi kompetensi ASN daerah.',
      codeTitle: 'Source Code Terkait: Penyimpanan Riwayat Pendidikan Formal (src/app/pendidikan/page.tsx)',
      code: `// Pengiriman Data Riwayat Pendidikan Formal Pegawai ke Endpoint API
const handleSavePendidikan = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const res = await fetch('/api/pendidikan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nip: pegawaiNip,
        pendidikan: listPendidikan
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      alert('Data riwayat pendidikan berhasil diperbarui!');
      router.push('/dashboard');
    }
  } finally {
    setIsSubmitting(false);
  }
};`
    },
    {
      num: 8,
      imageFile: 'image19.png',
      caption: 'Gambar 8. Formulir Pengajuan Individual Development Plan (IDP)',
      explanation: 'Formulir Pengajuan Individual Development Plan (IDP) (`/idp`) digunakan pegawai untuk merencanakan kompetensi yang ingin ditingkatkan pada periode berjalan. Pegawai memilih Atasan (Ketua) Penilai di instansinya, menentukan Jenis Kompetensi (Teknis, Manajerial, Sosio Kultural), Bentuk Pengembangan (Diklat, Bimtek, E-Learning, Workshop, Mentoring), Penyelenggara, Waktu Pelaksanaan, Durasi JP yang ditargetkan, serta Estimasi Anggaran. Sistem menerapkan Alur Persetujuan Berlapis 2 Tahap: diverifikasi terlebih dahulu oleh Atasan OPD (Tahap 1), kemudian diputuskan secara final oleh Admin BKPSDMD (Tahap 2).',
      codeTitle: 'Source Code Terkait: Pengajuan Usulan Rencana IDP Pegawai (src/app/idp/page.tsx)',
      code: `// Pengajuan Usulan Rencana IDP Pegawai dengan Validasi Atasan Penilai
const handleSubmitIDP = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!atasanPenilai) {
    alert("Silakan pilih Atasan (Ketua) Penilai terlebih dahulu!");
    return;
  }

  const payload = {
    nip: pegawai.nip,
    nama_pegawai: pegawai.nama,
    atasan_nip: atasanPenilai.nip,
    atasan_nama: atasanPenilai.nama,
    rencana_idp: itemsIDP, // Rincian target kompetensi & jam pelajaran
    status_verifikasi: 'Menunggu Verifikasi OPD'
  };

  const res = await fetch('/api/idp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert('Usulan IDP berhasil dikirim ke Atasan OPD Anda!');
    router.push('/dashboard');
  }
};`
    },
    {
      num: 9,
      imageFile: 'image16.png',
      caption: 'Gambar 9. Dashboard Pegawai dengan Data Lengkap & Fitur Logout',
      explanation: 'Tampilan Dashboard Pegawai setelah profil, sertifikasi, pendidikan, dan IDP terisi secara komprehensif. Terlihat NIP terdaftar (NIP 123 - Pegawai A), status "ASN Aktif", data golongan/jabatan lengkap, serta capaian Jam Pelajaran (Total: 20 JP) yang telah memenuhi standar kewajiban tahunan. Di pojok kanan atas bilah navigasi, terdapat tombol "Keluar" (Logout) untuk mengakhiri sesi kerja pengguna secara aman dan menghapus token autentikasi dari memori peramban.',
      codeTitle: 'Source Code Terkait: Mekanisme Logout & Pembersihan Sesi Kerja (src/app/dashboard/page.tsx)',
      code: `// Fungsi Logout & Pembersihan Sesi Keamanan Pengguna
const handleLogout = () => {
  if (confirm("Apakah Anda yakin ingin keluar dari sistem SIPJP-BABAR?")) {
    sessionStorage.removeItem('sipjp_user');
    localStorage.removeItem('sipjp_token');
    router.push('/login');
  }
};

// Render Tombol Logout pada Header Navigasi
return (
  <nav className="navbar navbar-dark bg-dark px-4 py-3 d-flex justify-content-between">
    <div className="navbar-brand fw-bold">
      <i className="bi bi-shield-lock-fill me-2 text-info"></i> Portal SIPJP-BABAR
    </div>
    <div className="d-flex align-items-center gap-3">
      <span className="text-light small"><i className="bi bi-clock me-1"></i> Terakhir login: Baru saja</span>
      <button onClick={handleLogout} className="btn btn-outline-light btn-sm rounded-pill px-3">
        <i className="bi bi-box-arrow-right me-1"></i> Keluar
      </button>
    </div>
  </nav>
);`
    },

    // ==========================================
    // ROLE: ADMIN OPD
    // ==========================================
    {
      roleTitle: 'BAGIAN II: PANDUAN PENGGUNA - ADMIN / ATASAN OPD',
      isNewRole: true,
      num: 10,
      imageFile: 'image3.png',
      caption: 'Gambar 10. Halaman Login Akun Admin / Atasan OPD',
      explanation: 'Admin Organisasi Perangkat Daerah (OPD) atau Pejabat Penilai masuk melalui halaman login yang sama menggunakan NIP pimpinan/admin OPD yang telah diberikan hak akses khusus dalam database kepegawaian. Setelah proses otentikasi berhasil, sistem mengidentifikasi hak istimewa pengguna dan memberikan menu verifikasi bawahan pada portal kerja.',
      codeTitle: 'Source Code Terkait: Validasi Hak Akses Admin OPD (src/app/login/page.tsx)',
      code: `// Validasi Hak Akses Role Atasan / Admin Satuan Kerja OPD
if (data.user.role === 'admin' || data.user.is_atasan === true) {
  sessionStorage.setItem('user_role', 'admin');
  sessionStorage.setItem('opd_unit_kerja', data.user.unit_kerja);
  router.push('/admin'); // Membuka Portal Pengawasan OPD
}`
    },
    {
      num: 11,
      imageFile: 'image1.png',
      caption: 'Gambar 11. Dashboard Atasan OPD dengan Banner Standar JP Terpenuhi & Panel Approval IDP Tahap 1',
      explanation: 'Dashboard akun Atasan OPD (Kepala Unit Kerja / Sub-Admin Instansi) mengintegrasikan dua peran utama: peran ASN mandiri dan peran manajerial bawahan. Pada bagian atas, ditampilkan capaian JP pribadi pegawai (dalam contoh ini Pegawai B memiliki 20 JP dan berstatus PNS, sehingga sistem menampilkan banner hijau elegan "Standar Jam Pelajaran Terpenuhi: PNS 20 JP (Memenuhi)" serta lencana kepatuhan hijau). Di sisi navigasi, tersedia kartu pintasan hijau "Panel Admin" serta tombol "Dashboard Admin" di bilah atas. Pada bagian bawah halaman, tersemat modul khusus "Persetujuan IDP Bawahan (Tahap 1 - OPD)" yang memungkinkan Atasan menyetujui usulan kompetensi pegawai satu unit kerja untuk diteruskan ke BKPSDMD, atau menolak usulan jika belum sesuai prioritas dinas.',
      codeTitle: 'Source Code Terkait: Verifikasi Usulan IDP Bawahan Tahap 1 & Render Modul Atasan (src/app/dashboard/page.tsx)',
      code: `// 1. Fungsi Aksi Verifikasi Usulan IDP Tingkat Pertama oleh Atasan OPD
const updateStatusIdpBawahan = async (rowIndex: string, status: string) => {
  let alasan = '';
  if (status.startsWith('Ditolak')) {
    const input = prompt('Silakan masukkan alasan penolakan IDP bawahan:', 'Tidak tersedia anggaran');
    if (input === null) return; // Dibatalkan oleh pengguna
    alasan = input.trim() || 'Tidak tersedia anggaran';
  } else {
    if (!confirm('Yakin ingin menyetujui pengajuan IDP ini untuk diteruskan ke verifikasi tahap 2 (BKPSDMD)?')) return;
  }

  // Optimistic UI Update untuk pengalaman pengguna yang cepat dan responsif
  setIdpBawahan(prev => prev.map(item => {
    if (item._rowIndex === rowIndex || item.rowIndex === rowIndex) {
      return { ...item, status: status };
    }
    return item;
  }));
  
  try {
    const res = await fetch(\`/api/idp?rowIndex=\${rowIndex}&status=\${encodeURIComponent(status)}&alasan=\${encodeURIComponent(alasan)}\`, { method: 'PUT' });
    if (res.ok) {
      fetchData(); // Sinkronisasi ulang data
    } else {
      alert('Gagal memperbarui status verifikasi IDP');
      fetchData();
    }
  } catch (err) {
    alert('Terjadi kesalahan jaringan saat memproses verifikasi');
    fetchData();
  }
};

// 2. Render Tabel Persetujuan IDP Bawahan Khusus Hak Akses Atasan OPD
{isAtasan && (
  <div className="table-responsive border rounded-3 bg-white mb-4 border-success mt-4">
    <table className="table table-hover mb-0" style={{ fontSize: '0.9rem' }}>
      <thead className="bg-success text-white">
        <tr>
          <th>No</th><th>Nama Pegawai</th><th>Pengembangan</th><th>Pelaksanaan</th><th>JP</th><th>Status</th>
          <th className="text-center">Aksi Verifikasi (OPD)</th>
        </tr>
      </thead>
      <tbody>
        {idpBawahan.map((idp, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td><strong>{idp.nama_pegawai}</strong><div className="text-muted small">NIP. {idp.nip}</div></td>
            <td>{idp.jenis_pengembangan} <span className="text-muted small">({idp.jalur_pengembangan})</span></td>
            <td>{idp.waktu_pelaksanaan_awal} s.d. {idp.waktu_pelaksanaan_akhir}</td>
            <td><span className="badge bg-secondary rounded-pill">{idp.jp} JP</span></td>
            <td><span className="badge bg-warning text-dark">{idp.status}</span></td>
            <td className="text-center">
              <button className="btn btn-sm btn-success me-1" onClick={() => updateStatusIdpBawahan(idp._rowIndex, 'Menunggu Persetujuan Admin')}>
                <i className="bi bi-check-lg me-1"></i> Setujui ke BKPSDMD
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => updateStatusIdpBawahan(idp._rowIndex, 'Ditolak OPD')}>
                <i className="bi bi-x-lg me-1"></i> Tolak
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}`
    },
    {
      num: 12,
      imageFile: 'image24.png',
      caption: 'Gambar 12. Portal Atasan OPD - Manajemen Data Pegawai (Mode Pemantauan OPD)',
      explanation: 'Halaman Manajemen Data Pegawai pada Portal Atasan OPD (`/admin`) menyajikan tabel daftar seluruh pegawai yang berada di bawah naungan unit kerja OPD yang bersangkutan (misal: Unit Kerja A dengan 6 pegawai). Pada bagian atas terdapat pemberitahuan biru "Mode Pemantauan OPD (Hanya Lihat)". Atasan dapat memantau status keaktifan, total capaian JP, dan status usulan IDP masing-masing staf secara real-time tanpa mengubah konfigurasi sistem.',
      codeTitle: 'Source Code Terkait: Filter Data Pegawai Berdasarkan Unit Kerja OPD (src/app/admin/page.tsx)',
      code: `// Filter Pegawai Sesuai Unit Kerja Instansi untuk Akun Atasan OPD
const displayPegawaiList = useMemo(() => {
  if (userRole === 'admin') {
    // Mode OPD: Batasi hanya pegawai yang berada pada unit kerja yang sama
    return pegawaiList.filter(p => p.unit_kerja === currentAdminOpdUnit);
  }
  // Mode Super Admin: Tampilkan seluruh pegawai se-kabupaten
  return pegawaiList;
}, [pegawaiList, userRole, currentAdminOpdUnit]);`
    },
    {
      num: 13,
      imageFile: 'image17.png',
      caption: 'Gambar 13. Portal Atasan OPD - Rekapitulasi Sertifikasi Pegawai per OPD',
      explanation: 'Menu Rekapitulasi Sertifikasi per OPD pada Portal Atasan menyajikan statistik kepatuhan pemenuhan kewajiban 20 JP ASN untuk staf instansinya. Terdapat ringkasan badge status (Total Pegawai, Jumlah Pegawai Memenuhi Syarat, Jumlah Pegawai Belum Memenuhi, serta perbandingan PNS vs PPPK). Atasan dapat mengklik tombol "Detail" pada setiap pegawai untuk melihat daftar riwayat kursus dan sertifikat pendukung yang diunggah.',
      codeTitle: 'Source Code Terkait: Penghitungan Status Pemenuhan 20 JP per OPD (src/app/admin/page.tsx)',
      code: `// Kalkulasi Kepatuhan Minimal 20 JP Pegawai di Lingkungan OPD
const countMemenuhi = displayPegawaiList.filter(p => (p.jp || 0) >= 20).length;
const countBelum = displayPegawaiList.filter(p => (p.jp || 0) < 20).length;

return (
  <div className="d-flex gap-2 mb-3">
    <span className="badge bg-secondary p-2">Total Pegawai: {displayPegawaiList.length}</span>
    <span className="badge bg-success p-2">Memenuhi (≥20 JP): {countMemenuhi}</span>
    <span className="badge bg-warning p-2">Belum Memenuhi: {countBelum}</span>
  </div>
);`
    },
    {
      num: 14,
      imageFile: 'image23.png',
      caption: 'Gambar 14. Portal Atasan OPD - Approval Usulan IDP Staf OPD',
      explanation: 'Halaman Approval IDP Pegawai menyajikan daftar seluruh usulan rencana pengembangan kompetensi bawahan di OPD terkait. Atasan dapat meneliti jenis kompetensi, metode pengembangan (bimtek, diklat, e-learning, seminar), penyelenggara, jadwal, dan durasi JP. Sistem menyediakan status verifikasi transparan, seperti "Menunggu Verifikasi OPD", "Disetujui Final (BKPSDMD)", maupun "Ditolak".',
      codeTitle: 'Source Code Terkait: Tabel Verifikasi IDP Portal Atasan (src/app/admin/page.tsx)',
      code: `// Tampilan Kolom Aksi Verifikasi pada Tabel IDP Atasan OPD
<td className="text-center">
  {item.status === 'Menunggu Verifikasi OPD' ? (
    <div className="btn-group btn-group-sm">
      <button onClick={() => handleApproveOPD(item.id)} className="btn btn-success">
        <i className="bi bi-check-lg"></i> Setujui
      </button>
      <button onClick={() => handleRejectOPD(item.id)} className="btn btn-danger">
        <i className="bi bi-x-lg"></i> Tolak
      </button>
    </div>
  ) : (
    <span className="badge bg-light text-muted border">Hanya Pantau</span>
  )}
</td>`
    },

    // ==========================================
    // ROLE: ADMIN BKPSDMD
    // ==========================================
    {
      roleTitle: 'BAGIAN III: PANDUAN PENGGUNA - ADMIN BKPSDMD',
      isNewRole: true,
      num: 15,
      imageFile: 'image3.png',
      caption: 'Gambar 15. Halaman Login Administrator BKPSDMD',
      explanation: 'Administrator Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Daerah (BKPSDMD) mengakses sistem melalui portal login terpadu. Akun BKPSDMD memiliki kewenangan tingkat kabupaten untuk memantau pemenuhan kompetensi seluruh OPD dan melakukan validasi akhir terhadap usulan pengembangan kompetensi ASN.',
      codeTitle: 'Source Code Terkait: Penentuan Hak Akses BKPSDMD (src/app/login/page.tsx)',
      code: `// Identifikasi Akun Tingkat Pengelola BKPSDMD Kabupaten
if (data.user.role === 'admin_bkpsdmd') {
  sessionStorage.setItem('user_role', 'admin_bkpsdmd');
  router.push('/admin'); // Mengakses pusat kendali analitik daerah
}`
    },
    {
      num: 16,
      imageFile: 'image15.png',
      caption: 'Gambar 16. Dashboard Analisis Tren Pemenuhan 20 JP ASN Tingkat Kabupaten',
      explanation: 'Dashboard Analisis Tren Pemenuhan 20 JP menyajikan visualisasi data analitik tingkat kabupaten. Di bagian atas terdapat kartu ringkasan kinerja (Total OPD Terdata: 5, Tren Meningkat: 5 OPD, Tren Menurun: 0 OPD, Fluktuatif/Stabil: 0 OPD). Di tengah terdapat dua grafik visual interaktif berbasis Recharts: "Tren Capaian Seluruh ASN" dan "Tren Capaian per OPD" dari tahun 2023 hingga 2026. Di bagian bawah terdapat "Matriks Rekapitulasi Tahunan" yang membandingkan capaian JP pegawai antar tahun lengkap dengan fitur Ekspor Excel.',
      codeTitle: 'Source Code Terkait: Visualisasi Grafik Tren Kepatuhan ASN (src/app/admin/page.tsx)',
      code: `// Render Grafik Garis Tren Capaian Tahunan ASN Menggunakan Recharts
<ResponsiveContainer width="100%" height={260}>
  <LineChart data={trendDataCounty}>
    <CartesianGrid strokeDasharray="3 3" vertical={false} />
    <XAxis dataKey="tahun" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="persentase_memenuhi" name="Memenuhi Syarat (≥20 JP)" stroke="#10b981" strokeWidth={3} />
    <Line type="monotone" dataKey="persentase_belum" name="Belum Memenuhi" stroke="#f59e0b" strokeWidth={3} />
  </LineChart>
</ResponsiveContainer>`
    },
    {
      num: 17,
      imageFile: 'image18.png',
      caption: 'Gambar 17. Manajemen Master Data Pegawai oleh Administrator BKPSDMD',
      explanation: 'Halaman Master Data Pegawai pada akun BKPSDMD mencakup seluruh ASN Pemerintah Kabupaten Bangka Barat (PNS dan PPPK). Administrator dapat mencari pegawai berdasarkan NIP atau nama, menambahkan pegawai baru secara manual ("+ Tambah Pegawai"), mengekspor data ke format Excel, mengubah data kepegawaian, menonaktifkan akun, serta mengatur hak akses persetujuan IDP.',
      codeTitle: 'Source Code Terkait: Manajemen Tambah & Ekspor Data ASN (src/app/admin/page.tsx)',
      code: `// Fungsi Ekspor Data Master Pegawai ke Berkas Microsoft Excel (.xlsx)
const handleExportPegawaiExcel = () => {
  const exportData = pegawaiList.map((p, idx) => ({
    'No': idx + 1,
    'NIP': p.nip,
    'Nama Lengkap': p.nama,
    'Status Pegawai': p.status_pegawai,
    'Golongan': p.golongan,
    'Pangkat': p.pangkat,
    'Jabatan': p.jabatan,
    'Unit Kerja (OPD)': p.unit_kerja,
    'Total Capaian JP': p.jp || 0,
    'Status Kepatuhan': (p.jp || 0) >= 20 ? 'Memenuhi Syarat' : 'Belum Memenuhi'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Pegawai');
  XLSX.writeFile(workbook, \`Master_Pegawai_BKD_\${new Date().toISOString().slice(0, 10)}.xlsx\`);
};`
    },
    {
      num: 18,
      imageFile: 'image21.png',
      caption: 'Gambar 18. Manajemen Rekap Sertifikasi per OPD & Upload Template Massal',
      explanation: 'Fitur Rekap Sertifikasi per OPD pada akun BKPSDMD dilengkapi dengan fasilitas pemutakhiran massal melalui berkas template Excel ("Download Template" dan "Upload Template Sertifikasi"). Admin BKPSDMD dapat mengunduh format spreadsheet resmi, mengisikan puluhan hingga ratusan rekapitulasi diklat sekaligus, lalu mengunggahnya kembali ke sistem untuk diproses secara otomatis ke database Google Sheets.',
      codeTitle: 'Source Code Terkait: Pemrosesan Impor Berkas Excel Sertifikasi (src/app/admin/page.tsx)',
      code: `// Handler Pembacaan & Impor Massal Berkas Excel Rekapitulasi Sertifikasi
const handleImportExcelSertifikasi = async (file: File) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Kirim kumpulan baris data ke backend untuk disimpan massal
    const res = await fetch('/api/sertifikasi/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: rows })
    });

    if (res.ok) {
      alert(\`Berhasil mengimpor \${rows.length} data riwayat pelatihan!\`);
      refreshRekapData();
    }
  };
  reader.readAsArrayBuffer(file);
};`
    },
    {
      num: 19,
      imageFile: 'image22.png',
      caption: 'Gambar 19. Penetapan Final Usulan IDP oleh BKPSDMD (Approval Tahap 2)',
      explanation: 'Menu Approval IDP pada akun BKPSDMD merupakan tahap penentuan akhir bagi usulan rencana pengembangan kompetensi ASN. Usulan yang telah disetujui oleh Atasan OPD akan berstatus "Disetujui OPD" dan siap diverifikasi oleh BKPSDMD melalui tombol hijau "Setujui Final". Jika usulan tidak sesuai dengan prioritas kebutuhan daerah, BKPSDMD dapat menekan tombol merah "Tolak" dan mencantumkan catatan alasan penolakan yang akan terlihat oleh pegawai.',
      codeTitle: 'Source Code Terkait: Penetapan Persetujuan Akhir IDP (src/app/admin/page.tsx)',
      code: `// Eksekusi Keputusan Final Persetujuan IDP oleh BKPSDMD
const handleFinalApprovalBKPSDMD = async (idpId: string, statusKeputusan: 'Disetujui Final (BKPSDMD)' | 'Ditolak BKPSDMD') => {
  let alasanTolak = '';
  if (statusKeputusan.includes('Ditolak')) {
    alasanTolak = prompt('Silakan masukkan alasan penolakan usulan IDP:') || '';
    if (!alasanTolak) return;
  }

  const res = await fetch('/api/idp/approval-final', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: idpId,
      status: statusKeputusan,
      catatan_bkpsdmd: alasanTolak
    })
  });

  if (res.ok) {
    alert(\`Keputusan IDP berhasil disimpan: \${statusKeputusan}\`);
    loadIDPTable();
  }
};`
    },
    {
      num: 20,
      imageFile: 'image20.png',
      caption: 'Gambar 20. Pengaturan Profil Pimpinan Web (Bupati & Wakil Bupati Bangka Barat)',
      explanation: 'Menu Pengaturan Profil Pimpinan Web memungkinkan Administrator BKPSDMD memperbarui data visual pimpinan daerah yang tampil pada halaman muka dan halaman login website. Pengaturan mencakup Foto Resmi Bupati dan Wakil Bupati (format PNG transparan/JPG maks. 5 MB), Nama Lengkap & Gelar, Sebutan Jabatan Resmi, serta Teks Sambutan/Deskripsi Beranda. Halaman ini dilengkapi fitur simulator "Pratinjau Langsung (Live Preview)" sehingga admin dapat melihat tata letak sebelum menekan tombol "Simpan Perubahan Profil".',
      codeTitle: 'Source Code Terkait: Sinkronisasi Profil Pimpinan Daerah (src/app/admin/page.tsx)',
      code: `// Penyimpanan Pengaturan Profil Pimpinan Daerah & Sambutan Halaman Depan
const handleSimpanProfilPimpinan = async () => {
  setIsSavingProfil(true);
  try {
    const res = await fetch('/api/profil-web', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bupati: profilBupati,
        wakil_bupati: profilWakil,
        deskripsi_sambutan: sambutanText
      })
    });

    if (res.ok) {
      alert('Profil Pimpinan Web dan Live Preview berhasil diperbarui!');
    }
  } finally {
    setIsSavingProfil(false);
  }
};`
    },
    {
      num: 21,
      imageFile: 'image8.png',
      caption: 'Gambar 21. Tampilan Portal Pegawai bagi Administrator BKPSDMD (Simulasi Status PPPK)',
      explanation: 'Administrator BKPSDMD memiliki kemampuan beralih ke tampilan Portal Pegawai (`/dashboard`) untuk melakukan simulasi dan monitoring pengalaman pengguna ASN. Pada tampilan ini (disimulasikan dengan status pegawai PPPK dengan capaian 8 JP), sistem secara dinamis mendeteksi standar kewajiban 24 JP per tahun bagi PPPK dan memunculkan banner pengingat berlatar kuning lembut: "Pengingat Pemenuhan Jam Pelajaran (JP): P3K 24 JP (Belum Memenuhi)" dengan penjelasan bahwa pegawai masih memerlukan 16 JP lagi. Di sisi kanan atas navbar dan kartu navigasi sidebar, disediakan tombol pintas "Dashboard Admin" dan "Panel Admin", memungkinkan administrator kembali ke dashboard analitik daerah dalam satu kali klik.',
      codeTitle: 'Source Code Terkait: Deteksi Dinamis PPPK 24 JP & Tombol Pintas Antar Portal (src/app/dashboard/page.tsx)',
      code: `// 1. Pengecekan Status Pegawai PPPK / P3K vs PNS Secara Fleksibel
const statusPegawaiStr = (pegawai?.status_pegawai || '').toUpperCase();
const isPPPK = statusPegawaiStr.includes('P3K') || statusPegawaiStr.includes('PPPK');
const targetJP = isPPPK ? 24 : 20; // Target kepatuhan tahunan (PPPK 24 JP, PNS 20 JP)
const statusLabel = isPPPK ? 'P3K' : 'PNS';
const isMemenuhiJP = totalJP >= targetJP;
const sisaJP = Math.max(0, targetJP - totalJP);

// 2. Tombol Pintas Menuju Panel Pengelolaan Khusus Akun Berwenang (Admin OPD & BKPSDMD)
{(pegawai?.role === 'admin' || pegawai?.role === 'super_admin') && (
  <button 
    onClick={() => router.push('/admin')} 
    className="btn btn-warning btn-sm rounded-pill px-3 fw-bold shadow-sm d-flex align-items-center gap-1 text-dark"
    title="Beralih ke Dashboard Admin & Panel Pengelolaan"
  >
    <i className="bi bi-speedometer2"></i> Dashboard Admin
  </button>
)}

// 3. Kartu Pintasan Panel Admin di Sidebar Kanan Layanan ASN
{(pegawai?.role === 'admin' || pegawai?.role === 'super_admin') && (
  <a onClick={() => router.push('/admin')} className="menu-card mb-3 text-decoration-none border-success border-opacity-50">
    <div className="menu-icon bg-success-subtle text-success">
      <i className="bi bi-shield-lock-fill"></i>
    </div>
    <div className="menu-title text-success">Panel Admin</div>
    <div className="menu-desc">Kelola master data pegawai dan persetujuan daerah.</div>
  </a>
)}`
    },

    // ==========================================
    // ROLE: SUPER ADMIN
    // ==========================================
    {
      roleTitle: 'BAGIAN IV: PANDUAN PENGGUNA - SUPER ADMIN SIPJP',
      isNewRole: true,
      num: 22,
      imageFile: 'image3.png',
      caption: 'Gambar 22. Halaman Login Super Administrator Sistem',
      explanation: 'Super Administrator masuk menggunakan akun utama pengembang/administrator sistem dengan hak akses tak terbatas (full access) ke seluruh modul konfigurasi, basis data Google Sheets, Google Drive Storage API, serta manajemen akun seluruh tingkatan pengguna.',
      codeTitle: 'Source Code Terkait: Hak Akses Penuh Super Admin (src/app/login/page.tsx)',
      code: `// Validasi Kredensial Super Administrator Sistem
if (data.user.role === 'super_admin') {
  sessionStorage.setItem('user_role', 'super_admin');
  sessionStorage.setItem('is_root', 'true');
  router.push('/admin'); // Membuka kontrol penuh sistem
}`
    },
    {
      num: 23,
      imageFile: 'image2.png',
      caption: 'Gambar 23. Dashboard Utama Super Administrator SIPJP',
      explanation: 'Dashboard Super Administrator menyajikan visibilitas menyeluruh terhadap performa sistem di 5 Perangkat Daerah. Menampilkan rekap tren peningkatan kompetensi, status sinkronisasi cloud database, serta grafik kepatuhan agregat se-Kabupaten Bangka Barat.',
      codeTitle: 'Source Code Terkait: Agregasi Metrik Perangkat Daerah (src/app/admin/page.tsx)',
      code: `// Perhitungan Agregasi Seluruh Data Organisasi Perangkat Daerah
const opdSummary = useMemo(() => {
  const uniqueOPDs = Array.from(new Set(pegawaiList.map(p => p.unit_kerja).filter(Boolean)));
  return {
    totalOPD: uniqueOPDs.length,
    totalPegawai: pegawaiList.length,
    pnsCount: pegawaiList.filter(p => p.status_pegawai === 'PNS').length,
    pppkCount: pegawaiList.filter(p => p.status_pegawai === 'PPPK').length
  };
}, [pegawaiList]);`
    },
    {
      num: 24,
      imageFile: 'image4.png',
      caption: 'Gambar 24. Master Data Pegawai Super Admin (Kelola ASN, Tambah, Edit, Hapus, Export)',
      explanation: 'Tabel Master Data Pegawai pada tingkat Super Admin memberikan hak manipulasi data penuh (CRUD: Create, Read, Update, Delete). Super Admin dapat mengedit NIP/Nama, mereset kata sandi akun pegawai, menghapus data anomali, mengaktifkan/menonaktifkan hak verifikasi IDP, serta mengunduh rekapitulasi data ASN ke format Excel.',
      codeTitle: 'Source Code Terkait: Operasi CRUD Master Pegawai (src/app/admin/page.tsx)',
      code: `// Handler Hapus Data Pegawai dari Database Google Sheets
const handleDeletePegawai = async (nip: string, nama: string) => {
  if (!confirm(\`Apakah Anda yakin ingin menghapus data pegawai: \${nama} (\${nip})?\`)) {
    return;
  }

  const res = await fetch(\`/api/pegawai?nip=\${nip}\`, {
    method: 'DELETE'
  });

  if (res.ok) {
    alert('Data pegawai berhasil dihapus dari sistem!');
    refreshDataPegawai();
  }
};`
    },
    {
      num: 25,
      imageFile: 'image7.png',
      caption: 'Gambar 25. Manajemen Rekapitulasi Sertifikasi Super Admin',
      explanation: 'Halaman Manajemen Rekap Sertifikasi Super Admin menampilkan data akordeon per instansi dinas (Unit Kerja A hingga Unit Kerja E). Super Admin dapat meninjau kepatuhan pemenuhan jam pelajaran masing-masing OPD serta memanfaatkan tombol ekspor laporan resmi.',
      codeTitle: 'Source Code Terkait: Pengelompokan Data Sertifikasi per Satuan Kerja (src/app/admin/page.tsx)',
      code: `// Pengelompokan Pegawai Berdasarkan Unit Kerja (Accordion Grouping)
const groupedByUnit = useMemo(() => {
  const groups: Record<string, any[]> = {};
  pegawaiList.forEach(p => {
    const unit = p.unit_kerja || 'Lainnya / Belum Terpetakan';
    if (!groups[unit]) groups[unit] = [];
    groups[unit].push(p);
  });
  return groups;
}, [pegawaiList]);`
    },
    {
      num: 26,
      imageFile: 'image6.png',
      caption: 'Gambar 26. Pusat Approval Usulan IDP Super Admin dengan Fitur Tambah IDP Manual',
      explanation: 'Pusat Approval IDP Super Admin memiliki kemampuan intervensi langsung, termasuk tombol "+ Tambah IDP" untuk memasukkan rencana kompetensi bagi pegawai secara langsung, ekspor seluruh tabel usulan IDP ke format Excel, serta melakukan persetujuan maupun pembatalan status usulan.',
      codeTitle: 'Source Code Terkait: Pembuatan Rencana IDP Manual oleh Administrator (src/app/admin/page.tsx)',
      code: `// Modal Pembuatan Rencana IDP Baru Langsung oleh Super Admin
const handleCreateDirectIDP = async (formData: any) => {
  const res = await fetch('/api/idp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...formData,
      status_verifikasi: 'Disetujui Final (BKPSDMD)',
      dibuat_oleh_admin: true
    })
  });

  if (res.ok) {
    alert('Rencana IDP berhasil ditambahkan dan langsung disahkan!');
    setShowAddIDPModal(false);
    loadIDPTable();
  }
};`
    },
    {
      num: 27,
      imageFile: 'image5.png',
      caption: 'Gambar 27. Pengaturan Profil Pimpinan Web & Reset ke Pengaturan Default',
      explanation: 'Pengaturan Profil Pimpinan Web pada akun Super Admin mencakup seluruh parameter identitas visual pimpinan daerah, pengunggahan foto alternatif, perubahan nama/sebutan gelar, deskripsi sambutan website, serta tombol "Reset ke Default (Semula)" untuk mengembalikan data awal sistem bila terjadi kekeliruan.',
      codeTitle: 'Source Code Terkait: Reset Profil Pimpinan ke Konfigurasi Pabrik (src/app/admin/page.tsx)',
      code: `// Fitur Reset Konfigurasi Profil Pimpinan Daerah ke Nilai Standar Pabrik
const handleResetProfilDefault = async () => {
  if (!confirm("Kembalikan pengaturan profil pimpinan ke nilai standar awal?")) {
    return;
  }

  const res = await fetch('/api/profil-web/reset', {
    method: 'POST'
  });

  if (res.ok) {
    alert('Pengaturan profil pimpinan berhasil dikembalikan ke standar awal!');
    window.location.reload();
  }
};`
    }
  ];

  // Membangun dokumen Word
  const docChildren = [];

  // Judul Utama Dokumen
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: 'PANDUAN LENGKAP PENGGUNAAN SISTEM (MANUAL BOOK)',
          bold: true,
          font: 'Times New Roman',
          size: 32, // 16pt
          color: '1E3A8A'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 50, after: 300 },
      children: [
        new TextRun({
          text: 'Sistem Informasi Pengembangan Kompetensi (SIPJP / SIPEKA) Pemerintah Kabupaten Bangka Barat',
          italics: true,
          font: 'Times New Roman',
          size: 26, // 13pt
          color: '475569'
        })
      ]
    })
  );

  for (const item of sections) {
    // Jika ganti role/bagian, tambahkan heading bagian baru
    if (item.isNewRole) {
      docChildren.push(createHeading(item.roleTitle, 1));
    }

    // 1. Gambar (Screenshot) Dirapikan & Disamakan Ukuran
    const imgPath = path.join(imgDir, item.imageFile);
    if (fs.existsSync(imgPath)) {
      const imgBuffer = fs.readFileSync(imgPath);
      const dims = calculateImageDimensions(imgPath);

      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 80 },
          children: [
            new ImageRun({
              data: imgBuffer,
              transformation: {
                width: dims.width,
                height: dims.height
              }
            })
          ]
        })
      );
    }

    // 2. Keterangan Gambar
    docChildren.push(createImageCaption(item.caption));

    // 3. Penjelasan Lengkap (Font Times New Roman 12pt)
    docChildren.push(createParagraph(item.explanation));

    // 4. Judul Kodingan Terkait
    docChildren.push(createCodeBlockTitle(item.codeTitle));

    // 5. Kotak Source Code yang Rapi
    docChildren.push(createCodeTable(item.code));

    // Jarak pemisah antar gambar
    docChildren.push(
      new Paragraph({
        spacing: { before: 180, after: 180 },
        children: []
      })
    );
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 24 // 12pt
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 dxa (2.54 cm)
              bottom: 1440,
              left: 1440,
              right: 1440
            }
          }
        },
        children: docChildren
      }
    ]
  });

  // Simpan ke 2 lokasi: folder Downloads user dan folder docs project
  const buffer = await Packer.toBuffer(doc);
  const userDownloadsPath = '/Users/mutiaherdiniicloud.com/Downloads/SIPEKA_Manual_Book_Lengkap.docx';
  const projectDocsPath = '/Users/mutiaherdiniicloud.com/Downloads/bkd/bkd-app/docs/manual-book/SIPEKA_Manual_Book_Lengkap.docx';

  fs.writeFileSync(userDownloadsPath, buffer);
  fs.writeFileSync(projectDocsPath, buffer);

  console.log('✅ Dokumen berhasil dibuat:');
  console.log('1. ' + userDownloadsPath + ' (' + buffer.length + ' bytes)');
  console.log('2. ' + projectDocsPath + ' (' + buffer.length + ' bytes)');
}

buildDocument().catch(err => {
  console.error('Error building document:', err);
  process.exit(1);
});
