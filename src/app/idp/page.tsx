'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function IDPPage() {
  const router = useRouter();
  const [pegawai, setPegawai] = useState<any>(null);
  const [semuaPegawai, setSemuaPegawai] = useState<any[]>([]);
  const [selectedKetua, setSelectedKetua] = useState<{nip: string, nama: string} | null>(null);
  const [searchKetua, setSearchKetua] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [idps, setIdps] = useState<any[]>([{ 
    id: 1, 
    jenis_kompetensi: '',
    jenis_pengembangan: '',
    jalur_pengembangan: '',
    penyelenggara: '',
    waktu_pelaksanaan_awal: '',
    waktu_pelaksanaan_akhir: '',
    jp: '',
    anggaran: '',
    status: 'Menunggu Persetujuan'
  }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    const nip = localStorage.getItem('loggedInUser');
    if (!nip || nip === 'admin') {
      router.push('/login');
      return;
    }
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/pegawai?nip=${nip}`);
        const result = await res.json();
        if (result.success && result.data?.pegawai) {
          setPegawai(result.data.pegawai);
        }

        const resAll = await fetch('/api/pegawai/all');
        const resultAll = await resAll.json();
        if (resultAll.success) {
          // Exclude self from ketua options
          setSemuaPegawai(resultAll.data.filter((p: any) => p.nip !== nip));
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchData();
  }, [router]);

  const tambahIdp = () => {
    setIdps(prev => [...prev, { 
      id: Date.now(), 
      jenis_kompetensi: '', jenis_pengembangan: '', jalur_pengembangan: '', penyelenggara: '',
      waktu_pelaksanaan_awal: '', waktu_pelaksanaan_akhir: '', jp: '', anggaran: '', status: 'Menunggu Persetujuan'
    }]);
  };

  const hapusIdp = (idToRemove: number) => {
    if (idps.length === 1) return;
    setIdps(prev => prev.filter(k => k.id !== idToRemove));
  };

  const handleChange = (id: number, field: string, value: any) => {
    setIdps(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      alert("Anda harus menyetujui pernyataan terlebih dahulu!");
      return;
    }
    
    // Validasi
    for (const k of idps) {
      if (!k.jenis_kompetensi || !k.jenis_pengembangan || !k.jalur_pengembangan || !k.penyelenggara || !k.waktu_pelaksanaan_awal || !k.waktu_pelaksanaan_akhir || !k.jp) {
        alert('Tolong isi semua kolom wajib (*) !');
        return;
      }
    }
    if (!selectedKetua) {
      alert("Silakan pilih Atasan (Ketua) terlebih dahulu!");
      return;
    }

    if (!pegawai) return;
    setIsSubmitting(true);
    
    // Inject ketua info into each IDP row
    const idpsWithKetua = idps.map(k => ({
      ...k,
      nip_ketua: selectedKetua.nip,
      nama_ketua: selectedKetua.nama
    }));

    try {
      const res = await fetch(`/api/idp?nip=${pegawai.nip}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(idpsWithKetua)
      });
      
      const json = await res.json();
      if (json.success) {
        router.push('/dashboard');
      } else {
        alert('Gagal menyimpan IDP: ' + (json.message || json.error));
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menyimpan IDP');
    } finally {
      setIsSubmitting(false);
    }
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
        
        .form-label { font-size: 0.8rem; color: #475569; font-weight: 500; margin-bottom: 4px; }
        .form-control, .form-select { border: 1px solid #bae6fd; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.9rem; color: #1e293b; background-color: #ffffff; }
        .btn-action { border-radius: 8px; font-size: 0.9rem; font-weight: 500; padding: 0.5rem 1.5rem; }
        
        .form-kegiatan-block { border: 1px dashed #bae6fd; padding: 20px; border-radius: 12px; margin-bottom: 20px; background-color: #ffffff; position: relative; }
        
        .info-timeline { position: relative; padding-left: 20px; }
        .info-timeline::before { content: ''; position: absolute; left: 7px; top: 5px; bottom: 20px; width: 2px; background-color: #e2e8f0; }
        .info-item { position: relative; margin-bottom: 20px; }
        .info-dot { position: absolute; left: -20px; top: 2px; width: 16px; height: 16px; border-radius: 50%; background-color: #0ea5e9; color: white; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        .info-title { font-weight: 600; font-size: 0.85rem; color: #0ea5e9; margin-bottom: 2px; }
        .info-desc { font-size: 0.75rem; color: #64748b; line-height: 1.4; }
        .dropdown-menu-custom { position: absolute; z-index: 1000; width: 100%; max-height: 200px; overflow-y: auto; background-color: #fff; border: 1px solid #bae6fd; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-top: 4px; padding: 0; }
        .dropdown-item-custom { padding: 8px 12px; cursor: pointer; font-size: 0.85rem; border-bottom: 1px solid #f1f5f9; }
        .dropdown-item-custom:hover { background-color: #f0f9ff; }
        .dropdown-item-custom:last-child { border-bottom: none; }
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
            <div className="breadcrumb-text"><strong>IDP</strong> &nbsp;|&nbsp; Home &gt; Layanan ASN &gt; Update Data &gt; Individual Development Plan (IDP)</div>
            <div className="card card-custom p-4">
              <h5 className="fw-bold text-primary mb-4 border-bottom pb-2"><i className="bi bi-calendar2-check-fill me-2"></i> Individual Development Plan (IDP)</h5>

              <form onSubmit={handleSubmit}>
                <div className="card mb-4 border-0 bg-primary bg-opacity-10">
                  <div className="card-body py-2 px-3">
                    <div className="row">
                      <div className="col-md-6 mb-2 mb-md-0">
                        <label className="form-label small text-muted mb-0">NIP Pegawai</label>
                        <input type="text" className="form-control form-control-sm bg-transparent border-0 fw-bold px-0" readOnly value={pegawai?.nip || ''} />
                      </div>
                      <div className="col-md-6 mb-2 mb-md-0">
                        <label className="form-label small text-muted mb-0">Nama Pegawai</label>
                        <input type="text" className="form-control form-control-sm bg-transparent border-0 fw-bold px-0" readOnly value={pegawai?.nama || ''} />
                      </div>
                      <div className="col-md-12 mt-2">
                        <label className="form-label small text-muted mb-0">Jabatan</label>
                        <input type="text" className="form-control form-control-sm bg-transparent border-0 fw-bold px-0" readOnly value={pegawai?.jabatan || ''} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card mb-4 border-0 shadow-sm" style={{ backgroundColor: '#fff' }}>
                  <div className="card-body">
                    <h6 className="fw-bold text-dark mb-3"><i className="bi bi-person-check-fill text-primary me-2"></i>Pilih Atasan (Ketua) Penilai</h6>
                    <div className="position-relative">
                      {selectedKetua ? (
                        <div className="d-flex align-items-center p-2 border rounded bg-light border-primary">
                          <div className="me-auto">
                            <div className="fw-bold text-dark">{selectedKetua.nama}</div>
                            <div className="text-muted" style={{fontSize: '0.8rem'}}>NIP. {selectedKetua.nip}</div>
                          </div>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => { setSelectedKetua(null); setSearchKetua(''); }}>
                            <i className="bi bi-x-lg"></i> Ganti
                          </button>
                        </div>
                      ) : (
                        <>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Cari nama atau NIP ketua..." 
                            value={searchKetua}
                            onChange={(e) => { setSearchKetua(e.target.value); setIsDropdownOpen(true); }}
                            onFocus={() => setIsDropdownOpen(true)}
                          />
                          {isDropdownOpen && searchKetua.length > 0 && (
                            <div className="dropdown-menu-custom">
                              {semuaPegawai.filter(p => p.nama.toLowerCase().includes(searchKetua.toLowerCase()) || p.nip.includes(searchKetua)).slice(0, 10).map(p => (
                                <div key={p.nip} className="dropdown-item-custom" onClick={() => {
                                  setSelectedKetua({ nip: p.nip, nama: p.nama });
                                  setIsDropdownOpen(false);
                                  setSearchKetua('');
                                }}>
                                  <div className="fw-bold">{p.nama}</div>
                                  <div className="text-muted" style={{fontSize: '0.75rem'}}>NIP. {p.nip} {p.jabatan ? `- ${p.jabatan}` : ''}</div>
                                </div>
                              ))}
                              {semuaPegawai.filter(p => p.nama.toLowerCase().includes(searchKetua.toLowerCase()) || p.nip.includes(searchKetua)).length === 0 && (
                                <div className="p-2 text-muted text-center" style={{fontSize: '0.85rem'}}>Ketua tidak ditemukan</div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      <div className="form-text text-muted" style={{fontSize: '0.75rem'}}>IDP ini akan diteruskan ke atasan yang dipilih untuk disetujui.</div>
                    </div>
                  </div>
                </div>

                {idps.map((k, index) => (
                  <div className="form-kegiatan-block bg-light" key={k.id}>
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                      <h6 className="text-primary fw-bold mb-0">Rencana IDP {index + 1}</h6>
                      {idps.length > 1 && (
                        <button type="button" className="btn btn-sm btn-outline-danger py-0 px-2" onClick={() => hapusIdp(k.id)}><i className="bi bi-trash"></i> Hapus</button>
                      )}
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Jenis Kompetensi *</label>
                        <input type="text" className="form-control" placeholder="Contoh: Orientasi pada hasil (1)" required value={k.jenis_kompetensi || ''} onChange={e => handleChange(k.id, 'jenis_kompetensi', e.target.value)} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Jenis Pengembangan *</label>
                        <select className="form-select" required value={k.jenis_pengembangan || ''} onChange={e => handleChange(k.id, 'jenis_pengembangan', e.target.value)}>
                          <option value="">- Pilih Jenis Pengembangan -</option>
                          <option value="Pelatihan Non Klasikal">Pelatihan Non Klasikal</option>
                          <option value="Pelatihan Klasikal">Pelatihan Klasikal</option>
                          <option value="Blended Learning">Blended Learning</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Jalur Pengembangan *</label>
                        <input type="text" className="form-control" placeholder="Contoh: Mentoring, Diklat, dll" required value={k.jalur_pengembangan || ''} onChange={e => handleChange(k.id, 'jalur_pengembangan', e.target.value)} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Penyelenggara *</label>
                        <input type="text" className="form-control" placeholder="Contoh: BPSDM / Kemendagri" required value={k.penyelenggara || ''} onChange={e => handleChange(k.id, 'penyelenggara', e.target.value)} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Waktu Awal Pelaksanaan *</label>
                        <input type="date" className="form-control" required value={k.waktu_pelaksanaan_awal || ''} onChange={e => handleChange(k.id, 'waktu_pelaksanaan_awal', e.target.value)} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Waktu Akhir Pelaksanaan *</label>
                        <input type="date" className="form-control" required value={k.waktu_pelaksanaan_akhir || ''} onChange={e => handleChange(k.id, 'waktu_pelaksanaan_akhir', e.target.value)} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Durasi (JP) *</label>
                        <div className="input-group">
                          <input type="number" className="form-control" placeholder="0" required value={k.jp || ''} onChange={e => handleChange(k.id, 'jp', e.target.value)} />
                          <span className="input-group-text bg-white text-muted" style={{borderColor:'#bae6fd'}}>JP</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Anggaran (Opsional)</label>
                        <div className="input-group">
                          <span className="input-group-text bg-white text-muted" style={{borderColor:'#bae6fd'}}>Rp</span>
                          <input type="number" className="form-control" placeholder="0" value={k.anggaran || ''} onChange={e => handleChange(k.id, 'anggaran', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6 d-none">
                        <label className="form-label">Status</label>
                        <input type="text" className="form-control" value="Menunggu Persetujuan" readOnly />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="d-flex justify-content-between align-items-center mt-3 mb-4">
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={tambahIdp}><i className="bi bi-plus-lg me-1"></i> Tambah Rencana IDP</button>
                </div>
                
                <div className="form-check mt-3" style={{fontSize: '0.85rem'}}>
                  <input className="form-check-input" type="checkbox" id="checkSetuju" required checked={agree} onChange={e => setAgree(e.target.checked)} />
                  <label className="form-check-label text-muted" htmlFor="checkSetuju">Saya menyatakan data Rencana IDP yang diisi benar dan dapat dipertanggungjawabkan.</label>
                </div>

                <div className="text-end mt-4 pt-3 border-top">
                  <button type="button" className="btn btn-outline-secondary btn-action me-2" onClick={() => router.push('/dashboard')}>Batal</button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-success btn-action"><i className="bi bi-save me-1"></i> {isSubmitting ? 'Menyimpan...' : 'Simpan IDP'}</button>
                </div>
              </form>
            </div>
          </div>

          <div className="col-lg-3">
            <div className="card card-custom p-4">
              <h6 className="fw-bold text-center mb-4" style={{color: '#0284c7'}}>Panduan Pengisian IDP</h6>
              <div className="info-timeline">
                <div className="info-item">
                  <div className="info-dot">1</div><div className="info-title">Jenis Kompetensi</div>
                  <div className="info-desc">Contoh: Orientasi pada hasil, Pengembangan diri dan orang lain, dll.</div>
                </div>
                <div className="info-item">
                  <div className="info-dot">2</div><div className="info-title">Jenis Pengembangan</div>
                  <div className="info-desc">Pilih antara Pelatihan Klasikal, Non Klasikal, Blended Learning, dll.</div>
                </div>
                <div className="info-item">
                  <div className="info-dot">3</div><div className="info-title">Jalur Pengembangan</div>
                  <div className="info-desc">Bentuk riil dari pengembangan seperti Mentoring, Coaching, Bimtek, Sertifikasi, dll.</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
