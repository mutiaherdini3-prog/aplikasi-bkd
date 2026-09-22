const fs = require('fs');
const pdf = require('pdf-parse');

async function testPdf() {
    let dataBuffer = fs.readFileSync('C:\\Users\\defaultuser0\\.gemini\\antigravity-ide\\brain\\b76c0290-d341-4d72-b05f-af99cb43f9b3\\.user_uploaded\\media_1790047714623.pdf');

    pdf(dataBuffer).then(function(data) {
        fs.writeFileSync('pdf_extracted.txt', data.text);
        console.log('PDF text written to pdf_extracted.txt');
    });
}

testPdf();
