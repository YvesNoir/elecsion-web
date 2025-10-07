// src/lib/aws-s3.ts
import { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Función para obtener cliente S3 configurado
function getS3Client() {
    return new S3Client({
        region: process.env.AWS_REGION || 'us-east-2',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    });
}

function getBucketName() {
    return process.env.AWS_S3_BUCKET || 'elecsion-product-images';
}

function getCloudFrontUrl() {
    return process.env.AWS_CLOUDFRONT_URL;
}

/**
 * Genera una URL pre-firmada para upload directo desde el cliente
 */
export async function generatePresignedUploadUrl(key: string, contentType: string): Promise<string> {
    const s3Client = getS3Client();
    const command = new PutObjectCommand({
        Bucket: getBucketName(),
        Key: key,
        ContentType: contentType,
        // ACL: 'public-read', // Opcional: hacer público automáticamente
    });

    // URL válida por 5 minutos
    return await getSignedUrl(s3Client, command, { expiresIn: 300 });
}

/**
 * Verifica si un objeto existe en S3
 */
export async function checkObjectExists(key: string): Promise<boolean> {
    try {
        const s3Client = getS3Client();
        const command = new HeadObjectCommand({
            Bucket: getBucketName(),
            Key: key,
        });
        await s3Client.send(command);
        return true;
    } catch (error: any) {
        // Si el error es 404 (NotFound), el objeto no existe
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        // Para otros errores, los registramos pero asumimos que no existe
        console.warn(`Error checking object existence for ${key}:`, error.message);
        return false;
    }
}

/**
 * Lista objetos en S3 por prefijo
 */
export async function listObjects(prefix?: string): Promise<string[]> {
    try {
        const s3Client = getS3Client();
        const command = new ListObjectsV2Command({
            Bucket: getBucketName(),
            Prefix: prefix,
        });

        const response = await s3Client.send(command);
        return response.Contents?.map(obj => obj.Key!) || [];
    } catch (error) {
        console.error('Error listing S3 objects:', error);
        return [];
    }
}

/**
 * Obtiene la URL pública de un objeto
 */
export function getPublicUrl(key: string): string {
    const cloudFrontUrl = getCloudFrontUrl();
    const bucketName = getBucketName();
    const region = process.env.AWS_REGION || 'us-east-2';

    if (cloudFrontUrl) {
        // Usar CloudFront si está configurado (más rápido)
        return `${cloudFrontUrl}/${key}`;
    } else {
        // Fallback a URL directa de S3
        return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    }
}

/**
 * Sube un archivo directamente desde el servidor (para migraciones)
 */
export async function uploadFile(key: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    const s3Client = getS3Client();
    const command = new PutObjectCommand({
        Bucket: getBucketName(),
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        // ACL: 'public-read',
    });

    await s3Client.send(command);
    return getPublicUrl(key);
}

/**
 * Genera key para imagen de producto basado en SKU
 */
export function generateProductImageKey(sku: string, extension: string): string {
    const cleanSku = sku.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `products/${cleanSku}.${extension}`;
}

// Export the getter function instead of the client instance
export { getS3Client };