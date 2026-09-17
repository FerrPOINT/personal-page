import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const sourceDirectory = path.resolve(process.cwd(), 'assets-source/projects');
const outputDirectory = path.resolve(process.cwd(), 'src/assets/projects');
const variants = [
  { suffix: '800', width: 800, height: 450, avifQuality: 56, webpQuality: 72, avifBudget: 120_000, webpBudget: 180_000 },
  { suffix: '1600', width: 1600, height: 900, avifQuality: 52, webpQuality: 70, avifBudget: 220_000, webpBudget: 320_000 },
];

await mkdir(outputDirectory, { recursive: true });

const checkOnly = process.argv[2] === '--check';
const requestedSlug = checkOnly ? undefined : process.argv[2];

if (checkOnly) {
  const outputs = (await readdir(outputDirectory)).filter((file) => /\.(avif|webp)$/i.test(file));
  if (outputs.length === 0) throw new Error(`No optimized project images found in ${outputDirectory}`);
  for (const file of outputs) {
    const match = file.match(/-(800|1600)\.(avif|webp)$/i);
    if (!match) throw new Error(`Unexpected project image name: ${file}`);
    const variant = variants.find((candidate) => candidate.suffix === match[1]);
    const format = match[2].toLowerCase();
    const filePath = path.join(outputDirectory, file);
    const [metadata, fileStat] = await Promise.all([sharp(filePath).metadata(), stat(filePath)]);
    if (!variant || metadata.width !== variant.width || metadata.height !== variant.height) {
      throw new Error(`${file} must be ${variant?.width ?? '?'}x${variant?.height ?? '?'}`);
    }
    const budget = format === 'avif' ? variant.avifBudget : variant.webpBudget;
    if (fileStat.size > budget) throw new Error(`${file} exceeds ${budget} bytes`);
  }
  process.stdout.write(`Validated ${outputs.length} optimized project images\n`);
  process.exit(0);
}

const files = (await readdir(sourceDirectory))
  .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
  .filter((file) => !requestedSlug || path.parse(file).name === requestedSlug);

if (files.length === 0) {
  throw new Error(requestedSlug
    ? `Project image source not found: ${requestedSlug}`
    : `No source images found in ${sourceDirectory}`);
}

for (const file of files) {
  const slug = path.parse(file).name;
  const source = path.join(sourceDirectory, file);

  for (const variant of variants) {
    const pipeline = sharp(source)
      .resize(variant.width, variant.height, { fit: 'cover', position: 'centre' });

    const avifPath = path.join(outputDirectory, `${slug}-${variant.suffix}.avif`);
    const webpPath = path.join(outputDirectory, `${slug}-${variant.suffix}.webp`);
    await Promise.all([
      pipeline.clone().avif({ quality: variant.avifQuality, effort: 6 })
        .toFile(avifPath),
      pipeline.clone().webp({ quality: variant.webpQuality, effort: 6 })
        .toFile(webpPath),
    ]);

    const [avifSize, webpSize] = await Promise.all([stat(avifPath), stat(webpPath)]);
    if (avifSize.size > variant.avifBudget) {
      throw new Error(`${path.basename(avifPath)} exceeds ${variant.avifBudget} bytes`);
    }
    if (webpSize.size > variant.webpBudget) {
      throw new Error(`${path.basename(webpPath)} exceeds ${variant.webpBudget} bytes`);
    }
  }

  process.stdout.write(`Optimized ${slug}\n`);
}
