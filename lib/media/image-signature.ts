const MIN_SIGNATURE_BYTES = 12;

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

export function assertImageSignatureMatchesType(type: string, bytes: Uint8Array) {
  if (bytes.length < MIN_SIGNATURE_BYTES) {
    throw new Error('Image upload is too small to validate safely.');
  }
  const sniffedType = sniffImageMimeType(bytes);
  if (!sniffedType) {
    throw new Error('Image upload signature is not a supported image format.');
  }
  if (sniffedType !== type) {
    throw new Error('Image upload content does not match the declared MIME type.');
  }
}
