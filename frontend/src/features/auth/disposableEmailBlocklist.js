/**
 * Anti-Spam Disposable & Temporary Email Domain Blocklist
 * Prevents automated / throwaway accounts from abusing free AI try-on quota.
 */

export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  '10minutemail.net',
  '10minmail.com',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'tempail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'throwawaymail.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'dispostable.com',
  'getairmail.com',
  'fake.com',
  'fakemail.com',
  'fakemailgenerator.com',
  'spamgourmet.com',
  'generator.email',
  'mohmal.com',
  'crazymailing.com',
  'mytemp.email',
  'emailondeck.com',
  'tmpmail.net',
  'tmpmail.org',
  'boun.cr',
  'inboxkitten.com',
  'nada.ltd',
  'burnermail.io',
  'maildrop.cc',
  'getnada.com',
  'dropmail.me',
  'tempinbox.com',
  'tempmailaddress.com',
  'crazymailing.com',
  'zillamail.com',
  'mailcatch.com',
  'discard.email',
  'spambog.com',
  'tempr.email',
  'mytempmail.com',
]);

/**
 * Checks if an email address belongs to a known temporary/disposable domain.
 * @param {string} email
 * @returns {boolean}
 */
export function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;

  const domain = parts[1];

  // Direct domain match
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return true;
  }

  // Check subdomains (e.g. sub.yopmail.com)
  for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) {
      return true;
    }
  }

  // Catch generic suspicious keywords in domains
  if (
    domain.includes('disposable') ||
    domain.includes('tempmail') ||
    domain.includes('10minute') ||
    domain.includes('fakemail') ||
    domain.includes('trashmail')
  ) {
    return true;
  }

  return false;
}

/**
 * Common trusted email providers (Google, Microsoft, Apple, Yahoo, Vietnamese Universities)
 */
export const TRUSTED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'yahoo.com.vn',
  'icloud.com',
  'fpt.edu.vn',
  'fe.edu.vn',
  'hcmut.edu.vn',
  'neu.edu.vn',
  'ftu.edu.vn',
]);

/**
 * Checks if the email is from a widely trusted real email provider.
 * @param {string} email
 * @returns {boolean}
 */
export function isTrustedEmailProvider(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return TRUSTED_EMAIL_DOMAINS.has(domain) || domain.endsWith('.edu.vn') || domain.endsWith('.edu');
}
