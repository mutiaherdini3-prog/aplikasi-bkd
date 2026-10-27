'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [pegawai, setPegawai] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const currentNip = localStorage.getItem('loggedInUser');
      const cachedNip = sessionStorage.getItem('cached_nip');

      // Bersihkan seluruh cache jika NIP di session berbeda dengan user aktif
      if (cachedNip && currentNip && cachedNip !== currentNip) {
        sessionStorage.removeItem('cached_nip');
        sessionStorage.removeItem('cached_pegawai');
        sessionStorage.removeItem('cached_sertifikasi');
        sessionStorage.removeItem('cached_pendidikan');
        sessionStorage.removeItem('cached_idp');
      }

      const cached = sessionStorage.getItem('cached_pegawai');
      if (cached && currentNip) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && String(parsed.nip).trim() === String(currentNip).trim()) {
            return parsed;
          }
        } catch (e) {}
      }
      if (currentNip) {
        return {
          nip: currentNip,
          nama: localStorage.getItem('userName') || '',
          jabatan: localStorage.getItem('userJabatan') || '',
          unit_kerja: localStorage.getItem('userUnitKerja') || '',
          role: localStorage.getItem('userRole') || ''
        };
      }
    }
    return null;
  });

  const [sertifikasi, setSertifikasi] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const currentNip = localStorage.getItem('loggedInUser');
      const cachedNip = sessionStorage.getItem('cached_nip');
      if (currentNip && cachedNip === currentNip) {
        const cached = sessionStorage.getItem('cached_sertifikasi');
        if (cached) {
          try {
            const list = JSON.parse(cached);
            if (Array.isArray(list)) return list;
          } catch (e) {}
        }
      }
    }
    return [];
  });

  const [pendidikan, setPendidikan] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const currentNip = localStorage.getItem('loggedInUser');
      const cachedNip = sessionStorage.getItem('cached_nip');
      if (currentNip && cachedNip === currentNip) {
        const cached = sessionStorage.getItem('cached_pendidikan');
        if (cached) {
          try {
            const list = JSON.parse(cached);
            if (Array.isArray(list)) return list;
          } catch (e) {}
        }
      }
    }
    return [];
  });

  const [idpList, setIdpList] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const currentNip = localStorage.getItem('loggedInUser');
      const cachedNip = sessionStorage.getItem('cached_nip');
      if (currentNip && cachedNip === currentNip) {
        const cached = sessionStorage.getItem('cached_idp');
        if (cached) {
          try {
            const list = JSON.parse(cached);
            if (Array.isArray(list)) return list;
          } catch (e) {}
        }
      }
    }
    return [];
  });

  const [idpBawahan, setIdpBawahan] = useState<any[]>([]);
  const [isAtasan, setIsAtasan] = useState(false);
  const [totalJP, setTotalJP] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const currentNip = localStorage.getItem('loggedInUser');
      const cachedNip = sessionStorage.getItem('cached_nip');
      if (currentNip && cachedNip === currentNip) {
        const cached = sessionStorage.getItem('cached_sertifikasi');
        if (cached) {
          try {
            const list = JSON.parse(cached);
            if (Array.isArray(list)) {
              return list.reduce((sum, item) => sum + (item.jumlah_jp || 0), 0);
            }
          } catch (e) {}
        }
      }
    }
    return 0;
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // State untuk Konfirmasi Hapus
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchData = async () => {
    const nip = localStorage.getItem('loggedInUser');
    const storedRole = localStorage.getItem('userRole');
    if (!nip) {
      setLoadingData(false);
      return;
    }
    try {
      const isSuper = storedRole === 'super_admin';
      const [res, resBawahan] = await Promise.all([
        fetch(`/api/pegawai?nip=${encodeURIComponent(nip)}&_t=${Date.now()}`, { cache: 'no-store' }),
        !isSuper 
          ? fetch(`/api/pegawai?ketua_nip=${encodeURIComponent(nip)}&_t=${Date.now()}`, { cache: 'no-store' }) 
          : Promise.resolve(null)
      ]);

      const result = await res.json();
      if (result.success && result.data) {
        if (result.data.pegawai) {
          setPegawai(result.data.pegawai);
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('cached_nip', nip);
            sessionStorage.setItem('cached_pegawai', JSON.stringify(result.data.pegawai));
          }
        } else {
          setPegawai((prev: any) => prev || {
            nip: nip,
            nama: localStorage.getItem('userName') || '',
            jabatan: localStorage.getItem('userJabatan') || '',
            unit_kerja: localStorage.getItem('userUnitKerja') || '',
            role: localStorage.getItem('userRole') || 'pegawai'
          });
        }
        if (result.data.sertifikasi) {
          setSertifikasi(result.data.sertifikasi);
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('cached_nip', nip);
            sessionStorage.setItem('cached_sertifikasi', JSON.stringify(result.data.sertifikasi));
          }
          let sum = 0;
          result.data.sertifikasi.forEach((s: any) => sum += (s.jumlah_jp || 0));
          setTotalJP(sum);
        }
        if (result.data.pendidikan) {
          setPendidikan(result.data.pendidikan);
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('cached_nip', nip);
            sessionStorage.setItem('cached_pendidikan', JSON.stringify(result.data.pendidikan));
          }
        }
        if (result.data.idp) {
          setIdpList(result.data.idp);
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('cached_nip', nip);
            sessionStorage.setItem('cached_idp', JSON.stringify(result.data.idp));
          }
        }

        // Super Admin BKPSDMD approval hanya dari Dashboard Panel Admin (/admin), bukan di dashboard pegawai
        const currentRole = result.data.pegawai?.role || storedRole;
        if (currentRole === 'super_admin') {
          setIsAtasan(false);
          setIdpBawahan([]);
        } else if (result.data.isAtasan || currentRole === 'admin' || currentRole === 'admin_diklat') {
          setIsAtasan(true);
        } else {
          setIsAtasan(false);
        }
      }

      if (resBawahan) {
        const resultBawahan = await resBawahan.json();
        if (resultBawahan.success && resultBawahan.data) {
          setIdpBawahan(resultBawahan.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    const nip = localStorage.getItem('loggedInUser');
    if (!nip) {
      window.location.href = '/login';
      return;
    }
    if (nip === 'admin') {
      window.location.href = '/admin';
      return;
    }

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    window.location.href = '/login';
  };

  const hapusSertifikasi = async (rowIndex: string, namaKursus?: string) => {
    setDeleteConfirmData({
      title: 'Hapus Sertifikasi',
      message: `Apakah Anda yakin ingin menghapus sertifikasi${namaKursus ? ` "${namaKursus}"` : ''} ini? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        setIsDeleting(true);
        // Optimistic UI update
        setSertifikasi(prev => prev.filter(s => s._rowIndex !== rowIndex && s.rowIndex !== rowIndex));
        setShowDeleteConfirm(false);
        setDeleteConfirmData(null);
        try {
          const res = await fetch(`/api/sertifikasi?rowIndex=${rowIndex}`, { method: 'DELETE' });
          if (res.ok) { fetchData(); }
          else { alert('Gagal menghapus sertifikat'); fetchData(); }
        } catch (err) { alert('Terjadi kesalahan saat menghapus'); fetchData(); }
        finally { setIsDeleting(false); }
      }
    });
    setShowDeleteConfirm(true);
  };

  const hapusPendidikan = async (rowIndex: string, namaPendidikan?: string) => {
    if (rowIndex === 'pegawai_sheet') {
      alert('Pendidikan dasar ini diisi oleh Admin dan tidak dapat dihapus dari sini.');
      return;
    }
    setDeleteConfirmData({
      title: 'Hapus Riwayat Pendidikan',
      message: `Apakah Anda yakin ingin menghapus riwayat pendidikan${namaPendidikan ? ` "${namaPendidikan}"` : ''} ini? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        setIsDeleting(true);
        // Optimistic UI update
        setPendidikan(prev => prev.filter(p => p._rowIndex !== rowIndex && p.rowIndex !== rowIndex));
        setShowDeleteConfirm(false);
        setDeleteConfirmData(null);
        try {
          const res = await fetch(`/api/pendidikan?rowIndex=${rowIndex}`, { method: 'DELETE' });
          if (res.ok) { fetchData(); }
          else { alert('Gagal menghapus pendidikan'); fetchData(); }
        } catch (err) { alert('Terjadi kesalahan saat menghapus'); fetchData(); }
        finally { setIsDeleting(false); }
      }
    });
    setShowDeleteConfirm(true);
  };

  const hapusIDP = async (rowIndex: string, namaKompetensi?: string) => {
    setDeleteConfirmData({
      title: 'Hapus Pengajuan IDP',
      message: `Apakah Anda yakin ingin menghapus pengajuan IDP${namaKompetensi ? ` "${namaKompetensi}"` : ''} ini? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        setIsDeleting(true);
        // Optimistic UI update
        setIdpList(prev => prev.filter(item => item._rowIndex !== rowIndex && item.rowIndex !== rowIndex));
        setShowDeleteConfirm(false);
        setDeleteConfirmData(null);
        try {
          const res = await fetch(`/api/idp?rowIndex=${rowIndex}`, { method: 'DELETE' });
          if (res.ok) { fetchData(); }
          else { alert('Gagal menghapus IDP'); fetchData(); }
        } catch (err) { alert('Terjadi kesalahan saat menghapus IDP'); fetchData(); }
        finally { setIsDeleting(false); }
      }
    });
    setShowDeleteConfirm(true);
  };

  const updateStatusIdpBawahan = async (rowIndex: string, status: string) => {
    let alasan = '';
    if (status.startsWith('Ditolak')) {
      const input = prompt('Silakan masukkan alasan penolakan IDP bawahan:', 'Tidak tersedia anggaran');
      if (input === null) return; // User cancelled
      alasan = input.trim() || 'Tidak tersedia anggaran';
    } else {
      if (!confirm('Yakin ingin menyetujui pengajuan IDP ini untuk diteruskan ke verifikasi tahap 2 (BKPSDMD)?')) return;
    }

    // Optimistic UI update
    setIdpBawahan(prev => prev.map(item => {
      if (item._rowIndex === rowIndex || item.rowIndex === rowIndex) {
        return {
          ...item,
          status: status
        };
      }
      return item;
    }));
    
    try {
      const res = await fetch(`/api/idp?rowIndex=${rowIndex}&status=${encodeURIComponent(status)}&alasan=${encodeURIComponent(alasan)}`, { method: 'PUT' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Gagal memperbarui status');
        fetchData();
      }
    } catch (err) {
      alert('Terjadi kesalahan saat memperbarui status');
      fetchData();
    }
  };

  const pangkatGol = [];
  if (pegawai?.pangkat && pegawai.pangkat !== 'Tidak Ada' && pegawai.pangkat !== '-') pangkatGol.push(pegawai.pangkat);
  if (pegawai?.golongan && pegawai.golongan !== '-') pangkatGol.push(pegawai.golongan);

  // Logika target Jam Pelajaran (JP): PNS minimal 20 JP, PPPK/P3K minimal 24 JP
  const statusPegawaiStr = (pegawai?.status_pegawai || '').toUpperCase();
  const isPPPK = statusPegawaiStr.includes('P3K') || statusPegawaiStr.includes('PPPK');
  const targetJP = isPPPK ? 24 : 20;
  const statusLabel = isPPPK ? 'P3K' : 'PNS';
  const isMemenuhiJP = totalJP >= targetJP;
  const persentaseJP = Math.min(100, Math.round((totalJP / targetJP) * 100));
  const sisaJP = Math.max(0, targetJP - totalJP);
  const statusKepatuhanText = `${statusLabel} ${targetJP} JP (${isMemenuhiJP ? 'Memenuhi' : 'Belum Memenuhi'})`;

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      <style dangerouslySetInnerHTML={{__html: `
        body { background-color: #f4f7f6; font-family: 'Inter', sans-serif; color: #334155; }
        .navbar-custom { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .navbar-brand { font-weight: 700; letter-spacing: 0.5px; color: white !important; }
        .profile-banner { height: 200px; background: linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%); border-radius: 15px 15px 0 0; position: relative; }
        .profile-img-large { width: 160px; height: 160px; border-radius: 50%; border: 5px solid white; object-fit: cover; position: absolute; bottom: -80px; left: 50px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); background-color: white; display: flex; align-items: center; justify-content: center; font-size: 5rem; color: #cbd5e1; }
        .profile-card { border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-top: 30px; margin-bottom: 50px; }
        .profile-info-section { padding: 100px 50px 40px 50px; }
        .badge-status { background-color: #fef3c7; color: #b45309; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 0.85rem; }
        .info-label { color: #64748b; font-size: 0.9rem; margin-bottom: 2px; }
        .info-value { font-weight: 600; font-size: 1.05rem; color: #334155; }
        .info-value-empty { font-weight: 600; font-size: 1.05rem; color: #94a3b8; font-style: italic; }
        .menu-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; text-align: center; transition: all 0.3s ease; text-decoration: none; color: inherit; display: block; background: white; cursor: pointer; }
        .menu-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(14, 165, 233, 0.15); border-color: #bae6fd; color: inherit; }
        .menu-icon { width: 60px; height: 60px; border-radius: 50%; background-color: #f0f9ff; color: #0ea5e9; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 15px auto; transition: all 0.3s; }
        .menu-card:hover .menu-icon { background-color: #0ea5e9; color: white; }
        .menu-title { font-weight: 600; font-size: 1.1rem; margin-bottom: 5px; }
        .menu-desc { font-size: 0.85rem; color: #64748b; }
      `}} />

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark navbar-custom py-3">
        <div className="container">
          <a className="navbar-brand" href="#">
            <i className="bi bi-shield-lock-fill me-2 text-info"></i> Portal SIPJP-BABAR
          </a>
          <div className="d-flex align-items-center gap-2">
            <span className="text-white-50 me-2 ms-2"><i className="bi bi-clock me-1"></i> Terakhir login: Baru saja</span>
            <button onClick={handleLogout} className="btn btn-outline-light btn-sm rounded-pill px-3">Keluar</button>
          </div>
        </div>
      </nav>

      <div className="container mt-4">
        {/* Banner Pengingat Email Jika Belum Dilengkapi */}
        {pegawai && (!pegawai.email || pegawai.email.trim() === '') && (
          <div className="alert border-0 shadow-sm d-flex flex-wrap align-items-center justify-content-between p-3 mb-4 rounded-3" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)', borderLeft: '5px solid #0284c7' }}>
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

        {/* Banner Pengingat Pemenuhan Jam Pelajaran (JP) Seperti di Manual Book SIPEKA */}
        <div 
          className="alert border-0 shadow-sm d-flex flex-wrap align-items-center justify-content-between p-3 mb-4 rounded-3" 
          style={{ 
            background: isMemenuhiJP 
              ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' 
              : 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', 
            borderLeft: `5px solid ${isMemenuhiJP ? '#16a34a' : '#ca8a04'}` 
          }}
        >
          <div className="d-flex align-items-center mb-2 mb-md-0">
            <i className={`bi ${isMemenuhiJP ? 'bi-patch-check-fill text-success' : 'bi-bell-fill text-warning'} fs-3 me-3`}></i>
            <div>
              <strong className="text-dark d-block">
                {isMemenuhiJP ? 'Standar Jam Pelajaran Terpenuhi' : 'Pengingat Pemenuhan Jam Pelajaran (JP)'}:{' '}
                <span className={isMemenuhiJP ? 'text-success' : 'text-warning-emphasis'}>
                  {statusKepatuhanText}
                </span>
              </strong>
              <small className="text-secondary">
                {isMemenuhiJP 
                  ? `Target minimal ${statusLabel} (${targetJP} JP per tahun) telah tercapai. Total capaian Anda saat ini: ${totalJP} JP.`
                  : `Total saat ini: ${totalJP} JP. Anda masih membutuhkan ${sisaJP} JP lagi untuk memenuhi standar minimal ${statusLabel} (${targetJP} JP per tahun).`}
              </small>
            </div>
          </div>
          {!isMemenuhiJP && (
            <a href="/sertifikasi" className="btn btn-warning btn-sm px-3 fw-bold rounded-pill text-nowrap shadow-sm">
              <i className="bi bi-plus-circle me-1"></i> Tambah Pelatihan
            </a>
          )}
        </div>

        <div className="card profile-card">
          {/* Banner */}
          <div className="profile-banner">
            {pegawai?.foto_profil ? (
              <img 
                src={(() => {
                  const url = pegawai.foto_profil;
                  if (url.includes('id=doc_')) {
                    const match = url.match(/id=(doc_[a-zA-Z0-9_]+)/);
                    if (match) return `/api/dokumen?id=${match[1]}`;
                  }
                  if (url.includes('drive.google.com/uc?export=view&id=')) {
                    return url.replace('uc?export=view&id=', 'thumbnail?id=') + '&sz=w500';
                  }
                  return url;
                })()} 
                alt="Foto Profil" 
                className="profile-img-large" 
              />
            ) : (
              <div className="profile-img-large">
                <i className="bi bi-person"></i>
              </div>
            )}
          </div>
          
          <div className="profile-info-section">
            {/* Header Profil */}
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h2 className={`fw-bold mb-1 ${!pegawai?.nama ? 'text-muted fst-italic' : 'text-dark'}`}>
                  {pegawai?.nama || '[Nama Belum Diisi]'}
                </h2>
                <p className={`mb-2 ${!pegawai?.nip ? 'text-secondary fst-italic' : 'text-primary'}`} style={{ fontSize: '1.1rem' }}>
                  NIP. {pegawai?.nip || '[Belum Diisi]'}
                </p>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  {pegawai?.nama && pegawai?.nip ? (
                    <span className="badge-status" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                      <i className="bi bi-check-circle-fill me-1"></i> ASN Aktif
                    </span>
                  ) : (
                    <span className="badge-status">
                      <i className="bi bi-exclamation-circle-fill me-1"></i> Profil Belum Lengkap
                    </span>
                  )}
                </div>
              </div>
              <div>
                <a href="/edit-profil" className="btn btn-outline-primary btn-sm rounded-pill px-3 shadow-sm fw-medium">
                  <i className="bi bi-pencil-square me-1"></i> Edit Profil
                </a>
              </div>
            </div>

            <div className="row mt-5">
              {/* Detail Data Diri */}
              <div className="col-lg-8 pe-lg-5">
                <h5 className="fw-bold mb-4 border-bottom pb-2"><i className="bi bi-person-lines-fill me-2 text-primary"></i> Data Kepegawaian</h5>
                
                <div className="row g-4 mb-4">
                  <div className="col-sm-6">
                    <div className="info-label">Status Pegawai</div>
                    <div className={pegawai?.status_pegawai ? 'info-value' : 'info-value-empty'}>
                      {pegawai?.status_pegawai ? (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill">
                          {pegawai.status_pegawai}
                        </span>
                      ) : '[Belum Diisi]'}
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="info-label">Pangkat / Golongan Ruang</div>
                    <div className={pangkatGol.length > 0 ? 'info-value' : 'info-value-empty'}>
                      {pegawai?.status_pegawai === 'PW' ? '-' : (pangkatGol.length > 0 ? pangkatGol.join(' / ') : '[Belum Diisi]')}
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="info-label">Jenis Kelamin</div>
                    <div className={pegawai?.jenkel ? 'info-value' : 'info-value-empty'}>{pegawai?.jenkel || '[Belum Diisi]'}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="info-label">Jabatan</div>
                    <div className={pegawai?.jabatan ? 'info-value' : 'info-value-empty'}>{pegawai?.jabatan || '[Belum Diisi]'}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="info-label">Unit Kerja</div>
                    <div className={pegawai?.unit_kerja ? 'info-value' : 'info-value-empty'}>{pegawai?.unit_kerja || '[Belum Diisi]'}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="info-label">Email Notifikasi</div>
                    <div className={pegawai?.email ? 'info-value text-primary' : 'info-value-empty'}>
                      {pegawai?.email ? <><i className="bi bi-envelope me-1"></i>{pegawai.email}</> : '[Belum Diisi]'}
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="info-label">Total Jam Pelajaran (JP)</div>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <div className="info-value mb-0" style={{ color: '#0284c7', fontWeight: 'bold' }}>
                        {totalJP} JP
                      </div>
                      <span 
                        className={`badge rounded-pill fw-normal px-2 py-1 ${isMemenuhiJP ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'}`}
                        style={{ fontSize: '0.78rem' }}
                      >
                        {statusKepatuhanText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Riwayat Sertifikasi Tersimpan */}
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                  <h5 className="fw-bold mb-0"><i className="bi bi-award-fill me-2 text-primary"></i> Riwayat Sertifikasi Tersimpan</h5>
                  <span className="badge rounded-pill bg-primary" style={{ fontSize: '0.8rem' }}>
                    Total: {totalJP} JP
                  </span>
                </div>
                
                <div className="table-responsive border rounded-3 bg-white mb-4">
                  <table className="table table-hover mb-0" style={{ fontSize: '0.9rem' }}>
                    <thead className="bg-light">
                      <tr>
                        <th>No</th>
                        <th>Nama Kursus</th>
                        <th>Institusi</th>
                        <th>No. Sertifikat</th>
                        <th>Tanggal</th>
                        <th>JP</th>
                        <th className="text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingData && sertifikasi.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">
                            <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                            Memuat riwayat sertifikasi...
                          </td>
                        </tr>
                      ) : sertifikasi.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">Belum ada data riwayat sertifikasi.</td>
                        </tr>
                      ) : (
                        sertifikasi.map((s, index) => (
                          <tr key={s._rowIndex || index}>
                            <td>{index + 1}</td>
                            <td className="fw-bold text-primary">{s.nama_kursus || s.jenis_sertifikasi}</td>
                            <td>{s.institusi_penyelenggara || '-'}</td>
                            <td>{s.nomor_sertifikasi}</td>
                            <td>{s.tanggal_sertifikasi}</td>
                            <td><span className="badge bg-info rounded-pill">{s.jumlah_jp} JP</span></td>
                            <td className="text-center">
                              {s.link_sertifikat && (
                                <button className="btn btn-sm btn-outline-primary me-2" title="Lihat Dokumen" onClick={() => {
                                  let docUrl = s.link_sertifikat;
                                  if (docUrl.includes('/view?url=')) {
                                    docUrl = decodeURIComponent(docUrl.split('/view?url=')[1]);
                                  }
                                  if (docUrl.includes('drive.google.com')) {
                                    window.open(docUrl, '_blank');
                                    return;
                                  }
                                  setPreviewUrl(docUrl);
                                }}>
                                  <i className="bi bi-file-earmark-text"></i> Lihat
                                </button>
                              )}
                              <button className="btn btn-sm btn-outline-danger" title="Hapus" onClick={() => hapusSertifikasi(s._rowIndex, s.nama_kursus || s.jenis_sertifikasi)}>
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Riwayat Pendidikan Tersimpan */}
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2 mt-5">
                  <h5 className="fw-bold mb-0"><i className="bi bi-mortarboard-fill me-2 text-primary"></i> Riwayat Pendidikan Tersimpan</h5>
                </div>
                
                <div className="table-responsive border rounded-3 bg-white mb-4">
                  <table className="table table-hover mb-0" style={{ fontSize: '0.9rem' }}>
                    <thead className="bg-light">
                      <tr>
                        <th>No</th>
                        <th>Tingkat</th>
                        <th>Jurusan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingData && pendidikan.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-muted py-4">
                            <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                            Memuat riwayat pendidikan...
                          </td>
                        </tr>
                      ) : pendidikan.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-muted py-4">Belum ada data riwayat pendidikan.</td>
                        </tr>
                      ) : (
                        pendidikan.map((p, index) => (
                          <tr key={p._rowIndex || index}>
                            <td>{index + 1}</td>
                            <td className="fw-bold text-primary">{p.tingkat_pendidikan}</td>
                            <td>{p.jurusan || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Status Pengajuan IDP */}
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2 mt-5">
                  <h5 className="fw-bold mb-0"><i className="bi bi-calendar2-check-fill me-2 text-primary"></i> Status Pengajuan IDP (Individual Development Plan)</h5>
                </div>
                
                <div className="table-responsive border rounded-3 bg-white mb-4">
                  <table className="table table-hover mb-0" style={{ fontSize: '0.9rem' }}>
                    <thead className="bg-light">
                      <tr>
                        <th>No</th>
                        <th>Jenis Kompetensi</th>
                        <th>Bentuk Pengembangan</th>
                        <th>Waktu Pelaksanaan</th>
                        <th>JP</th>
                        <th>Status</th>
                        <th className="text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingData && idpList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">
                            <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                            Memuat pengajuan IDP...
                          </td>
                        </tr>
                      ) : idpList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">Belum ada pengajuan IDP.</td>
                        </tr>
                      ) : (
                        idpList.map((idp, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td className="fw-bold text-primary">{idp.jenis_kompetensi}</td>
                            <td>{idp.jenis_pengembangan} <br/><span className="text-muted" style={{fontSize: '0.8rem'}}>{idp.jalur_pengembangan}</span></td>
                            <td>{idp.waktu_pelaksanaan_awal} s.d. {idp.waktu_pelaksanaan_akhir}</td>
                            <td><span className="badge bg-secondary rounded-pill">{idp.jp} JP</span></td>
                            <td>
                              {idp.status === 'Disetujui' ? (
                                <span className="badge bg-success"><i className="bi bi-check-circle-fill me-1"></i>Disetujui Final (BKPSDMD)</span>
                              ) : (idp.status === 'Menunggu Persetujuan Admin' || idp.status === 'Menunggu Persetujuan BKPSDMD') ? (
                                <div>
                                  <span className="badge bg-info text-dark"><i className="bi bi-arrow-right-circle me-1"></i>Disetujui OPD</span>
                                  <div className="text-muted mt-1" style={{fontSize: '0.72rem'}}>Menunggu Final BKPSDMD</div>
                                </div>
                              ) : (idp.status === 'Menunggu Persetujuan Ketua' || idp.status === 'Menunggu Persetujuan Atasan OPD' || !idp.status) ? (
                                <span className="badge bg-warning text-dark"><i className="bi bi-clock-history me-1"></i>Menunggu Verifikasi OPD</span>
                              ) : idp.status === 'Ditolak BKPSDMD' ? (
                                <div>
                                  <span className="badge bg-danger"><i className="bi bi-x-circle-fill me-1"></i>Ditolak BKPSDMD</span>
                                  {idp.alasan_tolak && <div className="text-muted mt-1" style={{fontSize: '0.75rem', maxWidth:'170px'}}>Alasan: {idp.alasan_tolak}</div>}
                                </div>
                              ) : (idp.status === 'Ditolak OPD' || idp.status === 'Ditolak Atasan OPD') ? (
                                <div>
                                  <span className="badge bg-danger"><i className="bi bi-x-circle-fill me-1"></i>Ditolak OPD</span>
                                  {idp.alasan_tolak && <div className="text-muted mt-1" style={{fontSize: '0.75rem', maxWidth:'170px'}}>Alasan: {idp.alasan_tolak}</div>}
                                </div>
                              ) : idp.status?.toLowerCase().includes('ditolak') ? (
                                <div>
                                  <span className="badge bg-danger"><i className="bi bi-x-circle-fill me-1"></i>{idp.status}</span>
                                  {idp.alasan_tolak && <div className="text-muted mt-1" style={{fontSize: '0.75rem', maxWidth:'170px'}}>Alasan: {idp.alasan_tolak}</div>}
                                </div>
                              ) : idp.status === 'Selesai' ? (
                                <span className="badge bg-primary">Selesai (Bukti Terkirim)</span>
                              ) : (
                                <span className="badge bg-secondary">{idp.status}</span>
                              )}
                            </td>
                            <td className="text-center">
                              {idp.status !== 'Disetujui' ? (
                                <button className="btn btn-sm btn-outline-danger" title="Hapus Usulan IDP" onClick={() => hapusIDP(idp._rowIndex, idp.jenis_kompetensi)}>
                                  <i className="bi bi-trash"></i>
                                </button>
                              ) : (
                                <span className="badge bg-light text-muted border" title="IDP yang telah disetujui final tidak dapat dihapus sembarangan">Terkunci</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Approval IDP Bawahan */}
                {isAtasan && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2 mt-5">
                      <div>
                        <h5 className="fw-bold mb-0 text-success"><i className="bi bi-people-fill me-2"></i> Persetujuan IDP Bawahan (Tahap 1 - OPD)</h5>
                        <p className="text-muted small mb-0">Usulan yang disetujui akan diteruskan ke verifikasi tahap 2 (Admin BKPSDMD) untuk persetujuan final.</p>
                      </div>
                    </div>
                
                <div className="table-responsive border rounded-3 bg-white mb-4 border-success">
                  <table className="table table-hover mb-0" style={{ fontSize: '0.9rem' }}>
                    <thead className="bg-success text-white">
                      <tr>
                        <th>No</th>
                        <th>Nama Pegawai</th>
                        <th>Pengembangan</th>
                        <th>Pelaksanaan</th>
                        <th>JP</th>
                        <th>Status</th>
                        <th className="text-center">Aksi Verifikasi (OPD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {idpBawahan.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">Belum ada pengajuan IDP dari bawahan yang perlu diproses.</td>
                        </tr>
                      ) : (
                        idpBawahan.map((idp, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td><div className="fw-bold text-dark">{idp.nama_pegawai}</div><div className="text-muted" style={{fontSize: '0.75rem'}}>NIP. {idp.nip}</div></td>
                            <td>{idp.jenis_pengembangan} <br/><span className="text-muted" style={{fontSize: '0.8rem'}}>{idp.jalur_pengembangan}</span></td>
                            <td>{idp.waktu_pelaksanaan_awal} s.d. {idp.waktu_pelaksanaan_akhir}</td>
                            <td><span className="badge bg-secondary rounded-pill">{idp.jp} JP</span></td>
                            <td>
                              {idp.status === 'Disetujui' ? (
                                <span className="badge bg-success"><i className="bi bi-check-circle-fill me-1"></i>Disetujui Final (BKPSDMD)</span>
                              ) : (idp.status === 'Menunggu Persetujuan Admin' || idp.status === 'Menunggu Persetujuan BKPSDMD') ? (
                                <span className="badge bg-info text-dark"><i className="bi bi-arrow-right-circle me-1"></i>Disetujui OPD (Menunggu BKPSDMD)</span>
                              ) : (idp.status === 'Menunggu Persetujuan Ketua' || idp.status === 'Menunggu Persetujuan Atasan OPD' || !idp.status) ? (
                                <span className="badge bg-warning text-dark"><i className="bi bi-clock-history me-1"></i>Menunggu Verifikasi OPD</span>
                              ) : (
                                <span className="badge bg-danger"><i className="bi bi-x-circle-fill me-1"></i>{idp.status}</span>
                              )}
                            </td>
                            <td className="text-center">
                              {(idp.status === 'Menunggu Persetujuan Ketua' || idp.status === 'Menunggu Persetujuan Atasan OPD' || !idp.status) ? (
                                <div className="d-flex justify-content-center gap-1">
                                  <button className="btn btn-sm btn-success" title="Setujui dan teruskan ke BKPSDMD" onClick={() => updateStatusIdpBawahan(idp._rowIndex, 'Menunggu Persetujuan Admin')}>
                                    <i className="bi bi-check-lg me-1"></i> Setujui ke BKPSDMD
                                  </button>
                                  <button className="btn btn-sm btn-danger" title="Tolak Pengajuan" onClick={() => updateStatusIdpBawahan(idp._rowIndex, 'Ditolak OPD')}>
                                    <i className="bi bi-x-lg me-1"></i> Tolak
                                  </button>
                                </div>
                              ) : (idp.status === 'Menunggu Persetujuan Admin' || idp.status === 'Menunggu Persetujuan BKPSDMD') ? (
                                <span className="badge bg-info text-dark py-1 px-2"><i className="bi bi-check-circle me-1"></i>Telah Disetujui ke BKPSDMD</span>
                              ) : idp.status === 'Disetujui' ? (
                                <span className="badge bg-success py-1 px-2"><i className="bi bi-check2-all me-1"></i>Disetujui Final (BKPSDMD)</span>
                              ) : (
                                <span className="badge bg-danger py-1 px-2"><i className="bi bi-x-circle me-1"></i>{idp.status}</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                </>
              )}
              </div>

              {/* Sidebar Menu Interaktif */}
              <div className="col-lg-4 border-start ps-lg-4 mt-5 mt-lg-0">
                <h5 className="fw-bold mb-4"><i className="bi bi-grid-fill me-2 text-primary"></i> Layanan ASN</h5>
                
                <a onClick={() => router.push('/sertifikasi')} className="menu-card mb-3 text-decoration-none">
                  <div className="menu-icon"><i className="bi bi-award-fill"></i></div>
                  <div className="menu-title">Update Riwayat Sertifikasi</div>
                  <div className="menu-desc">Tambah dan unggah sertifikat pelatihan baru Anda.</div>
                </a>
                
                <a onClick={() => router.push('/pendidikan')} className="menu-card mb-3 text-decoration-none">
                  <div className="menu-icon"><i className="bi bi-mortarboard-fill"></i></div>
                  <div className="menu-title">Riwayat Pendidikan</div>
                  <div className="menu-desc">Pemutakhiran gelar dan ijazah pendidikan.</div>
                </a>

                <a onClick={() => router.push('/idp')} className="menu-card mb-3 text-decoration-none">
                  <div className="menu-icon"><i className="bi bi-calendar2-check-fill"></i></div>
                  <div className="menu-title">Individual Development Plan (IDP)</div>
                  <div className="menu-desc">Penyusunan rencana pengembangan kompetensi individu.</div>
                </a>

                {(pegawai?.role === 'admin' || pegawai?.role === 'super_admin' || pegawai?.role === 'admin_bkpsdmd' || isAtasan) && (
                  <a onClick={() => router.push('/admin')} className="menu-card mb-3 text-decoration-none" style={{ borderColor: '#86efac' }}>
                    <div className="menu-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}><i className="bi bi-shield-lock-fill"></i></div>
                    <div className="menu-title text-success">Panel Admin</div>
                    <div className="menu-desc">Kelola master data pegawai dan persetujuan.</div>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-4 text-muted" style={{ fontSize: '0.9rem' }}>
        <div className="container">
          <p className="mb-0">&copy; {new Date().getFullYear()} Badan Kepegawaian Daerah. All rights reserved.</p>
        </div>
      </footer>

      {/* Modal Preview Dokumen */}
      {previewUrl && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1055 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '95vw', height: '95vh', margin: 'auto' }}>
            <div className="modal-content border-0 bg-transparent" style={{ height: '100%' }}>
              <div className="modal-header border-0 d-flex justify-content-between align-items-center p-3 bg-dark text-white rounded-top">
                <h5 className="modal-title fw-bold"><i className="bi bi-file-earmark-text me-2"></i> Pratinjau Dokumen Sertifikat</h5>
                <button type="button" className="btn btn-danger px-4" onClick={() => setPreviewUrl(null)}>
                  <i className="bi bi-arrow-left me-1"></i> Kembali
                </button>
              </div>
              <div className="modal-body p-0 bg-light rounded-bottom" style={{ height: 'calc(100% - 60px)', overflow: 'hidden' }}>
                {(previewUrl.startsWith('data:image') || previewUrl.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', padding: '20px' }}>
                    <img src={previewUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }} alt="Sertifikat" />
                  </div>
                ) : (previewUrl.match(/\.(docx?|doc)($|[?#])/i) || previewUrl.match(/[?&]name=[^&]+\.(docx?|doc)/i)) && !previewUrl.includes('drive.google.com') ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px' }}>
                    <i className="bi bi-file-earmark-word-fill text-primary display-1 mb-3"></i>
                    <h4 className="fw-bold text-dark mb-2">Dokumen Microsoft Word</h4>
                    <p className="text-muted mb-4 text-center" style={{ maxWidth: '420px' }}>File sertifikat ini berformat Word (.doc / .docx). Anda dapat mengunduh dan membukanya di komputer atau perangkat Anda.</p>
                    <a href={previewUrl} download className="btn btn-primary px-4 py-2 rounded-pill shadow-sm">
                      <i className="bi bi-download me-2"></i> Unduh File Word
                    </a>
                  </div>
                ) : (
                  <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Dokumen Preview" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {showDeleteConfirm && deleteConfirmData && (
        <div style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,animation:'fadeInOverlay 0.2s ease-out'}} onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) { setShowDeleteConfirm(false); setDeleteConfirmData(null); } }}>
          <div style={{background:'white',borderRadius:'20px',padding:'40px 36px 32px',maxWidth:'440px',width:'90%',textAlign:'center',boxShadow:'0 25px 60px rgba(0,0,0,0.15)',animation:'slideInModal 0.3s cubic-bezier(0.16,1,0.3,1)'}}>
            <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'linear-gradient(135deg,#fee2e2,#fecaca)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',animation:'pulseWarning 2s ease-in-out infinite'}}>
              <i className="bi bi-exclamation-triangle-fill" style={{fontSize:'2rem',color:'#dc2626'}}></i>
            </div>
            <div style={{fontSize:'1.3rem',fontWeight:700,color:'#1e293b',marginBottom:'8px'}}>{deleteConfirmData.title}</div>
            <div style={{fontSize:'0.92rem',color:'#64748b',lineHeight:1.6,marginBottom:'28px'}}>{deleteConfirmData.message}</div>
            <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
              <button 
                style={{flex:1,padding:'12px 20px',borderRadius:'12px',fontWeight:600,fontSize:'0.95rem',border:'2px solid #e2e8f0',background:'white',color:'#475569',cursor:'pointer'}}
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmData(null); }}
                disabled={isDeleting}
              >Batal</button>
              <button 
                style={{flex:1,padding:'12px 20px',borderRadius:'12px',fontWeight:600,fontSize:'0.95rem',border:'none',background:'linear-gradient(135deg,#dc2626,#b91c1c)',color:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',opacity:isDeleting?0.7:1}}
                onClick={deleteConfirmData.onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <><div style={{width:'18px',height:'18px',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spinLoader 0.6s linear infinite'}}></div> Menghapus...</>
                ) : (
                  <><i className="bi bi-trash3-fill"></i> Ya, Hapus</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInModal { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes pulseWarning { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes spinLoader { to { transform: rotate(360deg); } }
      `}} />
    </>
  );
}
