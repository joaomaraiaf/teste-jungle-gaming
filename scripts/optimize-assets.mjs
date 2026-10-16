import { readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const directory = new URL('../public/images/', import.meta.url);
for (const name of await readdir(directory)) {
  if (!/^[a-f0-9]{40}\.png$/.test(name)) continue;
  const input = new URL(name, directory);
  for (const width of [256, 512, 1024]) {
    const output = new URL(
      `${name.slice(0, -4)}${width === 1024 ? '' : `-${width}`}.webp`,
      directory
    );
    await sharp(fileURLToPath(input))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 85, effort: 6 })
      .toFile(fileURLToPath(output));
    console.log(`${output.pathname.split('/').at(-1)}: ${(await stat(output)).size} bytes`);
  }
}
