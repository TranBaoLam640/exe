import assert from 'node:assert/strict';
import { isDisposableEmail, isTrustedEmailProvider } from '../src/features/auth/disposableEmailBlocklist.js';
import { parseGoogleJwt } from '../src/features/auth/googleOAuth.js';
import {
  CLAIMED_TRIALS_KEY,
  hasClaimedFreeTrial,
  loginWithGoogle,
  markFreeTrialClaimed,
  register,
} from '../src/features/auth/authService.js';

function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
  };
}

console.log('Testing Disposable Email Detection...');
// 1. Disposable Email Rejection
assert.equal(isDisposableEmail('spam@mailinator.com'), true);
assert.equal(isDisposableEmail('fake@10minutemail.com'), true);
assert.equal(isDisposableEmail('test@tempmail.com'), true);
assert.equal(isDisposableEmail('bot@sub.guerrillamail.com'), true);
assert.equal(isDisposableEmail('user@trashmail.com'), true);
assert.equal(isDisposableEmail('hacker@fakemailgenerator.com'), true);

// 2. Real Email Acceptance
assert.equal(isDisposableEmail('realuser@gmail.com'), false);
assert.equal(isDisposableEmail('student@fpt.edu.vn'), false);
assert.equal(isDisposableEmail('customer@outlook.com'), false);
assert.equal(isDisposableEmail('buyer@yahoo.com'), false);

assert.equal(isTrustedEmailProvider('user@gmail.com'), true);
assert.equal(isTrustedEmailProvider('student@fpt.edu.vn'), true);
assert.equal(isTrustedEmailProvider('fake@mailinator.com'), false);

console.log('Testing Google JWT Parser...');
// 3. JWT Parsing Test
const mockHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
const mockPayload = Buffer.from(
  JSON.stringify({
    sub: '10987654321',
    email: 'testuser@gmail.com',
    email_verified: true,
    name: 'Nguyễn Văn Test',
    picture: 'https://lh3.googleusercontent.com/test.jpg',
  })
).toString('base64url');
const mockJwt = `${mockHeader}.${mockPayload}.signature`;

const parsed = parseGoogleJwt(mockJwt);
assert.ok(parsed, 'JWT must parse successfully');
assert.equal(parsed.email, 'testuser@gmail.com');
assert.equal(parsed.email_verified, true);
assert.equal(parsed.name, 'Nguyễn Văn Test');
assert.equal(parsed.sub, '10987654321');

// Malformed JWT
assert.equal(parseGoogleJwt('invalid.token'), null);
assert.equal(parseGoogleJwt(''), null);

console.log('Testing Anti-Spam Free Trial Quota Claiming...');
// 4. Anti-spam Trial Claiming Logic
const localStore = createMemoryStorage();
const sessionStore = createMemoryStorage({ dorentme_tryon_count: '2' }); // user had exhausted quota

const testEmail = 'realcustomer@gmail.com';
assert.equal(hasClaimedFreeTrial(testEmail, localStore), false);

// First time Google OAuth login for this email
const oauthResult1 = await loginWithGoogle(
  {
    sub: 'google_123',
    email: testEmail,
    name: 'Real Customer',
    picture: 'https://example.com/avatar.jpg',
    email_verified: true,
  },
  { storage: localStore, sessionStorage: sessionStore }
);

assert.equal(oauthResult1.ok, true);
assert.equal(oauthResult1.user.email, testEmail);
assert.equal(oauthResult1.user.authProvider, 'google');
assert.equal(hasClaimedFreeTrial(testEmail, localStore), true);
// Free trial is reset to 0 on first legitimate claim
assert.equal(sessionStore.getItem('dorentme_tryon_count'), '0');

// User consumes their 2 tries
sessionStore.setItem('dorentme_tryon_count', '2');

// Second time logging in with the SAME email must NOT reset quota back to 0!
const oauthResult2 = await loginWithGoogle(
  {
    sub: 'google_123',
    email: testEmail,
    name: 'Real Customer',
    picture: 'https://example.com/avatar.jpg',
    email_verified: true,
  },
  { storage: localStore, sessionStorage: sessionStore }
);

assert.equal(oauthResult2.ok, true);
assert.equal(oauthResult2.isNewUser, false);
// Quota remains 2 (not reset back to 0)
assert.equal(sessionStore.getItem('dorentme_tryon_count'), '2');

console.log('Testing Disposable Email Registration Rejection...');
// 5. Registration with disposable email must fail with anti-spam warning
const spamRegisterResult = await register(
  {
    name: 'Spam Bot',
    email: 'spammer@10minutemail.com',
    phone: '0987654321',
    password: 'password123',
  },
  { storage: localStore, sessionStorage: sessionStore }
);
assert.equal(spamRegisterResult.ok, false);
assert.match(spamRegisterResult.error, /không chấp nhận email tạm thời/i);

// 6. Google login with unverified email must fail
const unverifiedResult = await loginWithGoogle(
  {
    sub: 'google_fake',
    email: 'unverified@gmail.com',
    name: 'Fake',
    email_verified: false,
  },
  { storage: localStore, sessionStorage: sessionStore }
);
assert.equal(unverifiedResult.ok, false);
assert.match(unverifiedResult.error, /chưa được xác thực email/i);

console.log('OAuth & Anti-Spam Validation PASS');
