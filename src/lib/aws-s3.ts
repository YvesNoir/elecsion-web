// src/lib/aws-s3.ts
import { DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

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
    return process.env.AWS_CLOUDFRONT_URL || process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
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
    } catch (error: unknown) {
        const details = error as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
        // Si el error es 404 (NotFound), el objeto no existe
        if (details.name === 'NotFound' || details.$metadata?.httpStatusCode === 404) {
            return false;
        }
        // Para otros errores, los registramos pero asumimos que no existe
        console.warn(`Error checking object existence for ${key}:`, details.message);
        return false;
    }
}

/** Obtiene metadatos del objeto luego de una carga directa a S3. */
export async function getObjectMetadata(key: string) {
    const s3Client = getS3Client();
    const response = await s3Client.send(new HeadObjectCommand({
        Bucket: getBucketName(),
        Key: key,
    }));

    return {
        sizeBytes: Number(response.ContentLength || 0),
        contentType: response.ContentType || "application/octet-stream",
    };
}

/** Elimina un archivo administrativo del almacenamiento. */
export async function deleteObject(key: string): Promise<void> {
    const s3Client = getS3Client();
    await s3Client.send(new DeleteObjectCommand({
        Bucket: getBucketName(),
        Key: key,
    }));
}

/**
 * Lista objetos en S3 por prefijo (con paginación para obtener TODOS los objetos)
 */
export async function listObjects(prefix?: string): Promise<string[]> {
    try {
        const s3Client = getS3Client();
        const allObjects: string[] = [];
        let continuationToken: string | undefined;
        let pageCount = 0;

        do {
            pageCount++;
            const command = new ListObjectsV2Command({
                Bucket: getBucketName(),
                Prefix: prefix,
                ContinuationToken: continuationToken,
                MaxKeys: 1000 // Máximo por página
            });

            const response = await s3Client.send(command);

            // Agregar objetos de esta página
            if (response.Contents) {
                const keys = response.Contents.map(obj => obj.Key!);
                allObjects.push(...keys);
            }

            // Preparar para la siguiente página
            continuationToken = response.NextContinuationToken;

        } while (continuationToken);

        console.log(`📦 listObjects: Found ${allObjects.length} total objects with prefix "${prefix}" in ${pageCount} page(s)`);
        return allObjects;
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
 * Usa la misma lógica que sanitizeSkuForFilename para mantener consistencia
 */
export function generateProductImageKey(sku: string, extension: string): string {
    const cleanSku = sku
        .trim()
        .toLowerCase()
        .replace(/\//g, '')
        .replace(/[\\:*?"<>|\s]/g, '')
        .replace(/[^a-z0-9-]/g, '');
    return `products/${cleanSku}.${extension}`;
}

/** Genera una key única y legible para un archivo administrativo. */
export function generateAdminFileKey(fileName: string): string {
    const extension = fileName.includes(".")
        ? fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin"
        : "bin";
    const baseName = fileName
        .replace(/\.[^/.]+$/, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "archivo";

    return `admin-files/${baseName}-${randomUUID()}.${extension}`;
}

// Export the getter function instead of the client instance
export { getS3Client };
