const fs = require('fs');
const path = require('path');
const {
  repoRoot,
  manifestPath,
  runtimeMapPath,
  readEnvFile,
  assertEnv,
  generateManifest,
  writeManifest,
  r2Request,
  publicGet,
} = require('./r2-assets');

async function main() {
  const env = readEnvFile();
  assertEnv(env);
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : generateManifest(env);
  const canonicalAssets = manifest.assets.filter((asset) => asset.isCanonical);
  const seenKeys = new Set();
  const failures = [];

  if (manifest.summary.canonicalObjectCount !== 70) {
    failures.push(`Expected 70 canonical objects, found ${manifest.summary.canonicalObjectCount}`);
  }

  for (const asset of manifest.assets) {
    if (!asset.isCanonical && asset.r2Key !== manifest.assets.find((candidate) => candidate.sourcePath === asset.canonicalSourcePath)?.r2Key) {
      failures.push(`Duplicate mapping mismatch for ${asset.sourcePath}`);
    }
  }

  for (const asset of canonicalAssets) {
    if (seenKeys.has(asset.r2Key)) failures.push(`R2 key collision: ${asset.r2Key}`);
    seenKeys.add(asset.r2Key);

    const sourceBuffer = fs.readFileSync(path.join(repoRoot, asset.sourcePath));
    const s3 = await r2Request(env, 'GET', asset.r2Key);
    if (s3.status !== 200) {
      failures.push(`S3 GET failed for ${asset.r2Key}: HTTP ${s3.status || s3.error}`);
      continue;
    }
    const remoteHash = require('crypto').createHash('sha256').update(s3.body).digest('hex');
    if (remoteHash !== asset.sha256 || !s3.body.equals(sourceBuffer)) failures.push(`S3 hash mismatch for ${asset.r2Key}`);
    const remoteType = String(s3.headers['content-type'] || '').split(';')[0].toLowerCase();
    if (remoteType !== asset.detectedMime) failures.push(`Content-Type mismatch for ${asset.r2Key}: ${remoteType}`);
    asset.s3Verified = true;

    const publicResponse = await publicGet(asset.publicUrl);
    if (publicResponse.status !== 200) {
      failures.push(`Public GET failed for ${asset.r2Key}: HTTP ${publicResponse.status || publicResponse.error}`);
      continue;
    }
    if (!publicResponse.body.equals(sourceBuffer)) failures.push(`Public content mismatch for ${asset.r2Key}`);
    asset.publicVerified = true;
  }

  writeManifest(manifest);

  if (!fs.existsSync(runtimeMapPath)) failures.push(`Missing runtime asset map: ${runtimeMapPath}`);
  const runtimeMap = JSON.parse(fs.readFileSync(runtimeMapPath, 'utf8'));
  for (const asset of manifest.assets) {
    if (runtimeMap[asset.sourcePath] !== asset.r2Key) failures.push(`Runtime map mismatch for ${asset.sourcePath}`);
  }

  console.log(`Canonical objects verified: ${canonicalAssets.length}`);
  console.log(`Duplicate source paths verified: ${manifest.summary.exactDuplicateFileCount}`);
  console.log(`Public URLs verified: ${canonicalAssets.length}`);

  if (failures.length) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
