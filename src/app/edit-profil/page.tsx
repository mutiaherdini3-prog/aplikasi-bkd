'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function EditProfilPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nip: '',
    nama: '',
    email: '',
    status_pegawai: '',
    golonganPangkat: '',
    jenkel: '',
    jabatan: '',
    unit_kerja: '',
    foto_profil: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const nip = localStorage.getItem('loggedInUser');
    if (!nip || nip === 'admin') {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/pegawai?nip=${nip}&_t=${Date.now()}`, { cache: 'no-store' });
        const json = await res.json();
        const data = json.data?.pegawai;
        if (data) {
          const gol = data.golongan && data.golongan !== '-' ? data.golongan : '';
          const pang = data.pangkat && data.pangkat !== '-' && data.pangkat !== 'Tidak Ada' ? data.pangkat : '';
          const golPangText = gol && pang ? `${gol} - ${pang}` : (gol || pang || '-');

          setFormData({
            nip: data.nip || '',
            nama: data.nama || '',
            email: data.email || '',
            status_pegawai: data.status_pegawai || '',
            golonganPangkat: golPangText,
            jenkel: data.jenkel || '',
            jabatan: data.jabatan || '',
            unit_kerja: data.unit_kerja || '',
            foto_profil: data.foto_profil || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchData();
  }, [router]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB');
      return;
    }

    setIsUploading(true);
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      
      if (data.success) {
        let directUrl = data.url;
        if (data.fileId) {
          if (String(data.fileId).startsWith('doc_')) {
            directUrl = `/api/dokumen?id=${data.fileId}`;
          } else {
            directUrl = `https://drive.google.com/thumbnail?id=${data.fileId}&sz=w500`;
          }
        }
        setFormData(prev => ({ ...prev, foto_profil: directUrl }));
      } else {
        alert('Gagal mengunggah foto: ' + data.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan saat mengunggah foto');
    } finally {
      setIsUploading(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('id=doc_')) {
      const match = url.match(/id=(doc_[a-zA-Z0-9_]+)/);
      if (match) return `/api/dokumen?id=${match[1]}`;
    }
    if (url.includes('drive.google.com/uc?export=view&id=')) {
      return url.replace('uc?export=view&id=', 'thumbnail?id=') + '&sz=w500';
    }
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/pegawai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nip: formData.nip,
          email: formData.email,
          foto_profil: formData.foto_profil
        })
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || json.error || 'Gagal menyimpan data');
      }
      
      // Sinkronkan email di local storage
      if (formData.email && formData.email.trim() !== '') {
        localStorage.setItem('userEmail', formData.email.trim().toLowerCase());
      } else {
        localStorage.removeItem('userEmail');
      }

      // Reload dashboard secara utuh agar data terbaru langsung tampil
      window.location.href = '/dashboard';
    } catch (err: any) {
      alert('Gagal menyimpan profil: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      <style dangerouslySetInnerHTML={{__html: `
        body { background-color: #f4f7f6; font-family: 'Inter', sans-serif; color: #334155; }
        .navbar-custom { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
        .card-custom { border: none; border-radius: 14px; box-shadow: 0 5px 20px rgba(0,0,0,0.06); }
      `}} />

      <nav className="navbar navbar-expand-lg navbar-dark navbar-custom py-3">
        <div className="container">
          <a className="navbar-brand text-white fw-bold d-flex align-items-center gap-2" href="#" onClick={(e) => { e.preventDefault(); router.push('/dashboard'); }}>
            <i className="bi bi-arrow-left"></i> Kembali ke Dashboard
          </a>
        </div>
      </nav>

      <div className="container mt-4 mb-5">
        <div className="row justify-content-center">
          <div className="col-lg-7 col-md-9">
            <div className="card card-custom p-4 bg-white">
              <div className="border-bottom pb-3 mb-4">
                <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <i className="bi bi-person-badge text-primary"></i> Pengaturan Profil Pegawai
                </h4>
                <p className="text-muted small mb-0">Kelola foto profil dan email notifikasi pengajuan Anda.</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Foto Profil */}
                  <div className="col-12 text-center mb-3">
                    <div 
                      className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle border border-3 shadow-sm position-relative overflow-hidden cursor-pointer" 
                      style={{ width: '130px', height: '130px', cursor: 'pointer' }}
                      onClick={() => fileInputRef.current?.click()}
                      title="Klik untuk ganti foto profil"
                    >
                      {formData.foto_profil ? (
                        <img src={getImageUrl(formData.foto_profil)} alt="Foto Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <i className="bi bi-person text-secondary" style={{ fontSize: '4.5rem' }}></i>
                      )}
                      {isUploading && (
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75">
                          <div className="spinner-border text-primary spinner-border-sm"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <button type="button" className="btn btn-sm btn-outline-primary mt-2 rounded-pill px-3 shadow-sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        <i className="bi bi-camera me-1"></i> Ubah Foto Profil
                      </button>
                      <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handlePhotoUpload} />
                    </div>
                  </div>

                  {/* Input Email Notifikasi (Fokus Utama) */}
                  <div className="col-12">
                    <div className="p-3 rounded-3 border border-primary border-opacity-25 bg-primary bg-opacity-10">
                      <label className="form-label fw-bold text-primary mb-1 d-flex align-items-center gap-1">
                        <i className="bi bi-envelope-check-fill"></i> Email Notifikasi Pengajuan IDP
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-envelope"></i></span>
                        <input 
                          type="email" 
                          className="form-control form-control-lg bg-white border-start-0" 
                          placeholder="contoh: nama@email.com" 
                          value={formData.email} 
                          onChange={e => setFormData(prev => ({...prev, email: e.target.value}))} 
                        />
                      </div>
                      <small className="text-muted mt-2 d-block" style={{ fontSize: '0.8rem' }}>
                        Digunakan untuk menerima pemberitahuan otomatis saat usulan IDP Anda disetujui atau memerlukan revisi.
                      </small>
                    </div>
                  </div>

                  {/* Data Kepegawaian (Read-Only dari Master Data BKD / Google Sheets) */}
                  <div className="col-12 mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold text-secondary mb-0 d-flex align-items-center gap-1">
                        <i className="bi bi-shield-lock-fill text-muted"></i> Data Kepegawaian Resmi
                      </h6>
                      <span className="badge bg-light text-muted border fw-semibold">
                        <i className="bi bi-database-check text-success me-1"></i>Tersinkronisasi BKD
                      </span>
                    </div>

                    <div className="p-3 bg-light rounded-3 border">
                      <div className="row g-3">
                        <div className="col-sm-6">
                          <label className="form-label text-muted small mb-0">NIP</label>
                          <div className="fw-bold text-dark">{formData.nip || '-'}</div>
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label text-muted small mb-0">Nama Lengkap</label>
                          <div className="fw-bold text-dark">{formData.nama || '-'}</div>
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label text-muted small mb-0">Status Pegawai</label>
                          <div className="fw-semibold text-dark">{formData.status_pegawai || '-'}</div>
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label text-muted small mb-0">Golongan / Pangkat</label>
                          <div className="fw-semibold text-dark">{formData.golonganPangkat || '-'}</div>
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label text-muted small mb-0">Jenis Kelamin</label>
                          <div className="fw-semibold text-dark">{formData.jenkel || '-'}</div>
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label text-muted small mb-0">Jabatan</label>
                          <div className="fw-semibold text-dark">{formData.jabatan || '-'}</div>
                        </div>
                        <div className="col-12">
                          <label className="form-label text-muted small mb-0">Unit Kerja</label>
                          <div className="fw-semibold text-dark">{formData.unit_kerja || '-'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-muted d-flex align-items-center gap-1 mt-2" style={{ fontSize: '0.78rem' }}>
                      <i className="bi bi-info-circle text-primary"></i>
                      <span>Data kepegawaian di atas bersumber langsung dari Google Sheets BKD dan tidak perlu diisi manual.</span>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4 pt-3 border-top gap-2">
                  <button type="button" onClick={() => router.push('/dashboard')} className="btn btn-outline-secondary px-3">
                    Batal
                  </button>
                  <button type="submit" disabled={isLoading} className="btn btn-primary px-4 fw-bold shadow-sm">
                    {isLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check2 me-1"></i>}
                    Simpan Profil
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
