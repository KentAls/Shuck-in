const fs = require('fs');
const path = require('path');

// Try to use sharp if available, otherwise create SVG fallbacks
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not available, creating SVG icons only');
}

const ICON_SIZES = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];
const OUTPUT_DIR = 'public/icons';

// Create a simple SVG icon with the Shuck It branding
function createSvgIcon(size) {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.38;
  const strokeWidth = Math.max(2, Math.round(size * 0.04));
  const fontSize = Math.round(size * 0.4);

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0A0E17"/>
  <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#00D9FF" stroke-width="${strokeWidth}"/>
  <text x="${centerX}" y="${centerY + fontSize * 0.35}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#00D9FF" text-anchor="middle">S</text>
</svg>`;
}

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Generating placeholder icons...');

  if (sharp) {
    // Generate PNG icons using sharp
    for (const size of ICON_SIZES) {
      const svg = createSvgIcon(size);
      const pngPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

      await sharp(Buffer.from(svg))
        .png()
        .toFile(pngPath);
      console.log(`Created: ${pngPath}`);
    }

    // Create notification icon
    const svg192 = createSvgIcon(192);
    await sharp(Buffer.from(svg192))
      .png()
      .toFile(path.join('public', 'icon-192.png'));
    console.log('Created: public/icon-192.png');

    // Apple touch icon
    const svg180 = createSvgIcon(180);
    await sharp(Buffer.from(svg180))
      .png()
      .toFile(path.join(OUTPUT_DIR, 'apple-touch-icon.png'));
    console.log('Created: public/icons/apple-touch-icon.png');

    // Favicons
    const svg32 = createSvgIcon(32);
    await sharp(Buffer.from(svg32))
      .png()
      .toFile(path.join(OUTPUT_DIR, 'favicon-32x32.png'));
    console.log('Created: public/icons/favicon-32x32.png');

    const svg16 = createSvgIcon(16);
    await sharp(Buffer.from(svg16))
      .png()
      .toFile(path.join(OUTPUT_DIR, 'favicon-16x16.png'));
    console.log('Created: public/icons/favicon-16x16.png');

    // Shortcut icons
    const shortcutIcons = [
      { name: 'dashboard', symbol: 'D' },
      { name: 'calendar', symbol: 'C' },
      { name: 'chat', symbol: 'M' },
    ];

    for (const icon of shortcutIcons) {
      const svg = `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="#0A0E17"/>
  <circle cx="48" cy="48" r="36" fill="none" stroke="#00D9FF" stroke-width="4"/>
  <text x="48" y="60" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="bold" fill="#00D9FF" text-anchor="middle">${icon.symbol}</text>
</svg>`;
      await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(OUTPUT_DIR, `${icon.name}.png`));
      console.log(`Created: ${OUTPUT_DIR}/${icon.name}.png`);
    }

  } else {
    // Fallback: create SVG files
    for (const size of ICON_SIZES) {
      const svg = createSvgIcon(size);
      const svgPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.svg`);
      fs.writeFileSync(svgPath, svg);
      console.log(`Created: ${svgPath}`);
    }
  }

  console.log('\nPlaceholder icons generated successfully!');
}

generateIcons().catch(console.error);
