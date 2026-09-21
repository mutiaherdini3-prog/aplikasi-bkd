const fs = require('fs');
let content = fs.readFileSync('src/app/edit-profil/page.tsx', 'utf8');
let lines = content.split('\n');

const subdistricts = ['Mentok', 'Jebus', 'Parittiga', 'Kelapa', 'Tempilang', 'Simpang Teritip'];

lines[264] = lines[264].replace(/<option value="([^"]+)">[^<]+<\/option>/g, (match, val) => {
    if (val.startsWith('SD Negeri ')) {
        // Find the number in the string
        let numMatch = val.match(/SD Negeri 0*(\d+)/); // 0* to handle 01 -> 1 if needed, wait no. The user has "SD Negeri 01 Mentok". Let's preserve the 0 if we can.
        
        let numStrMatch = val.match(/SD Negeri (\d+)/);
        if (numStrMatch) {
            let num = numStrMatch[1];
            for (let sub of subdistricts) {
                if (val.toLowerCase().includes(sub.toLowerCase())) {
                    let newVal = `SD Negeri ${num} ${sub}`;
                    return `<option value="${newVal}">${newVal}</option>`;
                }
            }
        }
    }
    return match;
});

fs.writeFileSync('src/app/edit-profil/page.tsx', lines.join('\n'));
