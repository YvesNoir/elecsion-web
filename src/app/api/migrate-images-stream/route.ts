// src/app/api/migrate-images-stream/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import fs from "fs/promises";
import path from "path";
import { uploadFile, checkObjectExists } from "@/lib/aws-s3";

interface MigrationProgress {
    total: number;
    processed: number;
    success: number;
    errors: number;
    skipped: number;
    current?: string;
    completed: boolean;
    currentFile?: {
        name: string;
        status: 'processing' | 'success' | 'error' | 'skipped';
        url?: string;
        error?: string;
    };
}

export async function GET() {
    try {
        const session = await getSession();

        // Solo permitir a administradores
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Solo administradores pueden ejecutar la migración" },
                { status: 401 }
            );
        }

        // Configurar headers para SSE
        const responseHeaders = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
        };

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (data: MigrationProgress) => {
                    const eventData = `data: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(encoder.encode(eventData));
                };

                try {
                    const imagesDir = path.join(process.cwd(), "public", "product-images");

                    // Verificar si existe el directorio
                    try {
                        await fs.access(imagesDir);
                    } catch {
                        sendEvent({
                            total: 0,
                            processed: 0,
                            success: 0,
                            errors: 1,
                            completed: true,
                            currentFile: {
                                name: 'Error',
                                status: 'error',
                                error: 'No se encontró la carpeta /public/product-images/'
                            }
                        });
                        controller.close();
                        return;
                    }

                    // Leer archivos
                    const files = await fs.readdir(imagesDir);
                    const imageFiles = files.filter(file =>
                        /\.(png|jpg|jpeg)$/i.test(file) &&
                        file !== 'placeholder.png'
                    );

                    if (imageFiles.length === 0) {
                        sendEvent({
                            total: 0,
                            processed: 0,
                            success: 0,
                            errors: 0,
                            completed: true
                        });
                        controller.close();
                        return;
                    }

                    const result: MigrationProgress = {
                        total: imageFiles.length,
                        processed: 0,
                        success: 0,
                        errors: 0,
                        skipped: 0,
                        completed: false
                    };

                    // Enviar estado inicial
                    sendEvent(result);

                    // Procesar archivos uno por uno
                    for (const fileName of imageFiles) {
                        result.processed++;
                        result.current = fileName;
                        result.currentFile = {
                            name: fileName,
                            status: 'processing'
                        };

                        // Enviar estado de procesamiento
                        sendEvent(result);

                        try {
                            const ext = path.extname(fileName).toLowerCase();
                            const key = `products/${fileName.toLowerCase()}`;

                            // ✅ VERIFICAR SI EL ARCHIVO YA EXISTE EN S3
                            const exists = await checkObjectExists(key);

                            if (exists) {
                                // Archivo ya existe, lo omitimos
                                result.skipped++;
                                result.currentFile = {
                                    name: fileName,
                                    status: 'skipped'
                                };

                                // Enviar resultado omitido
                                sendEvent(result);
                            } else {
                                // Archivo no existe, lo subimos
                                const filePath = path.join(imagesDir, fileName);
                                const fileBuffer = await fs.readFile(filePath);

                                const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
                                const s3Url = await uploadFile(key, fileBuffer, contentType);

                                result.success++;
                                result.currentFile = {
                                    name: fileName,
                                    status: 'success',
                                    url: s3Url
                                };

                                // Enviar resultado exitoso
                                sendEvent(result);
                            }

                        } catch (error) {
                            result.errors++;
                            result.currentFile = {
                                name: fileName,
                                status: 'error',
                                error: error instanceof Error ? error.message : 'Error desconocido'
                            };

                            // Enviar resultado de error
                            sendEvent(result);
                        }

                        // Pequeña pausa para que el usuario pueda ver el progreso
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    result.completed = true;
                    result.current = undefined;
                    result.currentFile = undefined;

                    // Enviar estado final
                    sendEvent(result);

                } catch (error) {
                    console.error("Error en migración:", error);
                    sendEvent({
                        total: 0,
                        processed: 0,
                        success: 0,
                        errors: 1,
                        completed: true,
                        currentFile: {
                            name: 'Error',
                            status: 'error',
                            error: 'Error interno del servidor'
                        }
                    });
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, { headers: responseHeaders });

    } catch (error) {
        console.error("Error en endpoint SSE:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}