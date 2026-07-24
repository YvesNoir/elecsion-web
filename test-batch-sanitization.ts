// Test de sanitización para todas las imágenes
import { generateProductImageKey } from './src/lib/aws-s3';
import { sanitizeSkuForFilename } from './src/lib/utils/image';

const testImages = [
    "AL-M1 R.png",
    "AL-X1.png",
    "AX-X1.png",
    "CBB-210110.png",
    "CBB-211310.png",
    "CBB-211410.png",
    "CBB-220110.png",
    "CBB-230110.png",
    "CBB-240110.png",
    "CBB-260110.png"
];

console.log('🔍 Prueba de sanitización para todas las imágenes:\n');

testImages.forEach(imageName => {
    const sku = imageName.replace(/\.(png|jpg|jpeg)$/i, '');
    const s3Key = generateProductImageKey(sku, 'png');
    const frontendKey = sanitizeSkuForFilename(sku);

    console.log(`📁 ${imageName}`);
    console.log(`   SKU: "${sku}"`);
    console.log(`   S3 Key: ${s3Key}`);
    console.log(`   Frontend: ${frontendKey}.png`);
    console.log(`   Match: ${s3Key === `products/${frontendKey}.png` ? '✅' : '❌'}`);
    console.log('');
});