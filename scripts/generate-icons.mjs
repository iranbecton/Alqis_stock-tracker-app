import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const navy = "#13224A";
const cream = "#EDE0C8";
const brandName = "ALQIS";
const sourcePath = path.join(root, "public", "brand", "a-mark.png");
const iconsDir = path.join(root, "public", "icons");
const splashDir = path.join(root, "public", "splashscreens");
const written = [];

function svgBuffer(markSize) {
  const width = markSize;
  const height = markSize;
  const stroke = Math.max(12, Math.round(markSize * 0.12));
  const halfStroke = stroke / 2;

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <path d="M ${width * 0.5} ${halfStroke} L ${width - halfStroke} ${height - halfStroke} H ${width * 0.7} L ${width * 0.5} ${height * 0.58} L ${width * 0.3} ${height - halfStroke} H ${halfStroke} Z" fill="${cream}"/>
      <path d="M ${width * 0.39} ${height * 0.62} H ${width * 0.61} L ${width * 0.5} ${height * 0.42} Z" fill="${navy}"/>
    </svg>
  `);
}

async function getMarkBuffer(size) {
  if (existsSync(sourcePath)) {
    return sharp(sourcePath)
      .resize(size, size, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  }

  return sharp(svgBuffer(size)).png().toBuffer();
}

async function writeIcon(fileName, size, scale = 0.72) {
  const iconPath = path.join(iconsDir, fileName);
  const markSize = Math.round(size * scale);
  const mark = await getMarkBuffer(markSize);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: navy,
    },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(iconPath);

  written.push({ filePath: iconPath, width: size, height: size });
}

function splashSvg(width, height, markSize) {
  const wordmarkSize = Math.max(36, Math.round(Math.min(width, height) * 0.08));
  const centerY = Math.round(height * 0.43);
  const wordmarkY = centerY + Math.round(markSize * 0.78);

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${navy}"/>
      <g transform="translate(${Math.round((width - markSize) / 2)} ${Math.round(centerY - markSize / 2)})">
        ${svgBuffer(markSize).toString("utf8")}
      </g>
      <text x="50%" y="${wordmarkY}" text-anchor="middle" dominant-baseline="middle" fill="${cream}" font-family="Arial, Helvetica, sans-serif" font-size="${wordmarkSize}" font-weight="700" letter-spacing="10">${brandName}</text>
    </svg>
  `);
}

async function writeSplash(width, height) {
  const fileName = `splash-${width}-${height}.png`;
  const filePath = path.join(splashDir, fileName);
  const markSize = Math.round(Math.min(width, height) * 0.2);

  await sharp(splashSvg(width, height, markSize)).png().toFile(filePath);
  written.push({ filePath, width, height });
}

await mkdir(iconsDir, { recursive: true });
await mkdir(splashDir, { recursive: true });

if (!existsSync(sourcePath)) {
  console.warn("Warning: public/brand/a-mark.png was not found. Generated a programmatic fallback A-mark.");
}

await writeIcon("icon-192.png", 192);
await writeIcon("icon-512.png", 512);
await writeIcon("icon-512-maskable.png", 512, 0.8);
await writeIcon("icon-180.png", 180);
await writeIcon("favicon-32.png", 32);

const phoneSplashes = [
  [640, 1136],
  [750, 1334],
  [1125, 2436],
  [1170, 2532],
  [1290, 2796],
];

const iPadSplashes = [
  [1536, 2048],
  [1668, 2388],
  [2048, 2732],
];

for (const [width, height] of phoneSplashes) {
  await writeSplash(width, height);
}

for (const [width, height] of iPadSplashes) {
  await writeSplash(width, height);
  await writeSplash(height, width);
}

console.log("Generated PWA assets:");
for (const asset of written) {
  console.log(`- ${path.relative(root, asset.filePath)} (${asset.width}x${asset.height})`);
}
console.log("- public/icons/favicon-32.png (32x32) generated. Convert it to public/favicon.ico if ICO support is required.");
