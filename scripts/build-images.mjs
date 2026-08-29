/**
 * Photography pipeline.
 *
 *   photos/apartment/*.jpg   your own (or the listing's) interior shots
 *   photos/lovere/*.jpg      destination photography, at whatever size it came
 *          ↓  scripts/curation.json says which file fills which slot
 *   public/images/**         resized, graded, optimised
 *   src/lib/image-manifest.json   dimensions, blur placeholders, credits
 *
 * Run with:  npm run images
 *
 * WHY A GRADE. The destination photographs come from twenty different
 * photographers, several of whom process heavily for HDR. Left alone they
 * fight each other and they fight the ivory palette. A single restrained pass —
 * a little desaturation, highlights warmed a touch, shadows lifted off pure
 * black — makes them read as one body of work. Interiors get a lighter touch
 * because they start neutral.
 *
 * A slot whose source file is absent is reported and left out of the manifest;
 * the site renders a designed placeholder for it rather than breaking. That is
 * what lets you launch with the photographs you have and add the rest later.
 */

import sharp from 'sharp';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MAX_WIDTH = 2400;
const QUALITY = 82;

const paths = {
  curation: path.join(root, 'scripts/curation.json'),
  commonsInfo: path.join(root, 'photos/lovere/_commons-info.json'),
  srcApartment: path.join(root, 'photos/apartment'),
  srcLovere: path.join(root, 'photos/lovere'),
  outApartment: path.join(root, 'public/images/apartment'),
  outLovere: path.join(root, 'public/images/lovere'),
  manifest: path.join(root, 'src/lib/image-manifest.json'),
};

/** Wikimedia's HTML-wrapped author fields, reduced to a name. */
function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(title) {
  return title
    .replace(/^File:/, '')
    .replace(/\.(jpe?g|png|tiff?)$/i, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60);
}

/** slug → attribution, read from the metadata saved beside the photographs. */
async function loadCredits() {
  if (!existsSync(paths.commonsInfo)) return {};
  const info = JSON.parse(await readFile(paths.commonsInfo, 'utf8'));
  const out = {};
  for (const [title, v] of Object.entries(info)) {
    out[slugify(title)] = {
      author: stripHtml(v.artist) || 'Unknown',
      license: v.lic || 'CC',
      licenseUrl: v.licurl || 'https://creativecommons.org/licenses/',
      sourceUrl: v.page || '',
    };
  }
  return out;
}

/**
 * The house grade. `strength` is 1 for destination photography and about
 * half that for interiors.
 */
function graded(pipeline, strength) {
  const s = strength;
  return (
    pipeline
      // Tame the HDR saturation the lake sets arrive with.
      .modulate({ saturation: 1 - 0.15 * s })
      // Per-channel gain and lift: warms the image towards ivory and takes the
      // shadows off pure black. NOT sharp's .tint(), which greyscales first and
      // would throw the colour away entirely.
      .linear(
        [1 + 0.025 * s, 1, 1 - 0.03 * s],
        [5 * s, 4 * s, 2 * s],
      )
  );
}

async function process(sourcePath, outPath, strength) {
  const input = sharp(sourcePath).rotate(); // honour EXIF orientation
  const { width } = await input.metadata();

  const resized = width && width > MAX_WIDTH ? input.resize({ width: MAX_WIDTH }) : input;

  const buffer = await graded(resized, strength)
    .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
    .toBuffer();

  await writeFile(outPath, buffer);

  const meta = await sharp(buffer).metadata();

  // A 16px-wide version, inlined as the blur-up placeholder.
  const tiny = await sharp(buffer).resize({ width: 16 }).jpeg({ quality: 40 }).toBuffer();

  return {
    width: meta.width,
    height: meta.height,
    blurDataURL: `data:image/jpeg;base64,${tiny.toString('base64')}`,
  };
}

async function main() {
  const curation = JSON.parse(await readFile(paths.curation, 'utf8'));
  const credits = await loadCredits();

  await mkdir(paths.outApartment, { recursive: true });
  await mkdir(paths.outLovere, { recursive: true });

  const images = [];
  const missing = [];

  const groups = [
    {
      entries: curation.apartment,
      srcDir: paths.srcApartment,
      outDir: paths.outApartment,
      urlBase: '/images/apartment',
      strength: 0.45,
      defaultCategory: 'apartment',
      credited: false,
    },
    {
      entries: curation.destination,
      srcDir: paths.srcLovere,
      outDir: paths.outLovere,
      urlBase: '/images/lovere',
      strength: 1,
      defaultCategory: 'lovere',
      credited: true,
    },
  ];

  for (const group of groups) {
    for (const entry of group.entries) {
      const source = path.join(group.srcDir, entry.source);
      if (!existsSync(source)) {
        missing.push(`${entry.id} → ${entry.source}`);
        continue;
      }

      const fileName = `${entry.id}.jpg`;
      const dimensions = await process(
        source,
        path.join(group.outDir, fileName),
        group.strength,
      );

      images.push({
        id: entry.id,
        src: `${group.urlBase}/${fileName}`,
        ...dimensions,
        category: entry.category ?? group.defaultCategory,
        section: entry.section,
        alt: entry.alt,
        credit: group.credited ? (credits[entry.source.replace(/\.jpe?g$/i, '')] ?? null) : null,
        ...(entry.focus ? { focus: entry.focus } : {}),
      });

      process.stdout?.write?.('');
      console.log(`  ✓ ${entry.id.padEnd(24)} ${dimensions.width}×${dimensions.height}`);
    }
  }

  // A dedicated 1200×630 Open Graph card. Social platforms crop hard to that
  // ratio, so it is cut deliberately rather than left to chance.
  const ogEntry =
    curation.destination.find((e) => e.id === curation.ogImageId) ??
    curation.apartment.find((e) => e.id === curation.ogImageId);
  if (ogEntry) {
    const ogSource = path.join(
      curation.destination.includes(ogEntry) ? paths.srcLovere : paths.srcApartment,
      ogEntry.source,
    );
    if (existsSync(ogSource)) {
      await mkdir(path.join(root, 'public/images/og'), { recursive: true });
      await graded(sharp(ogSource).rotate().resize({ width: 1200, height: 630, fit: 'cover' }), 1)
        .jpeg({ quality: 84, mozjpeg: true })
        .toFile(path.join(root, 'public/images/og/opengraph.jpg'));
      console.log('  ✓ open-graph card       1200×630');
    }
  }

  await writeFile(
    paths.manifest,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        heroImageId: curation.heroImageId,
        ogImageId: curation.ogImageId,
        images,
      },
      null,
      1,
    ),
  );

  console.log(`\n${images.length} images written to public/images`);

  if (missing.length) {
    console.log('\nSlots still waiting on a photograph (they render as placeholders):');
    for (const m of missing) console.log(`  · ${m}`);
  }

  // A gentle nudge about photographs sitting unused in photos/.
  const unusedApartment = (await readdir(paths.srcApartment).catch(() => []))
    .filter((f) => /\.jpe?g$/i.test(f))
    .filter((f) => !curation.apartment.some((e) => e.source === f));
  if (unusedApartment.length) {
    console.log('\nIn photos/apartment but not in curation.json:');
    for (const f of unusedApartment) console.log(`  · ${f}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
