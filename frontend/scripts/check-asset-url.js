import { joinAssetUrl } from '../src/utils/assetUrl.js';

const cases = [
  ['', 'image/logo.png', '/image/logo.png'],
  ['', '/image/logo.png', '/image/logo.png'],
  ['https://assets.example.com', 'image/logo.png', 'https://assets.example.com/image/logo.png'],
  ['https://assets.example.com/', 'image/logo.png', 'https://assets.example.com/image/logo.png'],
  ['https://assets.example.com/', '/image/logo.png', 'https://assets.example.com/image/logo.png'],
  ['https://assets.example.com/assets', '', 'https://assets.example.com/assets'],
];

for (const [base, key, expected] of cases) {
  const actual = joinAssetUrl(base, key);
  if (actual !== expected) {
    throw new Error(`joinAssetUrl(${JSON.stringify(base)}, ${JSON.stringify(key)}) returned ${actual}, expected ${expected}`);
  }
}

console.log('assetUrl helper checks passed');
