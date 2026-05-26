import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outputDir = path.join(root, 'public', 'logo-exports');

fs.mkdirSync(outputDir, { recursive: true });

// Strip the full-canvas background rect from wordmark SVGs so the PNG is transparent.
// The background is always the first <rect> that spans the full viewBox dimensions.
function stripBackground(svgContent, w, h) {
  // Match e.g. <rect width="720" height="160" fill="..." /> or <rect width="720" height="160" fill="..." >
  const re = new RegExp(
    `<rect[^>]*width="${w}"[^>]*height="${h}"[^>]*/?>`,
    'g'
  );
  return svgContent.replace(re, '');
}

async function svgToPng(svgPath, outName, opts = {}) {
  let svg = fs.readFileSync(svgPath, 'utf8');
  if (opts.stripBg) svg = stripBackground(svg, opts.svgW, opts.svgH);

  const buf = Buffer.from(svg);
  // Render at 3× native size for crispness, then resize down to 1000px on the long side.
  const native = Math.max(opts.svgW, opts.svgH);
  const scale = Math.max(3, Math.ceil(1000 / native));
  const renderW = opts.svgW * scale;
  const renderH = opts.svgH * scale;

  await sharp(buf, { density: 300 })
    .resize(renderW, renderH, { fit: 'fill' })
    .resize(opts.svgW > opts.svgH ? 1000 : null, opts.svgW <= opts.svgH ? 1000 : null, {
      fit: 'inside',
      withoutEnlargement: false,
    })
    .png({ compressionLevel: 6 })
    .toFile(path.join(outputDir, outName));

  console.log(`  ✓ ${outName}`);
}

async function pngToPng(srcPath, outName) {
  const meta = await sharp(srcPath).metadata();
  const isWide = meta.width >= meta.height;
  await sharp(srcPath)
    .resize(isWide ? 1000 : null, isWide ? null : 1000, {
      fit: 'inside',
      withoutEnlargement: false,
    })
    .png({ compressionLevel: 6 })
    .toFile(path.join(outputDir, outName));
  console.log(`  ✓ ${outName}`);
}

console.log('\nExporting Feature logos to /public/logo-exports/\n');

await pngToPng(
  path.join(root, 'public', 'logo.png'),
  'logo-original.png'
);

await svgToPng(
  path.join(root, 'public', 'logo-new.svg'),
  'logo-new.png',
  { svgW: 1024, svgH: 1024, stripBg: false }
);

await svgToPng(
  path.join(root, 'public', 'brand', 'logo-light.svg'),
  'logo-light.png',
  { svgW: 720, svgH: 160, stripBg: true }
);

await svgToPng(
  path.join(root, 'public', 'brand', 'logo-dark.svg'),
  'logo-dark.png',
  { svgW: 720, svgH: 160, stripBg: true }
);

await svgToPng(
  path.join(root, 'public', 'brand', 'logo-mono.svg'),
  'logo-mono.png',
  { svgW: 720, svgH: 160, stripBg: true }
);

await svgToPng(
  path.join(root, 'public', 'brand', 'logo-app-icon.svg'),
  'logo-app-icon.png',
  { svgW: 1024, svgH: 1024, stripBg: false }
);

console.log('\nAll done! Files are in public/logo-exports/\n');
