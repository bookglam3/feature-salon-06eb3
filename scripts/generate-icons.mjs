import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Read the app icon SVG
const svgPath = join(root, "public/brand/logo-app-icon.svg");
const svgBuffer = readFileSync(svgPath);

// Ensure icons directory exists
mkdirSync(join(root, "public/icons"), { recursive: true });

const sizes = [
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 180, name: "apple-touch-icon.png" },
];

for (const { size, name } of sizes) {
  const outPath = join(root, "public/icons", name);
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✅ Generated ${name} (${size}x${size})`);
}

console.log("\n🎉 All icons generated from logo-app-icon.svg");
