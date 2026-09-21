'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function EditProfilPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nip: '',
    nama: '',
    status_pegawai: '',
    golonganPangkat: '', // Gabungan untuk dropdown
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
        const res = await fetch(`/api/pegawai?nip=${nip}`);
        const json = await res.json();
        const data = json.data?.pegawai;
        if (data) {
          setFormData({
            nip: data.nip || '',
            nama: data.nama || '',
            status_pegawai: data.status_pegawai || '',
            golonganPangkat: (data.golongan && data.pangkat && data.pangkat !== 'Tidak Ada' && data.pangkat !== '-')
              ? `${data.golongan} - ${data.pangkat}`
              : (data.golongan || ''),
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



  const getGolonganOptions = () => {
    if (formData.status_pegawai === 'PNS') {
      return [
        "I/a - Juru Muda", "I/b - Juru Muda Tk. I", "I/c - Juru", "I/d - Juru Tk. I", 
        "II/a - Pengatur Muda", "II/b - Pengatur Muda Tk. I", "II/c - Pengatur", "II/d - Pengatur Tk. I", 
        "III/a - Penata Muda", "III/b - Penata Muda Tk. I", "III/c - Penata", "III/d - Penata Tk. I", 
        "IV/a - Pembina", "IV/b - Pembina Tk. I", "IV/c - Pembina Utama Muda", "IV/d - Pembina Utama Madya", "IV/e - Pembina Utama"
      ];
    } else if (formData.status_pegawai === 'PPPK') {
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
          directUrl = `https://drive.google.com/thumbnail?id=${data.fileId}&sz=w500`;
        }
        setFormData({ ...formData, foto_profil: directUrl });
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
    
    if (formData.golonganPangkat && formData.status_pegawai === 'PNS') {
      const parts = formData.golonganPangkat.split(' - ');
      valGolongan = parts[0] || '-';
      valPangkat = parts[1] || '-';
    } else if (formData.golonganPangkat && formData.status_pegawai === 'PPPK') {
      valGolongan = formData.golonganPangkat;
      valPangkat = 'Tidak Ada';
    }

    try {
      const res = await fetch('/api/pegawai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nip: formData.nip,
          nama: formData.nama,
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
      
      router.push('/dashboard');
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
        .card-custom { border: none; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
      `}} />

      <nav className="navbar navbar-expand-lg navbar-dark navbar-custom py-3">
        <div className="container">
          <a className="navbar-brand text-white fw-bold" href="#" onClick={(e) => { e.preventDefault(); router.push('/dashboard'); }}>
            <i className="bi bi-arrow-left me-2"></i> Kembali ke Profil
          </a>
        </div>
      </nav>

      <div className="container mt-5 mb-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card card-custom p-4">
              <h4 className="fw-bold mb-4 border-bottom pb-3"><i className="bi bi-person-gear text-primary me-2"></i> Lengkapi Profil Kepegawaian</h4>
              
              <div className="alert alert-info border-0 bg-info bg-opacity-10 mb-4">
                <i className="bi bi-info-circle-fill me-2 text-info"></i> Silakan lengkapi data diri Anda di bawah ini sesuai dengan dokumen kepegawaian yang sah.
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-12 text-center mb-3">
                    <div 
                      className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle border border-3 shadow-sm mb-2 position-relative overflow-hidden cursor-pointer" 
                      style={{ width: '120px', height: '120px', cursor: 'pointer' }}
                      onClick={() => fileInputRef.current?.click()}
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
                  
                  <div className="col-md-6">
                    <label className="form-label fw-medium small mb-1">NIP *</label>
                    <input type="text" className="form-control" readOnly value={formData.nip} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium small mb-1">Nama Lengkap (Termasuk Gelar) *</label>
                    <input type="text" className="form-control" placeholder="Contoh: Budi Santoso, S.Kom." required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
                  </div>
                  
                  <div className="col-md-12">
                    <label className="form-label fw-medium small mb-1">Status Pegawai *</label>
                    <select className="form-select" required value={formData.status_pegawai} onChange={e => setFormData({...formData, status_pegawai: e.target.value, golonganPangkat: ''})}>
                      <option value="">- Pilih Status -</option>
                      <option value="PNS">PNS</option>
                      <option value="PPPK">PPPK</option>
                      <option value="PW">PW (Pegawai Wiyata / Non-ASN)</option>
                    </select>
                  </div>
                  
                  <div className="col-md-12">
                    <label className="form-label fw-medium small mb-1">Golongan / Pangkat *</label>
                    <select className="form-select" required={formData.status_pegawai !== 'PW'} disabled={!formData.status_pegawai || formData.status_pegawai === 'PW'} value={formData.golonganPangkat} onChange={e => setFormData({...formData, golonganPangkat: e.target.value})}>
                      <option value="">- Pilih Golongan / Pangkat -</option>
                      {getGolonganOptions().map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label fw-medium small mb-1">Jenis Kelamin *</label>
                    <select className="form-select" required value={formData.jenkel} onChange={e => setFormData({...formData, jenkel: e.target.value})}>
                      <option value="">- Pilih Jenis Kelamin -</option>
                      <option value="Laki-Laki">Laki-Laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label fw-medium small mb-1">Jabatan *</label>
                    <input type="text" className="form-control" placeholder="Contoh: Pranata Komputer Ahli Muda" required value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})} />
                  </div>
                  
                  <div className="col-md-12">
                    <label className="form-label fw-medium small mb-1">Unit Kerja (Kab. Bangka Barat) *</label>
                    <select className="form-select" required value={formData.unit_kerja} onChange={e => setFormData({...formData, unit_kerja: e.target.value})}>
<option value="">- Pilih Unit Kerja -</option>
                                        <option value="Sekretariat Daerah">Sekretariat Daerah</option>\n                                        <option value="Asisten Pemerintahan dan Kesejahteraan Rakyat">Asisten Pemerintahan dan Kesejahteraan Rakyat</option>\n                                        <option value="Asisten Perekonomian dan Pembangunan">Asisten Perekonomian dan Pembangunan</option>\n                                        <option value="Asisten Administrasi Umum">Asisten Administrasi Umum</option>\n                                        <option value="Staf Ahli Bupati Bidang Hukum, Politik dan Pemerintahan">Staf Ahli Bupati Bidang Hukum, Politik dan Pemerintahan</option>\n                                        <option value="Staf Ahli Bupati Bidang Ekonomi dan Pembangunan">Staf Ahli Bupati Bidang Ekonomi dan Pembangunan</option>\n                                        <option value="Staf Ahli Bupati Bidang Kemasyarakatan dan Sumber Daya Manusia">Staf Ahli Bupati Bidang Kemasyarakatan dan Sumber Daya Manusia</option>\n                                        <option value="Bagian Kesejahteraan Rakyat">Bagian Kesejahteraan Rakyat</option>\n                                        <option value="Bagian Tata Pemerintahan">Bagian Tata Pemerintahan</option>\n                                        <option value="Bagian Perekonomian dan Pembangunan">Bagian Perekonomian dan Pembangunan</option>\n                                        <option value="Bagian Pengadaan Barang dan Jasa">Bagian Pengadaan Barang dan Jasa</option>\n                                        <option value="Bagian Hukum">Bagian Hukum</option>\n                                        <option value="Bagian Umum, Perlengkapan dan Protokol">Bagian Umum, Perlengkapan dan Protokol</option>\n                                        <option value="Bagian Organisasi">Bagian Organisasi</option>\n                                        <option value="Sekretariat DPRD">Sekretariat DPRD</option>\n                                        <option value="Inspektorat">Inspektorat</option>\n                                        <option value="Badan Pengelolaan Keuangan dan Aset Daerah">Badan Pengelolaan Keuangan dan Aset Daerah</option>\n                                        <option value="Badan Pengelolaan Pajak dan Retribusi Daerah">Badan Pengelolaan Pajak dan Retribusi Daerah</option>\n                                        <option value="Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Daerah">Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Daerah</option>\n                                        <option value="Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah">Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah</option>\n                                        <option value="Badan Penanggulangan Bencana Daerah">Badan Penanggulangan Bencana Daerah</option>\n                                        <option value="Badan Kesatuan Bangsa dan Politik">Badan Kesatuan Bangsa dan Politik</option>\n                                        <option value="Dinas Perhubungan, Perumahan dan Kawasan Permukiman">Dinas Perhubungan, Perumahan dan Kawasan Permukiman</option>\n                                        <option value="Dinas Komunikasi dan Informatika">Dinas Komunikasi dan Informatika</option>\n                                        <option value="Dinas Kebudayaan dan Pariwisata">Dinas Kebudayaan dan Pariwisata</option>\n                                        <option value="Dinas Perikanan">Dinas Perikanan</option>\n                                        <option value="Dinas Koperasi, Usaha Kecil Menengah dan Perdagangan">Dinas Koperasi, Usaha Kecil Menengah dan Perdagangan</option>\n                                        <option value="Dinas Perindustrian dan Tenaga Kerja">Dinas Perindustrian dan Tenaga Kerja</option>\n                                        <option value="Dinas Perpustakaan dan Kearsipan">Dinas Perpustakaan dan Kearsipan</option>\n                                        <option value="Dinas Pekerjaan Umum dan Penataan Ruang">Dinas Pekerjaan Umum dan Penataan Ruang</option>\n                                        <option value="Dinas Pendidikan,kepemudaan & Olah Raga">Dinas Pendidikan,kepemudaan & Olah Raga</option>\n                                        <option value="SMP Negeri 1 Mentok">SMP Negeri 1 Mentok</option>\n                                        <option value="SMP Negeri 2 Mentok">SMP Negeri 2 Mentok</option>\n                                        <option value="SMP Negeri 3 Mentok">SMP Negeri 3 Mentok</option>\n                                        <option value="SMP Negeri 4 Mentok">SMP Negeri 4 Mentok</option>\n                                        <option value="SMP Negeri 5 Mentok">SMP Negeri 5 Mentok</option>\n                                        <option value="SMP Negeri 6 Mentok">SMP Negeri 6 Mentok</option>\n                                        <option value="SD Negeri 01 Mentok">SD Negeri 01 Mentok</option>\n                                        <option value="SD Negeri 02 Mentok">SD Negeri 02 Mentok</option>\n                                        <option value="SD Negeri 03 Mentok">SD Negeri 03 Mentok</option>\n                                        <option value="SD Negeri 04 Mentok">SD Negeri 04 Mentok</option>\n                                        <option value="SD Negeri 05 Mentok">SD Negeri 05 Mentok</option>\n                                        <option value="SD Negeri 06 Mentok">SD Negeri 06 Mentok</option>\n                                        <option value="SD Negeri 07 Mentok">SD Negeri 07 Mentok</option>\n                                        <option value="SD Negeri 08 Mentok">SD Negeri 08 Mentok</option>\n                                        <option value="SD Negeri 09 Mentok">SD Negeri 09 Mentok</option>\n                                        <option value="SD Negeri 10 Mentok">SD Negeri 10 Mentok</option>\n                                        <option value="SD Negeri 11 Mentok">SD Negeri 11 Mentok</option>\n                                        <option value="SD Negeri 12 Mentok">SD Negeri 12 Mentok</option>\n                                        <option value="SD Negeri 13 Mentok">SD Negeri 13 Mentok</option>\n                                        <option value="SD Negeri 14 Mentok">SD Negeri 14 Mentok</option>\n                                        <option value="SD Negeri 15 Mentok">SD Negeri 15 Mentok</option>\n                                        <option value="SD Negeri 16 Mentok">SD Negeri 16 Mentok</option>\n                                        <option value="SD Negeri 17 Mentok">SD Negeri 17 Mentok</option>\n                                        <option value="SD Negeri 18 Mentok">SD Negeri 18 Mentok</option>\n                                        <option value="SD Negeri 19 Mentok">SD Negeri 19 Mentok</option>\n                                        <option value="SD Negeri 20 Mentok">SD Negeri 20 Mentok</option>\n                                        <option value="SD Negeri 21 Mentok">SD Negeri 21 Mentok</option>\n                                        <option value="SD Negeri 22 Mentok">SD Negeri 22 Mentok</option>\n                                        <option value="SD Negeri 23 Mentok">SD Negeri 23 Mentok</option>\n                                        <option value="SD Negeri 24 Mentok">SD Negeri 24 Mentok</option>\n                                        <option value="TK Negeri Pembina Mentok">TK Negeri Pembina Mentok</option>\n                                        <option value="TK Negeri Sejiran Setason Mentok">TK Negeri Sejiran Setason Mentok</option>\n                                        <option value="SMP Negeri 1 Jebus">SMP Negeri 1 Jebus</option>\n                                        <option value="SMP Negeri 2 Jebus">SMP Negeri 2 Jebus</option>\n                                        <option value="SMP Negeri 3 Jebus">SMP Negeri 3 Jebus</option>\n                                        <option value="SD Negeri 01 Jebus">SD Negeri 01 Jebus</option>\n                                        <option value="SD Negeri 02 Jebus">SD Negeri 02 Jebus</option>\n                                        <option value="SD Negeri 03 Jebus">SD Negeri 03 Jebus</option>\n                                        <option value="SD Negeri 04 Jebus">SD Negeri 04 Jebus</option>\n                                        <option value="SD Negeri 05 Jebus">SD Negeri 05 Jebus</option>\n                                        <option value="SD Negeri 06 Jebus">SD Negeri 06 Jebus</option>\n                                        <option value="SD Negeri 07 Jebus">SD Negeri 07 Jebus</option>\n                                        <option value="SD Negeri 08 Jebus">SD Negeri 08 Jebus</option>\n                                        <option value="SD Negeri 09 Jebus">SD Negeri 09 Jebus</option>\n                                        <option value="SD Negeri 10 Jebus">SD Negeri 10 Jebus</option>\n                                        <option value="SD Negeri 11 Jebus">SD Negeri 11 Jebus</option>\n                                        <option value="SD Negeri 12 Jebus">SD Negeri 12 Jebus</option>\n                                        <option value="SD Negeri 13 Jebus">SD Negeri 13 Jebus</option>\n                                        <option value="SD Negeri 14 Jebus">SD Negeri 14 Jebus</option>\n                                        <option value="SD Negeri 15 Jebus">SD Negeri 15 Jebus</option>\n                                        <option value="SD Negeri 16 Jebus">SD Negeri 16 Jebus</option>\n                                        <option value="SD Negeri 17 Jebus">SD Negeri 17 Jebus</option>\n                                        <option value="TK Negeri Pembina Jebus">TK Negeri Pembina Jebus</option>\n                                        <option value="SMP Negeri 1 Parittiga">SMP Negeri 1 Parittiga</option>\n                                        <option value="SMP Negeri 2 Parittiga">SMP Negeri 2 Parittiga</option>\n                                        <option value="SMP Negeri 3 Parittiga">SMP Negeri 3 Parittiga</option>\n                                        <option value="SMP Negeri 4 Parittiga">SMP Negeri 4 Parittiga</option>\n                                        <option value="SD Negeri 01 Parittiga">SD Negeri 01 Parittiga</option>\n                                        <option value="SD Negeri 02 Parittiga">SD Negeri 02 Parittiga</option>\n                                        <option value="SD Negeri 03 Parittiga">SD Negeri 03 Parittiga</option>\n                                        <option value="SD Negeri 04 Parittiga">SD Negeri 04 Parittiga</option>\n                                        <option value="SD Negeri 05 Parittiga">SD Negeri 05 Parittiga</option>\n                                        <option value="SD Negeri 06 Parittiga">SD Negeri 06 Parittiga</option>\n                                        <option value="SD Negeri 07 Parittiga">SD Negeri 07 Parittiga</option>\n                                        <option value="SD Negeri 08 Parittiga">SD Negeri 08 Parittiga</option>\n                                        <option value="SD Negeri 09 Parittiga">SD Negeri 09 Parittiga</option>\n                                        <option value="SD Negeri 10 Parittiga">SD Negeri 10 Parittiga</option>\n                                        <option value="SD Negeri 11 Parittiga">SD Negeri 11 Parittiga</option>\n                                        <option value="SD Negeri 12 Parittiga">SD Negeri 12 Parittiga</option>\n                                        <option value="SD Negeri 13 Parittiga">SD Negeri 13 Parittiga</option>\n                                        <option value="SD Negeri 14 Parittiga">SD Negeri 14 Parittiga</option>\n                                        <option value="SD Negeri 15 Parittiga">SD Negeri 15 Parittiga</option>\n                                        <option value="SD Negeri 16 Parittiga">SD Negeri 16 Parittiga</option>\n                                        <option value="SD Negeri 17 Parittiga">SD Negeri 17 Parittiga</option>\n                                        <option value="SD Negeri 18 Parittiga">SD Negeri 18 Parittiga</option>\n                                        <option value="SD Negeri 19 Parittiga">SD Negeri 19 Parittiga</option>\n                                        <option value="TK Negeri Pembina Parittiga">TK Negeri Pembina Parittiga</option>\n                                        <option value="SMP Negeri 1 Kelapa">SMP Negeri 1 Kelapa</option>\n                                        <option value="SMP Negeri 2 Kelapa">SMP Negeri 2 Kelapa</option>\n                                        <option value="SMP Negeri 3 Kelapa">SMP Negeri 3 Kelapa</option>\n                                        <option value="SMP Negeri 4 Kelapa">SMP Negeri 4 Kelapa</option>\n                                        <option value="SMP Negeri 5 Kelapa">SMP Negeri 5 Kelapa</option>\n                                        <option value="SD Negeri 1 Kelapa">SD Negeri 1 Kelapa</option>\n                                        <option value="SD Negeri 2 Kelapa">SD Negeri 2 Kelapa</option>\n                                        <option value="SD Negeri 3 Tebing kec. Kelapa">SD Negeri 3 Tebing kec. Kelapa</option>\n                                        <option value="SD Negeri 4 Desa Pusuk kec. Kelapa">SD Negeri 4 Desa Pusuk kec. Kelapa</option>\n                                        <option value="SD Negeri 5 Tuik kec. Kelapa">SD Negeri 5 Tuik kec. Kelapa</option>\n                                        <option value="SD Negeri 6 Mancung kec. Kelapa">SD Negeri 6 Mancung kec. Kelapa</option>\n                                        <option value="SD Negeri 7 Kayu Arang kec. Kelapa">SD Negeri 7 Kayu Arang kec. Kelapa</option>\n                                        <option value="SD Negeri 8 SP. Bulin kec. Kelapa">SD Negeri 8 SP. Bulin kec. Kelapa</option>\n                                        <option value="SD Negeri 9 Air Bulin kec. Kelapa">SD Negeri 9 Air Bulin kec. Kelapa</option>\n                                        <option value="SD Negeri 10 Dendang kec. Kelapa">SD Negeri 10 Dendang kec. Kelapa</option>\n                                        <option value="SD Negeri 11 Kacung kec. Kelapa">SD Negeri 11 Kacung kec. Kelapa</option>\n                                        <option value="SD Negeri 12 Pangkalberas kec. Kelapa">SD Negeri 12 Pangkalberas kec. Kelapa</option>\n                                        <option value="SD Negeri 13 Terentang kec. Kelapa">SD Negeri 13 Terentang kec. Kelapa</option>\n                                        <option value="SD Negeri 14 Tugang kec. Kelapa">SD Negeri 14 Tugang kec. Kelapa</option>\n                                        <option value="SD Negeri 15 Kelapa">SD Negeri 15 Kelapa</option>\n                                        <option value="SD Negeri 16 Jungkang Kelapa">SD Negeri 16 Jungkang Kelapa</option>\n                                        <option value="SD Negeri 17 Kacung Kelapa">SD Negeri 17 Kacung Kelapa</option>\n                                        <option value="SD Negeri 18 Sungkai Kelapa">SD Negeri 18 Sungkai Kelapa</option>\n                                        <option value="SD Negeri 19 Sinar Sari kec. Kelapa">SD Negeri 19 Sinar Sari kec. Kelapa</option>\n                                        <option value="SD Negeri 20 Ds. Juru kec. Kelapa">SD Negeri 20 Ds. Juru kec. Kelapa</option>\n                                        <option value="SD Negeri 21 Pusuk kec. Kelapa">SD Negeri 21 Pusuk kec. Kelapa</option>\n                                        <option value="SD Negeri 22 Ganjan kec. Kelapa">SD Negeri 22 Ganjan kec. Kelapa</option>\n                                        <option value="SD Negeri 23 Kelapa">SD Negeri 23 Kelapa</option>\n                                        <option value="SD Negeri 24 Bujang kec. Kelapa">SD Negeri 24 Bujang kec. Kelapa</option>\n                                        <option value="SD Negeri 25 kec. Kelapa">SD Negeri 25 kec. Kelapa</option>\n                                        <option value="SD Negeri 26 kec. Kelapa">SD Negeri 26 kec. Kelapa</option>\n                                        <option value="SD Negeri 27 kec. Kelapa">SD Negeri 27 kec. Kelapa</option>\n                                        <option value="TK Negeri Pembina Kelapa">TK Negeri Pembina Kelapa</option>\n                                        <option value="SMP Negeri 1 Tempilang">SMP Negeri 1 Tempilang</option>\n                                        <option value="SMP Negeri 2 Tempilang">SMP Negeri 2 Tempilang</option>\n                                        <option value="SMP Negeri 3 Tempilang">SMP Negeri 3 Tempilang</option>\n                                        <option value="SMP Negeri 4 Tempilang">SMP Negeri 4 Tempilang</option>\n                                        <option value="SD Negeri 1 Tempilang">SD Negeri 1 Tempilang</option>\n                                        <option value="SD Negeri 2 Tempilang">SD Negeri 2 Tempilang</option>\n                                        <option value="SD Negeri 3 Basun kec. Tempilang">SD Negeri 3 Basun kec. Tempilang</option>\n                                        <option value="SD Negeri 4 Tempilang">SD Negeri 4 Tempilang</option>\n                                        <option value="SD Negeri 5 Pelaik kec. Tempilang">SD Negeri 5 Pelaik kec. Tempilang</option>\n                                        <option value="SD Negeri 6 Tempilang">SD Negeri 6 Tempilang</option>\n                                        <option value="SD Negeri 7 Air Lintang kec. Tempilang">SD Negeri 7 Air Lintang kec. Tempilang</option>\n                                        <option value="SD Negeri 8 Tanjungniur kec. Tempilang">SD Negeri 8 Tanjungniur kec. Tempilang</option>\n                                        <option value="SD Negeri 9 Sika kec. Tempilang">SD Negeri 9 Sika kec. Tempilang</option>\n                                        <option value="SD Negeri 10 Benteng Kota kec. Tempilang">SD Negeri 10 Benteng Kota kec. Tempilang</option>\n                                        <option value="SD Negeri 11 Air Lintang kec. Tempilang">SD Negeri 11 Air Lintang kec. Tempilang</option>\n                                        <option value="SD Negeri 12 Sangku kec. Tempilang">SD Negeri 12 Sangku kec. Tempilang</option>\n                                        <option value="SD Negeri 13 Kelumbi kec. Tempilang">SD Negeri 13 Kelumbi kec. Tempilang</option>\n                                        <option value="SD Negeri 14 Buyan kec. Tempilang">SD Negeri 14 Buyan kec. Tempilang</option>\n                                        <option value="SD Negeri 15 Bubung Tujuh kec. Tempilang">SD Negeri 15 Bubung Tujuh kec. Tempilang</option>\n                                        <option value="SD Negeri 16 Penyampak kec. Tempilang">SD Negeri 16 Penyampak kec. Tempilang</option>\n                                        <option value="SD Negeri 17 Simpang Yul kec. Tempilang">SD Negeri 17 Simpang Yul kec. Tempilang</option>\n                                        <option value="SD Negeri 18 Nyikep kec. Tempilang">SD Negeri 18 Nyikep kec. Tempilang</option>\n                                        <option value="SD Negeri 19 Penegak kec. Tempilang">SD Negeri 19 Penegak kec. Tempilang</option>\n                                        <option value="SD Negeri 20 Petaling Jaya Ds. SP. Yul kec. Tempilang">SD Negeri 20 Petaling Jaya Ds. SP. Yul kec. Tempilang</option>\n                                        <option value="SD Negeri 21 Penyampak kec. Tempilang">SD Negeri 21 Penyampak kec. Tempilang</option>\n                                        <option value="SD Negeri 22 Tempilang">SD Negeri 22 Tempilang</option>\n                                        <option value="TK Negeri Pembina Tempilang">TK Negeri Pembina Tempilang</option>\n                                        <option value="SMP Negeri 1 Simpang Teritip">SMP Negeri 1 Simpang Teritip</option>\n                                        <option value="SMP Negeri 2 Simpang Teritip">SMP Negeri 2 Simpang Teritip</option>\n                                        <option value="SMP Negeri 3 Simpang Teritip">SMP Negeri 3 Simpang Teritip</option>\n                                        <option value="SMP Negeri 4 Simpang Teritip">SMP Negeri 4 Simpang Teritip</option>\n                                        <option value="SMP Negeri 5 Simpang Teritip">SMP Negeri 5 Simpang Teritip</option>\n                                        <option value="SMP Negeri 6 Simpang Teritip">SMP Negeri 6 Simpang Teritip</option>\n                                        <option value="SD Negeri 1 Simpang Teritip">SD Negeri 1 Simpang Teritip</option>\n                                        <option value="SD Negeri 2 Simpang Teritip">SD Negeri 2 Simpang Teritip</option>\n                                        <option value="SD Negeri 3 Simpang Teritip">SD Negeri 3 Simpang Teritip</option>\n                                        <option value="SD Negeri 4 Simpang Teritip">SD Negeri 4 Simpang Teritip</option>\n                                        <option value="SD Negeri 5 Simpang Teritip">SD Negeri 5 Simpang Teritip</option>\n                                        <option value="SD Negeri 6 Simpang Teritip">SD Negeri 6 Simpang Teritip</option>\n                                        <option value="SD Negeri 7 Simpang Teritip">SD Negeri 7 Simpang Teritip</option>\n                                        <option value="SD Negeri 8 Simpang Teritip">SD Negeri 8 Simpang Teritip</option>\n                                        <option value="SD Negeri 9 Rambat Simpang Teritip">SD Negeri 9 Rambat Simpang Teritip</option>\n                                        <option value="SD Negeri 10 Simpang Gong Simpang Teritip">SD Negeri 10 Simpang Gong Simpang Teritip</option>\n                                        <option value="SD Negeri 11 Desa Pangek Simpang Teritip">SD Negeri 11 Desa Pangek Simpang Teritip</option>\n                                        <option value="SD Negeri 12 Dsn. Belar - Ibul Simpang Teritip">SD Negeri 12 Dsn. Belar - Ibul Simpang Teritip</option>\n                                        <option value="SD Negeri 13 Simpang Tiga Simpang Teritip">SD Negeri 13 Simpang Tiga Simpang Teritip</option>\n                                        <option value="SD Negeri 14 Kundi Simpang Teritip">SD Negeri 14 Kundi Simpang Teritip</option>\n                                        <option value="SD Negeri 15 Pangek Simpang Teritip">SD Negeri 15 Pangek Simpang Teritip</option>\n                                        <option value="SD Negeri 16 Desa Rajek Simpang Teritip">SD Negeri 16 Desa Rajek Simpang Teritip</option>\n                                        <option value="SD Negeri 17 Desa Rajek Simpang Teritip">SD Negeri 17 Desa Rajek Simpang Teritip</option>\n                                        <option value="SD Negeri 18 Simpang Teritip">SD Negeri 18 Simpang Teritip</option>\n                                        <option value="SD Negeri 19 Simpang Teritip">SD Negeri 19 Simpang Teritip</option>\n                                        <option value="TK Negeri Pembina Simpang Teritip">TK Negeri Pembina Simpang Teritip</option>\n                                        <option value="Dinas Ketahanan Pangan dan Pertanian">Dinas Ketahanan Pangan dan Pertanian</option>\n                                        <option value="Dinas Kesehatan">Dinas Kesehatan</option>\n                                        <option value="Puskesmas Puput">Puskesmas Puput</option>\n                                        <option value="Puskesmas Jebus">Puskesmas Jebus</option>\n                                        <option value="Puskesmas Sekar Biru">Puskesmas Sekar Biru</option>\n                                        <option value="Puskesmas Tempilang">Puskesmas Tempilang</option>\n                                        <option value="Puskesmas Kelapa">Puskesmas Kelapa</option>\n                                        <option value="Puskesmas Mentok">Puskesmas Mentok</option>\n                                        <option value="Puskesmas Simpang Teritip">Puskesmas Simpang Teritip</option>\n                                        <option value="Puskesmas Kundi">Puskesmas Kundi</option>\n                                        <option value="Dinas Sosial, Pemberdayaan Masyarakat dan Desa">Dinas Sosial, Pemberdayaan Masyarakat dan Desa</option>\n                                        <option value="Dinas Penanaman Modal dan Pelayanan Satu Pintu">Dinas Penanaman Modal dan Pelayanan Satu Pintu</option>\n                                        <option value="Dinas Lingkungan Hidup">Dinas Lingkungan Hidup</option>\n                                        <option value="Satuan Polisi Pamong Praja dan Pemadam Kebakaran">Satuan Polisi Pamong Praja dan Pemadam Kebakaran</option>\n                                        <option value="Dinas Kependudukan dan Pencatatan Sipil">Dinas Kependudukan dan Pencatatan Sipil</option>\n                                        <option value="Dinas Pemberdayaan Perempuan dan Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana">Dinas Pemberdayaan Perempuan dan Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana</option>\n                                        <option value="Kecamatan Mentok">Kecamatan Mentok</option>\n                                        <option value="Kecamatan Jebus">Kecamatan Jebus</option>\n                                        <option value="Kecamatan Simpang Teritip">Kecamatan Simpang Teritip</option>\n                                        <option value="Kecamatan Kelapa">Kecamatan Kelapa</option>\n                                        <option value="Kecamatan Tempilang">Kecamatan Tempilang</option>\n                                        <option value="Kecamatan Parittiga">Kecamatan Parittiga</option>\n                                        <option value="Kelurahan Tanjung">Kelurahan Tanjung</option>\n                                        <option value="Kelurahan Sungai Daeng">Kelurahan Sungai Daeng</option>\n                                        <option value="Kelurahan Sungai Baru">Kelurahan Sungai Baru</option>\n                                        <option value="Kelurahan Menjelang">Kelurahan Menjelang</option>\n                                        <option value="Kelurahan Keranggan">Kelurahan Keranggan</option>\n                                        <option value="Kelurahan Kelapa">Kelurahan Kelapa</option>\n                                        <option value="UPT RSUD Sejiran Setason">UPT RSUD Sejiran Setason</option>
                                    </select>
                  </div>
                </div>
                <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                  <button type="button" onClick={() => router.push('/dashboard')} className="btn btn-outline-secondary me-2">Batal</button>
                  <button type="submit" disabled={isLoading} className="btn btn-primary px-4">
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
