import { joinAssetUrl } from '../src/utils/assetUrl.js';

const cases = [
  ['', 'image/logo.png', '/image/logo.png'],
  ['', '/image/logo.png', '/image/logo.png'],
  ['https://assets.example.com', 'image/logo.png', 'https://assets.example.com/image/logo.png'],
  ['https://assets.example.com/', 'image/logo.png', 'https://assets.example.com/image/logo.png'],
  ['https://assets.example.com/', '/image/logo.png', 'https://assets.example.com/image/logo.png'],
  ['https://assets.example.com/assets', '', 'https://assets.example.com/assets'],
  ['https://assets.example.com/assets', 'image/logo.png?v=1#hero', 'https://assets.example.com/assets/image/logo.png?v=1#hero'],
  ['https://assets.example.com/assets', 'https://cdn.example.com/image/logo.png?v=1#hero', 'https://cdn.example.com/image/logo.png?v=1#hero'],
  ['https://assets.example.com/assets', '//cdn.example.com/image/logo.png', '//cdn.example.com/image/logo.png'],
];

for (const [base, key, expected] of cases) {
  const actual = joinAssetUrl(base, key);
  if (actual !== expected) {
    throw new Error(`joinAssetUrl(${JSON.stringify(base)}, ${JSON.stringify(key)}) returned ${actual}, expected ${expected}`);
  }
}

console.log('assetUrl helper checks passed');
