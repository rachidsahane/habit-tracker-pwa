import fs from 'fs';
import path from 'path';

const distDir = 'dist';
const src = path.join(distDir, 'index.html');
const dest = path.join(distDir, '404.html');

if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('✅ Copied index.html to 404.html for SPA fallback');
} else {
    console.error('❌ dist/index.html not found!');
    process.exit(1);
}
