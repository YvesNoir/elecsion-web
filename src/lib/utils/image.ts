/**
 * Sanitiza un SKU para poder ser usado como nombre de archivo de imagen
 * Convierte a minúsculas y remueve caracteres problemáticos manteniendo guiones
 */
export function sanitizeSkuForFilename(sku: string): string {
    if (!sku) return '';
    
    return sku
        .trim()
        .toLowerCase()
        // Reemplazar / con nada
        .replace(/\//g, '')
        // Remover otros caracteres problemáticos pero mantener guiones
        .replace(/[\\:*?"<>|\s]/g, '')
        // Mantener solo caracteres alfanuméricos y guiones
        .replace(/[^a-z0-9-]/g, '');
}

/**
 * Genera la URL de la imagen de un producto basado en su SKU
 * Intenta PNG primero desde S3/CloudFront, luego JPG, finalmente placeholder local
 */
export function getProductImageUrl(sku: string): string {
    const sanitizedSku = sanitizeSkuForFilename(sku);
    if (!sanitizedSku) {
        return `/product-images/placeholder.png`;
    }

    // Si hay CloudFront URL configurada, usar CloudFront
    const cloudFrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
    if (cloudFrontUrl) {
        return `${cloudFrontUrl}/products/${sanitizedSku}.png`;
    }

    // Fallback a S3 directo
    const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET || 'elecsion-product-images';
    const s3Region = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
    return `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/products/${sanitizedSku}.png`;
}

/**
 * Genera múltiples URLs de imagen para un SKU (para fallback)
 */
export function getProductImageUrls(sku: string): string[] {
    const sanitizedSku = sanitizeSkuForFilename(sku);
    if (!sanitizedSku) {
        return ['/product-images/placeholder.png'];
    }

    const cloudFrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
    const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET || 'elecsion-product-images';
    const s3Region = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2';

    // Debug temporal
    console.log('CloudFront URL:', cloudFrontUrl);
    console.log('S3 Bucket:', s3Bucket);
    console.log('S3 Region:', s3Region);

    const baseUrl = cloudFrontUrl || `https://${s3Bucket}.s3.${s3Region}.amazonaws.com`;

    console.log('Base URL:', baseUrl);
    console.log('Final URLs for', sku, ':', [
        `${baseUrl}/products/${sanitizedSku}.png`,
        `${baseUrl}/products/${sanitizedSku}.jpg`,
        `${baseUrl}/products/${sanitizedSku}.jpeg`,
        '/product-images/placeholder.png'
    ]);

    return [
        `${baseUrl}/products/${sanitizedSku}.png`,
        `${baseUrl}/products/${sanitizedSku}.jpg`,
        `${baseUrl}/products/${sanitizedSku}.jpeg`,
        '/product-images/placeholder.png'
    ];
}