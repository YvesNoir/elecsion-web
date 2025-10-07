"use client";

import React, { useState, useRef } from "react";

interface MigrationProgress {
    total: number;
    processed: number;
    success: number;
    errors: number;
    skipped: number;
    completed: boolean;
    current?: string;
    currentFile?: {
        name: string;
        status: 'processing' | 'success' | 'error' | 'skipped';
        url?: string;
        error?: string;
    };
}

interface MigrationResult extends MigrationProgress {
    files: Array<{
        name: string;
        status: 'success' | 'error' | 'skipped';
        url?: string;
        error?: string;
    }>;
}

export default function ImageMigration() {
    const [migrating, setMigrating] = useState(false);
    const [progress, setProgress] = useState<MigrationProgress | null>(null);
    const [result, setResult] = useState<MigrationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const startMigration = async () => {
        try {
            setMigrating(true);
            setError(null);
            setResult(null);
            setProgress(null);

            // Cerrar conexión anterior si existe
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            // Crear conexión SSE
            const eventSource = new EventSource('/api/migrate-images-stream');
            eventSourceRef.current = eventSource;

            const allFiles: Array<{name: string; status: 'success' | 'error' | 'skipped'; url?: string; error?: string}> = [];

            eventSource.onmessage = (event) => {
                try {
                    const data: MigrationProgress = JSON.parse(event.data);

                    // Actualizar progreso
                    setProgress(data);

                    // Si hay un archivo actual, agregarlo a la lista
                    if (data.currentFile && data.currentFile.status !== 'processing') {
                        allFiles.push({
                            name: data.currentFile.name,
                            status: data.currentFile.status as 'success' | 'error' | 'skipped',
                            url: data.currentFile.url,
                            error: data.currentFile.error
                        });
                    }

                    // Si se completó, establecer resultado final
                    if (data.completed) {
                        setResult({
                            ...data,
                            files: allFiles
                        });
                        setMigrating(false);
                        eventSource.close();
                        eventSourceRef.current = null;
                    }
                } catch (err) {
                    console.error('Error parsing SSE data:', err);
                }
            };

            eventSource.onerror = (err) => {
                console.error('SSE Error:', err);
                setError('Error de conexión durante la migración');
                setMigrating(false);
                eventSource.close();
                eventSourceRef.current = null;
            };

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setMigrating(false);
        }
    };

    // Cleanup function
    React.useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    return (
        <div className="bg-white border border-[#E5E5E5] p-6">
            <h2 className="text-lg font-medium text-[#1C1C1C] mb-4">
                Migración Masiva de Imágenes
            </h2>

            <div className="mb-6">
                <p className="text-sm text-[#646464] mb-4">
                    Esta herramienta migra todas las imágenes existentes desde <code>/public/product-images/</code> hacia AWS S3.
                </p>

                <button
                    onClick={startMigration}
                    disabled={migrating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded bg-[#384A93] text-white hover:bg-[#2e3d7a] disabled:bg-[#B5B5B5] disabled:cursor-not-allowed transition-colors"
                >
                    {migrating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Migrando...
                        </>
                    ) : (
                        'Iniciar Migración Masiva'
                    )}
                </button>
            </div>

            {/* Progreso en tiempo real */}
            {progress && !progress.completed && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-blue-800">
                            Migración en Progreso
                        </h3>
                        <span className="text-xs text-blue-600">
                            {progress.processed}/{progress.total}
                        </span>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full bg-blue-100 rounded-full h-2 mb-3">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(progress.processed / progress.total) * 100}%` }}
                        ></div>
                    </div>

                    {/* Archivo actual */}
                    {progress.currentFile && (
                        <div className="flex items-center space-x-2 text-sm">
                            {progress.currentFile.status === 'processing' && (
                                <>
                                    <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-blue-700">Procesando: {progress.currentFile.name}</span>
                                </>
                            )}
                            {progress.currentFile.status === 'success' && (
                                <>
                                    <span className="text-green-600">✅</span>
                                    <span className="text-green-700">Completado: {progress.currentFile.name}</span>
                                </>
                            )}
                            {progress.currentFile.status === 'error' && (
                                <>
                                    <span className="text-red-600">❌</span>
                                    <span className="text-red-700">Error: {progress.currentFile.name}</span>
                                </>
                            )}
                            {progress.currentFile.status === 'skipped' && (
                                <>
                                    <span className="text-yellow-600">⏭️</span>
                                    <span className="text-yellow-700">Omitido: {progress.currentFile.name}</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Estadísticas en tiempo real */}
                    <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                        <div className="text-center">
                            <div className="font-semibold text-green-600">{progress.success}</div>
                            <div className="text-green-600">Nuevas</div>
                        </div>
                        <div className="text-center">
                            <div className="font-semibold text-yellow-600">{progress.skipped}</div>
                            <div className="text-yellow-600">Omitidas</div>
                        </div>
                        <div className="text-center">
                            <div className="font-semibold text-red-600">{progress.errors}</div>
                            <div className="text-red-600">Errores</div>
                        </div>
                        <div className="text-center">
                            <div className="font-semibold text-blue-600">{Math.round((progress.processed / progress.total) * 100)}%</div>
                            <div className="text-blue-600">Progreso</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                    ❌ {error}
                </div>
            )}

            {/* Resultado */}
            {result && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-3 bg-blue-50">
                            <div className="text-lg font-bold text-blue-600">{result.total}</div>
                            <div className="text-xs text-blue-600">Total</div>
                        </div>
                        <div className="text-center p-3 bg-green-50">
                            <div className="text-lg font-bold text-green-600">{result.success}</div>
                            <div className="text-xs text-green-600">Nuevas</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50">
                            <div className="text-lg font-bold text-yellow-600">{result.skipped}</div>
                            <div className="text-xs text-yellow-600">Omitidas</div>
                        </div>
                        <div className="text-center p-3 bg-red-50">
                            <div className="text-lg font-bold text-red-600">{result.errors}</div>
                            <div className="text-xs text-red-600">Errores</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50">
                            <div className="text-lg font-bold text-gray-600">{result.processed}</div>
                            <div className="text-xs text-gray-600">Procesadas</div>
                        </div>
                    </div>

                    {/* Lista de archivos */}
                    {result.files.length > 0 && (
                        <div className="max-h-96 overflow-y-auto border border-[#E5E5E5]">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-[#646464] uppercase">
                                            Archivo
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-[#646464] uppercase">
                                            Estado
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-[#646464] uppercase">
                                            Detalle
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E5E5]">
                                    {result.files.map((file, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 text-sm font-medium text-[#1C1C1C]">
                                                {file.name}
                                            </td>
                                            <td className="px-4 py-2">
                                                {file.status === 'success' ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        ✅ Nuevo
                                                    </span>
                                                ) : file.status === 'skipped' ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        ⏭️ Omitido
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        ❌ Error
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-[#646464]">
                                                {file.status === 'success' ? (
                                                    <a
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[#384A93] hover:underline"
                                                    >
                                                        Ver imagen
                                                    </a>
                                                ) : file.status === 'skipped' ? (
                                                    <span className="text-yellow-600">Ya existe en S3</span>
                                                ) : (
                                                    file.error
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}