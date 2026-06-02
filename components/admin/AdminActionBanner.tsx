const statusMessages: Record<string, string> = {
  'inquiry-updated': 'Inquiry updated successfully.',
  'follow-up-added': 'Follow-up note added successfully.',
  'homepage-updated': 'Homepage content updated successfully.',
  'category-saved': 'Category saved successfully.',
  'product-saved': 'Product saved successfully.',
  'media-saved': 'Media item saved successfully.',
  'fulfillment-method-updated': 'Fulfillment method saved successfully.'
};

export function AdminActionBanner({ status, message }: { status?: string; message?: string }) {
  const text = message || (status ? statusMessages[status] : undefined);
  if (!text) return null;

  return (
    <div className="rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">
      {text}
    </div>
  );
}
