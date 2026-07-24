// Test de sanitización
import { generateProductImageKey } from './src/lib/aws-s3';
import { sanitizeSkuForFilename } from './src/lib/utils/image';

const testSku = "AL-M1 R";

console.log('Test SKU:', testSku);
console.log('generateProductImageKey:', generateProductImageKey(testSku, 'png'));
console.log('sanitizeSkuForFilename:', sanitizeSkuForFilename(testSku));

// Otros casos de prueba
const testCases = [
    "NXB-63 1P C1 6KA",
    "AL-M1 R",
    "Test/Product",
    "Test Product",
    "Test:Product*With?"
];

console.log('\n--- Comparación de funciones ---');
testCases.forEach(sku => {
    console.log(`\nSKU: "${sku}"`);
    console.log(`generateProductImageKey: ${generateProductImageKey(sku, 'png')}`);
    console.log(`sanitizeSkuForFilename: ${sanitizeSkuForFilename(sku)}.png`);
});