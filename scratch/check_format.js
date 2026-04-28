const fs = require('fs');
const path = 'c:/Users/cutef/Downloads/My Projects/the-professor/app-icon.png';

try {
    const buffer = fs.readFileSync(path);
    const magic = buffer.toString('hex', 0, 8);
    console.log(`Magic bytes: ${magic}`);
    
    if (magic.startsWith('89504e47')) {
        console.log('Detected format: PNG');
    } else if (magic.startsWith('52494646') && buffer.toString('utf8', 8, 12) === 'WEBP') {
        console.log('Detected format: WebP');
    } else if (magic.startsWith('ffd8ff')) {
        console.log('Detected format: JPEG');
    } else {
        console.log('Detected format: Unknown');
    }
} catch (err) {
    console.error(err);
}
