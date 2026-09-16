'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Mail, BadgeCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulasi Pendaftaran
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
            Daftar Akun Pegawai
          </h1>
          <p className="text-foreground/70">Bergabunglah dengan Sistem BKD</p>
        </div>

        <div className="glass-panel p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 opacity-80">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-foreground/40" />
                </div>
                <input type="text" required className="block w-full pl-10 pr-3 py-3 border border-foreground/10 rounded-xl bg-background/50 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="Masukkan nama Anda" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 opacity-80">NIP</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BadgeCheck className="h-5 w-5 text-foreground/40" />
                </div>
                <input type="text" required className="block w-full pl-10 pr-3 py-3 border border-foreground/10 rounded-xl bg-background/50 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="Nomor Induk Pegawai" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 opacity-80">Kata Sandi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-foreground/40" />
                </div>
                <input type="password" required className="block w-full pl-10 pr-3 py-3 border border-foreground/10 rounded-xl bg-background/50 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="Minimal 6 karakter" />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 flex justify-center items-center bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-all hover-scale active-press mt-2">
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Daftar Sekarang'}
            </button>
            
            <p className="text-center text-sm text-foreground/70 pt-2">
              Sudah punya akun? <a href="/login" className="text-primary hover:underline font-medium">Masuk di sini</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
