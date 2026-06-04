'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { cmsHomepageService } from '@/lib/cms/homepage-service';
import { normalizeImageUrl } from '@/lib/media/media-storage';
import { hasDatabase } from '@/lib/prisma';

async function ensureCanWriteHomepage() {
  await assertAdminRole('owner');
  if (!hasDatabase()) {
    throw new Error('DATABASE_URL is not configured. Add a PostgreSQL connection before editing homepage content.');
  }
}

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : fallback;
}

function requiredString(formData: FormData, name: string) {
  const value = stringField(formData, name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function optionalImage(formData: FormData, selectedName: string, manualName: string, existingName: string) {
  const selected = stringField(formData, selectedName);
  if (selected) return selected;
  const manual = stringField(formData, manualName);
  if (manual) return normalizeImageUrl(manual);
  return stringField(formData, existingName) || undefined;
}

export async function updateExpandedHomepageAction(formData: FormData) {
  await ensureCanWriteHomepage();

  await cmsHomepageService.updateDefault({
    payload: {
      eyebrow: stringField(formData, 'eyebrow'),
      title: requiredString(formData, 'title'),
      body: stringField(formData, 'body'),
      primaryCtaLabel: stringField(formData, 'primaryCtaLabel'),
      primaryCtaHref: stringField(formData, 'primaryCtaHref'),
      secondaryCtaLabel: stringField(formData, 'secondaryCtaLabel'),
      secondaryCtaHref: stringField(formData, 'secondaryCtaHref'),
      panelEyebrow: stringField(formData, 'panelEyebrow'),
      panelTitle: stringField(formData, 'panelTitle'),
      panelBody: stringField(formData, 'panelBody'),
      heroImage: optionalImage(formData, 'heroSelectedMediaUrl', 'heroImageUrl', 'existingHeroImage'),
      heroImageAlt: stringField(formData, 'heroImageAlt'),
      tertiaryCtaLabel: stringField(formData, 'tertiaryCtaLabel'),
      tertiaryCtaHref: stringField(formData, 'tertiaryCtaHref'),
      trustItemOne: stringField(formData, 'trustItemOne'),
      trustItemTwo: stringField(formData, 'trustItemTwo'),
      trustItemThree: stringField(formData, 'trustItemThree'),
      studioBadge: stringField(formData, 'studioBadge'),
      collectionsEyebrow: stringField(formData, 'collectionsEyebrow'),
      collectionsTitle: stringField(formData, 'collectionsTitle'),
      collectionsBody: stringField(formData, 'collectionsBody'),
      collectionsCtaLabel: stringField(formData, 'collectionsCtaLabel'),
      collectionsCtaHref: stringField(formData, 'collectionsCtaHref'),
      footerBody: stringField(formData, 'footerBody'),
      footerServiceBody: stringField(formData, 'footerServiceBody')
    }
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/homepage');
  redirect('/admin/homepage?status=homepage-updated');
}
