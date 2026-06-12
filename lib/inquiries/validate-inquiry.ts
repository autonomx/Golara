export type InquiryValidationInput = {
  name: string;
  phone: string;
  email?: string;
  message: string;
  deliveryDate?: string;
  deliveryNotes?: string;
};

export type ValidInquiryInput = {
  name: string;
  phone: string;
  email?: string;
  message: string;
  deliveryDate?: Date;
  deliveryNotes?: string;
};

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function parseOptionalDate(value?: string) {
  const normalized = normalizeOptional(value);
  if (!normalized) return undefined;
  const date = new Date(`${normalized}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function looksLikePhone(value: string) {
  return /^[+()\-\s0-9]{7,32}$/.test(value);
}

export function validateInquiryInput(input: InquiryValidationInput): { ok: true; value: ValidInquiryInput } | { ok: false; code: string } {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = normalizeOptional(input.email);
  const message = input.message.trim();
  const deliveryNotes = normalizeOptional(input.deliveryNotes);

  if (name.length < 2) return { ok: false, code: 'name-required' };
  if (!looksLikePhone(phone)) return { ok: false, code: 'phone-invalid' };
  if (email && !looksLikeEmail(email)) return { ok: false, code: 'email-invalid' };
  if (message.length < 10) return { ok: false, code: 'message-short' };
  // Upper bound length checks to prevent abuse / spam
  if (name.length > 200) return { ok: false, code: 'name-too-long' };
  if (phone.length > 40) return { ok: false, code: 'phone-too-long' };
  if (email && email.length > 320) return { ok: false, code: 'email-too-long' };
  if (message.length > 1000) return { ok: false, code: 'message-too-long' };
  if (deliveryNotes && deliveryNotes.length > 500) return { ok: false, code: 'delivery-notes-too-long' };

  return {
    ok: true,
    value: {
      name,
      phone,
      email,
      message,
      deliveryDate: parseOptionalDate(input.deliveryDate),
      deliveryNotes
    }
  };
}
