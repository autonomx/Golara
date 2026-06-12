import 'server-only';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  configuredMediaStorageProviderName,
  getMediaStorageReadiness,
  isCloudinaryStorageConfigured,
  type MediaStorageProviderName,
  type MediaStorageReadiness
} from '@/lib/media/media-storage-readiness';

export { configuredMediaStorageProviderName, getMediaStorageReadiness, type MediaStorageProviderName, type MediaStorageReadiness } from '@/lib/media/media-storage-readiness';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXTERNAL_IMAGE_HOSTS = new Set(['res.cloudinary.com']);
const MIN_SIGNATURE_BYTES = 12;

export type StoredMediaFile = {
  url: string;
  size: number;
  type: string;
  provider: MediaStorageProviderName;
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

export function normalizeImageUrl(value: string) {
  if (value.startsWith('/uploads/')) return value;

  const url = new URL(value);
  if (url.protocol !== 'https:') {
    throw new Error('Image URL must use HTTPS or start with /uploads/.');
  }
  if (!ALLOWED_EXTERNAL_IMAGE_HOSTS.has(url.hostname)) {
    throw new Error('External image URL host is not allowed. Upload the image or use an approved media provider.');
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

function hasPrefix(bytes: Uint8Array, prefix: number[]) {
  if (bytes.length < prefix.length) return false;
  return prefix.every((value, index) => bytes[index] === value);
}

function hasAsciiSignature(bytes: Uint8Array, offset: number, signature: string) {
  if (bytes.length < offset + signature.length) return false;
  return [...signature].every((char, index) => bytes[offset + index] === char.charCodeAt(0));
}

export function sniffImageMimeType(bytes: Uint8Array) {
  if (hasPrefix(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (hasAsciiSignature(bytes, 0, 'GIF87a') || hasAsciiSignature(bytes, 0, 'GIF89a')) return 'image/gif';
  if (hasAsciiSignature(bytes, 0, 'RIFF') && hasAsciiSignature(bytes, 8, 'WEBP')) return 'image/webp';
  return null;
}

export function assertImageSignatureMatchesType(file: File, bytes: Uint8Array) {
  if (bytes.length < MIN_SIGNATURE_BYTES) {
    throw new Error('Image upload is too small to validate safely.');
  }
  const sniffedType = sniffImageMimeType(bytes);
  if (!sniffedType) {
    throw new Error('Image upload signature is not a supported image format.');
  }
  if (sniffedType !== file.type) {
    throw new Error('Image upload content does not match the declared MIME type.');
  }
}

export function assertValidImageUpload(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Upload must be a JPEG, PNG, WebP, or GIF image.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image upload must be 4 MB or smaller.');
  }
}

async function validatedUploadBytes(file: File) {
  assertValidImageUpload(file);
  const bytes = Buffer.from(await file.arrayBuffer());
  assertImageSignatureMatchesType(file, bytes);
  return bytes;
}

const localMediaStorageProvider: MediaStorageProvider = {
  name: 'local',
  productionSafe: false,
  isConfigured() {
    return true;
  },
  readiness() {
    return getMediaStorageReadiness();
  },
  async storeUpload(file: File) {
    const bytes = await validatedUploadBytes(file);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const extension = uploadedFileExtension(file);
    const safeBaseName = slugifyFileName(file.name.replace(/\.[^.]+$/, '')) || 'image';
    const fileName = `${Date.now()}-${safeBaseName}.${extension}`;
    const diskPath = path.join(uploadDir, fileName);
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
  isConfigured: isCloudinaryStorageConfigured,
  readiness() {
    return getMediaStorageReadiness();
  },
  async storeUpload(file: File) {
    const bytes = await validatedUploadBytes(file);

    const { cloudName, uploadPreset, folder } = cloudinaryConfig();
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary storage requires CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET.');
    }

    const safeFile = new File([bytes], file.name, { type: file.type, lastModified: file.lastModified });
    const formData = new FormData();
    formData.set('file', safeFile);
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

export async function storeMediaUpload(file: File): Promise<StoredMediaFile> {
  return getMediaStorageProvider().storeUpload(file);
}

export async function storeLocalMediaUpload(file: File): Promise<StoredMediaFile> {
  return localMediaStorageProvider.storeUpload(file);
}
