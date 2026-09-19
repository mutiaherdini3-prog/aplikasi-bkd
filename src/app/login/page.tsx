'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', nip, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'NIP atau Password salah');
      }

      const data = result.data;
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
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', nip: resetNip, password: pass }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal mengganti sandi');
      }

      alert('Kata Sandi berhasil diganti. Silakan login kembali dengan sandi baru.');
      window.location.reload();
    } catch (error: any) {
      alert('Gagal mengganti sandi, pastikan NIP terdaftar. Error: ' + error.message);
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
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: #ffffff;
        }
        .split-layout {
            display: flex;
            min-height: 100vh;
            width: 100%;
        }
        
        /* Kiri: Area Login */
        .login-side {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center; /* Kembali ke tengah secara vertikal */
            padding: 2rem 3rem;
            max-width: 500px; /* Ukuran normal form login */
            background-color: #ffffff;
            position: relative;
            z-index: 10;
            overflow-y: auto;
        }
        .login-header {
            margin-bottom: 2.5rem;
        }
        .login-header img {
            height: 50px;
            margin-bottom: 1.5rem;
        }
        .login-header h2 {
            font-weight: 800;
            color: #0f172a;
            font-size: 2rem;
            letter-spacing: -0.05em;
            margin-bottom: 0.5rem;
        }
        .login-header p {
            color: #64748b;
            font-size: 1rem;
            line-height: 1.6;
        }
        .form-control {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 0.8rem 1rem;
            font-size: 1rem;
            transition: all 0.2s;
        }
        .form-control:focus {
            background: #ffffff;
            border-color: #3b82f6;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .input-group-text {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            color: #94a3b8;
        }
        .btn-login {
            background: linear-gradient(135deg, #1e4b85 0%, #153866 100%);
            border: none;
            border-radius: 12px;
            color: white;
            font-weight: 700;
            padding: 1rem;
            width: 100%;
            margin-top: 1.5rem;
            font-size: 1.1rem;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
            box-shadow: 0 10px 20px -10px rgba(30, 75, 133, 0.5);
        }
        .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 25px -10px rgba(30, 75, 133, 0.6);
            background: linear-gradient(135deg, #153866 0%, #0d2547 100%);
            color: white;
        }

        /* Kanan: Area Hero Image */
        .hero-side {
            flex: 1.2;
            background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
            position: relative;
            overflow: hidden;
            color: white;
        }
        /* Pola dekoratif */
        .hero-pattern {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: url('data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.05" fill-rule="evenodd"%3E%3Ccircle cx="3" cy="3" r="3"/%3E%3Cg%3E%3C/svg%3E');
            z-index: 1;
        }

        /* AREA KIRI: Teks dan Logo */
        .hero-content {
            position: absolute;
            top: 3rem;
            bottom: 85px; /* Sejajar dengan batas ruang foto di kanan */
            left: 4rem; /* Sejajar lurus dengan margin kiri dari pita logo */
            width: 38%; 
            z-index: 3;
            display: flex;
            flex-direction: column;
            justify-content: center; /* Teks diturunkan tepat ke tengah layar */
        }
        .hero-text {
            /* Teks menempel di atas otomatis */
        }
        .hero-badge {
            background: rgba(251, 191, 36, 0.2);
            color: #fcd34d;
            padding: 0.4rem 1rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(251, 191, 36, 0.3);
        }
        .hero-text h1 {
            font-weight: 800;
            font-size: 2.4rem; /* Dibesarkan sesuai instruksi */
            line-height: 1.25;
            margin-bottom: 1rem;
            text-shadow: 0 2px 8px rgba(0,0,0,0.4);
            background: linear-gradient(to right, #ffffff, #e2e8f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .hero-text h1 span {
            color: #fcd34d;
            -webkit-text-fill-color: #fcd34d;
        }
        .hero-text p {
            font-size: 1.05rem; /* Dibesarkan sedikit */
            opacity: 0.95;
            line-height: 1.6;
            color: #e2e8f0;
            margin-bottom: 0; 
        }

        /* AREA KANAN: Foto Bupati (Menempati 60% kanan, duduk di atas pita putih) */
        .hero-image-container {
            position: absolute;
            right: 0;
            bottom: 85px; /* Duduk tepat di atas pita logo yang tingginya 85px */
            width: 60%; 
            height: calc(100% - 85px); /* Tinggi menyesuaikan */
            z-index: 2;
        }
        .hero-image-container > img {
            position: absolute;
            bottom: 2.5rem; /* FOTO DINAIKKAN LEBIH TINGGI LAGI */
            right: 0;
            width: 100%;
            height: calc(100% - 2.5rem); /* Tinggi disesuaikan agar proporsional */
            object-fit: contain;
            object-position: bottom right; /* Rata kanan bawah */
            filter: drop-shadow(-10px 10px 20px rgba(0,0,0,0.3));
        }

        /* PITA LOGO (BAND) MELINTANG SEPANJANG BAWAH LAYAR */
        .hero-logos-band {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 85px;
            background: transparent; /* Menyatu dengan warna biru layar utama */
            display: flex;
            justify-content: space-between; /* DI UJUNG, DI TENGAH, DI UJUNG */
            align-items: center;
            padding: 0 4rem; /* Jarak aman dari pinggir layar */
            z-index: 10;
        }
        .hero-logos-band img {
            height: 45px; /* Logo jadi besar dan sangat jelas */
            object-fit: contain;
        }

        /* Responsiveness: Tampilan Handphone & Tablet */
        @media (max-width: 1199px) {
            .login-container {
                flex-direction: column; /* Ditumpuk atas-bawah */
                height: auto;
                min-height: 100vh;
            }
            .hero-side { 
                display: flex; 
                flex-direction: column;
                min-height: 100vh; /* Layar pertama penuh dengan Hero */
                padding: 0;
            }
            .hero-content {
                position: relative; /* Buang posisi absolut */
                top: 0; left: 0; bottom: 0;
                width: 100%;
                padding: 3rem 2rem 1rem 2rem;
                text-align: center;
                align-items: center;
            }
            .hero-text h1 {
                font-size: 2rem;
            }
            .hero-image-container {
                position: relative;
                width: 100%;
                flex: 1; /* Mengisi sisa ruang vertikal */
                min-height: 350px; /* Minimal tinggi foto */
                bottom: 0;
            }
            .hero-image-container > img {
                object-position: bottom center; /* Posisikan bupati di tengah layar HP */
            }
            .hero-logos-band {
                position: relative;
                height: auto;
                padding: 1.5rem 1rem;
                flex-wrap: wrap; /* Izinkan logo turun baris jika HP sempit */
                justify-content: center;
                gap: 1.5rem;
            }
            .hero-logos-band img {
                height: 35px;
            }
            .login-side {
                width: 100%;
                padding: 4rem 2rem;
                border-radius: 0; /* Buang lengkungan samping */
            }
        }
        @media (max-width: 991px) {
            .split-layout {
                flex-direction: column;
            }
            .hero-side {
                order: -1;
                flex-direction: column;
                min-height: 450px;
                padding: 0 2rem;
            }
            .hero-content {
                max-width: 100%;
                padding: 2rem 0;
            }
            .hero-image-container {
                width: 100%;
                justify-content: center;
                opacity: 0.95;
            }
            .hero-image-container img {
                object-position: bottom center;
            }
            .login-side {
                max-width: 100%;
                padding: 2rem;
            }
        }
      `}} />

      <div className="split-layout">
        
        {/* Sisi Kiri: Form Login */}
        <div className="login-side">
            <div className="login-header text-center text-lg-start">
                <img src="/logo.png" alt="Logo Bangka Barat" style={{height: '65px', width: 'auto', objectFit: 'contain', marginBottom: '1.2rem'}} />
                <h2>Sistem Sertifikasi & JP</h2>
                <p>Pengelolaan Sertifikat & Pemenuhan Jam Pelajaran<br/><b>Pemerintah Kabupaten Bangka Barat</b></p>
            </div>
            
            <form onSubmit={handleAuth}>
                <div className="mb-4">
                    <label className="form-label fw-bold text-secondary small text-uppercase tracking-wide">NIP / ID Pegawai</label>
                    <div className="input-group">
                        <span className="input-group-text border-end-0 bg-transparent"><i className="bi bi-person text-muted"></i></span>
                        <input type="text" className="form-control border-start-0 ps-0 bg-transparent" placeholder="Masukkan NIP Anda" required value={nip} onChange={e => setNip(e.target.value)} />
                    </div>
                </div>

                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label fw-bold text-secondary small text-uppercase tracking-wide mb-0">Kata Sandi</label>
                        <a href="#" className="small text-decoration-none fw-semibold" style={{color: '#1e4b85'}} data-bs-toggle="modal" data-bs-target="#gantiSandiModal">Lupa Sandi?</a>
                    </div>
                    <div className="input-group">
                        <span className="input-group-text border-end-0 bg-transparent"><i className="bi bi-lock text-muted"></i></span>
                        <input type="password" className="form-control border-start-0 ps-0 bg-transparent" placeholder="Masukkan kata sandi" required value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                </div>

                <button type="submit" disabled={isLoading} className="btn-login d-flex align-items-center justify-content-center">
                    {isLoading ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Memverifikasi...</>
                    ) : (
                      <>MASUK SEKARANG <i className="bi bi-box-arrow-in-right ms-2 fs-5"></i></>
                    )}
                </button>
            </form>
            
            <div className="mt-4 text-center text-muted small fw-medium">
                &copy; {new Date().getFullYear()} Badan Kepegawaian Daerah Bangka Barat
            </div>
        </div>

        {/* Sisi Kanan: Hero Image (Bupati & Wakil Bupati) */}
        <div className="hero-side">
            <div className="hero-pattern"></div>
            
            <div className="hero-content">
                <div className="hero-text">
                    <h1>Sistem Informasi<br/><span>Pengembangan</span> Kompetensi</h1>
                    <p>Wadah digital terpadu untuk pencatatan, pemantauan, <br/>dan evaluasi pemenuhan <br/>kewajiban Jam Pelajaran (JP) <br/>bagi seluruh ASN.</p>
                </div>
            </div>

            <div className="hero-image-container">
                <img src="https://sidilancuti.bangkabaratkab.go.id/assets/arsha/assets/img/bupati_wakil2025.png" alt="Bupati dan Wakil Bupati Bangka Barat" />
            </div>

            {/* PITA LOGO FULL WIDTH DI BAWAH */}
            <div className="hero-logos-band">
                <img src="https://sidilancuti.bangkabaratkab.go.id/assets/arsha/assets/img/clients/berakhlak-1.png" alt="BerAKHLAK" style={{ objectPosition: 'left' }} />
                <img src="https://sidilancuti.bangkabaratkab.go.id/assets/arsha/assets/img/clients/Betason.png" alt="Betason" style={{ objectPosition: 'center' }} />
                <img src="https://sidilancuti.bangkabaratkab.go.id/assets/arsha/assets/img/clients/employer.png" alt="Employer" style={{ objectPosition: 'right' }} />
            </div>
        </div>
        
      </div>

      {/* Modal Ganti Sandi */}
      <div className="modal fade" id="gantiSandiModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{borderRadius: '16px'}}>
            <div className="modal-header bg-light border-bottom-0" style={{borderRadius: '16px 16px 0 0'}}>
              <h5 className="modal-title fw-bold text-dark"><i className="bi bi-shield-lock text-primary me-2"></i>Ganti Kata Sandi</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body p-4 text-start">
              <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">NIP / ID Pegawai</label>
                  <input type="text" id="reset-nip" className="form-control" style={{background: '#f8fafc'}} placeholder="Masukkan NIP Anda" />
              </div>
              <div className="mb-4">
                  <label className="form-label small fw-bold text-secondary">Kata Sandi Baru</label>
                  <input type="password" id="reset-password" className="form-control" style={{background: '#f8fafc'}} placeholder="Masukkan sandi baru" />
              </div>
              <button type="button" className="btn-login mt-0" onClick={gantiSandi} style={{padding: '0.8rem'}}><i className="bi bi-check-circle me-1"></i> Simpan Sandi</button>
            </div>
          </div>
        </div>
      </div>

      {/* Script untuk Bootstrap modal */}
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" async></script>
    </>
  );
}
