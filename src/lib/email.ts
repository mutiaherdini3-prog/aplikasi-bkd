import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IdpItemNotification {
  jenis_kompetensi: string;
  jenis_pengembangan: string;
  jalur_pengembangan?: string;
  penyelenggara?: string;
  waktu_pelaksanaan_awal?: string;
  waktu_pelaksanaan_akhir?: string;
  jp?: string | number;
  anggaran?: string | number;
}

/**
 * Mengirim email menggunakan Nodemailer (SMTP) atau fallback Google Apps Script / Simulasi.
 */
export async function sendEmail({ to }: EmailOptions): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  // Notifikasi email dinonaktifkan sepenuhnya untuk mencegah resiko spam/pemblokiran akun Google
  console.log(`[EMAIL NONAKTIF] Pengiriman email ke "${to}" dinonaktifkan sesuai permintaan pengguna.`);
  return { success: true, simulated: true };
}

/**
 * Notifikasi untuk Atasan saat Bawahan mengajukan IDP baru.
 */
export async function sendIdpSubmissionNotificationToAtasan({
  atasanEmail,
  atasanNama,
  bawahanNama,
  bawahanNip,
  unitKerja,
  idpItems
}: {
  atasanEmail: string;
  atasanNama?: string;
  bawahanNama: string;
  bawahanNip: string;
  unitKerja?: string;
  idpItems: IdpItemNotification[];
}) {
  const subject = `[SIPJP Bangka Barat] Pengajuan IDP Baru dari ${bawahanNama}`;

  const rowsHtml = idpItems.map((item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? 'background-color: #f8fafc;' : ''}">
      <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">${item.jenis_kompetensi || '-'}</td>
      <td style="padding: 10px 12px; color: #475569;">${item.jenis_pengembangan || '-'} ${item.jalur_pengembangan ? `<br><small style="color: #64748b;">(${item.jalur_pengembangan})</small>` : ''}</td>
      <td style="padding: 10px 12px; color: #475569;">${item.waktu_pelaksanaan_awal || '-'} s.d. ${item.waktu_pelaksanaan_akhir || '-'}</td>
      <td style="padding: 10px 12px; text-align: center; color: #1e40af; font-weight: bold;">${item.jp || 0} JP</td>
      <td style="padding: 10px 12px; color: #475569;">${item.penyelenggara || '-'}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f1f5f9; }
        .container { max-width: 650px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1; }
        .badge-header { display: inline-block; background: rgba(251, 191, 36, 0.2); color: #fcd34d; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-top: 10px; border: 1px solid rgba(251, 191, 36, 0.4); text-transform: uppercase; letter-spacing: 0.5px; }
        .content { padding: 28px 24px; }
        .info-card { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 6px; margin: 18px 0; }
        .info-card p { margin: 4px 0; font-size: 14px; }
        .table-container { margin: 20px 0; overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .btn-action { display: inline-block; background: linear-gradient(135deg, #1e4b85 0%, #153866 100%); color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; text-align: center; margin: 15px 0; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PEMERINTAH KABUPATEN BANGKA BARAT</h1>
          <p>Sistem Informasi Sertifikasi & Pemenuhan Jam Pelajaran (SIPJP)</p>
          <span class="badge-header">Pemberitahuan Pengajuan Baru</span>
        </div>
        <div class="content">
          <p>Yth. <strong>${atasanNama || 'Bapak/Ibu Atasan (Ketua)'}</strong>,</p>
          <p>Pegawai bawahan Anda telah mengajukan permohonan <strong>Individual Development Plan (IDP)</strong> baru yang membutuhkan verifikasi dan persetujuan dari Anda:</p>
          
          <div class="info-card">
            <p><strong>Nama Pegawai:</strong> ${bawahanNama}</p>
            <p><strong>NIP:</strong> ${bawahanNip}</p>
            ${unitKerja ? `<p><strong>Unit Kerja:</strong> ${unitKerja}</p>` : ''}
            <p><strong>Jumlah Usulan:</strong> ${idpItems.length} kegiatan</p>
          </div>

          <h3 style="font-size: 15px; color: #0f172a; margin-top: 22px; margin-bottom: 8px;">Daftar Kegiatan yang Diajukan:</h3>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Kompetensi</th>
                  <th>Pengembangan</th>
                  <th>Waktu</th>
                  <th style="text-align: center;">JP</th>
                  <th>Penyelenggara</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>

          <p style="font-size: 14px;">Silakan login ke dashboard SIPJP Anda untuk menyetujui atau memberikan catatan penolakan terhadap pengajuan tersebut.</p>

          <div style="text-align: center; margin-top: 25px;">
            <a href="https://sipjp-babar.vercel.app/login" class="btn-action">Buka Dashboard SIPJP &raquo;</a>
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0;">Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Daerah (BKPSDMD) Kab. Bangka Barat</p>
          <p style="margin: 4px 0 0 0; font-size: 11px;">Email ini dikirim secara otomatis oleh sistem SIPJP. Mohon jangan membalas email ini secara langsung.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: atasanEmail, subject, html });
}

/**
 * Notifikasi untuk Bawahan saat Pengajuan IDP Disetujui atau Ditolak.
 */
export async function sendIdpStatusNotificationToBawahan({
  bawahanEmail,
  bawahanNama,
  status,
  jenisKompetensi,
  jenisPengembangan,
  jp,
  alasanTolak,
  reviewerNama
}: {
  bawahanEmail: string;
  bawahanNama: string;
  status: 'Disetujui' | 'Ditolak' | string;
  jenisKompetensi: string;
  jenisPengembangan?: string;
  jp?: string | number;
  alasanTolak?: string;
  reviewerNama?: string;
}) {
  const isApproved = status === 'Disetujui' || status.includes('Setuju');
  const subject = isApproved 
    ? `[SIPJP Bangka Barat] Pengajuan IDP Anda Disetujui ✅` 
    : `[SIPJP Bangka Barat] Pengajuan IDP Anda Ditolak ❌`;

  const bannerColor = isApproved ? 'linear-gradient(135deg, #15803d 0%, #166534 100%)' : 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)';
  const badgeText = isApproved ? 'PENGAJUAN DISETUJUI' : 'PENGAJUAN DITOLAK';
  const badgeColor = isApproved ? '#22c55e' : '#ef4444';

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f1f5f9; }
        .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: ${bannerColor}; color: #ffffff; padding: 26px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
        .header p { margin: 6px 0 0 0; font-size: 13px; color: #f1f5f9; }
        .status-badge { display: inline-block; background: rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 12px; font-weight: 800; padding: 5px 14px; border-radius: 20px; margin-top: 12px; border: 1px solid rgba(255, 255, 255, 0.4); letter-spacing: 0.5px; }
        .content { padding: 28px 24px; }
        .card-detail { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 18px 0; }
        .card-detail p { margin: 6px 0; font-size: 14px; }
        .reason-box { background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 6px; padding: 14px 18px; margin: 16px 0; color: #991b1b; }
        .btn-action { display: inline-block; background: linear-gradient(135deg, #1e4b85 0%, #153866 100%); color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; text-align: center; margin: 15px 0; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PEMERINTAH KABUPATEN BANGKA BARAT</h1>
          <p>Sistem Informasi Sertifikasi & Pemenuhan Jam Pelajaran (SIPJP)</p>
          <span class="status-badge">${badgeText}</span>
        </div>
        <div class="content">
          <p>Yth. <strong>${bawahanNama}</strong>,</p>
          
          ${isApproved ? `
            <p>Kabar baik! Pengajuan <strong>Individual Development Plan (IDP)</strong> Anda telah <strong style="color: #15803d;">DISETUJUI</strong>${reviewerNama ? ` oleh <strong>${reviewerNama}</strong>` : ''}.</p>
          ` : `
            <p>Pemberitahuan bahwa pengajuan <strong>Individual Development Plan (IDP)</strong> Anda <strong style="color: #b91c1c;">DITOLAK</strong>${reviewerNama ? ` oleh <strong>${reviewerNama}</strong>` : ''}.</p>
          `}

          <div class="card-detail">
            <p><strong>Kompetensi:</strong> ${jenisKompetensi}</p>
            ${jenisPengembangan ? `<p><strong>Bentuk Pengembangan:</strong> ${jenisPengembangan}</p>` : ''}
            ${jp ? `<p><strong>Jam Pelajaran:</strong> ${jp} JP</p>` : ''}
            <p><strong>Status Saat Ini:</strong> <span style="font-weight: 700; color: ${badgeColor};">${status}</span></p>
          </div>

          ${!isApproved && alasanTolak ? `
            <div class="reason-box">
              <strong style="display: block; margin-bottom: 4px;">Alasan Penolakan:</strong>
              <span>${alasanTolak}</span>
            </div>
            <p style="font-size: 13px; color: #64748b;">Anda dapat berkonsultasi dengan atasan atau mengajukan usulan pelatihan lain yang sesuai melalui aplikasi SIPJP.</p>
          ` : ''}

          ${isApproved ? `
            <p style="font-size: 14px; color: #334155;">Silakan mempersiapkan diri untuk mengikuti kegiatan pengembangan tersebut. Setelah kegiatan selesai, jangan lupa untuk mengunggah sertifikat ke sistem SIPJP untuk pemenuhan kewajiban 20 JP tahunan Anda.</p>
          ` : ''}

          <div style="text-align: center; margin-top: 25px;">
            <a href="https://sipjp-babar.vercel.app/login" class="btn-action">Lihat di Dashboard SIPJP &raquo;</a>
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0;">Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Daerah (BKPSDMD) Kab. Bangka Barat</p>
          <p style="margin: 4px 0 0 0; font-size: 11px;">Email ini dikirim secara otomatis oleh sistem SIPJP. Mohon jangan membalas email ini secara langsung.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: bawahanEmail, subject, html });
}
