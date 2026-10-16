'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UNIT_KERJA_OPTIONS, isUnitKerjaMatch } from '@/lib/unit-kerja-match';

export default function EditProfilPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nip: '',
    nama: '',
    email: '',
    status_pegawai: 'PNS',
    golonganPangkat: '',
    jenkel: '',
    jabatan: '',
    unit_kerja: '',
    foto_profil: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Normalisasi Status Pegawai (PNS / PPPK / PW)
  const normalizeStatus = (val?: string) => {
    if (!val) return 'PNS';
    const s = val.trim().toUpperCase();
    if (s.includes('PNS')) return 'PNS';
    if (s.includes('PPPK')) return 'PPPK';
    if (s.includes('PW') || s.includes('WIYATA') || s.includes('NON')) return 'PW';
    return val;
  };

  // Normalisasi Jenis Kelamin (Laki-Laki / Perempuan)
  const normalizeJenkel = (val?: string) => {
    if (!val) return '';
    const s = val.trim().toLowerCase();
    if (s === 'perempuan' || s === 'wanita' || s === 'p') return 'Perempuan';
    if (s === 'laki-laki' || s === 'laki - laki' || s === 'pria' || s === 'l') return 'Laki-Laki';
    return val;
  };

  // Normalisasi Golongan / Pangkat ke opsi dropdown
  const normalizeGolonganPangkat = (status: string, gol?: string, pang?: string) => {
    const normStatus = normalizeStatus(status);
    const cleanGol = (gol || '').trim();
    const cleanPang = (pang || '').trim();

    if (normStatus === 'PNS') {
      const pnsOptions = [
        "I/a - Juru Muda", "I/b - Juru Muda Tk. I", "I/c - Juru", "I/d - Juru Tk. I", 
        "II/a - Pengatur Muda", "II/b - Pengatur Muda Tk. I", "II/c - Pengatur", "II/d - Pengatur Tk. I", 
        "III/a - Penata Muda", "III/b - Penata Muda Tk. I", "III/c - Penata", "III/d - Penata Tk. I", 
        "IV/a - Pembina", "IV/b - Pembina Tk. I", "IV/c - Pembina Utama Muda", "IV/d - Pembina Utama Madya", "IV/e - Pembina Utama"
      ];
      // 1. Cek kecocokan golongan & pangkat
      if (cleanGol && cleanPang) {
        const matchBoth = pnsOptions.find(opt => 
          opt.toLowerCase().includes(cleanGol.toLowerCase()) && 
          opt.toLowerCase().includes(cleanPang.toLowerCase())
        );
        if (matchBoth) return matchBoth;
      }
      // 2. Cek kecocokan awalan golongan misal "I/b"
      if (cleanGol) {
        const matchGol = pnsOptions.find(opt => opt.toLowerCase().startsWith(cleanGol.toLowerCase() + ' '));
        if (matchGol) return matchGol;
      }
      // 3. Cek kecocokan nama pangkat
      if (cleanPang && cleanPang !== '-' && cleanPang !== 'Tidak Ada') {
        const matchPang = pnsOptions.find(opt => opt.toLowerCase().includes(cleanPang.toLowerCase()));
        if (matchPang) return matchPang;
      }
    } else if (normStatus === 'PPPK') {
      const cleanNum = cleanGol.replace(/[^IVX0-9]/gi, '').toUpperCase();
      if (cleanNum) return `Golongan ${cleanNum}`;
    }
    return cleanGol && cleanPang && cleanPang !== '-' ? `${cleanGol} - ${cleanPang}` : (cleanGol || cleanPang || '');
  };

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
          // Cari unit kerja yang paling cocok dari daftar opsi atau gunakan nilai aslinya
          let matchedUnit = (data.unit_kerja || localStorage.getItem('userUnitKerja') || '').trim();
          if (matchedUnit) {
            const exact = UNIT_KERJA_OPTIONS.find(u => u.toLowerCase() === matchedUnit.toLowerCase());
            if (exact) {
              matchedUnit = exact;
            } else {
              const fuzzy = UNIT_KERJA_OPTIONS.find(u => isUnitKerjaMatch(u, matchedUnit));
              if (fuzzy) matchedUnit = fuzzy;
            }
          }

          const normStatus = normalizeStatus(data.status_pegawai);
          const normJenkel = normalizeJenkel(data.jenkel);
          const normGolPang = normalizeGolonganPangkat(normStatus, data.golongan, data.pangkat);

          setFormData({
            nip: data.nip || nip,
            nama: data.nama || localStorage.getItem('userName') || '',
            email: data.email || localStorage.getItem('userEmail') || '',
            status_pegawai: normStatus,
            golonganPangkat: normGolPang,
            jenkel: normJenkel,
            jabatan: data.jabatan || localStorage.getItem('userJabatan') || '',
            unit_kerja: matchedUnit,
            foto_profil: data.foto_profil || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchData();
  }, [router]);

  const getGolonganOptions = () => {
    const norm = normalizeStatus(formData.status_pegawai);
    if (norm === 'PNS') {
      return [
        "I/a - Juru Muda", "I/b - Juru Muda Tk. I", "I/c - Juru", "I/d - Juru Tk. I", 
        "II/a - Pengatur Muda", "II/b - Pengatur Muda Tk. I", "II/c - Pengatur", "II/d - Pengatur Tk. I", 
        "III/a - Penata Muda", "III/b - Penata Muda Tk. I", "III/c - Penata", "III/d - Penata Tk. I", 
        "IV/a - Pembina", "IV/b - Pembina Tk. I", "IV/c - Pembina Utama Muda", "IV/d - Pembina Utama Madya", "IV/e - Pembina Utama"
      ];
    } else if (norm === 'PPPK') {
      return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII"].map(g => `Golongan ${g}`);
    }
    return [];
  };

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

    let valGolongan = '-';
    let valPangkat = '-';
    
    const normStatus = normalizeStatus(formData.status_pegawai);
    if (formData.golonganPangkat && normStatus === 'PNS') {
      const parts = formData.golonganPangkat.split(' - ');
      valGolongan = parts[0] || '-';
      valPangkat = parts[1] || '-';
    } else if (formData.golonganPangkat && normStatus === 'PPPK') {
      valGolongan = formData.golonganPangkat.replace(/^Golongan\s+/i, '');
      valPangkat = 'Tidak Ada';
    }

    try {
      const res = await fetch('/api/pegawai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nip: formData.nip,
          nama: formData.nama,
          email: formData.email,
          status_pegawai: formData.status_pegawai,
          pangkat: valPangkat,
          golongan: valGolongan,
          jenkel: formData.jenkel,
          jabatan: formData.jabatan,
          unit_kerja: formData.unit_kerja,
          foto_profil: formData.foto_profil
        })
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || json.error || 'Gagal menyimpan data');
      }
      
      // Sinkronkan data di local storage
      if (formData.nama) localStorage.setItem('userName', formData.nama);
      if (formData.jabatan) localStorage.setItem('userJabatan', formData.jabatan);
      if (formData.unit_kerja) localStorage.setItem('userUnitKerja', formData.unit_kerja);
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

  const golOptions = getGolonganOptions();

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      <style dangerouslySetInnerHTML={{__html: `
        body { background-color: #f4f7f6; font-family: 'Inter', sans-serif; color: #334155; }
        .navbar-custom { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
        .card-custom { border: none; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
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
          <div className="col-md-8">
            <div className="card card-custom p-4 bg-white">
              <h4 className="fw-bold mb-4 border-bottom pb-3"><i className="bi bi-person-gear text-primary me-2"></i> Lengkapi Profil Kepegawaian</h4>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Foto Profil */}
                  <div className="col-md-12 text-center mb-3">
                    <div 
                      className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle border border-3 shadow-sm mb-2 position-relative overflow-hidden cursor-pointer" 
                      style={{ width: '120px', height: '120px', cursor: 'pointer' }}
                      onClick={() => fileInputRef.current?.click()}
                      title="Klik untuk ubah foto profil"
                    >
                      {formData.foto_profil ? (
                        <img src={getImageUrl(formData.foto_profil)} alt="Foto Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <i className="bi bi-person text-secondary" style={{ fontSize: '4rem' }}></i>
                      )}
                      {isUploading && (
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75">
                          <div className="spinner-border text-primary spinner-border-sm"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        <i className="bi bi-camera me-1"></i> Ubah Foto
                      </button>
                      <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handlePhotoUpload} />
                    </div>
                  </div>
                  
                  {/* NIP (Readonly) */}
                  <div className="col-md-6">
                    <label className="form-label fw-medium small mb-1">NIP *</label>
                    <input type="text" className="form-control bg-light" readOnly value={formData.nip} />
                  </div>

                  {/* Nama Lengkap */}
                  <div className="col-md-6">
                    <label className="form-label fw-medium small mb-1">Nama Lengkap (Termasuk Gelar) *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Contoh: Budi Santoso, S.Kom." 
                      required 
                      value={formData.nama} 
                      onChange={e => setFormData({...formData, nama: e.target.value})} 
                    />
                  </div>

                  {/* Email Notifikasi (Fokus pengisian - opsional / boleh kosong) */}
                  <div className="col-md-12">
                    <label className="form-label fw-medium small mb-1">Email Notifikasi</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                      <input 
                        type="email" 
                        className="form-control" 
                        placeholder="contoh: nama@email.com (opsional)" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                      />
                    </div>
                    <small className="text-muted" style={{ fontSize: '0.78rem' }}>Digunakan untuk menerima notifikasi pengajuan dan persetujuan IDP. Dapat diubah atau dikosongkan kapan saja.</small>
                  </div>
                  
                  {/* Status Pegawai */}
                  <div className="col-md-12">
                    <label className="form-label fw-medium small mb-1">Status Pegawai *</label>
                    <select 
                      className="form-select" 
                      required 
                      value={formData.status_pegawai} 
                      onChange={e => setFormData({...formData, status_pegawai: e.target.value, golonganPangkat: ''})}
                    >
                      <option value="">- Pilih Status -</option>
                      <option value="PNS">PNS</option>
                      <option value="PPPK">PPPK</option>
                      <option value="PW">PW (Pegawai Wiyata / Non-ASN)</option>
                    </select>
                  </div>
                  
                  {/* Golongan / Pangkat */}
                  <div className="col-md-12">
                    <label className="form-label fw-medium small mb-1">Golongan / Pangkat *</label>
                    <select 
                      className="form-select" 
                      required={formData.status_pegawai !== 'PW'} 
                      disabled={!formData.status_pegawai || formData.status_pegawai === 'PW'} 
                      value={formData.golonganPangkat} 
                      onChange={e => setFormData({...formData, golonganPangkat: e.target.value})}
                    >
                      <option value="">- Pilih Golongan / Pangkat -</option>
                      {formData.golonganPangkat && !golOptions.includes(formData.golonganPangkat) && (
                        <option value={formData.golonganPangkat}>{formData.golonganPangkat}</option>
                      )}
                      {golOptions.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Jenis Kelamin (Otomatis terpilih Laki-Laki / Perempuan) */}
                  <div className="col-md-6">
                    <label className="form-label fw-medium small mb-1">Jenis Kelamin *</label>
                    <select 
                      className="form-select" 
                      required 
                      value={formData.jenkel} 
                      onChange={e => setFormData({...formData, jenkel: e.target.value})}
                    >
                      <option value="">- Pilih Jenis Kelamin -</option>
                      <option value="Laki-Laki">Laki-Laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  
                  {/* Jabatan */}
                  <div className="col-md-6">
                    <label className="form-label fw-medium small mb-1">Jabatan *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Contoh: Pranata Komputer Ahli Muda" 
                      required 
                      value={formData.jabatan} 
                      onChange={e => setFormData({...formData, jabatan: e.target.value})} 
                    />
                  </div>
                  
                  {/* Unit Kerja (Otomatis terpilih unit kerja dari database) */}
                  <div className="col-md-12">
                    <label className="form-label fw-medium small mb-1">Unit Kerja (Kab. Bangka Barat) *</label>
                    <select 
                      className="form-select" 
                      required 
                      value={formData.unit_kerja} 
                      onChange={e => setFormData({...formData, unit_kerja: e.target.value})}
                    >
                      <option value="">- PILIH UNIT KERJA -</option>
                      {formData.unit_kerja && !UNIT_KERJA_OPTIONS.some(o => o.toLowerCase() === formData.unit_kerja.toLowerCase()) && (
                        <option value={formData.unit_kerja}>{formData.unit_kerja}</option>
                      )}
                      {UNIT_KERJA_OPTIONS.map(opd => (
                        <option key={opd} value={opd}>{opd}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                  <button type="button" onClick={() => router.push('/dashboard')} className="btn btn-outline-secondary me-2">Batal</button>
                  <button type="submit" disabled={isLoading} className="btn btn-primary px-4 fw-bold">
                    {isLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-1"></i>}
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
