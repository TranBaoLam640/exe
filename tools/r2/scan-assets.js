const { generateManifest, writeManifest, manifestPath, runtimeMapPath } = require('./r2-assets');

const manifest = generateManifest();
writeManifest(manifest);

console.log(`Generated ${manifestPath}`);
console.log(`Generated ${runtimeMapPath}`);
console.log(JSON.stringify(manifest.summary, null, 2));
