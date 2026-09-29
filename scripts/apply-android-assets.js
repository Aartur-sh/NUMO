import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { svgIcon, maskableSvg } from './generate-icons.js';

const resDir = path.resolve('android/app/src/main/res');

const iconSizes = [
  { dir: 'mipmap-mdpi', launcher: 48, foreground: 108 },
  { dir: 'mipmap-hdpi', launcher: 72, foreground: 162 },
  { dir: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
  { dir: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
  { dir: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
];

async function applyAssets() {
  if (!fs.existsSync(resDir)) {
    console.log('Android res directory not found, skipping Android icon replacement.');
    return;
  }

  const iconBuffer = Buffer.from(svgIcon);
  const maskableBuffer = Buffer.from(maskableSvg);

  for (const { dir, launcher, foreground } of iconSizes) {
    const targetDir = path.join(resDir, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Standard square launcher
    await sharp(iconBuffer)
      .resize(launcher, launcher)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // Round launcher (for Android 7.1+)
    const circleSvg = `<svg viewBox="0 0 ${launcher} ${launcher}" width="${launcher}" height="${launcher}"><circle cx="${launcher/2}" cy="${launcher/2}" r="${launcher/2}" fill="#080C15"/></svg>`;
    const roundIcon = await sharp(iconBuffer)
      .resize(launcher, launcher)
      .composite([{
        input: Buffer.from(circleSvg),
        blend: 'dest-in'
      }])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), roundIcon);

    // Adaptive Foreground (for Android 8.0+)
    await sharp(maskableBuffer)
      .resize(foreground, foreground)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`Updated icons in ${dir} (launcher: ${launcher}px, fg: ${foreground}px)`);
  }

  // Also replace drawable splash screens if present
  const drawableDir = path.join(resDir, 'drawable');
  if (fs.existsSync(drawableDir)) {
    await sharp(iconBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(drawableDir, 'splash.png'));
  }

  console.log('All Android icons and assets successfully applied!');
}

applyAssets().catch(console.error);
