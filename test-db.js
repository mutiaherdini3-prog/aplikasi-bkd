const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gwbcbkcufigoetosqfbm.supabase.co';
const supabaseKey = 'sb_publishable_8CqsUGJn_iSQ8xWIZGcnvQ_KzOZ7IIf';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('sertifikasi').insert([{
    nip: '123456',
    jenis_sertifikasi: 'test',
    jenis_kursus: 'test',
    nama_kursus: 'test',
    klasifikasi_kursus: 'test',
    institusi_penyelenggara: 'test',
    nomor_sertifikasi: 'test',
    tanggal_sertifikasi: 'test',
    jumlah_jp: 10,
    pejabat: 'test',
    biaya: 'test',
    link_sertifikat: 'test'
  }]);
  console.log('Insert Result:', data);
  console.log('Insert Error:', error);
}

test();
