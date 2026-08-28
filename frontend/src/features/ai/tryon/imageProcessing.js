export const TRYON_IMAGE_MAX_DIMENSION = 1024;
export const TRYON_IMAGE_MIME_TYPE = 'image/jpeg';
export const TRYON_IMAGE_QUALITY = 0.85;

export function isSupportedImageFile(file) {
  return Boolean(file?.type?.startsWith('image/'));
}

export function getContainedImageSize(width, height, maxDimension = TRYON_IMAGE_MAX_DIMENSION) {
  if (width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }

  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / Math.max(width, height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export function resizeImageFile(file, maxDimension = TRYON_IMAGE_MAX_DIMENSION, quality = TRYON_IMAGE_QUALITY) {
  return new Promise((resolve, reject) => {
    if (!isSupportedImageFile(file)) {
      reject(new Error('Unsupported image file'));
      return;
    }

    const reader = new FileReader();
    const image = new Image();

    reader.onerror = () => reject(new Error('Unable to read image file'));
    image.onerror = () => reject(new Error('Unable to decode image file'));

    reader.onload = () => {
      image.src = reader.result;
    };

    image.onload = () => {
      try {
        const size = getContainedImageSize(image.width, image.height, maxDimension);
        if (!size.width || !size.height) {
          reject(new Error('Invalid image dimensions'));
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Unable to process image'));
          return;
        }

        context.drawImage(image, 0, 0, size.width, size.height);
        const dataUrl = canvas.toDataURL(TRYON_IMAGE_MIME_TYPE, quality);
        if (!dataUrl.startsWith(`data:${TRYON_IMAGE_MIME_TYPE};base64,`)) {
          reject(new Error('Unable to create processed image'));
          return;
        }
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    reader.readAsDataURL(file);
  });
}
