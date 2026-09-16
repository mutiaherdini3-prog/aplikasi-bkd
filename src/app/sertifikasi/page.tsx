'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function SertifikasiPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pegawai, setPegawai] = useState<any>(null);
  
  // State dengan kolom-kolom baru
  const [kegiatans, setKegiatans] = useState<any[]>([{ 
    id: 1, 
    jenis_sertifikasi: '',
    jenis_kursus: '',
    nama_kursus: '',
    klasifikasi_kursus: '',
    institusi_penyelenggara: '',
    nomor_sertifikasi: '',
    tanggal_mulai: '',
    tanggal_akhir: '',
    tahun: '',
    jumlah_jp: '', // durasi
    pejabat: '', // penanda_tangan
    biaya_tipe: 'Berbayar', 
    biaya_nominal: '',
    file: null, 
    preview: null 
  }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agree, setAgree] = useState(false);
  const [previewModal, setPreviewModal] = useState<string | null>(null);

  useEffect(() => {
    const nip = localStorage.getItem('loggedInUser');
    if (!nip || nip === 'admin') {
      router.push('/login');
      return;
    }
    const fetchData = async () => {
      const { data } = await supabase.from('pegawai').select('*').eq('nip', nip).single();
      if (data) setPegawai(data);
    };
    fetchData();
  }, [router]);

  const tambahKegiatan = () => {
    setKegiatans(prev => [...prev, { 
      id: Date.now(), 
      jenis_sertifikasi: '', jenis_kursus: '', nama_kursus: '', klasifikasi_kursus: '', institusi_penyelenggara: '',
      nomor_sertifikasi: '', tanggal_mulai: '', tanggal_akhir: '', tahun: '', jumlah_jp: '', pejabat: '', biaya_tipe: 'Berbayar', biaya_nominal: '',
      file: null, preview: null 
    }]);
  };

  const hapusKegiatan = (idToRemove: number) => {
    if (kegiatans.length === 1) return;
    setKegiatans(prev => prev.filter(k => k.id !== idToRemove));
  };

  const handleChange = (id: number, field: string, value: any) => {
    setKegiatans(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  const validateStep1 = () => {
    for (const k of kegiatans) {
      if (!k.jenis_sertifikasi || !k.jenis_kursus || !k.nama_kursus || !k.klasifikasi_kursus || !k.institusi_penyelenggara || !k.nomor_sertifikasi || !k.tanggal_mulai || !k.tanggal_akhir || !k.tahun || !k.jumlah_jp || !k.pejabat || (k.biaya_tipe !== 'Gratis' && !k.biaya_nominal)) {
        alert('Tolong isi semua kolom wajib (*) di Langkah 1!');
        return false;
      }
    }
    return true;
  };

  const validateStep2 = () => {
    for (const k of kegiatans) {
      if (!k.file) {
        alert('Tolong unggah semua dokumen yang diwajibkan (*) di Langkah 2!');
        return false;
      }
    }
    return true;
  };

  const handleNext = (targetStep: number) => {
    if (targetStep === 2 && !validateStep1()) return;
    if (targetStep === 3 && !validateStep2()) return;
    setStep(targetStep);
  };

  const getTotalJP = () => {
    return kegiatans.reduce((sum, k) => sum + (parseInt(k.jumlah_jp) || 0), 0);
  };

  const handleFileChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert(`File ${file.name} terlalu besar! Maksimal 2MB.`);
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        handleChange(id, 'file', file);
        handleChange(id, 'preview', ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      alert("Anda harus menyetujui pernyataan terlebih dahulu!");
      return;
    }
    if (!pegawai) return;
    setIsSubmitting(true);
    
    try {
      for (const k of kegiatans) {
        let finalUrl = k.preview;
        
        if (k.file) {
          // UPLOAD KE SUPABASE STORAGE
          const fileExt = k.file.name.split('.').pop();
          const fileName = `${pegawai.nip}-${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('dokumen')
            .upload(fileName, k.file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            alert("Gagal mengupload dokumen: " + uploadError.message);
            setIsSubmitting(false);
            return;
          }
          
          if (uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from('dokumen')
              .getPublicUrl(fileName);
            finalUrl = publicUrlData.publicUrl;
          }
        }

        // SIMPAN DATA KE SUPABASE
        const { error: insertError } = await supabase.from('sertifikasi').insert([{
          nip: pegawai.nip,
          jenis_sertifikasi: k.jenis_sertifikasi,
          jenis_kursus: k.jenis_kursus,
          nama_kursus: k.nama_kursus,
          klasifikasi_kursus: k.klasifikasi_kursus,
          institusi_penyelenggara: k.institusi_penyelenggara,
          nomor_sertifikasi: k.nomor_sertifikasi,
          tanggal_sertifikasi: `${k.tanggal_mulai} s.d ${k.tanggal_akhir}`,
          jumlah_jp: parseInt(k.jumlah_jp),
          pejabat: k.pejabat,
          biaya: k.biaya_tipe,
          link_sertifikat: finalUrl
        }]);

        if (insertError) {
          console.error("Supabase insert error:", insertError);
          alert("Data gagal disimpan ke database: " + insertError.message);
          setIsSubmitting(false);
          return;
        }
      }
      
      // Update total_jp di tabel pegawai
      const { data: allSertif } = await supabase.from('sertifikasi').select('jumlah_jp').eq('nip', pegawai.nip);
      if (allSertif) {
        const totalJP = allSertif.reduce((sum, s) => sum + (s.jumlah_jp || 0), 0);
        await supabase.from('pegawai').update({ total_jp: totalJP }).eq('nip', pegawai.nip);
      }

      router.push('/dashboard');
    } catch (err) {
      alert('Gagal menyimpan');
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      <style dangerouslySetInnerHTML={{__html: `
        body { background-color: #f0f4f8; font-family: 'Inter', sans-serif; color: #334155; font-size: 0.9rem; }
        .navbar-top { background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.04); padding: 0.5rem 2rem; position: sticky; top: 0; z-index: 1000; }
        .brand-text { font-weight: 800; font-size: 1.5rem; letter-spacing: -0.5px; }
        .brand-my { color: #0284c7; }
        .card-custom { border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); background-color: #ffffff; }
        .profile-img-container { position: relative; display: inline-block; margin-bottom: 1rem; }
        .profile-img-container .img-placeholder { width: 100px; height: 100px; border-radius: 50%; border: 4px solid #e0f2fe; background-color: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #cbd5e1; margin: 0 auto; }
        .btn-profile-action { font-size: 0.8rem; border-radius: 8px; font-weight: 500; color: #475569; border-color: #e2e8f0; padding: 0.4rem 0.8rem; }
        .btn-profile-action:hover { background-color: #f8fafc; }
        .menu-list { list-style: none; padding: 0; margin: 0; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .menu-list li a { display: flex; align-items: center; padding: 12px 20px; color: #475569; text-decoration: none; font-weight: 500; border-bottom: 1px solid #f1f5f9; transition: all 0.2s; cursor: pointer; }
        .menu-list li a:hover { background-color: #f8fafc; }
        .menu-list li a.active { background-color: #0ea5e9; color: white; }
        .menu-list li a i { margin-right: 12px; font-size: 1.1rem; }
        .breadcrumb-text { font-size: 0.85rem; color: #64748b; margin-bottom: 15px; }
        .breadcrumb-text strong { color: #1e293b; font-weight: 600; }
        
        .wizard-container { background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 25px; }
        .wizard-step { display: flex; justify-content: center; align-items: flex-start; position: relative; max-width: 500px; margin: 0 auto; }
        .wizard-step::before { content: ''; position: absolute; top: 20px; left: 15%; right: 15%; height: 2px; background-color: #cbd5e1; z-index: 0; }
        .step-item { text-align: center; z-index: 1; flex: 1; }
        .step-circle { width: 40px; height: 40px; border-radius: 50%; background-color: #ffffff; color: #94a3b8; border: 2px solid #cbd5e1; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; margin-bottom: 8px; font-size: 1.1rem; transition: all 0.3s; }
        .step-circle.active { background-color: #0ea5e9; color: white; border-color: #0ea5e9; }
        .step-circle.completed { background-color: #10b981; color: white; border-color: #10b981; }
        .step-text { font-size: 0.8rem; color: #0ea5e9; font-weight: 500; }
        .step-item:not(.active-item) .step-text { color: #64748b; }
        
        .form-label { font-size: 0.8rem; color: #475569; font-weight: 500; margin-bottom: 4px; }
        .form-control, .form-select { border: 1px solid #bae6fd; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.9rem; color: #1e293b; background-color: #ffffff; }
        .btn-action { border-radius: 8px; font-size: 0.9rem; font-weight: 500; padding: 0.5rem 1.5rem; }
        
        .form-kegiatan-block, .upload-block { border: 1px dashed #bae6fd; padding: 20px; border-radius: 12px; margin-bottom: 20px; background-color: #ffffff; position: relative; }
        
        .info-timeline { position: relative; padding-left: 20px; }
        .info-timeline::before { content: ''; position: absolute; left: 7px; top: 5px; bottom: 20px; width: 2px; background-color: #e2e8f0; }
        .info-item { position: relative; margin-bottom: 20px; }
        .info-dot { position: absolute; left: -20px; top: 2px; width: 16px; height: 16px; border-radius: 50%; background-color: #0ea5e9; color: white; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        .info-title { font-weight: 600; font-size: 0.85rem; color: #0ea5e9; margin-bottom: 2px; }
        .info-desc { font-size: 0.75rem; color: #64748b; line-height: 1.4; }
      `}} />

      <nav className="navbar-top d-flex justify-content-between align-items-center">
        <div><span className="brand-text brand-my">DIKLAT</span><span className="brand-text text-secondary ms-2 fw-normal" style={{fontSize:'1.1rem'}}>Portal Layanan Kepegawaian</span></div>
        <div className="d-flex align-items-center gap-4">
          <i className="bi bi-search text-muted fs-5"></i>
          <div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-secondary border" style={{width:'40px', height:'40px'}}><i className="bi bi-person-fill"></i></div>
        </div>
      </nav>

      <div className="container-fluid mt-4 px-lg-4 mb-5">
        <div className="row g-4">
          
          <div className="col-lg-3">
            <div className="card card-custom p-4 text-center mb-4">
              <div className="text-end mb-2"><i className="bi bi-person-badge text-info fs-5 cursor-pointer"></i></div>
              <div className="profile-img-container">
                <div className="img-placeholder position-relative overflow-hidden" style={{width:'100px', height:'100px'}}>
                  {pegawai?.foto ? <img src={pegawai.foto} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <i className="bi bi-person"></i>}
                </div>
              </div>
              <h6 className={`fw-bold mb-1 ${pegawai?.nama ? 'text-dark' : 'text-muted fst-italic'}`}>{pegawai?.nama || '[Nama Belum Diisi]'}</h6>
              <p className="mb-3 fw-semibold fst-italic" style={{color:'#94a3b8', fontSize:'0.85rem'}}>NIP. {pegawai?.nip || '[Belum Diisi]'}</p>
              <p className="text-muted mb-4 fst-italic" style={{fontSize:'0.75rem', lineHeight: 1.4}}>{pegawai?.unit_kerja || '[Unit Kerja Belum Diisi]'}</p>
              <div className="d-flex justify-content-center gap-2">
                <a onClick={() => router.push('/dashboard')} className="btn btn-outline-secondary btn-profile-action"><i className="bi bi-person me-1"></i> Lihat Profil</a>
                <a onClick={() => router.push('/edit-profil')} className="btn btn-outline-secondary btn-profile-action"><i className="bi bi-pencil me-1"></i> Edit Profil</a>
              </div>
            </div>
            <ul className="menu-list">
              <li><a onClick={() => router.push('/dashboard')}><i className="bi bi-grid-1x2-fill"></i> Dashboard</a></li>
              <li><a className="active"><i className="bi bi-person-lines-fill"></i> Layanan ASN</a></li>
              <li><a href="#"><i className="bi bi-arrow-repeat"></i> Layanan Lainnya</a></li>
            </ul>
          </div>

          <div className="col-lg-6">
            <div className="breadcrumb-text"><strong>Riwayat Sertifikasi</strong> &nbsp;|&nbsp; Home &gt; Layanan ASN &gt; Update Data &gt; Riwayat Sertifikasi &gt; Tambah</div>
            <div className="card card-custom p-4">
              <div className="wizard-container">
                <div className="wizard-step">
                  <div className={`step-item ${step === 1 ? 'active-item' : ''}`}>
                    <div className={`step-circle ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>{step > 1 ? <i className="bi bi-check-lg"></i> : 1}</div>
                    <div className="step-text">Masukan Data</div>
                  </div>
                  <div className={`step-item ${step === 2 ? 'active-item' : ''}`}>
                    <div className={`step-circle ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>{step > 2 ? <i className="bi bi-check-lg"></i> : 2}</div>
                    <div className="step-text">Upload Dokumen</div>
                  </div>
                  <div className={`step-item ${step === 3 ? 'active-item' : ''}`}>
                    <div className={`step-circle ${step === 3 ? 'active' : ''}`}>3</div>
                    <div className="step-text">Ringkasan</div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <div>
                    <div className="card mb-4 border-0 bg-primary bg-opacity-10">
                      <div className="card-body py-2 px-3">
                        <div className="row">
                          <div className="col-md-6">
                            <label className="form-label small text-muted mb-0">NIP Pegawai</label>
                            <input type="text" className="form-control form-control-sm bg-transparent border-0 fw-bold px-0" readOnly value={pegawai?.nip || ''} />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small text-muted mb-0">Nama Pegawai</label>
                            <input type="text" className="form-control form-control-sm bg-transparent border-0 fw-bold px-0" readOnly value={pegawai?.nama || ''} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {kegiatans.map((k, index) => (
                      <div className="form-kegiatan-block bg-light" key={k.id}>
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                          <h6 className="text-primary fw-bold mb-0">Aktifitas {index + 1}</h6>
                          {kegiatans.length > 1 && (
                            <button type="button" className="btn btn-sm btn-outline-danger py-0 px-2" onClick={() => hapusKegiatan(k.id)}><i className="bi bi-trash"></i> Hapus</button>
                          )}
                        </div>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">Jenis Sertifikasi *</label>
                            <select className="form-select" required value={k.jenis_sertifikasi || ''} onChange={e => handleChange(k.id, 'jenis_sertifikasi', e.target.value)}>
                              <option value="">- Pilih Jenis Sertifikasi -</option>
                              <option value="Sertifikasi">Sertifikasi</option>
                              <option value="Kursus">Kursus</option>
                              <option value="Paten/Haki">Paten/Haki</option>
                              <option value="Penulisan Ilmiah">Penulisan Ilmiah</option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Jenis Kursus *</label>
                            <select className="form-select" required value={k.jenis_kursus || ''} onChange={e => handleChange(k.id, 'jenis_kursus', e.target.value)}>
                              <option value="">- Pilih Jenis Kursus -</option>
                              <option value="Magang">Magang</option>
                              <option value="Kursus">Kursus</option>
                              <option value="Penataran">Penataran</option>
                              <option value="Pengembangan kompetensi dalam bentuk pelatihan klasikal lainnya">Pengembangan kompetensi dalam bentuk pelatihan klasikal lainnya</option>
                              <option value="Coaching">Coaching</option>
                              <option value="Mentoring">Mentoring</option>
                              <option value="E-learning">E-learning</option>
                              <option value="Bimbingan jarak jauh">Bimbingan jarak jauh</option>
                              <option value="Detasering">Detasering</option>
                              <option value="Pembelajaran alam terbuka (outbond)">Pembelajaran alam terbuka (outbond)</option>
                              <option value="Diklat fungsional">Diklat fungsional</option>
                              <option value="Patok banding (benchmark)">Patok banding (benchmark)</option>
                              <option value="Pertukaran antaran PNS dengan karyawan BUMN/BUMD">Pertukaran antaran PNS dengan karyawan BUMN/BUMD</option>
                              <option value="Belajar mandiri">Belajar mandiri</option>
                              <option value="Komunitas belajar">Komunitas belajar</option>
                              <option value="Bimbingan di tempat kerja">Bimbingan di tempat kerja</option>
                              <option value="Pengembangan kompetensi dalam bentuk pelatihan non-klasikal lainnya">Pengembangan kompetensi dalam bentuk pelatihan non-klasikal lainnya</option>
                              <option value="Pelatihan dasar">Pelatihan dasar</option>
                              <option value="Workshop">Workshop</option>
                              <option value="Diklat teknis">Diklat teknis</option>
                              <option value="Seminar">Seminar</option>
                              <option value="Bimbingan teknis">Bimbingan teknis</option>
                              <option value="Sosialisasi">Sosialisasi</option>
                              <option value="Pelatihan manajerial">Pelatihan manajerial</option>
                              <option value="Pelatihan sosial kultural">Pelatihan sosial kultural</option>
                            </select>
                          </div>
                          <div className="col-md-12">
                            <label className="form-label">Nama Kursus *</label>
                            <input type="text" className="form-control" placeholder="Masukkan nama kursus" required value={k.nama_kursus || ''} onChange={e => handleChange(k.id, 'nama_kursus', e.target.value)} />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Klasifikasi Kursus *</label>
                            <select className="form-select" required value={k.klasifikasi_kursus || ''} onChange={e => handleChange(k.id, 'klasifikasi_kursus', e.target.value)}>
                              <option value="">- Pilih Klasifikasi -</option>
                              <option value="Aparatur negara/Kepegawaian">Aparatur negara/Kepegawaian</option>
                              <option value="Dalam Negeri">Dalam Negeri</option>
                              <option value="Energi dan Sumber Daya Mineral">Energi dan Sumber Daya Mineral</option>
                              <option value="Hak Asasi Manusia">Hak Asasi Manusia</option>
                              <option value="Hukum">Hukum</option>
                              <option value="Imigrasi dan Pemasyarakatan">Imigrasi dan Pemasyarakatan</option>
                              <option value="Informasi Geospasial">Informasi Geospasial</option>
                              <option value="Intelijen">Intelijen</option>
                              <option value="Karantina">Karantina</option>
                              <option value="Keagamaan">Keagamaan</option>
                              <option value="Keamanan">Keamanan</option>
                              <option value="Keamanan siber dan persandian">Keamanan siber dan persandian</option>
                              <option value="Kearsipan">Kearsipan</option>
                              <option value="Kebudayaan">Kebudayaan</option>
                              <option value="Kehutanan">Kehutanan</option>
                              <option value="Kelauatan dan Perikanan">Kelauatan dan Perikanan</option>
                              <option value="Kepemudaan dan Olahraga">Kepemudaan dan Olahraga</option>
                              <option value="Kesehatan">Kesehatan</option>
                              <option value="Kesekretariatan Lembaga Legislatif">Kesekretariatan Lembaga Legislatif</option>
                              <option value="Kesekretariatan Negara">Kesekretariatan Negara</option>
                              <option value="Ketahanan Nasional">Ketahanan Nasional</option>
                              <option value="Keuangan">Keuangan</option>
                              <option value="Komunikasi dan Informatika">Komunikasi dan Informatika</option>
                              <option value="Koperasi">Koperasi</option>
                              <option value="Lingkungan Hidup">Lingkungan Hidup</option>
                              <option value="Luar Negeri">Luar Negeri</option>
                              <option value="Meteorologi Klimatologi dan Geofisika">Meteorologi Klimatologi dan Geofisika</option>
                              <option value="Pangan">Pangan</option>
                              <option value="Pariwisata">Pariwisata</option>
                              <option value="Patroli Keamanan Laut">Patroli Keamanan Laut</option>
                              <option value="Pekerjaan Umum dan Penataan Ruang">Pekerjaan Umum dan Penataan Ruang</option>
                              <option value="Pembangunan Desa dan Daerah Tertinggal">Pembangunan Desa dan Daerah Tertinggal</option>
                              <option value="Pemberdayaan Perempuan dan Perlindungan Anak">Pemberdayaan Perempuan dan Perlindungan Anak</option>
                              <option value="Pembinaan Badan Usaha Milik Negara/Daerah">Pembinaan Badan Usaha Milik Negara/Daerah</option>
                              <option value="Pemeriksa Pengelolaan dan Tanggung Jawab Keuangan Negara">Pemeriksa Pengelolaan dan Tanggung Jawab Keuangan Negara</option>
                              <option value="Pemilihan Umum">Pemilihan Umum</option>
                              <option value="Penanaman Modal">Penanaman Modal</option>
                              <option value="Penanganan Bencana">Penanganan Bencana</option>
                              <option value="Penanganan Tindak Pidana Korupsi">Penanganan Tindak Pidana Korupsi</option>
                              <option value="Penanggulangan Terorisme">Penanggulangan Terorisme</option>
                              <option value="Pencegahan dan Pemberantasan Penyalahgunaan dan Peredaran Gelap Narkotika">Pencegahan dan Pemberantasan Penyalahgunaan dan Peredaran Gelap Narkotika</option>
                              <option value="Pencegahan dan Pemberantasan Tindak Pidana Pencucian Uang">Pencegahan dan Pemberantasan Tindak Pidana Pencucian Uang</option>
                              <option value="Pendidikan">Pendidikan</option>
                              <option value="Penelitian dan Inovasi">Penelitian dan Inovasi</option>
                              <option value="Pengadaan Barang/Jasa Pemerintah">Pengadaan Barang/Jasa Pemerintah</option>
                              <option value="Pengawasan Keuangan Negara">Pengawasan Keuangan Negara</option>
                              <option value="Pengawasan Obat dan Makanan">Pengawasan Obat dan Makanan</option>
                              <option value="Pengawasan Pemanfaatan Tenaga Nuklir">Pengawasan Pemanfaatan Tenaga Nuklir</option>
                              <option value="Pengawasan Penyelenggaraan Pelayanan Publik">Pengawasan Penyelenggaraan Pelayanan Publik</option>
                              <option value="Pengawasan Perilaku Hakim">Pengawasan Perilaku Hakim</option>
                              <option value="Pengendalian Penduduk dan Keluarga Berencana">Pengendalian Penduduk dan Keluarga Berencana</option>
                              <option value="Penuntutan">Penuntutan</option>
                              <option value="Penyiaran Publik">Penyiaran Publik</option>
                              <option value="Peradilan Konstitusi">Peradilan Konstitusi</option>
                              <option value="Peradilan Umum">Peradilan Umum</option>
                              <option value="Perdagangan">Perdagangan</option>
                              <option value="Perencanaan Pembangunan Nasional">Perencanaan Pembangunan Nasional</option>
                              <option value="Perhubungan">Perhubungan</option>
                              <option value="Perindustrian">Perindustrian</option>
                              <option value="Perpustakaan">Perpustakaan</option>
                              <option value="Pertahanan">Pertahanan</option>
                              <option value="Pertanahan">Pertanahan</option>
                              <option value="Pertanian">Pertanian</option>
                              <option value="Perumahan Rakyat dan Kawasan Pemukiman">Perumahan Rakyat dan Kawasan Pemukiman</option>
                              <option value="Sosial">Sosial</option>
                              <option value="Standarisasi Industri Teknologi dan Pelayanan Publik">Standarisasi Industri Teknologi dan Pelayanan Publik</option>
                              <option value="Statistik">Statistik</option>
                              <option value="Tenaga Kerja">Tenaga Kerja</option>
                              <option value="Transmigrasi">Transmigrasi</option>
                              <option value="Usaha Kecil dan Menengah">Usaha Kecil dan Menengah</option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Nomor Sertifikat Kursus *</label>
                            <input type="text" className="form-control" placeholder="Masukkan nomor sertifikat" required value={k.nomor_sertifikasi || ''} onChange={e => handleChange(k.id, 'nomor_sertifikasi', e.target.value)} />
                          </div>
                          <div className="col-md-12">
                            <label className="form-label">Institusi Penyelenggara *</label>
                            <input type="text" className="form-control" placeholder="Contoh: BKPSDMD / KEMENDAGRI" required value={k.institusi_penyelenggara || ''} onChange={e => handleChange(k.id, 'institusi_penyelenggara', e.target.value)} />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Tanggal Mulai *</label>
                            <input type="date" className="form-control" required value={k.tanggal_mulai || ''} onChange={e => handleChange(k.id, 'tanggal_mulai', e.target.value)} />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Tanggal Berakhir *</label>
                            <input type="date" className="form-control" required value={k.tanggal_akhir || ''} onChange={e => handleChange(k.id, 'tanggal_akhir', e.target.value)} />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Tahun Kursus *</label>
                            <input type="number" className="form-control" placeholder="Contoh: 2026" required value={k.tahun || ''} onChange={e => handleChange(k.id, 'tahun', e.target.value)} />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Durasi (JP) *</label>
                            <div className="input-group">
                              <input type="number" className="form-control" placeholder="0" required value={k.jumlah_jp || ''} onChange={e => handleChange(k.id, 'jumlah_jp', e.target.value)} />
                              <span className="input-group-text bg-white text-muted" style={{borderColor:'#bae6fd'}}>JP</span>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Penanda Tangan *</label>
                            <input type="text" className="form-control" placeholder="Contoh: Kepala Dinas" required value={k.pejabat || ''} onChange={e => handleChange(k.id, 'pejabat', e.target.value)} />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Biaya Pelatihan *</label>
                            <div className="input-group">
                              <select className="form-select bg-light" style={{maxWidth:'110px'}} value={k.biaya_tipe || 'Berbayar'} onChange={e => {
                                handleChange(k.id, 'biaya_tipe', e.target.value);
                                if (e.target.value === 'Gratis') handleChange(k.id, 'biaya_nominal', '0');
                              }}>
                                <option value="Berbayar">Berbayar</option>
                                <option value="Gratis">Gratis</option>
                              </select>
                              <input type="number" className="form-control" placeholder="Contoh: 500000" style={{display: k.biaya_tipe === 'Gratis' ? 'none' : 'block'}} required={k.biaya_tipe !== 'Gratis'} value={k.biaya_nominal || ''} onChange={e => handleChange(k.id, 'biaya_nominal', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={tambahKegiatan}><i className="bi bi-plus-lg me-1"></i> Tambah Aktifitas Lain</button>
                      <div className="fw-bold text-success">Total: <span>{getTotalJP()}</span> JP</div>
                    </div>
                    
                    <div className="text-end mt-4 pt-3 border-top">
                      <button type="button" className="btn btn-primary btn-action" onClick={() => handleNext(2)}>Selanjutnya &gt;&gt;</button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <div className="alert alert-info border-0 bg-info bg-opacity-10 mb-4" style={{fontSize:'0.85rem'}}>
                      <i className="bi bi-info-circle-fill me-2 text-info"></i> Silakan unggah dokumen sertifikat untuk setiap aktifitas yang Anda daftarkan di Langkah 1. File akan disimpan secara lokal di server.
                    </div>
                    {kegiatans.map((k, index) => (
                      <div className="upload-block" key={k.id}>
                        <h6 className="mb-2 text-primary" style={{fontSize:'0.85rem'}}>
                          <span className="badge bg-secondary me-1">Aktifitas {index + 1}</span> {k.nama_kursus} <span className="text-muted fw-normal">(No: {k.nomor_sertifikasi})</span>
                        </h6>
                        <label className="form-label">Pilih File Sertifikat (PDF/JPG) <span className="text-danger">*</span> <small className="text-muted">(Maks. 2MB)</small></label>
                        <input type="file" className="form-control mb-3" accept=".pdf, .jpg, .jpeg, .png" required={!k.file} onChange={e => handleFileChange(k.id, e)} />
                        {k.preview && (
                          <div className="mt-2 p-2 border rounded bg-white d-inline-block text-center">
                            <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={() => setPreviewModal(k.preview)} title="Klik untuk melihat dokumen lengkap">
                              {(k.preview.startsWith('data:image') || k.preview.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
                                <img src={k.preview} alt="Preview Dokumen" className="img-thumbnail" style={{ height: '100px', objectFit: 'cover', cursor: 'pointer' }} />
                              ) : (
                                <div className="p-3 bg-light border rounded text-danger"><i className="bi bi-file-earmark-pdf fs-1"></i></div>
                              )}
                              <div className="small mt-1 text-primary"><i className="bi bi-search"></i> Lihat Dokumen</div>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                      <button type="button" className="btn btn-outline-secondary btn-action" onClick={() => handleNext(1)}>&lt;&lt; Sebelumnya</button>
                      <button type="button" className="btn btn-primary btn-action" onClick={() => handleNext(3)}>Selanjutnya &gt;&gt;</button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <div className="table-responsive border rounded-3 mb-4 mt-2">
                      <table className="table table-hover mb-0" style={{fontSize:'0.85rem'}}>
                        <thead className="bg-light">
                          <tr><th>No</th><th>Nama Kursus</th><th>No. Sertifikat</th><th>Institusi</th><th>Durasi</th><th className="text-center">Dokumen</th></tr>
                        </thead>
                        <tbody>
                          {kegiatans.map((k, index) => (
                            <tr key={k.id}>
                              <td>{index + 1}</td>
                              <td className="fw-bold text-primary">{k.nama_kursus}</td>
                              <td>{k.nomor_sertifikasi}</td>
                              <td>{k.institusi_penyelenggara}</td>
                              <td><span className="badge bg-info rounded-pill">{k.jumlah_jp} JP</span></td>
                              <td className="text-center">
                                {k.file ? <span className="text-success fw-medium"><i className="bi bi-file-earmark-check"></i> {k.file.name}</span> : <i className="bi bi-x-circle-fill text-danger fs-5"></i>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="form-check mt-3" style={{fontSize: '0.85rem'}}>
                      <input className="form-check-input" type="checkbox" id="checkSetuju" required checked={agree} onChange={e => setAgree(e.target.checked)} />
                      <label className="form-check-label text-muted" htmlFor="checkSetuju">Saya menyatakan data yang diisi benar dan dapat dipertanggungjawabkan.</label>
                    </div>

                    <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                      <button type="button" className="btn btn-outline-secondary btn-action" onClick={() => handleNext(2)}>&lt;&lt; Sebelumnya</button>
                      <button type="submit" disabled={isSubmitting} className="btn btn-success btn-action"><i className="bi bi-save me-1"></i> {isSubmitting ? 'Menyimpan...' : 'Simpan Final'}</button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="col-lg-3">
            <div className="card card-custom p-4">
              <h6 className="fw-bold text-center mb-4" style={{color: '#0284c7'}}>Tambah Riwayat<br/>Sertifikasi</h6>
              <div className="info-timeline">
                <div className="info-item">
                  <div className="info-dot">1</div><div className="info-title">Masukan data</div>
                  <div className="info-desc">Silahkan masukan detail kegiatan seperti Jenis Pelatihan, Nomor Sertifikat, JP, dll. Anda bisa memasukkan lebih dari 1 kegiatan.</div>
                </div>
                <div className="info-item">
                  <div className="info-dot">2</div><div className="info-title">Upload Dokumen</div>
                  <div className="info-desc">Upload data sertifikat pendukung sesuai dengan jumlah kegiatan yang Anda daftarkan.</div>
                </div>
                <div className="info-item">
                  <div className="info-dot">3</div><div className="info-title">Ringkasan</div>
                  <div className="info-desc">Periksa kembali data Anda sebelum melakukan penyimpanan akhir ke server.</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Preview Modal */}
      {previewModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Preview Dokumen</h5>
                <button type="button" className="btn-close" onClick={() => setPreviewModal(null)}></button>
              </div>
              <div className="modal-body text-center p-0" style={{ height: '70vh' }}>
                {(previewModal.startsWith('data:image') || previewModal.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
                  <img src={previewModal} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <iframe src={previewModal} style={{ width: '100%', height: '100%', border: 'none' }} title="Dokumen Preview" />
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPreviewModal(null)}>Kembali</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
