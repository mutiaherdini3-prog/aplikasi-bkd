const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function main() {
  const envText = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  let email, privateKey;
  envText.split('\n').forEach(line => {
    if (line.startsWith('GOOGLE_CLIENT_EMAIL=')) email = line.split('=')[1].replace(/"/g, '').trim();
    if (line.startsWith('GOOGLE_PRIVATE_KEY=')) privateKey = line.substring(line.indexOf('=') + 1).replace(/"/g, '').replace(/\\n/g, '\n').trim();
  });

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
  });

  const drive = google.drive({ version: 'v3', auth });
  
  try {
    const res = await drive.files.create({
      requestBody: {
        name: 'test.txt',
        parents: ['17S1lMVX7ofVo16GE47TFDG4sH62GpEhN']
      },
      media: {
        mimeType: 'text/plain',
        body: 'Hello World'
      }
    });
    console.log('SUCCESS:', res.data);
  } catch(err) {
    console.error('ERROR:', err.message);
  }
}

main();
