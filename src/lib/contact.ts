// Single source of truth for the business contact number.
// Leave both empty to hide every phone / WhatsApp link on the site.
// To add the new number, fill in both values — nothing else needs changing.

/** Digits only, with country code. Example: '919876543210' */
export const WHATSAPP_NUMBER = '';

/** Human-readable form shown on screen. Example: '+91 98765 43210' */
export const PHONE_DISPLAY = '';

/** Build a WhatsApp link, or null when no number is set. */
export function whatsappLink(text?: string): string | null {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
