import 'server-only';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const SUPPORTED_STORAGE_PROVIDERS = new Set(['local']);

export type MediaStorageProviderName = 'local';

export type StoredMediaFile = {
  url: string;
  size: number;
  type: string;
  provider: MediaStorageProviderName;
};

type MediaStorageProvider = {
  name: MediaStorageProviderName;
  storeUpload(file: File): Promise<StoredMediaFile>;
};

export function configuredMediaStorageProviderName(): MediaStorageProviderName {
  const provider = process.env.MEDIA_STORAGE_PROVIDER?.trim().toLowerCase() || 'local';
  if (SUPPORTED_STORAGE_PROVIDERS.has(provider)) return provider as MediaStorageProviderName;

  console.warn('[media-storage] unsupported MEDIA_STORAGE_PROVIDER; using local storage', { provider });
  return 'local';
}

export function normalizeImageUrl(value: string) {
  if (value.startsWith('/uploads/')) return value;

  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Image URL must start with http, https, or /uploads/.');
  }
  return url.toString();
}

function slugifyFileName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uploadedFileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/gif') return 'gif';
  return 'jpg';
}

export function assertValidImageUpload(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Upload must be a JPEG, PNG, WebP, or GIF image.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image upload must be 4 MB or smaller.');
  }
}

const localMediaStorageProvider: MediaStorageProvider = {
  name: 'local',
  async storeUpload(file: File) {
    assertValidImageUpload(file);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const extension = uploadedFileExtension(file);
    const safeBaseName = slugifyFileName(file.name.replace(/\.[^.]+$/, '')) || 'image';
    const fileName = `${Date.now()}-${safeBaseName}.${extension}`;
    const diskPath = path.join(uploadDir, fileName);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(diskPath, bytes);

    return {
      url: `/uploads/${fileName}`,
      size: file.size,
      type: file.type,
      provider: 'local'
    };
  }
};

function getMediaStorageProvider(): MediaStorageProvider {
  const providerName = configuredMediaStorageProviderName();
  if (providerName === 'local') return localMediaStorageProvider;
  return localMediaStorageProvider;
}

export async function storeMediaUpload(file: File): Promise<StoredMediaFile> {
  return getMediaStorageProvider().storeUpload(file);
}

export async function storeLocalMediaUpload(file: File): Promise<StoredMediaFile> {
  return localMediaStorageProvider.storeUpload(file);
}
