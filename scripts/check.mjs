import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const files = ['public/assets/js/main.js', 'playwright.config.mjs'];
for (const directory of ['scripts', 'tests']) {
  for (const file of await readdir(directory))
    if (file.endsWith('.mjs')) files.push(`${directory}/${file}`);
}
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status) process.exit(result.status);
}
for (const file of ['package.json', 'config/site.json', '.prettierrc.json'])
  JSON.parse(await readFile(file, 'utf8'));
const formatting = spawnSync(
  process.execPath,
  ['node_modules/prettier/bin/prettier.cjs', '--check', '.'],
  { stdio: 'inherit' },
);
if (formatting.status) process.exit(formatting.status);
console.log('JavaScript syntax and JSON configuration checks passed.');
