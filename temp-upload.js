const { google } = require('googleapis');
const fs = require('fs');
const stream = require('stream');

async function main() {
  const envText = fs.readFileSync('.env.local', 'utf8');
  let email, privateKey;
  envText.split('\n').forEach(line => {
    if (line.startsWith('GOOGLE_CLIENT_EMAIL=')) email = line.split('=')[1].replace(/"/g, '').trim();
    if (line.startsWith('GOOGLE_PRIVATE_KEY=')) privateKey = line.substring(line.indexOf('=') + 1).replace(/"/g, '').replace(/\\n/g, '\n').trim();
  });

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });

  const drive = google.drive({ version: 'v3', auth });
  
  const bufferStream = new stream.PassThrough();
  bufferStream.end(Buffer.from('test content'));

  try {
    const res = await drive.files.create({
      requestBody: { name: 'test.txt', parents: ['1PcOJi0_QOuZWrTrfCr7ClUWZ4a2G7cPf'] },
      media: { mimeType: 'text/plain', body: bufferStream },
      fields: 'id, webViewLink',
      supportsAllDrives: true
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

main().catch(console.error);
