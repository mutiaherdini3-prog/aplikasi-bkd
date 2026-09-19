const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkDrive() {
  const envText = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  let folderId, email, privateKey;
  envText.split('\n').forEach(line => {
    if (line.startsWith('GOOGLE_DRIVE_FOLDER_ID=')) folderId = line.split('=')[1].replace(/"/g, '').trim();
    if (line.startsWith('GOOGLE_CLIENT_EMAIL=')) email = line.split('=')[1].replace(/"/g, '').trim();
    if (line.startsWith('GOOGLE_PRIVATE_KEY=')) privateKey = line.substring(line.indexOf('=') + 1).replace(/"/g, '').replace(/\\n/g, '\n').trim();
  });

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/drive']
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    const meta = await drive.files.get({ fileId: folderId, fields: 'id, name, capabilities' });
    console.log("Folder found!", meta.data);
  } catch (err) {
    console.error("Error accessing folder:", err.message);
  }
}

checkDrive();
