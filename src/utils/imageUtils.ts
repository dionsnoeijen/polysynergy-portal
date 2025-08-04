export interface ProcessedImage {
    base64: string;
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSIONS = 800; // Max width or height

export const processImageFile = (file: File): Promise<ProcessedImage> => {
    return new Promise((resolve, reject) => {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            reject(new Error('File size too large. Maximum 5MB allowed.'));
            return;
        }

        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            reject(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                    reject(new Error('Failed to create canvas context'));
                    return;
                }

                const originalWidth = img.width;
                const originalHeight = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                const { width, height } = calculateDimensions(originalWidth, originalHeight, MAX_DIMENSIONS);

                // For GIFs, we want to preserve them as-is (no canvas processing)
                if (file.type === 'image/gif') {
                    // For GIFs, just return the base64 without processing
                    resolve({
                        base64: e.target?.result as string,
                        width: Math.min(originalWidth, MAX_DIMENSIONS),
                        height: Math.min(originalHeight, MAX_DIMENSIONS),
                        originalWidth,
                        originalHeight
                    });
                    return;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to base64 with compression
                const quality = file.type === 'image/png' ? undefined : 0.8; // PNG doesn't support quality
                const base64 = canvas.toDataURL(file.type, quality);

                resolve({
                    base64,
                    width,
                    height,
                    originalWidth,
                    originalHeight
                });
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
};

const calculateDimensions = (originalWidth: number, originalHeight: number, maxSize: number) => {
    if (originalWidth <= maxSize && originalHeight <= maxSize) {
        return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    if (originalWidth > originalHeight) {
        return {
            width: maxSize,
            height: Math.round(maxSize / aspectRatio)
        };
    } else {
        return {
            width: Math.round(maxSize * aspectRatio),
            height: maxSize
        };
    }
};

export const createImageFromFile = (file: File, x: number, y: number, versionId: string) => {
    return processImageFile(file).then((processed) => ({
        x,
        y,
        width: processed.width,
        height: processed.height,
        rotation: 0,
        src: processed.base64,
        originalWidth: processed.originalWidth,
        originalHeight: processed.originalHeight,
        versionId
    }));
};