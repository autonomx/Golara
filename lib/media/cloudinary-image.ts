const CLOUDINARY_IMAGE_UPLOAD_SEGMENT = '/image/upload/';

export const storefrontCloudinaryImageTransforms = {
  homepageHero: 'f_auto,q_auto,c_fill,g_auto,w_1600',
  productDetail: 'f_auto,q_auto,c_fill,g_auto,w_1240',
  productCard: 'f_auto,q_auto,c_fill,g_auto,w_800'
} as const;

type StorefrontCloudinaryTransform = keyof typeof storefrontCloudinaryImageTransforms;

export function applyCloudinaryImageTransform(src: string, transform: string) {
  if (!src || !transform) {
    return src;
  }

  try {
    const url = new URL(src);

    if (url.hostname !== 'res.cloudinary.com') {
      return src;
    }

    const uploadSegmentIndex = url.pathname.indexOf(CLOUDINARY_IMAGE_UPLOAD_SEGMENT);

    if (uploadSegmentIndex < 0) {
      return src;
    }

    const uploadPrefixEnd = uploadSegmentIndex + CLOUDINARY_IMAGE_UPLOAD_SEGMENT.length;
    const uploadPrefix = url.pathname.slice(0, uploadPrefixEnd);
    const assetPath = url.pathname.slice(uploadPrefixEnd);

    if (!assetPath || assetPath.startsWith(`${transform}/`)) {
      return src;
    }

    url.pathname = `${uploadPrefix}${transform}/${assetPath}`;
    return url.toString();
  } catch {
    return src;
  }
}

export function getStorefrontCloudinaryImage(src: string, transform: StorefrontCloudinaryTransform) {
  return applyCloudinaryImageTransform(src, storefrontCloudinaryImageTransforms[transform]);
}
