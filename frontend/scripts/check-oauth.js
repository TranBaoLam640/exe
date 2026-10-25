import assert from 'node:assert/strict';
import api from '../src/config/api.js';
import { getGoogleClientId, initGoogleIdentityServices, loadGoogleIdentityScript } from '../src/features/auth/googleOAuth.js';
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

const originalPost = api.post;
let calls = 0;
api.post = async (url, body) => {
  calls++;
  assert.equal(url, '/api/auth/google');
  assert.deepEqual(body, { idToken: mockJwt });
  return { data: { success: true, data: { userId: 42, email: testEmail, name: 'Real Customer', role: 'CUSTOMER', token: 'server-issued-jwt' } } };
};
const options = { storage: localStore, sessionStorage: sessionStore };
const oauthResult1 = await loginWithGoogle(mockJwt, options);
assert.equal(oauthResult1.ok, true);
assert.equal(oauthResult1.user.userId, 42);
assert.equal(oauthResult1.user.token, 'server-issued-jwt');
assert.equal(oauthResult1.user.authProvider, 'google');
assert.equal(hasClaimedFreeTrial(testEmail, localStore), true);
assert.equal(sessionStore.getItem('dorentme_tryon_count'), '0');
sessionStore.setItem('dorentme_tryon_count', '2');
const oauthResult2 = await loginWithGoogle(mockJwt, options);
assert.equal(oauthResult2.ok, true);
assert.equal(oauthResult2.isNewUser, false);
assert.equal(sessionStore.getItem('dorentme_tryon_count'), '2');
assert.equal(calls, 2);

console.log('Testing Google login failure does not create a fake session...');
const emptyStore = createMemoryStorage();
api.post = async () => { throw { response: { data: { error: { message: 'Invalid credential' } } } }; };
const rejected = await loginWithGoogle(mockJwt, { storage: emptyStore, sessionStorage: sessionStore });
assert.equal(rejected.ok, false);
assert.equal(rejected.error, 'Invalid credential');
assert.equal(emptyStore.getItem('dorentme_session'), null);
assert.equal(emptyStore.getItem(CLAIMED_TRIALS_KEY), null);
assert.equal(sessionStore.getItem('dorentme_tryon_count'), '2');
api.post = async () => ({ data: { success: true, data: {} } });
assert.equal((await loginWithGoogle(mockJwt, { storage: emptyStore })).ok, false);
assert.equal(emptyStore.getItem('dorentme_session'), null);
api.post = originalPost;

console.log('Testing Google button configuration and script retry...');
assert.equal(getGoogleClientId(), '356052637766-9tl1crog9a91769chl1f109uil8cagck.apps.googleusercontent.com');
assert.equal((await loginWithGoogle({ email: testEmail, email_verified: true }, options)).ok, false);
assert.equal((await loginWithGoogle('', options)).ok, false);
let initialized;
let rendered;
let callbackToken;
globalThis.window = { google: { accounts: { id: {
  initialize: (config) => { initialized = config; },
  renderButton: (element, config) => { rendered = { element, config }; },
} } } };
const element = { offsetWidth: 300 };
assert.equal(initGoogleIdentityServices({ clientId: '', buttonElement: element }), false);
assert.equal(initGoogleIdentityServices({ clientId: '123-real.apps.googleusercontent.com', buttonElement: element, buttonText: 'signup_with', onCredential: (value) => { callbackToken = value; } }), true);
assert.equal(initialized.client_id, '123-real.apps.googleusercontent.com');
assert.equal(rendered.element, element);
assert.equal(rendered.config.text, 'signup_with');
initialized.callback({ credential: mockJwt });
assert.equal(callbackToken, mockJwt);
delete window.google;
let script;
let attempts = 0;
globalThis.document = {
  querySelector: () => script || null,
  createElement: () => {
    const listeners = {};
    return {
      addEventListener: (event, fn) => { listeners[event] = fn; },
      removeEventListener: (event) => { delete listeners[event]; },
      remove: () => { script = null; },
      fire: (event) => listeners[event]?.(),
    };
  },
  head: { appendChild: (value) => { script = value; attempts++; } },
};
const failedLoad = loadGoogleIdentityScript();
assert.equal(loadGoogleIdentityScript(), failedLoad);
script.fire('error');
assert.equal(await failedLoad, false);
const retryLoad = loadGoogleIdentityScript();
window.google = { accounts: { id: {} } };
script.fire('load');
assert.equal(await retryLoad, true);
assert.equal(attempts, 2);
delete globalThis.window;
delete globalThis.document;

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

console.log('OAuth & Anti-Spam Validation PASS');
