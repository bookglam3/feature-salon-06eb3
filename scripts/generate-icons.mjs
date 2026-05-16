import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Premium dark purple SVG icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0F0B2D"/>
      <stop offset="100%" style="stop-color:#1E1B4B"/>
    </linearGradient>
    <linearGradient id="fgrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#A78BFA"/>
      <stop offset="50%" style="stop-color:#7C3AED"/>
      <stop offset="100%" style="stop-color:#5B21B6"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" fill="url(#bg)" rx="0"/>

  <!-- Subtle glow circle behind F -->
  <ellipse cx="256" cy="256" rx="160" ry="160" fill="#7C3AED" opacity="0.12"/>

  <!-- Letter F - bold, premium -->
  <text
    x="256"
    y="340"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="280"
    text-anchor="middle"
    fill="url(#fgrad)"
    filter="url(#glow)"
  >F</text>

  <!-- Bottom subtle accent line -->
  <rect x="176" y="400" width="160" height="4" rx="2" fill="#7C3AED" opacity="0.6"/>
</svg>`;

const svgBuffer = Buffer.from(svgIcon);

async function generate() {
  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(resolve(__dirname, "../public/icons/icon-192.png"));
  console.log("✅ icon-192.png generated");

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(resolve(__dirname, "../public/icons/icon-512.png"));
  console.log("✅ icon-512.png generated");

  console.log("🎉 Icons ready — dark purple premium style!");
}

generate().catch(console.error);
