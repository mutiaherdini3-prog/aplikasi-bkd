const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const readline = require('readline');

async function push(token) {
  if (!token) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    return new Promise((resolve) => {
      rl.question('Masukkan GitHub Personal Access Token (PAT): ', async (ans) => {
        rl.close();
        await doPush(ans.trim());
        resolve();
      });
    });
  } else {
    await doPush(token.trim());
  }
}

async function doPush(token) {
  if (!token) {
    console.error('❌ Token tidak boleh kosong!');
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
        username: token,
        password: ''
      })
    });
    console.log('✅ BERHASIL PUSH KE GITHUB!');
    console.log('➡️ Perubahan Anda sekarang sedang diproses dan di-deploy otomatis oleh Vercel ke sipjp-babar (1-2 menit).');
  } catch (err) {
    console.error('❌ Gagal melakukan push:', err.message);
  }
}

const argToken = process.argv[2];
push(argToken);
