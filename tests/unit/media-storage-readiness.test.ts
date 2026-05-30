import assert from 'node:assert/strict';
import { configuredMediaStorageProviderName, getMediaStorageReadiness, isCloudinaryStorageConfigured } from '../../lib/media/media-storage-readiness';
import { buildUploadedMediaRecordData } from '../../lib/media/media-upload-record';

const ORIGINAL_ENV = { ...process.env };

async function withEnv<T>(env: Record<string, string | undefined>, run: () => Promise<T> | T) {
  process.env = { ...ORIGINAL_ENV };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    return await run();
  } finally {
    process.env = { ...ORIGINAL_ENV };
  }
}

export async function runMediaStorageReadinessTests() {
  await withEnv({ MEDIA_STORAGE_PROVIDER: undefined, CLOUDINARY_CLOUD_NAME: undefined, CLOUDINARY_UPLOAD_PRESET: undefined }, () => {
    assert.equal(configuredMediaStorageProviderName(), 'local');
    assert.deepEqual(getMediaStorageReadiness(), {
      provider: 'local',
      productionSafe: false,
      configured: true,
      summary: 'Local filesystem uploads are active.',
      detail: 'Local uploads are fine for development but are not durable on serverless or multi-instance production hosting. Configure MEDIA_STORAGE_PROVIDER=cloudinary or a future object-store provider before public launch.'
    });
  });

  await withEnv({ MEDIA_STORAGE_PROVIDER: 'bogus', CLOUDINARY_CLOUD_NAME: undefined, CLOUDINARY_UPLOAD_PRESET: undefined }, () => {
    assert.equal(configuredMediaStorageProviderName(), 'local');
    assert.equal(getMediaStorageReadiness().provider, 'local');
  });

  await withEnv({ MEDIA_STORAGE_PROVIDER: 'cloudinary', CLOUDINARY_CLOUD_NAME: 'golara-test', CLOUDINARY_UPLOAD_PRESET: undefined }, () => {
    assert.equal(isCloudinaryStorageConfigured(), false);
    assert.deepEqual(getMediaStorageReadiness(), {
      provider: 'cloudinary',
      productionSafe: false,
      configured: false,
      summary: 'Cloudinary media storage is selected but incomplete.',
      detail: 'Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET before relying on Cloudinary uploads.'
    });
  });

  await withEnv({ MEDIA_STORAGE_PROVIDER: 'cloudinary', CLOUDINARY_CLOUD_NAME: 'golara-test', CLOUDINARY_UPLOAD_PRESET: 'unsigned-preset' }, () => {
    assert.equal(isCloudinaryStorageConfigured(), true);
    assert.deepEqual(getMediaStorageReadiness(), {
      provider: 'cloudinary',
      productionSafe: true,
      configured: true,
      summary: 'Cloudinary media storage is configured.',
      detail: 'Uploads will be stored through Cloudinary using the configured unsigned upload preset and folder.'
    });
  });

  assert.deepEqual(
    buildUploadedMediaRecordData({
      storedFile: {
        url: 'https://cdn.example.test/rose.webp',
        size: 12345,
        type: 'image/webp',
        provider: 'cloudinary'
      },
      alt: 'Rose arrangement',
      originalName: 'rose.webp'
    }),
    {
      url: 'https://cdn.example.test/rose.webp',
      alt: 'Rose arrangement',
      sourceType: 'upload',
      storageProvider: 'cloudinary',
      mimeType: 'image/webp',
      sizeBytes: 12345,
      metadata: { originalName: 'rose.webp' }
    }
  );

  console.log('media-storage-readiness.test.ts passed');
}
