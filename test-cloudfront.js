// Test script para verificar CloudFront URLs
require('dotenv').config({ path: './.env.local' });

// Simular las funciones de imagen
function sanitizeSkuForFilename(sku) {
    if (!sku) return '';

    return sku
        .trim()
        .toLowerCase()
        .replace(/\//g, '')
        .replace(/[\\:*?"<>|\s]/g, '')
        .replace(/[^a-z0-9-]/g, '');
}

function getProductImageUrls(sku) {
    const sanitizedSku = sanitizeSkuForFilename(sku);
    if (!sanitizedSku) {
        return ['/product-images/placeholder.png'];
    }

    const cloudFrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
    const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET || 'elecsion-product-images';
    const s3Region = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2';

    console.log('Environment variables:');
    console.log('CloudFront URL:', cloudFrontUrl);
    console.log('S3 Bucket:', s3Bucket);
    console.log('S3 Region:', s3Region);
    console.log('');

    const baseUrl = cloudFrontUrl || `https://${s3Bucket}.s3.${s3Region}.amazonaws.com`;

    const urls = [
        `${baseUrl}/products/${sanitizedSku}.png`,
        `${baseUrl}/products/${sanitizedSku}.jpg`,
        `${baseUrl}/products/${sanitizedSku}.jpeg`,
        '/product-images/placeholder.png'
    ];

    return urls;
}

// Test con SKU de ejemplo
const testSku = '200002';
console.log(`Testing URLs for SKU: ${testSku}`);
console.log('Generated URLs:');
const urls = getProductImageUrls(testSku);
urls.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
});

console.log('\nManual test URLs to try in browser:');
console.log('CloudFront:', `https://d1kvyxbd7iqkb.cloudfront.net/products/200002.png`);
console.log('S3 Direct:', `https://elecsion-product-images.s3.us-east-2.amazonaws.com/products/200002.png`);