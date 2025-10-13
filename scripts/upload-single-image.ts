// scripts/upload-single-image.ts
import fs from 'fs/promises';
import path from 'path';
import { uploadFile, generateProductImageKey } from '../src/lib/aws-s3';

// AWS credentials should be set via environment variables:
// AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET

async function uploadSingleImage(fileName: string, sku: string) {
    try {
        const imagePath = path.join(process.cwd(), 'referencias-imagenes', fileName);

        console.log(`📁 Buscando imagen: ${imagePath}`);

        // Verificar que existe
        await fs.access(imagePath);

        // Leer archivo
        const fileBuffer = await fs.readFile(imagePath);

        // Determinar content type
        const ext = path.extname(fileName).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
        const extension = ext.replace('.', '');

        // Generar key correcto
        const key = generateProductImageKey(sku, extension);

        console.log(`📤 Subiendo imagen...`);
        console.log(`  Archivo local: ${fileName}`);
        console.log(`  SKU: ${sku}`);
        console.log(`  Key S3: ${key}`);
        console.log(`  Content-Type: ${contentType}`);

        // Subir a S3
        const s3Url = await uploadFile(key, fileBuffer, contentType);

        console.log(`✅ ¡Imagen subida exitosamente!`);
        console.log(`🌐 URL: ${s3Url}`);

        return s3Url;

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

// Ejecutar
if (require.main === module) {
    const fileName = process.argv[2] || 'AL-M1 R.png';
    const sku = process.argv[3] || fileName.replace(/\.(png|jpg|jpeg)$/i, '');

    uploadSingleImage(fileName, sku)
        .then((url) => {
            console.log(`\n🎉 ¡Éxito! Imagen disponible en: ${url}`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

export { uploadSingleImage };