const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function doPush() {
  const token = process.argv[2] || process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ GITHUB_TOKEN tidak ditemukan di .env.local atau argumen!');
    process.exit(1);
  }
  console.log('🚀 Sedang melakukan push ke GitHub (mutiaherdini3-prog/aplikasi-bkd, branch main)...');
  try {
    const pushResult = await git.push({
      fs,
      http,
      dir: '.',
      remote: 'origin',
      ref: 'main',
      onAuth: () => ({
        username: token.trim(),
        password: ''
      })
    });
    console.log('✅ BERHASIL PUSH KE GITHUB!');
    console.log('➡️ Perubahan Anda sekarang sedang diproses dan di-deploy otomatis oleh Vercel ke sipjp-babar (1-2 menit).');
  } catch (err) {
    console.error('❌ Gagal melakukan push:', err.message);
  }
}

doPush();
