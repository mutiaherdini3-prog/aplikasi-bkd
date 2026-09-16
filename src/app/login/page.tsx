'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cleanNip = nip.trim();
      const cleanPassword = password.trim();

      // Cek di database Supabase (pakai string pencarian fleksibel untuk menghindari spasi nyangkut dari CSV)
      const { data, error: dbError } = await supabase
        .from('pegawai')
        .select('*')
        .eq('nip', cleanNip)
        .maybeSingle(); // gunakan maybeSingle agar tidak throw error jika tidak ketemu

      // Jika data tidak ketemu, kemungkinan saat import CSV ada spasi/enter di NIP
      if (!data) {
        // Coba cari pakai ilike, jangan pakai single() karena bisa return > 1 (misal 2345 vs 12345)
        const { data: fallbackDataList } = await supabase
          .from('pegawai')
          .select('*')
          .ilike('nip', `%${cleanNip}%`);
          
        let fallbackData = null;
        if (fallbackDataList && fallbackDataList.length > 0) {
           // Cari yang setelah di-trim benar-benar sama persis dengan cleanNip
           fallbackData = fallbackDataList.find(row => row.nip.trim() === cleanNip);
        }

        if (!fallbackData) {
          throw new Error('NIP atau Password salah');
        }
        
        if (fallbackData.password?.trim() !== cleanPassword) {
            throw new Error('NIP atau Password salah');
        }
        
        // Success with fallback
        localStorage.setItem('loggedInUser', fallbackData.nip); // Gunakan NIP asli dari DB
        localStorage.setItem('userRole', fallbackData.jabatan === 'Administrator' ? 'admin' : 'pegawai');
        
        if (fallbackData.jabatan === 'Administrator') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        return;
      }

      if (dbError || !data || data.password?.trim() !== cleanPassword) {
        throw new Error('NIP atau Password salah');
      }

      // Jika berhasil
      localStorage.setItem('loggedInUser', data.nip);
      localStorage.setItem('userRole', data.jabatan === 'Administrator' ? 'admin' : 'pegawai');
      
      if (data.jabatan === 'Administrator') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      alert(err.message || 'Login gagal! NIP atau Kata Sandi salah.');
    } finally {
      setIsLoading(false);
    }
  };

  const gantiSandi = async () => {
    const resetNip = (document.getElementById('reset-nip') as HTMLInputElement)?.value;
    const pass = (document.getElementById('reset-password') as HTMLInputElement)?.value;
    
    if(!resetNip || !pass) {
        alert('NIP dan Sandi baru harus diisi!');
        return;
    }
    
    const { error } = await supabase.from('pegawai').update({ password: pass.trim() }).eq('nip', resetNip.trim());
    if (error) {
        alert('Gagal mengganti sandi, pastikan NIP terdaftar.');
    } else {
        alert('Kata Sandi berhasil diganti. Silakan login kembali dengan sandi baru.');
        // close modal via bootstrap if available or just reload
        window.location.reload();
    }
  };

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      <style dangerouslySetInnerHTML={{__html: `
        body, html {
            height: 100%;
            margin: 0;
            font-family: 'Inter', sans-serif;
            background-color: #f4f7f6;
            background-image: url('https://www.transparenttextures.com/patterns/cubes.png');
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-card {
            background: #ffffff;
            border-radius: 16px;
            padding: 3rem 2.5rem;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
            color: #334155;
            position: relative;
            z-index: 10;
            border-top: 5px solid #0284c7;
        }
        .login-card h3 {
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: #0f172a;
            letter-spacing: -0.5px;
        }
        .login-card p {
            color: #64748b;
            font-size: 0.95rem;
            margin-bottom: 2rem;
        }
        .form-control {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            color: #1e293b !important;
            border-radius: 10px;
            height: calc(3.5rem + 2px);
            transition: all 0.3s ease;
        }
        .form-control:focus {
            background: #ffffff;
            border-color: #0ea5e9;
            box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15);
        }
        .btn-login {
            background-color: #0284c7;
            border: none;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            font-size: 1.05rem;
            padding: 0.8rem;
            width: 100%;
            margin-top: 1rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(2, 132, 199, 0.2);
        }
        .btn-login:hover {
            background-color: #0369a1;
            transform: translateY(-1px);
            box-shadow: 0 6px 12px rgba(2, 132, 199, 0.3);
            color: white;
        }
        .logo-circle {
            width: 75px;
            height: 75px;
            background-color: #f0f9ff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.2rem;
            color: #0284c7;
            margin: 0 auto 1.5rem auto;
            border: 1px solid #e0f2fe;
        }
      `}} />

      <div className="login-card text-center" style={{ margin: 'auto' }}>
        <div className="logo-circle">
            <i className="bi bi-shield-check"></i>
        </div>
        <h3>Selamat Datang</h3>
        <p>Portal Layanan Kepegawaian (BKD)</p>
        
        <form onSubmit={handleAuth}>
            <div className="mb-3 text-start">
                <label className="form-label fw-semibold text-secondary small">NIP / ID Pegawai</label>
                <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><i className="bi bi-person text-muted"></i></span>
                    <input type="text" className="form-control border-start-0 ps-0" placeholder="Masukkan NIP (Contoh: 199001012020121001)" required value={nip} onChange={e => setNip(e.target.value)} />
                </div>
            </div>

            <div className="mb-4 text-start">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-semibold text-secondary small mb-0">Kata Sandi</label>
                    <a href="#" className="small text-decoration-none fw-semibold" data-bs-toggle="modal" data-bs-target="#gantiSandiModal">Lupa / Ganti Sandi?</a>
                </div>
                <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock text-muted"></i></span>
                    <input type="password" className="form-control border-start-0 ps-0" placeholder="Masukkan kata sandi" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-login w-100 py-2 fw-bold mb-3 shadow-sm d-flex align-items-center justify-content-center">
                {isLoading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Memverifikasi...</>
                ) : (
                  <>M A S U K <i className="bi bi-arrow-right ms-2"></i></>
                )}
            </button>
        </form>
        <div className="mt-4 pt-3 border-top text-muted" style={{fontSize: '0.8rem'}}>
            &copy; 2026 Badan Kepegawaian Daerah
        </div>
      </div>

      {/* Modal Ganti Sandi */}
      <div className="modal fade" id="gantiSandiModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-light border-bottom-0">
              <h5 className="modal-title fw-bold text-dark"><i className="bi bi-shield-lock text-primary me-2"></i>Ganti Kata Sandi</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body p-4 text-start">
              <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">NIP / ID Pegawai</label>
                  <input type="text" id="reset-nip" className="form-control bg-light" placeholder="Masukkan NIP Anda" />
              </div>
              <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Kata Sandi Baru</label>
                  <input type="password" id="reset-password" className="form-control bg-light" placeholder="Masukkan sandi baru" />
              </div>
            </div>
            <div className="modal-footer border-top-0 pt-0">
              <button type="button" className="btn btn-light px-4" data-bs-dismiss="modal">Batal</button>
              <button type="button" className="btn btn-primary px-4 fw-bold" onClick={gantiSandi}><i className="bi bi-check-circle me-1"></i> Simpan Sandi</button>
            </div>
          </div>
        </div>
      </div>

      {/* Script untuk Bootstrap modal */}
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" async></script>
    </>
  );
}
