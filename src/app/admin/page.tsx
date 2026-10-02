'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const UNIT_KERJA_OPTIONS = ["Sekretariat Daerah","Asisten Pemerintahan dan Kesejahteraan Rakyat","Asisten Perekonomian dan Pembangunan","Asisten Administrasi Umum","Staf Ahli Bupati Bidang Hukum, Politik dan Pemerintahan","Staf Ahli Bupati Bidang Ekonomi dan Pembangunan","Staf Ahli Bupati Bidang Kemasyarakatan dan Sumber Daya Manusia","Bagian Kesejahteraan Rakyat","Bagian Tata Pemerintahan","Bagian Perekonomian dan Pembangunan","Bagian Pengadaan Barang dan Jasa","Bagian Hukum","Bagian Umum, Perlengkapan dan Protokol","Bagian Organisasi","Sekretariat DPRD","Inspektorat","Badan Pengelolaan Keuangan dan Aset Daerah","Badan Pengelolaan Pajak dan Retribusi Daerah","Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Daerah","Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah","Badan Penanggulangan Bencana Daerah","Badan Kesatuan Bangsa dan Politik","Dinas Perhubungan, Perumahan dan Kawasan Permukiman","Dinas Komunikasi dan Informatika","Dinas Kebudayaan dan Pariwisata","Dinas Perikanan","Dinas Koperasi, Usaha Kecil Menengah dan Perdagangan","Dinas Perindustrian dan Tenaga Kerja","Dinas Perpustakaan dan Kearsipan","Dinas Pekerjaan Umum dan Penataan Ruang","Dinas Pendidikan,kepemudaan & Olah Raga","SMP Negeri 1 Mentok","SMP Negeri 2 Mentok","SMP Negeri 3 Mentok","SMP Negeri 4 Mentok","SMP Negeri 5 Mentok","SMP Negeri 6 Mentok","SD Negeri 01 Mentok","SD Negeri 02 Mentok","SD Negeri 03 Mentok","SD Negeri 04 Mentok","SD Negeri 05 Mentok","SD Negeri 06 Mentok","SD Negeri 07 Mentok","SD Negeri 08 Mentok","SD Negeri 09 Mentok","SD Negeri 10 Mentok","SD Negeri 11 Mentok","SD Negeri 12 Mentok","SD Negeri 13 Mentok","SD Negeri 14 Mentok","SD Negeri 15 Mentok","SD Negeri 16 Mentok","SD Negeri 17 Mentok","SD Negeri 18 Mentok","SD Negeri 19 Mentok","SD Negeri 20 Mentok","SD Negeri 21 Mentok","SD Negeri 22 Mentok","SD Negeri 23 Mentok","SD Negeri 24 Mentok","TK Negeri Pembina Mentok","TK Negeri Sejiran Setason Mentok","SMP Negeri 1 Jebus","SMP Negeri 2 Jebus","SMP Negeri 3 Jebus","SD Negeri 01 Jebus","SD Negeri 02 Jebus","SD Negeri 03 Jebus","SD Negeri 04 Jebus","SD Negeri 05 Jebus","SD Negeri 06 Jebus","SD Negeri 07 Jebus","SD Negeri 08 Jebus","SD Negeri 09 Jebus","SD Negeri 10 Jebus","SD Negeri 11 Jebus","SD Negeri 12 Jebus","SD Negeri 13 Jebus","SD Negeri 14 Jebus","SD Negeri 15 Jebus","SD Negeri 16 Jebus","SD Negeri 17 Jebus","TK Negeri Pembina Jebus","SMP Negeri 1 Parittiga","SMP Negeri 2 Parittiga","SMP Negeri 3 Parittiga","SMP Negeri 4 Parittiga","SD Negeri 01 Parittiga","SD Negeri 02 Parittiga","SD Negeri 03 Parittiga","SD Negeri 04 Parittiga","SD Negeri 05 Parittiga","SD Negeri 06 Parittiga","SD Negeri 07 Parittiga","SD Negeri 08 Parittiga","SD Negeri 09 Parittiga","SD Negeri 10 Parittiga","SD Negeri 11 Parittiga","SD Negeri 12 Parittiga","SD Negeri 13 Parittiga","SD Negeri 14 Parittiga","SD Negeri 15 Parittiga","SD Negeri 16 Parittiga","SD Negeri 17 Parittiga","SD Negeri 18 Parittiga","SD Negeri 19 Parittiga","TK Negeri Pembina Parittiga","SMP Negeri 1 Kelapa","SMP Negeri 2 Kelapa","SMP Negeri 3 Kelapa","SMP Negeri 4 Kelapa","SMP Negeri 5 Kelapa","SD Negeri 1 Kelapa","SD Negeri 2 Kelapa","SD Negeri 3 Kelapa","SD Negeri 4 Kelapa","SD Negeri 5 Kelapa","SD Negeri 6 Kelapa","SD Negeri 7 Kelapa","SD Negeri 8 Kelapa","SD Negeri 9 Kelapa","SD Negeri 10 Kelapa","SD Negeri 11 Kelapa","SD Negeri 12 Kelapa","SD Negeri 13 Kelapa","SD Negeri 14 Kelapa","SD Negeri 15 Kelapa","SD Negeri 16 Kelapa","SD Negeri 17 Kelapa","SD Negeri 18 Kelapa","SD Negeri 19 Kelapa","SD Negeri 20 Kelapa","SD Negeri 21 Kelapa","SD Negeri 22 Kelapa","SD Negeri 23 Kelapa","SD Negeri 24 Kelapa","SD Negeri 25 Kelapa","SD Negeri 26 Kelapa","SD Negeri 27 Kelapa","TK Negeri Pembina Kelapa","SMP Negeri 1 Tempilang","SMP Negeri 2 Tempilang","SMP Negeri 3 Tempilang","SMP Negeri 4 Tempilang","SD Negeri 1 Tempilang","SD Negeri 2 Tempilang","SD Negeri 3 Tempilang","SD Negeri 4 Tempilang","SD Negeri 5 Tempilang","SD Negeri 6 Tempilang","SD Negeri 7 Tempilang","SD Negeri 8 Tempilang","SD Negeri 9 Tempilang","SD Negeri 10 Tempilang","SD Negeri 11 Tempilang","SD Negeri 12 Tempilang","SD Negeri 13 Tempilang","SD Negeri 14 Tempilang","SD Negeri 15 Tempilang","SD Negeri 16 Tempilang","SD Negeri 17 Tempilang","SD Negeri 18 Tempilang","SD Negeri 19 Tempilang","SD Negeri 20 Tempilang","SD Negeri 21 Tempilang","SD Negeri 22 Tempilang","TK Negeri Pembina Tempilang","SMP Negeri 1 Simpang Teritip","SMP Negeri 2 Simpang Teritip","SMP Negeri 3 Simpang Teritip","SMP Negeri 4 Simpang Teritip","SMP Negeri 5 Simpang Teritip","SMP Negeri 6 Simpang Teritip","SD Negeri 1 Simpang Teritip","SD Negeri 2 Simpang Teritip","SD Negeri 3 Simpang Teritip","SD Negeri 4 Simpang Teritip","SD Negeri 5 Simpang Teritip","SD Negeri 6 Simpang Teritip","SD Negeri 7 Simpang Teritip","SD Negeri 8 Simpang Teritip","SD Negeri 9 Simpang Teritip","SD Negeri 10 Simpang Teritip","SD Negeri 11 Simpang Teritip","SD Negeri 12 Simpang Teritip","SD Negeri 13 Simpang Teritip","SD Negeri 14 Simpang Teritip","SD Negeri 15 Simpang Teritip","SD Negeri 16 Simpang Teritip","SD Negeri 17 Simpang Teritip","SD Negeri 18 Simpang Teritip","SD Negeri 19 Simpang Teritip","TK Negeri Pembina Simpang Teritip","Dinas Ketahanan Pangan dan Pertanian","Dinas Kesehatan","Puskesmas Puput","Puskesmas Jebus","Puskesmas Sekar Biru","Puskesmas Tempilang","Puskesmas Kelapa","Puskesmas Mentok","Puskesmas Simpang Teritip","Puskesmas Kundi","Dinas Sosial, Pemberdayaan Masyarakat dan Desa","Dinas Penanaman Modal dan Pelayanan Satu Pintu","Dinas Lingkungan Hidup","Satuan Polisi Pamong Praja dan Pemadam Kebakaran","Dinas Kependudukan dan Pencatatan Sipil","Dinas Pemberdayaan Perempuan dan Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana","Kecamatan Mentok","Kecamatan Jebus","Kecamatan Simpang Teritip","Kecamatan Kelapa","Kecamatan Tempilang","Kecamatan Parittiga","Kelurahan Tanjung","Kelurahan Sungai Daeng","Kelurahan Sungai Baru","Kelurahan Menjelang","Kelurahan Keranggan","Kelurahan Kelapa","UPT RSUD Sejiran Setason"];
const getWords = (s: string) => {
  if (!s) return [];
  const cleaned = s.toUpperCase()
          .replace(/&/g, ' DAN ')
          .replace(/SDM/g, ' SUMBER DAYA MANUSIA ')
          .replace(/MUNTOK/g, ' MENTOK ')
          .replace(/ - PEMERINTAH.*/g, '')
          .replace(/KABUPATEN BANGKA BARAT/g, '')
          .replace(/KAB\. BANGKA BARAT/g, '')
          .replace(/[^A-Z0-9\s]/g, ' ')
          .trim();
  return Array.from(new Set(cleaned.split(/\s+/).filter(w => w !== 'DAN' && w.length > 2)));
};

const matchScore = (w1: string[], w2: string[]) => {
  if (w1.length === 0 || w2.length === 0) return 0;
  const common = w1.filter(w => w2.includes(w)).length;
  return common / Math.min(w1.length, w2.length);
};

const PARSED_UNIT_KERJA_OPTIONS = UNIT_KERJA_OPTIONS.map(opt => ({
  opt,
  words: getWords(opt)
}));

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('view-dashboard');
  const [pegawaiList, setPegawaiList] = useState<any[]>([]);
  const [selectedPegawai, setSelectedPegawai] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPegawaiModal, setShowPegawaiModal] = useState(false);
  const [pegawaiForm, setPegawaiForm] = useState<any>({});
  const [showIdpModal, setShowIdpModal] = useState(false);
  const [idpForm, setIdpForm] = useState<any>({});
  const [semuaPegawai, setSemuaPegawai] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [searchPegawai, setSearchPegawai] = useState('');
  const [searchSertifikasi, setSearchSertifikasi] = useState('');
  const [exportJenisKursusFilter, setExportJenisKursusFilter] = useState('all');
  const [searchIdp, setSearchIdp] = useState('');

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

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPagePegawai(1);
    setCurrentPageSert(1);
    setCurrentPageIdp(1);
    setCurrentPageTren(1);
  }, [filterMode, statusFilter, tahunFilter, searchPegawai, searchSertifikasi, searchIdp, searchTren, filterTrenStatus]);

  // Pagination UI Component
  const PaginationControls = ({ currentPage, setCurrentPage, totalItems }: { currentPage: number, setCurrentPage: (p: number) => void, totalItems: number }) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;
    return (
      <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
        <button className="btn btn-outline-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button className="btn btn-outline-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
      </div>
    );
  };


  const fetchData = async () => {
    try {
      const userNip = localStorage.getItem('loggedInUser') || '';
      const [resData, resAll] = await Promise.all([
        fetch(`/api/admin/data?nip=${userNip}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        fetch(`/api/pegawai/all?nip=${userNip}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
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
    if (role !== 'admin' && role !== 'super_admin' && role !== 'admin_diklat') {
      router.push('/login');
      return;
    }
    setUserRole(role);
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

  const updateIdpStatus = async (rowIndex: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/idp?rowIndex=${rowIndex}&status=${encodeURIComponent(newStatus)}`, { method: 'PUT' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Gagal memperbarui status');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat memperbarui status');
    }
  };

  const availableYears = useMemo(() => Array.from(new Set(
    rawPegawaiList.flatMap(p => p.sertifikasi?.map((s: any) => s.tahun).filter(Boolean))
  )).sort().reverse(), [rawPegawaiList]);

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
    if (activeTab === 'view-tren') return 'Analisis Tren Tahunan Pemenuhan JP per OPD';
    if (activeTab === 'view-idp') return 'Approval Individual Development Plan (IDP)';
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

  const { groupedByOPD, sortedOPDs } = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    pegawaiList.forEach(p => {
      let matchedOpd = 'Belum Diatur';
      if (p.unit_kerja) {
        const raw = p.unit_kerja.toUpperCase();
        const rawWords = getWords(p.unit_kerja);
        let bestMatch = null;
        let bestScore = 0;

        PARSED_UNIT_KERJA_OPTIONS.forEach(({opt, words}) => {
          const score = matchScore(rawWords, words);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = opt;
          }
        });

        let found = bestScore >= 0.7 ? bestMatch : null;
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
    const yearsFromData = rawPegawaiList.flatMap(p => p.sertifikasi?.map((s: any) => String(s.tahun)).filter(Boolean) || []);
    const uniqueYears = Array.from(new Set(yearsFromData)).filter(y => /^\d{4}$/.test(y)).sort();
    const baseYears = ['2023', '2024', '2025'];
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
    const start = (currentPageTren - 1) * ITEMS_PER_PAGE;
    return filteredOpdTrendList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOpdTrendList, currentPageTren]);

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
              <i className="bi bi-shield-lock-fill text-info me-2"></i> Admin SIPJP-BABAR
            </div>
            <ul className="sidebar-nav">
              <li><a onClick={() => setActiveTab('view-dashboard')} className={`nav-item ${activeTab === 'view-dashboard' ? 'active' : ''}`}><i className="bi bi-speedometer2"></i> Dashboard</a></li>
              {(userRole === 'super_admin' || userRole === 'admin') && (
                <li><a onClick={() => setActiveTab('view-pegawai')} className={`nav-item ${activeTab === 'view-pegawai' ? 'active' : ''}`}><i className="bi bi-people-fill"></i> Data Pegawai</a></li>
              )}
              <li><a onClick={() => setActiveTab('view-sertifikasi')} className={`nav-item ${activeTab === 'view-sertifikasi' ? 'active' : ''}`}><i className="bi bi-journal-check"></i> Rekap Sertifikasi</a></li>
              <li><a onClick={() => setActiveTab('view-tren')} className={`nav-item ${activeTab === 'view-tren' ? 'active' : ''}`}><i className="bi bi-graph-up-arrow"></i> Tren Tahunan OPD</a></li>
              <li><a onClick={() => setActiveTab('view-idp')} className={`nav-item ${activeTab === 'view-idp' ? 'active' : ''}`}><i className="bi bi-calendar2-check"></i> Approval IDP</a></li>
              <li className="mt-5"><a onClick={handleLogout} className="text-danger"><i className="bi bi-box-arrow-left"></i> Logout</a></li>
            </ul>
          </div>

          {/* Main Content */}
          <div className="col-lg-10 col-md-12">
            <div className="topbar">
              <h5 className="fw-bold text-secondary mb-0">{getTopbarTitle()}</h5>
              <div className="d-flex align-items-center gap-3">
                {activeTab !== 'view-dashboard' && (
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted fw-bold" style={{fontSize: '0.85rem'}}>Tahun:</span>
                    <select 
                      className="form-select form-select-sm border-secondary shadow-sm" 
                      style={{ width: '100px', cursor: 'pointer', fontWeight: 'bold' }}
                      value={tahunFilter}
                      onChange={(e) => setTahunFilter(e.target.value)}
                    >
                      <option value="all">Semua</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                  </div>
                )}
                <i className="bi bi-bell fs-5 text-muted ms-2"></i>
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px', fontWeight: 'bold' }}>AD</div>
                  <span className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>Administrator Utama</span>
                </div>
              </div>
            </div>

            <div className="p-4 p-md-5">
              
              {/* DASHBOARD TAB */}
              {activeTab === 'view-dashboard' && (() => {
                const totalPegawai = rawPegawaiList.length;
                const totalPNS = rawPegawaiList.filter(p => (p.status_pegawai || '').toUpperCase() === 'PNS').length;
                const totalPPPK = rawPegawaiList.filter(p => {
                  const s = (p.status_pegawai || '').toUpperCase();
                  return s.includes('P3K') || s.includes('PPPK');
                }).length;
                
                const currentYear = chartData.length > 0 ? chartData[chartData.length - 1].year : new Date().getFullYear().toString();
                const currentYearData = chartData.find(d => d.year === currentYear) || { 'Memenuhi Syarat': 0, 'Belum Memenuhi': 0 };
                const totalCurrent = currentYearData['Memenuhi Syarat'] + currentYearData['Belum Memenuhi'];
                const percentLulus = totalCurrent > 0 ? Math.round((currentYearData['Memenuhi Syarat'] / totalCurrent) * 100) : 0;

                const pieData = [
                  { name: 'Memenuhi', value: currentYearData['Memenuhi Syarat'], color: '#10b981' },
                  { name: 'Belum', value: currentYearData['Belum Memenuhi'], color: '#f59e0b' }
                ];

                return (
                <div>
                  <div className="row g-4">
                    <div className="col-lg-8">
                      <div className="card card-custom p-4 shadow-sm border-0 h-100 rounded-4">
                        <h5 className="fw-bold mb-4 text-dark">
                          <i className="bi bi-graph-up text-primary me-2"></i> 
                          Tren Kelulusan per Tahun
                        </h5>
                        <div style={{ width: '100%', height: 350 }}>
                          {chartData.length > 0 ? (
                            <ResponsiveContainer>
                              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorLulus" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorBelum" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="year" stroke="#9ca3af" axisLine={false} tickLine={false} />
                                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                <Area type="monotone" dataKey="Memenuhi Syarat" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLulus)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Area type="monotone" dataKey="Belum Memenuhi" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorBelum)" activeDot={{ r: 6, strokeWidth: 0 }} />
                              </AreaChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                              <i className="bi bi-inbox fs-3 me-2"></i> Belum ada data tersedia
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-lg-4">
                      <div className="card card-custom p-4 shadow-sm border-0 h-100 rounded-4">
                        <h5 className="fw-bold mb-4 text-dark">
                          <i className="bi bi-pie-chart-fill text-warning me-2"></i> 
                          Proporsi Tahun {currentYear}
                        </h5>
                        <div style={{ width: '100%', height: 350 }}>
                          {totalCurrent > 0 ? (
                            <ResponsiveContainer>
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={80}
                                  outerRadius={120}
                                  paddingAngle={5}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                                  formatter={(value: any) => [`${value} Pegawai`, '']}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                              <i className="bi bi-pie-chart fs-3 me-2"></i> Data kosong
                            </div>
                          )}
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
                        {(userRole === 'super_admin' || userRole === 'admin') && (
                          <button className="btn btn-sm btn-primary" onClick={() => {
                            setPegawaiForm({ isEdit: false, password: '123', status_aktif: 'Aktif', jp: 0 });
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
                            <td className="fw-bold">{p.nama || '-'}</td>
                            <td>{p.status_aktif || 'Aktif'}</td>
                            <td>{p.jabatan || '-'}</td>
                            <td>{p.unit_kerja || '-'}</td>
                            <td className="text-center"><span className="fw-bold text-primary">{p.jp} JP</span></td>
                            <td className="text-center">
                              {(userRole === 'super_admin' || userRole === 'admin') ? (
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
                                  {p.role === 'super_admin' ? 'Super Admin' : p.role === 'admin' ? 'Admin' : 'Pegawai Biasa'}
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              <button className="btn btn-sm btn-outline-info me-1" title="Lihat Profil" onClick={() => { setSelectedPegawai(p); setShowModal(true); }}><i className="bi bi-eye"></i></button>
                              {(userRole === 'super_admin' || userRole === 'admin') && (
                                <>
                                  <button className="btn btn-sm btn-outline-primary me-1" title="Edit Pegawai" onClick={() => {
                                    const jenkelOptions = ['LAKI-LAKI', 'PEREMPUAN'];
                                    let matchedJenkel = p.jenkel || '';
                                    if (p.jenkel) {
                                      const found = jenkelOptions.find(o => o.toLowerCase() === p.jenkel.trim().toLowerCase());
                                      if (found) matchedJenkel = found;
                                    }

                                    // Simple logic for matching unit_kerja case-insensitively by scraping the dropdown if needed, but since we are in React we can just let it match if we ensure exact case, or just do a quick loop if we had it.
                                    // Let's do a trick: we know the options are in the DOM, but this is state.
                                    // We will just do a standard title casing, but handle 'dan' etc. 
                                    // Actually, it's safer to just provide the array of unit kerjas.
                                    const unitKerjaOptions = ["Sekretariat Daerah","Asisten Pemerintahan dan Kesejahteraan Rakyat","Asisten Perekonomian dan Pembangunan","Asisten Administrasi Umum","Staf Ahli Bupati Bidang Hukum, Politik dan Pemerintahan","Staf Ahli Bupati Bidang Ekonomi dan Pembangunan","Staf Ahli Bupati Bidang Kemasyarakatan dan Sumber Daya Manusia","Bagian Kesejahteraan Rakyat","Bagian Tata Pemerintahan","Bagian Perekonomian dan Pembangunan","Bagian Pengadaan Barang dan Jasa","Bagian Hukum","Bagian Umum, Perlengkapan dan Protokol","Bagian Organisasi","Sekretariat DPRD","Inspektorat","Badan Pengelolaan Keuangan dan Aset Daerah","Badan Pengelolaan Pajak dan Retribusi Daerah","Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Daerah","Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah","Badan Penanggulangan Bencana Daerah","Badan Kesatuan Bangsa dan Politik","Dinas Perhubungan, Perumahan dan Kawasan Permukiman","Dinas Komunikasi dan Informatika","Dinas Kebudayaan dan Pariwisata","Dinas Perikanan","Dinas Koperasi, Usaha Kecil Menengah dan Perdagangan","Dinas Perindustrian dan Tenaga Kerja","Dinas Perpustakaan dan Kearsipan","Dinas Pekerjaan Umum dan Penataan Ruang","Dinas Pendidikan,kepemudaan & Olah Raga","SMP Negeri 1 Mentok","SMP Negeri 2 Mentok","SMP Negeri 3 Mentok","SMP Negeri 4 Mentok","SMP Negeri 5 Mentok","SMP Negeri 6 Mentok","SD Negeri 01 Mentok","SD Negeri 02 Mentok","SD Negeri 03 Mentok","SD Negeri 04 Mentok","SD Negeri 05 Mentok","SD Negeri 06 Mentok","SD Negeri 07 Mentok","SD Negeri 08 Mentok","SD Negeri 09 Mentok","SD Negeri 10 Mentok","SD Negeri 11 Mentok","SD Negeri 12 Mentok","SD Negeri 13 Mentok","SD Negeri 14 Mentok","SD Negeri 15 Mentok","SD Negeri 16 Mentok","SD Negeri 17 Mentok","SD Negeri 18 Mentok","SD Negeri 19 Mentok","SD Negeri 20 Mentok","SD Negeri 21 Mentok","SD Negeri 22 Mentok","SD Negeri 23 Mentok","SD Negeri 24 Mentok","TK Negeri Pembina Mentok","TK Negeri Sejiran Setason Mentok","SMP Negeri 1 Jebus","SMP Negeri 2 Jebus","SMP Negeri 3 Jebus","SD Negeri 01 Jebus","SD Negeri 02 Jebus","SD Negeri 03 Jebus","SD Negeri 04 Jebus","SD Negeri 05 Jebus","SD Negeri 06 Jebus","SD Negeri 07 Jebus","SD Negeri 08 Jebus","SD Negeri 09 Jebus","SD Negeri 10 Jebus","SD Negeri 11 Jebus","SD Negeri 12 Jebus","SD Negeri 13 Jebus","SD Negeri 14 Jebus","SD Negeri 15 Jebus","SD Negeri 16 Jebus","SD Negeri 17 Jebus","TK Negeri Pembina Jebus","SMP Negeri 1 Parittiga","SMP Negeri 2 Parittiga","SMP Negeri 3 Parittiga","SMP Negeri 4 Parittiga","SD Negeri 01 Parittiga","SD Negeri 02 Parittiga","SD Negeri 03 Parittiga","SD Negeri 04 Parittiga","SD Negeri 05 Parittiga","SD Negeri 06 Parittiga","SD Negeri 07 Parittiga","SD Negeri 08 Parittiga","SD Negeri 09 Parittiga","SD Negeri 10 Parittiga","SD Negeri 11 Parittiga","SD Negeri 12 Parittiga","SD Negeri 13 Parittiga","SD Negeri 14 Parittiga","SD Negeri 15 Parittiga","SD Negeri 16 Parittiga","SD Negeri 17 Parittiga","SD Negeri 18 Parittiga","SD Negeri 19 Parittiga","TK Negeri Pembina Parittiga","SMP Negeri 1 Kelapa","SMP Negeri 2 Kelapa","SMP Negeri 3 Kelapa","SMP Negeri 4 Kelapa","SMP Negeri 5 Kelapa","SD Negeri 1 Kelapa","SD Negeri 2 Kelapa","SD Negeri 3 Kelapa","SD Negeri 4 Kelapa","SD Negeri 5 Kelapa","SD Negeri 6 Kelapa","SD Negeri 7 Kelapa","SD Negeri 8 Kelapa","SD Negeri 9 Kelapa","SD Negeri 10 Kelapa","SD Negeri 11 Kelapa","SD Negeri 12 Kelapa","SD Negeri 13 Kelapa","SD Negeri 14 Kelapa","SD Negeri 15 Kelapa","SD Negeri 16 Kelapa","SD Negeri 17 Kelapa","SD Negeri 18 Kelapa","SD Negeri 19 Kelapa","SD Negeri 20 Kelapa","SD Negeri 21 Kelapa","SD Negeri 22 Kelapa","SD Negeri 23 Kelapa","SD Negeri 24 Kelapa","SD Negeri 25 Kelapa","SD Negeri 26 Kelapa","SD Negeri 27 Kelapa","TK Negeri Pembina Kelapa","SMP Negeri 1 Tempilang","SMP Negeri 2 Tempilang","SMP Negeri 3 Tempilang","SMP Negeri 4 Tempilang","SD Negeri 1 Tempilang","SD Negeri 2 Tempilang","SD Negeri 3 Tempilang","SD Negeri 4 Tempilang","SD Negeri 5 Tempilang","SD Negeri 6 Tempilang","SD Negeri 7 Tempilang","SD Negeri 8 Tempilang","SD Negeri 9 Tempilang","SD Negeri 10 Tempilang","SD Negeri 11 Tempilang","SD Negeri 12 Tempilang","SD Negeri 13 Tempilang","SD Negeri 14 Tempilang","SD Negeri 15 Tempilang","SD Negeri 16 Tempilang","SD Negeri 17 Tempilang","SD Negeri 18 Tempilang","SD Negeri 19 Tempilang","SD Negeri 20 Tempilang","SD Negeri 21 Tempilang","SD Negeri 22 Tempilang","TK Negeri Pembina Tempilang","SMP Negeri 1 Simpang Teritip","SMP Negeri 2 Simpang Teritip","SMP Negeri 3 Simpang Teritip","SMP Negeri 4 Simpang Teritip","SMP Negeri 5 Simpang Teritip","SMP Negeri 6 Simpang Teritip","SD Negeri 1 Simpang Teritip","SD Negeri 2 Simpang Teritip","SD Negeri 3 Simpang Teritip","SD Negeri 4 Simpang Teritip","SD Negeri 5 Simpang Teritip","SD Negeri 6 Simpang Teritip","SD Negeri 7 Simpang Teritip","SD Negeri 8 Simpang Teritip","SD Negeri 9 Simpang Teritip","SD Negeri 10 Simpang Teritip","SD Negeri 11 Simpang Teritip","SD Negeri 12 Simpang Teritip","SD Negeri 13 Simpang Teritip","SD Negeri 14 Simpang Teritip","SD Negeri 15 Simpang Teritip","SD Negeri 16 Simpang Teritip","SD Negeri 17 Simpang Teritip","SD Negeri 18 Simpang Teritip","SD Negeri 19 Simpang Teritip","TK Negeri Pembina Simpang Teritip","Dinas Ketahanan Pangan dan Pertanian","Dinas Kesehatan","Puskesmas Puput","Puskesmas Jebus","Puskesmas Sekar Biru","Puskesmas Tempilang","Puskesmas Kelapa","Puskesmas Mentok","Puskesmas Simpang Teritip","Puskesmas Kundi","Dinas Sosial, Pemberdayaan Masyarakat dan Desa","Dinas Penanaman Modal dan Pelayanan Satu Pintu","Dinas Lingkungan Hidup","Satuan Polisi Pamong Praja dan Pemadam Kebakaran","Dinas Kependudukan dan Pencatatan Sipil","Dinas Pemberdayaan Perempuan dan Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana","Kecamatan Mentok","Kecamatan Jebus","Kecamatan Simpang Teritip","Kecamatan Kelapa","Kecamatan Tempilang","Kecamatan Parittiga","Kelurahan Tanjung","Kelurahan Sungai Daeng","Kelurahan Sungai Baru","Kelurahan Menjelang","Kelurahan Keranggan","Kelurahan Kelapa","UPT RSUD Sejiran Setason"];
                                    
                                    let matchedUnitKerja = p.unit_kerja || '';
                                    if (p.unit_kerja) {
                                      const found = unitKerjaOptions.find(o => o.toLowerCase() === p.unit_kerja.trim().toLowerCase());
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
                          <div className="dropdown">
                            <button className="btn btn-sm btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                              <i className="bi bi-file-earmark-excel me-1"></i> Export Excel
                            </button>
                            <ul className="dropdown-menu">
                              <li><button className="dropdown-item" onClick={exportToExcelSert}>Semua</button></li>
                              <li><button className="dropdown-item" onClick={exportToExcelSertPNS}>PNS</button></li>
                              <li><button className="dropdown-item" onClick={exportToExcelSertPPPK}>PPPK</button></li>
                            </ul>
                          </div>
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
                                  {openOPD === opd && (
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
                                              {opdPegawai.map((p, pIndex) => (
                                                <tr key={pIndex}>
                                                  <td>{pIndex + 1}</td>
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
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </div>
                                  )}
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
              {activeTab === 'view-tren' && (
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
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                      <div>
                        <h5 className="fw-bold mb-1">
                          <i className="bi bi-table text-primary me-2"></i>
                          Matriks Rekapitulasi Tahunan per OPD
                        </h5>
                        <p className="text-muted small mb-0">
                          Membandingkan persentase pegawai yang memenuhi minimal 20 JP (PNS) / 24 JP (PPPK) dari tahun ke tahun.
                        </p>
                      </div>

                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        <div className="position-relative">
                          <input 
                            type="text" 
                            className="form-control form-control-sm pe-4" 
                            placeholder="Cari Nama OPD..." 
                            value={searchTren}
                            onChange={e => setSearchTren(e.target.value)}
                          />
                          <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-2 text-muted" style={{fontSize: '0.8rem'}}></i>
                        </div>

                        <select 
                          className="form-select form-select-sm border-secondary shadow-sm"
                          style={{ width: '170px', cursor: 'pointer' }}
                          value={filterTrenStatus}
                          onChange={(e: any) => setFilterTrenStatus(e.target.value)}
                        >
                          <option value="all">Semua Status Tren</option>
                          <option value="naik">📈 Tren Naik (Meningkat)</option>
                          <option value="turun">📉 Tren Turun (Menurun)</option>
                          <option value="fluktuatif">〰️ Fluktuatif</option>
                          <option value="stabil">➡️ Stabil</option>
                        </select>

                        <button className="btn btn-sm btn-success shadow-sm" onClick={exportTrenToExcel}>
                          <i className="bi bi-file-earmark-excel me-1"></i> Export Excel Rekap Tren
                        </button>
                      </div>
                    </div>

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
                              const rowNumber = (currentPageTren - 1) * ITEMS_PER_PAGE + idx + 1;
                              return (
                                <tr key={idx} className={selectedOpdChart === item.opd ? 'table-primary' : ''}>
                                  <td>{rowNumber}</td>
                                  <td>
                                    <div className="fw-bold text-dark">{item.opd}</div>
                                  </td>
                                  <td className="text-center">
                                    <span className="badge bg-light text-dark border">
                                      {item.totalMembers} org
                                    </span>
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
                    />
                  </div>
                </div>
              )}

              {/* APPROVAL IDP TAB */}
              {activeTab === 'view-idp' && (
                <div className="table-card">
                  <div className="alert alert-warning mb-4">
                    <i className="bi bi-info-circle-fill me-2"></i> Modul ini masih dalam tahap pengembangan. Integrasi API untuk IDP belum sepenuhnya selesai. Ini adalah pratinjau tampilan tabel verifikasi.
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
                      <button className="btn btn-sm btn-success" onClick={exportIdpToExcel}>
                        <i className="bi bi-file-earmark-excel me-1"></i> Export Excel
                      </button>
                      <button className="btn btn-sm btn-primary" onClick={() => {
                        setIdpForm({ isEdit: false });
                        setShowIdpModal(true);
                      }}>
                        <i className="bi bi-plus-lg me-1"></i> Tambah IDP
                      </button>
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
                          <th>Status</th>
                          <th className="text-center">Aksi Verifikasi</th>
                          <th className="text-center">Aksi Admin</th>
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
                                        {idp.status === 'Disetujui' ? <span className="badge bg-success">Disetujui</span> :
                                         idp.status === 'Ditolak' ? <span className="badge bg-danger">Ditolak</span> :
                                         idp.status === 'Menunggu Persetujuan Admin' ? <span className="badge bg-info text-dark">Disetujui Ketua</span> :
                                         <span className="badge bg-warning text-dark">Menunggu Ketua</span>}
                                      </td>
                                      <td className="text-center">
                                        {idp.status !== 'Disetujui' && idp.status !== 'Ditolak' ? (
                                          <>
                                            <button className="btn btn-sm btn-success me-1" title="Setujui (Final)" onClick={() => updateIdpStatus(idp._rowIndex, 'Disetujui')}><i className="bi bi-check-lg"></i></button>
                                            <button className="btn btn-sm btn-danger" title="Tolak" onClick={() => updateIdpStatus(idp._rowIndex, 'Ditolak')}><i className="bi bi-x-lg"></i></button>
                                          </>
                                        ) : (
                                          <button className="btn btn-sm btn-outline-secondary" disabled>Terverifikasi</button>
                                        )}
                                      </td>
                                      <td className="text-center">
                                        <button className="btn btn-sm btn-outline-primary me-1" title="Edit IDP" onClick={() => {
                                          setIdpForm({ ...idp, nip: p.nip, isEdit: true });
                                          setShowIdpModal(true);
                                        }}><i className="bi bi-pencil"></i></button>
                                        <button className="btn btn-sm btn-outline-danger" title="Hapus IDP" onClick={() => hapusIdp(idp._rowIndex, idp.jenis_kompetensi)}><i className="bi bi-trash"></i></button>
                                      </td>
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
      {showPegawaiModal && (
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
      {showIdpModal && (
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
                        <option value="Menunggu Persetujuan Ketua">Menunggu Persetujuan Ketua</option>
                        <option value="Menunggu Persetujuan Admin">Menunggu Persetujuan Admin (Disetujui Ketua)</option>
                        <option value="Disetujui">Disetujui Final</option>
                        <option value="Ditolak">Ditolak</option>
                      </select>
                    </div>
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
    </>
  );
}
