import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DEFAULT_MANIFEST = 'data/seed-product-photo-prompts.json';
const DEFAULT_OUTPUT_DIRECTORY = 'public/seed-images/photo-real';
const ALLOWED_OUTPUT_ROOT = path.resolve(ROOT, 'public/seed-images');
const DEFAULT_ALLOWED_DOWNLOAD_HOSTS = [
  'oaidalleapiprodscus.blob.core.windows.net',
  'cdn.openai.com',
  'images.openai.com'
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function safeSlug(value) {
  return value.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

function assertPathInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) return candidate;
  throw new Error(`Refusing to access path outside ${path.relative(ROOT, parent)}: ${path.relative(ROOT, candidate)}`);
}

function safeManifestPath() {
  const manifestPath = path.resolve(ROOT, argValue('manifest', DEFAULT_MANIFEST));
  return assertPathInside(path.resolve(ROOT, 'data'), manifestPath);
}

function safeOutputDirectory(value) {
  const outputDirectory = path.resolve(ROOT, value || DEFAULT_OUTPUT_DIRECTORY);
  return assertPathInside(ALLOWED_OUTPUT_ROOT, outputDirectory);
}

function allowedDownloadHosts() {
  return (process.env.IMAGE_GENERATION_ALLOWED_DOWNLOAD_HOSTS || DEFAULT_ALLOWED_DOWNLOAD_HOSTS.join(','))
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

function safeImageDownloadUrl(value) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') throw new Error('Generated image URL must use HTTPS.');
  const hostname = parsed.hostname.toLowerCase();
  const allowed = allowedDownloadHosts().some((host) => hostname === host || hostname.endsWith(`.${host}`));
  if (!allowed) throw new Error(`Generated image URL host is not allowed: ${hostname}`);
  return parsed.toString();
}

async function readManifest() {
  return JSON.parse(await readFile(safeManifestPath(), 'utf8'));
}

function endpointUrl() {
  return process.env.IMAGE_GENERATION_BASE_URL || 'https://api.openai.com/v1/images/generations';
}

function requestBody(prompt, size) {
  const model = process.env.IMAGE_GENERATION_MODEL || 'gpt-image-1';
  return {
    model,
    prompt,
    size,
    n: 1
  };
}

async function downloadUrl(url) {
  const response = await fetch(safeImageDownloadUrl(url));
  if (!response.ok) throw new Error(`Image download failed: ${response.status} ${response.statusText}`);
  return Buffer.from(await response.arrayBuffer());
}

function decodeBase64Image(value) {
  return Buffer.from(value, 'base64');
}

async function generateImage(prompt, size) {
  const response = await fetch(endpointUrl(), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${requireEnv('IMAGE_GENERATION_API_KEY')}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(requestBody(prompt, size))
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Generation failed: ${response.status} ${response.statusText}\n${body}`);
  }

  const payload = await response.json();
  const first = payload.data?.[0];
  if (!first) throw new Error('Generation response did not include image data.');
  if (first.b64_json) return decodeBase64Image(first.b64_json);
  if (first.url) return downloadUrl(first.url);
  throw new Error('Generation response did not include b64_json or url.');
}

async function main() {
  const manifest = await readManifest();
  const outputDirectory = safeOutputDirectory(manifest.outputDirectory);
  const size = argValue('size', process.env.IMAGE_GENERATION_SIZE || '1024x1024');
  const only = argValue('only', '');
  const limit = Number.parseInt(argValue('limit', '0'), 10);
  const products = manifest.products
    .filter((product) => !only || product.slug === only)
    .slice(0, Number.isFinite(limit) && limit > 0 ? limit : undefined);

  await mkdir(outputDirectory, { recursive: true });

  for (const product of products) {
    const filename = `${safeSlug(product.slug)}.png`;
    const outputPath = assertPathInside(outputDirectory, path.join(outputDirectory, filename));
    const prompt = `${manifest.styleGuide}\n\nProduct: ${product.title}\nCode: ${product.code}\n\n${product.prompt}`;
    console.log(`Generating ${product.slug} -> ${path.relative(ROOT, outputPath)}`);
    const image = await generateImage(prompt, size);
    await writeFile(outputPath, image);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
