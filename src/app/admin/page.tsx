'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

import { UNIT_KERJA_OPTIONS, getUnitKerjaWords, wordMatchScore } from '@/lib/unit-kerja-match';

const PARSED_UNIT_KERJA_OPTIONS = UNIT_KERJA_OPTIONS.map(opt => ({
  opt,
  words: getUnitKerjaWords(opt)
}));


export default function AdminPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('userRole') || '';
    return '';
  });
  const [loggedInNip, setLoggedInNip] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('loggedInUser') || '';
    return '';
  });
  const [loggedInNama, setLoggedInNama] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('userName') || '';
    return '';
  });
  const [activeTab, setActiveTab] = useState<'view-dashboard' | 'view-pegawai' | 'view-sertifikasi' | 'view-idp' | 'view-tren' | 'view-profil-web'>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('admin_active_tab');
      const role = localStorage.getItem('userRole');
      if (savedTab) {
        if (role !== 'super_admin' && (savedTab === 'view-dashboard' || savedTab === 'view-tren' || savedTab === 'view-profil-web')) {
          return 'view-pegawai';
        }
        return savedTab as any;
      }
      return role === 'super_admin' ? 'view-dashboard' : 'view-pegawai';
    }
    return 'view-dashboard';
  });
  const [pegawaiList, setPegawaiList] = useState<any[]>([]);
  const [selectedPegawai, setSelectedPegawai] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPegawaiModal, setShowPegawaiModal] = useState(false);
  const [pegawaiForm, setPegawaiForm] = useState<any>({});
  const [showIdpModal, setShowIdpModal] = useState(false);
  const [idpForm, setIdpForm] = useState<any>({});
  const [semuaPegawai, setSemuaPegawai] = useState<any[]>([]);

  const changeTab = (tab: any) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_active_tab', tab);
    }
  };
  const [searchPegawai, setSearchPegawai] = useState('');
  const [searchSertifikasi, setSearchSertifikasi] = useState('');
  const [exportJenisKursusFilter, setExportJenisKursusFilter] = useState('all');
  const [searchIdp, setSearchIdp] = useState('');

  // State untuk Import Template Sertifikasi Massal (contoh: Rabu Bertamu)
  const [showImportSertifikasiModal, setShowImportSertifikasiModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const [importSearchPreview, setImportSearchPreview] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  // State Modal Penolakan IDP
  const [idpRejectData, setIdpRejectData] = useState<{
    rowIndex: number;
    status: string;
    namaPegawai: string;
    kompetensi: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Tidak tersedia anggaran');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmittingReject, setIsSubmittingReject] = useState<boolean>(false);

  // State untuk Konfirmasi Hapus
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'lulus' | 'belum'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PNS' | 'PPPK' | 'PW'>('all');
  const [tahunFilter, setTahunFilter] = useState<string>('all');
  const [rawPegawaiList, setRawPegawaiList] = useState<any[]>([]);
  const [currentPagePegawai, setCurrentPagePegawai] = useState(1);
  const [currentPageSert, setCurrentPageSert] = useState(1);
  const [currentPageIdp, setCurrentPageIdp] = useState(1);
  const [currentPageTren, setCurrentPageTren] = useState(1);
  const [searchTren, setSearchTren] = useState('');
  const [filterTrenStatus, setFilterTrenStatus] = useState<'all' | 'naik' | 'turun' | 'fluktuatif' | 'stabil'>('all');
  const [selectedOpdChart, setSelectedOpdChart] = useState<string>('all');
  const [openOPD, setOpenOPD] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;
  const ITEMS_PER_PAGE_TREN = 5;
  const ITEMS_PER_PAGE_PEGAWAI = 5;
  const [pagePegawaiPerOPD, setPagePegawaiPerOPD] = useState<Record<string, number>>({});
  const [expandedTrenOpd, setExpandedTrenOpd] = useState<string | null>(null);
  const [pageTrenPegawai, setPageTrenPegawai] = useState<number>(1);
  const [trenViewMode, setTrenViewMode] = useState<'pegawai' | 'opd'>('pegawai');
  const [currentPageTrenPegawai, setCurrentPageTrenPegawai] = useState<number>(1);
  const [filterTrenOpd, setFilterTrenOpd] = useState<string>('all');

  // State Profil Pimpinan Web
  const [profilWebData, setProfilWebData] = useState({
    bupati_nama: 'MARKUS, S.H.',
    bupati_jabatan: 'BUPATI BANGKA BARAT',
    bupati_foto: '/img/bupati1.png',
    wakil_nama: 'H. YUS DERAHMAN',
    wakil_jabatan: 'WAKIL BUPATI BANGKA BARAT',
    wakil_foto: '/img/bupati2.png',
    hero_judul: 'Sistem Informasi Pengembangan Kompetensi',
    hero_subjudul: 'Wadah digital terpadu untuk pencatatan, pemantauan, \ndan evaluasi pemenuhan \nkewajiban Jam Pelajaran (JP) \nbagi seluruh ASN.',
  });
  const [loadingProfilWeb, setLoadingProfilWeb] = useState(false);
  const [savingProfilWeb, setSavingProfilWeb] = useState(false);
  const [uploadingBupatiFoto, setUploadingBupatiFoto] = useState(false);
  const [uploadingWakilFoto, setUploadingWakilFoto] = useState(false);
  const [profilWebSuccessMsg, setProfilWebSuccessMsg] = useState('');
  const [profilWebErrorMsg, setProfilWebErrorMsg] = useState('');

  const fetchProfilWeb = async () => {
    setLoadingProfilWeb(true);
    setProfilWebErrorMsg('');
    try {
      const res = await fetch(`/api/profil-web?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setProfilWebData(json.data);
      }
    } catch (e: any) {
      console.error('Error fetch profil web:', e);
    } finally {
      setLoadingProfilWeb(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 450;
          const MAX_HEIGHT = 600;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          const isPng = file.type === 'image/png';
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleUploadProfilFoto = async (file: File, target: 'bupati' | 'wakil') => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB');
      return;
    }

    if (target === 'bupati') setUploadingBupatiFoto(true);
    else setUploadingWakilFoto(true);

    try {
      // Kompresi otomatis di browser menjadi resolusi proporsional dan ukuran sangat ringan (<35KB)
      const compressedDataUrl = await compressImage(file);
      const dataUrl = compressedDataUrl || (await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.readAsDataURL(file);
      }));

      const updated = {
        ...profilWebData,
        [target === 'bupati' ? 'bupati_foto' : 'wakil_foto']: dataUrl
      };
      setProfilWebData(updated);

      // Simpan langsung ke database Google Sheets
      const res = await fetch('/api/profil-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const json = await res.json();
      if (json.success) {
        setProfilWebSuccessMsg('Foto baru berhasil diunggah dan disimpan ke database Google Sheets!');
        setTimeout(() => setProfilWebSuccessMsg(''), 6000);
      } else {
        alert('Gagal menyimpan foto ke database: ' + (json.error || 'Terjadi kesalahan'));
      }
    } catch (err: any) {
      alert('Terjadi kesalahan saat mengunggah foto: ' + err.message);
    } finally {
      if (target === 'bupati') setUploadingBupatiFoto(false);
      else setUploadingWakilFoto(false);
    }
  };

  const handleSaveProfilWeb = async (customPayload?: any) => {
    setSavingProfilWeb(true);
    setProfilWebSuccessMsg('');
    setProfilWebErrorMsg('');

    // Pastikan payload berupa data murni, bukan React SyntheticEvent
    const isValidCustomData = customPayload && typeof customPayload === 'object' && !customPayload.nativeEvent && !customPayload.target && 'bupati_nama' in customPayload;
    const source = isValidCustomData ? customPayload : profilWebData;

    const cleanPayload = {
      bupati_nama: source.bupati_nama || '',
      bupati_jabatan: source.bupati_jabatan || '',
      bupati_foto: source.bupati_foto || '',
      wakil_nama: source.wakil_nama || '',
      wakil_jabatan: source.wakil_jabatan || '',
      wakil_foto: source.wakil_foto || '',
      hero_judul: source.hero_judul || '',
      hero_subjudul: source.hero_subjudul || '',
    };

    try {
      const res = await fetch('/api/profil-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload),
      });
      const json = await res.json();
      if (json.success) {
        setProfilWebSuccessMsg('Profil Pimpinan Web berhasil disimpan ke database Google Sheets!');
        setTimeout(() => setProfilWebSuccessMsg(''), 6000);
      } else {
        setProfilWebErrorMsg(json.error || 'Gagal menyimpan profil');
      }
    } catch (err: any) {
      setProfilWebErrorMsg('Gagal menyimpan profil: ' + err.message);
    } finally {
      setSavingProfilWeb(false);
    }
  };

  const handleResetProfilWeb = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan profil pimpinan ke data default (MARKUS, S.H. & H. YUS DERAHMAN)?')) {
      setProfilWebData({
        bupati_nama: 'MARKUS, S.H.',
        bupati_jabatan: 'BUPATI BANGKA BARAT',
        bupati_foto: '/img/bupati1.png',
        wakil_nama: 'H. YUS DERAHMAN',
        wakil_jabatan: 'WAKIL BUPATI BANGKA BARAT',
        wakil_foto: '/img/bupati2.png',
        hero_judul: 'Sistem Informasi Pengembangan Kompetensi',
        hero_subjudul: 'Wadah digital terpadu untuk pencatatan, pemantauan, \ndan evaluasi pemenuhan \nkewajiban Jam Pelajaran (JP) \nbagi seluruh ASN.',
      });
    }
  };

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPagePegawai(1);
    setCurrentPageSert(1);
    setCurrentPageIdp(1);
    setCurrentPageTren(1);
    setCurrentPageTrenPegawai(1);
  }, [filterMode, statusFilter, tahunFilter, searchPegawai, searchSertifikasi, searchIdp, searchTren, filterTrenStatus, filterTrenOpd, trenViewMode]);

  // Pagination UI Component
  const PaginationControls = ({ currentPage, setCurrentPage, totalItems, itemsPerPage = ITEMS_PER_PAGE }: { currentPage: number, setCurrentPage: (p: number) => void, totalItems: number, itemsPerPage?: number }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;
    return (
      <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
        <button className="btn btn-outline-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
        <span className="small text-muted fw-semibold">Halaman {currentPage} dari {totalPages} ({totalItems} total)</span>
        <button className="btn btn-outline-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
      </div>
    );
  };


  const fetchData = async () => {
    try {
      const userNip = localStorage.getItem('loggedInUser') || '';
      const [resData, resAll] = await Promise.all([
        fetch(`/api/admin/data?nip=${userNip}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        fetch(`/api/pegawai/all?all=true`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      ]);
      
      const json = await resData.json();
      if (json.success && json.data) {
        setRawPegawaiList(json.data);
      }
      
      const jsonAll = await resAll.json();
      if (jsonAll.success) {
        setSemuaPegawai(jsonAll.data);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('userRole') || '';
    const nip = localStorage.getItem('loggedInUser') || '';
    const nama = localStorage.getItem('userName') || '';
    if (role !== 'admin' && role !== 'super_admin' && role !== 'admin_diklat') {
      router.push('/login');
      return;
    }
    setUserRole(role);
    setLoggedInNip(nip);
    setLoggedInNama(nama);

    // Pulihkan tab aktif yang tersimpan agar saat F5/refresh tidak pernah terlempar ke tab data pegawai lain
    const savedTab = localStorage.getItem('admin_active_tab');
    if (savedTab) {
      if (role !== 'super_admin' && (savedTab === 'view-dashboard' || savedTab === 'view-tren' || savedTab === 'view-profil-web')) {
        changeTab('view-pegawai');
      } else {
        setActiveTab(savedTab as any);
      }
    } else {
      if (role !== 'super_admin') {
        changeTab('view-pegawai');
      }
    }

    fetchData();
    if (role === 'super_admin') {
      fetchProfilWeb();
    }
  }, [router]);

  useEffect(() => {
    const computed = rawPegawaiList.map(p => {
      const filteredSertifikasi = tahunFilter === 'all' 
        ? p.sertifikasi 
        : p.sertifikasi?.filter((s: any) => s.tahun === tahunFilter);
      const jp = filteredSertifikasi?.reduce((acc: number, curr: any) => acc + (curr.jumlah_jp || 0), 0) || 0;
      return { ...p, jp, filteredSertifikasi };
    });
    
    // Sort by JP terbanyak
    computed.sort((a, b) => b.jp - a.jp);
    
    setPegawaiList(computed);
  }, [rawPegawaiList, tahunFilter]);

  const hapusPegawai = async (nip: string, namaPegawai?: string) => {
    setDeleteConfirmData({
      title: 'Hapus Data Pegawai',
      message: `Apakah Anda yakin ingin menghapus pegawai${namaPegawai ? ` "${namaPegawai}"` : ''} (NIP: ${nip}) beserta seluruh datanya? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          const res = await fetch(`/api/pegawai?nip=${nip}`, { method: 'DELETE' });
          if (res.ok) {
            fetchData();
            setShowDeleteConfirm(false);
            setDeleteConfirmData(null);
          } else {
            alert('Gagal menghapus pegawai');
          }
        } catch (err) {
          alert('Terjadi kesalahan saat menghapus');
        } finally {
          setIsDeleting(false);
        }
      }
    });
    setShowDeleteConfirm(true);
  };

  const getGolonganOptions = () => {
    if (pegawaiForm.status_pegawai === 'PNS') {
      return [
        "I/a - Juru Muda", "I/b - Juru Muda Tk. I", "I/c - Juru", "I/d - Juru Tk. I", 
        "II/a - Pengatur Muda", "II/b - Pengatur Muda Tk. I", "II/c - Pengatur", "II/d - Pengatur Tk. I", 
        "III/a - Penata Muda", "III/b - Penata Muda Tk. I", "III/c - Penata", "III/d - Penata Tk. I", 
        "IV/a - Pembina", "IV/b - Pembina Tk. I", "IV/c - Pembina Utama Muda", "IV/d - Pembina Utama Madya", "IV/e - Pembina Utama"
      ];
    } else if (pegawaiForm.status_pegawai === 'PPPK') {
      return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII"].map(g => `Golongan ${g}`);
    }
    return [];
  };

  const handleSavePegawai = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = { ...pegawaiForm };
      
      let valGolongan = '-';
      let valPangkat = '-';
      if (dataToSave.golonganPangkat && dataToSave.status_pegawai === 'PNS') {
        const parts = dataToSave.golonganPangkat.split(' - ');
        valGolongan = parts[0] || '-';
        valPangkat = parts[1] || '-';
      } else if (dataToSave.golonganPangkat && dataToSave.status_pegawai === 'PPPK') {
        valGolongan = dataToSave.golonganPangkat;
        valPangkat = 'Tidak Ada';
      } else if (dataToSave.status_pegawai === 'PW') {
        valGolongan = '-';
        valPangkat = '-';
      }
      dataToSave.golongan = valGolongan;
      dataToSave.pangkat = valPangkat;

      const method = pegawaiForm.isEdit ? 'PUT' : 'POST';
      const res = await fetch('/api/pegawai', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
        setShowPegawaiModal(false);
      } else {
        alert('Gagal menyimpan data pegawai: ' + (json.message || json.error));
      }
    } catch(e) {
      alert('Terjadi kesalahan');
    }
  };

  const toggleAdminRole = async (pegawai: any) => {
    try {
      const newRole = pegawai.role === 'admin' ? 'pegawai' : 'admin';
      const res = await fetch('/api/pegawai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip: pegawai.nip, role: newRole })
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        alert('Gagal mengupdate akses');
      }
    } catch(e) {
      alert('Terjadi kesalahan');
    }
  };

  const handleSaveIdp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (idpForm.isEdit) {
        // Edit IDP
        const res = await fetch(`/api/idp?rowIndex=${idpForm._rowIndex}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(idpForm)
        });
        const json = await res.json();
        if (json.success) {
          fetchData();
          setShowIdpModal(false);
        } else alert('Gagal mengedit IDP: ' + (json.message || json.error));
      } else {
        // Tambah IDP
        const res = await fetch(`/api/idp?nip=${idpForm.nip}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([idpForm]) // POST expects array
        });
        const json = await res.json();
        if (json.success) {
          fetchData();
          setShowIdpModal(false);
        } else alert('Gagal menambah IDP: ' + (json.message || json.error));
      }
    } catch(e) {
      alert('Terjadi kesalahan');
    }
  };

  const hapusIdp = async (rowIndex: number, namaKompetensi?: string) => {
    setDeleteConfirmData({
      title: 'Hapus Pengajuan IDP',
      message: `Apakah Anda yakin ingin menghapus pengajuan IDP${namaKompetensi ? ` "${namaKompetensi}"` : ''} ini? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          const res = await fetch(`/api/idp?rowIndex=${rowIndex}`, { method: 'DELETE' });
          if (res.ok) {
            fetchData();
            setShowDeleteConfirm(false);
            setDeleteConfirmData(null);
          } else {
            alert('Gagal menghapus IDP');
          }
        } catch (err) {
          alert('Terjadi kesalahan saat menghapus');
        } finally {
          setIsDeleting(false);
        }
      }
    });
    setShowDeleteConfirm(true);
  };

  const handleConfirmRejectIdp = async () => {
    if (!idpRejectData) return;
    const finalAlasan = rejectReason === 'Lainnya' ? (customReason.trim() || 'Tidak tersedia anggaran') : rejectReason;
    const targetRowIndex = idpRejectData.rowIndex;
    const targetStatus = idpRejectData.status;

    // 1. Optimistic Update lokal (0 ms respon instan di UI!)
    setRawPegawaiList(prev => prev.map(p => ({
      ...p,
      idp: p.idp?.map((item: any) => {
        if (item._rowIndex === targetRowIndex) {
          return { ...item, status: targetStatus, alasan_tolak: finalAlasan };
        }
        return item;
      })
    })));
    setIdpRejectData(null);

    // 2. Background sync ke server
    try {
      const res = await fetch(`/api/idp?rowIndex=${targetRowIndex}&status=${encodeURIComponent(targetStatus)}&alasan=${encodeURIComponent(finalAlasan)}`, { method: 'PUT' });
      if (!res.ok) {
        alert('Gagal menyimpan ke server, memulihkan data...');
        fetchData();
      }
    } catch (err) {
      alert('Terjadi kesalahan saat memproses penolakan IDP');
      fetchData();
    }
  };

  const updateIdpStatus = async (rowIndex: number, newStatus: string, confirmMsg?: string) => {
    let alasan = '';
    if (newStatus.startsWith('Ditolak')) {
      const defaultAlasan = 'Tidak tersedia anggaran';
      const input = prompt(`Silakan masukkan alasan penolakan (${newStatus}):`, defaultAlasan);
      if (input === null) return; // Dibatalkan oleh admin
      alasan = input.trim() || defaultAlasan;
    } else {
      const defaultMsg = newStatus === 'Disetujui' 
        ? 'Yakin ingin memberikan Persetujuan FINAL (BKPSDMD) untuk pengajuan IDP ini?' 
        : 'Yakin ingin menyetujui usulan IDP ini dan meneruskannya ke verifikasi BKPSDMD?';
      if (!confirm(confirmMsg || defaultMsg)) return;
    }

    // 1. Optimistic Update lokal (0 ms respon instan di UI!)
    setRawPegawaiList(prev => prev.map(p => ({
      ...p,
      idp: p.idp?.map((item: any) => {
        if (item._rowIndex === rowIndex) {
          return { ...item, status: newStatus, alasan_tolak: alasan };
        }
        return item;
      })
    })));

    // 2. Background sync ke server
    try {
      const res = await fetch(`/api/idp?rowIndex=${rowIndex}&status=${encodeURIComponent(newStatus)}&alasan=${encodeURIComponent(alasan)}`, { method: 'PUT' });
      if (!res.ok) {
        alert('Gagal menyimpan ke server, memulihkan data...');
        fetchData();
      }
    } catch (err) {
      alert('Terjadi kesalahan saat memperbarui status');
      fetchData();
    }
  };

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear().toString();
    const yearsFromData = rawPegawaiList.flatMap(p => p.sertifikasi?.map((s: any) => String(s.tahun)).filter(Boolean) || []);
    const unique = Array.from(new Set([...yearsFromData, currentYear, '2025', '2024'])).filter(y => /^\d{4}$/.test(y)).sort().reverse();
    return unique;
  }, [rawPegawaiList]);

  const availableUnitKerja = useMemo(() => Array.from(new Set(
    semuaPegawai.map(p => p.unit_kerja).filter(Boolean)
  )).sort(), [semuaPegawai]);

  const checkLulusJP = (p: any) => {
    const status = (p.status_pegawai || '').toUpperCase();
    const isP3K = status.includes('P3K') || status.includes('PPPK');
    return isP3K ? p.jp >= 24 : p.jp >= 20;
  };

  const getTargetJP = (p: any) => {
    const status = (p.status_pegawai || '').toUpperCase();
    const isP3K = status.includes('P3K') || status.includes('PPPK');
    return isP3K ? 24 : 20;
  };

  const chartData = useMemo(() => {
    return [...availableYears].reverse().map(year => {
      let lulus = 0;
      let belum = 0;
      rawPegawaiList.forEach(p => {
        const serts = p.sertifikasi?.filter((s: any) => s.tahun === year);
        const jp = serts?.reduce((acc: number, curr: any) => acc + (curr.jumlah_jp || 0), 0) || 0;
        const tempP = { ...p, jp };
        if (checkLulusJP(tempP)) lulus++;
        else belum++;
      });
      return { year, 'Memenuhi Syarat': lulus, 'Belum Memenuhi': belum };
    });
  }, [availableYears, rawPegawaiList]);

  const {
    lulus,
    belum,
    sudahPengembangan,
    pnsList,
    pppkList,
    lulusPNS,
    lulusPPPK,
    belumPNS,
    belumPPPK
  } = useMemo(() => {
    const lls = pegawaiList.filter(p => checkLulusJP(p)).length;
    const blm = pegawaiList.length - lls;
    const sdh = pegawaiList.filter(p => p.jp > 0).length;
    
    const pns = pegawaiList.filter(p => (p.status_pegawai || '').toUpperCase().includes('PNS'));
    const pppk = pegawaiList.filter(p => {
      const s = (p.status_pegawai || '').toUpperCase();
      return s.includes('P3K') || s.includes('PPPK');
    });

    return {
      lulus: lls,
      belum: blm,
      sudahPengembangan: sdh,
      pnsList: pns,
      pppkList: pppk,
      lulusPNS: pns.filter(p => checkLulusJP(p)).length,
      lulusPPPK: pppk.filter(p => checkLulusJP(p)).length,
      belumPNS: pns.length - pns.filter(p => checkLulusJP(p)).length,
      belumPPPK: pppk.length - pppk.filter(p => checkLulusJP(p)).length
    };
  }, [pegawaiList]);
  let sertifCounter = 1;
  let idpCounter = 1;

  const handleLogout = () => {
    localStorage.clear();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    window.location.href = '/login';
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
    if (activeTab === 'view-tren') return 'Analisis Tren Tahunan Pemenuhan JP per OPD';
    if (activeTab === 'view-idp') return 'Approval Individual Development Plan (IDP)';
    if (activeTab === 'view-profil-web') return 'Pengaturan Profil Pimpinan Web (Bupati & Wakil Bupati)';
    return '';
  };

  const generateExcelSheet = (pegawaiData: any[], sheetName: string, workbook: any, statusKelulusanLabel?: string, showTargetAndStatus = false) => {
    if (pegawaiData.length === 0) return;
    
    const maxCerts = Math.max(0, ...pegawaiData.map(p => {
      const certs = p.filteredSertifikasi || p.sertifikasi || [];
      return certs.length;
    }));

    const excelData = pegawaiData.map((p, index) => {
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
      };
      if (showTargetAndStatus) {
        baseRow["Target JP"] = getTargetJP(p);
        baseRow["Status Kelulusan"] = statusKelulusanLabel || (checkLulusJP(p) ? "MEMENUHI" : "BELUM MEMENUHI");
      }

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
          if (typeof linkUrl === 'string' && linkUrl.startsWith('=HYPERLINK("')) {
            const match = linkUrl.match(/=HYPERLINK\("(.*?)",/);
            if (match && match[1]) linkUrl = match[1];
          }
          if (linkUrl.startsWith('/uploads')) linkUrl = `${window.location.origin}${linkUrl}`;
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
    for (const cellAddress in worksheet) {
      if (!cellAddress.startsWith('!')) {
        const cell = worksheet[cellAddress];
        if (cell.v && typeof cell.v === 'string' && cell.v.startsWith('http')) {
          worksheet[cellAddress] = { t: 's', v: "Lihat Dokumen", l: { Target: cell.v } };
        }
      }
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  };

  const handleExport = (title: string, mode: 'all' | 'lulus' | 'belum', targetType?: 'PNS' | 'PPPK', onlyWithJP = false, showTargetAndStatus = false) => {
    if (userRole !== 'super_admin') {
      alert('Akses ditolak: Fitur ekspor data hanya dapat diakses oleh Super Admin.');
      return;
    }
    let baseList = pegawaiList;
    if (onlyWithJP) baseList = baseList.filter(p => p.jp > 0);
    if (mode === 'lulus') baseList = baseList.filter(p => checkLulusJP(p));
    if (mode === 'belum') baseList = baseList.filter(p => !checkLulusJP(p));

    const finalFiltered = baseList.filter(p => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'PW' && p.status_pegawai?.toLowerCase().includes('kontrak')) return true;
      return p.status_pegawai === statusFilter;
    }).filter(p => {
      if (exportJenisKursusFilter !== 'all') {
        const certs = p.filteredSertifikasi || p.sertifikasi || [];
        return certs.some((s: any) => (s['jenis kursus'] || s.jenis_kursus) === exportJenisKursusFilter);
      }
      return true;
    }).map(p => {
      if (exportJenisKursusFilter !== 'all') {
        const certs = p.filteredSertifikasi || p.sertifikasi || [];
        const filteredCerts = certs.filter((s: any) => (s['jenis kursus'] || s.jenis_kursus) === exportJenisKursusFilter);
        return { ...p, filteredSertifikasi: filteredCerts };
      }
      return p;
    });

    const pnsData = finalFiltered.filter(p => (p.status_pegawai || '').toUpperCase().includes('PNS'));
    const pppkData = finalFiltered.filter(p => {
      const s = (p.status_pegawai || '').toUpperCase();
      return s.includes('P3K') || s.includes('PPPK');
    });
    const pwData = finalFiltered.filter(p => {
      const s = (p.status_pegawai || '').toUpperCase();
      return !s.includes('PNS') && !s.includes('P3K') && !s.includes('PPPK');
    });

    const workbook = XLSX.utils.book_new();
    const statusLabel = mode === 'lulus' ? "MEMENUHI" : mode === 'belum' ? "BELUM MEMENUHI" : undefined;
    
    if ((!targetType || targetType === 'PNS') && pnsData.length > 0) generateExcelSheet(pnsData, "PNS", workbook, statusLabel, showTargetAndStatus);
    if ((!targetType || targetType === 'PPPK') && pppkData.length > 0) generateExcelSheet(pppkData, "PPPK", workbook, statusLabel, showTargetAndStatus);
    if (!targetType && pwData.length > 0) generateExcelSheet(pwData, "PW-Lainnya", workbook, statusLabel, showTargetAndStatus);
    
    if (workbook.SheetNames.length === 0) {
      alert('Tidak ada data untuk di-export');
      return;
    }

    XLSX.writeFile(workbook, `Laporan_Sertifikasi_${title}_${tahunFilter}.xlsx`);
  };

  const exportToExcelDataPegawai = () => handleExport("Data_Pegawai", "all", undefined, true, false);
  const exportToExcelDataPegawaiPNS = () => handleExport("Data_Pegawai_PNS", "all", "PNS", true, false);
  const exportToExcelDataPegawaiPPPK = () => handleExport("Data_Pegawai_PPPK", "all", "PPPK", true, false);

  const exportToExcelSert = () => handleExport("Rekap_Sertifikasi", "all", undefined, false, true);
  const exportToExcelSertPNS = () => handleExport("Rekap_Sertifikasi_PNS", "all", "PNS", false, true);
  const exportToExcelSertPPPK = () => handleExport("Rekap_Sertifikasi_PPPK", "all", "PPPK", false, true);

  const exportToExcelMemenuhi = () => handleExport("MemenuhiJP", "lulus", undefined, false, true);
  const exportToExcelBelumMemenuhi = () => handleExport("BelumMemenuhiJP", "belum", undefined, false, true);

  const exportIdpToExcel = () => {
    if (userRole !== 'super_admin') {
      alert('Akses ditolak: Fitur ekspor data hanya dapat diakses oleh Super Admin.');
      return;
    }
    const idpItems = pegawaiList.flatMap((p) => {
      if (!p.idp || p.idp.length === 0) return [];
      return p.idp.map((idp: any) => ({ p, idp }));
    }).filter((item: any) => {
      if (tahunFilter !== 'all') {
        if (item.idp.tahun !== tahunFilter && (!item.idp.waktu_pelaksanaan_awal || !item.idp.waktu_pelaksanaan_awal.includes(tahunFilter))) return false;
      }
      return true;
    });

    if (idpItems.length === 0) {
      alert("Tidak ada data IDP untuk diexport!");
      return;
    }

    const excelData = idpItems.map((item, index) => {
      const p = item.p;
      const idp = item.idp;
      
      const formatRupiah = (angka: any) => {
        if (!angka) return "Rp 0";
        return "Rp " + Number(angka).toLocaleString('id-ID');
      };

      let waktuStr = "";
      if (idp.waktu_pelaksanaan_awal && idp.waktu_pelaksanaan_akhir) {
        waktuStr = `${idp.waktu_pelaksanaan_awal} s.d. ${idp.waktu_pelaksanaan_akhir}`;
      } else if (idp.waktu_pelaksanaan_awal) {
        waktuStr = idp.waktu_pelaksanaan_awal;
      }

      return {
        "No": index + 1,
        "Nama Pegawai": p.nama || "",
        "NIP": p.nip || "",
        "Jabatan": p.jabatan || "",
        "Jenis kompetensi": idp.jenis_kompetensi || "",
        "Jenis pengembangan": idp.jenis_pengembangan || "",
        "Jalur pengembangan": idp.jalur_pengembangan || "",
        "Penyelenggara": idp.penyelenggara || "",
        "Waktu Pelaksanan": waktuStr,
        "JP": idp.jp || "",
        "Anggaran": formatRupiah(idp.anggaran),
        "Status": idp.status || ""
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data IDP");
    XLSX.writeFile(workbook, "Rekap_IDP_ASN.xlsx");
  };

  const exportTrenToExcel = () => {
    if (userRole !== 'super_admin') {
      alert('Akses ditolak: Fitur ekspor data hanya dapat diakses oleh Super Admin.');
      return;
    }
    if (trenViewMode === 'pegawai') {
      const excelRows = filteredPegawaiTrendList.map((p: any, idx: number) => {
        const row: any = {
          "No": idx + 1,
          "Nama Pegawai": p.nama || '-',
          "NIP": p.nip || '-',
          "Status ASN": p.status_pegawai || 'ASN',
          "OPD / Unit Kerja": p.unit_kerja || '-',
        };
        trendYears.forEach(year => {
          const jp = p.yearlyJp?.[year] || 0;
          const lulus = p.yearlyLulus?.[year];
          row[`${year} (JP)`] = jp;
          row[`${year} (Status)`] = lulus ? 'Memenuhi Syarat' : 'Belum Memenuhi';
        });
        row["Status Tren"] = 
          p.statusTren === 'naik' ? 'Naik (Meningkat)' :
          p.statusTren === 'turun' ? 'Turun (Menurun)' : 'Stabil';
        return row;
      });
      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tren_Tahunan_Pegawai");
      XLSX.writeFile(workbook, "Rekap_Tren_Tahunan_Pegawai.xlsx");
      return;
    }

    const excelRows = opdTrendData.map((item, idx) => {
      const row: any = {
        "No": idx + 1,
        "Nama OPD / Unit Kerja": item.opd,
        "Total Pegawai": item.totalMembers,
      };

      trendYears.forEach(year => {
        const stats = item.yearlyStats[year];
        row[`${year} (Lulus)`] = stats?.lulus || 0;
        row[`${year} (%)`] = `${stats?.persentase || 0}%`;
        row[`${year} (Rata-rata JP)`] = stats?.avgJp || 0;
      });

      row["Status Tren"] = 
        item.statusTren === 'naik' ? 'Naik (Meningkat)' :
        item.statusTren === 'turun' ? 'Turun (Menurun)' :
        item.statusTren === 'fluktuatif' ? 'Fluktuatif (Naik-Turun)' : 'Stabil';

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tren_Tahunan_OPD");
    XLSX.writeFile(workbook, "Rekap_Tren_Tahunan_OPD.xlsx");
  };

  // Download Template Excel untuk Sertifikasi Massal (Auto-fill NIP dari database Google Sheet)
  const downloadTemplateSertifikasi = async () => {
    if (userRole !== 'super_admin') {
      alert('Akses ditolak: Fitur download template hanya dapat diakses oleh Super Admin.');
      return;
    }
    let sourcePegawai: any[] = [];
    try {
      const res = await fetch(`/api/pegawai/all?all=true&t=${Date.now()}`, { cache: 'no-store' });
      const j = await res.json();
      if (j.success && j.data && j.data.length > 0) {
        sourcePegawai = j.data;
        setSemuaPegawai(j.data);
      }
    } catch (e) {
      sourcePegawai = semuaPegawai.length > 0 ? semuaPegawai : pegawaiList;
    }
    if (!sourcePegawai || sourcePegawai.length === 0) {
      sourcePegawai = semuaPegawai.length > 0 ? semuaPegawai : pegawaiList;
    }

    const workbook = XLSX.utils.book_new();

    // 1. Sheet Referensi Pegawai dari Google Sheet database terkini (semuaPegawai)
    const refData = [
      ["NIP", "Nama Pegawai", "Status Pegawai", "Jabatan", "Unit Kerja"],
      ...sourcePegawai
        .filter((p: any) => p.nip && p.nip !== 'admin')
        .map((p: any) => [
          p.nip?.toString().trim(),
          p.nama || '-',
          p.status_pegawai || '-',
          p.jabatan || '-',
          p.unit_kerja || '-'
        ])
    ];
    const wsRef = XLSX.utils.aoa_to_sheet(refData);
    wsRef['!cols'] = [{ wch: 22 }, { wch: 32 }, { wch: 18 }, { wch: 35 }, { wch: 35 }];

    // 2. Sheet Template_Sertifikasi dengan Formula Otomatis
    const headers = [
      "NIP", "Nama Pegawai", "Status Pegawai", "Jabatan", 
      "Jenis Sertifikasi", "Nama Kursus", "Institusi Penyelenggara", "Nomor Sertifikasi", 
      "Tanggal Mulai", "Tanggal Akhir", "Tahun", "Jumlah JP", "Link Sertifikat", 
      "Jenis Kursus", "Klasifikasi Kursus", "Penanda Tangan", "Biaya Pelatihan"
    ];

    // Sediakan 500 baris kosong berformula agar saat NIP diketik langsung terisi otomatis
    const rowsAoa: any[][] = [headers];
    for (let r = 2; r <= 500; r++) {
      rowsAoa.push(new Array(headers.length).fill(null));
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rowsAoa);

    // Pasang formula otomatis VLOOKUP ke tab Data_Referensi_Pegawai
    // Sertakan property 'v' kosong agar SheetJS menyertakan formula saat di-write ke file XLSX
    for (let r = 2; r <= 500; r++) {
      worksheet[`B${r}`] = { 
        t: 's', 
        v: '',
        f: `IF(ISBLANK(A${r}),"",IFERROR(VLOOKUP(A${r},Data_Referensi_Pegawai!$A$2:$E$6000,2,FALSE),IFERROR(VLOOKUP(TRIM(A${r}&""),Data_Referensi_Pegawai!$A$2:$E$6000,2,FALSE),IFERROR(VLOOKUP(VALUE(A${r}),Data_Referensi_Pegawai!$A$2:$E$6000,2,FALSE),"NIP Tidak Ditemukan"))))` 
      };
      worksheet[`C${r}`] = { 
        t: 's', 
        v: '',
        f: `IF(ISBLANK(A${r}),"",IFERROR(VLOOKUP(A${r},Data_Referensi_Pegawai!$A$2:$E$6000,3,FALSE),IFERROR(VLOOKUP(TRIM(A${r}&""),Data_Referensi_Pegawai!$A$2:$E$6000,3,FALSE),IFERROR(VLOOKUP(VALUE(A${r}),Data_Referensi_Pegawai!$A$2:$E$6000,3,FALSE),"NIP Tidak Ditemukan"))))` 
      };
      worksheet[`D${r}`] = { 
        t: 's', 
        v: '',
        f: `IF(ISBLANK(A${r}),"",IFERROR(VLOOKUP(A${r},Data_Referensi_Pegawai!$A$2:$E$6000,4,FALSE),IFERROR(VLOOKUP(TRIM(A${r}&""),Data_Referensi_Pegawai!$A$2:$E$6000,4,FALSE),IFERROR(VLOOKUP(VALUE(A${r}),Data_Referensi_Pegawai!$A$2:$E$6000,4,FALSE),"NIP Tidak Ditemukan"))))` 
      };
    }

    worksheet['!cols'] = [
      { wch: 22 }, // NIP
      { wch: 30 }, // Nama Pegawai (Otomatis)
      { wch: 18 }, // Status Pegawai (Otomatis)
      { wch: 35 }, // Jabatan (Otomatis)
      { wch: 18 }, // Jenis Sertifikasi
      { wch: 48 }, // Nama Kursus
      { wch: 32 }, // Institusi Penyelenggara
      { wch: 24 }, // Nomor Sertifikasi
      { wch: 16 }, // Tanggal Mulai
      { wch: 16 }, // Tanggal Akhir
      { wch: 10 }, // Tahun
      { wch: 12 }, // Jumlah JP
      { wch: 45 }, // Link Sertifikat
      { wch: 25 }, // Jenis Kursus
      { wch: 20 }, // Klasifikasi Kursus
      { wch: 32 }, // Penanda Tangan
      { wch: 16 }  // Biaya Pelatihan
    ];

    // Sheet 1: Template_Sertifikasi (di posisi pertama)
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template_Sertifikasi");

    // Sheet 2: Data_Referensi_Pegawai (sebagai basis data VLOOKUP)
    XLSX.utils.book_append_sheet(workbook, wsRef, "Data_Referensi_Pegawai");

    // Sheet 3: Petunjuk_Pengisian
    const petunjukData = [
      { "Fitur Otomatis": "AUTO-FILL NIP", "Keterangan": "Cukup masukkan atau paste NIP di Kolom A, maka kolom Nama Pegawai, Status Pegawai, dan Jabatan akan OTOMATIS TERISI dari database! Jika NIP salah / tidak terdaftar di database, otomatis muncul 'NIP Tidak Ditemukan'." },
      { "Kolom": "NIP", "Keterangan": "WAJIB diisi. Nomor Induk Pegawai 18 digit yang terdaftar di database." },
      { "Kolom": "Nama Pegawai", "Keterangan": "OTOMATIS terisi lewat formula dari tab Data_Referensi_Pegawai." },
      { "Kolom": "Status Pegawai", "Keterangan": "OTOMATIS terisi (PNS / PPPK / PW)." },
      { "Kolom": "Jabatan", "Keterangan": "OTOMATIS terisi sesuai data kepegawaian." },
      { "Kolom": "Jenis Sertifikasi", "Keterangan": "Contoh: Workshop, Webinar, Bimtek, Seminar, Pelatihan, Diklat Teknis, Paten/Haki." },
      { "Kolom": "Nama Kursus", "Keterangan": "WAJIB diisi. Nama kegiatan diklat (Contoh: Rabu Bertamu: Penguatan Budaya Kerja BerAKHLAK)." },
      { "Kolom": "Institusi Penyelenggara", "Keterangan": "Instansi penyelenggara kegiatan (Contoh: BKPSDMD Kabupaten Bangka Barat)." },
      { "Kolom": "Nomor Sertifikasi", "Keterangan": "Nomor sertifikat atau surat tugas / piagam (Jika belum ada nomor, isi '-')." },
      { "Kolom": "Tanggal Mulai", "Keterangan": "Tanggal awal kegiatan (Format: YYYY-MM-DD atau DD/MM/YYYY, contoh: 2026-10-14)." },
      { "Kolom": "Tanggal Akhir", "Keterangan": "Tanggal selesai kegiatan (Format: YYYY-MM-DD atau DD/MM/YYYY)." },
      { "Kolom": "Tahun", "Keterangan": "Tahun kegiatan (Contoh: 2026)." },
      { "Kolom": "Jumlah JP", "Keterangan": "WAJIB angka. Jumlah Jam Pelajaran yang diperoleh (Contoh: 4 atau 20)." },
      { "Kolom": "Link Sertifikat", "Keterangan": "Tautan file Google Drive atau URL. Boleh dikosongkan jika fisik sertifikat belum diunggah." },
      { "Kolom": "Jenis Kursus", "Keterangan": "Pilihan: Webinar, Workshop, Diklat teknis, Seminar, Bimbingan teknis, Sosialisasi, Pelatihan manajerial, dll." },
      { "Kolom": "Klasifikasi Kursus", "Keterangan": "Pilihan: Non-Klasikal / Klasikal / Blended Learning." },
      { "Kolom": "Penanda Tangan", "Keterangan": "Pejabat yang menandatangani (Contoh: Kepala BKPSDMD Kab. Bangka Barat)." },
      { "Kolom": "Biaya Pelatihan", "Keterangan": "Sumber pembiayaan (Contoh: APBD, Mandiri, Kontribusi, atau 0)." },
    ];
    const wsPetunjuk = XLSX.utils.json_to_sheet(petunjukData);
    wsPetunjuk['!cols'] = [{ wch: 25 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, wsPetunjuk, "Petunjuk_Pengisian");

    XLSX.writeFile(workbook, "Template_Import_Sertifikasi_BKD.xlsx");
  };

  // Handler saat file Excel dipilih untuk diimpor
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const mapped = rawJson.map((r, idx) => {
          const nip = (r['NIP'] || r['nip'] || r['Nip'] || r['Nomor Induk Pegawai'] || '').toString().trim();
          const namaInput = (r['Nama Pegawai (Opsional)'] || r['Nama Pegawai'] || r['Nama'] || r['nama'] || '').toString().trim();
          const namaKursus = (r['Nama Kursus'] || r['Nama Kursus / Kegiatan'] || r['Nama Kegiatan'] || r['nama_kursus'] || r['Kegiatan'] || '').toString().trim();
          const jenisSert = (r['Jenis Sertifikasi'] || r['jenis_sertifikasi'] || r['Jenis'] || 'Workshop').toString().trim();
          const inst = (r['Institusi Penyelenggara'] || r['institusi_penyelenggara'] || r['Penyelenggara'] || 'BKPSDMD').toString().trim();
          const noSert = (r['Nomor Sertifikasi'] || r['nomor_sertifikasi'] || r['Nomor'] || '-').toString().trim();

          // Tanggal Mulai & Tanggal Akhir
          const tglMulai = (r['Tanggal Mulai'] || r['tanggal_mulai'] || r['Tanggal Awal'] || r['Tgl Mulai'] || '').toString().trim();
          const tglAkhir = (r['Tanggal Akhir'] || r['tanggal_akhir'] || r['Tanggal Selesai'] || r['Tgl Akhir'] || '').toString().trim();
          const tglSert = (r['Tanggal Sertifikasi'] || r['tanggal_sertifikasi'] || r['Tanggal'] || '').toString().trim();

          let finalTanggal = '';
          if (tglMulai && tglAkhir) {
            finalTanggal = tglMulai === tglAkhir ? tglMulai : `${tglMulai} s.d ${tglAkhir}`;
          } else if (tglMulai) {
            finalTanggal = tglMulai;
          } else if (tglAkhir) {
            finalTanggal = tglAkhir;
          } else {
            finalTanggal = tglSert;
          }

          const thn = (r['Tahun'] || r['tahun'] || new Date().getFullYear()).toString().trim();
          const rawJp = r['Jumlah JP'] !== undefined ? r['Jumlah JP'] : (r['jumlah_jp'] || r['JP'] || 0);
          const jp = Number(rawJp) || 0;
          const link = (r['Link Sertifikat'] || r['link_sertifikat'] || r['Link Drive'] || r['Link'] || '').toString().trim();
          const jenisKursus = (r['Jenis Kursus'] || r['jenis_kursus'] || 'Pelatihan non-klasikal lainnya').toString().trim();
          const klasifikasi = (r['Klasifikasi Kursus'] || r['klasifikasi_kursus'] || 'Non-Klasikal').toString().trim();
          const ttd = (r['Penanda Tangan'] || r['penanda_tangan'] || r['Pejabat'] || '-').toString().trim();
          const biaya = (r['Biaya Pelatihan'] || r['biaya_pelatihan'] || r['Biaya'] || 'APBD').toString().trim();

          const sourceList = (semuaPegawai && semuaPegawai.length > 0) ? semuaPegawai : pegawaiList;
          const pegFound = sourceList.find((p: any) => p.nip?.toString().trim() === nip);

          const statusPeg = (r['Status Pegawai'] || r['status_pegawai'] || r['Status'] || '').toString().trim();
          const jabatanPeg = (r['Jabatan'] || r['jabatan'] || '').toString().trim();

          const isFound = !!pegFound;
          const finalNama = isFound ? (pegFound.nama || namaInput || '-') : 'NIP Tidak Ditemukan';
          const finalStatus = isFound ? (pegFound.status_pegawai || (statusPeg && statusPeg !== 'NIP Tidak Ditemukan' ? statusPeg : '-')) : 'NIP Tidak Ditemukan';
          const finalJabatan = isFound ? (pegFound.jabatan || (jabatanPeg && jabatanPeg !== 'NIP Tidak Ditemukan' ? jabatanPeg : '-')) : 'NIP Tidak Ditemukan';
          const finalOpd = isFound ? (pegFound.unit_kerja || '-') : 'Tidak Terdaftar';

          return {
            rowNum: idx + 2,
            nip,
            nama_pegawai: finalNama,
            status_pegawai: finalStatus,
            jabatan: finalJabatan,
            opd: finalOpd,
            isRegistered: isFound,
            jenis_sertifikasi: jenisSert,
            nama_kursus: namaKursus,
            institusi_penyelenggara: inst,
            nomor_sertifikasi: noSert,
            tanggal_mulai: tglMulai,
            tanggal_akhir: tglAkhir,
            tanggal_sertifikasi: finalTanggal,
            tahun: thn,
            jumlah_jp: jp,
            link_sertifikat: link,
            jenis_kursus: jenisKursus,
            klasifikasi_kursus: klasifikasi,
            penanda_tangan: ttd,
            biaya_pelatihan: biaya
          };
        }).filter(item => item.nip && item.nama_kursus);

        setImportPreviewData(mapped);
      } catch (err: any) {
        alert('Gagal membaca file Excel/Numbers: ' + (err?.message || err));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Kirim data batch sertifikasi ke backend
  const handleProcessImport = async () => {
    if (importPreviewData.length === 0) {
      alert('Tidak ada data valid untuk diimpor.');
      return;
    }

    const unregList = importPreviewData.filter(d => !d.isRegistered || d.nama_pegawai === 'NIP Tidak Ditemukan');
    let itemsToImport = importPreviewData;

    if (unregList.length > 0) {
      const confirmImport = confirm(`Perhatian: Terdapat ${unregList.length} baris dengan NIP yang TIDAK DITEMUKAN di database.\n\nKlik OK untuk hanya mengimpor ${importPreviewData.length - unregList.length} data yang NIP-nya terdaftar, atau klik Batal untuk memeriksa kembali data Anda.`);
      if (!confirmImport) return;
      itemsToImport = importPreviewData.filter(d => d.isRegistered && d.nama_pegawai !== 'NIP Tidak Ditemukan');
      if (itemsToImport.length === 0) {
        alert('Tidak ada data dengan NIP valid untuk diimpor.');
        return;
      }
    }

    setImportLoading(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/sertifikasi/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToImport })
      });
      const data = await res.json();

      if (data.success) {
        setImportResult({
          success: true,
          message: data.message || `Berhasil mengimpor ${importPreviewData.length} data sertifikasi!`
        });
        await fetchData(); // Refresh list pegawai & akumulasi JP di admin
        setImportFile(null);
        setImportPreviewData([]);
      } else {
        setImportResult({
          success: false,
          message: data.error || 'Gagal menyimpan data ke database.'
        });
      }
    } catch (err: any) {
      setImportResult({
        success: false,
        message: 'Terjadi kesalahan jaringan saat mengirim data: ' + (err?.message || err)
      });
    } finally {
      setImportLoading(false);
    }
  };

  const { groupedByOPD, sortedOPDs } = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    pegawaiList.forEach(p => {
      let matchedOpd = 'Belum Diatur';
      if (p.unit_kerja) {
        const raw = p.unit_kerja.toUpperCase();
        const rawWords = getUnitKerjaWords(p.unit_kerja);
        let bestMatch = null;
        let bestScore = 0;

        PARSED_UNIT_KERJA_OPTIONS.forEach(({opt, words}) => {
          const score = wordMatchScore(rawWords, words);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = opt;
          }
        });

        let found = bestScore >= 0.65 ? bestMatch : null;
        if (found) {
          matchedOpd = found;
        } else {
          // Fallback if not found in list, clean it up manually
          let opd = raw;
          if (opd.includes(' - PEMERINTAH')) opd = opd.split(' - PEMERINTAH')[0];
          if (opd.includes('SDM')) opd = opd.replace('SDM', 'SUMBER DAYA MANUSIA');
          matchedOpd = opd.trim();
        }
      }
      if (!grouped[matchedOpd]) grouped[matchedOpd] = [];
      grouped[matchedOpd].push(p);
    });
    
    return {
      groupedByOPD: grouped,
      sortedOPDs: Object.keys(grouped).sort()
    };
  }, [pegawaiList]);

  const { filteredOPDs, processedOPDs } = useMemo(() => {
    const resultOPDs = sortedOPDs.filter(opd => {
      let opdPegawai = groupedByOPD[opd] || [];
      if (searchSertifikasi) {
        const query = searchSertifikasi.toLowerCase();
        opdPegawai = opdPegawai.filter(p => 
          (p.nama && p.nama.toLowerCase().includes(query)) || 
          (p.nip && p.nip.toLowerCase().includes(query))
        );
      }
      return opdPegawai.length > 0;
    });
    
    const processed: Record<string, any[]> = {};
    resultOPDs.forEach(opd => {
      let opdPegawai = groupedByOPD[opd] || [];
      if (searchSertifikasi) {
        const query = searchSertifikasi.toLowerCase();
        opdPegawai = opdPegawai.filter(p => 
          (p.nama && p.nama.toLowerCase().includes(query)) || 
          (p.nip && p.nip.toLowerCase().includes(query))
        );
      }
      processed[opd] = opdPegawai;
    });
    
    return { filteredOPDs: resultOPDs, processedOPDs: processed };
  }, [sortedOPDs, groupedByOPD, searchSertifikasi]);

  const trendYears = useMemo(() => {
    const currentYear = new Date().getFullYear().toString();
    const yearsFromData = rawPegawaiList.flatMap(p => p.sertifikasi?.map((s: any) => String(s.tahun)).filter(Boolean) || []);
    const uniqueYears = Array.from(new Set(yearsFromData)).filter(y => /^\d{4}$/.test(y)).sort();
    const baseYears = ['2023', '2024', '2025', currentYear];
    baseYears.forEach(y => {
      if (!uniqueYears.includes(y)) uniqueYears.push(y);
    });
    return uniqueYears.sort();
  }, [rawPegawaiList]);

  const opdTrendData = useMemo(() => {
    return sortedOPDs.map(opd => {
      const members = groupedByOPD[opd] || [];
      const totalMembers = members.length;

      const yearlyStats: Record<string, { lulus: number; belum: number; persentase: number; totalJp: number; avgJp: number }> = {};
      const rates: number[] = [];

      trendYears.forEach(year => {
        let lulusCount = 0;
        let totalJp = 0;

        members.forEach(p => {
          const sertsYear = p.sertifikasi?.filter((s: any) => String(s.tahun) === String(year)) || [];
          const jpYear = sertsYear.reduce((acc: number, curr: any) => acc + (Number(curr.jumlah_jp) || 0), 0);
          totalJp += jpYear;
          if (checkLulusJP({ ...p, jp: jpYear })) {
            lulusCount++;
          }
        });

        const persentase = totalMembers > 0 ? Math.round((lulusCount / totalMembers) * 100) : 0;
        const avgJp = totalMembers > 0 ? Number((totalJp / totalMembers).toFixed(1)) : 0;

        yearlyStats[year] = {
          lulus: lulusCount,
          belum: totalMembers - lulusCount,
          persentase,
          totalJp,
          avgJp
        };
        rates.push(persentase);
      });

      let isIncreasing = true;
      let isDecreasing = true;
      let hasChanges = false;

      for (let i = 1; i < rates.length; i++) {
        if (rates[i] > rates[i - 1]) {
          isDecreasing = false;
          hasChanges = true;
        } else if (rates[i] < rates[i - 1]) {
          isIncreasing = false;
          hasChanges = true;
        }
      }

      let statusTren: 'naik' | 'turun' | 'fluktuatif' | 'stabil' = 'stabil';
      if (!hasChanges) {
        statusTren = 'stabil';
      } else if (isIncreasing) {
        statusTren = 'naik';
      } else if (isDecreasing) {
        statusTren = 'turun';
      } else {
        statusTren = 'fluktuatif';
      }

      return {
        opd,
        totalMembers,
        yearlyStats,
        statusTren,
        latestRate: rates[rates.length - 1] || 0,
        firstRate: rates[0] || 0
      };
    });
  }, [sortedOPDs, groupedByOPD, trendYears]);

  const { countNaik, countTurun, countFluktuatif, countStabil } = useMemo(() => {
    let naik = 0, turun = 0, fluktuatif = 0, stabil = 0;
    opdTrendData.forEach(d => {
      if (d.statusTren === 'naik') naik++;
      else if (d.statusTren === 'turun') turun++;
      else if (d.statusTren === 'fluktuatif') fluktuatif++;
      else stabil++;
    });
    return { countNaik: naik, countTurun: turun, countFluktuatif: fluktuatif, countStabil: stabil };
  }, [opdTrendData]);

  const currentChartData = useMemo(() => {
    return trendYears.map(year => {
      if (selectedOpdChart === 'all') {
        const totalAllPegawai = rawPegawaiList.length;
        let totalAllLulus = 0;
        let totalAllJp = 0;

        rawPegawaiList.forEach(p => {
          const sertsYear = p.sertifikasi?.filter((s: any) => String(s.tahun) === String(year)) || [];
          const jpYear = sertsYear.reduce((acc: number, curr: any) => acc + (Number(curr.jumlah_jp) || 0), 0);
          totalAllJp += jpYear;
          if (checkLulusJP({ ...p, jp: jpYear })) {
            totalAllLulus++;
          }
        });

        const persentase = totalAllPegawai > 0 ? Math.round((totalAllLulus / totalAllPegawai) * 100) : 0;
        const avgJp = totalAllPegawai > 0 ? Number((totalAllJp / totalAllPegawai).toFixed(1)) : 0;

        return {
          tahun: year,
          'Persentase Capai Target (%)': persentase,
          'Rata-rata JP': avgJp,
          lulus: totalAllLulus,
          total: totalAllPegawai
        };
      } else {
        const found = opdTrendData.find(d => d.opd === selectedOpdChart);
        const stats = found?.yearlyStats[year] || { lulus: 0, belum: 0, persentase: 0, avgJp: 0, totalJp: 0 };
        return {
          tahun: year,
          'Persentase Capai Target (%)': stats.persentase,
          'Rata-rata JP': stats.avgJp,
          lulus: stats.lulus,
          total: found?.totalMembers || 0
        };
      }
    });
  }, [trendYears, selectedOpdChart, rawPegawaiList, opdTrendData]);

  const filteredOpdTrendList = useMemo(() => {
    return opdTrendData.filter(item => {
      if (filterTrenStatus !== 'all' && item.statusTren !== filterTrenStatus) {
        return false;
      }
      if (searchTren) {
        const query = searchTren.toLowerCase();
        return item.opd.toLowerCase().includes(query);
      }
      return true;
    });
  }, [opdTrendData, filterTrenStatus, searchTren]);

  const paginatedOpdTrend = useMemo(() => {
    const start = (currentPageTren - 1) * ITEMS_PER_PAGE_TREN;
    return filteredOpdTrendList.slice(start, start + ITEMS_PER_PAGE_TREN);
  }, [filteredOpdTrendList, currentPageTren]);

  const pegawaiTrendList = useMemo(() => {
    return rawPegawaiList.map(p => {
      const yearlyJp: Record<string, number> = {};
      const yearlyLulus: Record<string, boolean> = {};
      trendYears.forEach(yr => {
        const yrSerts = (p.sertifikasi || []).filter((s: any) => String(s.tahun) === String(yr));
        const jp = yrSerts.reduce((acc: number, curr: any) => acc + (Number(curr.jumlah_jp) || 0), 0);
        yearlyJp[yr] = jp;
        yearlyLulus[yr] = checkLulusJP({ ...p, jp });
      });

      let statusTren: 'naik' | 'turun' | 'fluktuatif' | 'stabil' = 'stabil';
      if (trendYears.length >= 2) {
        const prevJp = yearlyJp[trendYears[trendYears.length - 2]] || 0;
        const lastJp = yearlyJp[trendYears[trendYears.length - 1]] || 0;
        if (lastJp > prevJp) statusTren = 'naik';
        else if (lastJp < prevJp) statusTren = 'turun';
        else statusTren = 'stabil';
      }

      return {
        ...p,
        yearlyJp,
        yearlyLulus,
        statusTren
      };
    });
  }, [rawPegawaiList, trendYears]);

  const filteredPegawaiTrendList = useMemo(() => {
    return pegawaiTrendList.filter(p => {
      if (filterTrenOpd !== 'all' && (p.unit_kerja || '-') !== filterTrenOpd) {
        return false;
      }
      if (filterTrenStatus !== 'all' && p.statusTren !== filterTrenStatus) {
        return false;
      }
      if (searchTren) {
        const query = searchTren.toLowerCase();
        const nama = (p.nama || '').toLowerCase();
        const nip = (p.nip || '').toLowerCase();
        const opd = (p.unit_kerja || '').toLowerCase();
        return nama.includes(query) || nip.includes(query) || opd.includes(query);
      }
      return true;
    });
  }, [pegawaiTrendList, filterTrenOpd, filterTrenStatus, searchTren]);

  const paginatedPegawaiTrend = useMemo(() => {
    const start = (currentPageTrenPegawai - 1) * ITEMS_PER_PAGE_PEGAWAI;
    return filteredPegawaiTrendList.slice(start, start + ITEMS_PER_PAGE_PEGAWAI);
  }, [filteredPegawaiTrendList, currentPageTrenPegawai]);

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

        /* EXECUTIVE DASHBOARD STYLES */
        .dash-hero {
          background: linear-gradient(135deg, #091e42 0%, #0f2744 50%, #1e3a8a 100%);
          border-radius: 22px;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 15px 35px -5px rgba(15, 23, 42, 0.2), 0 5px 15px -3px rgba(15, 23, 42, 0.1);
          padding: 32px 36px;
          margin-bottom: 28px;
        }
        .dash-hero::before {
          content: "";
          position: absolute;
          top: -60px;
          right: -40px;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(56, 189, 248, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .dash-hero::after {
          content: "";
          position: absolute;
          bottom: -80px;
          left: 25%;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(129, 140, 248, 0.18) 0%, rgba(129, 140, 248, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .dash-kpi-card {
          background: white;
          border-radius: 18px;
          padding: 22px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }
        .dash-kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
          border-color: #cbd5e1;
        }
        .dash-kpi-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.45rem;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 6px 14px rgba(0,0,0,0.12);
        }
        .dash-card {
          background: white;
          border-radius: 18px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dash-card:hover {
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        }
        .year-pill-btn {
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
        }
        .year-pill-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          transform: translateY(-1px);
        }
        .year-pill-btn.active {
          background: white;
          color: #0f172a;
          border-color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.18);
        }
        .hero-action-btn {
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          text-decoration: none;
        }
        .hero-action-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.05);
        }
        .dash-podium-item {
          display: flex;
          align-items: center;
          padding: 12px 14px;
          border-radius: 12px;
          background-color: #f8fafc;
          border: 1px solid #edf2f7;
          transition: all 0.2s;
          margin-bottom: 10px;
        }
        .dash-podium-item:hover {
          background-color: #f1f5f9;
          transform: translateX(4px);
        }
        .dash-rank-badge {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.88rem;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .dash-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          color: white;
          margin-right: 12px;
          flex-shrink: 0;
          box-shadow: 0 3px 8px rgba(0,0,0,0.1);
        }
        .dash-donut-center {
          position: absolute;
          top: 48%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: none;
        }

        /* Confirm Delete Modal Styles */
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInModal {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulseWarning {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
        .delete-confirm-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; animation: fadeInOverlay 0.2s ease-out;
        }
        .delete-confirm-card {
          background: white; border-radius: 20px; padding: 40px 36px 32px;
          max-width: 440px; width: 90%; text-align: center;
          box-shadow: 0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
          animation: slideInModal 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .delete-confirm-icon {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px; animation: pulseWarning 2s ease-in-out infinite;
        }
        .delete-confirm-icon i { font-size: 2rem; color: #dc2626; }
        .delete-confirm-title { font-size: 1.3rem; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
        .delete-confirm-msg { font-size: 0.92rem; color: #64748b; line-height: 1.6; margin-bottom: 28px; }
        .delete-confirm-actions { display: flex; gap: 12px; justify-content: center; }
        .delete-confirm-actions .btn-cancel {
          flex: 1; padding: 12px 20px; border-radius: 12px; font-weight: 600; font-size: 0.95rem;
          border: 2px solid #e2e8f0; background: white; color: #475569; cursor: pointer;
          transition: all 0.2s;
        }
        .delete-confirm-actions .btn-cancel:hover { background: #f8fafc; border-color: #cbd5e1; }
        .delete-confirm-actions .btn-delete {
          flex: 1; padding: 12px 20px; border-radius: 12px; font-weight: 600; font-size: 0.95rem;
          border: none; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; cursor: pointer;
          transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .delete-confirm-actions .btn-delete:hover { background: linear-gradient(135deg, #b91c1c, #991b1b); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(220,38,38,0.3); }
        .delete-confirm-actions .btn-delete:disabled { opacity: 0.7; cursor: not-allowed; transform: none; box-shadow: none; }
        .delete-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spinLoader 0.6s linear infinite; }
      `}} />

      <div className="container-fluid p-0">
        <div className="row g-0">
          
          {/* Sidebar */}
          <div className="col-lg-2 d-none d-lg-block sidebar">
            <div className="sidebar-brand">
              <i className="bi bi-shield-lock-fill text-info me-2"></i> {userRole === 'super_admin' ? 'Super Admin SIPJP' : 'Portal Atasan OPD'}
            </div>
            <ul className="sidebar-nav">
              {userRole === 'super_admin' && (
                <li><a onClick={() => changeTab('view-dashboard')} className={`nav-item ${activeTab === 'view-dashboard' ? 'active' : ''}`}><i className="bi bi-speedometer2"></i> Dashboard</a></li>
              )}
              <li><a onClick={() => changeTab('view-pegawai')} className={`nav-item ${activeTab === 'view-pegawai' ? 'active' : ''}`}><i className="bi bi-people-fill"></i> Data Pegawai {userRole !== 'super_admin' && '(OPD)'}</a></li>
              <li><a onClick={() => changeTab('view-sertifikasi')} className={`nav-item ${activeTab === 'view-sertifikasi' ? 'active' : ''}`}><i className="bi bi-journal-check"></i> Rekap Sertifikasi</a></li>
              {userRole === 'super_admin' && (
                <li><a onClick={() => changeTab('view-tren')} className={`nav-item ${activeTab === 'view-tren' ? 'active' : ''}`}><i className="bi bi-graph-up-arrow"></i> Tren Tahunan OPD</a></li>
              )}
              <li><a onClick={() => changeTab('view-idp')} className={`nav-item ${activeTab === 'view-idp' ? 'active' : ''}`}><i className="bi bi-calendar2-check"></i> Approval IDP</a></li>
              {userRole === 'super_admin' && (
                <li><a onClick={() => { changeTab('view-profil-web'); fetchProfilWeb(); }} className={`nav-item ${activeTab === 'view-profil-web' ? 'active' : ''}`}><i className="bi bi-person-badge-fill"></i> Profil Pimpinan Web</a></li>
              )}
              {loggedInNip !== 'admin' && (
                <li className="mt-4">
                  <a 
                    onClick={() => router.push('/dashboard')} 
                    className="nav-item fw-bold text-primary shadow-sm" 
                    style={{ backgroundColor: '#eff6ff', borderRadius: '8px', cursor: 'pointer', border: '1px solid #bfdbfe' }}
                    title="Beralih ke Dashboard & Layanan Pegawai Pribadi Anda (Upload Diklat, IDP, dll)"
                  >
                    <i className="bi bi-person-workspace text-primary"></i> Dashboard Pegawai
                  </a>
                </li>
              )}
              <li className={loggedInNip === 'admin' ? 'mt-4' : 'mt-2'}>
                <a onClick={handleLogout} className="text-danger" style={{ cursor: 'pointer' }}>
                  <i className="bi bi-box-arrow-left"></i> Logout
                </a>
              </li>
            </ul>
          </div>

          {/* Main Content */}
          <div className="col-lg-10 col-md-12">
            <div className="topbar">
              <h5 className="fw-bold text-secondary mb-0">{getTopbarTitle()}</h5>
              <div className="d-flex align-items-center gap-3">
                {loggedInNip !== 'admin' && (
                  <button 
                    onClick={() => router.push('/dashboard')} 
                    className="btn btn-sm btn-outline-primary shadow-sm fw-bold d-flex align-items-center gap-1 px-3" 
                    style={{ borderRadius: '20px' }}
                    title="Beralih ke Dashboard & Layanan Pegawai Pribadi Anda (Upload Diklat, IDP, dll)"
                  >
                    <i className="bi bi-person-workspace"></i>
                    <span>Dashboard Pegawai</span>
                  </button>
                )}
                <div className="d-flex align-items-center gap-2 bg-light px-3 py-1 rounded-pill border">
                  <i className="bi bi-calendar3 text-primary" style={{ fontSize: '0.85rem' }}></i>
                  <span className="text-muted fw-bold" style={{ fontSize: '0.8rem' }}>Tahun:</span>
                  <select 
                    className="form-select form-select-sm border-0 bg-transparent shadow-none p-0 pe-3" 
                    style={{ width: 'auto', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                    value={tahunFilter}
                    onChange={(e) => setTahunFilter(e.target.value)}
                  >
                    <option value="all">Semua Tahun</option>
                    {availableYears.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
                <i className="bi bi-bell fs-5 text-muted ms-1"></i>
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '36px', height: '36px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {loggedInNip === 'admin' 
                      ? 'SA' 
                      : (((pegawaiList.find(p => p.nip === loggedInNip)?.nama || loggedInNama || 'Admin').substring(0, 2)).toUpperCase())}
                  </div>
                  <div>
                    <div className="fw-semibold text-dark lh-1" style={{ fontSize: '0.88rem' }}>
                      {loggedInNip === 'admin' 
                        ? 'Administrator Utama' 
                        : (pegawaiList.find(p => p.nip === loggedInNip)?.nama || loggedInNama || (userRole === 'super_admin' ? 'Administrator' : 'Atasan OPD'))}
                    </div>
                    <span className="badge bg-primary-subtle text-primary text-uppercase mt-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                      {userRole === 'super_admin' ? 'Super Admin BKPSDMD' : 'Atasan OPD'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 p-md-5">
              
              {/* DASHBOARD TAB */}
              {userRole === 'super_admin' && activeTab === 'view-dashboard' && (() => {
                const totalPegawai = pegawaiList.length;
                const percentLulus = totalPegawai > 0 ? Math.round((lulus / totalPegawai) * 100) : 0;

                const pieData = [
                  { name: 'Memenuhi Syarat', value: lulus, color: '#10b981' },
                  { name: 'Belum Memenuhi', value: belum, color: '#f59e0b' }
                ];

                return (
                <div>
                  {/* Header Bar dengan Filter Periode Tahun */}
                  <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <div>
                      <h4 className="fw-bold text-dark mb-1">
                        <i className="bi bi-graph-up-arrow text-primary me-2"></i>
                        Grafik Capaian &amp; Pemenuhan JP ASN
                      </h4>
                      <p className="text-muted small mb-0">
                        Visualisasi tren kelulusan tahunan dan rasio pemenuhan standar 20 JP Pemerintah Kabupaten Bangka Barat
                      </p>
                    </div>

                    {/* Filter Periode Pills */}
                    <div className="d-flex align-items-center flex-wrap gap-2 bg-white p-2 rounded-4 border shadow-sm">
                      <span className="text-secondary small fw-semibold me-1 ps-1">
                        <i className="bi bi-funnel me-1"></i>Periode:
                      </span>
                      <button 
                        className={`btn btn-sm ${tahunFilter === 'all' ? 'btn-primary text-white shadow-sm' : 'btn-light text-secondary'} rounded-pill px-3 py-1 fw-semibold`}
                        onClick={() => setTahunFilter('all')}
                      >
                        Semua Tahun
                      </button>
                      {availableYears.map(yr => (
                        <button
                          key={yr}
                          className={`btn btn-sm ${tahunFilter === yr ? 'btn-primary text-white shadow-sm' : 'btn-light text-secondary'} rounded-pill px-3 py-1 fw-semibold`}
                          onClick={() => setTahunFilter(yr)}
                        >
                          {yr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CHARTS ROW (TREN & PROPORSI) */}
                  <div className="row g-4">
                    {/* GRAFIK 1: TREN KELULUSAN PER TAHUN */}
                    <div className="col-lg-8">
                      <div className="dash-card h-100">
                        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                          <div>
                            <h5 className="fw-bold text-dark mb-1">
                              <i className="bi bi-graph-up-arrow text-primary me-2"></i>
                              Tren Capaian Pemenuhan JP ASN per Tahun
                            </h5>
                            <span className="text-muted small">Perkembangan jumlah pegawai yang memenuhi standar kewajiban JP tahunan</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill">
                              <i className="bi bi-clock-history me-1"></i> {chartData.length} Periode Tahun
                            </span>
                          </div>
                        </div>

                        <div style={{ width: '100%', height: 380 }}>
                          {chartData.length > 0 ? (
                            <ResponsiveContainer>
                              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorLulus" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorBelum" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="year" stroke="#94a3b8" axisLine={false} tickLine={false} />
                                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <RechartsTooltip 
                                  contentStyle={{ 
                                    backgroundColor: '#ffffff', 
                                    borderRadius: '14px', 
                                    border: '1px solid #e2e8f0', 
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' 
                                  }} 
                                />
                                <Legend wrapperStyle={{ paddingTop: '15px' }} iconType="circle" />
                                <Area type="monotone" dataKey="Memenuhi Syarat" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLulus)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Area type="monotone" dataKey="Belum Memenuhi" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorBelum)" activeDot={{ r: 6, strokeWidth: 0 }} />
                              </AreaChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                              <i className="bi bi-inbox fs-3 me-2"></i> Belum ada data tren tersedia
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* GRAFIK 2: PROPORSI KELULUSAN */}
                    <div className="col-lg-4">
                      <div className="dash-card h-100 position-relative">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <h5 className="fw-bold text-dark mb-1">
                              <i className="bi bi-pie-chart-fill text-warning me-2"></i>
                              Rasio Capaian {tahunFilter === 'all' ? 'Keseluruhan' : tahunFilter}
                            </h5>
                            <span className="text-muted small">Proporsi pemenuhan target</span>
                          </div>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill small">
                            {totalPegawai} ASN
                          </span>
                        </div>

                        <div className="position-relative" style={{ width: '100%', height: 260 }}>
                          {totalPegawai > 0 ? (
                            <>
                              <ResponsiveContainer>
                                <PieChart>
                                  <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={72}
                                    outerRadius={105}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    {pieData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                                    formatter={(value: any) => [`${value} Pegawai`, '']}
                                  />
                                </PieChart>
                              </ResponsiveContainer>

                              <div className="dash-donut-center">
                                <div className="fw-bold text-dark fs-3 lh-1">{percentLulus}%</div>
                                <div className="text-muted small fw-semibold">Tuntas</div>
                              </div>
                            </>
                          ) : (
                            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                              <i className="bi bi-pie-chart fs-3 me-2"></i> Data kosong
                            </div>
                          )}
                        </div>

                        {/* Rangkuman breakdown di bawah donat */}
                        <div className="row g-2 mt-3">
                          <div className="col-6">
                            <div className="p-2 rounded-3 border bg-light text-center">
                              <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                                <span className="text-muted small fw-semibold">Memenuhi</span>
                              </div>
                              <div className="fw-bold text-success fs-5">{lulus} <span className="fs-6 fw-normal text-muted">org</span></div>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="p-2 rounded-3 border bg-light text-center">
                              <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                                <span className="text-muted small fw-semibold">Belum</span>
                              </div>
                              <div className="fw-bold text-warning-emphasis fs-5">{belum} <span className="fs-6 fw-normal text-muted">org</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })()}

              {/* DATA PEGAWAI TAB */}
              {activeTab === 'view-pegawai' && (() => {
                const filteredPegawaiList = pegawaiList.filter(p => {
                  if (!searchPegawai) return true;
                  const query = searchPegawai.toLowerCase();
                  return (p.nama && p.nama.toLowerCase().includes(query)) || 
                         (p.nip && p.nip.toLowerCase().includes(query));
                });
                
                return (
                <div className="table-card">
                  <div className="d-flex flex-column mb-4 gap-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="fw-bold mb-0">Master Data Pegawai</h5>
                      <div className="d-flex gap-2">
                        <div className="position-relative">
                          <input 
                            type="text" 
                            className="form-control form-control-sm pe-4" 
                            placeholder="Cari Nama / NIP..." 
                            value={searchPegawai}
                            onChange={e => setSearchPegawai(e.target.value)}
                          />
                          <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-2 text-muted" style={{fontSize: '0.8rem'}}></i>
                        </div>
                        {userRole === 'super_admin' && (
                          <button className="btn btn-sm btn-primary" onClick={() => {
                            setPegawaiForm({ isEdit: false, password: '123', status_aktif: 'Aktif', jp: 0, email: '' });
                            setShowPegawaiModal(true);
                          }}>
                            <i className="bi bi-person-plus me-1"></i> Tambah Pegawai
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-secondary fs-6">Seluruh Pegawai: {pegawaiList.length}</span>
                        <span className="badge bg-primary fs-6">PNS: {pnsList.length}</span>
                        <span className="badge bg-info text-dark fs-6">PPPK: {pppkList.length}</span>
                      </div>
                      {userRole === 'super_admin' && (
                        <div className="dropdown">
                          <button className="btn btn-sm btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="bi bi-file-earmark-excel me-1"></i> Export Excel
                          </button>
                          <ul className="dropdown-menu">
                            <li><button className="dropdown-item" onClick={exportToExcelDataPegawai}>Semua</button></li>
                            <li><button className="dropdown-item" onClick={exportToExcelDataPegawaiPNS}>PNS</button></li>
                            <li><button className="dropdown-item" onClick={exportToExcelDataPegawaiPPPK}>PPPK</button></li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle" style={{ fontSize: '0.85rem' }}>
                      <thead className="table-light">
                        <tr>
                          <th>No</th>
                          <th>NIP</th>
                          <th>Nama Pegawai</th>
                          <th>Status Aktif</th>
                          <th>Jabatan</th>
                          <th>Unit Kerja</th>
                          <th className="text-center">Total JP</th>
                          <th className="text-center" style={{ width: '130px' }}>Approval IDP</th>
                          <th className="text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPegawaiList.slice((currentPagePegawai - 1) * ITEMS_PER_PAGE, currentPagePegawai * ITEMS_PER_PAGE).map((p, index) => (
                          <tr key={index}>
                            <td>{(currentPagePegawai - 1) * ITEMS_PER_PAGE + index + 1}</td>
                            <td>{p.nip}</td>
                            <td className="fw-bold">
                              {p.nama || '-'}
                              {p.email && <div className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}><i className="bi bi-envelope me-1"></i>{p.email}</div>}
                            </td>
                            <td>{p.status_aktif || 'Aktif'}</td>
                            <td>{p.jabatan || '-'}</td>
                            <td>{p.unit_kerja || '-'}</td>
                            <td className="text-center"><span className="fw-bold text-primary">{p.jp} JP</span></td>
                            <td className="text-center">
                              {userRole === 'super_admin' ? (
                                <button 
                                  className={`btn btn-sm ${p.role === 'admin' || p.role === 'super_admin' ? 'btn-success' : 'btn-outline-secondary'}`}
                                  onClick={() => {
                                    if (p.role === 'super_admin') {
                                      alert('Tidak dapat mengubah akses Super Admin');
                                      return;
                                    }
                                    toggleAdminRole(p);
                                  }}
                                  title={p.role === 'admin' ? 'Cabut Izin Approval IDP' : 'Berikan Izin Approval IDP'}
                                >
                                  {p.role === 'admin' || p.role === 'super_admin' ? <><i className="bi bi-check-circle-fill"></i> Aktif</> : 'Nonaktif'}
                                </button>
                              ) : (
                                <span className={`badge ${p.role === 'admin' || p.role === 'super_admin' ? 'bg-success' : 'bg-secondary'}`}>
                                  {p.role === 'super_admin' ? 'Super Admin' : p.role === 'admin' ? 'Admin / Atasan' : 'Pegawai'}
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              <button className="btn btn-sm btn-outline-info me-1" title="Lihat Profil" onClick={() => { setSelectedPegawai(p); setShowModal(true); }}><i className="bi bi-eye"></i></button>
                              {userRole === 'super_admin' && (
                                <>
                                  <button className="btn btn-sm btn-outline-primary me-1" title="Edit Pegawai" onClick={() => {
                                    const jenkelOptions = ['LAKI-LAKI', 'PEREMPUAN'];
                                    let matchedJenkel = p.jenkel || '';
                                    if (p.jenkel) {
                                      const found = jenkelOptions.find(o => o.toLowerCase() === p.jenkel.trim().toLowerCase());
                                      if (found) matchedJenkel = found;
                                    }

                                    let matchedUnitKerja = p.unit_kerja || "";
                                    if (p.unit_kerja) {
                                      const found = UNIT_KERJA_OPTIONS.find(o => o.toLowerCase() === p.unit_kerja.trim().toLowerCase());
                                      if (found) matchedUnitKerja = found;
                                    }

                                    let matchedStatusPegawai = p.status_pegawai || '';
                                    if (matchedStatusPegawai.includes('PNS')) matchedStatusPegawai = 'PNS';
                                    else if (matchedStatusPegawai.includes('PPPK') || matchedStatusPegawai.includes('P3K')) matchedStatusPegawai = 'PPPK';
                                    else if (matchedStatusPegawai.includes('PW')) matchedStatusPegawai = 'PW';

                                    // Safely build golonganPangkat
                                    let builtGolongan = '';
                                    if (p.golongan && p.golongan !== '-') {
                                      const pGolonganTrimmed = p.golongan.trim().toLowerCase();
                                      if (matchedStatusPegawai === 'PNS') {
                                        const pnsOptions = [
                                          "I/a - Juru Muda", "I/b - Juru Muda Tk. I", "I/c - Juru", "I/d - Juru Tk. I", 
                                          "II/a - Pengatur Muda", "II/b - Pengatur Muda Tk. I", "II/c - Pengatur", "II/d - Pengatur Tk. I", 
                                          "III/a - Penata Muda", "III/b - Penata Muda Tk. I", "III/c - Penata", "III/d - Penata Tk. I", 
                                          "IV/a - Pembina", "IV/b - Pembina Tk. I", "IV/c - Pembina Utama Muda", "IV/d - Pembina Utama Madya", "IV/e - Pembina Utama"
                                        ];
                                        const matched = pnsOptions.find(o => o.toLowerCase().startsWith(pGolonganTrimmed));
                                        if (matched) builtGolongan = matched;
                                        else builtGolongan = p.golongan.trim() + (p.pangkat && p.pangkat !== '-' && p.pangkat !== 'Tidak Ada' ? ` - ${p.pangkat.trim()}` : '');
                                      } else if (matchedStatusPegawai === 'PPPK') {
                                        const pppkOptions = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII"].map(g => `Golongan ${g}`);
                                        const matched = pppkOptions.find(o => o.toLowerCase() === pGolonganTrimmed || o.toLowerCase().replace('golongan ', '') === pGolonganTrimmed.replace('golongan ', ''));
                                        if (matched) builtGolongan = matched;
                                        else builtGolongan = p.golongan.trim();
                                      } else {
                                        builtGolongan = p.golongan.trim();
                                      }
                                    }

                                    setPegawaiForm({ 
                                      ...p, 
                                      status_pegawai: matchedStatusPegawai,
                                      jenkel: matchedJenkel,
                                      unit_kerja: matchedUnitKerja,
                                      isEdit: true,
                                      golonganPangkat: builtGolongan
                                    });
                                    setShowPegawaiModal(true);
                                  }}><i className="bi bi-pencil"></i></button>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => hapusPegawai(p.nip, p.nama)} title="Hapus Pegawai"><i className="bi bi-trash"></i></button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls currentPage={currentPagePegawai} setCurrentPage={setCurrentPagePegawai} totalItems={filteredPegawaiList.length} />
                </div>
              );})()}

              {/* REKAP SERTIFIKASI TAB */}
              {activeTab === 'view-sertifikasi' && (() => {
                return (
                  <div className="table-card">
                    <div className="d-flex flex-column mb-4 gap-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold mb-0">Rekapitulasi Sertifikasi per OPD</h5>
                        <div className="d-flex gap-2">
                          <div className="position-relative">
                            <input 
                              type="text" 
                              className="form-control form-control-sm pe-4" 
                              placeholder="Cari Nama / NIP..." 
                              value={searchSertifikasi}
                              onChange={e => setSearchSertifikasi(e.target.value)}
                            />
                            <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-2 text-muted" style={{fontSize: '0.8rem'}}></i>
                          </div>
                        </div>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-secondary fs-6">Total Pegawai: {pegawaiList.length}</span>
                          <span className="badge bg-success fs-6">Memenuhi: {pegawaiList.filter(p => checkLulusJP(p)).length}</span>
                          <span className="badge bg-warning text-dark fs-6">Belum: {pegawaiList.filter(p => !checkLulusJP(p)).length}</span>
                          <span className="badge bg-primary fs-6 ms-2">PNS: {pnsList.length}</span>
                          <span className="badge bg-info text-dark fs-6">PPPK: {pppkList.length}</span>
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                          <select 
                            className="form-select form-select-sm border-secondary shadow-sm" 
                            style={{ width: '180px', cursor: 'pointer' }}
                            value={exportJenisKursusFilter}
                            onChange={(e) => setExportJenisKursusFilter(e.target.value)}
                          >
                            <option value="all">Semua Jenis Kursus</option>
                            <option value="Webinar">Webinar</option>
                            <option value="Sertifikasi">Sertifikasi</option>
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
                          {userRole === 'super_admin' && (
                            <>
                              <div className="dropdown">
                                <button className="btn btn-sm btn-success dropdown-toggle shadow-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                  <i className="bi bi-file-earmark-excel me-1"></i> Export Excel
                                </button>
                                <ul className="dropdown-menu">
                                  <li><button className="dropdown-item" onClick={exportToExcelSert}>Semua</button></li>
                                  <li><button className="dropdown-item" onClick={exportToExcelSertPNS}>PNS</button></li>
                                  <li><button className="dropdown-item" onClick={exportToExcelSertPPPK}>PPPK</button></li>
                                </ul>
                              </div>
                              <button 
                                className="btn btn-sm btn-outline-success shadow-sm" 
                                onClick={downloadTemplateSertifikasi}
                                title="Download format Excel untuk input massal kegiatan (misal: Rabu Bertamu)"
                              >
                                <i className="bi bi-download me-1"></i> Download Template
                              </button>
                              <button 
                                className="btn btn-sm btn-primary shadow-sm" 
                                onClick={() => { setShowImportSertifikasiModal(true); setImportResult(null); }}
                                title="Upload file Excel sertifikasi massal"
                              >
                                <i className="bi bi-file-earmark-arrow-up me-1"></i> Upload Template Sertifikasi
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="accordion" id="accordionOPD">
                      {(() => {
                        const paginatedOPDs = filteredOPDs.slice((currentPageSert - 1) * ITEMS_PER_PAGE, currentPageSert * ITEMS_PER_PAGE);

                        return (
                          <>
                            {paginatedOPDs.map((opd, opdIndex) => {
                              const opdPegawai = processedOPDs[opd];

                              return (
                                <div className="accordion-item mb-2 border rounded" key={opdIndex}>
                                  <h2 className="accordion-header">
                                    <button 
                                      className={`accordion-button fw-bold ${openOPD === opd ? '' : 'collapsed'}`} 
                                      type="button" 
                                      onClick={() => setOpenOPD(openOPD === opd ? null : opd)}
                                    >
                                      {opd} <span className="badge bg-secondary ms-2">{opdPegawai.length} Pegawai</span>
                                    </button>
                                  </h2>
                                  {openOPD === opd && (() => {
                                    const pagePegawai = pagePegawaiPerOPD[opd] || 1;
                                    const totalPegawaiOPD = opdPegawai.length;
                                    const totalPagesPegawaiOPD = Math.ceil(totalPegawaiOPD / ITEMS_PER_PAGE_PEGAWAI);
                                    const paginatedPegawai = opdPegawai.slice((pagePegawai - 1) * ITEMS_PER_PAGE_PEGAWAI, pagePegawai * ITEMS_PER_PAGE_PEGAWAI);

                                    return (
                                    <div className="accordion-collapse">
                                      <div className="accordion-body p-0 border-top">
                                        <div className="table-responsive">
                                          <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                                            <thead className="table-light">
                                              <tr>
                                                <th>No</th>
                                                <th>NIP</th>
                                                <th>Nama Pegawai</th>
                                                <th>Jabatan</th>
                                                <th className="text-center">Total JP</th>
                                                <th className="text-center">Aksi</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {paginatedPegawai.length === 0 ? (
                                                <tr>
                                                  <td colSpan={6} className="text-center py-3 text-muted">Belum ada pegawai di OPD ini.</td>
                                                </tr>
                                              ) : (
                                                paginatedPegawai.map((p, pIndex) => (
                                                  <tr key={p.nip || pIndex}>
                                                    <td>{(pagePegawai - 1) * ITEMS_PER_PAGE_PEGAWAI + pIndex + 1}</td>
                                                    <td>{p.nip}</td>
                                                    <td className="fw-bold">{p.nama || '-'}</td>
                                                    <td>{p.jabatan || '-'}</td>
                                                    <td className="text-center"><span className="fw-bold text-primary">{p.jp} JP</span></td>
                                                    <td className="text-center">
                                                      <button className="btn btn-sm btn-outline-info" title="Lihat Detail Sertifikat" onClick={() => { setSelectedPegawai(p); setShowModal(true); }}>
                                                        <i className="bi bi-eye"></i> Detail
                                                      </button>
                                                    </td>
                                                  </tr>
                                                ))
                                              )}
                                            </tbody>
                                          </table>
                                        </div>

                                        {totalPagesPegawaiOPD > 1 && (
                                          <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-light border-top">
                                            <span className="small text-muted fw-semibold">
                                              Halaman {pagePegawai} dari {totalPagesPegawaiOPD} ({totalPegawaiOPD} Pegawai - 5 per halaman)
                                            </span>
                                            <div className="d-flex gap-1">
                                              <button 
                                                className="btn btn-outline-secondary btn-sm py-1 px-2" 
                                                style={{ fontSize: '0.78rem' }}
                                                disabled={pagePegawai === 1} 
                                                onClick={() => setPagePegawaiPerOPD(prev => ({ ...prev, [opd]: pagePegawai - 1 }))}
                                              >
                                                Prev
                                              </button>
                                              <button 
                                                className="btn btn-outline-secondary btn-sm py-1 px-2" 
                                                style={{ fontSize: '0.78rem' }}
                                                disabled={pagePegawai === totalPagesPegawaiOPD} 
                                                onClick={() => setPagePegawaiPerOPD(prev => ({ ...prev, [opd]: pagePegawai + 1 }))}
                                              >
                                                Next
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    );
                                  })()}
                                </div>
                              );
                            })}
                            <PaginationControls currentPage={currentPageSert} setCurrentPage={setCurrentPageSert} totalItems={filteredOPDs.length} />
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}

              {/* TREN TAHUNAN OPD TAB */}
              {userRole === 'super_admin' && activeTab === 'view-tren' && (
                <div>
                  {/* KPI Summary Cards */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-sm-6 col-xl-3">
                      <div className="stat-card">
                        <div className="stat-icon bg-info-subtle text-info">
                          <i className="bi bi-buildings"></i>
                        </div>
                        <div>
                          <div className="text-secondary small fw-bold text-uppercase">Total OPD Terdata</div>
                          <h3 className="fw-bold mb-0 mt-1">{opdTrendData.length}</h3>
                          <div className="text-muted small mt-1">Perangkat Daerah</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6 col-xl-3">
                      <div className="stat-card">
                        <div className="stat-icon bg-success-subtle text-success">
                          <i className="bi bi-graph-up-arrow"></i>
                        </div>
                        <div>
                          <div className="text-secondary small fw-bold text-uppercase">Tren Meningkat</div>
                          <h3 className="fw-bold text-success mb-0 mt-1">{countNaik} <span className="fs-6 fw-normal text-muted">OPD</span></h3>
                          <div className="text-success small mt-1"><i className="bi bi-check-circle-fill me-1"></i>Kinerja Naik Tiap Tahun</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6 col-xl-3">
                      <div className="stat-card">
                        <div className="stat-icon bg-danger-subtle text-danger">
                          <i className="bi bi-graph-down-arrow"></i>
                        </div>
                        <div>
                          <div className="text-secondary small fw-bold text-uppercase">Tren Menurun</div>
                          <h3 className="fw-bold text-danger mb-0 mt-1">{countTurun} <span className="fs-6 fw-normal text-muted">OPD</span></h3>
                          <div className="text-danger small mt-1"><i className="bi bi-exclamation-triangle-fill me-1"></i>Perlu Evaluasi Diklat</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6 col-xl-3">
                      <div className="stat-card">
                        <div className="stat-icon bg-warning-subtle text-warning">
                          <i className="bi bi-activity"></i>
                        </div>
                        <div>
                          <div className="text-secondary small fw-bold text-uppercase">Fluktuatif / Stabil</div>
                          <h3 className="fw-bold text-warning-emphasis mb-0 mt-1">{countFluktuatif + countStabil} <span className="fs-6 fw-normal text-muted">OPD</span></h3>
                          <div className="text-muted small mt-1">Naik-Turun / Konsisten</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart Card */}
                  <div className="table-card mb-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                      <div>
                        <h5 className="fw-bold mb-1">
                          <i className="bi bi-graph-up text-primary me-2"></i>
                          Visualisasi Tren Pemenuhan 20 JP per Tahun
                        </h5>
                        <p className="text-muted small mb-0">
                          {selectedOpdChart === 'all' 
                            ? 'Menampilkan rata-rata capaian seluruh OPD se-Kabupaten Bangka Barat' 
                            : `Menampilkan tren capaian: ${selectedOpdChart}`}
                        </p>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small fw-bold">Pilih OPD:</span>
                        <select 
                          className="form-select form-select-sm border-secondary shadow-sm"
                          style={{ maxWidth: '280px', fontWeight: 'bold' }}
                          value={selectedOpdChart}
                          onChange={(e) => setSelectedOpdChart(e.target.value)}
                        >
                          <option value="all">Semua OPD (Rata-rata Kabupaten)</option>
                          {sortedOPDs.map((opd, i) => (
                            <option key={i} value={opd}>{opd}</option>
                          ))}
                        </select>
                        {selectedOpdChart !== 'all' && (
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setSelectedOpdChart('all')}
                            title="Reset ke semua OPD"
                          >
                            <i className="bi bi-arrow-counterclockwise"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ width: '100%', height: 320 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={currentChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="tahun" stroke="#64748b" />
                          <YAxis yAxisId="left" domain={[0, 100]} unit="%" stroke="#10b981" />
                          <YAxis yAxisId="right" orientation="right" unit=" JP" stroke="#6366f1" />
                          <RechartsTooltip 
                            contentStyle={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                            formatter={(value: any, name: any) => [
                              name === 'Persentase Capai Target (%)' ? `${value}%` : `${value} JP`,
                              name
                            ]}
                          />
                          <Legend />
                          <Line 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="Persentase Capai Target (%)" 
                            stroke="#10b981" 
                            strokeWidth={3} 
                            dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                            activeDot={{ r: 8 }} 
                          />
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="Rata-rata JP" 
                            stroke="#6366f1" 
                            strokeWidth={3} 
                            strokeDasharray="4 4" 
                            dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} 
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Matriks Table Card */}
                  <div className="table-card">
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
                      <div>
                        <h5 className="fw-bold mb-1">
                          <i className="bi bi-table text-primary me-2"></i>
                          Matriks Rekapitulasi Tahunan (5 per Halaman)
                        </h5>
                        <p className="text-muted small mb-0">
                          Membandingkan capaian pemenuhan jam pelajaran (JP) ASN antar tahun (Target 20 JP PNS / 24 JP PPPK).
                        </p>
                      </div>

                      {/* Mode Switcher: Rekap per Pegawai vs Rekap per OPD */}
                      <div className="btn-group p-1 bg-light rounded-pill border shadow-sm" role="group">
                        <button 
                          type="button" 
                          className={`btn btn-sm rounded-pill px-3 fw-bold ${trenViewMode === 'pegawai' ? 'btn-primary text-white shadow-sm' : 'btn-light text-secondary border-0'}`}
                          onClick={() => setTrenViewMode('pegawai')}
                        >
                          <i className="bi bi-people-fill me-1"></i> Rekap per Pegawai (5/Hal)
                        </button>
                        <button 
                          type="button" 
                          className={`btn btn-sm rounded-pill px-3 fw-bold ${trenViewMode === 'opd' ? 'btn-primary text-white shadow-sm' : 'btn-light text-secondary border-0'}`}
                          onClick={() => setTrenViewMode('opd')}
                        >
                          <i className="bi bi-buildings-fill me-1"></i> Rekap per OPD (5/Hal)
                        </button>
                      </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-4 p-3 bg-light rounded-4 border">
                      <div className="d-flex flex-wrap gap-2 align-items-center flex-grow-1">
                        <div className="position-relative" style={{ minWidth: '220px', maxWidth: '300px' }}>
                          <input 
                            type="text" 
                            className="form-control form-control-sm pe-4" 
                            placeholder={trenViewMode === 'pegawai' ? "Cari Nama Pegawai, NIP, OPD..." : "Cari Nama OPD..."}
                            value={searchTren}
                            onChange={e => setSearchTren(e.target.value)}
                          />
                          <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-2 text-muted" style={{fontSize: '0.8rem'}}></i>
                        </div>

                        {trenViewMode === 'pegawai' && (
                          <select 
                            className="form-select form-select-sm border-secondary shadow-sm"
                            style={{ maxWidth: '240px', cursor: 'pointer' }}
                            value={filterTrenOpd}
                            onChange={(e: any) => setFilterTrenOpd(e.target.value)}
                          >
                            <option value="all">Semua OPD / Unit Kerja</option>
                            {sortedOPDs.map((opd, i) => (
                              <option key={i} value={opd}>{opd}</option>
                            ))}
                          </select>
                        )}

                        <select 
                          className="form-select form-select-sm border-secondary shadow-sm"
                          style={{ width: '175px', cursor: 'pointer' }}
                          value={filterTrenStatus}
                          onChange={(e: any) => setFilterTrenStatus(e.target.value)}
                        >
                          <option value="all">Semua Status Tren</option>
                          <option value="naik">📈 Tren Naik (Meningkat)</option>
                          <option value="turun">📉 Tren Turun (Menurun)</option>
                          {trenViewMode === 'opd' && <option value="fluktuatif">〰️ Fluktuatif</option>}
                          <option value="stabil">➡️ Stabil</option>
                        </select>
                      </div>

                      {userRole === 'super_admin' && (
                        <button className="btn btn-sm btn-success shadow-sm" onClick={exportTrenToExcel}>
                          <i className="bi bi-file-earmark-excel me-1"></i> {trenViewMode === 'pegawai' ? 'Export Excel Pegawai' : 'Export Excel Rekap OPD'}
                        </button>
                      )}
                    </div>

                    {/* TAMPILAN 1: REKAP PER PEGAWAI (5 PER HALAMAN) */}
                    {trenViewMode === 'pegawai' && (
                      <>
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                            <thead className="table-light">
                              <tr>
                                <th style={{ width: '50px' }}>No</th>
                                <th>Nama Pegawai & NIP</th>
                                <th>Unit Kerja / OPD</th>
                                <th className="text-center" style={{ width: '90px' }}>Status</th>
                                {trendYears.map(year => (
                                  <th key={year} className="text-center" style={{ minWidth: '120px' }}>
                                    Capaian {year}
                                  </th>
                                ))}
                                <th className="text-center" style={{ width: '130px' }}>Status Tren</th>
                                <th className="text-center" style={{ width: '100px' }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedPegawaiTrend.length === 0 ? (
                                <tr>
                                  <td colSpan={6 + trendYears.length} className="text-center py-5 text-muted">
                                    <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                                    Tidak ada data pegawai yang sesuai dengan filter.
                                  </td>
                                </tr>
                              ) : (
                                paginatedPegawaiTrend.map((p: any, idx: number) => {
                                  const rowNumber = (currentPageTrenPegawai - 1) * ITEMS_PER_PAGE_PEGAWAI + idx + 1;
                                  return (
                                    <tr key={p.nip || idx}>
                                      <td>{rowNumber}</td>
                                      <td>
                                        <div className="fw-bold text-dark">{p.nama || '-'}</div>
                                        <div className="text-muted small">NIP: {p.nip || '-'}</div>
                                      </td>
                                      <td>
                                        <div className="text-secondary small fw-medium">{p.unit_kerja || '-'}</div>
                                      </td>
                                      <td className="text-center">
                                        <span className={`badge ${p.status_pegawai === 'PNS' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info-emphasis'}`} style={{ fontSize: '0.75rem' }}>
                                          {p.status_pegawai || 'ASN'}
                                        </span>
                                      </td>
                                      {trendYears.map(year => {
                                        const jp = p.yearlyJp?.[year] || 0;
                                        const isLulus = p.yearlyLulus?.[year];
                                        const badgeBg = isLulus ? 'bg-success' : jp > 0 ? 'bg-warning text-dark' : 'bg-light text-muted border';
                                        return (
                                          <td key={year} className="text-center">
                                            <span className={`badge ${badgeBg} px-2 py-1`} style={{ fontSize: '0.78rem' }}>
                                              {jp} JP
                                            </span>
                                            <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                                              {isLulus ? 'Memenuhi' : jp > 0 ? 'Belum' : '0 JP'}
                                            </div>
                                          </td>
                                        );
                                      })}
                                      <td className="text-center">
                                        {p.statusTren === 'naik' && (
                                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                                            <i className="bi bi-arrow-up-right me-1"></i> Naik
                                          </span>
                                        )}
                                        {p.statusTren === 'turun' && (
                                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                                            <i className="bi bi-arrow-down-right me-1"></i> Turun
                                          </span>
                                        )}
                                        {p.statusTren === 'stabil' && (
                                          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">
                                            <i className="bi bi-dash me-1"></i> Stabil
                                          </span>
                                        )}
                                      </td>
                                      <td className="text-center">
                                        <button 
                                          className="btn btn-sm btn-outline-info py-1 px-2"
                                          style={{ fontSize: '0.78rem' }}
                                          onClick={() => { setSelectedPegawai(p); setShowModal(true); }}
                                          title="Lihat Detail Pegawai"
                                        >
                                          <i className="bi bi-eye me-1"></i> Detail
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        <PaginationControls 
                          currentPage={currentPageTrenPegawai} 
                          setCurrentPage={setCurrentPageTrenPegawai} 
                          totalItems={filteredPegawaiTrendList.length} 
                          itemsPerPage={ITEMS_PER_PAGE_PEGAWAI}
                        />
                      </>
                    )}

                    {/* TAMPILAN 2: REKAP PER OPD (5 PER HALAMAN) */}
                    {trenViewMode === 'opd' && (
                      <>
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                            <thead className="table-light">
                              <tr>
                                <th style={{ width: '50px' }}>No</th>
                                <th>Perangkat Daerah (OPD)</th>
                                <th className="text-center" style={{ width: '110px' }}>Pegawai</th>
                                {trendYears.map(year => (
                                  <th key={year} className="text-center" style={{ minWidth: '130px' }}>
                                    Capaian {year}
                                  </th>
                                ))}
                                <th className="text-center" style={{ width: '140px' }}>Status Tren</th>
                                <th className="text-center" style={{ width: '110px' }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedOpdTrend.length === 0 ? (
                                <tr>
                                  <td colSpan={5 + trendYears.length} className="text-center py-4 text-muted">
                                    <i className="bi bi-inbox fs-4 d-block mb-1"></i>
                                    Tidak ada data OPD yang cocok dengan pencarian.
                                  </td>
                                </tr>
                              ) : (
                                paginatedOpdTrend.map((item, idx) => {
                                  const rowNumber = (currentPageTren - 1) * ITEMS_PER_PAGE_TREN + idx + 1;
                                  const isExpanded = expandedTrenOpd === item.opd;

                                  return (
                                    <Fragment key={idx}>
                                      <tr className={selectedOpdChart === item.opd ? 'table-primary' : ''}>
                                        <td>{rowNumber}</td>
                                        <td>
                                          <div className="fw-bold text-dark">{item.opd}</div>
                                        </td>
                                        <td className="text-center">
                                          <button 
                                            type="button"
                                            className={`btn btn-sm ${isExpanded ? 'btn-primary text-white' : 'btn-light border text-dark'} py-0 px-2 shadow-none`}
                                            style={{ fontSize: '0.8rem' }}
                                            onClick={() => {
                                              if (isExpanded) {
                                                setExpandedTrenOpd(null);
                                              } else {
                                                setExpandedTrenOpd(item.opd);
                                                setPageTrenPegawai(1);
                                              }
                                            }}
                                            title="Klik untuk membuka daftar 5 pegawai per halaman di OPD ini"
                                          >
                                            <i className="bi bi-people-fill me-1"></i>
                                            {item.totalMembers} org
                                            <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} ms-1`} style={{ fontSize: '0.68rem' }}></i>
                                          </button>
                                        </td>
                                        {trendYears.map(year => {
                                          const stats = item.yearlyStats[year] || { lulus: 0, persentase: 0 };
                                          const pct = stats.persentase;
                                          const badgeColor = pct >= 60 ? 'bg-success' : pct >= 25 ? 'bg-warning text-dark' : pct > 0 ? 'bg-info text-dark' : 'bg-secondary';
                                          return (
                                            <td key={year} className="text-center">
                                              <div className="d-flex flex-column align-items-center">
                                                <div className="d-flex align-items-center gap-1">
                                                  <span className="fw-bold small">{stats.lulus}</span>
                                                  <span className="text-muted" style={{fontSize: '0.75rem'}}>/{item.totalMembers}</span>
                                                  <span className={`badge ${badgeColor} ms-1`} style={{ fontSize: '0.75rem' }}>
                                                    {pct}%
                                                  </span>
                                                </div>
                                                <div className="progress w-100 mt-1" style={{ height: '4px', maxWidth: '80px', background: '#e2e8f0' }}>
                                                  <div 
                                                    className={`progress-bar ${pct >= 60 ? 'bg-success' : pct >= 25 ? 'bg-warning' : 'bg-primary'}`} 
                                                    style={{ width: `${Math.min(100, pct)}%` }}
                                                  ></div>
                                                </div>
                                              </div>
                                            </td>
                                          );
                                        })}
                                        <td className="text-center">
                                          {item.statusTren === 'naik' && (
                                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                                              <i className="bi bi-arrow-up-right me-1"></i> Naik
                                            </span>
                                          )}
                                          {item.statusTren === 'turun' && (
                                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                                              <i className="bi bi-arrow-down-right me-1"></i> Turun
                                            </span>
                                          )}
                                          {item.statusTren === 'fluktuatif' && (
                                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
                                              <i className="bi bi-arrow-left-right me-1"></i> Fluktuatif
                                            </span>
                                          )}
                                          {item.statusTren === 'stabil' && (
                                            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">
                                              <i className="bi bi-dash me-1"></i> Stabil
                                            </span>
                                          )}
                                        </td>
                                        <td className="text-center">
                                          <button 
                                            className={`btn btn-sm ${selectedOpdChart === item.opd ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => {
                                              setSelectedOpdChart(item.opd);
                                              window.scrollTo({ top: 120, behavior: 'smooth' });
                                            }}
                                            title="Fokus grafik pada OPD ini"
                                          >
                                            <i className="bi bi-graph-up me-1"></i> Grafik
                                          </button>
                                        </td>
                                      </tr>

                                      {isExpanded && (() => {
                                        const opdMembers = groupedByOPD[item.opd] || [];
                                        const totalMembersCount = opdMembers.length;
                                        const totalPagesMembers = Math.ceil(totalMembersCount / ITEMS_PER_PAGE_PEGAWAI);
                                        const pagedMembers = opdMembers.slice((pageTrenPegawai - 1) * ITEMS_PER_PAGE_PEGAWAI, pageTrenPegawai * ITEMS_PER_PAGE_PEGAWAI);

                                        return (
                                          <tr className="table-light">
                                            <td colSpan={5 + trendYears.length} className="p-3 bg-white border">
                                              <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="fw-bold text-dark small">
                                                  <i className="bi bi-person-lines-fill text-primary me-2"></i>
                                                  Daftar Pegawai di {item.opd} (5 per halaman)
                                                </div>
                                                <span className="badge bg-secondary-subtle text-secondary border small">
                                                  Total {totalMembersCount} Pegawai
                                                </span>
                                              </div>

                                              <div className="table-responsive">
                                                <table className="table table-sm table-bordered table-hover align-middle mb-2 bg-white" style={{ fontSize: '0.82rem' }}>
                                                  <thead className="table-light">
                                                    <tr>
                                                      <th style={{ width: '40px' }}>No</th>
                                                      <th>Nama Pegawai</th>
                                                      <th>NIP</th>
                                                      <th>Status</th>
                                                      {trendYears.map(yr => (
                                                        <th key={yr} className="text-center">JP {yr}</th>
                                                      ))}
                                                      <th className="text-center">Aksi</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {pagedMembers.length === 0 ? (
                                                      <tr>
                                                        <td colSpan={5 + trendYears.length} className="text-center py-3 text-muted">Belum ada data pegawai di OPD ini.</td>
                                                      </tr>
                                                    ) : (
                                                      pagedMembers.map((m, mIdx) => {
                                                        const rowNo = (pageTrenPegawai - 1) * ITEMS_PER_PAGE_PEGAWAI + mIdx + 1;
                                                        return (
                                                          <tr key={m.nip || mIdx}>
                                                            <td>{rowNo}</td>
                                                            <td className="fw-semibold text-dark">{m.nama || '-'}</td>
                                                            <td className="text-muted">{m.nip || '-'}</td>
                                                            <td>
                                                              <span className={`badge ${m.status_pegawai === 'PNS' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info-emphasis'}`} style={{ fontSize: '0.72rem' }}>
                                                                {m.status_pegawai || 'ASN'}
                                                              </span>
                                                            </td>
                                                            {trendYears.map(yr => {
                                                              const yrSerts = m.sertifikasi?.filter((s: any) => String(s.tahun) === String(yr)) || [];
                                                              const yrJp = yrSerts.reduce((acc: number, curr: any) => acc + (Number(curr.jumlah_jp) || 0), 0);
                                                              const isLulus = checkLulusJP({ ...m, jp: yrJp });
                                                              return (
                                                                <td key={yr} className="text-center">
                                                                  <span className={`badge ${isLulus ? 'bg-success' : yrJp > 0 ? 'bg-warning text-dark' : 'bg-light text-muted border'}`} style={{ fontSize: '0.75rem' }}>
                                                                    {yrJp} JP
                                                                  </span>
                                                                </td>
                                                              );
                                                            })}
                                                            <td className="text-center">
                                                              <button 
                                                                className="btn btn-sm btn-outline-info py-0 px-2"
                                                                style={{ fontSize: '0.75rem' }}
                                                                onClick={() => { setSelectedPegawai(m); setShowModal(true); }}
                                                                title="Lihat Detail Pegawai"
                                                              >
                                                                <i className="bi bi-eye"></i> Detail
                                                              </button>
                                                            </td>
                                                          </tr>
                                                        );
                                                      })
                                                    )}
                                                  </tbody>
                                                </table>
                                              </div>

                                              {totalPagesMembers > 1 && (
                                                <div className="d-flex justify-content-between align-items-center pt-2">
                                                  <span className="small text-muted fw-semibold">
                                                    Halaman {pageTrenPegawai} dari {totalPagesMembers} ({totalMembersCount} Pegawai - 5 per halaman)
                                                  </span>
                                                  <div className="d-flex gap-1">
                                                    <button 
                                                      className="btn btn-outline-secondary btn-sm py-1 px-2" 
                                                      style={{ fontSize: '0.78rem' }}
                                                      disabled={pageTrenPegawai === 1}
                                                      onClick={() => setPageTrenPegawai(p => p - 1)}
                                                    >
                                                      Prev
                                                    </button>
                                                    <button 
                                                      className="btn btn-outline-secondary btn-sm py-1 px-2" 
                                                      style={{ fontSize: '0.78rem' }}
                                                      disabled={pageTrenPegawai === totalPagesMembers}
                                                      onClick={() => setPageTrenPegawai(p => p + 1)}
                                                    >
                                                      Next
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })()}
                                    </Fragment>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        <PaginationControls 
                          currentPage={currentPageTren} 
                          setCurrentPage={setCurrentPageTren} 
                          totalItems={filteredOpdTrendList.length} 
                          itemsPerPage={ITEMS_PER_PAGE_TREN}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* APPROVAL IDP TAB */}
              {activeTab === 'view-idp' && (
                <div className="table-card">
                  <div className="alert alert-info border-0 shadow-sm rounded-4 mb-4 d-flex align-items-center gap-3 p-3">
                    <i className="bi bi-shield-check fs-2 text-primary"></i>
                    <div>
                      <div className="fw-bold text-dark">Sistem Verifikasi IDP Berlapis (2 Tahap):</div>
                      <div className="small text-muted">
                        <strong>Tahap 1 (Admin/Atasan OPD):</strong> Memverifikasi usulan kompetensi pegawai di instansi terkait untuk diteruskan ke BKPSDMD.<br/>
                        <strong>Tahap 2 (Admin Instansi BKPSDMD / Approval Nyata):</strong> Penentu keputusan final penetapan IDP. Jika BKPSDMD tidak menyetujui, maka usulan tetap <strong>TIDAK DISETUJUI</strong> meskipun telah disetujui oleh OPD.
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">Daftar Pengajuan IDP Pegawai</h5>
                    <div className="d-flex gap-2">
                      <div className="position-relative">
                        <input 
                          type="text" 
                          className="form-control form-control-sm pe-4" 
                          placeholder="Cari Nama / Kompetensi..." 
                          value={searchIdp}
                          onChange={e => setSearchIdp(e.target.value)}
                        />
                        <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-2 text-muted" style={{fontSize: '0.8rem'}}></i>
                      </div>
                      {userRole === 'super_admin' && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={exportIdpToExcel}>
                            <i className="bi bi-file-earmark-excel me-1"></i> Export Excel
                          </button>
                          <button className="btn btn-sm btn-primary" onClick={() => {
                            setIdpForm({ isEdit: false });
                            setShowIdpModal(true);
                          }}>
                            <i className="bi bi-plus-lg me-1"></i> Tambah IDP
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle" style={{fontSize: '0.85rem'}}>
                      <thead className="table-light">
                        <tr>
                          <th>No</th>
                          <th>Nama Pegawai</th>
                          <th>Jenis Kompetensi</th>
                          <th>Bentuk Pengembangan</th>
                          <th>Penyelenggara</th>
                          <th>Waktu</th>
                          <th>JP</th>
                          <th>Status Verifikasi</th>
                          <th className="text-center">Aksi Verifikasi {userRole === 'super_admin' ? '(BKPSDMD)' : '(OPD)'}</th>
                          {userRole === 'super_admin' && <th className="text-center">Aksi Admin</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          (() => {
                            const idpItems = pegawaiList.flatMap((p) => {
                              if (!p.idp || p.idp.length === 0) return [];
                              return p.idp.map((idp: any) => ({ p, idp }));
                            }).filter((item: any) => {
                              if (tahunFilter !== 'all') {
                                if (item.idp.tahun !== tahunFilter && (!item.idp.waktu_pelaksanaan_awal || !item.idp.waktu_pelaksanaan_awal.includes(tahunFilter))) return false;
                              }
                              if (!searchIdp) return true;
                              const query = searchIdp.toLowerCase();
                              return (item.p.nama && item.p.nama.toLowerCase().includes(query)) ||
                                     (item.p.nip && item.p.nip.toLowerCase().includes(query)) ||
                                     (item.idp.jenis_kompetensi && item.idp.jenis_kompetensi.toLowerCase().includes(query));
                            });
                            
                            if (idpItems.length === 0) return null;
                            
                            const paginatedIdp = idpItems.slice((currentPageIdp - 1) * ITEMS_PER_PAGE, currentPageIdp * ITEMS_PER_PAGE);
                            return (
                              <>
                                {paginatedIdp.map((item: any, idx: number) => {
                                  const displayNo = (currentPageIdp - 1) * ITEMS_PER_PAGE + idx + 1;
                                  const p = item.p;
                                  const idp = item.idp;
                                  return (
                                    <tr key={idp._rowIndex || item.p.nip + "-" + idx}>
                                      <td>{displayNo}</td>
                                      <td className="fw-bold">{p.nama}<br/><span className="text-muted fw-normal" style={{fontSize: '0.75rem'}}>{p.nip}</span></td>
                                      <td>{idp.jenis_kompetensi}</td>
                                      <td>{idp.jenis_pengembangan}<br/><span className="badge bg-secondary">{idp.jalur_pengembangan}</span></td>
                                      <td>{idp.penyelenggara}</td>
                                      <td>{idp.waktu_pelaksanaan_awal} s.d. {idp.waktu_pelaksanaan_akhir}</td>
                                      <td><span className="badge bg-info text-dark rounded-pill">{idp.jp} JP</span></td>
                                      <td>
                                        {idp.status === 'Disetujui' ? (
                                          <span className="badge bg-success"><i className="bi bi-check-circle-fill me-1"></i>Disetujui Final (BKPSDMD)</span>
                                        ) : (idp.status === 'Menunggu Persetujuan Admin' || idp.status === 'Menunggu Persetujuan BKPSDMD') ? (
                                          <div>
                                            <span className="badge bg-info text-dark"><i className="bi bi-arrow-right-circle me-1"></i>Disetujui OPD</span>
                                            <div className="text-muted mt-1" style={{fontSize: '0.7rem'}}>Menunggu Final BKPSDMD</div>
                                          </div>
                                        ) : (idp.status === 'Menunggu Persetujuan Ketua' || idp.status === 'Menunggu Persetujuan Atasan OPD' || !idp.status) ? (
                                          <span className="badge bg-warning text-dark"><i className="bi bi-clock-history me-1"></i>Menunggu Verifikasi OPD</span>
                                        ) : idp.status === 'Ditolak BKPSDMD' ? (
                                          <div>
                                            <span className="badge bg-danger"><i className="bi bi-x-circle-fill me-1"></i>Ditolak BKPSDMD</span>
                                            {idp.alasan_tolak && <div className="text-muted mt-1" style={{fontSize: '0.72rem', maxWidth: '170px'}}>Alasan: {idp.alasan_tolak}</div>}
                                          </div>
                                        ) : (idp.status === 'Ditolak OPD' || idp.status === 'Ditolak Atasan OPD') ? (
                                          <div>
                                            <span className="badge bg-danger"><i className="bi bi-x-circle-fill me-1"></i>Ditolak OPD</span>
                                            {idp.alasan_tolak && <div className="text-muted mt-1" style={{fontSize: '0.72rem', maxWidth: '170px'}}>Alasan: {idp.alasan_tolak}</div>}
                                          </div>
                                        ) : idp.status.toLowerCase().includes('ditolak') ? (
                                          <div>
                                            <span className="badge bg-danger"><i className="bi bi-x-circle-fill me-1"></i>{idp.status}</span>
                                            {idp.alasan_tolak && <div className="text-muted mt-1" style={{fontSize: '0.72rem', maxWidth: '170px'}}>Alasan: {idp.alasan_tolak}</div>}
                                          </div>
                                        ) : (
                                          <span className="badge bg-secondary">{idp.status}</span>
                                        )}
                                      </td>
                                      <td className="text-center">
                                        {userRole === 'admin' ? (
                                          /* AKSI VERIFIKASI ADMIN OPD (TAHAP 1) */
                                          p.nip === loggedInNip ? (
                                            <span className="badge bg-secondary-subtle text-secondary py-1 px-2 border" title="Pengajuan pribadi Anda">
                                              <i className="bi bi-person-fill me-1"></i>Pengajuan Pribadi
                                            </span>
                                          ) : (idp.status === 'Menunggu Persetujuan Ketua' || idp.status === 'Menunggu Persetujuan Atasan OPD' || !idp.status) ? (
                                            <div className="d-flex justify-content-center gap-1">
                                              <button 
                                                className="btn btn-sm btn-outline-success" 
                                                title="Setujui dan teruskan ke BKPSDMD" 
                                                onClick={() => updateIdpStatus(idp._rowIndex, 'Menunggu Persetujuan Admin', 'Setujui pengajuan IDP ini untuk diteruskan ke verifikasi tahap 2 (BKPSDMD)?')}
                                              >
                                                <i className="bi bi-check-lg me-1"></i>Setujui
                                              </button>
                                              <button 
                                                className="btn btn-sm btn-outline-danger" 
                                                title="Tolak Pengajuan IDP" 
                                                onClick={() => {
                                                  setIdpRejectData({
                                                    rowIndex: idp._rowIndex,
                                                    status: 'Ditolak OPD',
                                                    namaPegawai: p.nama,
                                                    kompetensi: idp.jenis_kompetensi
                                                  });
                                                  setRejectReason('Tidak tersedia anggaran');
                                                  setCustomReason('');
                                                }}
                                              >
                                                <i className="bi bi-x-lg me-1"></i>Tolak
                                              </button>
                                            </div>
                                          ) : (idp.status === 'Menunggu Persetujuan Admin' || idp.status === 'Menunggu Persetujuan BKPSDMD') ? (
                                            <span className="badge bg-info text-dark py-1 px-2"><i className="bi bi-check-circle me-1"></i>Disetujui OPD</span>
                                          ) : idp.status === 'Disetujui' ? (
                                            <span className="badge bg-success py-1 px-2"><i className="bi bi-check2-all me-1"></i>Disetujui Final</span>
                                          ) : (
                                            <span className="badge bg-danger py-1 px-2"><i className="bi bi-x-circle me-1"></i>Ditolak</span>
                                          )
                                        ) : (
                                          /* AKSI VERIFIKASI ADMIN BKPSDMD / SUPER ADMIN (TAHAP 2 - APPROVAL NYATA/FINAL) */
                                          p.nip === loggedInNip ? (
                                            <span className="badge bg-secondary-subtle text-secondary py-1 px-2 border" title="Pengajuan pribadi Anda">
                                              <i className="bi bi-person-fill me-1"></i>Pengajuan Pribadi
                                            </span>
                                          ) : (idp.status !== 'Disetujui' && !idp.status.toLowerCase().includes('ditolak')) ? (
                                            <div className="d-flex justify-content-center gap-1">
                                              <button 
                                                className="btn btn-sm btn-success" 
                                                title="Berikan Persetujuan Final (BKPSDMD)" 
                                                onClick={() => updateIdpStatus(idp._rowIndex, 'Disetujui', 'Berikan Persetujuan FINAL (BKPSDMD) pada pengajuan IDP ini?')}
                                              >
                                                <i className="bi bi-check-circle-fill me-1"></i>Setujui Final
                                              </button>
                                              <button 
                                                className="btn btn-sm btn-danger" 
                                                title="Tolak Pengajuan IDP (BKPSDMD)" 
                                                onClick={() => {
                                                  setIdpRejectData({
                                                    rowIndex: idp._rowIndex,
                                                    status: 'Ditolak BKPSDMD',
                                                    namaPegawai: p.nama,
                                                    kompetensi: idp.jenis_kompetensi
                                                  });
                                                  setRejectReason('Tidak tersedia anggaran');
                                                  setCustomReason('');
                                                }}
                                              >
                                                <i className="bi bi-x-circle-fill me-1"></i>Tolak
                                              </button>
                                            </div>
                                          ) : idp.status === 'Disetujui' ? (
                                            <span className="badge bg-success py-1 px-2"><i className="bi bi-check2-all me-1"></i>Disetujui Final</span>
                                          ) : (
                                            <div className="d-flex align-items-center justify-content-center gap-1">
                                              <span className="badge bg-danger py-1 px-2"><i className="bi bi-x-circle me-1"></i>{idp.status}</span>
                                              <button 
                                                className="btn btn-xs btn-outline-secondary" 
                                                style={{fontSize: '0.7rem', padding: '1px 5px'}} 
                                                title="Tinjau Ulang / Reset Status" 
                                                onClick={() => updateIdpStatus(idp._rowIndex, 'Menunggu Persetujuan Admin', 'Buka kembali usulan IDP ini menjadi Menunggu Verifikasi BKPSDMD?')}
                                              >
                                                <i className="bi bi-arrow-counterclockwise"></i>
                                              </button>
                                            </div>
                                          )
                                        )}
                                      </td>
                                      {userRole === 'super_admin' && (
                                        <td className="text-center">
                                          <button className="btn btn-sm btn-outline-primary me-1" title="Edit IDP" onClick={() => {
                                            setIdpForm({ ...idp, nip: p.nip, isEdit: true });
                                            setShowIdpModal(true);
                                          }}><i className="bi bi-pencil"></i></button>
                                          <button className="btn btn-sm btn-outline-danger" title="Hapus IDP" onClick={() => hapusIdp(idp._rowIndex, idp.jenis_kompetensi)}><i className="bi bi-trash"></i></button>
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </>
                            );
                          })()
                        )}
                        
                        {/* Jika kosong semua */}
                        {pegawaiList.flatMap(p => p.idp || []).length === 0 && (
                          <tr>
                            <td colSpan={10} className="text-center text-muted py-4">Belum ada pengajuan IDP dari pegawai.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {(() => {
                    const idpItemsLength = pegawaiList.reduce((acc, p) => acc + (p.idp ? p.idp.length : 0), 0);
                    return <PaginationControls currentPage={currentPageIdp} setCurrentPage={setCurrentPageIdp} totalItems={idpItemsLength} />;
                  })()}
                </div>
              )}

              {/* TAB PROFIL PIMPINAN WEB */}
              {userRole === 'super_admin' && activeTab === 'view-profil-web' && (
                <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-center pb-3 mb-4 border-bottom gap-3">
                    <div>
                      <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                        <i className="bi bi-person-badge-fill text-primary"></i> Pengaturan Profil Pimpinan Web
                      </h4>
                      <p className="text-muted small mb-0">
                        Ubah foto, nama, gelar, dan sebutan jabatan Bupati serta Wakil Bupati yang tampil di halaman login/depan website.
                      </p>
                    </div>
                    <div className="d-flex gap-2">
                      <a 
                        href="/login" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-outline-primary btn-sm rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-1 shadow-sm"
                        title="Buka halaman login di tab baru"
                      >
                        <i className="bi bi-box-arrow-up-right"></i> Lihat Halaman Login
                      </a>
                      <button 
                        type="button" 
                        onClick={fetchProfilWeb} 
                        disabled={loadingProfilWeb} 
                        className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-1"
                        title="Muat ulang dari database"
                      >
                        <i className={`bi bi-arrow-clockwise ${loadingProfilWeb ? 'spinLoader' : ''}`}></i> Muat Ulang
                      </button>
                    </div>
                  </div>

                  {/* Alert Sukses / Gagal */}
                  {profilWebSuccessMsg && (
                    <div className="alert alert-success alert-dismissible fade show rounded-3 d-flex align-items-center gap-2 shadow-sm" role="alert">
                      <i className="bi bi-check-circle-fill fs-5 text-success"></i>
                      <div className="fw-medium">{profilWebSuccessMsg}</div>
                      <button type="button" className="btn-close" onClick={() => setProfilWebSuccessMsg('')}></button>
                    </div>
                  )}
                  {profilWebErrorMsg && (
                    <div className="alert alert-danger alert-dismissible fade show rounded-3 d-flex align-items-center gap-2 shadow-sm" role="alert">
                      <i className="bi bi-exclamation-triangle-fill fs-5 text-danger"></i>
                      <div className="fw-medium">{profilWebErrorMsg}</div>
                      <button type="button" className="btn-close" onClick={() => setProfilWebErrorMsg('')}></button>
                    </div>
                  )}

                  {/* KOTAK LIVE PREVIEW (Tampilan Halaman Depan) */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold text-dark small text-uppercase tracking-wider">
                        <i className="bi bi-eye-fill text-primary me-1"></i> Pratinjau Langsung (Live Preview di Halaman Depan)
                      </span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1 small">
                        Posisi dan tata letak tidak berubah
                      </span>
                    </div>

                    <div 
                      className="rounded-4 p-4 text-white position-relative overflow-hidden shadow-sm"
                      style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)',
                        minHeight: '260px'
                      }}
                    >
                      <div className="row align-items-end g-4">
                        {/* Kolom Teks Pengantar */}
                        <div className="col-md-5">
                          <span className="badge bg-warning text-dark fw-bold mb-2">SIMULATOR HERO</span>
                          <h4 className="fw-bold text-white mb-2" style={{ lineHeight: 1.3 }}>
                            Sistem Informasi<br/><span style={{ color: '#38bdf8' }}>Pengembangan</span> Kompetensi
                          </h4>
                          <p className="small text-white-50 mb-0" style={{ whiteSpace: 'pre-line' }}>
                            {profilWebData.hero_subjudul}
                          </p>
                        </div>

                        {/* Kolom Kartu Bupati & Wakil */}
                        <div className="col-md-7">
                          <div className="d-flex justify-content-center align-items-end gap-3 flex-wrap">
                            {/* Kartu Bupati */}
                            <div className="text-center" style={{ width: '45%', maxWidth: '200px' }}>
                              <div 
                                className="bg-white bg-opacity-10 rounded-3 p-2 mb-2 shadow"
                                style={{ backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)' }}
                              >
                                <img 
                                  src={profilWebData.bupati_foto || '/img/bupati1.png'} 
                                  alt="Bupati" 
                                  style={{ width: '100%', height: '170px', objectFit: 'contain' }}
                                />
                              </div>
                              <p className="m-0 text-uppercase fw-bold" style={{ fontSize: '0.72rem', color: '#f3ca20', letterSpacing: '0.5px' }}>
                                {profilWebData.bupati_jabatan || 'BUPATI BANGKA BARAT'}
                              </p>
                              <h6 className="m-0 fw-bold text-white text-uppercase" style={{ fontSize: '0.88rem', textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}>
                                {profilWebData.bupati_nama || 'MARKUS, S.H.'}
                              </h6>
                            </div>

                            {/* Kartu Wakil Bupati */}
                            <div className="text-center" style={{ width: '45%', maxWidth: '200px' }}>
                              <div 
                                className="bg-white bg-opacity-10 rounded-3 p-2 mb-2 shadow"
                                style={{ backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)' }}
                              >
                                <img 
                                  src={profilWebData.wakil_foto || '/img/bupati2.png'} 
                                  alt="Wakil Bupati" 
                                  style={{ width: '100%', height: '170px', objectFit: 'contain' }}
                                />
                              </div>
                              <p className="m-0 text-uppercase fw-bold" style={{ fontSize: '0.72rem', color: '#f3ca20', letterSpacing: '0.5px' }}>
                                {profilWebData.wakil_jabatan || 'WAKIL BUPATI BANGKA BARAT'}
                              </p>
                              <h6 className="m-0 fw-bold text-white text-uppercase" style={{ fontSize: '0.88rem', textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}>
                                {profilWebData.wakil_nama || 'H. YUS DERAHMAN'}
                              </h6>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FORM EDITOR BUPATI & WAKIL BUPATI (2 KOLOM) */}
                  <div className="row g-4 mb-4">
                    
                    {/* KOLOM 1: FORM BUPATI */}
                    <div className="col-lg-6">
                      <div className="card h-100 border rounded-4 shadow-sm">
                        <div className="card-header bg-primary bg-opacity-10 border-0 pt-3 pb-2 px-3 d-flex align-items-center justify-content-between">
                          <span className="fw-bold text-primary d-flex align-items-center gap-2">
                            <span className="badge bg-primary text-white rounded-pill px-2 py-1">1</span>
                            Profil Bupati (Posisi Kiri)
                          </span>
                          <span className="badge bg-white text-secondary border rounded-pill px-2 py-1 small">Kepala Daerah</span>
                        </div>
                        <div className="card-body p-4">
                          
                          {/* Upload / Ganti Foto Bupati */}
                          <div className="text-center mb-4 pb-3 border-bottom">
                            <div className="position-relative d-inline-block">
                              <div 
                                className="rounded-4 overflow-hidden border border-2 border-primary border-opacity-25 shadow-sm bg-light d-flex align-items-center justify-content-center mx-auto"
                                style={{ width: '150px', height: '190px' }}
                              >
                                {uploadingBupatiFoto ? (
                                  <div className="text-center p-2">
                                    <div className="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
                                    <div className="small text-muted">Mengunggah foto...</div>
                                  </div>
                                ) : (
                                  <img 
                                    src={profilWebData.bupati_foto || '/img/bupati1.png'} 
                                    alt="Foto Bupati" 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  />
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <label className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm mb-1" style={{ cursor: 'pointer' }}>
                                <i className="bi bi-upload me-1"></i> Unggah Foto Bupati Baru
                                <input 
                                  type="file" 
                                  accept="image/png,image/jpeg,image/jpg,image/webp" 
                                  className="d-none"
                                  disabled={uploadingBupatiFoto}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleUploadProfilFoto(e.target.files[0], 'bupati');
                                    }
                                  }}
                                />
                              </label>
                              <div className="form-text small" style={{ fontSize: '0.75rem' }}>
                                Format disarankan: PNG transparan atau JPG/WEBP (Maksimal 5MB)
                              </div>
                            </div>
                          </div>

                          {/* Input Nama & Gelar Bupati */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold text-secondary small mb-1">
                              Nama Lengkap & Gelar Bupati <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-muted border-end-0">
                                <i className="bi bi-person-fill"></i>
                              </span>
                              <input 
                                type="text" 
                                className="form-control border-start-0" 
                                placeholder="Contoh: MARKUS, S.H."
                                value={profilWebData.bupati_nama}
                                onChange={(e) => setProfilWebData({ ...profilWebData, bupati_nama: e.target.value })}
                              />
                            </div>
                            <div className="form-text small" style={{ fontSize: '0.75rem' }}>
                              Nama ini akan ditampilkan tebal di bawah foto Bupati.
                            </div>
                          </div>

                          {/* Input Sebutan Jabatan */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold text-secondary small mb-1">
                              Sebutan Jabatan <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-muted border-end-0">
                                <i className="bi bi-award-fill"></i>
                              </span>
                              <input 
                                type="text" 
                                className="form-control border-start-0" 
                                placeholder="Contoh: BUPATI BANGKA BARAT"
                                value={profilWebData.bupati_jabatan}
                                onChange={(e) => setProfilWebData({ ...profilWebData, bupati_jabatan: e.target.value })}
                              />
                            </div>
                            <div className="form-text small" style={{ fontSize: '0.75rem' }}>
                              Teks kuning keemasan di atas nama (huruf kapital).
                            </div>
                          </div>

                          {/* Input URL Foto (Opsional / Manual) */}
                          <div className="mb-0">
                            <label className="form-label fw-semibold text-secondary small mb-1">
                              Path / Link URL Foto Bupati
                            </label>
                            <input 
                              type="text" 
                              className="form-control form-control-sm text-muted bg-light" 
                              placeholder="/img/bupati1.png atau URL Drive"
                              value={profilWebData.bupati_foto}
                              onChange={(e) => setProfilWebData({ ...profilWebData, bupati_foto: e.target.value })}
                            />
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* KOLOM 2: FORM WAKIL BUPATI */}
                    <div className="col-lg-6">
                      <div className="card h-100 border rounded-4 shadow-sm">
                        <div className="card-header bg-info bg-opacity-10 border-0 pt-3 pb-2 px-3 d-flex align-items-center justify-content-between">
                          <span className="fw-bold text-info-emphasis d-flex align-items-center gap-2">
                            <span className="badge bg-info text-white rounded-pill px-2 py-1">2</span>
                            Profil Wakil Bupati (Posisi Kanan)
                          </span>
                          <span className="badge bg-white text-secondary border rounded-pill px-2 py-1 small">Wakil Kepala Daerah</span>
                        </div>
                        <div className="card-body p-4">
                          
                          {/* Upload / Ganti Foto Wakil Bupati */}
                          <div className="text-center mb-4 pb-3 border-bottom">
                            <div className="position-relative d-inline-block">
                              <div 
                                className="rounded-4 overflow-hidden border border-2 border-info border-opacity-25 shadow-sm bg-light d-flex align-items-center justify-content-center mx-auto"
                                style={{ width: '150px', height: '190px' }}
                              >
                                {uploadingWakilFoto ? (
                                  <div className="text-center p-2">
                                    <div className="spinner-border text-info spinner-border-sm mb-2" role="status"></div>
                                    <div className="small text-muted">Mengunggah foto...</div>
                                  </div>
                                ) : (
                                  <img 
                                    src={profilWebData.wakil_foto || '/img/bupati2.png'} 
                                    alt="Foto Wakil Bupati" 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  />
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <label className="btn btn-info text-white btn-sm rounded-pill px-3 shadow-sm mb-1" style={{ cursor: 'pointer' }}>
                                <i className="bi bi-upload me-1"></i> Unggah Foto Wakil Bupati Baru
                                <input 
                                  type="file" 
                                  accept="image/png,image/jpeg,image/jpg,image/webp" 
                                  className="d-none"
                                  disabled={uploadingWakilFoto}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleUploadProfilFoto(e.target.files[0], 'wakil');
                                    }
                                  }}
                                />
                              </label>
                              <div className="form-text small" style={{ fontSize: '0.75rem' }}>
                                Format disarankan: PNG transparan atau JPG/WEBP (Maksimal 5MB)
                              </div>
                            </div>
                          </div>

                          {/* Input Nama & Gelar Wakil Bupati */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold text-secondary small mb-1">
                              Nama Lengkap & Gelar Wakil Bupati <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-muted border-end-0">
                                <i className="bi bi-person-fill"></i>
                              </span>
                              <input 
                                type="text" 
                                className="form-control border-start-0" 
                                placeholder="Contoh: H. YUS DERAHMAN"
                                value={profilWebData.wakil_nama}
                                onChange={(e) => setProfilWebData({ ...profilWebData, wakil_nama: e.target.value })}
                              />
                            </div>
                            <div className="form-text small" style={{ fontSize: '0.75rem' }}>
                              Nama ini akan ditampilkan tebal di bawah foto Wakil Bupati.
                            </div>
                          </div>

                          {/* Input Sebutan Jabatan */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold text-secondary small mb-1">
                              Sebutan Jabatan <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-muted border-end-0">
                                <i className="bi bi-award-fill"></i>
                              </span>
                              <input 
                                type="text" 
                                className="form-control border-start-0" 
                                placeholder="Contoh: WAKIL BUPATI BANGKA BARAT"
                                value={profilWebData.wakil_jabatan}
                                onChange={(e) => setProfilWebData({ ...profilWebData, wakil_jabatan: e.target.value })}
                              />
                            </div>
                            <div className="form-text small" style={{ fontSize: '0.75rem' }}>
                              Teks kuning keemasan di atas nama (huruf kapital).
                            </div>
                          </div>

                          {/* Input URL Foto (Opsional / Manual) */}
                          <div className="mb-0">
                            <label className="form-label fw-semibold text-secondary small mb-1">
                              Path / Link URL Foto Wakil Bupati
                            </label>
                            <input 
                              type="text" 
                              className="form-control form-control-sm text-muted bg-light" 
                              placeholder="/img/bupati2.png atau URL Drive"
                              value={profilWebData.wakil_foto}
                              onChange={(e) => setProfilWebData({ ...profilWebData, wakil_foto: e.target.value })}
                            />
                          </div>

                        </div>
                      </div>
                    </div>

                  </div>

                  {/* PENGATURAN TAMBAHAN (DESKRIPSI WEBSITE) */}
                  <div className="card border rounded-4 mb-4 shadow-sm">
                    <div className="card-header bg-light border-0 py-3 px-4">
                      <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                        <i className="bi bi-card-text text-primary"></i> Teks Sambutan / Deskripsi Halaman Login (Opsional)
                      </h6>
                    </div>
                    <div className="card-body p-4">
                      <div className="mb-0">
                        <label className="form-label fw-semibold text-secondary small mb-1">
                          Deskripsi Singkat Sistem di Bawah Judul
                        </label>
                        <textarea 
                          className="form-control" 
                          rows={3}
                          value={profilWebData.hero_subjudul}
                          onChange={(e) => setProfilWebData({ ...profilWebData, hero_subjudul: e.target.value })}
                          placeholder="Wadah digital terpadu untuk pencatatan, pemantauan, dan evaluasi pemenuhan kewajiban Jam Pelajaran (JP) bagi seluruh ASN."
                        />
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-3 border-top">
                    <button 
                      type="button" 
                      onClick={() => handleResetProfilWeb()} 
                      className="btn btn-outline-danger btn-sm rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-arrow-counterclockwise"></i> Reset ke Default (Semula)
                    </button>

                    <div className="d-flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => handleSaveProfilWeb()} 
                        disabled={savingProfilWeb} 
                        className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow d-flex align-items-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #1d4ed8, #0284c7)' }}
                      >
                        {savingProfilWeb ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            Menyimpan ke Google Sheets...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-cloud-check-fill fs-6"></i> Simpan Perubahan Profil
                          </>
                        )}
                      </button>
                    </div>
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
                  <table className="table table-sm table-hover mb-0" style={{ fontSize: '0.85rem' }}>
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

      {/* Modal Form Pegawai */}
      {userRole === 'super_admin' && showPegawaiModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white border-0">
                <h5 className="modal-title fw-bold"><i className="bi bi-person me-2"></i> {pegawaiForm.isEdit ? 'Edit Pegawai' : 'Tambah Pegawai'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPegawaiModal(false)}></button>
              </div>
              <form onSubmit={handleSavePegawai}>
                <div className="modal-body p-4 bg-light">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">NIP *</label>
                      <input type="text" className="form-control" required value={pegawaiForm.nip || ''} onChange={e => setPegawaiForm({...pegawaiForm, nip: e.target.value})} disabled={pegawaiForm.isEdit} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Nama Lengkap *</label>
                      <input type="text" className="form-control" required value={pegawaiForm.nama || ''} onChange={e => setPegawaiForm({...pegawaiForm, nama: e.target.value})} />
                    </div>
                    {!pegawaiForm.isEdit && (
                      <div className="col-md-6">
                        <label className="form-label">Password Default *</label>
                        <input type="text" className="form-control" required value={pegawaiForm.password || ''} onChange={e => setPegawaiForm({...pegawaiForm, password: e.target.value})} />
                      </div>
                    )}
                    <div className="col-md-6">
                      <label className="form-label">Email Pegawai</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                        <input 
                          type="email" 
                          className="form-control" 
                          placeholder="contoh: nama@gmail.com (opsional)" 
                          value={pegawaiForm.email || ''} 
                          onChange={e => setPegawaiForm({...pegawaiForm, email: e.target.value})} 
                        />
                      </div>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>Untuk menerima notifikasi pengajuan & persetujuan IDP</small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Status Pegawai</label>
                      <select className="form-select" required value={pegawaiForm.status_pegawai || ''} onChange={e => setPegawaiForm({...pegawaiForm, status_pegawai: e.target.value, golonganPangkat: ''})}>
                        <option value="">- Pilih Status Pegawai -</option>
                        <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
                        <option value="PPPK">PPPK (Pegawai Pemerintah dengan Perjanjian Kerja)</option>
                        <option value="PW">PW (Pegawai Waktu Tertentu / Honorer)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Golongan / Pangkat *</label>
                      <select className="form-select" required={pegawaiForm.status_pegawai !== 'PW'} disabled={!pegawaiForm.status_pegawai || pegawaiForm.status_pegawai === 'PW'} value={pegawaiForm.golonganPangkat || ''} onChange={e => setPegawaiForm({...pegawaiForm, golonganPangkat: e.target.value})}>
                        <option value="">- Pilih Golongan / Pangkat -</option>
                        {getGolonganOptions().map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Jenis Kelamin *</label>
                      <select className="form-select" required value={pegawaiForm.jenkel || ''} onChange={e => setPegawaiForm({...pegawaiForm, jenkel: e.target.value})}>
                        <option value="">- PILIH JENIS KELAMIN -</option>
                        <option value="LAKI-LAKI">LAKI-LAKI</option>
                        <option value="PEREMPUAN">PEREMPUAN</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Jabatan</label>
                      <input type="text" className="form-control" value={pegawaiForm.jabatan || ''} onChange={e => setPegawaiForm({...pegawaiForm, jabatan: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Unit Kerja</label>
                      <select 
                        className="form-select" 
                        value={pegawaiForm.unit_kerja || ''} 
                        onChange={e => setPegawaiForm({...pegawaiForm, unit_kerja: e.target.value})}
                      >
                        <option value="">- PILIH UNIT KERJA -</option>
                        {UNIT_KERJA_OPTIONS.map(opd => (
                          <option key={opd} value={opd.toUpperCase()}>{opd.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Status Aktif</label>
                      <select className="form-select" value={pegawaiForm.status_aktif || 'Aktif'} onChange={e => setPegawaiForm({...pegawaiForm, status_aktif: e.target.value})}>
                        <option value="Aktif">Aktif</option>
                        <option value="Tidak Aktif">Tidak Aktif</option>
                        <option value="Mutasi">Mutasi</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Hak Akses (Role)</label>
                      <select className="form-select" value={pegawaiForm.role || 'pegawai'} onChange={e => setPegawaiForm({...pegawaiForm, role: e.target.value})}>
                        <option value="pegawai">Pegawai Biasa</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>

                    <div className="col-12 mt-4 pt-3 border-top">
                      <h6 className="fw-bold text-primary mb-3">Informasi Pendidikan Dasar</h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Tingkat Pendidikan</label>
                      <select className="form-select" value={pegawaiForm.tingkat_pendidikan || ''} onChange={e => setPegawaiForm({...pegawaiForm, tingkat_pendidikan: e.target.value})}>
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
                      <label className="form-label">Fakultas / Program Studi / Jurusan</label>
                      <input type="text" className="form-control" value={pegawaiForm.jurusan || ''} onChange={e => setPegawaiForm({...pegawaiForm, jurusan: e.target.value})} placeholder="Cth: Ilmu Hukum" />
                    </div>

                  </div>
                </div>
                <div className="modal-footer border-0 bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPegawaiModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form IDP */}
      {userRole === 'super_admin' && showIdpModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white border-0">
                <h5 className="modal-title fw-bold"><i className="bi bi-calendar2-check me-2"></i> {idpForm.isEdit ? 'Edit IDP' : 'Tambah IDP'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowIdpModal(false)}></button>
              </div>
              <form onSubmit={handleSaveIdp}>
                <div className="modal-body p-4 bg-light">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Pegawai Pemilik IDP *</label>
                      <input 
                        list="pemilikList"
                        className="form-control" 
                        required 
                        placeholder="Ketik Nama atau NIP..."
                        value={idpForm.nip || ''} 
                        onChange={e => setIdpForm({...idpForm, nip: e.target.value})}
                      />
                      <datalist id="pemilikList">
                        {semuaPegawai.map(p => <option key={p.nip} value={p.nip}>{p.nama} (NIP. {p.nip})</option>)}
                      </datalist>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Atasan / Ketua Penilai *</label>
                      <input 
                        list="ketuaList"
                        className="form-control" 
                        required 
                        placeholder="Ketik Nama atau NIP..."
                        value={idpForm.nip_ketua || ''} 
                        onChange={e => {
                          const val = e.target.value;
                          const selected = semuaPegawai.find(p => p.nip === val);
                          setIdpForm({...idpForm, nip_ketua: val, nama_ketua: selected ? selected.nama : ''});
                        }}
                      />
                      <datalist id="ketuaList">
                        {semuaPegawai.filter(p => p.nip !== idpForm.nip).map(p => <option key={p.nip} value={p.nip}>{p.nama} (NIP. {p.nip})</option>)}
                      </datalist>
                    </div>
                    <div className="col-md-12"><hr/></div>
                    <div className="col-md-6">
                      <label className="form-label">Jenis Kompetensi *</label>
                      <input type="text" className="form-control" required value={idpForm.jenis_kompetensi || ''} onChange={e => setIdpForm({...idpForm, jenis_kompetensi: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Jenis Pengembangan *</label>
                      <select className="form-select" required value={idpForm.jenis_pengembangan || ''} onChange={e => setIdpForm({...idpForm, jenis_pengembangan: e.target.value})}>
                        <option value="">- Pilih -</option>
                        <option value="Pelatihan Non Klasikal">Pelatihan Non Klasikal</option>
                        <option value="Pelatihan Klasikal">Pelatihan Klasikal</option>
                        <option value="Blended Learning">Blended Learning</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Jalur Pengembangan *</label>
                      <input type="text" className="form-control" required value={idpForm.jalur_pengembangan || ''} onChange={e => setIdpForm({...idpForm, jalur_pengembangan: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Penyelenggara *</label>
                      <input type="text" className="form-control" required value={idpForm.penyelenggara || ''} onChange={e => setIdpForm({...idpForm, penyelenggara: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Waktu Awal *</label>
                      <input type="date" className="form-control" required value={idpForm.waktu_pelaksanaan_awal || ''} onChange={e => setIdpForm({...idpForm, waktu_pelaksanaan_awal: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Waktu Akhir *</label>
                      <input type="date" className="form-control" required value={idpForm.waktu_pelaksanaan_akhir || ''} onChange={e => setIdpForm({...idpForm, waktu_pelaksanaan_akhir: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">JP *</label>
                      <input type="number" className="form-control" required value={idpForm.jp || ''} onChange={e => setIdpForm({...idpForm, jp: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Anggaran</label>
                      <input type="number" className="form-control" value={idpForm.anggaran || ''} onChange={e => setIdpForm({...idpForm, anggaran: e.target.value})} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Status Verifikasi</label>
                      <select className="form-select" value={idpForm.status || 'Menunggu Persetujuan Ketua'} onChange={e => setIdpForm({...idpForm, status: e.target.value})}>
                        <option value="Menunggu Persetujuan Ketua">Tahap 1: Menunggu Persetujuan OPD</option>
                        <option value="Menunggu Persetujuan Admin">Tahap 2: Disetujui OPD (Menunggu BKPSDMD)</option>
                        <option value="Disetujui">Disetujui Final (BKPSDMD)</option>
                        <option value="Ditolak BKPSDMD">Ditolak BKPSDMD</option>
                        <option value="Ditolak OPD">Ditolak OPD</option>
                      </select>
                    </div>
                    {idpForm.status?.toLowerCase().includes('ditolak') && (
                      <div className="col-md-12">
                        <label className="form-label text-danger fw-bold">Alasan Penolakan</label>
                        <input 
                          type="text" 
                          className="form-control border-danger" 
                          placeholder="Masukkan alasan penolakan..." 
                          value={idpForm.alasan_tolak || ''} 
                          onChange={e => setIdpForm({...idpForm, alasan_tolak: e.target.value})} 
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-0 bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowIdpModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan</button>
                </div>
              </form>
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

      {/* Modal Konfirmasi Hapus */}
      {showDeleteConfirm && deleteConfirmData && (
        <div className="delete-confirm-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) { setShowDeleteConfirm(false); setDeleteConfirmData(null); } }}>
          <div className="delete-confirm-card">
            <div className="delete-confirm-icon">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="delete-confirm-title">{deleteConfirmData.title}</div>
            <div className="delete-confirm-msg">{deleteConfirmData.message}</div>
            <div className="delete-confirm-actions">
              <button 
                className="btn-cancel" 
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmData(null); }}
                disabled={isDeleting}
              >
                Batal
              </button>
              <button 
                className="btn-delete" 
                onClick={deleteConfirmData.onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <><div className="delete-spinner"></div> Menghapus...</>
                ) : (
                  <><i className="bi bi-trash3-fill"></i> Ya, Hapus</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alasan Penolakan IDP (BKPSDMD & OPD) */}
      {idpRejectData && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1065 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white border-0 py-3 px-4">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0 fs-6">
                  <i className="bi bi-x-circle-fill fs-5"></i> Keterangan Penolakan Pengajuan IDP
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => !isSubmittingReject && setIdpRejectData(null)}
                  disabled={isSubmittingReject}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="p-3 bg-light rounded-3 mb-3 border">
                  <div className="text-muted small">Pegawai: <strong className="text-dark">{idpRejectData.namaPegawai}</strong></div>
                  <div className="text-muted small mt-1">Kompetensi: <strong className="text-primary">{idpRejectData.kompetensi}</strong></div>
                  <div className="text-muted small mt-1">Tingkat Penolakan: <span className="badge bg-danger">{idpRejectData.status}</span></div>
                </div>

                <label className="form-label fw-bold text-dark mb-2">Keterangan / Alasan Penolakan:</label>
                <div className="d-flex flex-column gap-2 mb-3">
                  {[
                    'Tidak tersedia anggaran',
                    'Tidak sesuai prioritas kompetensi instansi',
                    'Jadwal bertabrakan dengan agenda kedinasan',
                    'Kuota peserta pelatihan telah penuh',
                    'Lainnya'
                  ].map((alasan) => (
                    <div 
                      key={alasan} 
                      className={`p-2 px-3 border rounded-3 cursor-pointer d-flex align-items-center justify-content-between transition-all ${rejectReason === alasan ? 'border-danger bg-danger bg-opacity-10 fw-bold text-danger' : 'bg-white text-dark'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setRejectReason(alasan)}
                    >
                      <label className="form-check-label small mb-0" style={{ cursor: 'pointer' }}>
                        {alasan === 'Tidak tersedia anggaran' && <i className="bi bi-cash-coin me-2 text-danger"></i>}
                        {alasan}
                      </label>
                      <input 
                        type="radio" 
                        name="rejectReason" 
                        className="form-check-input"
                        checked={rejectReason === alasan}
                        onChange={() => setRejectReason(alasan)}
                      />
                    </div>
                  ))}
                </div>

                {rejectReason === 'Lainnya' && (
                  <div className="mt-2">
                    <label className="form-label small text-muted">Ketik Keterangan Alasan Lainnya:</label>
                    <textarea 
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="Masukkan keterangan penolakan..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light border-0 py-3 px-4">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm px-3" 
                  onClick={() => setIdpRejectData(null)}
                  disabled={isSubmittingReject}
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger btn-sm px-3" 
                  onClick={handleConfirmRejectIdp}
                  disabled={isSubmittingReject}
                >
                  {isSubmittingReject ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span> Menyimpan...</>
                  ) : (
                    <><i className="bi bi-x-circle me-1"></i> Simpan Penolakan</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {userRole === 'super_admin' && showImportSertifikasiModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white border-0 py-3">
                <div className="d-flex align-items-center">
                  <div className="bg-white bg-opacity-25 rounded-circle p-2 me-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                    <i className="bi bi-cloud-arrow-up-fill fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Upload Template Sertifikasi Massal (Rabu Bertamu)</h5>
                    <small className="opacity-75">Tambahkan sertifikasi langsung dari file Excel dan terhubung otomatis ke Google Sheets & Drive</small>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => { setShowImportSertifikasiModal(false); setImportFile(null); setImportPreviewData([]); setImportResult(null); }}></button>
              </div>

              <div className="modal-body p-4 bg-light">
                {/* Banner Info & Download Template */}
                <div className="alert alert-info border-0 shadow-sm d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                  <div className="d-flex align-items-start gap-2">
                    <i className="bi bi-info-circle-fill fs-5 text-primary mt-1"></i>
                    <div>
                      <div className="fw-bold">Format Kolom Terhubung dengan Google Sheets & Drive:</div>
                      <div className="text-secondary small">
                        Pastikan file Excel menggunakan template standar yang disediakan (termasuk kolom NIP, Nama Kursus, Jumlah JP, Jenis Kursus, dan Link Sertifikat).
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-success fw-bold px-3 shadow-sm" onClick={downloadTemplateSertifikasi}>
                    <i className="bi bi-file-earmark-excel me-1"></i> Download Template Excel
                  </button>
                </div>

                {/* Notifikasi Hasil Import */}
                {importResult && (
                  <div className={`alert ${importResult.success ? 'alert-success' : 'alert-danger'} border-0 shadow-sm d-flex align-items-center gap-2 mb-4`}>
                    <i className={`bi ${importResult.success ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5`}></i>
                    <div className="flex-grow-1">{importResult.message}</div>
                    <button type="button" className="btn-close" onClick={() => setImportResult(null)}></button>
                  </div>
                )}

                {/* Area Upload File */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body p-4 text-center">
                    <div className="mb-3">
                      <i className="bi bi-file-earmark-spreadsheet-fill text-success display-4"></i>
                    </div>
                    <h6 className="fw-bold mb-1">Pilih File Hasil Pengisian Template</h6>
                    <p className="text-muted small mb-3">Mendukung format <code>.xlsx</code>, <code>.xls</code>, <code>.csv</code>, atau Apple Numbers (<code>.numbers</code>)</p>
                    
                    <div className="d-flex justify-content-center">
                      <label className="btn btn-outline-primary px-4 py-2 cursor-pointer shadow-sm">
                        <i className="bi bi-folder2-open me-2"></i>
                        {importFile ? importFile.name : 'Pilih File Excel / Numbers...'}
                        <input 
                          type="file" 
                          accept=".xlsx, .xls, .csv, .numbers, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv, application/x-iwork-numbers-sffnumbers, application/vnd.apple.numbers" 
                          className="d-none" 
                          onChange={handleImportFileChange}
                        />
                      </label>
                    </div>

                    {importFile && (
                      <div className="mt-3 text-success fw-bold small">
                        <i className="bi bi-check2-circle me-1"></i> File terpilih: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview Data Jika Sudah Ada Baris */}
                {importPreviewData.length > 0 && (
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-header bg-white py-3 border-0">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="badge bg-primary fs-6">Total: {importPreviewData.length} Baris</span>
                          <span className="badge bg-success fs-6">Terdaftar di DB: {importPreviewData.filter(d => d.isRegistered).length}</span>
                          {importPreviewData.some(d => !d.isRegistered) && (
                            <span className="badge bg-danger fs-6">⚠ NIP Tidak Ditemukan: {importPreviewData.filter(d => !d.isRegistered).length} Baris</span>
                          )}
                          <span className="badge bg-info text-dark fs-6">
                            Total Tambahan JP: {importPreviewData.reduce((acc, c) => acc + (c.jumlah_jp || 0), 0)} JP
                          </span>
                        </div>
                        <div className="position-relative" style={{ width: '250px' }}>
                          <input 
                            type="text" 
                            className="form-control form-control-sm pe-4" 
                            placeholder="Cari NIP / Nama / Kegiatan..." 
                            value={importSearchPreview}
                            onChange={(e) => setImportSearchPreview(e.target.value)}
                          />
                          <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-2 text-muted" style={{ fontSize: '0.8rem' }}></i>
                        </div>
                      </div>
                    </div>

                    <div className="table-responsive" style={{ maxHeight: '350px' }}>
                      <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                        <thead className="table-light sticky-top">
                          <tr>
                            <th className="text-center" style={{ width: '40px' }}>No</th>
                            <th style={{ width: '160px' }}>NIP</th>
                            <th style={{ width: '200px' }}>Nama & OPD</th>
                            <th style={{ width: '120px' }}>Status Pegawai</th>
                            <th style={{ width: '180px' }}>Jabatan</th>
                            <th>Nama Kursus / Kegiatan</th>
                            <th style={{ width: '140px' }}>Tanggal Pelaksanaan</th>
                            <th className="text-center" style={{ width: '70px' }}>JP</th>
                            <th style={{ width: '80px' }}>Tahun</th>
                            <th style={{ width: '130px' }}>Jenis Kursus</th>
                            <th style={{ width: '110px' }}>Status Link</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreviewData
                            .filter(d => {
                              if (!importSearchPreview) return true;
                              const q = importSearchPreview.toLowerCase();
                              return (
                                d.nip.toLowerCase().includes(q) ||
                                d.nama_pegawai.toLowerCase().includes(q) ||
                                d.nama_kursus.toLowerCase().includes(q) ||
                                d.opd.toLowerCase().includes(q) ||
                                (d.status_pegawai || '').toLowerCase().includes(q) ||
                                (d.jabatan || '').toLowerCase().includes(q)
                              );
                            })
                            .map((item, idx) => (
                              <tr key={idx} className={item.isRegistered ? '' : 'table-danger'}>
                                <td className="text-center text-muted">{idx + 1}</td>
                                <td>
                                  <div className="fw-bold">{item.nip}</div>
                                  {item.isRegistered ? (
                                    <span className="badge bg-success" style={{ fontSize: '0.65rem' }}>✓ Terdaftar</span>
                                  ) : (
                                    <span className="badge bg-danger" style={{ fontSize: '0.65rem' }}>✕ NIP Tidak Ditemukan</span>
                                  )}
                                </td>
                                <td>
                                  <div className={`fw-bold ${item.isRegistered ? 'text-dark' : 'text-danger'}`}>{item.nama_pegawai}</div>
                                  <small className="text-muted d-block text-truncate" style={{ maxWidth: '190px' }} title={item.opd}>{item.opd}</small>
                                </td>
                                <td>
                                  {item.isRegistered ? (
                                    <span className={`badge ${item.status_pegawai?.toUpperCase()?.includes('PNS') ? 'bg-primary' : item.status_pegawai?.toUpperCase()?.includes('PPPK') ? 'bg-info text-dark' : 'bg-secondary'}`} style={{ fontSize: '0.72rem' }}>
                                      {item.status_pegawai || '-'}
                                    </span>
                                  ) : (
                                    <span className="badge bg-danger" style={{ fontSize: '0.72rem' }}>NIP Tidak Ditemukan</span>
                                  )}
                                </td>
                                <td>
                                  <small className={item.isRegistered ? 'text-dark' : 'text-danger fw-bold'} title={item.jabatan}>{item.jabatan || '-'}</small>
                                </td>
                                <td>
                                  <div className="fw-bold text-primary">{item.nama_kursus}</div>
                                  <small className="text-muted">{item.institusi_penyelenggara} • No: {item.nomor_sertifikasi}</small>
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark border" style={{ fontSize: '0.72rem' }}>
                                    <i className="bi bi-calendar3 me-1 text-primary"></i>
                                    {item.tanggal_sertifikasi || '-'}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <span className="badge bg-info text-dark fw-bold">{item.jumlah_jp} JP</span>
                                </td>
                                <td>{item.tahun}</td>
                                <td>
                                  <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>{item.jenis_kursus}</span>
                                </td>
                                <td>
                                  {item.link_sertifikat ? (
                                    <span className="badge bg-primary text-truncate d-inline-block" style={{ maxWidth: '100px' }} title={item.link_sertifikat}>
                                      <i className="bi bi-link-45deg me-1"></i> Ada Link
                                    </span>
                                  ) : (
                                    <span className="badge bg-light text-muted border">Tanpa Link</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 bg-light py-3">
                <button 
                  type="button" 
                  className="btn btn-secondary px-3" 
                  onClick={() => { setShowImportSertifikasiModal(false); setImportFile(null); setImportPreviewData([]); setImportResult(null); }}
                  disabled={importLoading}
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary px-4 fw-bold shadow-sm" 
                  onClick={handleProcessImport}
                  disabled={importLoading || importPreviewData.length === 0}
                >
                  {importLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Menyinkronkan ke Google Sheet & Drive...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-arrow-up-fill me-2"></i>
                      Simpan & Sinkronkan ke Database ({importPreviewData.length} Baris)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
