// scripts/migrate-images-to-s3.ts
import fs from 'fs/promises';
import path from 'path';
import { uploadFile } from '../src/lib/aws-s3';

interface MigrationResult {
    success: string[];
    errors: Array<{ file: string; error: string }>;
    skipped: string[];
}

async function migrateImagesToS3(): Promise<MigrationResult> {
    const result: MigrationResult = {
        success: [],
        errors: [],
        skipped: []
    };

    try {
        const imagesDir = path.join(process.cwd(), 'public', 'product-images');

        console.log('📁 Buscando imágenes en:', imagesDir);

        // Verificar si existe el directorio
        try {
            await fs.access(imagesDir);
        } catch {
            console.log('❌ No se encontró la carpeta /public/product-images/');
            return result;
        }

        // Leer todos los archivos
        const files = await fs.readdir(imagesDir);
        const imageFiles = files.filter(file =>
            /\.(png|jpg|jpeg)$/i.test(file) &&
            file !== 'placeholder.png' // Excluir placeholder
        );

        console.log(`📸 Encontradas ${imageFiles.length} imágenes para migrar`);

        if (imageFiles.length === 0) {
            console.log('ℹ️  No hay imágenes para migrar');
            return result;
        }

        // Migrar cada imagen
        for (let i = 0; i < imageFiles.length; i++) {
            const fileName = imageFiles[i];
            const filePath = path.join(imagesDir, fileName);

            try {
                console.log(`📤 [${i + 1}/${imageFiles.length}] Subiendo: ${fileName}`);

                // Leer archivo
                const fileBuffer = await fs.readFile(filePath);

                // Determinar content type
                const ext = path.extname(fileName).toLowerCase();
                const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

                // Generar key para S3 (products/filename)
                const key = `products/${fileName.toLowerCase()}`;

                // Subir a S3
                const s3Url = await uploadFile(key, fileBuffer, contentType);

                result.success.push(fileName);
                console.log(`✅ ${fileName} → ${s3Url}`);

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
                result.errors.push({ file: fileName, error: errorMsg });
                console.error(`❌ Error con ${fileName}:`, errorMsg);
            }
        }

        // Resumen
        console.log('\n📊 RESUMEN DE MIGRACIÓN:');
        console.log(`✅ Exitosas: ${result.success.length}`);
        console.log(`❌ Errores: ${result.errors.length}`);
        console.log(`⏭️  Omitidas: ${result.skipped.length}`);

        if (result.errors.length > 0) {
            console.log('\n❌ ERRORES:');
            result.errors.forEach(({ file, error }) => {
                console.log(`  - ${file}: ${error}`);
            });
        }

        return result;

    } catch (error) {
        console.error('💥 Error general en migración:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    migrateImagesToS3()
        .then((result) => {
            if (result.errors.length === 0) {
                console.log('\n🎉 ¡Migración completada exitosamente!');
                process.exit(0);
            } else {
                console.log('\n⚠️  Migración completada con errores');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

export { migrateImagesToS3 };