import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function p(...parts) {
  return path.resolve(repoRoot, ...parts);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function emptyDir(dir) {
  if (await exists(dir)) {
    await fs.rm(dir, { recursive: true, force: true });
  }
  await ensureDir(dir);
}

async function copyDir(srcDir, destDir) {
  await ensureDir(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

const srcAssets = p('dist', 'client', 'assets');
const destAssets = p('public', 'assets');

if (!(await exists(srcAssets))) {
  console.error(`Missing build assets directory: ${srcAssets}`);
  process.exit(1);
}

await emptyDir(destAssets);
await copyDir(srcAssets, destAssets);

console.log(`Copied client assets -> public/assets (${destAssets})`);
