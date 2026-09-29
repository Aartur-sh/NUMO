import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Base 512x512 Master SVG Icon for NUMO Radio:
// Woven NUMO Musical Monogram (Letters N, U, M, O woven with Vinyl Record & Eighth Note)
export const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Deep Obsidian Radial Background -->
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="60%" stop-color="#080C16" />
      <stop offset="100%" stop-color="#020408" />
    </radialGradient>

    <!-- Electric Cyan to Blue for Left Pillar ('N') -->
    <linearGradient id="cyanPillar" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#0284C7" />
      <stop offset="100%" stop-color="#0057B7" />
    </linearGradient>

    <!-- Ukrainian Gold to Amber for Right Pillar & Note Tail ('M') -->
    <linearGradient id="goldPillar" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="50%" stop-color="#EAB308" />
      <stop offset="100%" stop-color="#CA8A04" />
    </linearGradient>

    <!-- Continuous Ukrainian Flag Ribbon ('U' & 'M' weave) -->
    <linearGradient id="numoWave" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="35%" stop-color="#0057B7" />
      <stop offset="65%" stop-color="#EAB308" />
      <stop offset="100%" stop-color="#FDE047" />
    </linearGradient>

    <!-- Glowing Vinyl Core Ring ('O') -->
    <linearGradient id="vinylRing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#818CF8" />
      <stop offset="100%" stop-color="#FACC15" />
    </linearGradient>

    <!-- Metallic Border Ring -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#818CF8" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#FACC15" stop-opacity="0.8" />
    </linearGradient>

    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- Background Squircle -->
  <rect width="512" height="512" rx="128" fill="url(#bgGlow)" />
  <rect width="504" height="504" x="4" y="4" rx="124" fill="none" stroke="url(#borderGrad)" stroke-width="2.5" />

  <!-- Equalizer Frequency Soundwaves & Orbital Audio Rings -->
  <circle cx="256" cy="256" r="185" fill="none" stroke="#38BDF8" stroke-width="1.5" stroke-opacity="0.15" stroke-dasharray="6 10" />
  <circle cx="256" cy="256" r="145" fill="none" stroke="#FACC15" stroke-width="1.5" stroke-opacity="0.15" stroke-dasharray="4 8" />

  <!-- Equalizer Frequencies in Background -->
  <g opacity="0.35">
    <rect x="72" y="210" width="6" height="92" rx="3" fill="#38BDF8" />
    <rect x="86" y="170" width="6" height="172" rx="3" fill="#38BDF8" />
    <rect x="100" y="230" width="6" height="52" rx="3" fill="#38BDF8" />
    <rect x="406" y="230" width="6" height="52" rx="3" fill="#FACC15" />
    <rect x="420" y="170" width="6" height="172" rx="3" fill="#FACC15" />
    <rect x="434" y="210" width="6" height="92" rx="3" fill="#FACC15" />
  </g>

  <!-- The Woven NUMO Musical Monogram -->
  <g filter="url(#dropShadow)">
    <!-- 1. 'U' Base Curve connecting left & right pillars in a smooth musical wave -->
    <path d="M 172 340 C 172 395 340 395 340 340 L 340 376 C 340 425 172 425 172 376 Z"
          fill="url(#numoWave)" opacity="0.9" />

    <!-- 2. 'N' Left Pillar (rounded top & bottom flow) -->
    <path d="M 148 136 C 148 116 164 100 184 100 C 204 100 220 116 220 136 L 220 372 C 220 392 204 408 184 408 C 164 408 148 392 148 372 Z"
          fill="url(#cyanPillar)" />

    <!-- 3. 'M' & Eighth Note Flag Swoop on Right Pillar -->
    <path d="M 292 136 C 292 116 308 100 328 100 C 348 100 364 116 364 136 L 364 372 C 364 392 348 408 328 408 C 308 408 292 392 292 372 Z"
          fill="url(#goldPillar)" />

    <!-- Musical Eighth Note Flag swooping elegantly from top-right pillar -->
    <path d="M 348 102 C 388 90 420 120 412 165 C 392 135 368 132 348 138 Z"
          fill="url(#goldPillar)" filter="url(#softGlow)" />

    <!-- 4. Woven Diagonal Wave forming 'M' peaks & 'N' bridge -->
    <path d="M 180 112 C 196 100 218 110 222 130 L 328 372 C 334 386 324 402 308 404 C 294 406 278 394 274 378 L 168 136 C 162 122 168 114 180 112 Z"
          fill="url(#numoWave)" filter="url(#softGlow)" />

    <!-- Specular Highlight Curve -->
    <path d="M 190 126 L 312 380" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-opacity="0.8" />

    <!-- 5. 'O' Central Vinyl Record Disc & Pulsing Radio Core (Woven in center) -->
    <circle cx="256" cy="256" r="48" fill="#090D16" stroke="url(#vinylRing)" stroke-width="5" filter="url(#softGlow)" />
    <circle cx="256" cy="256" r="38" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.25" stroke-dasharray="8 6 12 6" />
    <circle cx="256" cy="256" r="28" fill="none" stroke="#38BDF8" stroke-width="1.5" stroke-opacity="0.4" />
    <circle cx="256" cy="256" r="18" fill="url(#vinylRing)" />
    <circle cx="256" cy="256" r="8" fill="#0A0F1D" />
    <circle cx="256" cy="256" r="4" fill="#FFFFFF" />
  </g>
</svg>`;

// 2. Adaptive/Maskable Android SVG with safe margin
export const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="mBg" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#020408" />
    </radialGradient>
    <linearGradient id="mCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <linearGradient id="mGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="100%" stop-color="#CA8A04" />
    </linearGradient>
    <linearGradient id="mWave" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#0057B7" />
      <stop offset="100%" stop-color="#FDE047" />
    </linearGradient>
    <filter id="mShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <rect width="512" height="512" fill="url(#mBg)" />

  <g transform="translate(66, 66) scale(0.74)" filter="url(#mShadow)">
    <path d="M 172 340 C 172 395 340 395 340 340 L 340 376 C 340 425 172 425 172 376 Z" fill="url(#mWave)" opacity="0.9" />
    <path d="M 148 136 C 148 116 164 100 184 100 C 204 100 220 116 220 136 L 220 372 C 220 392 204 408 184 408 C 164 408 148 392 148 372 Z" fill="url(#mCyan)" />
    <path d="M 292 136 C 292 116 308 100 328 100 C 348 100 364 116 364 136 L 364 372 C 364 392 348 408 328 408 C 308 408 292 392 292 372 Z" fill="url(#mGold)" />
    <path d="M 348 102 C 388 90 420 120 412 165 C 392 135 368 132 348 138 Z" fill="url(#mGold)" />
    <path d="M 180 112 C 196 100 218 110 222 130 L 328 372 C 334 386 324 402 308 404 C 294 406 278 394 274 378 L 168 136 C 162 122 168 114 180 112 Z" fill="url(#mWave)" />
    <path d="M 190 126 L 312 380" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-opacity="0.8" />
    <circle cx="256" cy="256" r="48" fill="#090D16" stroke="#38BDF8" stroke-width="5" />
    <circle cx="256" cy="256" r="38" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.25" stroke-dasharray="8 6 12 6" />
    <circle cx="256" cy="256" r="18" fill="#38BDF8" />
    <circle cx="256" cy="256" r="8" fill="#0A0F1D" />
    <circle cx="256" cy="256" r="4" fill="#FFFFFF" />
  </g>
</svg>`;

async function generate() {
  console.log('Generating stylized NUMO "N" logo icons...');

  // Save master SVG icons
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon);
  fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), maskableSvg);

  const iconBuffer = Buffer.from(svgIcon);
  const maskableBuffer = Buffer.from(maskableSvg);

  // Standard PWA & Web PNG outputs
  const targets = [
    { name: 'favicon-16x16.png', size: 16, buf: iconBuffer },
    { name: 'favicon-32x32.png', size: 32, buf: iconBuffer },
    { name: 'apple-touch-icon.png', size: 180, buf: iconBuffer },
    { name: 'icon-192.png', size: 192, buf: iconBuffer },
    { name: 'icon-512.png', size: 512, buf: iconBuffer },
    { name: 'icon-maskable-192.png', size: 192, buf: maskableBuffer },
    { name: 'icon-maskable-512.png', size: 512, buf: maskableBuffer },
  ];

  for (const { name, size, buf } of targets) {
    await sharp(buf)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, name));
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  console.log('Master stylized "N" logo icons generated successfully!');
}

generate().catch(console.error);
