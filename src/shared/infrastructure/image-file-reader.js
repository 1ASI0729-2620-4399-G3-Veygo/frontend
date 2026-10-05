const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxFileBytes = 10 * 1024 * 1024;

/**
 * Infrastructure helper that turns an image file chosen by the user into a compressed data URL.
 *
 * @remarks
 * In Sprint 2 the Fake API has no file storage, so images are resized in the browser
 * (canvas) and stored as data URLs. When the Web Services are deployed this helper will
 * be replaced by an upload to cloud storage returning the public URL.
 *
 * @param {File} file - The selected file.
 * @param {number} [maxSize=1024] - Maximum width or height in pixels.
 * @param {number} [quality=0.8] - JPEG quality (0-1).
 * @returns {Promise<string>} The data URL of the resized image.
 */
export const readImageAsDataUrl = (file, maxSize = 1024, quality = 0.8) => new Promise((resolve, reject) => {
    if (!acceptedTypes.includes(file.type)) {
        reject('errors.invalid-image-type');
        return;
    }
    if (file.size > maxFileBytes) {
        reject('errors.image-too-large');
        return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject('errors.image-read-failed');
    reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject('errors.image-read-failed');
        image.onload = () => {
            const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);
            const context = canvas.getContext('2d');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        image.src = reader.result;
    };
    reader.readAsDataURL(file);
});
