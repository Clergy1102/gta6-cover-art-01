// Vice City Cover Lab — gta6-cover-art-01 entry (Node 22, standard library only).
//
// The app is plain static files under app/ (a single self-contained index.html,
// no build step, no network request) and this program hands it in: it copies
// app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json with the vendored make.fun library.
//
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const MAX_SHOTS = 4;
const MAX_SHOT_BYTES = 262144;

// The gate only judges 3 or 4 screenshots, each within the size cap: refuse
// loudly here instead of handing in an entry the scorer would score 0.
function checkScreenshots(dir: string): string[] {
  if (!existsSync(dir)) throw new Error(`screenshots/ is missing at ${dir}`);
  const shots = readdirSync(dir).filter((n) => !n.startsWith('.'));
  if (shots.length < 3 || shots.length > MAX_SHOTS) {
    throw new Error(`screenshots/ must hold 3 to 4 images, found ${shots.length}`);
  }
  for (const name of shots) {
    if (!/\.(png|jpe?g)$/i.test(name)) {
      throw new Error(`screenshot ${name} is not a PNG or JPEG`);
    }
    const bytes = statSync(join(dir, name)).size;
    if (bytes > MAX_SHOT_BYTES) {
      throw new Error(`screenshot ${name} is ${bytes} bytes, over the 256 KiB cap`);
    }
  }
  return shots;
}

const shotNames = checkScreenshots(join(here, 'screenshots'));

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Same caps the scorer enforces: only text_max_bytes shapes the dossier's
// bytes; the others refuse an entry the scorer would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: MAX_SHOTS, max_bytes: MAX_SHOT_BYTES },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`handed in ${shotNames.length} screenshots (${shotNames.join(', ')}) to ${out}`);
