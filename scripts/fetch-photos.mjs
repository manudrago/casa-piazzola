/**
 * Fetch the destination photography from Wikimedia Commons.
 *
 *   npm run photos:fetch
 *
 * Every entry in scripts/curation.json that names a `commons` file and whose
 * `source` is not yet in photos/lovere/ gets downloaded, resized to 2400px and
 * saved under that filename. Its licence and author are merged into
 * photos/lovere/_commons-info.json, which is what the credits page is built
 * from — so provenance travels with the photograph and never has to be
 * reconstructed by hand.
 *
 * WHY THIS EXISTS. Commons rate-limits hard per IP. If a batch stops with 429s,
 * wait and run it again: files already present are skipped, so it picks up
 * exactly where it left off. Running it from a normal home connection is
 * usually painless; running it from a shared cloud IP is not.
 *
 * Be a good citizen: the delay below is deliberate. Do not remove it.
 */

import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CURATION = path.join(root, 'scripts/curation.json');
const PHOTOS = path.join(root, 'photos/lovere');
const INFO = path.join(PHOTOS, '_commons-info.json');

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'CasaPiazzolaSiteBuilder/1.0 (https://casapiazzola.example; contact via site) node-fetch';

const DELAY_MS = 4000; // between downloads
const MAX_WIDTH = 2400;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `${API}?${new URLSearchParams({ ...params, format: 'json' })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/** imageinfo for a batch of File: titles. */
async function imageInfo(titles) {
  const out = {};
  for (let i = 0; i < titles.length; i += 20) {
    const data = await api({
      action: 'query',
      titles: titles.slice(i, i + 20).join('|'),
      prop: 'imageinfo',
      iiprop: 'url|size|extmetadata|mime',
    });
    for (const page of Object.values(data?.query?.pages ?? {})) {
      const ii = page.imageinfo?.[0];
      if (!ii) continue;
      const em = ii.extmetadata ?? {};
      out[page.title] = {
        orig: ii.url,
        w: ii.width,
        h: ii.height,
        lic: em.LicenseShortName?.value ?? '',
        licurl: em.LicenseUrl?.value ?? '',
        artist: em.Artist?.value ?? '',
        desc: em.ImageDescription?.value ?? '',
        page: ii.descriptionurl,
      };
    }
    await sleep(1500);
  }
  return out;
}

async function download(url, attempts = 5) {
  let wait = 8000;
  for (let a = 0; a < attempts; a++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) throw new Error('429 rate limited');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 15_000) throw new Error('suspiciously small');
      return buf;
    } catch (error) {
      if (a === attempts - 1) throw error;
      console.log(`    retry ${a + 1} in ${wait / 1000}s — ${error.message}`);
      await sleep(wait);
      wait = Math.min(wait * 2, 120_000);
    }
  }
}

async function main() {
  const curation = JSON.parse(await readFile(CURATION, 'utf8'));
  await mkdir(PHOTOS, { recursive: true });

  const info = existsSync(INFO) ? JSON.parse(await readFile(INFO, 'utf8')) : {};

  const wanted = curation.destination.filter(
    (e) => e.commons && !existsSync(path.join(PHOTOS, e.source)),
  );

  const withoutSource = curation.destination.filter(
    (e) => !e.commons && !existsSync(path.join(PHOTOS, e.source)),
  );

  if (wanted.length === 0) {
    console.log('Nothing to fetch — every curated photograph is already in photos/lovere.');
  } else {
    console.log(`Fetching ${wanted.length} photograph(s) from Wikimedia Commons…\n`);

    const meta = await imageInfo([...new Set(wanted.map((e) => e.commons))]);
    let done = 0;
    const failed = [];

    for (const entry of wanted) {
      const m = meta[entry.commons];
      if (!m) {
        console.log(`  ✗ ${entry.id} — Commons has no file "${entry.commons}"`);
        failed.push(entry.id);
        continue;
      }
      try {
        const buf = await download(m.orig);
        const out = await sharp(buf)
          .rotate()
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .jpeg({ quality: 88, mozjpeg: true })
          .toBuffer();
        await writeFile(path.join(PHOTOS, entry.source), out);
        info[entry.commons] = m;
        done++;
        console.log(`  ✓ ${entry.id.padEnd(22)} ${entry.source}`);
      } catch (error) {
        console.log(`  ✗ ${entry.id} — ${error.message}`);
        failed.push(entry.id);
      }
      await sleep(DELAY_MS);
    }

    await writeFile(INFO, JSON.stringify(info, null, 1));
    console.log(`\n${done} downloaded.`);

    if (failed.length) {
      console.log(
        `\n${failed.length} still missing: ${failed.join(', ')}` +
          `\nCommons rate-limits per IP. Wait a few minutes and run this again —` +
          `\nfiles already downloaded are skipped.`,
      );
    }
  }

  if (withoutSource.length) {
    console.log('\nSlots with no Commons file named — supply these yourself:');
    for (const e of withoutSource) console.log(`  · ${e.id} → photos/lovere/${e.source}`);
  }

  console.log('\nNext: npm run images');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
