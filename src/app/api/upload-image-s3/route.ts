// src/app/api/upload-image-s3/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { generatePresignedUploadUrl, generateProductImageKey } from "@/lib/aws-s3";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        // Verificar autenticación y permisos
        if (!session?.user || !["ADMIN", "SELLER"].includes(session.user.role)) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const { sku, contentType } = await request.json();

        // Validar datos requeridos
        if (!sku || !contentType) {
            return NextResponse.json(
                { error: "SKU y tipo de contenido son requeridos" },
                { status: 400 }
            );
        }

        // Validar tipo de archivo
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(contentType)) {
            return NextResponse.json(
                { error: "Solo se permiten archivos PNG y JPG" },
                { status: 400 }
            );
        }

        // Generar extensión basada en content type
        const extension = contentType === 'image/png' ? 'png' : 'jpg';

        // Generar key para S3
        const key = generateProductImageKey(sku, extension);

        // Generar URL pre-firmada
        const uploadUrl = await generatePresignedUploadUrl(key, contentType);

        return NextResponse.json({
            success: true,
            uploadUrl,
            key,
            message: "URL de upload generada exitosamente"
        });

    } catch (error) {
        console.error("Error generando URL de upload:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}