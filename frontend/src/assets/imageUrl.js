import assetMap from './asset-map.json';
import { assetUrl } from '../utils/assetUrl';

export function imageUrl(sourcePath) {
  const key = assetMap[String(sourcePath || '').replace(/^\/+/, '')];
  return assetUrl(key || sourcePath);
}
