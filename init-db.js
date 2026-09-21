const { google } = require('googleapis');
const fs = require('fs');

async function main() {
  const envText = fs.readFileSync('.env.local', 'utf8');
  let sheetId, email, privateKey;
  envText.split('\n').forEach(line => {
    if (line.startsWith('GOOGLE_SHEET_ID=')) sheetId = line.split('=')[1].replace(/"/g, '').trim();
    if (line.startsWith('GOOGLE_CLIENT_EMAIL=')) email = line.split('=')[1].replace(/"/g, '').trim();
    if (line.startsWith('GOOGLE_PRIVATE_KEY=')) privateKey = line.substring(line.indexOf('=') + 1).replace(/"/g, '').replace(/\\n/g, '\n').trim();
  });

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const sheets = google.sheets({ version: 'v4', auth });

  console.log("Menginisialisasi Database BKD...");

  // Get current sheets
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const sheetTitles = spreadsheet.data.sheets.map(s => s.properties.title);

  // Update Sheet1 to pegawai if exists
  if (sheetTitles.includes('Sheet1') && !sheetTitles.includes('pegawai')) {
    const sheet1Id = spreadsheet.data.sheets.find(s => s.properties.title === 'Sheet1').properties.sheetId;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [{ updateSheetProperties: { properties: { sheetId: sheet1Id, title: 'pegawai' }, fields: 'title' } }]
      }
    });
    console.log("Sheet1 diubah menjadi pegawai.");
    sheetTitles.push('pegawai');
  } else if (!sheetTitles.includes('pegawai')) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: 'pegawai' } } }] }
    });
    console.log("Sheet pegawai dibuat.");
  }

  // Create sertifikasi & pendidikan & idp
  for (const title of ['sertifikasi', 'pendidikan', 'idp']) {
    if (!sheetTitles.includes(title)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: { requests: [{ addSheet: { properties: { title } } }] }
      });
      console.log(`Sheet ${title} dibuat.`);
    }
  }

  // Populate pegawai headers & Admin user
  const pegawaiHeaders = ["nip", "password", "nama", "status pegawai", "pangkat", "golongan ", "jankel", "jabatan", "unit kerja", "jumlah jp"];
  const adminRow = ["admin", "admin123", "Administrator Sistem", "PNS", "Pembina", "IV/a", "Pria", "Administrator", "Badan Kepegawaian Daerah", "0"];

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'pegawai!A1:J2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [pegawaiHeaders, adminRow] }
  });

  // Populate sertifikasi headers
  const sertifikasiHeaders = ["nip", "jenis_sertifikasi", "nama_kursus", "institusi_penyelenggara", "nomor_sertifikasi", "tanggal_sertifikasi", "tahun", "jumlah_jp", "link_sertifikat"];
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'sertifikasi!A1:I1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [sertifikasiHeaders] }
  });

  // Populate pendidikan headers
  const pendidikanHeaders = ["nip", "tingkat_pendidikan", "nama_institusi", "jurusan", "tahun_lulus", "nomor_ijazah", "link_ijazah"];
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'pendidikan!A1:G1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [pendidikanHeaders] }
  });

  console.log("Data awal Pegawai, Sertifikasi, dan Pendidikan berhasil ditambahkan!");

  // Populate idp headers
  const idpHeaders = ["nip", "jenis_kompetensi", "jenis_pengembangan", "jalur_pengembangan", "penyelenggara", "waktu_pelaksanaan_awal", "waktu_pelaksanaan_akhir", "jp", "anggaran", "status"];
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'idp!A1:J1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [idpHeaders] }
  });

  console.log("Data awal IDP berhasil ditambahkan!");
}

main().catch(err => console.error("Error init DB:", err));
