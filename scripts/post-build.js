/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Post-build script to ensure proper MIME types for static files
 * Run this after `next build` if Apache serves static files directly
 */

const fs = require('fs');
const path = require('path');

const htaccessContent = `# MIME Types for Next.js static files
<IfModule mod_mime.c>
    AddType text/css .css
    AddType application/javascript .js
    AddType application/json .json
    AddType font/woff .woff
    AddType font/woff2 .woff2
    AddType image/svg+xml .svg
    AddType image/webp .webp
    AddType image/avif .avif
</IfModule>

# Cache Control
<IfModule mod_headers.c>
    Header set Cache-Control "public, max-age=31536000, immutable"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/css application/javascript application/json
</IfModule>
`;

const staticDir = path.join(__dirname, '..', '.next', 'static');

if (fs.existsSync(staticDir)) {
    const htaccessPath = path.join(staticDir, '.htaccess');
    fs.writeFileSync(htaccessPath, htaccessContent);
    console.log('Created .htaccess in .next/static/');
} else {
    console.log('.next/static/ directory not found. Run `next build` first.');
}
