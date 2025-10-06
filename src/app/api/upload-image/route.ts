import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { getSession } from '@/lib/session';
import { sanitizeSkuForFilename } from '@/lib/utils/image';

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticación y permisos
        const session = await getSession();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ error: 'No se encontró archivo' }, { status: 400 });
        }

        // Validar tipo de archivo
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo de archivo no válido. Solo PNG y JPG' }, { status: 400 });
        }

        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'Archivo muy grande. Máximo 5MB' }, { status: 400 });
        }

        // Obtener nombre y extensión
        const originalName = file.name;
        const extension = originalName.split('.').pop()?.toLowerCase();
        const nameWithoutExtension = originalName.replace(/\.(png|jpg|jpeg)$/i, '');

        // Sanitizar el nombre para usarlo como SKU
        const sanitizedName = sanitizeSkuForFilename(nameWithoutExtension);

        if (!sanitizedName) {
            return NextResponse.json({ error: 'Nombre de archivo no válido para SKU' }, { status: 400 });
        }

        // Convertir archivo a buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Construir ruta del archivo
        const fileName = `${sanitizedName}.${extension}`;
        const filePath = join(process.cwd(), 'public', 'product-images', fileName);

        // Escribir archivo
        await writeFile(filePath, buffer);

        return NextResponse.json({
            success: true,
            fileName,
            originalName,
            sanitizedName,
            message: `Imagen ${fileName} subida correctamente`
        });

    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}