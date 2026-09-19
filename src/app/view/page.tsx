'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function DocumentViewer() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');
  
  if (!url) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <h3 className="text-muted">Tidak ada dokumen yang dipilih.</h3>
      </div>
    );
  }

  const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i) || url.startsWith('data:image');

  return (
    <div className="d-flex flex-column vh-100 bg-dark text-white">
      {/* Header / Navbar untuk tombol kembali */}
      <div className="d-flex justify-content-between align-items-center p-3 shadow-sm bg-black" style={{ zIndex: 10 }}>
        <h5 className="mb-0 fw-bold"><i className="bi bi-file-earmark-text me-2"></i> Pratinjau Dokumen</h5>
        <button 
          className="btn btn-danger px-4 rounded-pill shadow-sm"
          onClick={() => {
            // Mencoba menutup tab saat ini (karena dibuka oleh Google Sheets)
            window.close();
            // Jika browser memblokir penutupan tab, fallback ke back
            setTimeout(() => {
              window.history.back();
            }, 100);
          }}
        >
          <i className="bi bi-arrow-left me-1"></i> Kembali / Tutup Pratinjau
        </button>
      </div>

      {/* Konten Dokumen */}
      <div className="flex-grow-1 overflow-hidden" style={{ position: 'relative' }}>
        {isImage ? (
          <div className="w-100 h-100 d-flex justify-content-center align-items-center p-4">
            <img src={url} alt="Pratinjau" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        ) : (
          <iframe src={url} className="w-100 h-100 border-0" title="Pratinjau PDF"></iframe>
        )}
      </div>
    </div>
  );
}

export default function ViewPage() {
  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      <Suspense fallback={<div className="vh-100 d-flex justify-content-center align-items-center bg-dark text-white">Memuat dokumen...</div>}>
        <DocumentViewer />
      </Suspense>
    </>
  );
}
