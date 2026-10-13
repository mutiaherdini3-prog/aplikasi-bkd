require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const XLSX = require('xlsx');

async function main() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'pegawai!A:I',
  });
  const rows = res.data.values || [];
  const headers = rows[0].map(h => (h || '').trim().toLowerCase());
  const nipIdx = headers.indexOf('nip');
  const namaIdx = headers.indexOf('nama');
  const statusIdx = headers.indexOf('status pegawai');
  const jabatanIdx = headers.indexOf('jabatan');
  const unitKerjaIdx = headers.indexOf('unit kerja');

  const refData = [
    ['NIP', 'Nama Pegawai', 'Status Pegawai', 'Jabatan', 'Unit Kerja']
  ];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const nip = r[nipIdx]?.toString().trim();
    if (!nip || nip === 'admin') continue;
    refData.push([
      nip,
      r[namaIdx] || '-',
      r[statusIdx] || '-',
      r[jabatanIdx] || '-',
      r[unitKerjaIdx] || '-'
    ]);
  }

  const workbook = XLSX.utils.book_new();
  const wsRef = XLSX.utils.aoa_to_sheet(refData);
  wsRef['!cols'] = [{ wch: 22 }, { wch: 32 }, { wch: 18 }, { wch: 35 }, { wch: 35 }];

  const templateHeaders = [
    'NIP', 'Nama Pegawai', 'Status Pegawai', 'Jabatan', 
    'Jenis Sertifikasi', 'Nama Kursus', 'Institusi Penyelenggara', 'Nomor Sertifikasi', 
    'Tanggal Mulai', 'Tanggal Akhir', 'Tahun', 'Jumlah JP', 'Link Sertifikat', 
    'Jenis Kursus', 'Klasifikasi Kursus', 'Penanda Tangan', 'Biaya Pelatihan'
  ];

  const rowsAoa = [templateHeaders];
  for (let r = 2; r <= 500; r++) {
    rowsAoa.push(new Array(templateHeaders.length).fill(null));
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rowsAoa);

  for (let r = 2; r <= 500; r++) {
    worksheet[`B${r}`] = {
      t: 's',
      v: '',
      f: `IF(ISBLANK(A${r}),"",IFERROR(VLOOKUP(A${r},Data_Referensi_Pegawai!$A$2:$E$6000,2,FALSE),IFERROR(VLOOKUP(TRIM(A${r}&""),Data_Referensi_Pegawai!$A$2:$E$6000,2,FALSE),IFERROR(VLOOKUP(VALUE(A${r}),Data_Referensi_Pegawai!$A$2:$E$6000,2,FALSE),"NIP Tidak Ditemukan"))))`
    };
    worksheet[`C${r}`] = {
      t: 's',
      v: '',
      f: `IF(ISBLANK(A${r}),"",IFERROR(VLOOKUP(A${r},Data_Referensi_Pegawai!$A$2:$E$6000,3,FALSE),IFERROR(VLOOKUP(TRIM(A${r}&""),Data_Referensi_Pegawai!$A$2:$E$6000,3,FALSE),IFERROR(VLOOKUP(VALUE(A${r}),Data_Referensi_Pegawai!$A$2:$E$6000,3,FALSE),"NIP Tidak Ditemukan"))))`
    };
    worksheet[`D${r}`] = {
      t: 's',
      v: '',
      f: `IF(ISBLANK(A${r}),"",IFERROR(VLOOKUP(A${r},Data_Referensi_Pegawai!$A$2:$E$6000,4,FALSE),IFERROR(VLOOKUP(TRIM(A${r}&""),Data_Referensi_Pegawai!$A$2:$E$6000,4,FALSE),IFERROR(VLOOKUP(VALUE(A${r}),Data_Referensi_Pegawai!$A$2:$E$6000,4,FALSE),"NIP Tidak Ditemukan"))))`
    };
  }

  worksheet['!cols'] = [
    { wch: 22 }, { wch: 30 }, { wch: 18 }, { wch: 35 },
    { wch: 18 }, { wch: 48 }, { wch: 32 }, { wch: 24 },
    { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 12 },
    { wch: 45 }, { wch: 25 }, { wch: 20 }, { wch: 32 }, { wch: 16 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Sertifikasi');
  XLSX.utils.book_append_sheet(workbook, wsRef, 'Data_Referensi_Pegawai');

  const outPath = '/Users/mutiaherdiniicloud.com/Downloads/Template_Import_Sertifikasi_BKD_OTOMATIS.xlsx';
  XLSX.writeFile(workbook, outPath);
  console.log('Successfully generated clean template to:', outPath);
}

main().catch(console.error);
