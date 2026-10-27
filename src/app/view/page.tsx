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

  const cleanUrl = url.split('?')[0].split('#')[0];
  const isImage = cleanUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || 
                  url.match(/[?&]name=[^&]+\.(jpeg|jpg|gif|png|webp)/i) || 
                  url.startsWith('data:image');
  const isWord = cleanUrl.match(/\.(docx?|doc)$/i) || 
                 url.match(/[?&]name=[^&]+\.(docx?|doc)/i) ||
                 url.toLowerCase().includes('.docx') ||
                 url.toLowerCase().includes('.doc');

  return (
    <div className="d-flex flex-column vh-100 bg-dark text-white">
      {/* Header / Navbar untuk tombol kembali */}
      <div className="d-flex justify-content-between align-items-center p-3 shadow-sm bg-black" style={{ zIndex: 10 }}>
        <h5 className="mb-0 fw-bold"><i className="bi bi-file-earmark-text me-2"></i> Pratinjau Dokumen</h5>
        <div className="d-flex gap-2">
          {url.startsWith('http') && (
            <a href={url} download className="btn btn-outline-light px-3 rounded-pill shadow-sm">
              <i className="bi bi-download me-1"></i> Unduh File
            </a>
          )}
          <button 
            className="btn btn-danger px-4 rounded-pill shadow-sm"
            onClick={() => {
              window.close();
              setTimeout(() => {
                window.history.back();
              }, 100);
            }}
          >
            <i className="bi bi-arrow-left me-1"></i> Kembali / Tutup Pratinjau
          </button>
        </div>
      </div>

      {/* Konten Dokumen */}
      <div className="flex-grow-1 overflow-hidden" style={{ position: 'relative' }}>
        {isImage ? (
          <div className="w-100 h-100 d-flex justify-content-center align-items-center p-4">
            <img src={url} alt="Pratinjau" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        ) : isWord && !url.includes('drive.google.com') ? (
          <div className="w-100 h-100 d-flex flex-column justify-content-center align-items-center p-4 text-center">
            <div className="bg-white bg-opacity-10 p-5 rounded-4 border border-white border-opacity-10 shadow-lg text-center" style={{ maxWidth: '520px' }}>
              <i className="bi bi-file-earmark-word-fill text-primary display-1 mb-3"></i>
              <h4 className="fw-bold mb-2">Dokumen Microsoft Word</h4>
              <p className="text-white-50 mb-4">File sertifikat ini berformat Word (.doc / .docx). Anda dapat mengunduh atau membukanya di aplikasi pengolah dokumen.</p>
              <a href={url} download className="btn btn-primary px-4 py-2 rounded-pill shadow">
                <i className="bi bi-download me-2"></i> Unduh Dokumen Word
              </a>
            </div>
          </div>
        ) : (
          <iframe src={url} className="w-100 h-100 border-0" title="Pratinjau Dokumen"></iframe>
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
