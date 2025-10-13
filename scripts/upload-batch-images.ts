// scripts/upload-batch-images.ts
import fs from 'fs/promises';
import path from 'path';
import { uploadFile, generateProductImageKey } from '../src/lib/aws-s3';

// AWS credentials should be set via environment variables:
// AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET

interface UploadResult {
    fileName: string;
    sku: string;
    s3Key: string;
    url: string;
    success: boolean;
    error?: string;
}

async function uploadBatchImages(): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    try {
        const referencesDir = path.join(process.cwd(), 'referencias-imagenes');

        console.log('📁 Buscando imágenes en:', referencesDir);

        // Leer todos los archivos
        const files = await fs.readdir(referencesDir);
        const imageFiles = files.filter(file =>
            /\.(png|jpg|jpeg)$/i.test(file) &&
            file !== 'placeholder.png' &&
            file !== 'img.png' &&
            file !== 'README.md'
        );

        console.log(`📸 Encontradas ${imageFiles.length} imágenes para subir\n`);

        // Subir cada imagen
        for (let i = 0; i < imageFiles.length; i++) {
            const fileName = imageFiles[i];
            const sku = fileName.replace(/\.(png|jpg|jpeg)$/i, '');

            try {
                console.log(`📤 [${i + 1}/${imageFiles.length}] Subiendo: ${fileName}`);

                const filePath = path.join(referencesDir, fileName);
                const fileBuffer = await fs.readFile(filePath);

                // Determinar content type y extensión
                const ext = path.extname(fileName).toLowerCase();
                const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
                const extension = ext.replace('.', '');

                // Generar key correcto
                const key = generateProductImageKey(sku, extension);

                console.log(`   SKU: ${sku} → Key: ${key}`);

                // Subir a S3
                const s3Url = await uploadFile(key, fileBuffer, contentType);

                results.push({
                    fileName,
                    sku,
                    s3Key: key,
                    url: s3Url,
                    success: true
                });

                console.log(`   ✅ ${s3Url}\n`);

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Error desconocido';

                results.push({
                    fileName,
                    sku,
                    s3Key: '',
                    url: '',
                    success: false,
                    error: errorMsg
                });

                console.error(`   ❌ Error: ${errorMsg}\n`);
            }
        }

        return results;

    } catch (error) {
        console.error('💥 Error general:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    uploadBatchImages()
        .then((results) => {
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);

            console.log('\n📊 RESUMEN:');
            console.log(`✅ Exitosas: ${successful.length}`);
            console.log(`❌ Errores: ${failed.length}`);

            if (successful.length > 0) {
                console.log('\n✅ IMÁGENES SUBIDAS:');
                successful.forEach(result => {
                    console.log(`  ${result.fileName} → ${result.s3Key}`);
                });
            }

            if (failed.length > 0) {
                console.log('\n❌ ERRORES:');
                failed.forEach(result => {
                    console.log(`  ${result.fileName}: ${result.error}`);
                });
            }

            console.log(failed.length === 0 ? '\n🎉 ¡Todas las imágenes subidas exitosamente!' : '\n⚠️  Completado con algunos errores');
            process.exit(failed.length > 0 ? 1 : 0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

export { uploadBatchImages };