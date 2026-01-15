const fs = require('fs');
const path = require('path');

const files = [
    'src/locales/en.json',
    'src/locales/tr.json'
];

files.forEach(file => {
    try {
        const content = fs.readFileSync(path.join(__dirname, '../', file), 'utf8');
        JSON.parse(content);
        console.log(`${file} is valid JSON.`);
    } catch (e) {
        console.error(`Error in ${file}:`, e.message);
    }
});
