# Phase 13.19-13.21 — Realistic product photo generation workflow

This bundle adds a safe workflow for generating and serving owned, realistic product photo assets for the top seeded products.

## What this does

- Adds `data/seed-product-photo-prompts.json` with photorealistic prompts for the top 12 seeded products.
- Adds `npm run seed:photos` for generating PNG assets from an OpenAI-compatible image generation endpoint.
- Saves generated assets to `public/seed-images/photo-real`.
- Adds `/seed-images/real-photo/[slug]`, which serves a generated PNG when present.
- Falls back to existing local SVG artwork when a PNG has not been generated yet.

## Required environment

```bash
IMAGE_GENERATION_API_KEY=replace-with-key
```

Optional:

```bash
IMAGE_GENERATION_BASE_URL=https://api.openai.com/v1/images/generations
IMAGE_GENERATION_MODEL=gpt-image-1
IMAGE_GENERATION_SIZE=1024x1024
```

## Generate all top-product photos

```bash
npm run seed:photos
```

## Generate one product

```bash
npm run seed:photos -- --only=vip-box-blue
```

## Generate a limited batch

```bash
npm run seed:photos -- --limit=3
```

## QA checklist

- Run the generator with valid image API credentials.
- Confirm PNG files appear under `public/seed-images/photo-real`.
- Open `/seed-images/real-photo/vip-box-blue` and confirm it serves PNG after generation.
- Delete or rename a generated PNG and confirm the route falls back to SVG.
- Confirm `/products` continues to render before and after PNG generation.
- Confirm generated images have no logos, no watermarks, no copied source-site imagery, and no people.

## Scope note

This bundle does not commit generated binary image files. It adds the prompt manifest, generator, safe route, and fallback behavior so assets can be generated, reviewed, and committed separately.
