import { NextResponse } from 'next/server';
import { getGoogleSheets, GOOGLE_SHEET_ID, getCachedSheetData } from '@/lib/google';
import { revalidateTag } from 'next/cache';
import { sendIdpSubmissionNotificationToAtasan, sendIdpStatusNotificationToBawahan } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nip = searchParams.get('nip');
    if (!nip) return NextResponse.json({ success: false, message: 'Missing NIP' }, { status: 400 });

    const idpData = await request.json();
    if (!Array.isArray(idpData) || idpData.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
    }

    const sheets = getGoogleSheets();
    const rows = idpData.map((item: any) => [
      nip,
      item.jenis_kompetensi || '',
      item.jenis_pengembangan || '',
      item.jalur_pengembangan || '',
      item.penyelenggara || '',
      item.waktu_pelaksanaan_awal || '',
      item.waktu_pelaksanaan_akhir || '',
      item.jp || '',
      item.anggaran || '',
      item.status || 'Menunggu Persetujuan Ketua',
      item.nip_ketua || '',
      item.nama_ketua || '',
      item.alasan_tolak || ''
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'idp!A:Z',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });

    revalidateTag('google-sheets', { expire: 0 });

    // Notifikasi email ke Atasan (Ketua)
    (async () => {
      try {
        const pRows = await getCachedSheetData('pegawai!A:ZZ');
        if (pRows && pRows.length > 0) {
          const headers = pRows[0].map((h: string) => h.toLowerCase().trim());
          const pNipIdx = headers.indexOf('nip');
          const pNamaIdx = headers.indexOf('nama');
          const pUnitIdx = headers.indexOf('unit kerja');
          const pEmailIdx = headers.indexOf('email');
          const pNipAtasanIdx = headers.indexOf('nip_atasan');

          const bawahanRow = pRows.find((r: any) => r[pNipIdx]?.toString().trim() === nip.trim());
          const bawahanNama = bawahanRow ? (bawahanRow[pNamaIdx] || nip) : nip;
          const unitKerja = bawahanRow ? (bawahanRow[pUnitIdx] || '') : '';

          const atasanNip = idpData[0]?.nip_ketua || (bawahanRow && pNipAtasanIdx !== -1 ? bawahanRow[pNipAtasanIdx] : '');
          
          if (atasanNip && pEmailIdx !== -1) {
            const atasanRow = pRows.find((r: any) => r[pNipIdx]?.toString().trim() === atasanNip.toString().trim());
            const atasanEmail = atasanRow ? atasanRow[pEmailIdx]?.toString().trim() : null;
            const atasanNama = atasanRow ? atasanRow[pNamaIdx] : (idpData[0]?.nama_ketua || 'Atasan');

            if (atasanEmail) {
              await sendIdpSubmissionNotificationToAtasan({
                atasanEmail,
                atasanNama,
                bawahanNama,
                bawahanNip: nip,
                unitKerja,
                idpItems: idpData.map((item: any) => ({
                  jenis_kompetensi: item.jenis_kompetensi,
                  jenis_pengembangan: item.jenis_pengembangan,
                  jalur_pengembangan: item.jalur_pengembangan,
                  penyelenggara: item.penyelenggara,
                  waktu_pelaksanaan_awal: item.waktu_pelaksanaan_awal,
                  waktu_pelaksanaan_akhir: item.waktu_pelaksanaan_akhir,
                  jp: item.jp,
                  anggaran: item.anggaran
                }))
              });
            } else {
              console.log(`[EMAIL NOTICE] Atasan NIP ${atasanNip} belum mengisi email di login/profil.`);
            }
          }
        }
      } catch (err: any) {
        console.error('[EMAIL ERROR on POST IDP]', err.message);
      }
    })();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get('rowIndex');
    
    if (!rowIndex) return NextResponse.json({ success: false, message: 'Missing rowIndex parameter' }, { status: 400 });

    const sheets = getGoogleSheets();
    
    // Ambil data baris saat ini terlebih dahulu untuk referensi email dan rincian kegiatan
    let existingRow: any[] = [];
    try {
      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `idp!A${rowIndex}:M${rowIndex}`
      });
      existingRow = getRes.data.values?.[0] || [];
    } catch (e) {}

    const bawahanNip = existingRow[0] || '';
    const jenisKompetensi = existingRow[1] || '';
    const jenisPengembangan = existingRow[2] || '';
    const jp = existingRow[7] || '';
    const namaKetua = existingRow[11] || '';

    // Check if body exists (for full update) or if it's just a status update via query params
    let updateData = null;
    try {
      updateData = await request.json();
    } catch(e) {}

    const status = searchParams.get('status');
    let finalStatus = '';
    let finalAlasanTolak = '';
    let finalKompetensi = jenisKompetensi;
    let finalPengembangan = jenisPengembangan;
    let finalJp = jp;

    if (updateData && Object.keys(updateData).length > 0) {
      // Full row update
      const { nip, jenis_kompetensi, jenis_pengembangan, jalur_pengembangan, penyelenggara, waktu_pelaksanaan_awal, waktu_pelaksanaan_akhir, jp: newJp, anggaran, status: newStatus, nip_ketua, nama_ketua, alasan_tolak } = updateData;
      
      finalStatus = newStatus || 'Menunggu Persetujuan Ketua';
      finalAlasanTolak = alasan_tolak || '';
      finalKompetensi = jenis_kompetensi || jenisKompetensi;
      finalPengembangan = jenis_pengembangan || jenisPengembangan;
      finalJp = newJp || jp;

      const newRow = [
        nip || bawahanNip || '',
        finalKompetensi,
        finalPengembangan,
        jalur_pengembangan || '',
        penyelenggara || '',
        waktu_pelaksanaan_awal || '',
        waktu_pelaksanaan_akhir || '',
        finalJp,
        anggaran || '',
        finalStatus,
        nip_ketua || '',
        nama_ketua || '',
        finalAlasanTolak
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `idp!A${rowIndex}:M${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] }
      });
    } else if (status) {
      // Only status update (J column) and alasan tolak (M column)
      finalStatus = status;
      const alasan = searchParams.get('alasan') || '';
      finalAlasanTolak = alasan;

      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `idp!J${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[status]] }
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `idp!M${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[alasan]] }
      });
    } else {
      return NextResponse.json({ success: false, message: 'No update data provided' }, { status: 400 });
    }

    revalidateTag('google-sheets', { expire: 0 });

    // Kirim notifikasi email ke Bawahan jika status disetujui atau ditolak
    if (finalStatus === 'Disetujui' || finalStatus === 'Ditolak' || finalStatus.includes('Setuju')) {
      (async () => {
        try {
          const targetNip = updateData?.nip || bawahanNip;
          if (!targetNip) return;

          const pRows = await getCachedSheetData('pegawai!A:ZZ');
          if (pRows && pRows.length > 0) {
            const headers = pRows[0].map((h: string) => h.toLowerCase().trim());
            const pNipIdx = headers.indexOf('nip');
            const pNamaIdx = headers.indexOf('nama');
            const pEmailIdx = headers.indexOf('email');

            const bawahanRow = pRows.find((r: any) => r[pNipIdx]?.toString().trim() === targetNip.toString().trim());
            const bawahanEmail = bawahanRow && pEmailIdx !== -1 ? bawahanRow[pEmailIdx]?.toString().trim() : null;
            const bawahanNama = bawahanRow ? (bawahanRow[pNamaIdx] || targetNip) : targetNip;

            if (bawahanEmail) {
              await sendIdpStatusNotificationToBawahan({
                bawahanEmail,
                bawahanNama,
                status: finalStatus,
                jenisKompetensi: finalKompetensi || 'Pengembangan Kompetensi',
                jenisPengembangan: finalPengembangan,
                jp: finalJp,
                alasanTolak: finalAlasanTolak,
                reviewerNama: (updateData?.nama_ketua || namaKetua || 'Atasan / Admin')
              });
            } else {
              console.log(`[EMAIL NOTICE] Bawahan NIP ${targetNip} belum mengisi email di login/profil.`);
            }
          }
        } catch (err: any) {
          console.error('[EMAIL ERROR on PUT IDP]', err.message);
        }
      })();
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get('rowIndex');
    
    if (!rowIndex) return NextResponse.json({ success: false, error: 'Missing rowIndex' }, { status: 400 });

    const sheets = getGoogleSheets();
    const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId: GOOGLE_SHEET_ID });
    const idpSheet = sheetInfo.data.sheets?.find(s => s.properties?.title === 'idp');
    
    if (idpSheet && idpSheet.properties?.sheetId !== undefined) {
      const idx = parseInt(rowIndex, 10) - 1; // 0-based index for dimension
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_SHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: idpSheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: idx,
                endIndex: idx + 1
              }
            }
          }]
        }
      });
    } else {
      // Fallback: Clear the row if batchUpdate fails or sheetId not found
      await sheets.spreadsheets.values.clear({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `idp!A${rowIndex}:Z${rowIndex}`
      });
    }

    revalidateTag('google-sheets', { expire: 0 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
