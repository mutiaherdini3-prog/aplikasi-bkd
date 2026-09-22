'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PendidikanPage() {
  const router = useRouter();
  const [pegawai, setPegawai] = useState<any>(null);
  const [pendidikans, setPendidikans] = useState<any[]>([{ id: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const nip = localStorage.getItem('loggedInUser');
    if (!nip || nip === 'admin') {
      router.push('/login');
      return;
    }
    const fetchData = async () => {
      const res = await fetch(`/api/pegawai?nip=${nip}`);
      const json = await res.json();
      if (json.success && json.data?.pegawai) setPegawai(json.data.pegawai);
    };
    fetchData();
  }, [router]);

  const tambahPendidikan = () => {
    setPendidikans([...pendidikans, { id: Date.now() }]);
  };

  const hapusPendidikan = (idToRemove: number) => {
    if (pendidikans.length === 1) return;
    setPendidikans(pendidikans.filter(p => p.id !== idToRemove));
  };

  const handleChange = (id: number, field: string, value: any) => {
    setPendidikans(pendidikans.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pegawai) return;
    setIsSubmitting(true);
    
    try {
      for (const p of pendidikans) {
        await fetch('/api/pendidikan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nip: pegawai.nip,
            tingkat_pendidikan: p.tingkat,
            nama_institusi: p.institusi,
            jurusan: p.jurusan || '',
            tahun_lulus: p.tahun_lulus,
            nomor_ijazah: p.no_ijazah || '',
            link_ijazah: ''
          })
        });
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
        body { background-color: #f4f7f6; font-family: 'Inter', sans-serif; color: #334155; }
        .navbar-custom { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
        .card-custom { border: none; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .form-pendidikan-block { border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 20px; background-color: #fafafa; position: relative; }
      `}} />

      <nav className="navbar navbar-expand-lg navbar-dark navbar-custom py-3">
        <div className="container">
          <a className="navbar-brand text-white fw-bold" onClick={(e) => { e.preventDefault(); router.push('/dashboard'); }} style={{cursor:'pointer'}}>
            <i className="bi bi-arrow-left me-2"></i> Kembali ke Profil
          </a>
        </div>
      </nav>
      
      <div className="container mt-5 mb-5">
        <div className="row justify-content-center">
          <div className="col-md-10">
            <div className="card card-custom p-4">
              <h4 className="fw-bold mb-3 border-bottom pb-3"><i className="bi bi-mortarboard text-primary me-2"></i> Formulir Input Riwayat Pendidikan</h4>
              
              <div className="alert alert-warning border-0 bg-warning bg-opacity-10 mb-4">
                <i className="bi bi-exclamation-triangle-fill me-2 text-warning"></i> Pastikan data pendidikan yang Anda masukkan sesuai dengan ijazah asli yang Anda miliki.
              </div>

              <form onSubmit={handleSubmit}>
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

                <div>
                  {pendidikans.map((p, index) => (
                    <div className="form-pendidikan-block" key={p.id}>
                      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                        <h5 className="text-primary mb-0"><i className="bi bi-journal-bookmark-fill me-2"></i>Data Pendidikan {index + 1}</h5>
                        {pendidikans.length > 1 && (
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => hapusPendidikan(p.id)}>
                            <i className="bi bi-trash"></i> Hapus
                          </button>
                        )}
                      </div>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label fw-medium small">Tingkat Pendidikan *</label>
                          <select className="form-select" required value={p.tingkat || ''} onChange={e => handleChange(p.id, 'tingkat', e.target.value)}>
                            <option value="">- Pilih Tingkat -</option>
                            <option value="SD">SD / Sederajat</option>
                            <option value="SMP">SMP / Sederajat</option>
                            <option value="SMA">SMA / Sederajat</option>
                            <option value="D3">Diploma III (D3)</option>
                            <option value="D4">Diploma IV (D4)</option>
                            <option value="S1">Strata 1 (S1)</option>
                            <option value="S2">Strata 2 (S2)</option>
                            <option value="S3">Strata 3 (S3)</option>
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-medium small">Fakultas / Program Studi / Jurusan</label>
                          <input type="text" className="form-control" placeholder="Contoh: Ilmu Komputer" value={p.jurusan || ''} onChange={e => handleChange(p.id, 'jurusan', e.target.value)} />
                        </div>

                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <button type="button" className="btn btn-outline-primary" onClick={tambahPendidikan}>
                    <i className="bi bi-plus-circle me-1"></i> Tambah Riwayat Pendidikan Lain
                  </button>
                </div>

                <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                  <button type="button" onClick={() => router.push('/dashboard')} className="btn btn-outline-secondary me-2">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-success px-4"><i className="bi bi-save me-1"></i> {isSubmitting ? 'Menyimpan...' : 'Simpan Data Pendidikan'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
