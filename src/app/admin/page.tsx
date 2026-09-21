'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('view-dashboard');
  const [pegawaiList, setPegawaiList] = useState<any[]>([]);
  const [selectedPegawai, setSelectedPegawai] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'lulus' | 'belum'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PNS' | 'PPPK' | 'PW'>('all');
  const [tahunFilter, setTahunFilter] = useState<string>('all');
  const [rawPegawaiList, setRawPegawaiList] = useState<any[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/data');
        const json = await res.json();
        if (json.success && json.data) {
          setRawPegawaiList(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchData();
  }, [router]);

  useEffect(() => {
    const computed = rawPegawaiList.map(p => {
      const filteredSertifikasi = tahunFilter === 'all' 
        ? p.sertifikasi 
        : p.sertifikasi?.filter((s: any) => s.tahun === tahunFilter);
      const jp = filteredSertifikasi?.reduce((acc: number, curr: any) => acc + (curr.jumlah_jp || 0), 0) || 0;
      return { ...p, jp, filteredSertifikasi };
    });
    setPegawaiList(computed);
  }, [rawPegawaiList, tahunFilter]);

  const hapusPegawai = async (nip: string) => {
    if (confirm('Yakin ingin menghapus pegawai ini beserta seluruh datanya?')) {
      try {
        const res = await fetch(`/api/pegawai?nip=${nip}`, { method: 'DELETE' });
        if (res.ok) window.location.reload();
        else alert('Gagal menghapus pegawai');
      } catch (err) { alert('Terjadi kesalahan saat menghapus'); }
    }
  };

  const updateIdpStatus = async (rowIndex: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/idp?rowIndex=${rowIndex}&status=${encodeURIComponent(newStatus)}`, { method: 'PUT' });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Gagal memperbarui status');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat memperbarui status');
    }
  };

  const availableYears = Array.from(new Set(
    rawPegawaiList.flatMap(p => p.sertifikasi?.map((s: any) => s.tahun).filter(Boolean))
  )).sort().reverse();

  const lulus = pegawaiList.filter(p => p.jp >= 20).length;
  const belum = pegawaiList.length - lulus;
  let sertifCounter = 1;
  let idpCounter = 1;

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  const handleLihatDokumen = (url: string) => {
    if (!url) return;
    let docUrl = url;
    if (docUrl.includes('/view?url=')) {
      docUrl = decodeURIComponent(docUrl.split('/view?url=')[1]);
    }
    if (docUrl.includes('drive.google.com')) {
      window.open(docUrl, '_blank');
      return;
    }
    setPreviewUrl(docUrl);
  };

  const getTopbarTitle = () => {
    if (activeTab === 'view-dashboard') return 'Overview Kelulusan 20 JP Pegawai';
    if (activeTab === 'view-pegawai') return 'Manajemen Data Pegawai';
    if (activeTab === 'view-sertifikasi') return 'Manajemen Rekap Sertifikasi';
    if (activeTab === 'view-idp') return 'Approval Individual Development Plan (IDP)';
    return '';
  };

  const exportToExcel = () => {
    const filteredByMode = pegawaiList.filter(p => {
      if (filterMode === 'lulus') return p.jp >= 20;
      if (filterMode === 'belum') return p.jp < 20;
      return true;
    });
    const finalFiltered = filteredByMode.filter(p => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'PW' && p.status_pegawai?.toLowerCase().includes('kontrak')) return true;
      return p.status_pegawai === statusFilter;
    });

    const maxCerts = Math.max(0, ...finalFiltered.map(p => {
      const certs = p.filteredSertifikasi || p.sertifikasi || [];
      return certs.length;
    }));

    const excelData = finalFiltered.map((p, index) => {
      const baseRow: any = {
        "No": index + 1,
        "NIP": p.nip,
        "Nama Pegawai": p.nama,
        "Jenis Kelamin": p.jenis_kelamin,
        "Status Pegawai": p.status_pegawai,
        "Pangkat/Golongan": p.pangkat,
        "Jabatan": p.jabatan,
        "Unit Kerja": p.unit_kerja,
        "Total JP": p.jp,
        "Status Kelulusan": p.jp >= 20 ? "MEMENUHI" : "BELUM MEMENUHI",
      };

      const certs = p.filteredSertifikasi || p.sertifikasi || [];
      for (let i = 0; i < maxCerts; i++) {
        if (i < certs.length) {
          const s = certs[i];
          baseRow[`Nama Sertifikat ${i + 1}`] = s.nama_kursus || s.jenis_sertifikasi || '-';
          baseRow[`Jenis Kursus ${i + 1}`] = s['jenis kursus'] || s.jenis_kursus || '-';
          baseRow[`Klasifikasi Kursus ${i + 1}`] = s['klasifikasi kursus'] || s.klasifikasi_kursus || '-';
          baseRow[`Penanda Tangan ${i + 1}`] = s['penanda tangan'] || s.pejabat || s.penanda_tangan || '-';
          baseRow[`Biaya Pelatihan ${i + 1}`] = s['biaya pelatihan'] || s.biaya || s.biaya_pelatihan || '-';
          
          let linkUrl = s.link_sertifikat || 'Tidak ada link';
          
          // Bersihkan rumus =HYPERLINK lama jika ada agar tidak error di Excel
          if (typeof linkUrl === 'string' && linkUrl.startsWith('=HYPERLINK("')) {
            const match = linkUrl.match(/=HYPERLINK\("(.*?)",/);
            if (match && match[1]) {
              linkUrl = match[1];
            }
          }

          // Jika URL berupa relative /uploads, ubah jadi absolut
          if (linkUrl.startsWith('/uploads')) {
            linkUrl = `${window.location.origin}${linkUrl}`;
          }

          // Bungkus dengan /view agar link dari Excel membuka custom viewer (ada tombol Kembalinya)
          // KECUALI untuk link Google Drive agar langsung membuka Drive asli.
          if (linkUrl.startsWith('http') && !linkUrl.includes('/view?url=') && !linkUrl.includes('drive.google.com')) {
            linkUrl = `${window.location.origin}/view?url=${encodeURIComponent(linkUrl)}`;
          }

          baseRow[`Link Sertifikat ${i + 1}`] = linkUrl;
        } else {
          baseRow[`Nama Sertifikat ${i + 1}`] = '-';
          baseRow[`Jenis Kursus ${i + 1}`] = '-';
          baseRow[`Klasifikasi Kursus ${i + 1}`] = '-';
          baseRow[`Penanda Tangan ${i + 1}`] = '-';
          baseRow[`Biaya Pelatihan ${i + 1}`] = '-';
          baseRow[`Link Sertifikat ${i + 1}`] = '-';
        }
      }

      return baseRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Ubah teks URL menjadi clickable link di Excel
    for (const cellAddress in worksheet) {
      if (!cellAddress.startsWith('!')) {
        const cell = worksheet[cellAddress];
        if (cell.v && typeof cell.v === 'string' && cell.v.startsWith('http')) {
          const url = cell.v;
          // Menggunakan link native Excel agar otomatis berwarna biru
          worksheet[cellAddress] = {
            t: 's',
            v: "Lihat Dokumen",
            l: { Target: url }
          };
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pegawai");
    XLSX.writeFile(workbook, `Laporan_Sertifikasi_Pegawai_${tahunFilter}.xlsx`);
  };

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      <style dangerouslySetInnerHTML={{__html: `
        body, html { min-height: 100%; margin: 0; font-family: 'Inter', sans-serif; background-color: #f1f5f9; }
        .sidebar { background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); color: #f8fafc; min-height: 100vh; box-shadow: 2px 0 10px rgba(0,0,0,0.1); }
        .sidebar-brand { padding: 20px; font-weight: 800; font-size: 1.4rem; color: white; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; }
        .sidebar-nav { list-style: none; padding: 0; margin: 20px 0; }
        .sidebar-nav li a { display: flex; align-items: center; padding: 15px 25px; color: #cbd5e1; text-decoration: none; transition: all 0.3s; font-weight: 500; cursor: pointer; }
        .sidebar-nav li a:hover, .sidebar-nav li a.active { background-color: rgba(255,255,255,0.1); color: white; border-left: 4px solid #38bdf8; }
        .sidebar-nav li a i { margin-right: 15px; font-size: 1.2rem; }
        .topbar { background-color: white; padding: 15px 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); display: flex; justify-content: space-between; align-items: center; }
        .stat-card { background-color: white; border: 2px solid transparent; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; align-items: center; margin-bottom: 25px; cursor: pointer; transition: all 0.2s ease; }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px rgba(0,0,0,0.05); }
        .stat-card.active-filter { border-color: #0ea5e9; background-color: #f0f9ff; }
        .stat-icon { width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin-right: 20px; }
        .stat-content h3 { font-size: 1.8rem; font-weight: 700; margin: 0; color: #1e293b; }
        .stat-content p { margin: 0; color: #64748b; font-size: 0.9rem; font-weight: 500; }
        .table-card { background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); padding: 25px; margin-bottom: 30px; }
        .table-hover tbody tr:hover { background-color: #f8fafc; }
        .badge-status { padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 0.75rem; }
        .status-ok { background-color: #dcfce7; color: #166534; }
        .status-warn { background-color: #fef3c7; color: #b45309; }
      `}} />

      <div className="container-fluid p-0">
        <div className="row g-0">
          
          {/* Sidebar */}
          <div className="col-lg-2 d-none d-lg-block sidebar">
            <div className="sidebar-brand">
              <i className="bi bi-shield-lock-fill text-info me-2"></i> Admin DIKLAT
            </div>
            <ul className="sidebar-nav">
              <li><a onClick={() => setActiveTab('view-dashboard')} className={`nav-item ${activeTab === 'view-dashboard' ? 'active' : ''}`}><i className="bi bi-speedometer2"></i> Dashboard</a></li>
              <li><a onClick={() => setActiveTab('view-pegawai')} className={`nav-item ${activeTab === 'view-pegawai' ? 'active' : ''}`}><i className="bi bi-people-fill"></i> Data Pegawai</a></li>
              <li><a onClick={() => setActiveTab('view-sertifikasi')} className={`nav-item ${activeTab === 'view-sertifikasi' ? 'active' : ''}`}><i className="bi bi-journal-check"></i> Rekap Sertifikasi</a></li>
              <li><a onClick={() => setActiveTab('view-idp')} className={`nav-item ${activeTab === 'view-idp' ? 'active' : ''}`}><i className="bi bi-calendar2-check"></i> Approval IDP</a></li>
              <li className="mt-5"><a onClick={handleLogout} className="text-danger"><i className="bi bi-box-arrow-left"></i> Logout</a></li>
            </ul>
          </div>

          {/* Main Content */}
          <div className="col-lg-10 col-md-12">
            <div className="topbar">
              <h5 className="fw-bold text-secondary mb-0">{getTopbarTitle()}</h5>
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-bell fs-5 text-muted"></i>
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px', fontWeight: 'bold' }}>AD</div>
                  <span className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>Administrator Utama</span>
                </div>
              </div>
            </div>

            <div className="p-4 p-md-5">
              
              {/* DASHBOARD TAB */}
              {activeTab === 'view-dashboard' && (
                <div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className={`stat-card ${filterMode === 'all' ? 'active-filter' : ''}`} onClick={() => setFilterMode('all')} title="Klik untuk melihat semua pegawai">
                        <div className="stat-icon bg-primary bg-opacity-10 text-primary"><i className="bi bi-people-fill"></i></div>
                        <div className="stat-content">
                          <h3>{pegawaiList.length}</h3>
                          <p>Total Pegawai Terdaftar</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className={`stat-card ${filterMode === 'lulus' ? 'active-filter' : ''}`} onClick={() => setFilterMode('lulus')} title="Klik untuk memfilter yang sudah memenuhi">
                        <div className="stat-icon bg-success bg-opacity-10 text-success"><i className="bi bi-check-circle-fill"></i></div>
                        <div className="stat-content">
                          <h3>{lulus}</h3>
                          <p>Memenuhi 20 JP / Tahun</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className={`stat-card ${filterMode === 'belum' ? 'active-filter' : ''}`} onClick={() => setFilterMode('belum')} title="Klik untuk memfilter yang belum memenuhi">
                        <div className="stat-icon bg-warning bg-opacity-10 text-warning"><i className="bi bi-exclamation-triangle-fill"></i></div>
                        <div className="stat-content">
                          <h3>{belum}</h3>
                          <p>Belum Memenuhi Kewajiban</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="table-card">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="fw-bold mb-0">
                        <i className="bi bi-list-task me-2 text-primary"></i> 
                        Daftar Pencapaian Pegawai 
                        <span className="badge bg-secondary ms-2">{tahunFilter === 'all' ? 'Semua Tahun' : `Tahun ${tahunFilter}`}</span>
                        {filterMode === 'lulus' && <span className="badge bg-success ms-2 fs-6">Filter: Memenuhi Syarat</span>}
                        {filterMode === 'belum' && <span className="badge bg-warning text-dark ms-2 fs-6">Filter: Belum Memenuhi</span>}
                      </h5>
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={exportToExcel}
                          title="Unduh laporan dalam format Excel"
                        >
                          <i className="bi bi-file-earmark-excel me-1"></i> Export Excel
                        </button>
                        <select 
                          className="form-select form-select-sm"
                          value={tahunFilter}
                          onChange={(e) => setTahunFilter(e.target.value)}
                          style={{ width: 'auto', minWidth: '120px' }}
                        >
                          <option value="all">Semua Tahun</option>
                          {availableYears.map(year => (
                            <option key={year as string} value={year as string}>{year as string}</option>
                          ))}
                        </select>
                        <select 
                          className="form-select form-select-sm" 
                          value={statusFilter} 
                          onChange={(e) => setStatusFilter(e.target.value as any)}
                          style={{ width: '220px' }}
                        >
                          <option value="all">Semua Status (PNS/PPPK/PW)</option>
                          <option value="PNS">PNS</option>
                          <option value="PPPK">P3K / PPPK</option>
                          <option value="PW">PW / Lainnya</option>
                        </select>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}><i className="bi bi-printer me-1"></i> Cetak Laporan</button>
                      </div>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>No</th>
                            <th>Nama Pegawai & NIP</th>
                            <th>Status / Jabatan</th>
                            <th>Unit Kerja</th>
                            <th className="text-center">Total JP</th>
                            <th className="text-center">Status Pemenuhan</th>
                            <th className="text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pegawaiList
                            .filter(p => {
                              if (filterMode === 'lulus' && p.jp < 20) return false;
                              if (filterMode === 'belum' && p.jp >= 20) return false;
                              
                              if (statusFilter !== 'all') {
                                const statusPeg = (p.status_pegawai || '').toUpperCase();
                                if (statusFilter === 'PNS' && !statusPeg.includes('PNS')) return false;
                                if (statusFilter === 'PPPK' && !(statusPeg.includes('P3K') || statusPeg.includes('PPPK'))) return false;
                                if (statusFilter === 'PW' && !(statusPeg.includes('PW') || (!statusPeg.includes('PNS') && !statusPeg.includes('P3K') && !statusPeg.includes('PPPK')))) return false;
                              }
                              
                              return true;
                            })
                            .map((p, index) => (
                              <tr key={index}>
                              <td className="fw-bold">{index + 1}</td>
                              <td>
                                <div className="fw-bold text-dark">{p.nama}</div>
                                <div className="text-muted" style={{ fontSize: '0.8rem' }}>NIP. {p.nip}</div>
                              </td>
                              <td>
                                <span className="badge bg-secondary mb-1">{p.status_pegawai}</span><br/>
                                <span style={{ fontSize: '0.85rem' }}>{p.jabatan}</span>
                              </td>
                              <td style={{ fontSize: '0.9rem' }}>{p.unit_kerja || '-'}</td>
                              <td className="text-center">
                                <span className={`fw-bold text-${p.jp >= 20 ? 'success' : 'danger'} fs-5`}>{p.jp}</span><br/>
                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Jam Pelajaran</span>
                              </td>
                              <td className="text-center">
                                {p.jp >= 20 
                                  ? <span className="badge-status status-ok"><i className="bi bi-check-circle-fill me-1"></i> Memenuhi Syarat</span>
                                  : <span className="badge-status status-warn"><i className="bi bi-exclamation-circle-fill me-1"></i> Belum Memenuhi</span>
                                }
                              </td>
                              <td className="text-center">
                                <button className="btn btn-sm btn-outline-primary" onClick={() => { setSelectedPegawai(p); setShowModal(true); }}>Lihat Detail</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* DATA PEGAWAI TAB */}
              {activeTab === 'view-pegawai' && (
                <div className="table-card">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">Master Data Pegawai</h5>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={exportToExcel}
                        title="Unduh data pegawai ke Excel"
                      >
                        <i className="bi bi-file-earmark-excel me-1"></i> Export Excel
                      </button>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>No</th>
                          <th>NIP</th>
                          <th>Nama Pegawai</th>
                          <th>Status</th>
                          <th>Jabatan</th>
                          <th>Unit Kerja</th>
                          <th className="text-center">Total JP</th>
                          <th className="text-center">Sertifikat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pegawaiList.map((p, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{p.nip}</td>
                            <td className="fw-bold">{p.nama || '-'}</td>
                            <td>{p.status_pegawai || '-'}</td>
                            <td>{p.jabatan || '-'}</td>
                            <td>{p.unit_kerja || '-'}</td>
                            <td className="text-center"><span className={`fw-bold text-${p.jp >= 20 ? 'success' : 'danger'}`}>{p.jp} JP</span></td>
                            <td className="text-center">
                              <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setSelectedPegawai(p); setShowModal(true); }}>Lihat Dokumen</button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => hapusPegawai(p.nip)} title="Hapus Pegawai"><i className="bi bi-trash"></i></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* REKAP SERTIFIKASI TAB */}
              {activeTab === 'view-sertifikasi' && (
                <div className="table-card">
                  <h5 className="fw-bold mb-4">Rekapitulasi Seluruh Sertifikat</h5>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>No</th>
                          <th>Pemilik (Nama)</th>
                          <th>Nama Kursus</th>
                          <th>Institusi</th>
                          <th>No. Sertifikat</th>
                          <th>Tanggal</th>
                          <th>JP</th>
                          <th className="text-center">Dokumen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pegawaiList.flatMap((p) => {
                          if (!p.sertifikasi || p.sertifikasi.length === 0) {
                            return [(
                              <tr key={p.nip}>
                                <td>{sertifCounter++}</td>
                                <td className="fw-bold">{p.nama}</td>
                                <td className="text-muted fst-italic" colSpan={3}>Belum ada data sertifikasi</td>
                                <td><span className="badge bg-info rounded-pill">0 JP</span></td>
                                <td></td>
                              </tr>
                            )];
                          }
                          return p.sertifikasi.map((s: any) => (
                            <tr key={s.id}>
                              <td>{sertifCounter++}</td>
                              <td className="fw-bold">{p.nama}</td>
                              <td className="text-primary fw-bold">{s.nama_kursus || s.jenis_sertifikasi || '-'}</td>
                              <td>{s.institusi_penyelenggara || '-'}</td>
                              <td>{s.nomor_sertifikasi || '-'}</td>
                              <td>{s.tanggal_sertifikasi || '-'}</td>
                              <td><span className="badge bg-info rounded-pill">{s.jumlah_jp || 0} JP</span></td>
                              <td className="text-center">
                                {s.link_sertifikat ? <button onClick={() => handleLihatDokumen(s.link_sertifikat)} className="btn btn-sm btn-outline-primary"><i className="bi bi-file-earmark-text"></i> Lihat</button> : '-'}
                              </td>
                            </tr>
                          ));
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* APPROVAL IDP TAB */}
              {activeTab === 'view-idp' && (
                <div className="table-card">
                  <div className="alert alert-warning mb-4">
                    <i className="bi bi-info-circle-fill me-2"></i> Modul ini masih dalam tahap pengembangan. Integrasi API untuk IDP belum sepenuhnya selesai. Ini adalah pratinjau tampilan tabel verifikasi.
                  </div>
                  <h5 className="fw-bold mb-4">Daftar Pengajuan IDP Pegawai</h5>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle" style={{fontSize: '0.85rem'}}>
                      <thead className="table-light">
                        <tr>
                          <th>No</th>
                          <th>Nama Pegawai</th>
                          <th>Jenis Kompetensi</th>
                          <th>Bentuk Pengembangan</th>
                          <th>Penyelenggara</th>
                          <th>Waktu</th>
                          <th>JP</th>
                          <th>Status</th>
                          <th className="text-center">Aksi Verifikasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pegawaiList.flatMap((p) => {
                          if (!p.idp || p.idp.length === 0) {
                            return [];
                          }
                          return p.idp.map((idp: any) => (
                            <tr key={idp._rowIndex}>
                              <td>{idpCounter++}</td>
                              <td className="fw-bold">{p.nama}<br/><span className="text-muted fw-normal" style={{fontSize: '0.75rem'}}>{p.nip}</span></td>
                              <td>{idp.jenis_kompetensi}</td>
                              <td>{idp.jenis_pengembangan}<br/><span className="badge bg-secondary">{idp.jalur_pengembangan}</span></td>
                              <td>{idp.penyelenggara}</td>
                              <td>{idp.waktu_pelaksanaan_awal} s.d. {idp.waktu_pelaksanaan_akhir}</td>
                              <td><span className="badge bg-info text-dark rounded-pill">{idp.jp} JP</span></td>
                              <td>
                                {idp.status === 'Disetujui' ? <span className="badge bg-success">Disetujui</span> :
                                 idp.status === 'Ditolak' ? <span className="badge bg-danger">Ditolak</span> :
                                 <span className="badge bg-warning text-dark">Menunggu Persetujuan</span>}
                              </td>
                              <td className="text-center">
                                {idp.status === 'Menunggu Persetujuan' ? (
                                  <>
                                    <button className="btn btn-sm btn-success me-1" title="Setujui" onClick={() => updateIdpStatus(idp._rowIndex, 'Disetujui')}><i className="bi bi-check-lg"></i></button>
                                    <button className="btn btn-sm btn-danger" title="Tolak" onClick={() => updateIdpStatus(idp._rowIndex, 'Ditolak')}><i className="bi bi-x-lg"></i></button>
                                  </>
                                ) : (
                                  <button className="btn btn-sm btn-outline-secondary" disabled>Terverifikasi</button>
                                )}
                              </td>
                            </tr>
                          ));
                        })}
                        
                        {/* Jika kosong semua */}
                        {pegawaiList.flatMap(p => p.idp || []).length === 0 && (
                          <tr>
                            <td colSpan={9} className="text-center text-muted py-4">Belum ada pengajuan IDP dari pegawai.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Modal Detail Diklat */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white border-0">
                <h5 className="modal-title fw-bold"><i className="bi bi-journal-check me-2"></i> Detail Riwayat Diklat / Sertifikasi</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="d-flex align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}>
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">{selectedPegawai?.nama || '-'}</h5>
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>NIP. {selectedPegawai?.nip || '-'}</span>
                  </div>
                </div>
                
                <h6 className="fw-bold text-secondary mb-3">Daftar Sertifikat Terunggah:</h6>
                <div className="table-responsive bg-white border rounded-3">
                  <table className="table table-hover mb-0" style={{ fontSize: '0.85rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th>No</th>
                        <th>Nama Kursus</th>
                        <th>Institusi</th>
                        <th>Nomor Sertifikat</th>
                        <th>Tanggal</th>
                        <th className="text-center">JP</th>
                        <th className="text-center">Dokumen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!selectedPegawai?.sertifikasi || selectedPegawai.sertifikasi.length === 0) ? (
                        <tr><td colSpan={6} className="text-center text-muted py-3">Belum ada sertifikat yang diunggah oleh pegawai ini.</td></tr>
                      ) : (
                        selectedPegawai.sertifikasi.map((s: any, idx: number) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td className="fw-bold text-primary">{s.nama_kursus || s.jenis_sertifikasi || '-'}</td>
                            <td>{s.institusi_penyelenggara || '-'}</td>
                            <td>{s.nomor_sertifikasi || '-'}</td>
                            <td>{s.tanggal_sertifikasi || '-'}</td>
                            <td className="text-center"><span className="badge bg-info rounded-pill">{s.jumlah_jp || 0} JP</span></td>
                            <td className="text-center">
                              {s.link_sertifikat ? <button onClick={() => handleLihatDokumen(s.link_sertifikat)} className="btn btn-sm btn-outline-primary"><i className="bi bi-file-earmark-text"></i> Lihat</button> : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer border-0 bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                ) : (
                  <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Dokumen Preview" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
