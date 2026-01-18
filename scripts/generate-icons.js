const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SOURCE_IMAGE = process.argv[2] || 'public/icons/logo-source.png';
const OUTPUT_DIR = 'public/icons';

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Check if source image exists
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error(`Source image not found: ${SOURCE_IMAGE}`);
    console.log('\nUsage: node scripts/generate-icons.js <path-to-logo.png>');
    console.log('Example: node scripts/generate-icons.js ~/Downloads/shuckers-logo.png');
    process.exit(1);
  }

  console.log(`Generating icons from: ${SOURCE_IMAGE}`);

  // Generate PWA icons
  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    await sharp(SOURCE_IMAGE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 10, g: 14, b: 23, alpha: 1 } // #0A0E17 background
      })
      .png()
      .toFile(outputPath);
    console.log(`Created: ${outputPath}`);
  }

  // Generate Apple Touch Icon (180x180)
  await sharp(SOURCE_IMAGE)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 10, g: 14, b: 23, alpha: 1 }
    })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'apple-touch-icon.png'));
  console.log('Created: public/icons/apple-touch-icon.png');

  // Generate favicons
  await sharp(SOURCE_IMAGE)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 10, g: 14, b: 23, alpha: 1 }
    })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'favicon-32x32.png'));
  console.log('Created: public/icons/favicon-32x32.png');

  await sharp(SOURCE_IMAGE)
    .resize(16, 16, {
      fit: 'contain',
      background: { r: 10, g: 14, b: 23, alpha: 1 }
    })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'favicon-16x16.png'));
  console.log('Created: public/icons/favicon-16x16.png');

  // Copy source as icon-192 for notification icon
  await sharp(SOURCE_IMAGE)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 10, g: 14, b: 23, alpha: 1 }
    })
    .png()
    .toFile(path.join(OUTPUT_DIR, '../icon-192.png'));
  console.log('Created: public/icon-192.png (for notifications)');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
