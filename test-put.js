const nip = 'admin';
fetch('http://localhost:3000/api/pegawai', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nip, nama: 'Administrator Sistem', nip_atasan: '123' })
}).then(res => res.json()).then(console.log).catch(console.error);
