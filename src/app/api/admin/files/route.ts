import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
    generateAdminFileKey,
    generatePresignedUploadUrl,
    getObjectMetadata,
    getPublicUrl,
} from "@/lib/aws-s3";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const allowedExtensions = new Set([
    "csv", "doc", "docx", "jpg", "jpeg", "pdf", "png", "webp", "xls", "xlsx", "zip",
]);

function isAdmin(session: Awaited<ReturnType<typeof getSession>>) {
    return session?.user?.role === "ADMIN";
}

function isAllowedFile(fileName: string) {
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    // El MIME informado por el navegador puede ser genérico; la extensión
    // sigue siendo el control principal para no aceptar ejecutables.
    return allowedExtensions.has(extension);
}

export async function GET() {
    const session = await getSession();
    if (!isAdmin(session)) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const files = await prisma.storedFile.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            originalName: true,
            url: true,
            contentType: true,
            sizeBytes: true,
            createdAt: true,
            uploadedBy: { select: { name: true, email: true } },
        },
    });

    return NextResponse.json({
        files: files.map((file) => ({ ...file, createdAt: file.createdAt.toISOString() })),
    });
}

export async function POST(request: NextRequest) {
    const session = await getSession();
    const uploadedById = session?.user?.id;
    if (!isAdmin(session) || !uploadedById) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await request.json();

        if (body.action === "prepare") {
            const fileName = String(body.fileName || "").trim();
            const contentType = String(body.contentType || "application/octet-stream");
            const sizeBytes = Number(body.sizeBytes || 0);

            if (!fileName || !isAllowedFile(fileName)) {
                return NextResponse.json(
                    { error: "Tipo de archivo no permitido. Usá PDF, Word, Excel, CSV, imágenes o ZIP." },
                    { status: 400 },
                );
            }
            if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: "El archivo debe pesar entre 1 byte y 50 MB." },
                    { status: 400 },
                );
            }

            const key = generateAdminFileKey(fileName);
            const uploadUrl = await generatePresignedUploadUrl(key, contentType);

            return NextResponse.json({
                uploadUrl,
                key,
                url: getPublicUrl(key),
            });
        }

        if (body.action === "complete") {
            const key = String(body.key || "");
            const originalName = String(body.fileName || "").trim();

            if (!key.startsWith("admin-files/") || !originalName) {
                return NextResponse.json({ error: "Datos de archivo inválidos" }, { status: 400 });
            }

            const metadata = await getObjectMetadata(key);
            if (metadata.sizeBytes <= 0 || metadata.sizeBytes > MAX_FILE_SIZE) {
                return NextResponse.json({ error: "El archivo no cumple con el límite de tamaño" }, { status: 400 });
            }

            const file = await prisma.storedFile.create({
                data: {
                    originalName,
                    key,
                    url: getPublicUrl(key),
                    contentType: metadata.contentType,
                    sizeBytes: metadata.sizeBytes,
                    uploadedById,
                },
                select: {
                    id: true,
                    originalName: true,
                    url: true,
                    contentType: true,
                    sizeBytes: true,
                    createdAt: true,
                    uploadedBy: { select: { name: true, email: true } },
                },
            });

            return NextResponse.json({
                file: { ...file, createdAt: file.createdAt.toISOString() },
            }, { status: 201 });
        }

        return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    } catch (error) {
        console.error("Error gestionando archivo administrativo:", error);
        return NextResponse.json({ error: "No se pudo procesar el archivo" }, { status: 500 });
    }
}
