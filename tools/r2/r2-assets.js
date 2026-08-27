const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const repoRoot = path.resolve(__dirname, '..', '..');
const manifestPath = path.join(__dirname, 'asset-migration-manifest.json');
const runtimeMapPath = path.join(repoRoot, 'frontend', 'src', 'assets', 'asset-map.json');
const requiredEnv = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL',
];

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const cacheControl = 'public, max-age=31536000, immutable';

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function readEnvFile(filePath = path.join(repoRoot, '.env.r2.local')) {
  const env = {};
  if (fs.existsSync(filePath)) {
    const text = fs.readFileSync(filePath, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      let value = match[2].trim();
      const commentAt = value.search(/\s#/);
      if (commentAt >= 0) value = value.slice(0, commentAt).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[match[1]] = value;
    }
  }
  for (const key of requiredEnv) {
    if (!env[key] && process.env[key]) env[key] = process.env[key];
  }
  return env;
}

function assertEnv(env) {
  const missing = requiredEnv.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing required R2 env: ${missing.join(', ')}`);
  }
  if (env.R2_BUCKET !== 'dorentme-assets') {
    throw new Error('R2_BUCKET must be dorentme-assets for this migration');
  }
}

function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', extension: '.jpg' };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', extension: '.png' };
  }
  if (
    buffer.length >= 12 &&
    buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
    buffer.slice(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', extension: '.webp' };
  }
  return { mime: 'application/octet-stream', extension: path.extname('unknown') };
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(absolute, files);
    } else {
      files.push(absolute);
    }
  }
  return files;
}

function discoverImageFiles() {
  const candidates = [
    ...walk(path.join(repoRoot, 'image')),
    ...fs.readdirSync(repoRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(repoRoot, entry.name)),
  ];

  return candidates
    .filter((filePath) => imageExtensions.has(path.extname(filePath).toLowerCase()))
    .map((filePath) => toPosix(path.relative(repoRoot, filePath)))
    .sort((a, b) => a.localeCompare(b));
}

function referencedPaths() {
  const textExtensions = new Set(['.html', '.js', '.jsx', '.css', '.json', '.md']);
  const haystack = walk(repoRoot)
    .filter((filePath) => {
      const rel = toPosix(path.relative(repoRoot, filePath));
      if (rel.startsWith('.git/') || rel.startsWith('node_modules/') || rel.startsWith('frontend/node_modules/')) return false;
      if (rel === 'tools/r2/asset-migration-manifest.json' || rel === 'frontend/src/assets/asset-map.json') return false;
      return textExtensions.has(path.extname(filePath).toLowerCase());
    })
    .map((filePath) => fs.readFileSync(filePath, 'utf8'))
    .join('\n');

  const refs = new Map();
  for (const sourcePath of discoverImageFiles()) {
    refs.set(sourcePath, haystack.includes(sourcePath) || haystack.includes(sourcePath.replaceAll('/', '\\')));
  }
  return refs;
}

function categoryFor(sourcePath) {
  if (sourcePath.startsWith('image/ao_dai/')) return { bucket: 'products', segment: 'ao-dai' };
  if (sourcePath.startsWith('image/vay_di_bien/')) return { bucket: 'products', segment: 'vay-di-bien' };
  if (sourcePath.startsWith('image/vay_du_tiec/')) return { bucket: 'products', segment: 'vay-du-tiec' };
  if (sourcePath.startsWith('image/vay_lua/')) return { bucket: 'products', segment: 'vay-lua' };
  if (sourcePath.startsWith('image/phu_kien/')) return { bucket: 'products', segment: 'phu-kien' };
  if (sourcePath.startsWith('image/news/')) return { bucket: 'news', segment: '' };
  if (/^(anh_chan_dung|anh_chan_dung_gai|tran_bao_lam|phan_huyen_tran|nguyen_duc_duong|hoang_anh|hoanganh|con_cho_ngu_dan)\./.test(sourcePath)) {
    return { bucket: 'team', segment: '' };
  }
  if (/^(Logo|image-removebg-preview|step-|.*dress|.*dam|.*vay|.*jolie|.*tipblu|.*chouchou|.*vintage)/i.test(sourcePath)) {
    return { bucket: 'ui', segment: '' };
  }
  return { bucket: 'branding', segment: '' };
}

function slugify(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96) || 'asset';
}

function canonicalSortKey(asset, refs) {
  const referencedRank = refs.get(asset.sourcePath) ? 0 : 1;
  const imageRank = asset.sourcePath.startsWith('image/') ? 0 : 1;
  const depthRank = asset.sourcePath.split('/').length > 2 ? 0 : 1;
  return [referencedRank, imageRank, depthRank, asset.sourcePath];
}

function compareCanonical(a, b, refs) {
  const ak = canonicalSortKey(a, refs);
  const bk = canonicalSortKey(b, refs);
  for (let i = 0; i < ak.length; i += 1) {
    if (ak[i] < bk[i]) return -1;
    if (ak[i] > bk[i]) return 1;
  }
  return 0;
}

function buildR2Key(asset) {
  const category = categoryFor(asset.sourcePath);
  const parsed = path.posix.parse(asset.sourcePath);
  const slug = slugify(parsed.name);
  const suffix = asset.sha256.slice(0, 12);
  const fileName = `${slug}-${suffix}${asset.detectedExtension}`;
  return [category.bucket, category.segment, fileName].filter(Boolean).join('/');
}

function generateManifest(env = readEnvFile()) {
  const refs = referencedPaths();
  const assets = discoverImageFiles().map((sourcePath) => {
    const absolute = path.join(repoRoot, sourcePath);
    const buffer = fs.readFileSync(absolute);
    const detected = detectImageType(buffer);
    return {
      sourcePath,
      sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
      sizeBytes: buffer.length,
      detectedMime: detected.mime,
      detectedExtension: detected.extension,
      originalExtension: path.extname(sourcePath).toLowerCase(),
      references: refs.get(sourcePath) ? ['repository text reference'] : [],
    };
  });

  const byHash = new Map();
  for (const asset of assets) {
    if (!byHash.has(asset.sha256)) byHash.set(asset.sha256, []);
    byHash.get(asset.sha256).push(asset);
  }

  const publicBase = String(env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  const manifestAssets = [];
  for (const group of [...byHash.values()].sort((a, b) => a[0].sha256.localeCompare(b[0].sha256))) {
    group.sort((a, b) => compareCanonical(a, b, refs));
    const canonical = group[0];
    const r2Key = buildR2Key(canonical);
    for (const asset of group) {
      const category = categoryFor(asset.sourcePath);
      manifestAssets.push({
        sourcePath: asset.sourcePath,
        sha256: asset.sha256,
        sizeBytes: asset.sizeBytes,
        detectedMime: asset.detectedMime,
        detectedExtension: asset.detectedExtension,
        originalExtension: asset.originalExtension,
        category: [category.bucket, category.segment].filter(Boolean).join('/'),
        canonicalSourcePath: canonical.sourcePath,
        isCanonical: asset.sourcePath === canonical.sourcePath,
        r2Key,
        publicUrl: publicBase ? `${publicBase}/${r2Key}` : r2Key,
        duplicateOfSourcePath: asset.sourcePath === canonical.sourcePath ? null : canonical.sourcePath,
        duplicateOfKey: asset.sourcePath === canonical.sourcePath ? null : r2Key,
        referenceCount: asset.references.length,
        references: asset.references,
        uploaded: false,
        s3Verified: false,
        publicVerified: false,
      });
    }
  }

  manifestAssets.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
  const canonicalAssets = manifestAssets.filter((asset) => asset.isCanonical);
  const duplicateGroups = [...byHash.values()].filter((group) => group.length > 1);
  const duplicateFileCount = assets.length - canonicalAssets.length;
  const totalSourceBytes = assets.reduce((sum, asset) => sum + asset.sizeBytes, 0);
  const canonicalUploadedBytes = canonicalAssets.reduce((sum, asset) => sum + asset.sizeBytes, 0);

  return {
    generatedAt: new Date().toISOString(),
    bucket: env.R2_BUCKET || '',
    publicBaseUrl: publicBase,
    cacheControl,
    canonicalSelectionPolicy: [
      'Prefer referenced source under image/...',
      'Prefer non-root category path',
      'Choose lexicographically stable path',
    ],
    summary: {
      sourceFileCount: assets.length,
      exactDuplicateFileCount: duplicateFileCount,
      duplicateGroups: duplicateGroups.length,
      canonicalObjectCount: canonicalAssets.length,
      totalSourceBytes,
      canonicalUploadedBytes,
      bytesSaved: totalSourceBytes - canonicalUploadedBytes,
    },
    assets: manifestAssets,
  };
}

function writeManifest(manifest) {
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const runtimeMap = {};
  for (const asset of manifest.assets) {
    runtimeMap[asset.sourcePath] = asset.r2Key;
  }
  fs.writeFileSync(runtimeMapPath, `${JSON.stringify(runtimeMap, null, 2)}\n`);
}

function signingKey(secret, date) {
  const kDate = crypto.createHmac('sha256', `AWS4${secret}`).update(date, 'utf8').digest();
  const kRegion = crypto.createHmac('sha256', kDate).update('auto', 'utf8').digest();
  const kService = crypto.createHmac('sha256', kRegion).update('s3', 'utf8').digest();
  return crypto.createHmac('sha256', kService).update('aws4_request', 'utf8').digest();
}

function encodePath(key) {
  return key.split('/').map(encodeURIComponent).join('/');
}

function amzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function dateStamp(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function r2Request(env, method, key, body = Buffer.alloc(0), extraHeaders = {}) {
  return new Promise((resolve) => {
    const host = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const now = new Date();
    const amz = amzDate(now);
    const date = dateStamp(now);
    const canonicalUri = `/${env.R2_BUCKET}/${encodePath(key)}`;
    const payloadHash = crypto.createHash('sha256').update(body).digest('hex');
    const headers = {
      host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amz,
      ...extraHeaders,
    };
    if (body.length) {
      headers['content-length'] = body.length;
    }
    const sortedNames = Object.keys(headers).map((name) => name.toLowerCase()).sort();
    const lowerHeaders = {};
    for (const [name, value] of Object.entries(headers)) lowerHeaders[name.toLowerCase()] = String(value).trim();
    const canonicalHeaders = sortedNames.map((name) => `${name}:${lowerHeaders[name]}\n`).join('');
    const signedHeaders = sortedNames.join(';');
    const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
    const scope = `${date}/auto/s3/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amz, scope, crypto.createHash('sha256').update(canonicalRequest).digest('hex')].join('\n');
    const signature = crypto.createHmac('sha256', signingKey(env.R2_SECRET_ACCESS_KEY, date)).update(stringToSign, 'utf8').digest('hex');
    headers.Authorization = `AWS4-HMAC-SHA256 Credential=${env.R2_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const req = https.request({ host, method, path: canonicalUri, headers, timeout: 30000 }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), error: '' }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', (error) => resolve({ status: 0, headers: {}, body: Buffer.alloc(0), error: error.code || error.message }));
    if (body.length) req.write(body);
    req.end();
  });
}

function publicGet(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 30000 }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), error: '' }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', (error) => resolve({ status: 0, headers: {}, body: Buffer.alloc(0), error: error.code || error.message }));
  });
}

module.exports = {
  cacheControl,
  repoRoot,
  manifestPath,
  runtimeMapPath,
  readEnvFile,
  assertEnv,
  generateManifest,
  writeManifest,
  r2Request,
  publicGet,
};
