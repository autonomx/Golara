export type MediaStorageProviderName = 'local' | 'cloudinary';

const SUPPORTED_STORAGE_PROVIDERS = new Set(['local', 'cloudinary']);

export type MediaStorageReadiness = {
  provider: MediaStorageProviderName;
  productionSafe: boolean;
  configured: boolean;
  summary: string;
  detail: string;
};

export function configuredMediaStorageProviderName(): MediaStorageProviderName {
  const provider = process.env.MEDIA_STORAGE_PROVIDER?.trim().toLowerCase() || 'local';
  if (SUPPORTED_STORAGE_PROVIDERS.has(provider)) return provider as MediaStorageProviderName;

  console.warn('[media-storage] unsupported MEDIA_STORAGE_PROVIDER; using local storage', { provider });
  return 'local';
}

function cloudinaryConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || '',
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET?.trim() || '',
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || 'golara'
  };
}

export function isCloudinaryStorageConfigured() {
  const { cloudName, uploadPreset } = cloudinaryConfig();
  return Boolean(cloudName && uploadPreset);
}

export function getMediaStorageReadiness(): MediaStorageReadiness {
  const provider = configuredMediaStorageProviderName();

  if (provider === 'cloudinary') {
    const configured = isCloudinaryStorageConfigured();
    return {
      provider: 'cloudinary',
      productionSafe: configured,
      configured,
      summary: configured ? 'Cloudinary media storage is configured.' : 'Cloudinary media storage is selected but incomplete.',
      detail: configured
        ? 'Uploads will be stored through Cloudinary using the configured unsigned upload preset and folder.'
        : 'Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET before relying on Cloudinary uploads.'
    };
  }

  return {
    provider: 'local',
    productionSafe: false,
    configured: true,
    summary: 'Local filesystem uploads are active.',
    detail: 'Local uploads are fine for development but are not durable on serverless or multi-instance production hosting. Configure MEDIA_STORAGE_PROVIDER=cloudinary or a future object-store provider before public launch.'
  };
}
