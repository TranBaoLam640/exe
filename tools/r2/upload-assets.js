const fs = require('fs');
const path = require('path');
const {
  cacheControl,
  repoRoot,
  manifestPath,
  readEnvFile,
  assertEnv,
  generateManifest,
  writeManifest,
  r2Request,
} = require('./r2-assets');

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const env = readEnvFile();
  assertEnv(env);

  const manifest = generateManifest(env);
  writeManifest(manifest);
  const canonicalAssets = manifest.assets.filter((asset) => asset.isCanonical);
  let uploaded = 0;
  let skipped = 0;

  for (const asset of canonicalAssets) {
    const sourceBuffer = fs.readFileSync(path.join(repoRoot, asset.sourcePath));
    const head = await r2Request(env, 'HEAD', asset.r2Key);
    if (head.status === 200) {
      const remoteLength = Number(head.headers['content-length'] || 0);
      const remoteType = String(head.headers['content-type'] || '').split(';')[0].toLowerCase();
      if (remoteLength === asset.sizeBytes && remoteType === asset.detectedMime) {
        skipped += 1;
        asset.uploaded = true;
        continue;
      }
    }

    if (dryRun) continue;

    const put = await r2Request(env, 'PUT', asset.r2Key, sourceBuffer, {
      'content-type': asset.detectedMime,
      'cache-control': cacheControl,
    });
    if (put.status < 200 || put.status >= 300) {
      throw new Error(`Upload failed for ${asset.sourcePath} (${asset.r2Key}) with HTTP ${put.status || put.error}`);
    }
    uploaded += 1;
    asset.uploaded = true;
  }

  writeManifest(manifest);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Canonical objects: ${canonicalAssets.length}`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Skipped existing: ${skipped}`);
  console.log(`Dry run: ${dryRun ? 'YES' : 'NO'}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
