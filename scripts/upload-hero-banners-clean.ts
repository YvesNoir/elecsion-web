import { uploadFile } from '../src/lib/aws-s3';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// AWS environment variables should be set before running this script
// Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS credentials not found in environment variables');
    console.error('Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    process.exit(1);
}
process.env.AWS_REGION = process.env.AWS_REGION || "us-east-2";
process.env.AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "elecsion-product-images";
process.env.NEXT_PUBLIC_CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || "https://d3o6yucoo1tpxm.cloudfront.net";

async function uploadHeroBanners() {
    console.log('🚀 Iniciando migración de hero banners a S3...');

    const heroBannerDir = path.join(process.cwd(), 'public', 'hero-banner');
    const files = fs.readdirSync(heroBannerDir);

    console.log(`📁 Encontrados ${files.length} archivos en hero-banner/`);

    let uploaded = 0;
    let skipped = 0;
    let errors = 0;

    for (const file of files) {
        try {
            if (!file.endsWith('.jpg') && !file.endsWith('.jpeg') && !file.endsWith('.png')) {
                console.log(`⏭️  Saltando ${file} (no es imagen)`);
                skipped++;
                continue;
            }

            const filePath = path.join(heroBannerDir, file);
            const fileBuffer = fs.readFileSync(filePath);
            const s3Key = `hero-banners/${file}`;

            console.log(`📤 Subiendo ${file} como ${s3Key}...`);

            await uploadFile(s3Key, fileBuffer, 'image/jpeg');

            console.log(`✅ ${file} subido exitosamente`);
            uploaded++;

        } catch (error) {
            console.error(`❌ Error subiendo ${file}:`, error);
            errors++;
        }
    }

    console.log('\n📊 Resumen de migración:');
    console.log(`✅ Subidos: ${uploaded}`);
    console.log(`⏭️  Saltados: ${skipped}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📁 Total: ${files.length}`);

    if (uploaded > 0) {
        console.log('\n🌍 URLs de CloudFront:');
        const cloudFrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;

        files.forEach(file => {
            if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
                console.log(`${cloudFrontUrl}/hero-banners/${file}`);
            }
        });
    }

    console.log('\n🎉 Migración completada!');
}

uploadHeroBanners().catch(console.error);