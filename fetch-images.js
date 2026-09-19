const https = require('https');

https.get('https://sidilancuti.bangkabaratkab.go.id/home', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const regex = /<img[^>]+src="([^">]+)"/g;
    let match;
    while ((match = regex.exec(data)) !== null) {
      console.log(match[1]);
    }
  });
}).on('error', (e) => {
  console.error(e);
});
