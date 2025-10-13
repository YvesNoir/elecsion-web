// scripts/verify-s3-image.ts
import { checkObjectExists, listObjects } from '../src/lib/aws-s3';

// AWS credentials should be set via environment variables:
// AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET

async function verifySpecificImage(imageName: string) {
    console.log(`🔍 Buscando imagen: ${imageName}`);

    // El nombre de la imagen debería ser igual al SKU
    const sku = imageName.replace(/\.(png|jpg|jpeg)$/i, '');

    // Usar la función de sanitización para generar el key correcto
    const sanitizedSku = sku
        .trim()
        .toLowerCase()
        .replace(/\//g, '')
        .replace(/[\\:*?"<>|\s]/g, '')
        .replace(/[^a-z0-9-]/g, '');

    // Posibles keys en S3 usando la misma lógica que generateProductImageKey
    const possibleKeys = [
        `products/${sanitizedSku}.png`,
        `products/${sanitizedSku}.jpg`,
        `products/${sanitizedSku}.jpeg`
    ];

    console.log(`📂 SKU: ${sku} → Sanitizado: ${sanitizedSku}`);
    console.log('📂 Verificando keys posibles:');
    possibleKeys.forEach(key => console.log(`  - ${key}`));

    for (const key of possibleKeys) {
        const exists = await checkObjectExists(key);
        if (exists) {
            console.log(`✅ ¡Encontrada! Key: ${key}`);
            return key;
        }
    }

    console.log('❌ No encontrada con keys exactas');

    // Buscar de forma más amplia
    console.log('🔍 Buscando de forma más amplia...');
    const allObjects = await listObjects('products/');

    const matches = allObjects.filter(key =>
        key.toLowerCase().includes(sanitizedSku) ||
        key.toLowerCase().includes(sku.toLowerCase()) ||
        key.toLowerCase().includes('al-m1') ||
        key.toLowerCase().includes('nxb')
    );

    if (matches.length > 0) {
        console.log(`🎯 Encontradas ${matches.length} coincidencias parciales:`);
        matches.forEach(match => console.log(`  - ${match}`));
        return matches[0];
    }

    console.log('❌ No se encontró la imagen en S3');
    return null;
}

// Ejecutar
if (require.main === module) {
    const imageName = process.argv[2] || 'NXB-63 1P C1 6KA.png';

    verifySpecificImage(imageName)
        .then((result) => {
            if (result) {
                console.log(`\n✅ Imagen encontrada: ${result}`);
                process.exit(0);
            } else {
                console.log('\n❌ Imagen no encontrada');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('💥 Error:', error);
            process.exit(1);
        });
}

export { verifySpecificImage };