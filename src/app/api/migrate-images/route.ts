// src/app/api/migrate-images/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import fs from "fs/promises";
import path from "path";
import { uploadFile } from "@/lib/aws-s3";

interface MigrationProgress {
    total: number;
    processed: number;
    success: number;
    errors: number;
    current?: string;
    completed: boolean;
}

export async function POST() {
    try {
        const session = await getSession();

        // Solo permitir a administradores
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Solo administradores pueden ejecutar la migración" },
                { status: 401 }
            );
        }

        const imagesDir = path.join(process.cwd(), "public", "product-images");

        try {
            await fs.access(imagesDir);
        } catch {
            return NextResponse.json({
                error: "No se encontró la carpeta /public/product-images/"
            }, { status: 404 });
        }

        // Leer archivos
        const files = await fs.readdir(imagesDir);
        const imageFiles = files.filter(file =>
            /\.(png|jpg|jpeg)$/i.test(file) &&
            file !== 'placeholder.png'
        );

        if (imageFiles.length === 0) {
            return NextResponse.json({
                message: "No hay imágenes para migrar",
                total: 0,
                processed: 0,
                success: 0,
                errors: 0,
                completed: true
            });
        }

        const result = {
            total: imageFiles.length,
            processed: 0,
            success: 0,
            errors: 0,
            completed: false,
            files: [] as Array<{ name: string; status: 'success' | 'error'; url?: string; error?: string }>
        };

        // Procesar archivos
        for (const fileName of imageFiles) {
            result.processed++;

            try {
                const filePath = path.join(imagesDir, fileName);
                const fileBuffer = await fs.readFile(filePath);

                const ext = path.extname(fileName).toLowerCase();
                const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
                const key = `products/${fileName.toLowerCase()}`;

                const s3Url = await uploadFile(key, fileBuffer, contentType);

                result.success++;
                result.files.push({
                    name: fileName,
                    status: 'success',
                    url: s3Url
                });

            } catch (error) {
                result.errors++;
                result.files.push({
                    name: fileName,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        }

        result.completed = true;

        return NextResponse.json({
            message: "Migración completada",
            ...result
        });

    } catch (error) {
        console.error("Error en migración:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}