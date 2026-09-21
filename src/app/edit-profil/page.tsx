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
          directUrl = `https://drive.google.com/uc?export=view&id=${data.fileId}`;
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
                        <img src={formData.foto_profil} alt="Foto Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                        <option value="Sekretariat Daerah">Sekretariat Daerah</option>\n                                        <option value="Asisten Pemerintahan dan Kesejahteraan Rakyat">Asisten Pemerintahan dan Kesejahteraan Rakyat</option>\n                                        <option value="Asisten Perekonomian dan Pembangunan">Asisten Perekonomian dan Pembangunan</option>\n                                        <option value="Asisten Administrasi Umum">Asisten Administrasi Umum</option>\n                                        <option value="Staf Ahli Bupati Bidang Hukum, Politik dan Pemerintahan">Staf Ahli Bupati Bidang Hukum, Politik dan Pemerintahan</option>\n                                        <option value="Staf Ahli Bupati Bidang Ekonomi dan Pembangunan">Staf Ahli Bupati Bidang Ekonomi dan Pembangunan</option>\n                                        <option value="Staf Ahli Bupati Bidang Kemasyarakatan dan Sumber Daya Manusia">Staf Ahli Bupati Bidang Kemasyarakatan dan Sumber Daya Manusia</option>\n                                        <option value="Bagian Kesejahteraan Rakyat">Bagian Kesejahteraan Rakyat</option>\n                                        <option value="Bagian Tata Pemerintahan">Bagian Tata Pemerintahan</option>\n                                        <option value="Bagian Perekonomian dan Pembangunan">Bagian Perekonomian dan Pembangunan</option>\n                                        <option value="Bagian Pengadaan Barang dan Jasa">Bagian Pengadaan Barang dan Jasa</option>\n                                        <option value="Bagian Hukum">Bagian Hukum</option>\n                                        <option value="Bagian Umum, Perlengkapan dan Protokol">Bagian Umum, Perlengkapan dan Protokol</option>\n                                        <option value="Bagian Organisasi">Bagian Organisasi</option>\n                                        <option value="Sekretariat DPRD">Sekretariat DPRD</option>\n                                        <option value="Inspektorat">Inspektorat</option>\n                                        <option value="Badan Pengelolaan Keuangan dan Aset Daerah">Badan Pengelolaan Keuangan dan Aset Daerah</option>\n                                        <option value="Badan Pengelolaan Pajak dan Retribusi Daerah">Badan Pengelolaan Pajak dan Retribusi Daerah</option>\n                                        <option value="Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Daerah">Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Daerah</option>\n                                        <option value="Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah">Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah</option>\n                                        <option value="Badan Penanggulangan Bencana Daerah">Badan Penanggulangan Bencana Daerah</option>\n                                        <option value="Badan Kesatuan Bangsa dan Politik">Badan Kesatuan Bangsa dan Politik</option>\n                                        <option value="Dinas Perhubungan, Perumahan dan Kawasan Permukiman">Dinas Perhubungan, Perumahan dan Kawasan Permukiman</option>\n                                        <option value="Dinas Komunikasi dan Informatika">Dinas Komunikasi dan Informatika</option>\n                                        <option value="Dinas Kebudayaan dan Pariwisata">Dinas Kebudayaan dan Pariwisata</option>\n                                        <option value="Dinas Perikanan">Dinas Perikanan</option>\n                                        <option value="Dinas Koperasi, Usaha Kecil Menengah dan Perdagangan">Dinas Koperasi, Usaha Kecil Menengah dan Perdagangan</option>\n                                        <option value="Dinas Perindustrian dan Tenaga Kerja">Dinas Perindustrian dan Tenaga Kerja</option>\n                                        <option value="Dinas Perpustakaan dan Kearsipan">Dinas Perpustakaan dan Kearsipan</option>\n                                        <option value="Dinas Pekerjaan Umum dan Penataan Ruang">Dinas Pekerjaan Umum dan Penataan Ruang</option>\n                                        <option value="Dinas Pendidikan,kepemudaan & Olah Raga">Dinas Pendidikan,kepemudaan & Olah Raga</option>\n                                        <option value="SMP Negeri 1 Mentok">SMP Negeri 1 Mentok</option>\n                                        <option value="SMP Negeri 2 Mentok">SMP Negeri 2 Mentok</option>\n                                        <option value="SMP Negeri 3 Mentok">SMP Negeri 3 Mentok</option>\n                                        <option value="SMP Negeri 4 Mentok">SMP Negeri 4 Mentok</option>\n                                        <option value="SMP Negeri 5 Mentok">SMP Negeri 5 Mentok</option>\n                                        <option value="SMP Negeri 6 Mentok">SMP Negeri 6 Mentok</option>\n                                        <option value="SDN 01 Mentok">SDN 01 Mentok</option>\n                                        <option value="SDN 02 Mentok">SDN 02 Mentok</option>\n                                        <option value="SDN 03 Mentok">SDN 03 Mentok</option>\n                                        <option value="SDN 04 Mentok">SDN 04 Mentok</option>\n                                        <option value="SDN 05 Mentok">SDN 05 Mentok</option>\n                                        <option value="SDN 06 Mentok">SDN 06 Mentok</option>\n                                        <option value="SDN 07 Mentok">SDN 07 Mentok</option>\n                                        <option value="SDN 08 Mentok">SDN 08 Mentok</option>\n                                        <option value="SDN 09 Mentok">SDN 09 Mentok</option>\n                                        <option value="SDN 10 Mentok">SDN 10 Mentok</option>\n                                        <option value="SDN 11 Mentok">SDN 11 Mentok</option>\n                                        <option value="SDN 12 Mentok">SDN 12 Mentok</option>\n                                        <option value="SDN 13 Mentok">SDN 13 Mentok</option>\n                                        <option value="SDN 14 Mentok">SDN 14 Mentok</option>\n                                        <option value="SDN 15 Mentok">SDN 15 Mentok</option>\n                                        <option value="SDN 16 Mentok">SDN 16 Mentok</option>\n                                        <option value="SDN 17 Mentok">SDN 17 Mentok</option>\n                                        <option value="SDN 18 Mentok">SDN 18 Mentok</option>\n                                        <option value="SDN 19 Mentok">SDN 19 Mentok</option>\n                                        <option value="SDN 20 Mentok">SDN 20 Mentok</option>\n                                        <option value="SDN 21 Mentok">SDN 21 Mentok</option>\n                                        <option value="SDN 22 Mentok">SDN 22 Mentok</option>\n                                        <option value="SDN 23 Mentok">SDN 23 Mentok</option>\n                                        <option value="SDN 24 Mentok">SDN 24 Mentok</option>\n                                        <option value="TK Negeri Pembina Mentok">TK Negeri Pembina Mentok</option>\n                                        <option value="TK Negeri Sejiran Setason Mentok">TK Negeri Sejiran Setason Mentok</option>\n                                        <option value="SMP Negeri 1 Jebus">SMP Negeri 1 Jebus</option>\n                                        <option value="SMP Negeri 2 Jebus">SMP Negeri 2 Jebus</option>\n                                        <option value="SMP Negeri 3 Jebus">SMP Negeri 3 Jebus</option>\n                                        <option value="SDN 01 Jebus">SDN 01 Jebus</option>\n                                        <option value="SDN 02 Jebus">SDN 02 Jebus</option>\n                                        <option value="SDN 03 Jebus">SDN 03 Jebus</option>\n                                        <option value="SDN 04 Jebus">SDN 04 Jebus</option>\n                                        <option value="SDN 05 Jebus">SDN 05 Jebus</option>\n                                        <option value="SDN 06 Jebus">SDN 06 Jebus</option>\n                                        <option value="SDN 07 Jebus">SDN 07 Jebus</option>\n                                        <option value="SDN 08 Jebus">SDN 08 Jebus</option>\n                                        <option value="SDN 09 Jebus">SDN 09 Jebus</option>\n                                        <option value="SDN 10 Jebus">SDN 10 Jebus</option>\n                                        <option value="SDN 11 Jebus">SDN 11 Jebus</option>\n                                        <option value="SDN 12 Jebus">SDN 12 Jebus</option>\n                                        <option value="SDN 13 Jebus">SDN 13 Jebus</option>\n                                        <option value="SDN 14 Jebus">SDN 14 Jebus</option>\n                                        <option value="SDN 15 Jebus">SDN 15 Jebus</option>\n                                        <option value="SDN 16 Jebus">SDN 16 Jebus</option>\n                                        <option value="SDN 17 Jebus">SDN 17 Jebus</option>\n                                        <option value="TK Negeri Pembina Jebus">TK Negeri Pembina Jebus</option>\n                                        <option value="SMP Negeri 1 Parittiga">SMP Negeri 1 Parittiga</option>\n                                        <option value="SMP Negeri 2 Parittiga">SMP Negeri 2 Parittiga</option>\n                                        <option value="SMP Negeri 3 Parittiga">SMP Negeri 3 Parittiga</option>\n                                        <option value="SMP Negeri 4 Parittiga">SMP Negeri 4 Parittiga</option>\n                                        <option value="SDN 01 Parittiga">SDN 01 Parittiga</option>\n                                        <option value="SDN 02 Parittiga">SDN 02 Parittiga</option>\n                                        <option value="SDN 03 Parittiga">SDN 03 Parittiga</option>\n                                        <option value="SDN 04 Parittiga">SDN 04 Parittiga</option>\n                                        <option value="SDN 05 Parittiga">SDN 05 Parittiga</option>\n                                        <option value="SDN 06 Parittiga">SDN 06 Parittiga</option>\n                                        <option value="SDN 07 Parittiga">SDN 07 Parittiga</option>\n                                        <option value="SDN 08 Parittiga">SDN 08 Parittiga</option>\n                                        <option value="SDN 09 Parittiga">SDN 09 Parittiga</option>\n                                        <option value="SDN 10 Parittiga">SDN 10 Parittiga</option>\n                                        <option value="SDN 11 Parittiga">SDN 11 Parittiga</option>\n                                        <option value="SDN 12 Parittiga">SDN 12 Parittiga</option>\n                                        <option value="SDN 13 Parittiga">SDN 13 Parittiga</option>\n                                        <option value="SDN 14 Parittiga">SDN 14 Parittiga</option>\n                                        <option value="SDN 15 Parittiga">SDN 15 Parittiga</option>\n                                        <option value="SDN 16 Parittiga">SDN 16 Parittiga</option>\n                                        <option value="SDN 17 Parittiga">SDN 17 Parittiga</option>\n                                        <option value="SDN 18 Parittiga">SDN 18 Parittiga</option>\n                                        <option value="SDN 19 Parittiga">SDN 19 Parittiga</option>\n                                        <option value="TK Negeri Pembina Parittiga">TK Negeri Pembina Parittiga</option>\n                                        <option value="SMP Negeri 1 Kelapa">SMP Negeri 1 Kelapa</option>\n                                        <option value="SMP Negeri 2 Kelapa">SMP Negeri 2 Kelapa</option>\n                                        <option value="SMP Negeri 3 Kelapa">SMP Negeri 3 Kelapa</option>\n                                        <option value="SMP Negeri 4 Kelapa">SMP Negeri 4 Kelapa</option>\n                                        <option value="SMP Negeri 5 Kelapa">SMP Negeri 5 Kelapa</option>\n                                        <option value="SDN 1 Kelapa">SDN 1 Kelapa</option>\n                                        <option value="SDN 2 Kelapa">SDN 2 Kelapa</option>\n                                        <option value="SDN 3 Tebing kec. Kelapa">SDN 3 Tebing kec. Kelapa</option>\n                                        <option value="SDN 4 Desa Pusuk kec. Kelapa">SDN 4 Desa Pusuk kec. Kelapa</option>\n                                        <option value="SDN 5 Tuik kec. Kelapa">SDN 5 Tuik kec. Kelapa</option>\n                                        <option value="SDN 6 Mancung kec. Kelapa">SDN 6 Mancung kec. Kelapa</option>\n                                        <option value="SDN 7 Kayu Arang kec. Kelapa">SDN 7 Kayu Arang kec. Kelapa</option>\n                                        <option value="SDN 8 SP. Bulin kec. Kelapa">SDN 8 SP. Bulin kec. Kelapa</option>\n                                        <option value="SDN 9 Air Bulin kec. Kelapa">SDN 9 Air Bulin kec. Kelapa</option>\n                                        <option value="SDN 10 Dendang kec. Kelapa">SDN 10 Dendang kec. Kelapa</option>\n                                        <option value="SDN 11 Kacung kec. Kelapa">SDN 11 Kacung kec. Kelapa</option>\n                                        <option value="SDN 12 Pangkalberas kec. Kelapa">SDN 12 Pangkalberas kec. Kelapa</option>\n                                        <option value="SDN 13 Terentang kec. Kelapa">SDN 13 Terentang kec. Kelapa</option>\n                                        <option value="SDN 14 Tugang kec. Kelapa">SDN 14 Tugang kec. Kelapa</option>\n                                        <option value="SDN 15 Kelapa">SDN 15 Kelapa</option>\n                                        <option value="SDN 16 Jungkang Kelapa">SDN 16 Jungkang Kelapa</option>\n                                        <option value="SDN 17 Kacung Kelapa">SDN 17 Kacung Kelapa</option>\n                                        <option value="SDN 18 Sungkai Kelapa">SDN 18 Sungkai Kelapa</option>\n                                        <option value="SDN 19 Sinar Sari kec. Kelapa">SDN 19 Sinar Sari kec. Kelapa</option>\n                                        <option value="SDN 20 Ds. Juru kec. Kelapa">SDN 20 Ds. Juru kec. Kelapa</option>\n                                        <option value="SDN 21 Pusuk kec. Kelapa">SDN 21 Pusuk kec. Kelapa</option>\n                                        <option value="SDN 22 Ganjan kec. Kelapa">SDN 22 Ganjan kec. Kelapa</option>\n                                        <option value="SDN 23 Kelapa">SDN 23 Kelapa</option>\n                                        <option value="SDN 24 Bujang kec. Kelapa">SDN 24 Bujang kec. Kelapa</option>\n                                        <option value="SDN 25 kec. Kelapa">SDN 25 kec. Kelapa</option>\n                                        <option value="SDN 26 kec. Kelapa">SDN 26 kec. Kelapa</option>\n                                        <option value="SDN 27 kec. Kelapa">SDN 27 kec. Kelapa</option>\n                                        <option value="TK Negeri Pembina Kelapa">TK Negeri Pembina Kelapa</option>\n                                        <option value="SMP Negeri 1 Tempilang">SMP Negeri 1 Tempilang</option>\n                                        <option value="SMP Negeri 2 Tempilang">SMP Negeri 2 Tempilang</option>\n                                        <option value="SMP Negeri 3 Tempilang">SMP Negeri 3 Tempilang</option>\n                                        <option value="SMP Negeri 4 Tempilang">SMP Negeri 4 Tempilang</option>\n                                        <option value="SDN 1 Tempilang">SDN 1 Tempilang</option>\n                                        <option value="SDN 2 Tempilang">SDN 2 Tempilang</option>\n                                        <option value="SDN 3 Basun kec. Tempilang">SDN 3 Basun kec. Tempilang</option>\n                                        <option value="SDN 4 Tempilang">SDN 4 Tempilang</option>\n                                        <option value="SDN 5 Pelaik kec. Tempilang">SDN 5 Pelaik kec. Tempilang</option>\n                                        <option value="SDN 6 Tempilang">SDN 6 Tempilang</option>\n                                        <option value="SDN 7 Air Lintang kec. Tempilang">SDN 7 Air Lintang kec. Tempilang</option>\n                                        <option value="SDN 8 Tanjungniur kec. Tempilang">SDN 8 Tanjungniur kec. Tempilang</option>\n                                        <option value="SDN 9 Sika kec. Tempilang">SDN 9 Sika kec. Tempilang</option>\n                                        <option value="SDN 10 Benteng Kota kec. Tempilang">SDN 10 Benteng Kota kec. Tempilang</option>\n                                        <option value="SDN 11 Air Lintang kec. Tempilang">SDN 11 Air Lintang kec. Tempilang</option>\n                                        <option value="SDN 12 Sangku kec. Tempilang">SDN 12 Sangku kec. Tempilang</option>\n                                        <option value="SDN 13 Kelumbi kec. Tempilang">SDN 13 Kelumbi kec. Tempilang</option>\n                                        <option value="SDN 14 Buyan kec. Tempilang">SDN 14 Buyan kec. Tempilang</option>\n                                        <option value="SDN 15 Bubung Tujuh kec. Tempilang">SDN 15 Bubung Tujuh kec. Tempilang</option>\n                                        <option value="SDN 16 Penyampak kec. Tempilang">SDN 16 Penyampak kec. Tempilang</option>\n                                        <option value="SDN 17 Simpang Yul kec. Tempilang">SDN 17 Simpang Yul kec. Tempilang</option>\n                                        <option value="SDN 18 Nyikep kec. Tempilang">SDN 18 Nyikep kec. Tempilang</option>\n                                        <option value="SDN 19 Penegak kec. Tempilang">SDN 19 Penegak kec. Tempilang</option>\n                                        <option value="SDN 20 Petaling Jaya Ds. SP. Yul kec. Tempilang">SDN 20 Petaling Jaya Ds. SP. Yul kec. Tempilang</option>\n                                        <option value="SDN 21 Penyampak kec. Tempilang">SDN 21 Penyampak kec. Tempilang</option>\n                                        <option value="SDN 22 Tempilang">SDN 22 Tempilang</option>\n                                        <option value="TK Negeri Pembina Tempilang">TK Negeri Pembina Tempilang</option>\n                                        <option value="SMP Negeri 1 Simpang Teritip">SMP Negeri 1 Simpang Teritip</option>\n                                        <option value="SMP Negeri 2 Simpang Teritip">SMP Negeri 2 Simpang Teritip</option>\n                                        <option value="SMP Negeri 3 Simpang Teritip">SMP Negeri 3 Simpang Teritip</option>\n                                        <option value="SMP Negeri 4 Simpang Teritip">SMP Negeri 4 Simpang Teritip</option>\n                                        <option value="SMP Negeri 5 Simpang Teritip">SMP Negeri 5 Simpang Teritip</option>\n                                        <option value="SMP Negeri 6 Simpang Teritip">SMP Negeri 6 Simpang Teritip</option>\n                                        <option value="SDN 1 Simpang Teritip">SDN 1 Simpang Teritip</option>\n                                        <option value="SDN 2 Simpang Teritip">SDN 2 Simpang Teritip</option>\n                                        <option value="SDN 3 Simpang Teritip">SDN 3 Simpang Teritip</option>\n                                        <option value="SDN 4 Simpang Teritip">SDN 4 Simpang Teritip</option>\n                                        <option value="SDN 5 Simpang Teritip">SDN 5 Simpang Teritip</option>\n                                        <option value="SDN 6 Simpang Teritip">SDN 6 Simpang Teritip</option>\n                                        <option value="SDN 7 Simpang Teritip">SDN 7 Simpang Teritip</option>\n                                        <option value="SDN 8 Simpang Teritip">SDN 8 Simpang Teritip</option>\n                                        <option value="SDN 9 Rambat Simpang Teritip">SDN 9 Rambat Simpang Teritip</option>\n                                        <option value="SDN 10 Simpang Gong Simpang Teritip">SDN 10 Simpang Gong Simpang Teritip</option>\n                                        <option value="SDN 11 Desa Pangek Simpang Teritip">SDN 11 Desa Pangek Simpang Teritip</option>\n                                        <option value="SDN 12 Dsn. Belar - Ibul Simpang Teritip">SDN 12 Dsn. Belar - Ibul Simpang Teritip</option>\n                                        <option value="SDN 13 Simpang Tiga Simpang Teritip">SDN 13 Simpang Tiga Simpang Teritip</option>\n                                        <option value="SDN 14 Kundi Simpang Teritip">SDN 14 Kundi Simpang Teritip</option>\n                                        <option value="SDN 15 Pangek Simpang Teritip">SDN 15 Pangek Simpang Teritip</option>\n                                        <option value="SDN 16 Desa Rajek Simpang Teritip">SDN 16 Desa Rajek Simpang Teritip</option>\n                                        <option value="SDN 17 Desa Rajek Simpang Teritip">SDN 17 Desa Rajek Simpang Teritip</option>\n                                        <option value="SDN 18 Simpang Teritip">SDN 18 Simpang Teritip</option>\n                                        <option value="SDN 19 Simpang Teritip">SDN 19 Simpang Teritip</option>\n                                        <option value="TK Negeri Pembina Simpang Teritip">TK Negeri Pembina Simpang Teritip</option>\n                                        <option value="Dinas Ketahanan Pangan dan Pertanian">Dinas Ketahanan Pangan dan Pertanian</option>\n                                        <option value="Dinas Kesehatan">Dinas Kesehatan</option>\n                                        <option value="Puskesmas Puput">Puskesmas Puput</option>\n                                        <option value="Puskesmas Jebus">Puskesmas Jebus</option>\n                                        <option value="Puskesmas Sekar Biru">Puskesmas Sekar Biru</option>\n                                        <option value="Puskesmas Tempilang">Puskesmas Tempilang</option>\n                                        <option value="Puskesmas Kelapa">Puskesmas Kelapa</option>\n                                        <option value="Puskesmas Mentok">Puskesmas Mentok</option>\n                                        <option value="Puskesmas Simpang Teritip">Puskesmas Simpang Teritip</option>\n                                        <option value="Puskesmas Kundi">Puskesmas Kundi</option>\n                                        <option value="Dinas Sosial, Pemberdayaan Masyarakat dan Desa">Dinas Sosial, Pemberdayaan Masyarakat dan Desa</option>\n                                        <option value="Dinas Penanaman Modal dan Pelayanan Satu Pintu">Dinas Penanaman Modal dan Pelayanan Satu Pintu</option>\n                                        <option value="Dinas Lingkungan Hidup">Dinas Lingkungan Hidup</option>\n                                        <option value="Satuan Polisi Pamong Praja dan Pemadam Kebakaran">Satuan Polisi Pamong Praja dan Pemadam Kebakaran</option>\n                                        <option value="Dinas Kependudukan dan Pencatatan Sipil">Dinas Kependudukan dan Pencatatan Sipil</option>\n                                        <option value="Dinas Pemberdayaan Perempuan dan Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana">Dinas Pemberdayaan Perempuan dan Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana</option>\n                                        <option value="Kecamatan Mentok">Kecamatan Mentok</option>\n                                        <option value="Kecamatan Jebus">Kecamatan Jebus</option>\n                                        <option value="Kecamatan Simpang Teritip">Kecamatan Simpang Teritip</option>\n                                        <option value="Kecamatan Kelapa">Kecamatan Kelapa</option>\n                                        <option value="Kecamatan Tempilang">Kecamatan Tempilang</option>\n                                        <option value="Kecamatan Parittiga">Kecamatan Parittiga</option>\n                                        <option value="Kelurahan Tanjung">Kelurahan Tanjung</option>\n                                        <option value="Kelurahan Sungai Daeng">Kelurahan Sungai Daeng</option>\n                                        <option value="Kelurahan Sungai Baru">Kelurahan Sungai Baru</option>\n                                        <option value="Kelurahan Menjelang">Kelurahan Menjelang</option>\n                                        <option value="Kelurahan Keranggan">Kelurahan Keranggan</option>\n                                        <option value="Kelurahan Kelapa">Kelurahan Kelapa</option>\n                                        <option value="UPT RSUD Sejiran Setason">UPT RSUD Sejiran Setason</option>
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
