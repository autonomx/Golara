'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

type ProgressiveStorefrontImageProps = Omit<ImageProps, 'className' | 'onLoad'> & {
  imageClassName?: string;
  placeholderClassName?: string;
  onLoad?: ImageProps['onLoad'];
};

export function ProgressiveStorefrontImage({
  imageClassName,
  placeholderClassName = 'bg-[linear-gradient(135deg,rgba(255,247,241,0.98)_0%,rgba(246,226,214,0.78)_45%,rgba(255,250,245,0.98)_100%)]',
  onLoad,
  ...props
}: ProgressiveStorefrontImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <div
        aria-hidden="true"
        data-storefront-progressive-placeholder="true"
        className={`absolute inset-0 transition-opacity duration-700 ${placeholderClassName} ${loaded ? 'opacity-0' : 'opacity-100'}`}
      />
      <Image
        {...props}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        className={`${imageClassName ?? ''} transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
}
