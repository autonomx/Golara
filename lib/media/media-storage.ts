import 'server-only';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const SUPPORTED_STORAGE_PROVIDERS = new Set(['local', 'cloudinary']);

export type MediaStorageProviderName = 'local' | 'cloudinary';

export type StoredMediaFile = {
  url: string;
  size: number;
  type: string;
  provider: MediaStorageProviderName;
};

export type MediaStorageReadiness = {
  provider: MediaStorageProviderName;
  productionSafe: boolean;
  configured: boolean;
  summary: string;
  detail: string;
};

type MediaStorageProvider = {
  name: MediaStorageProviderName;
  productionSafe: boolean;
  isConfigured(): boolean;
  readiness(): MediaStorageReadiness;
  storeUpload(file: File): Promise<StoredMediaFile>;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  url?: string;
  bytes?: number;
  resource_type?: string;
  format?: string;
  error?: { message?: string };
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

function cloudinaryConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || '',
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET?.trim() || '',
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || 'golara'
  };
}

function cloudinaryConfigured() {
  const { cloudName, uploadPreset } = cloudinaryConfig();
  return Boolean(cloudName && uploadPreset);
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
  productionSafe: false,
  isConfigured() {
    return true;
  },
  readiness() {
    return {
      provider: 'local',
      productionSafe: false,
      configured: true,
      summary: 'Local filesystem uploads are active.',
      detail: 'Local uploads are fine for development but are not durable on serverless or multi-instance production hosting. Configure MEDIA_STORAGE_PROVIDER=cloudinary or a future object-store provider before public launch.'
    };
  },
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

const cloudinaryMediaStorageProvider: MediaStorageProvider = {
  name: 'cloudinary',
  productionSafe: true,
  isConfigured: cloudinaryConfigured,
  readiness() {
    const configured = cloudinaryConfigured();
    return {
      provider: 'cloudinary',
      productionSafe: configured,
      configured,
      summary: configured ? 'Cloudinary media storage is configured.' : 'Cloudinary media storage is selected but incomplete.',
      detail: configured
        ? 'Uploads will be stored through Cloudinary using the configured unsigned upload preset and folder.'
        : 'Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET before relying on Cloudinary uploads.'
    };
  },
  async storeUpload(file: File) {
    assertValidImageUpload(file);

    const { cloudName, uploadPreset, folder } = cloudinaryConfig();
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary storage requires CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET.');
    }

    const formData = new FormData();
    formData.set('file', file);
    formData.set('upload_preset', uploadPreset);
    if (folder) formData.set('folder', folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    const payload = (await response.json()) as CloudinaryUploadResponse;

    if (!response.ok || payload.error) {
      throw new Error(payload.error?.message || `Cloudinary upload failed with status ${response.status}.`);
    }

    const url = payload.secure_url || payload.url;
    if (!url) {
      throw new Error('Cloudinary upload did not return a secure URL.');
    }

    return {
      url,
      size: payload.bytes ?? file.size,
      type: file.type,
      provider: 'cloudinary'
    };
  }
};

function getMediaStorageProvider(): MediaStorageProvider {
  const providerName = configuredMediaStorageProviderName();
  if (providerName === 'cloudinary') return cloudinaryMediaStorageProvider;
  return localMediaStorageProvider;
}

export function getMediaStorageReadiness(): MediaStorageReadiness {
  return getMediaStorageProvider().readiness();
}

export async function storeMediaUpload(file: File): Promise<StoredMediaFile> {
  return getMediaStorageProvider().storeUpload(file);
}

export async function storeLocalMediaUpload(file: File): Promise<StoredMediaFile> {
  return localMediaStorageProvider.storeUpload(file);
}
